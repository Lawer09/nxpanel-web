import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { fetchExternalOrderReceipts } from '@/services/external-order-receipt/api';
import './index.less';

const { Paragraph, Text } = Typography;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  processed: { label: '已处理', color: 'success' },
  failed: { label: '处理失败', color: 'error' },
};

const PERIOD_LABELS: Record<string, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_yearly: '两年付',
  three_yearly: '三年付',
  onetime: '一次性',
  reset_traffic: '重置流量',
};

const ORDER_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待支付', color: 'orange' },
  1: { label: '开通中', color: 'processing' },
  2: { label: '已取消', color: 'default' },
  3: { label: '已完成', color: 'success' },
  4: { label: '已折抵', color: 'purple' },
};

const formatTime = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const formatAmount = (value?: number | null) =>
  value != null ? `$ ${(Number(value) / 100).toFixed(2)}` : '-';

const formatJson = (value?: Record<string, any> | null) => {
  if (!value) return '-';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const statusTag = (status?: string) => {
  const config = STATUS_MAP[status || ''];
  return <Tag color={config?.color ?? 'default'}>{config?.label ?? status ?? '-'}</Tag>;
};

const orderStatusTag = (status?: number | null) => {
  if (status == null) return <Text type="secondary">-</Text>;
  const config = ORDER_STATUS_MAP[status];
  return <Tag color={config?.color ?? 'default'}>{config?.label ?? status}</Tag>;
};

const ExternalOrderReceiptPage: React.FC = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<API.ExternalOrderReceiptItem>();
  const [pageRows, setPageRows] = useState<API.ExternalOrderReceiptItem[]>([]);
  const [total, setTotal] = useState(0);

  const pageStats = useMemo(() => {
    const failed = pageRows.filter((item) => item.status === 'failed').length;
    const processed = pageRows.filter((item) => item.status === 'processed').length;
    const pending = pageRows.filter((item) => item.status === 'pending').length;
    return { failed, processed, pending };
  }, [pageRows]);

  const openDetail = (record: API.ExternalOrderReceiptItem) => {
    setCurrent(record);
    setDetailOpen(true);
  };

  const columns: ProColumns<API.ExternalOrderReceiptItem>[] = [
    {
      title: '来源',
      dataIndex: 'provider',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: [{ label: 'WooCommerce', value: 'woocommerce' }],
      },
      render: (_, record) => <Tag>{record.provider}</Tag>,
    },
    {
      title: '回执状态',
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      fieldProps: {
        options: [
          { label: '待处理', value: 'pending' },
          { label: '已处理', value: 'processed' },
          { label: '处理失败', value: 'failed' },
        ],
      },
      render: (_, record) => statusTag(record.status),
    },
    {
      title: '第三方订单 ID',
      dataIndex: 'externalOrderId',
      hideInTable: true,
    },
    {
      title: '第三方订单',
      dataIndex: 'external_order_id',
      width: 160,
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => openDetail(record)}>
          <Text copyable={{ text: record.external_order_id }}>
            {record.external_order_id}
          </Text>
        </a>
      ),
    },
    {
      title: '交易流水号',
      dataIndex: 'transactionId',
      hideInTable: true,
    },
    {
      title: '交易流水',
      dataIndex: 'transaction_id',
      width: 180,
      search: false,
      ellipsis: true,
      render: (_, record) =>
        record.transaction_id ? (
          <Text copyable={{ text: record.transaction_id }}>
            {record.transaction_id}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '用户 ID',
      dataIndex: 'userId',
      valueType: 'digit',
      hideInTable: true,
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      width: 190,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.user?.email ?? record.user_id ?? '-'}</Text>
          {record.user_id ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.user_id}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '本地订单 ID',
      dataIndex: 'localOrderId',
      valueType: 'digit',
      hideInTable: true,
    },
    {
      title: '本地订单',
      dataIndex: 'local_order_id',
      width: 160,
      search: false,
      render: (_, record) =>
        record.local_order ? (
          <Space direction="vertical" size={0}>
            <Text copyable={{ text: record.local_order.trade_no }}>
              #{record.local_order.id}
            </Text>
            {orderStatusTag(record.local_order.status)}
          </Space>
        ) : (
          <Text type="secondary">未生成</Text>
        ),
    },
    {
      title: '商品映射',
      key: 'mapping',
      width: 190,
      search: false,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>Product: {record.product_id ?? '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Plan: {record.plan_id ?? '-'} /{' '}
            {record.period ? (PERIOD_LABELS[record.period] ?? record.period) : '-'}
          </Text>
        </Space>
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      width: 220,
      search: false,
      ellipsis: true,
      render: (_, record) =>
        record.error_message ? (
          <Text type="danger">{record.error_message}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      search: false,
      render: (_, record) => formatTime(record.created_at),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      search: false,
      render: (_, record) => formatTime(record.updated_at),
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 80,
      render: (_, record) => <a onClick={() => openDetail(record)}>详情</a>,
    },
  ];

  return (
    <PageContainer
      title="回执订单"
      content="查询第三方订单回执接收、转换本地订单和异常处理结果。"
    >
      <div className="externalOrderReceiptPage">
        <div className="summaryBar">
          <div className="summaryItem">
            <div className="summaryLabel">查询结果总数</div>
            <div className="summaryValue">{total}</div>
            <div className="summaryHint">按当前筛选条件统计</div>
          </div>
          <div className="summaryItem">
            <div className="summaryLabel">当前页已处理</div>
            <div className="summaryValue">{pageStats.processed}</div>
            <div className="summaryHint">已成功转换成本地订单</div>
          </div>
          <div className="summaryItem">
            <div className="summaryLabel">当前页待处理</div>
            <div className="summaryValue">{pageStats.pending}</div>
            <div className="summaryHint">已接收但尚未完成转换</div>
          </div>
          <div className="summaryItem">
            <div className="summaryLabel">当前页失败</div>
            <div className="summaryValue" style={{ color: '#dc2626' }}>
              {pageStats.failed}
            </div>
            <div className="summaryHint">需要排查映射或用户信息</div>
          </div>
        </div>

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="回执记录用于排查第三方订单是否已被后台接收，以及是否成功生成本地订单。"
        />

        <div className="tablePanel">
          <ProTable<API.ExternalOrderReceiptItem>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            request={async (params) => {
              const res = await fetchExternalOrderReceipts({
                provider: params.provider,
                status: params.status,
                externalOrderId: params.externalOrderId,
                userId: params.userId ? Number(params.userId) : undefined,
                localOrderId: params.localOrderId
                  ? Number(params.localOrderId)
                  : undefined,
                transactionId: params.transactionId,
                page: params.current,
                pageSize: params.pageSize,
              });

              if (res.code !== 0) {
                setPageRows([]);
                setTotal(0);
                return { data: [], success: false, total: 0 };
              }

              const data = (res as any)?.data?.data ?? [];
              const nextTotal = (res as any)?.data?.total ?? data.length;
              setPageRows(data);
              setTotal(nextTotal);
              return {
                data,
                success: true,
                total: nextTotal,
              };
            }}
            pagination={{ defaultPageSize: 20, showSizeChanger: true }}
            search={{ labelWidth: 110 }}
            scroll={{ x: 1500 }}
            size="small"
            bordered={false}
          />
        </div>
      </div>

      <Drawer
        title="回执订单详情"
        open={detailOpen}
        width={820}
        className="receiptDrawer"
        destroyOnHidden
        onClose={() => setDetailOpen(false)}
      >
        {current ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div className="drawerSection">
              <div className="sectionTitle">回执信息</div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="来源">
                  <Tag>{current.provider}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {statusTag(current.status)}
                </Descriptions.Item>
                <Descriptions.Item label="第三方订单 ID">
                  <Text copyable>{current.external_order_id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="交易流水">
                  {current.transaction_id ? (
                    <Text copyable>{current.transaction_id}</Text>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="用户">
                  {current.user?.email ?? current.user_id ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Telegram ID">
                  {current.user?.telegram_id ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Product ID">
                  {current.product_id ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="套餐 / 周期">
                  {current.plan_id ?? '-'} /{' '}
                  {current.period
                    ? (PERIOD_LABELS[current.period] ?? current.period)
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {formatTime(current.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {formatTime(current.updated_at)}
                </Descriptions.Item>
                <Descriptions.Item label="错误信息" span={2}>
                  {current.error_message ? (
                    <Text type="danger">{current.error_message}</Text>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="drawerSection">
              <div className="sectionTitle">本地订单</div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="订单 ID">
                  {current.local_order?.id ?? current.local_order_id ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  {orderStatusTag(current.local_order?.status)}
                </Descriptions.Item>
                <Descriptions.Item label="交易号">
                  {current.local_order?.trade_no ? (
                    <Text copyable>{current.local_order.trade_no}</Text>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="订单金额">
                  {formatAmount(current.local_order?.total_amount)}
                </Descriptions.Item>
                <Descriptions.Item label="支付时间" span={2}>
                  {formatTime(current.local_order?.paid_at)}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="drawerSection">
              <div className="sectionTitle">原始回调 Payload</div>
              <Paragraph
                copyable={{ text: formatJson(current.payload) }}
                className="payloadBlock"
              >
                {formatJson(current.payload)}
              </Paragraph>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ExternalOrderReceiptPage;
