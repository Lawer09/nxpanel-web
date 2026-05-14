import React from 'react';
import { Card, Statistic, Typography, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface KpiCardProps {
  title: React.ReactNode;
  value: string | number;
  unit?: string;
  change?: number;
  precision?: number;
  loading?: boolean;
  color?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  change,
  precision = 0,
  loading,
  color,
  onClick,
  icon,
}) => {
  const isUp = change ? change > 0 : false;
  const absChange = change ? Math.abs(change * 100).toFixed(1) : '0.0';

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 14 }}>{title}</Text>
          {icon}
        </Space>
        <div style={{ margin: '8px 0' }}>
          <Text
            strong
            style={{
              fontSize: 28,
              color: color || '#111827',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {value}
            {unit && <span style={{ fontSize: 14, marginLeft: 4, fontWeight: 'normal' }}>{unit}</span>}
          </Text>
        </div>
        {change !== undefined && (
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>较昨日</Text>
            <Text
              style={{
                fontSize: 12,
                color: isUp ? '#ef4444' : '#16a34a',
                fontWeight: 500
              }}
            >
              {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {absChange}%
            </Text>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default KpiCard;
