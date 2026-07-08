import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Input, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  batchDeleteAllowedIps,
  deleteAllowedIp,
  fetchAllowedIps,
  saveAllowedIps,
} from '@/services/user/api';

const { Text } = Typography;

const parseBatchIps = (value: string) => {
  const seen = new Set<string>();
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item)
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

const formatTimestamp = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderCompactUser = (
  label: string,
  user?: API.BlockedIpUserLite | null,
) => (
  <Space size={6} align="start">
    <Text type="secondary" style={{ width: 42, fontSize: 12, lineHeight: '22px' }}>
      {label}
    </Text>
    <div style={{ minWidth: 0 }}>
      {user?.email ? (
        <Tooltip title={user.email}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {user.email}
          </Text>
        </Tooltip>
      ) : (
        <Text type="secondary">-</Text>
      )}
    </div>
  </Space>
);

type AllowedIpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AllowedIpModal: React.FC<AllowedIpModalProps> = ({ open, onOpenChange }) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveIps, setSaveIps] = useState('');
  const [saveReason, setSaveReason] = useState('');

  const resetSaveForm = () => {
    if (saveSubmitting) return;
    setSaveOpen(false);
    setSaveIps('');
    setSaveReason('');
  };

  const handleSave = async () => {
    const ips = parseBatchIps(saveIps);
    if (!ips.length) {
      messageApi.warning('请输入至少一个 IP');
      return;
    }
    if (ips.length > 500) {
      messageApi.warning('IP 数量不能超过 500 个');
      return;
    }

    setSaveSubmitting(true);
    try {
      const res = await saveAllowedIps({
        ips,
        reason: saveReason.trim() || undefined,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '保存白名单 IP 失败');
        return;
      }
      const result = res.data;
      messageApi.success(
        `白名单 IP 已保存：提交 ${result?.requestedCount ?? ips.length} 个，生效 ${
          result?.allowedIpCount ?? 0
        } 个`,
      );
      resetSaveForm();
      actionRef.current?.reload();
    } finally {
      setSaveSubmitting(false);
    }
  };

  const handleBatchDelete = () => {
    const ids = selectedRowKeys.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      messageApi.warning('请先选择需要删除的白名单 IP 记录');
      return;
    }

    modalApi.confirm({
      title: `确认批量删除 ${ids.length} 条白名单 IP 记录？`,
      content: '删除后这些 IP 将不再命中白名单。',
      okType: 'danger',
      onOk: async () => {
        const res = await batchDeleteAllowedIps({ ids });
        if (res.code !== 0) {
          messageApi.error(res.msg || '批量删除失败');
          return;
        }
        const result = res.data;
        const missingText = result?.missingIds?.length
          ? `，未找到 ID：${result.missingIds.join(', ')}`
          : '';
        messageApi.success(
          `批量删除完成：成功 ${result?.deletedCount ?? 0}/${
            result?.requestedCount ?? ids.length
          }${missingText}`,
        );
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<API.UserAllowedIpItem>[] = [
    {
      title: '白名单 IP',
      dataIndex: 'ip',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 200 }}>
          <Text strong copyable ellipsis>
            {record.ip}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            记录 ID：{record.id}
          </Text>
        </Space>
      ),
    },
    {
      title: '操作人 ID',
      dataIndex: 'operatorUserId',
      valueType: 'digit',
      hideInTable: true,
    },
    {
      title: '关联信息',
      dataIndex: 'operator_user',
      width: 240,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          {renderCompactUser('操作人', record.operator_user)}
          {record.metadata?.source ? (
            <Space size={6}>
              <Text type="secondary" style={{ width: 42, fontSize: 12, lineHeight: '22px' }}>
                来源
              </Text>
              <Tag style={{ marginInlineEnd: 0 }}>{String(record.metadata.source)}</Tag>
            </Space>
          ) : null}
        </Space>
      ),
    },
    {
      title: '白名单信息',
      dataIndex: 'reason',
      width: 320,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={4} style={{ maxWidth: 300 }}>
          {record.reason ? (
            <Tooltip title={record.reason}>
              <Text ellipsis>{record.reason}</Text>
            </Tooltip>
          ) : (
            <Text type="secondary">无原因</Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            创建：{formatTimestamp(record.created_at)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            更新：{formatTimestamp(record.updated_at)}
          </Text>
        </Space>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => {
            modalApi.confirm({
              title: `确认删除白名单 IP ${record.ip}？`,
              content: '删除后该 IP 将不再命中白名单。',
              okType: 'danger',
              onOk: async () => {
                const res = await deleteAllowedIp({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('白名单 IP 记录已删除');
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
      title="IP 白名单"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={1080}
      destroyOnHidden
    >
      <ProTable<API.UserAllowedIpItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys: keys }) => (
          <span>已选择 {keys.length} 条白名单 IP 记录</span>
        )}
        tableAlertOptionRender={false}
        toolBarRender={() => [
          <Button key="save" type="primary" onClick={() => setSaveOpen(true)}>
            批量添加白名单 IP
          </Button>,
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
          const res = await fetchAllowedIps({
            ip: params.ip || undefined,
            operatorUserId: params.operatorUserId ? Number(params.operatorUserId) : undefined,
            current: params.current,
            pageSize: params.pageSize,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '白名单 IP 列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={{ labelWidth: 88 }}
        scroll={{ x: 920 }}
        size="small"
        bordered
      />
      <Modal
        title="批量添加白名单 IP"
        open={saveOpen}
        onOk={handleSave}
        confirmLoading={saveSubmitting}
        onCancel={resetSaveForm}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Text strong>IP 列表</Text>
            <Input.TextArea
              value={saveIps}
              rows={6}
              placeholder="请输入多个 IP，支持空白字符或逗号分隔"
              onChange={(event) => setSaveIps(event.target.value)}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              已解析 {parseBatchIps(saveIps).length} 个唯一 IP，最多 500 个
            </Text>
          </div>
          <div>
            <Text strong>加入原因</Text>
            <Input
              value={saveReason}
              placeholder="可选，例如 trusted source"
              style={{ marginTop: 4 }}
              onChange={(event) => setSaveReason(event.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </Modal>
  );
};

export default AllowedIpModal;
