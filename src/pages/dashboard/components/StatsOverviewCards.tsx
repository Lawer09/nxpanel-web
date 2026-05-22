import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudServerOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

const GrowthTag: React.FC<{ value?: number }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  if (value > 0)
    return (
      <Tag icon={<ArrowUpOutlined />} color="success">
        {value.toFixed(1)}%
      </Tag>
    );
  if (value < 0)
    return (
      <Tag icon={<ArrowDownOutlined />} color="error">
        {Math.abs(value).toFixed(1)}%
      </Tag>
    );
  return <Tag color="default">0%</Tag>;
};

export { GrowthTag };

interface StatsOverviewCardsProps {
  stats: API.StatOverviewData | undefined;
  todayIncomeMetrics: { income: number; revenue: number; expense: number };
  monthIncomeMetrics: { income: number; revenue: number; expense: number };
  loading: boolean;
}

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CARD_BODY_STYLE = { minHeight: 136 };

const StatsOverviewCards: React.FC<StatsOverviewCardsProps> = ({
  stats,
  todayIncomeMetrics,
  monthIncomeMetrics,
  loading,
}) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading} size="small" styles={{ body: CARD_BODY_STYLE }}>
        <Statistic
          title="在线节点"
          value={stats?.onlineNodes ?? '--'}
          prefix={<CloudServerOutlined />}
          valueStyle={{ color: '#1890ff', fontSize: 22 }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading} size="small" styles={{ body: CARD_BODY_STYLE }}>
        <Statistic
          title="在线用户"
          value={stats?.onlineUsers ?? '--'}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#52c41a', fontSize: 22 }}
        />
        {stats?.onlineDevices !== undefined && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            设备数：{stats.onlineDevices}
          </Text>
        )}
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading} size="small" styles={{ body: CARD_BODY_STYLE }}>
        <Statistic
          title="今日收益"
          value={todayIncomeMetrics.income}
          precision={2}
          suffix="$"
          valueStyle={{ color: '#1677ff', fontSize: 20 }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          流水：{formatAmount(todayIncomeMetrics.revenue)} $
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          支出：{formatAmount(todayIncomeMetrics.expense)} $
        </Text>
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading} size="small" styles={{ body: CARD_BODY_STYLE }}>
        <Statistic
          title="本月收益"
          value={monthIncomeMetrics.income}
          precision={2}
          suffix="$"
          valueStyle={{ color: '#52c41a', fontSize: 20 }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          流水：{formatAmount(monthIncomeMetrics.revenue)} $
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          支出：{formatAmount(monthIncomeMetrics.expense)} $
        </Text>
      </Card>
    </Col>
  </Row>
);

export default StatsOverviewCards;
