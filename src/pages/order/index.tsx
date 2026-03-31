import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Divider, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  assignOrder,
  cancelOrder,
  fetchOrders,
  getOrderDetail,
  payOrder,
  updateOrder,
} from '@/services/swagger/order';
import { fetchPlans } from '@/services/swagger/plan';
import AssignOrderModal from './components/AssignOrderModal';
import OrderDetailDrawer from './components/OrderDetailDrawer';

const { Text } = Typography;

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待支付', color: 'orange' },
  1: { label: '开通中', color: 'processing' },
  2: { label: '已取消', color: 'default' },
  3: { label: '已完成', color: 'success' },
  4: { label: '已折抵', color: 'purple' },
};

const TYPE_MAP: Record<number, string> = {
  1: '新购',
  2: '续费',
  3: '升级',
  4: '流量重置',
};

const PERIOD_LABELS: Record<string, string> = {
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_yearly: '两年付',
  three_yearly: '三年付',
  onetime: '一次性',
  reset_traffic: '重置流量',
};

const COMMISSION_STATUS_MAP: Record<number, string> = {
  0: '待发放',
  1: '发放中',
  2: '已撤销',
  3: '已发放',
};

const fmt = (v?: number | null) =>
  v != null ? `¥${(v / 100).toFixed(2)}` : '-';

const OrderPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [plans, setPlans] = useState<API.PlanItem[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<API.OrderDetail | undefined>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [isCommission, setIsCommission] = useState(false);

  useEffect(() => {
    fetchPlans().then((res) => {
      if (res.code === 0) setPlans(res.data ?? []);
    });
  }, []);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    const res = await getOrderDetail({ id });
    setDetailLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取详情失败');
      return;
    }
    setDetail(res.data);
  };

  const handlePay = (trade_no: string) => {
    modalApi.confirm({
      title: '确认手动标记为已支付？',
      content: '仅限待支付状态的订单。操作后将立即为用户开通套餐。',
      onOk: async () => {
        const res = await payOrder({ trade_no });
        if (res.code !== 0) {
          messageApi.error(res.msg || '操作失败');
          return;
        }
        messageApi.success('订单已标记为已支付');
        actionRef.current?.reload();
      },
    });
  };

  const handleCancel = (trade_no: string) => {
    modalApi.confirm({
      title: '确认取消订单？',
      content: '仅限待支付状态的订单。',
      okType: 'danger',
      onOk: async () => {
        const res = await cancelOrder({ trade_no });
        if (res.code !== 0) {
          messageApi.error(res.msg || '取消失败');
          return;
        }
        messageApi.success('订单已取消');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<API.OrderItem>[] = [
    {
      title: '交易号',
      dataIndex: 'trade_no',
      width: 220,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => openDetail(record.id)}>
          <Text
            style={{ fontSize: 12 }}
            ellipsis
            copyable={{ text: record.trade_no }}
          >
            {record.trade_no.slice(0, 18)}…
          </Text>
        </a>
      ),
    },
    {
      title: '搜索交易号',
      dataIndex: 'trade_no_search',
      hideInTable: true,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 80,
      search: false,
    },
    {
      title: '套餐',
      dataIndex: 'plan',
      width: 110,
      search: false,
      render: (_, r) => r.plan?.name ?? r.plan_id,
    },
    {
      title: '周期',
      dataIndex: 'period',
      width: 80,
      search: false,
      render: (v) => PERIOD_LABELS[v as string] ?? v,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      search: false,
      render: (v) => TYPE_MAP[v as number] ?? v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: {
        options: Object.entries(STATUS_MAP).map(([k, v]) => ({
          label: v.label,
          value: Number(k),
        })),
        mode: 'multiple',
      },
      render: (_, r) => (
        <Tag color={STATUS_MAP[r.status]?.color ?? 'default'}>
          {STATUS_MAP[r.status]?.label ?? r.status}
        </Tag>
      ),
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      width: 90,
      search: false,
      render: (v) => fmt(v as number),
    },
    {
      title: '余额抵扣',
      dataIndex: 'balance_amount',
      width: 90,
      search: false,
      render: (v) => fmt(v as number | null),
    },
    {
      title: '佣金',
      key: 'commission',
      width: 120,
      search: false,
      render: (_, r) =>
        r.commission_balance != null ? (
          <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
            <span>{fmt(r.commission_balance)}</span>
            <Tag style={{ fontSize: 11 }}>
              {r.commission_status != null
                ? (COMMISSION_STATUS_MAP[r.commission_status] ??
                  String(r.commission_status))
                : '-'}
            </Tag>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      width: 155,
      search: false,
      render: (v) =>
        v ? dayjs.unix(v as number).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 155,
      search: false,
      render: (v) =>
        v ? dayjs.unix(v as number).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 160,
      render: (_, record) => {
        const isPending = record.status === 0;
        return (
          <Space split={<Divider type="vertical" />}>
            <a onClick={() => openDetail(record.id)}>详情</a>
            {isPending && (
              <a onClick={() => handlePay(record.trade_no)}>标记支付</a>
            )}
            {isPending && (
              <a
                style={{ color: '#ff4d4f' }}
                onClick={() => handleCancel(record.trade_no)}
              >
                取消
              </a>
            )}
            {record.commission_balance != null && record.status === 3 && (
              <a
                onClick={async () => {
                  const cur = record.commission_status ?? 0;
                  const next = cur === 3 ? 2 : 3;
                  const res = await updateOrder({
                    trade_no: record.trade_no,
                    commission_status: next,
                  });
                  if (res.code !== 0) {
                    messageApi.error(res.msg || '更新失败');
                    return;
                  }
                  messageApi.success('佣金状态已更新');
                  actionRef.current?.reload();
                }}
              >
                {record.commission_status === 3 ? '撤销佣金' : '发放佣金'}
              </a>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.OrderItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const filter: API.UserFilter[] = [];
          if (params.trade_no_search) {
            filter.push({
              id: 'trade_no',
              value: `like:${params.trade_no_search}`,
            });
          }
          if (params.status?.length) {
            filter.push({ id: 'status', value: params.status });
          }
          const res = await fetchOrders({
            current: params.current,
            pageSize: params.pageSize,
            is_commission: isCommission || undefined,
            filter: filter.length ? filter : undefined,
            sort: [{ id: 'created_at', desc: true }],
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: (res.data as any)?.data ?? [],
            success: true,
            total: (res.data as any)?.total ?? 0,
          };
        }}
        pagination={{ defaultPageSize: 15, showSizeChanger: true }}
        toolBarRender={() => [
          <Button
            key="commission"
            type={isCommission ? 'primary' : 'default'}
            onClick={() => {
              setIsCommission((v) => !v);
              actionRef.current?.reload();
            }}
          >
            {isCommission ? '全部订单' : '仅佣金订单'}
          </Button>,
          <Button
            key="assign"
            type="primary"
            onClick={() => setAssignOpen(true)}
          >
            分配订单
          </Button>,
        ]}
        scroll={{ x: 1400 }}
        size="small"
        bordered
      />

      <AssignOrderModal
        open={assignOpen}
        plans={plans}
        onOpenChange={setAssignOpen}
        onSuccess={() => {
          setAssignOpen(false);
          actionRef.current?.reload();
        }}
      />

      <OrderDetailDrawer
        open={detailOpen}
        detail={detail}
        loading={detailLoading}
        onClose={() => setDetailOpen(false)}
      />
    </PageContainer>
  );
};

export default OrderPage;
