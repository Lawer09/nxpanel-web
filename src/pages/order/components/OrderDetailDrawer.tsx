import { Descriptions, Drawer, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

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

interface OrderDetailDrawerProps {
  open: boolean;
  detail?: API.OrderDetail;
  loading?: boolean;
  onClose: () => void;
}

const fmt = (v?: number | null) =>
  v != null ? `¥${(v / 100).toFixed(2)}` : '-';

const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  open,
  detail,
  loading,
  onClose,
}) => {
  return (
    <Drawer
      title="订单详情"
      open={open}
      onClose={onClose}
      width={580}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <Spin />
        </div>
      ) : detail ? (
        <>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="交易号" span={2}>
              <Text copyable style={{ fontSize: 12 }}>
                {detail.trade_no}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[detail.status]?.color ?? 'default'}>
                {STATUS_MAP[detail.status]?.label ?? detail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {TYPE_MAP[detail.type] ?? detail.type}
            </Descriptions.Item>
            <Descriptions.Item label="套餐">
              {detail.plan?.name ?? detail.plan_id}
            </Descriptions.Item>
            <Descriptions.Item label="周期">
              {PERIOD_LABELS[detail.period] ?? detail.period}
            </Descriptions.Item>
            <Descriptions.Item label="总金额">
              {fmt(detail.total_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="余额抵扣">
              {fmt(detail.balance_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="折抵金额">
              {fmt(detail.surplus_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="折扣金额">
              {fmt(detail.discount_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="手续费">
              {fmt(detail.handling_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="退款金额">
              {fmt(detail.refund_amount)}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间" span={2}>
              {detail.paid_at
                ? dayjs.unix(detail.paid_at).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="回调号" span={2}>
              {detail.callback_no ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs.unix(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>

          {detail.user && (
            <>
              <Descriptions
                title="用户信息"
                column={2}
                bordered
                size="small"
                style={{ marginTop: 16 }}
              >
                <Descriptions.Item label="邮箱" span={2}>
                  {detail.user.email}
                </Descriptions.Item>
                <Descriptions.Item label="用户ID">
                  {detail.user.id}
                </Descriptions.Item>
                <Descriptions.Item label="余额">
                  {detail.user.balance != null
                    ? `¥${Number(detail.user.balance).toFixed(2)}`
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {detail.invite_user && (
            <Descriptions
              title="邀请人"
              column={2}
              bordered
              size="small"
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="邮箱" span={2}>
                {detail.invite_user.email}
              </Descriptions.Item>
              <Descriptions.Item label="佣金金额">
                {fmt(detail.commission_balance)}
              </Descriptions.Item>
              <Descriptions.Item label="佣金状态">
                {detail.commission_status != null
                  ? (COMMISSION_STATUS_MAP[detail.commission_status] ??
                    String(detail.commission_status))
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </>
      ) : null}
    </Drawer>
  );
};

export default OrderDetailDrawer;
