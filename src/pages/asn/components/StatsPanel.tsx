import React from 'react';
import { Card, Col, Row, Space, Statistic, Tag } from 'antd';

type StatsPanelProps = {
  stats?: API.AsnStats;
  loading?: boolean;
};

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, loading }) => {
  return (
    <Card loading={loading} title="ASN 统计" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Statistic title="总数" value={stats?.total || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="数据中心数" value={stats?.datacenter_count || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="高可靠(≥80)" value={stats?.high_reliability_count || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="平均可靠性" value={stats?.avg_reliability || 0} />
        </Col>
        <Col span={6}>
          <Statistic title="平均声誉" value={stats?.avg_reputation || 0} />
        </Col>
      </Row>
      <Space wrap style={{ marginTop: 12 }}>
        {(stats?.by_country || []).map((item) => (
          <Tag key={`country-${item.country}`}>
            {item.country}: {item.count}
          </Tag>
        ))}
        {(stats?.by_type || []).map((item) => (
          <Tag key={`type-${item.type}`} color="blue">
            {item.type}: {item.count}
          </Tag>
        ))}
      </Space>
    </Card>
  );
};

export default StatsPanel;
