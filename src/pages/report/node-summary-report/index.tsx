import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Input, InputNumber } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { queryNodeReportHourly } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  { label: '今日', value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三天', value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

type QueryState = {
  dateRange: [string, string];
  hourFrom?: number;
  hourTo?: number;
  nodeId?: number;
  nodeType?: string;
  nodeHost?: string;
  nodePublicIp?: string;
  probeStage?: string;
  appId?: string;
  appVersion?: string;
};

type ReportSorter = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

const DIMENSIONS = [
  { label: '日期', value: 'date', backendField: 'date' },
  { label: '小时', value: 'hour', backendField: 'hour' },
  { label: '节点ID', value: 'nodeId', backendField: 'node_id' },
  { label: '节点类型', value: 'nodeType', backendField: 'node_type' },
  { label: '节点Host', value: 'nodeHost', backendField: 'node_host' },
  { label: '公网IP', value: 'nodePublicIp', backendField: 'node_public_ip' },
  { label: '探测阶段', value: 'probeStage', backendField: 'probe_stage' },
  { label: '应用ID', value: 'appId', backendField: 'app_id' },
  { label: '应用版本', value: 'appVersion', backendField: 'app_version' },
];

const METRICS = [
  { label: '上传流量', value: 'trafficUpload' },
  { label: '下载流量', value: 'trafficDownload' },
  { label: '平均CPU', value: 'avgCpuUsage' },
  { label: '平均内存', value: 'avgMemUsage' },
  { label: '最大CPU', value: 'maxCpuUsage' },
  { label: '最大内存', value: 'maxMemUsage' },
  { label: '平均磁盘', value: 'avgDiskUsage' },
  { label: '平均入站速率', value: 'avgInboundSpeed' },
  { label: '平均出站速率', value: 'avgOutboundSpeed' },
  { label: '最大入站速率', value: 'maxInboundSpeed' },
  { label: '最大出站速率', value: 'maxOutboundSpeed' },
  { label: '平均TCP连接', value: 'avgTcpConnections' },
  { label: '最大TCP连接', value: 'maxTcpConnections' },
  { label: '平均活跃用户', value: 'avgAliveUsers' },
  { label: '最大活跃用户', value: 'maxAliveUsers' },
  { label: '平均延迟', value: 'avgDelay' },
  { label: '流量用量', value: 'trafficUsage' },
  { label: '流量时长(s)', value: 'trafficUseTime' },
  { label: '成功数', value: 'successCount' },
  { label: '失败数', value: 'failCount' },
  { label: '成功率', value: 'successRate' },
  { label: '节点上报数', value: 'reportCountNode' },
  { label: '用户上报数', value: 'reportCountUser' },
];

const DIMENSION_TO_BACKEND = DIMENSIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.backendField;
  return acc;
}, {});

const FIXED2_FIELDS = new Set([
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
  'avgDelay',
]);

const TRAFFIC_FIELDS = new Set(['trafficUpload', 'trafficDownload', 'trafficUsage']);

const toNumber = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const fmtNumber = (value: any) => toNumber(value).toLocaleString();
const fmtFixed2 = (value: any) => toNumber(value).toFixed(2);
const fmtKBtoMB = (value: any) => `${(toNumber(value) / 1024).toFixed(2)} MB`;
const fmtSuccessRate = (value: any) => {
  const num = toNumber(value);
  const percent = Math.abs(num) <= 1 ? num * 100 : num;
  return `${percent.toFixed(2)}%`;
};

const toSnakeCase = (value: string) => value.replace(/([A-Z])/g, '_$1').toLowerCase();

const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

const NodeSummaryReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <PageContainer>
      <UniversalReportTable<Record<string, any>, QueryState>
        storageKey="report.nodeSummary"
        title="节点汇总"
        rowKey={(record) =>
          [record.date, record.hour, record.nodeId, record.nodeHost, record.probeStage, record.appId, record.appVersion]
            .filter((item) => item !== undefined && item !== null && item !== '')
            .join('|')
        }
        defaultQuery={{
          dateRange: [today, today],
        }}
        defaultDimensions={['date', 'hour', 'nodeId', 'probeStage']}
        defaultMetrics={['trafficUpload', 'trafficDownload', 'avgDelay', 'successRate', 'reportCountNode', 'reportCountUser']}
        enableServerSort
        dimensionOptions={DIMENSIONS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.value,
            width: 130,
            render: (value: any) => (value === null || value === undefined || value === '' ? '-' : String(value)),
          },
        }))}
        metricOptions={METRICS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.value,
            width: 130,
            render: (value: any) => {
              if (item.value === 'successRate') return fmtSuccessRate(value);
              if (FIXED2_FIELDS.has(item.value)) return fmtFixed2(value);
              if (TRAFFIC_FIELDS.has(item.value)) return fmtKBtoMB(value);
              return fmtNumber(value);
            },
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
              <InputNumber min={0} max={23} value={query.hourFrom} style={{ width: 90 }} onChange={(value) => setQuery((prev) => ({ ...prev, hourFrom: value ?? undefined }))} />
            </Form.Item>
            <Form.Item label="结束小时">
              <InputNumber min={0} max={23} value={query.hourTo} style={{ width: 90 }} onChange={(value) => setQuery((prev) => ({ ...prev, hourTo: value ?? undefined }))} />
            </Form.Item>
            {visibleFilterDimensions.includes('nodeId') ? (
              <Form.Item label="节点ID">
                <InputNumber min={1} value={query.nodeId} style={{ width: 120 }} onChange={(value) => setQuery((prev) => ({ ...prev, nodeId: value ?? undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('nodeType') ? (
              <Form.Item label="节点类型">
                <Input value={query.nodeType} style={{ width: 130 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodeType: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('nodeHost') ? (
              <Form.Item label="节点Host">
                <Input value={query.nodeHost} style={{ width: 170 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodeHost: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('nodePublicIp') ? (
              <Form.Item label="公网IP">
                <Input value={query.nodePublicIp} style={{ width: 140 }} onChange={(e) => setQuery((prev) => ({ ...prev, nodePublicIp: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('probeStage') ? (
              <Form.Item label="探测阶段">
                <Input value={query.probeStage} style={{ width: 160 }} onChange={(e) => setQuery((prev) => ({ ...prev, probeStage: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('appId') ? (
              <Form.Item label="应用ID">
                <Input value={query.appId} style={{ width: 160 }} onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('appVersion') ? (
              <Form.Item label="应用版本">
                <Input value={query.appVersion} style={{ width: 140 }} onChange={(e) => setQuery((prev) => ({ ...prev, appVersion: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
          const mappedSorter: ReportSorter | undefined = sorter
            ? {
                ...sorter,
                field: sorter.field ? toSnakeCase(sorter.field) : undefined,
                columnKey: sorter.columnKey ? toSnakeCase(sorter.columnKey) : undefined,
              }
            : undefined;

          const res = await queryNodeReportHourly({
            dateFrom: query.dateRange[0],
            dateTo: query.dateRange[1],
            hourFrom: query.hourFrom,
            hourTo: query.hourTo,
            groupBy: dimensions.map((item) => DIMENSION_TO_BACKEND[item] || item) as API.NodeReportHourlyQuery['groupBy'],
            filters: {
              nodeIds: query.nodeId ? [query.nodeId] : undefined,
              nodeTypes: query.nodeType ? [query.nodeType] : undefined,
              nodeHosts: query.nodeHost ? [query.nodeHost] : undefined,
              nodePublicIps: query.nodePublicIp ? [query.nodePublicIp] : undefined,
              probeStages: query.probeStage ? [query.probeStage] : undefined,
              appIds: query.appId ? [query.appId] : undefined,
              appVersions: query.appVersion ? [query.appVersion] : undefined,
            },
            page,
            pageSize,
            orderBy: mappedSorter?.field || mappedSorter?.columnKey,
            orderDirection: toOrderDirection(mappedSorter?.order),
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取节点汇总报表失败');
            return { list: [], total: 0 };
          }

          const payload = res.data;
          return {
            list: payload?.data || [],
            total: Number(payload?.total ?? 0),
          };
        }}
      />
    </PageContainer>
  );
};

export default NodeSummaryReportPage;
