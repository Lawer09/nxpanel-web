import { Form, Input, InputNumber } from 'antd';
import React from 'react';
import { queryNodeServerReportUser } from '@/services/report/api';
import BaseNodeServerReportTab, { toOrderDirection } from './BaseNodeServerReportTab';

const DIMENSIONS = [
  { label: '日期', value: 'date', backendField: 'date' },
  { label: '小时', value: 'hour', backendField: 'hour' },
  { label: '节点ID', value: 'nodeId', backendField: 'node_id' },
  { label: '用户ID', value: 'userId', backendField: 'user_id' },
  { label: '应用ID', value: 'appId', backendField: 'app_id' },
  { label: '应用版本', value: 'appVersion', backendField: 'app_version' },
  { label: '国家', value: 'country', backendField: 'country' },
];

const METRICS = [
  { label: '上传流量(bytes)', value: 'trafficUpload' },
  { label: '下载流量(bytes)', value: 'trafficDownload' },
  { label: '样本数', value: 'computeCount' },
];

const DIMENSION_TO_BACKEND = DIMENSIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.backendField;
  return acc;
}, {});

const NodeServerReportUserTab: React.FC = () => {
  return (
    <BaseNodeServerReportTab
      storageKey="report.nodeServer.user"
      title="节点报表查询（user维度）"
      defaultDimensions={['date', 'hour', 'nodeId', 'userId']}
      defaultMetrics={['trafficUpload', 'trafficDownload', 'computeCount']}
      dimensionOptions={DIMENSIONS}
      metricOptions={METRICS}
      renderExtraFilters={({ query, setQuery, visibleFilterDimensions }) => (
        <>
          {visibleFilterDimensions.includes('userId') ? (
            <Form.Item label="用户ID">
              <InputNumber min={1} value={query.userId} style={{ width: 120 }} onChange={(v) => setQuery((prev) => ({ ...prev, userId: v ?? undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('appId') ? (
            <Form.Item label="应用ID">
              <Input value={query.appId} style={{ width: 160 }} onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('appVersion') ? (
            <Form.Item label="应用版本">
              <Input value={query.appVersion} style={{ width: 130 }} onChange={(e) => setQuery((prev) => ({ ...prev, appVersion: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('country') ? (
            <Form.Item label="国家">
              <Input value={query.country} style={{ width: 120 }} onChange={(e) => setQuery((prev) => ({ ...prev, country: e.target.value || undefined }))} />
            </Form.Item>
          ) : null}
        </>
      )}
      fetcher={async ({ query, page, pageSize, dimensions, sorter }) => {
        const res = await queryNodeServerReportUser({
          dateFrom: query.dateRange[0],
          dateTo: query.dateRange[1],
          hourFrom: query.hourFrom,
          hourTo: query.hourTo,
          groupBy: dimensions.map((d) => DIMENSION_TO_BACKEND[d] || d) as API.NodeServerReportUserQuery['groupBy'],
          filters: {
            nodeIds: query.nodeId ? [query.nodeId] : undefined,
            userIds: query.userId ? [query.userId] : undefined,
            appIds: query.appId ? [query.appId] : undefined,
            appVersions: query.appVersion ? [query.appVersion] : undefined,
            countries: query.country ? [query.country] : undefined,
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

export default NodeServerReportUserTab;
