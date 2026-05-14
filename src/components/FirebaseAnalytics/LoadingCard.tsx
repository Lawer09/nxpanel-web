import React from 'react';
import { Card, Skeleton } from 'antd';

export interface LoadingCardProps {
  height?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ height = 320 }) => {
  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Skeleton active paragraph={{ rows: Math.floor(height / 60) }} />
    </Card>
  );
};

export default LoadingCard;
