import { DatePicker, Form, Input, InputNumber } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import type { SortOrder } from 'antd/es/table/interface';

const { RangePicker } = DatePicker;

type ReportSorter = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

export type NodeServerQueryState = {
  dateRange: [string, string];
  hourFrom?: number;
  hourTo?: number;
  nodeId?: number;
  nodeType?: string;
  nodeHost?: string;
  nodePublicIp?: string;
  userId?: number;
  appId?: string;
  appVersion?: string;
  country?: string;
};

type FetchResult = {
  list: Record<string, any>[];
  total: number;
};

type BaseNodeServerReportTabProps = {
  storageKey: string;
  title: string;
  defaultDimensions: string[];
  defaultMetrics: string[];
  dimensionOptions: Array<{ label: string; value: string; backendField: string }>;
  metricOptions: Array<{ label: string; value: string; render?: (value: any) => React.ReactNode }>;
  renderExtraFilters?: (args: {
    query: NodeServerQueryState;
    setQuery: React.Dispatch<React.SetStateAction<NodeServerQueryState>>;
    visibleFilterDimensions: string[];
  }) => React.ReactNode;
  fetcher: (args: {
    query: NodeServerQueryState;
    page: number;
    pageSize: number;
    dimensions: string[];
    sorter?: ReportSorter;
  }) => Promise<FetchResult>;
};

const DATE_PRESETS = [
  { label: '今日', value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三天', value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

const toSnakeCase = (value: string) => value.replace(/([A-Z])/g, '_$1').toLowerCase();

export const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

const toNumber = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (v: any) => toNumber(v).toLocaleString();
const fmtFixed2 = (v: any) => toNumber(v).toFixed(2);

const RATE_FIELDS = new Set([
  'avgCpuUsage',
  'avgMemUsage',
  'maxCpuUsage',
  'maxMemUsage',
  'avgDiskUsage',
  'avgInboundSpeed',
  'avgOutboundSpeed',
  'maxInboundSpeed',
  'maxOutboundSpeed',
  'avgTcpConnections',
  'maxTcpConnections',
  'avgAliveUsers',
  'maxAliveUsers',
]);

const BaseNodeServerReportTab: React.FC<BaseNodeServerReportTabProps> = ({
  storageKey,
  title,
  defaultDimensions,
  defaultMetrics,
  dimensionOptions,
  metricOptions,
  renderExtraFilters,
  fetcher,
}) => {
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <UniversalReportTable<Record<string, any>, NodeServerQueryState>
      storageKey={storageKey}
      title={title}
      rowKey={(record) =>
        [record.date, record.hour, record.nodeId, record.userId, record.appId, record.country]
          .filter((item) => item !== undefined && item !== null && item !== '')
          .join('|')
      }
      defaultQuery={{
        dateRange: [today, today],
      }}
      defaultDimensions={defaultDimensions}
      defaultMetrics={defaultMetrics}
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
          width: 130,
          render: (v: any) =>
            item.render
              ? item.render(v)
              : RATE_FIELDS.has(item.value)
                ? fmtFixed2(v)
                : fmtNumber(v),
        },
      }))}
      renderFilters={({ query, setQuery, visibleFilterDimensions }) => (
        <Form layout="inline" style={{ rowGap: 4 }}>
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
          <Form.Item label="起始小时">
            <InputNumber min={0} max={23} value={query.hourFrom} style={{ width: 90 }} onChange={(v) => setQuery((prev) => ({ ...prev, hourFrom: v ?? undefined }))} />
          </Form.Item>
          <Form.Item label="结束小时">
            <InputNumber min={0} max={23} value={query.hourTo} style={{ width: 90 }} onChange={(v) => setQuery((prev) => ({ ...prev, hourTo: v ?? undefined }))} />
          </Form.Item>
          {visibleFilterDimensions.includes('nodeId') ? (
            <Form.Item label="节点ID">
              <InputNumber min={1} value={query.nodeId} style={{ width: 120 }} onChange={(v) => setQuery((prev) => ({ ...prev, nodeId: v ?? undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('nodeType') ? (
            <Form.Item label="节点类型">
              <Input value={query.nodeType} style={{ width: 130 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodeType: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('nodeHost') ? (
            <Form.Item label="节点Host">
              <Input value={query.nodeHost} style={{ width: 180 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodeHost: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('nodePublicIp') ? (
            <Form.Item label="公网IP">
              <Input value={query.nodePublicIp} style={{ width: 140 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodePublicIp: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
          {renderExtraFilters?.({ query, setQuery, visibleFilterDimensions })}
        </Form>
      )}
      fetchData={({ query, page, pageSize, dimensions, sorter }) => {
        const mappedSorter = sorter
          ? {
              ...sorter,
              field: sorter.field ? toSnakeCase(sorter.field) : undefined,
              columnKey: sorter.columnKey ? toSnakeCase(sorter.columnKey) : undefined,
            }
          : undefined;
        return fetcher({ query, page, pageSize, dimensions, sorter: mappedSorter });
      }}
    />
  );
};

export default BaseNodeServerReportTab;
