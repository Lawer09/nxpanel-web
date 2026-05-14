import React from 'react';
import { Card, Typography } from 'antd';
import { Line } from '@ant-design/charts';
import EmptyState from './EmptyState';

const { Title } = Typography;

export interface TrendChartProps {
  title: string;
  data: any[];
  xField: string;
  yField: string;
  seriesField?: string;
  loading?: boolean;
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  xField,
  yField,
  seriesField,
  loading,
  height = 320,
}) => {
  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    legend: {
      position: 'top-right' as const,
    },
    tooltip: {
      showMarkers: true,
    },
    theme: {
      colors10: ['#2563EB', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6'],
    },
  };

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <Title level={5} style={{ fontSize: 16, marginBottom: 20 }}>{title}</Title>
      {data && data.length > 0 ? (
        <Line {...config} />
      ) : (
        <EmptyState height={height} />
      )}
    </Card>
  );
};

export default TrendChart;
