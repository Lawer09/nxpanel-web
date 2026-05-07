import { DatePicker, Form, InputNumber } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';

const { RangePicker } = DatePicker;

export type UserReportQueryState = {
  dateRange: [string, string];
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
  }) => React.ReactNode;
  fetcher: (args: {
    query: UserReportQueryState;
    page: number;
    pageSize: number;
    dimensions: string[];
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

const DATE_PRESETS = [
  { label: '今日', value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三天', value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

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
      }}
      defaultDimensions={defaultDimensions}
      defaultMetrics={defaultMetrics}
      normalizeDimensionValue={toCamelDimension}
      normalizeMetricValue={toCamelMetric}
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
      renderFilters={({ query, setQuery, dimensions }) => (
        <Form layout="inline">
          <Form.Item label="日期范围">
            <RangePicker
              value={[dayjs(query.dateRange[0]), dayjs(query.dateRange[1])]}
              presets={DATE_PRESETS}
              onChange={(dates) => {
                const [start, end] = dates ?? [];
                if (!start || !end) return;
                setQuery((prev) => ({
                  ...prev,
                  dateRange: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')],
                }));
              }}
            />
          </Form.Item>
          {dimensions.includes('hour') ? (
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
          {dimensions.includes('hour') ? (
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
          {renderExtraFilters?.({ query, setQuery, dimensions })}
        </Form>
      )}
      fetchData={({ query, page, pageSize, dimensions }) => fetcher({ query, page, pageSize, dimensions })}
    />
  );
};

export default BaseUserReportTab;
