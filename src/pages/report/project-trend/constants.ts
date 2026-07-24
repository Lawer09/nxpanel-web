import type { CountryMetric, TrendGranularity } from './types';

export const COUNTRY_METRIC_OPTIONS: Array<{ label: string; value: CountryMetric }> = [
  { label: '广告收入', value: 'adRevenue' },
  { label: '利润', value: 'profit' },
  { label: '新增用户', value: 'newUsers' },
];

export const GRANULARITY_OPTIONS: Array<{ label: string; value: TrendGranularity }> = [
  { label: '日', value: 'day' },
  { label: '小时', value: 'hour' },
];

export const PROJECT_RETENTION_DAYS = [1, 3, 7, 14, 30];

export const DASHBOARD_THEME = {
  colors10: ['#0f766e', '#ea580c', '#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#0891b2', '#b45309'],
};

export const LINE_SERIES_COLORS: Record<string, string> = {
  广告收入: '#0f766e',
  最新广告收益: '#7c3aed',
  广告收益差值: '#dc2626',
  总成本: '#ea580c',
  利润: '#2563eb',
  新增用户: '#2563eb',
  上报新增用户: '#7c3aed',
  DAU: '#16a34a',
  广告请求数: '#2563eb',
  广告匹配请求数: '#0f766e',
  广告展示数: '#ea580c',
  广告点击数: '#dc2626',
  广告匹配率: '#0f766e',
  广告展示率: '#2563eb',
  '广告 CTR': '#dc2626',
  '广告 eCPM': '#2563eb',
  ARPU: '#ea580c',
};

export const COST_SERIES_COLORS: Record<string, string> = {
  投放成本: '#2563eb',
  流量花费: '#ea580c',
};

export const COST_SERIES_COLOR_RANGE = [COST_SERIES_COLORS.投放成本, COST_SERIES_COLORS.流量花费];
export const AD_REVENUE_COMPARE_COLOR_RANGE = [
  LINE_SERIES_COLORS.最新广告收益,
  LINE_SERIES_COLORS.广告收益差值,
];

export const CARD_STYLE: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
};

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, '0')}:00`,
  value: hour,
}));
