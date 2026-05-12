import { Form, Input } from 'antd';
import React from 'react';
import { queryNodeServerReportNode } from '@/services/report/api';
import BaseNodeServerReportTab, { toOrderDirection } from './BaseNodeServerReportTab';

const fmtBytesToMB = (v: number) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0.00 MB';
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const DIMENSIONS = [
  { label: '日期', value: 'date', backendField: 'date' },
  { label: '小时', value: 'hour', backendField: 'hour' },
  { label: '节点ID', value: 'nodeId', backendField: 'node_id' },
  { label: '节点类型', value: 'nodeType', backendField: 'node_type' },
  { label: '节点Host', value: 'nodeHost', backendField: 'node_host' },
  { label: '公网IP', value: 'nodePublicIp', backendField: 'node_public_ip' },
  { label: '应用ID', value: 'appId', backendField: 'app_id' },
  { label: '应用版本', value: 'appVersion', backendField: 'app_version' },
];

const METRICS = [
  { label: '上传流量', value: 'trafficUpload', render: fmtBytesToMB },
  { label: '下载流量', value: 'trafficDownload', render: fmtBytesToMB },
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
  { label: '上报数', value: 'computeCount' },
];

const DIMENSION_TO_BACKEND = DIMENSIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.backendField;
  return acc;
}, {});

const NodeServerReportNodeTab: React.FC = () => {
  return (
    <BaseNodeServerReportTab
      storageKey="report.nodeServer.node"
      title="节点报表查询（node维度）"
      defaultDimensions={['date', 'hour', 'nodeId']}
      defaultMetrics={['trafficUpload', 'trafficDownload', 'computeCount']}
      dimensionOptions={DIMENSIONS}
      metricOptions={METRICS}
      renderExtraFilters={({ query, setQuery, visibleFilterDimensions }) => (
        <>
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
        </>
      )}
      fetcher={async ({ query, page, pageSize, dimensions, sorter }) => {
        const res = await queryNodeServerReportNode({
          dateFrom: query.dateRange[0],
          dateTo: query.dateRange[1],
          hourFrom: query.hourFrom,
          hourTo: query.hourTo,
          groupBy: dimensions.map((d) => DIMENSION_TO_BACKEND[d] || d) as API.NodeServerReportNodeQuery['groupBy'],
          filters: {
            nodeIds: query.nodeId ? [query.nodeId] : undefined,
            nodeTypes: query.nodeType ? [query.nodeType] : undefined,
            nodeHosts: query.nodeHost ? [query.nodeHost] : undefined,
            nodePublicIps: query.nodePublicIp ? [query.nodePublicIp] : undefined,
            appIds: query.appId ? [query.appId] : undefined,
            appVersions: query.appVersion ? [query.appVersion] : undefined,
          },
          page,
          pageSize,
          orderBy: sorter?.field || sorter?.columnKey,
          orderDirection: toOrderDirection(sorter?.order),
        });

        const payload = (res as any)?.data ?? res;
        return {
          list: payload?.data || [],
          total: Number(payload?.total ?? 0),
        };
      }}
    />
  );
};

export default NodeServerReportNodeTab;
