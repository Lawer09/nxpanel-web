import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Modal, Select, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  batchDeleteBlockedIps,
  deleteBlockedIp,
  fetchBlockedIps,
  updateBlockedIpType,
} from '@/services/user/api';

const { Text } = Typography;

const BLOCKED_IP_TYPE_OPTIONS = [
  { label: 'dangerous', value: 'dangerous' },
  { label: 'normal', value: 'normal' },
];

type BlockedIpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatTimestamp = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderBlockedIpType = (value?: string | null) => {
  if (!value) return '-';
  const color = value === 'dangerous' ? 'red' : value === 'normal' ? 'green' : 'blue';
  return <Tag color={color}>{value}</Tag>;
};

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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingRecord, setEditingRecord] = useState<API.UserBlockedIpItem | null>(null);
  const [editingType, setEditingType] = useState('');
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  const openTypeEditor = (record: API.UserBlockedIpItem) => {
    setEditingRecord(record);
    setEditingType(record.type || '');
  };

  const closeTypeEditor = () => {
    if (typeSubmitting) return;
    setEditingRecord(null);
    setEditingType('');
  };

  const handleUpdateType = async () => {
    if (!editingRecord) return;

    const nextType = editingType.trim();
    if (!nextType) {
      messageApi.warning('请输入 type');
      return;
    }

    setTypeSubmitting(true);
    try {
      const res = await updateBlockedIpType({
        id: editingRecord.id,
        type: nextType,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '更新 type 失败');
        return;
      }
      messageApi.success('type 已更新');
      setEditingRecord(null);
      setEditingType('');
      actionRef.current?.reload();
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleBatchDelete = () => {
    const ids = selectedRowKeys.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      messageApi.warning('请先选择需要删除的封禁 IP 记录');
      return;
    }

    modalApi.confirm({
      title: `确认批量删除 ${ids.length} 条封禁 IP 记录？`,
      content: '删除后这些 IP 封禁记录将不再生效。',
      okType: 'danger',
      onOk: async () => {
        const res = await batchDeleteBlockedIps({ ids });
        if (res.code !== 0) {
          messageApi.error(res.msg || '批量删除失败');
          return;
        }
        const result = res.data;
        const missingText = result?.missingIds?.length
          ? `，未找到 ID：${result.missingIds.join(', ')}`
          : '';
        messageApi.success(
          `批量删除完成：成功 ${result?.deletedCount ?? 0}/${result?.requestedCount ?? ids.length}${missingText}`,
        );
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<API.UserBlockedIpItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '封禁 IP', dataIndex: 'ip', width: 150 },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 140,
      search: false,
      render: (_, record) => renderBlockedIpType(record.type),
    },
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
      width: 150,
      render: (_, record) => [
        <a
          key="updateType"
          onClick={() => {
            openTypeEditor(record);
          }}
        >
          更新类型
        </a>,
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
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys: keys }) => (
          <span>已选择 {keys.length} 条封禁 IP 记录</span>
        )}
        tableAlertOptionRender={false}
        toolBarRender={() => [
          <Button
            key="batchDelete"
            danger
            disabled={!selectedRowKeys.length}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>,
        ]}
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
        scroll={{ x: 1380 }}
        size="small"
        bordered
      />
      <Modal
        title={editingRecord ? `更新封禁 IP 类型：${editingRecord.ip}` : '更新封禁 IP 类型'}
        open={!!editingRecord}
        onOk={handleUpdateType}
        confirmLoading={typeSubmitting}
        onCancel={closeTypeEditor}
        destroyOnHidden
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary">
            当前类型：{editingRecord ? renderBlockedIpType(editingRecord.type) : '-'}
          </Text>
          <Select
            value={editingType}
            options={BLOCKED_IP_TYPE_OPTIONS}
            placeholder="请选择 type"
            style={{ width: '100%' }}
            onChange={(value) => setEditingType(value)}
          />
        </Space>
      </Modal>
    </Modal>
  );
};

export default BlockedIpModal;
