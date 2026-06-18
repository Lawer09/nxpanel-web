import { Tag } from 'antd';
import React from 'react';
import { formatBytes as formatBytesBase } from '@/utils/firebase-analytics';
import { formatUTC8 } from '@/utils/format';

export type RuntimeMetricKey =
  | 'cpu'
  | 'active_connections'
  | 'active_users'
  | 'inbound_speed'
  | 'outbound_speed'
  | 'mem_used';

export const runtimeMetricOptions: Array<{
  label: string;
  value: RuntimeMetricKey;
}> = [
  { label: 'CPU', value: 'cpu' },
  { label: 'Active Connections', value: 'active_connections' },
  { label: 'Active Users', value: 'active_users' },
  { label: 'Inbound Speed', value: 'inbound_speed' },
  { label: 'Outbound Speed', value: 'outbound_speed' },
  { label: 'Mem Used', value: 'mem_used' },
];

export const formatBytes = (value?: number | null) => {
  if (value === undefined || value === null) return '-';
  return formatBytesBase(value);
};

export const formatSpeed = (value?: number | null) => {
  if (value === undefined || value === null) return '-';
  return `${formatBytesBase(value)}/s`;
};

export const formatDateTime = (value?: string | null) => formatUTC8(value);

export const formatDurationSeconds = (value?: number | null) => {
  if (value === undefined || value === null) return '-';
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${value % 60}s`;
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const parseGoDurationToMs = (value?: string | null) => {
  if (!value) return 0;
  const matches = Array.from(value.matchAll(/(\d+)(ms|s|m|h)/g));
  if (!matches.length) return 0;
  return matches.reduce((total, [, amountText, unit]) => {
    const amount = Number(amountText);
    if (unit === 'ms') return total + amount;
    if (unit === 's') return total + amount * 1000;
    if (unit === 'm') return total + amount * 60 * 1000;
    if (unit === 'h') return total + amount * 60 * 60 * 1000;
    return total;
  }, 0);
};

const asObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const summarizeStartup = (value?: unknown) => {
  const item = asObject(value);
  if (!item) return 'Not reported';
  const state = item.state ? String(item.state) : 'unknown';
  const stage = item.stage ? String(item.stage) : '';
  const error = item.last_error ? String(item.last_error) : '';
  return [state, stage, error].filter(Boolean).join(' / ');
};

export const summarizeTls = (value?: unknown) => {
  const item = asObject(value);
  if (!item) return 'Not reported';
  const state = item.state ? String(item.state) : item.mode ? String(item.mode) : 'unknown';
  const domain = item.domain ? String(item.domain) : '';
  const error = item.last_error ? String(item.last_error) : '';
  return [state, domain, error].filter(Boolean).join(' / ');
};

export const renderFreshTag = (
  fresh?: boolean,
  source?: string,
  staleSeconds?: number,
): React.ReactNode => {
  if (fresh === undefined) return <Tag>Unknown</Tag>;
  if (fresh) {
    return <Tag color="success">{source === 'postgres' ? 'Warm' : 'Fresh'}</Tag>;
  }
  return <Tag color="warning">{`Stale${staleSeconds ? ` ${formatDurationSeconds(staleSeconds)}` : ''}`}</Tag>;
};

export const renderHealthyTag = (healthy?: boolean, fallback = 'Unknown') => {
  if (healthy === undefined) return <Tag>{fallback}</Tag>;
  return <Tag color={healthy ? 'success' : 'error'}>{healthy ? 'Healthy' : 'Unhealthy'}</Tag>;
};

export const extractHealthy = (value?: unknown) => {
  const item = asObject(value);
  return typeof item?.healthy === 'boolean' ? item.healthy : undefined;
};

export const getMetricDisplayValue = (
  point: API.ControlRuntimeSamplePoint,
  metric: RuntimeMetricKey,
) => {
  if (metric === 'cpu') return point.cpu ?? 0;
  if (metric === 'active_connections') return point.active_connections ?? 0;
  if (metric === 'active_users') return point.active_users ?? 0;
  if (metric === 'inbound_speed') return point.inbound_speed ?? 0;
  if (metric === 'outbound_speed') return point.outbound_speed ?? 0;
  if (metric === 'mem_used') return point.mem_used ?? 0;
  return 0;
};

export const formatMetricValue = (value: number, metric: RuntimeMetricKey) => {
  if (metric === 'cpu') return `${value.toFixed(2)}%`;
  if (metric === 'inbound_speed' || metric === 'outbound_speed') return formatSpeed(value);
  if (metric === 'mem_used') return formatBytes(value);
  return String(value);
};

export const buildMetricChartData = (
  series: API.ControlRuntimeSampleSeries[],
  metric: RuntimeMetricKey,
) =>
  series.flatMap((item) =>
    (item.points ?? []).map((point) => ({
      time: formatDateTime(point.reported_at),
      value: getMetricDisplayValue(point, metric),
      series: `${item.agent_id} / ${item.node_id}`,
      reported_at: point.reported_at,
    })),
  );

export const fillTrafficChartData = (data?: API.ControlTrafficSeriesResponse | null) => {
  if (!data?.points?.length || !data.start_time || !data.end_time) {
    return [];
  }

  const stepMs = parseGoDurationToMs(data.step) || 60_000;
  const startMs = new Date(data.start_time).getTime();
  const endMs = new Date(data.end_time).getTime();
  const pointMap = new Map(
    data.points.map((item) => [new Date(item.bucket_start).getTime(), item]),
  );
  const rows: Array<{ time: string; value: number; series: string }> = [];

  for (let cursor = startMs; cursor < endMs; cursor += stepMs) {
    const point = pointMap.get(cursor);
    const time = formatDateTime(new Date(cursor).toISOString());
    rows.push({
      time,
      value: point?.upload_bytes ?? 0,
      series: 'Upload',
    });
    rows.push({
      time,
      value: point?.download_bytes ?? 0,
      series: 'Download',
    });
  }

  return rows;
};
