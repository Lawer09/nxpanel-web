import { DatePicker, Form, InputNumber } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import type { SortOrder } from 'antd/es/table/interface';

const { RangePicker } = DatePicker;

export type UserReportQueryState = {
  dateRange: [string, string];
  dateRangePreset?: 'today' | 'last3Days' | 'last7Days' | 'last30Days' | 'custom';
  hourFrom?: number;
  hourTo?: number;
  userId?: number;
  appId?: string;
  appVersion?: string;
  country?: string;
  nodeId?: number;
  nodeHost?: string;
  nodeType?: string;
  probeStage?: string;
  errorCode?: string;
};

type FetchResult = {
  list: Record<string, any>[];
  total: number;
};

type ReportSorter = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

type BaseUserReportTabProps = {
  storageKey: string;
  hideSummaryRows?: boolean;
  defaultDimensions: string[];
  defaultMetrics: string[];
  dimensionOptions: Array<{ label: string; value: string }>;
  metricOptions: Array<{
    label: string;
    value: string;
    render?: (value: any) => React.ReactNode;
    formatter?: (value: number) => React.ReactNode;
  }>;
  renderExtraFilters?: (args: {
    query: UserReportQueryState;
    setQuery: React.Dispatch<React.SetStateAction<UserReportQueryState>>;
    dimensions: string[];
    visibleFilterDimensions: string[];
  }) => React.ReactNode;
  fetcher: (args: {
    query: UserReportQueryState;
    page: number;
    pageSize: number;
    dimensions: string[];
    sorter?: ReportSorter;
  }) => Promise<FetchResult>;
};

const GROUP_BY_TO_SNAKE: Record<string, string> = {
  userId: 'user_id',
  appId: 'app_id',
  appVersion: 'app_version',
  nodeId: 'node_id',
  nodeHost: 'node_host',
  nodeType: 'node_type',
  probeStage: 'probe_stage',
  errorCode: 'error_code',
};

export const toSnakeGroupBy = (dimensions: string[]) =>
  dimensions.map((item) => GROUP_BY_TO_SNAKE[item] || item);

const GROUP_BY_FROM_SNAKE = Object.entries(GROUP_BY_TO_SNAKE).reduce<Record<string, string>>((acc, [camel, snake]) => {
  acc[snake] = camel;
  return acc;
}, {});

const toCamelDimension = (value: string) => GROUP_BY_FROM_SNAKE[value] || value;

const METRIC_FROM_SNAKE: Record<string, string> = {
  report_count: 'reportCount',
  avg_delay: 'avgDelay',
  traffic_usage: 'trafficUsage',
  traffic_use_time: 'trafficUseTime',
  compute_count: 'computeCount',
  success_count: 'successCount',
  fail_count: 'failCount',
  success_rate: 'successRate',
  last_report_at_ms: 'lastReportAtMs',
};

const toCamelMetric = (value: string) => METRIC_FROM_SNAKE[value] || value;

const SORT_FIELD_TO_SNAKE: Record<string, string> = {
  userId: 'user_id',
  appId: 'app_id',
  appVersion: 'app_version',
  nodeId: 'node_id',
  nodeHost: 'node_host',
  nodeType: 'node_type',
  probeStage: 'probe_stage',
  errorCode: 'error_code',
  reportCount: 'report_count',
  avgDelay: 'avg_delay',
  trafficUsage: 'traffic_usage',
  trafficUseTime: 'traffic_use_time',
  computeCount: 'compute_count',
  successCount: 'success_count',
  failCount: 'fail_count',
  successRate: 'success_rate',
  lastReportAtMs: 'last_report_at_ms',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  reportAtMs: 'report_at_ms',
};

const toSnakeSortField = (value?: string) => {
  if (!value) return undefined;
  return SORT_FIELD_TO_SNAKE[value] || GROUP_BY_TO_SNAKE[value] || value.replace(/([A-Z])/g, '_$1').toLowerCase();
};

export const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

function debugUserReportSortLog(scope: string, payload: Record<string, any>) {
  if (process.env.NODE_ENV !== 'development') return;
  // eslint-disable-next-line no-console
  console.log(`[UserReportSort:${scope}]`, payload);
}

