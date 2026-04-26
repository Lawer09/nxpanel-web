import { ThunderboltOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export { formatBytes };

interface TrafficCardsProps {
  stats: API.StatOverviewData | undefined;
  loading: boolean;
}

const TrafficCards: React.FC<TrafficCardsProps> = ({ stats, loading }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={24} sm={8}>
      <Card title="今日流量" loading={loading} size="small">
        <Statistic
          title="上传"
          value={formatBytes(stats?.todayTraffic?.upload ?? 0)}
          prefix={<ThunderboltOutlined />}
        />
        <Statistic
          title="下载"
          value={formatBytes(stats?.todayTraffic?.download ?? 0)}
          style={{ marginTop: 8 }}
        />
        <Statistic
          title="总计"
          value={formatBytes(stats?.todayTraffic?.total ?? 0)}
          valueStyle={{ color: '#1890ff' }}
          style={{ marginTop: 8 }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card title="本月流量" loading={loading} size="small">
        <Statistic
          title="上传"
          value={formatBytes(stats?.monthTraffic?.upload ?? 0)}
          prefix={<ThunderboltOutlined />}
        />
        <Statistic
          title="下载"
          value={formatBytes(stats?.monthTraffic?.download ?? 0)}
          style={{ marginTop: 8 }}
        />
        <Statistic
          title="总计"
          value={formatBytes(stats?.monthTraffic?.total ?? 0)}
          valueStyle={{ color: '#52c41a' }}
          style={{ marginTop: 8 }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8}>
      <Card title="用户概览" loading={loading} size="small">
        <Statistic title="总用户数" value={stats?.totalUsers ?? '--'} />
        <Statistic
          title="活跃用户"
          value={stats?.activeUsers ?? '--'}
          style={{ marginTop: 8 }}
        />
        <Statistic
          title="本月新增"
          value={stats?.currentMonthNewUsers ?? '--'}
          valueStyle={{ color: '#52c41a' }}
          style={{ marginTop: 8 }}
        />
      </Card>
    </Col>
  </Row>
);

export default TrafficCards;
