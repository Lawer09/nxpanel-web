import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef } from 'react';
import { deleteBlockedIp, fetchBlockedIps } from '@/services/user/api';

const { Text } = Typography;

type BlockedIpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatTimestamp = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderUser = (user?: API.BlockedIpUserLite | null, userId?: number | null) => {
  if (!user && !userId) return '-';
  return (
    <Space direction="vertical" size={0}>
      <Text>{user?.email || '-'}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ID: {user?.id ?? userId}
      </Text>
    </Space>
  );
};

const BlockedIpModal: React.FC<BlockedIpModalProps> = ({ open, onOpenChange }) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);

  const columns: ProColumns<API.UserBlockedIpItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '封禁 IP', dataIndex: 'ip', width: 150 },
    {
      title: '被封禁用户 ID',
      dataIndex: 'bannedUserId',
      valueType: 'digit',
      hideInTable: true,
    },
    {
      title: '操作管理员 ID',
      dataIndex: 'operatorUserId',
      valueType: 'digit',
      hideInTable: true,
    },
    {
      title: '被封禁用户',
      dataIndex: 'banned_user',
      width: 220,
      search: false,
      render: (_, record) => renderUser(record.banned_user, record.banned_user_id),
    },
    {
      title: '操作管理员',
      dataIndex: 'operator_user',
      width: 220,
      search: false,
      render: (_, record) => renderUser(record.operator_user, record.operator_user_id),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      width: 180,
      search: false,
      render: (_, record) =>
        record.reason ? (
          <Tooltip title={record.reason}>
            <Text ellipsis style={{ maxWidth: 160 }}>
              {record.reason}
            </Text>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '来源',
      dataIndex: ['metadata', 'source'],
      width: 150,
      search: false,
      render: (_, record) => {
        const source = record.metadata?.source;
        return source ? <Tag>{source}</Tag> : '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 90,
      render: (_, record) => [
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => {
            modalApi.confirm({
              title: `确认删除封禁 IP ${record.ip}？`,
              content: '删除后该 IP 封禁记录将不再生效。',
              okType: 'danger',
              onOk: async () => {
                const res = await deleteBlockedIp({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('封禁 IP 记录已删除');
                actionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <Modal
      title="封禁 IP 列表"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={1120}
      destroyOnHidden
    >
      <ProTable<API.UserBlockedIpItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchBlockedIps({
            ip: params.ip || undefined,
            bannedUserId: params.bannedUserId ? Number(params.bannedUserId) : undefined,
            operatorUserId: params.operatorUserId ? Number(params.operatorUserId) : undefined,
            current: params.current,
            pageSize: params.pageSize,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '封禁 IP 列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={{ labelWidth: 110 }}
        scroll={{ x: 1260 }}
        size="small"
        bordered
      />
    </Modal>
  );
};

export default BlockedIpModal;
