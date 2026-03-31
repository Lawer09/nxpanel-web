import { Card, Col, Row, Space, Statistic, Tag } from 'antd';
import React from 'react';

type StatsPanelProps = {
  stats?: API.IpPoolStats;
  loading?: boolean;
};

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, loading }) => {
  return (
    <Card loading={loading} title="IP 池统计" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={4}>
          <Statistic title="总数" value={stats?.total || 0} />
        </Col>
        <Col span={4}>
          <Statistic title="活跃" value={stats?.active || 0} />
        </Col>
        <Col span={4}>
          <Statistic title="冷却" value={stats?.cooldown || 0} />
        </Col>
        <Col span={4}>
          <Statistic title="平均评分" value={stats?.avg_score || 0} />
        </Col>
        <Col span={4}>
          <Statistic
            title="平均成功率"
            value={stats?.avg_success_rate || 0}
            suffix="%"
          />
        </Col>
        <Col span={4}>
          <Statistic title="高风险数" value={stats?.high_risk_count || 0} />
        </Col>
      </Row>
      <Space wrap style={{ marginTop: 12 }}>
        {(stats?.by_country || []).map((item) => (
          <Tag key={item.country}>
            {item.country}: {item.count}
          </Tag>
        ))}
      </Space>
    </Card>
  );
};

export default StatsPanel;
