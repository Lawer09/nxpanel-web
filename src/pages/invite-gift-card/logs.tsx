import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Badge, Space, Tag, Typography } from 'antd';
import React, { useRef } from 'react';
import { fetchInviteGiftCardLogs } from '@/services/invite-gift-card/api';

const { Text, Link } = Typography;

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString();
};

const TRIGGER_TYPE_MAP: Record<string, { text: string; color: string }> = {
  register: { text: '注册', color: 'blue' },
  order_paid: { text: '订单支付', color: 'green' },
};

const InviteGiftCardLogPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const { message: messageApi } = App.useApp();

  const columns: ProColumns<API.InviteGiftCardLog>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '规则名称',
      dataIndex: ['rule', 'name'],
      width: 150,
      search: false,
      render: (_, record) => record.rule?.name || '-',
    },
    {
      title: '规则ID',
      dataIndex: 'rule_id',
      width: 100,
      hideInTable: true,
    },
    {
      title: '触发类型',
      dataIndex: 'trigger_type',
      width: 120,
      valueEnum: {
        register: { text: '注册', status: 'Processing' },
        order_paid: { text: '订单支付', status: 'Success' },
      },
      render: (_, record) => {
        const config = TRIGGER_TYPE_MAP[record.trigger_type];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '触发用户',
      width: 200,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text copyable={{ text: record.trigger_user?.email }}>
            ID: {record.trigger_user_id}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.trigger_user?.email}
          </Text>
        </Space>
      ),
    },
    {
      title: '接收用户',
      width: 200,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text copyable={{ text: record.recipient_user?.email }}>
            ID: {record.recipient_user_id}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.recipient_user?.email}
          </Text>
        </Space>
      ),
    },
    {
      title: '接收用户ID',
      dataIndex: 'recipient_user_id',
      width: 120,
      hideInTable: true,
    },
    {
      title: '兑换码',
      width: 180,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text copyable code style={{ fontSize: 12 }}>
            {record.code?.code}
          </Text>
          {record.code?.status === 1 && (
            <Text type="success" style={{ fontSize: 12 }}>
              已使用 {formatTimestamp(record.code.used_at)}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '自动兑换',
      dataIndex: 'auto_redeemed',
      width: 100,
      valueEnum: {
        true: { text: '是', status: 'Success' },
        false: { text: '否', status: 'Default' },
      },
      render: (_, record) =>
        record.auto_redeemed ? (
          <Badge status="success" text="是" />
        ) : (
          <Badge status="default" text="否" />
        ),
    },
    {
      title: '关联订单',
      width: 150,
      search: false,
      render: (_, record) => {
        if (!record.order) return '-';
        return (
          <Space direction="vertical" size={0}>
            <Text copyable={{ text: record.order.trade_no }} style={{ fontSize: 12 }}>
              {record.order.trade_no}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ¥{(record.order.total_amount / 100).toFixed(2)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: '模板名称',
      width: 120,
      search: false,
      render: (_, record) => record.metadata?.template_name || '-',
    },
    {
      title: '发放时间',
      dataIndex: 'created_at',
      width: 170,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '日期范围',
      dataIndex: 'date_range',
      valueType: 'dateRange',
      hideInTable: true,
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.InviteGiftCardLog>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchInviteGiftCardLogs({
            current: params.current,
            pageSize: params.pageSize,
            rule_id: params.rule_id ? Number(params.rule_id) : undefined,
            trigger_type: params.trigger_type as API.TriggerType,
            recipient_user_id: params.recipient_user_id
              ? Number(params.recipient_user_id)
              : undefined,
            auto_redeemed:
              params.auto_redeemed === 'true'
                ? true
                : params.auto_redeemed === 'false'
                  ? false
                  : undefined,
            date_range: params.date_range as [string, string] | undefined,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取日志失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        scroll={{ x: 1600 }}
      />
    </PageContainer>
  );
};

export default InviteGiftCardLogPage;
