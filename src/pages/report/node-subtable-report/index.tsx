import { App, DatePicker, Form, Input, InputNumber, Select } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { queryNodeSubtable } from '@/services/report/api';

type QueryState = {
  date: string;
  hour?: number;
  minute?: number;
  subTable: API.NodeSubTableType;
  nodeId?: number;
  appId?: string;
  platform?: string;
  clientCountry?: string;
  status?: string;
  probeStage?: string;
  errorCode?: string;
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

const DIMENSION_OPTIONS = [
  ['date', '日期'],
  ['hour', '小时'],
  ['minute', '分钟'],
  ['scope', '范围'],
  ['node_id', '节点ID'],
  ['server_id', '服务ID'],
  ['node_ip', '节点IP'],
  ['client_country', '客户端国家'],
  ['platform', '平台'],
  ['client_isp', '客户端ISP'],
  ['app_id', '应用ID'],
  ['app_version', '应用版本'],
  ['status', '状态'],
  ['probe_stage', '探测阶段'],
  ['error_code', '错误码'],
  ['server_type', '服务类型'],
] as const;

const METRIC_OPTIONS = [
  { key: 'row_count', label: '行数', render: fmtNumber, formatter: fmtNumber },
  { key: 'total_count', label: '总样本', render: fmtNumber, formatter: fmtNumber },
  { key: 'avg_delay_weighted', label: '加权延迟', render: fmtFixed2, formatter: fmtFixed2 },
  { key: 'success_count', label: '成功数', render: fmtNumber, formatter: fmtNumber },
  { key: 'failed_count', label: '失败数', render: fmtNumber, formatter: fmtNumber },
  { key: 'failed_like_count', label: '失败样本', render: fmtNumber, formatter: fmtNumber },
  { key: 'report_count', label: '上报数', render: fmtNumber, formatter: fmtNumber },
  { key: 'total_usage_mb', label: '总流量(MB)', render: fmtFixed2, formatter: fmtFixed2 },
  { key: 'total_usage_seconds', label: '总时长(s)', render: fmtNumber, formatter: fmtNumber },
  { key: 'u_bytes', label: '上行字节', render: fmtBytes, formatter: fmtNumber },
  { key: 'd_bytes', label: '下行字节', render: fmtBytes, formatter: fmtNumber },
  { key: 'total_bytes', label: '总字节', render: fmtBytes, formatter: fmtNumber },
  { key: 'delay_weight', label: '延迟权重', render: fmtNumber, formatter: fmtNumber },
  {
    key: 'client_report_traffic_usage_mb',
    label: '用户上报流量(MB)',
    render: fmtFixed2,
    formatter: fmtFixed2,
  },
  {
    key: 'node_push_traffic_total_bytes',
    label: '节点推流总字节',
    render: fmtBytes,
    formatter: fmtNumber,
  },
] as const;

const SUBTABLE_DEFAULTS: Record<API.NodeSubTableType, { dimensions: string[]; metrics: string[] }> = {
  performance: {
    dimensions: ['date', 'hour', 'node_id', 'app_id'],
    metrics: ['row_count', 'total_count', 'avg_delay_weighted'],
  },
  probe: {
    dimensions: ['date', 'hour', 'node_id', 'status', 'probe_stage'],
    metrics: ['row_count', 'total_count', 'success_count', 'failed_like_count'],
  },
  traffic: {
    dimensions: ['date', 'hour', 'node_id', 'app_id'],
    metrics: ['row_count', 'report_count', 'total_usage_mb', 'total_usage_seconds'],
  },
  server_detail: {
    dimensions: ['date', 'hour', 'node_id', 'server_id'],
    metrics: ['row_count', 'u_bytes', 'd_bytes', 'total_bytes'],
  },
  main_aggregated: {
    dimensions: ['date', 'hour', 'node_id', 'app_id'],
    metrics: ['row_count', 'success_count', 'failed_count', 'client_report_traffic_usage_mb'],
  },
};

const NodeSubtableReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  const defaultDimensions = SUBTABLE_DEFAULTS.performance.dimensions;
  const defaultMetrics = SUBTABLE_DEFAULTS.performance.metrics;

  const dimensionOptions = useMemo(
    () =>
      DIMENSION_OPTIONS.map(([value, label]) => ({
        label,
        value,
        column: {
          title: label,
          dataIndex: value,
          width: 130,
          render: (v: any) => (v === null || v === undefined || v === '' ? '-' : String(v)),
        },
      })),
    [],
  );

  const metricOptions = useMemo(
    () =>
      METRIC_OPTIONS.map((item) => ({
        label: item.label,
        value: item.key,
        column: {
          title: item.label,
          dataIndex: item.key,
          width: 140,
          render: (v: any) => item.render(v),
        },
        formatter: item.formatter,
      })),
    [],
  );

  return (
    <UniversalReportTable<Record<string, any>, QueryState>
        storageKey="report.nodeSubtable"
        title="节点子表校对"
        rowKey={(record) =>
          [record.date, record.hour, record.minute, record.node_id, record.server_id, record.app_id]
            .filter((item) => item !== undefined && item !== null && item !== '')
            .join('|')
        }
        defaultQuery={{
          date: today,
          subTable: 'performance',
        }}
        defaultDimensions={defaultDimensions}
        defaultMetrics={defaultMetrics}
        dimensionOptions={dimensionOptions}
        metricOptions={metricOptions}
        renderFilters={({ query, setQuery, visibleFilterDimensions }) => (
          <Form layout="inline" style={{ rowGap: 4 }}>
            <Form.Item label="子表">
              <Select
                value={query.subTable}
                style={{ width: 180 }}
                options={[
                  { label: 'performance', value: 'performance' },
                  { label: 'probe', value: 'probe' },
                  { label: 'traffic', value: 'traffic' },
                  { label: 'server_detail', value: 'server_detail' },
                  { label: 'main_aggregated', value: 'main_aggregated' },
                ]}
                onChange={(value) => setQuery((prev) => ({ ...prev, subTable: value }))}
              />
            </Form.Item>
            <Form.Item label="日期">
              <DatePicker
                value={dayjs(query.date)}
                onChange={(value) => {
                  if (!value) return;
                  setQuery((prev) => ({ ...prev, date: value.format('YYYY-MM-DD') }));
                }}
              />
            </Form.Item>
            {visibleFilterDimensions.includes('hour') ? (
              <Form.Item label="小时">
                <InputNumber
                  value={query.hour}
                  min={0}
                  max={23}
                  style={{ width: 90 }}
                  onChange={(value) => setQuery((prev) => ({ ...prev, hour: value ?? undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('minute') ? (
              <Form.Item label="分钟">
                <InputNumber
                  value={query.minute}
                  min={0}
                  max={59}
                  style={{ width: 90 }}
                  onChange={(value) => setQuery((prev) => ({ ...prev, minute: value ?? undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('node_id') ? (
              <Form.Item label="节点ID">
                <InputNumber
                  value={query.nodeId}
                  min={1}
                  style={{ width: 120 }}
                  onChange={(value) => setQuery((prev) => ({ ...prev, nodeId: value ?? undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('app_id') ? (
              <Form.Item label="应用ID">
                <Input
                  value={query.appId}
                  style={{ width: 150 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('platform') ? (
              <Form.Item label="平台">
                <Input
                  value={query.platform}
                  style={{ width: 120 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, platform: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('client_country') ? (
              <Form.Item label="国家">
                <Input
                  value={query.clientCountry}
                  style={{ width: 120 }}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, clientCountry: e.target.value || undefined }))
                  }
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('status') ? (
              <Form.Item label="状态">
                <Input
                  value={query.status}
                  style={{ width: 120 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('probe_stage') ? (
              <Form.Item label="阶段">
                <Input
                  value={query.probeStage}
                  style={{ width: 150 }}
                  onChange={(e) =>
                    setQuery((prev) => ({ ...prev, probeStage: e.target.value || undefined }))
                  }
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('error_code') ? (
              <Form.Item label="错误码">
                <Input
                  value={query.errorCode}
                  style={{ width: 140 }}
                  onChange={(e) => setQuery((prev) => ({ ...prev, errorCode: e.target.value || undefined }))}
                />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions }) => {
          const res = await queryNodeSubtable({
            subTable: query.subTable,
            date: query.date,
            hour: query.hour,
            minute: query.minute,
            groupBy: dimensions,
            filters: {
              nodeIds: query.nodeId ? [query.nodeId] : undefined,
              appIds: query.appId ? [query.appId] : undefined,
              platforms: query.platform ? [query.platform] : undefined,
              clientCountries: query.clientCountry ? [query.clientCountry] : undefined,
              statuses: query.status ? [query.status] : undefined,
              probeStages: query.probeStage ? [query.probeStage] : undefined,
              errorCodes: query.errorCode ? [query.errorCode] : undefined,
            },
            page,
            pageSize,
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取节点子表校对失败');
            return { list: [], total: 0 };
          }

          const payload = res.data;
          const list = Array.isArray(payload?.data) ? payload.data : [];
          const total = Number(payload?.total ?? list.length);
          return { list, total };
        }}
      />
  );
};

export default NodeSubtableReportPage;
