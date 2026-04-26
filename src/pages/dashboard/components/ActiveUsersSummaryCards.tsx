import { TeamOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';
import { GrowthTag } from './StatsOverviewCards';

interface ActiveUsersSummaryCardsProps {
  summary: API.ActiveUsersSummaryData | undefined;
  loading: boolean;
}

const ActiveUsersSummaryCards: React.FC<ActiveUsersSummaryCardsProps> = ({ summary, loading }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={24} sm={8}>
      <Card loading={loading} size="small">
        <Statistic
          title="DAU（日活）"
          value={summary?.dau?.count ?? '--'}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#1890ff' }}
        />
        <GrowthTag value={summary?.dau?.change} />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card loading={loading} size="small">
        <Statistic
          title="WAU（周活）"
          value={summary?.wau?.count ?? '--'}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
        <GrowthTag value={summary?.wau?.change} />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card loading={loading} size="small">
        <Statistic
          title="MAU（月活）"
          value={summary?.mau?.count ?? '--'}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#722ed1' }}
        />
        <GrowthTag value={summary?.mau?.change} />
      </Card>
    </Col>
  </Row>
);

export default ActiveUsersSummaryCards;