const DATE_PRESET_ITEMS: Array<{
  key: NonNullable<UserReportQueryState['dateRangePreset']>;
  label: string;
  getValue: () => [dayjs.Dayjs, dayjs.Dayjs];
}> = [
  { key: 'today', label: '今日', getValue: () => [dayjs(), dayjs()] },
  { key: 'last3Days', label: '近三天', getValue: () => [dayjs().subtract(2, 'day'), dayjs()] },
  { key: 'last7Days', label: '近一周', getValue: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30Days', label: '近一月', getValue: () => [dayjs().subtract(29, 'day'), dayjs()] },
];

const DATE_PRESETS = DATE_PRESET_ITEMS.map((item) => ({
  label: item.label,
  value: item.getValue(),
}));

const getDateRangeByPreset = (preset?: UserReportQueryState['dateRangePreset']) => {
  const found = DATE_PRESET_ITEMS.find((item) => item.key === preset);
  if (!found) return undefined;
  const [start, end] = found.getValue();
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')] as [string, string];
};

const getPresetByDateRange = (dateRange: [string, string]): UserReportQueryState['dateRangePreset'] => {
  const [start, end] = dateRange;
  const found = DATE_PRESET_ITEMS.find((item) => {
    const [presetStart, presetEnd] = item.getValue();
    return presetStart.format('YYYY-MM-DD') === start && presetEnd.format('YYYY-MM-DD') === end;
  });
  return found?.key || 'custom';
};

const resolveQueryDateRange = (query: UserReportQueryState) => {
  return getDateRangeByPreset(query.dateRangePreset) || query.dateRange;
};

const toNumber = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (v: any) => toNumber(v).toLocaleString();
const fmtFixed2 = (v: any) => toNumber(v).toFixed(2);
const fmtTimestamp = (v: any) => {
  const n = toNumber(v);
  if (!n) return '-';
  return dayjs(n).format('YYYY-MM-DD HH:mm:ss');
};

const TIMESTAMP_METRICS = new Set(['lastReportAtMs', 'last_report_at_ms']);
const FIXED2_METRICS = new Set(['avgDelay', 'trafficUsage', 'avg_delay', 'traffic_usage']);

const BaseUserReportTab: React.FC<BaseUserReportTabProps> = ({
  storageKey,
  hideSummaryRows,
  defaultDimensions,
  defaultMetrics,
  dimensionOptions,
  metricOptions,
  renderExtraFilters,
  fetcher,
}) => {
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <UniversalReportTable<Record<string, any>, UserReportQueryState>
      storageKey={storageKey}
      title="用户上报报表"
      hideSummaryRows={hideSummaryRows}
      rowKey={(record) =>
        [record.date, record.hour, record.userId, record.nodeId, record.appId, record.errorCode]
          .filter((item) => item !== undefined && item !== null && item !== '')
          .join('|')
      }
      defaultQuery={{
        dateRange: [today, today],
        dateRangePreset: 'today',
      }}
      defaultDimensions={defaultDimensions}
      defaultMetrics={defaultMetrics}
      normalizeDimensionValue={toCamelDimension}
      normalizeMetricValue={toCamelMetric}
      enableServerSort
      dimensionOptions={dimensionOptions.map((item) => ({
        label: item.label,
        value: item.value,
        column: {
          title: item.label,
          dataIndex: item.value,
          width: 130,
          render: (v: any) => (v === null || v === undefined || v === '' ? '-' : String(v)),
        },
      }))}
      metricOptions={metricOptions.map((item) => ({
        label: item.label,
        value: item.value,
        column: {
            title: item.label,
            dataIndex: item.value,
            width: 140,
            render: (v: any) =>
              item.render
                ? item.render(v)
                : TIMESTAMP_METRICS.has(item.value)
                  ? fmtTimestamp(v)
                  : FIXED2_METRICS.has(item.value)
                    ? fmtFixed2(v)
                    : fmtNumber(v),
        },
        formatter: item.formatter,
      }))}
      renderFilters={({ query, setQuery, dimensions, visibleFilterDimensions }) => (
        <Form layout="inline" style={{ rowGap: 4 }}>
          <Form.Item label="日期范围">
            <RangePicker
              value={(() => {
                const [start, end] = resolveQueryDateRange(query);
                return [dayjs(start), dayjs(end)] as [dayjs.Dayjs, dayjs.Dayjs];
              })()}
              presets={DATE_PRESETS}
              onChange={(dates) => {
                const [start, end] = dates ?? [];
                if (!start || !end) return;
                const nextDateRange: [string, string] = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
                setQuery((prev) => ({
                  ...prev,
                  dateRange: nextDateRange,
                  dateRangePreset: getPresetByDateRange(nextDateRange),
                }));
              }}
            />
          </Form.Item>
          {visibleFilterDimensions.includes('hour') ? (
            <Form.Item label="起始小时">
              <InputNumber
                min={0}
                max={23}
                value={query.hourFrom}
                style={{ width: 90 }}
                onChange={(value) => setQuery((prev) => ({ ...prev, hourFrom: value ?? undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('hour') ? (
            <Form.Item label="结束小时">
              <InputNumber
                min={0}
                max={23}
                value={query.hourTo}
                style={{ width: 90 }}
                onChange={(value) => setQuery((prev) => ({ ...prev, hourTo: value ?? undefined }))}
              />
            </Form.Item>
          ) : null}
          {renderExtraFilters?.({ query, setQuery, dimensions, visibleFilterDimensions })}
        </Form>
      )}
      fetchData={({ query, page, pageSize, dimensions, sorter }) => {
        const resolvedDateRange = resolveQueryDateRange(query);
        const mappedSorter = sorter
          ? {
              ...sorter,
              field: toSnakeSortField(sorter?.field),
              columnKey: toSnakeSortField(sorter?.columnKey),
              order: sorter?.order,
            }
          : undefined;

        return fetcher({
          query: {
            ...query,
            dateRange: resolvedDateRange,
          },
          page,
          pageSize,
          dimensions,
          sorter: mappedSorter,
        });
      }}
    />
  );
};

export default BaseUserReportTab;
