import { Progress, Spin, Tooltip, Typography } from 'antd';
import React from 'react';
import type { FirebaseAppConnectionReportItem } from '@/services/firebase-analytics/types';

const { Text } = Typography;

type AppConnectionStatusSummaryProps = {
  loading: boolean;
  summary?: FirebaseAppConnectionReportItem | null;
};

const toNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

const formatCount = (value: unknown) => {
  const next = toNumber(value);
  if (next === null) return '--';
  return Math.round(next).toLocaleString();
};

const formatPing = (value: unknown) => {
  const next = toNumber(value);
  if (next === null) return '--';
  return `${Math.round(next).toLocaleString()} ms`;
};

const formatRate = (value: unknown) => {
  const next = toNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

const clampPercent = (value: unknown) => {
  const next = toNumber(value);
  if (next === null) return 0;
  return Math.max(0, Math.min(100, next * 100));
};

const MetricLine: React.FC<{
  label: string;
  value: React.ReactNode;
  color?: string;
}> = ({ label, value, color = 'rgba(0, 0, 0, 0.88)' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
    <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
    <span
      style={{
        color,
        fontSize: 12,
        fontWeight: 600,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  </div>
);

const AppConnectionStatusSummary: React.FC<AppConnectionStatusSummaryProps> = ({ loading, summary }) => {
  if (loading) {
    return (
      <div style={{ minHeight: 126, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  const successPercent = clampPercent(summary?.successRate);

  return (
    <div style={{ display: 'flex', minHeight: 126, flexDirection: 'column', gap: 8, fontSize: 12, lineHeight: 1.35 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ minWidth: 0 }}>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            客户端连接数
          </Text>
          <div
            style={{
              color: 'rgba(0, 0, 0, 0.88)',
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCount(summary?.clientConnectCount)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            成功率
          </Text>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              justifyContent: 'flex-end',
              gap: 5,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#0f766e', fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>
              {formatRate(summary?.successRate)}
            </span>
            <Tooltip title="取消率">
              <Text
                type="secondary"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatRate(summary?.cancelRate)}
              </Text>
            </Tooltip>
          </span>
        </div>
      </div>
      <Progress
        percent={successPercent}
        showInfo={false}
        size="small"
        strokeColor="#0f766e"
        trailColor="#e5e7eb"
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 12px' }}>
        <MetricLine label="成功次数" value={formatCount(summary?.successCount)} color="#0f766e" />
        <MetricLine label="失败次数" value={formatCount(summary?.failCount)} color="#dc2626" />
        <MetricLine label="活跃用户" value={formatCount(summary?.activeUserCount)} color="#2563eb" />
        <MetricLine label="平均 ping" value={formatPing(summary?.avgPingMs)} color="#7c3aed" />
      </div>
    </div>
  );
};

export default AppConnectionStatusSummary;
