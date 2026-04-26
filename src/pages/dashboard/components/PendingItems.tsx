import { Card, Col, Row, Statistic } from 'antd';
import React from 'react';

interface PendingItemsProps {
  stats: API.StatOverviewData | undefined;
}

const PendingItems: React.FC<PendingItemsProps> = ({ stats }) => {
  if (!stats?.ticketPendingTotal && !stats?.commissionPendingTotal) return null;

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      {stats?.ticketPendingTotal ? (
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="待处理工单"
              value={stats.ticketPendingTotal}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      ) : null}
      {stats?.commissionPendingTotal ? (
        <Col xs={24} sm={12}>
          <Card size="small" style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title="待处理佣金"
              value={stats.commissionPendingTotal}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      ) : null}
    </Row>
  );
};

export default PendingItems;
