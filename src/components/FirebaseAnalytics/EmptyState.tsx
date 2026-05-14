import React from 'react';
import { Empty, Button } from 'antd';

export interface EmptyStateProps {
  description?: string;
  onRetry?: () => void;
  height?: number | string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  description = '暂无数据',
  onRetry,
  height = 300,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, width: '100%' }}>
      <Empty
        description={
          <span>
            {description}
            {onRetry && <br />}
            {onRetry && <Button type="link" onClick={onRetry}>点击重试</Button>}
          </span>
        }
      />
    </div>
  );
};

export default EmptyState;
