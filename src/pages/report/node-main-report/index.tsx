import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Input, InputNumber, Select, Switch } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { queryNodeMainReport } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  { label: '今日', value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三天', value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

type QueryState = {
  dateRange: [string, string];
  nodeId?: number;
  appId?: string;
  platform?: string;
  clientCountry?: string;
  nodeProtocol?: string;
  includeExternal: boolean;
  fillUnknown: boolean;
};

const toNumber = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (v: any) => toNumber(v).toLocaleString();
const fmtFixed2 = (v: any) => toNumber(v).toFixed(2);
const fmtBytes = (v: any) => {
  const n = toNumber(v);
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(2)} ${units[i]}`;
};

const DIMENSIONS = [
  { label: '日期', value: 'date', field: 'date' },
  { label: '小时', value: 'hour', field: 'hour' },
  { label: '节点ID', value: 'nodeId', field: 'node_id' },
  { label: '节点名', value: 'nodeName', field: 'node_name' },
  { label: '应用ID', value: 'appId', field: 'app_id' },
  { label: '应用版本', value: 'appVersion', field: 'app_version' },
  { label: '平台', value: 'platform', field: 'platform' },
  { label: '客户端国家', value: 'clientCountry', field: 'client_country' },
  { label: '客户端ISP', value: 'clientIsp', field: 'client_isp' },
  { label: '节点Host', value: 'nodeHost', field: 'node_host' },
  { label: '机器IP', value: 'machineIp', field: 'machine_ip' },
  { label: '机器ISP', value: 'machineIpIsp', field: 'machine_ip_isp' },
  { label: '协议', value: 'nodeProtocol', field: 'node_protocol' },
] as const;

const METRICS = [
  { label: '平均延迟(ms)', value: 'avg_delay', width: 120, render: fmtFixed2, formatter: fmtFixed2 },
  { label: '成功数', value: 'success_count', width: 110, render: fmtNumber, formatter: fmtNumber },
  { label: '失败数', value: 'failed_count', width: 110, render: fmtNumber, formatter: fmtNumber },
  {
    label: '连接失败数',
    value: 'node_connect_error_count',
    width: 130,
    render: fmtNumber,
    formatter: fmtNumber,
  },
  {
    label: '后探测失败数',
    value: 'post_connect_probe_error_count',
    width: 140,
    render: fmtNumber,
    formatter: fmtNumber,
  },
  {
    label: '用户上报流量(MB)',
    value: 'client_report_traffic_usage_mb',
    width: 150,
    render: fmtFixed2,
    formatter: fmtFixed2,
  },
  {
    label: '用户上报时长(s)',
    value: 'client_report_usage_seconds',
    width: 140,
    render: fmtNumber,
    formatter: fmtNumber,
  },
  {
    label: '用户上报次数',
    value: 'client_report_count',
    width: 130,
    render: fmtNumber,
    formatter: fmtNumber,
  },
  {
    label: '节点推流上行',
    value: 'node_push_traffic_u_bytes',
    width: 130,
    render: fmtBytes,
    formatter: fmtNumber,
  },
  {
    label: '节点推流下行',
    value: 'node_push_traffic_d_bytes',
    width: 130,
    render: fmtBytes,
    formatter: fmtNumber,
  },
  {
    label: '节点推流总量',
    value: 'node_push_traffic_total_bytes',
    width: 140,
    render: fmtBytes,
    formatter: fmtNumber,
  },
  { label: '带宽', value: 'bandwidth', width: 100, render: fmtFixed2, formatter: fmtFixed2 },
  { label: '上行带宽', value: 'up_bandwidth', width: 110, render: fmtFixed2, formatter: fmtFixed2 },
  { label: '下行带宽', value: 'down_bandwidth', width: 110, render: fmtFixed2, formatter: fmtFixed2 },
] as const;

const NodeMainReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <PageContainer>
      <UniversalReportTable<Record<string, any>, QueryState>
        storageKey="report.nodeMain"
        title="节点主报表"
        rowKey={(record) =>
          [record.date, record.hour, record.node_id, record.app_id, record.platform]
            .filter((item) => item !== undefined && item !== null && item !== '')
            .join('|')
        }
        defaultQuery={{
          dateRange: [today, today],
          includeExternal: false,
          fillUnknown: true,
        }}
        defaultDimensions={['date', 'hour', 'nodeId']}
        defaultMetrics={['avg_delay', 'success_count', 'failed_count', 'client_report_traffic_usage_mb']}
        dimensionOptions={DIMENSIONS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.field,
            width: 120,
            render: (v: any) => (v === null || v === undefined || v === '' ? '-' : String(v)),
          },
        }))}
        metricOptions={METRICS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.value,
            width: item.width,
            render: (v: any) => item.render(v),
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
            {dimensions.includes('nodeId') ? (
              <Form.Item label="节点ID">
                <InputNumber
                  value={query.nodeId}
                  min={1}
                  style={{ width: 120 }}
                  onChange={(value) => setQuery((prev) => ({ ...prev, nodeId: value ?? undefined }))}
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('appId') ? (
              <Form.Item label="应用ID">
                <Input
                  value={query.appId}
                  style={{ width: 160 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('platform') ? (
              <Form.Item label="平台">
                <Input
                  value={query.platform}
                  style={{ width: 130 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, platform: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('clientCountry') ? (
              <Form.Item label="客户端国家">
                <Input
                  value={query.clientCountry}
                  style={{ width: 130 }}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, clientCountry: e.target.value || undefined }))
                  }
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('nodeProtocol') ? (
              <Form.Item label="协议">
                <Select
                  value={query.nodeProtocol}
                  style={{ width: 140 }}
                  allowClear
                  options={[
                    { label: 'trojan', value: 'trojan' },
                    { label: 'shadowsocks', value: 'shadowsocks' },
                    { label: 'vmess', value: 'vmess' },
                  ]}
                  onChange={(value) => setQuery((prev) => ({ ...prev, nodeProtocol: value || undefined }))}
                />
              </Form.Item>
            ) : null}
            <Form.Item label="包含外部节点">
              <Switch
                checked={query.includeExternal}
                onChange={(checked) => setQuery((prev) => ({ ...prev, includeExternal: checked }))}
              />
            </Form.Item>
            <Form.Item label="空值填未知">
              <Switch
                checked={query.fillUnknown}
                onChange={(checked) => setQuery((prev) => ({ ...prev, fillUnknown: checked }))}
              />
            </Form.Item>
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions }) => {
          const groupBy = DIMENSIONS.filter((item) => dimensions.includes(item.value)).map((item) => item.field);
          const res = await queryNodeMainReport({
            dateFrom: query.dateRange[0],
            dateTo: query.dateRange[1],
            groupBy: groupBy.length ? groupBy : ['date'],
            filters: {
              nodeIds: dimensions.includes('nodeId') && query.nodeId ? [query.nodeId] : undefined,
              appIds: dimensions.includes('appId') && query.appId ? [query.appId] : undefined,
              platforms: dimensions.includes('platform') && query.platform ? [query.platform] : undefined,
              clientCountries:
                dimensions.includes('clientCountry') && query.clientCountry
                  ? [query.clientCountry]
                  : undefined,
              nodeProtocols:
                dimensions.includes('nodeProtocol') && query.nodeProtocol
                  ? [query.nodeProtocol]
                  : undefined,
              includeExternal: query.includeExternal,
            },
            fillUnknown: query.fillUnknown,
            page,
            pageSize,
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取节点主报表失败');
            return { list: [], total: 0 };
          }

          const payload = res.data;
          const list = Array.isArray(payload?.data) ? payload.data : [];
          const total = Number(payload?.total ?? list.length);
          return { list, total };
        }}
      />
    </PageContainer>
  );
};

export default NodeMainReportPage;
