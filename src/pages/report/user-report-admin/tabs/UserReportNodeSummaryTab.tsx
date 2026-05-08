import { App, Form, Input, InputNumber } from 'antd';
import React from 'react';
import { queryUserReportNodeSummary } from '@/services/report/api';
import BaseUserReportTab, { toOrderDirection, toSnakeGroupBy } from './BaseUserReportTab';

const fmtPercent = (v: number) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0.00%';
  const percentValue = Math.abs(n) <= 1 ? n * 100 : n;
  return `${percentValue.toFixed(2)}%`;
};

const DIMENSIONS = [
  { label: '日期', value: 'date' },
  { label: '小时', value: 'hour' },
  { label: '节点ID', value: 'nodeId' },
  { label: '节点Host', value: 'nodeHost' },
  { label: '节点类型', value: 'nodeType' },
  { label: '探测阶段', value: 'probeStage' },
];

const METRICS = [
  { label: '平均延迟', value: 'avgDelay' },
  { label: '流量用量', value: 'trafficUsage' },
  { label: '流量时长', value: 'trafficUseTime' },
  { label: '计算次数', value: 'computeCount' },
  { label: '成功次数', value: 'successCount' },
  { label: '失败次数', value: 'failCount' },
  { label: '成功率', value: 'successRate', render: fmtPercent, formatter: fmtPercent },
];

const UserReportNodeSummaryTab: React.FC = () => {
  const { message: messageApi } = App.useApp();

  return (
    <BaseUserReportTab
      storageKey="report.userReport.nodeSummary"
      defaultDimensions={['date', 'hour', 'nodeId', 'probeStage']}
      defaultMetrics={[
        'avgDelay',
        'trafficUsage',
        'trafficUseTime',
        'computeCount',
        'successCount',
        'failCount',
        'successRate',
      ]}
      dimensionOptions={DIMENSIONS}
      metricOptions={METRICS}
      renderExtraFilters={({ query, setQuery, visibleFilterDimensions }) => (
        <>
          {visibleFilterDimensions.includes('nodeId') ? (
            <Form.Item label="节点ID">
              <InputNumber
                value={query.nodeId}
                min={1}
                style={{ width: 120 }}
                onChange={(value) => setQuery((prev) => ({ ...prev, nodeId: value ?? undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('nodeHost') ? (
            <Form.Item label="节点Host">
              <Input
                value={query.nodeHost}
                style={{ width: 140 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, nodeHost: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('nodeType') ? (
            <Form.Item label="节点类型">
              <Input
                value={query.nodeType}
                style={{ width: 130 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, nodeType: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('probeStage') ? (
            <Form.Item label="探测阶段">
              <Input
                value={query.probeStage}
                style={{ width: 150 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, probeStage: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
        </>
      )}
      fetcher={async ({ query, page, pageSize, dimensions, sorter }) => {
        const res = await queryUserReportNodeSummary({
          dateFrom: query.dateRange[0],
          dateTo: query.dateRange[1],
          hourFrom: query.hourFrom,
          hourTo: query.hourTo,
          groupBy: toSnakeGroupBy(dimensions),
          orderBy: sorter?.field || sorter?.columnKey,
          orderDirection: toOrderDirection(sorter?.order),
          filters: {
            nodeIds: query.nodeId ? [query.nodeId] : undefined,
            nodeHosts: query.nodeHost ? [query.nodeHost] : undefined,
            probeStages: query.probeStage ? [query.probeStage] : undefined,
            nodeTypes: query.nodeType ? [query.nodeType] : undefined,
          },
          page,
          pageSize,
        });

        if (res.code !== 0) {
          messageApi.error(res.msg || '获取节点汇总查询失败');
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

export default UserReportNodeSummaryTab;
