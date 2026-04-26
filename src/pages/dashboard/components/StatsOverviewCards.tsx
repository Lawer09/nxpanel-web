import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudServerOutlined,
  DollarOutlined,
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
  loading: boolean;
}

const StatsOverviewCards: React.FC<StatsOverviewCardsProps> = ({ stats, loading }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading}>
        <Statistic
          title="在线节点"
          value={stats?.onlineNodes ?? '--'}
          prefix={<CloudServerOutlined />}
          valueStyle={{ color: '#1890ff' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading}>
        <Statistic
          title="在线用户"
          value={stats?.onlineUsers ?? '--'}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
        {stats?.onlineDevices !== undefined && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            设备数：{stats.onlineDevices}
          </Text>
        )}
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading}>
        <Statistic
          title="今日收入"
          value={stats?.todayIncome !== undefined ? (stats.todayIncome / 100).toFixed(2) : '--'}
          prefix={<DollarOutlined />}
          suffix="元"
          valueStyle={{ color: '#faad14' }}
        />
        <GrowthTag value={stats?.dayIncomeGrowth} />
      </Card>
    </Col>
    <Col xs={24} sm={12} md={6}>
      <Card loading={loading}>
        <Statistic
          title="本月收入"
          value={
            stats?.currentMonthIncome !== undefined
              ? (stats.currentMonthIncome / 100).toFixed(2)
              : '--'
          }
          prefix={<DollarOutlined />}
          suffix="元"
          valueStyle={{ color: '#722ed1' }}
        />
        <GrowthTag value={stats?.monthIncomeGrowth} />
      </Card>
    </Col>
  </Row>
);

export default StatsOverviewCards;
