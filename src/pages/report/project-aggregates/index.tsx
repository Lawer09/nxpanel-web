import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import {
  getProjectAggregatesDaily,
  getProjectAggregatesSummary,
} from '@/services/project-aggregates/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  {
    label: '今天',
    value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
  {
    label: '最近一周',
    value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
  {
    label: '最近一个月',
    value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
];

type QueryState = {
  dateRange: [string, string];
  projectCode?: string;
  adCountry?: string;
};

const toSafeNumber = (v: number | string | undefined | null) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (v: number | string) => toSafeNumber(v).toLocaleString();
const fmtFixed2 = (v: number | string) => toSafeNumber(v).toFixed(2);
const fmtPercent = (v: number | string) => {
  const n = toSafeNumber(v);
  const percentValue = Math.abs(n) <= 1 ? n * 100 : n;
  return `${percentValue.toFixed(2)}%`;
};

const METRIC_OPTIONS = [
  { label: '上报新增', value: 'reportNewUsers', column: { title: '上报新增', dataIndex: 'reportNewUsers', width: 90 }, formatter: fmtNumber },
  { label: '日活', value: 'dauUsers', column: { title: '日活', dataIndex: 'dauUsers', width: 90 }, formatter: fmtNumber },
  { label: '注册新增', value: 'registerNewUsers', column: { title: '注册新增', dataIndex: 'registerNewUsers', width: 90 }, formatter: fmtNumber },
  {
    label: '收入',
    value: 'revenue',
    column: { title: '收入', dataIndex: 'revenue', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '投放成本',
    value: 'adSpendCost',
    column: { title: '投放成本', dataIndex: 'adSpendCost', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '流量 GB',
    value: 'trafficUsageGb',
    column: { title: '流量 GB', dataIndex: 'trafficUsageGb', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '流量成本',
    value: 'trafficCost',
    column: { title: '流量成本', dataIndex: 'trafficCost', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '毛利',
    value: 'grossProfit',
    column: { title: '毛利', dataIndex: 'grossProfit', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: 'ROI',
    value: 'roi',
    column: { title: 'ROI', dataIndex: 'roi', width: 90, render: (v: number | string) => fmtPercent(v) },
    formatter: fmtPercent,
  },
  { label: 'CPI', value: 'cpi', column: { title: 'CPI', dataIndex: 'cpi', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: 'eCPM', value: 'ecpm', column: { title: 'eCPM', dataIndex: 'ecpm', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: 'FB eCPM', value: 'fbEcpm', column: { title: 'FB eCPM', dataIndex: 'fbEcpm', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: 'CTR', value: 'ctr', column: { title: 'CTR', dataIndex: 'ctr', width: 90, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '匹配率', value: 'matchRate', column: { title: '匹配率', dataIndex: 'matchRate', width: 90, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '展示率', value: 'showRate', column: { title: '展示率', dataIndex: 'showRate', width: 90, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '展示', value: 'impressions', column: { title: '展示', dataIndex: 'impressions', width: 100 }, formatter: fmtNumber },
  { label: '点击', value: 'clicks', column: { title: '点击', dataIndex: 'clicks', width: 90 }, formatter: fmtNumber },
  { label: '请求', value: 'adRequests', column: { title: '请求', dataIndex: 'adRequests', width: 100 }, formatter: fmtNumber },
  {
    label: '匹配',
    value: 'matchedRequests',
    column: {
      title: '匹配',
      dataIndex: 'matchedRequests',
      width: 140,
      render: (v: number | string, row: API.ProjectAggregatesDailyItem) => `${fmtNumber(v)}(${fmtPercent(row.matchRate)})`,
    },
    formatter: fmtNumber,
  },
];

const SUMMARY_KEYS = [
  'reportNewUsers',
  'dauUsers',
  'registerNewUsers',
  'revenue',
  'adSpendCost',
  'trafficUsageGb',
  'trafficCost',
  'grossProfit',
  'roi',
  'cpi',
  'ecpm',
  'fbEcpm',
  'ctr',
  'matchRate',
  'showRate',
  'impressions',
  'clicks',
  'adRequests',
  'matchedRequests',
];

const resolveDailyGroupBy = (dimensions: string[]): API.ProjectAggregatesDailyGroupField[] => {
  const hasDate = dimensions.includes('date');
  const hasProject = dimensions.includes('project');
  const hasCountry = dimensions.includes('country');

  const groupBy: API.ProjectAggregatesDailyGroupField[] = [];
  if (hasDate) groupBy.push('reportDate');
  if (hasProject) groupBy.push('projectCode');
  if (hasCountry) groupBy.push('adCountry');
  return groupBy;
};

const ProjectAggregatesPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <PageContainer>
      <UniversalReportTable<API.ProjectAggregatesDailyItem, QueryState>
        storageKey="report.projectAggregates"
        title="项目聚合报表"
        rowKey="id"
        defaultQuery={{
          dateRange: [today, today],
          projectCode: undefined,
          adCountry: undefined,
        }}
        defaultDimensions={["project"]}
        defaultMetrics={[
          'reportNewUsers',
          'dauUsers',
          'registerNewUsers',
          'revenue',
          'adSpendCost',
          'trafficCost',
          'grossProfit',
          'roi',
        ]}
        dimensionOptions={[
          {
            label: '项目',
            value: 'project',
            column: { title: '项目代号', dataIndex: 'projectCode', width: 120 },
          },
          {
            label: '国家',
            value: 'country',
            column: { title: '广告国家', dataIndex: 'adCountry', width: 100 },
          },
          {
            label: '日期',
            value: 'date',
            column: { title: '日期', dataIndex: 'reportDate', width: 120 },
          },
        ]}
        metricOptions={METRIC_OPTIONS}
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
            {dimensions.includes('project') ? (
              <Form.Item label="项目代号">
                <Input
                  value={query.projectCode}
                  onChange={(e) => setQuery((prev) => ({ ...prev, projectCode: e.target.value || undefined }))}
                  placeholder="如 A003"
                  style={{ width: 140 }}
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('country') ? (
              <Form.Item label="广告国家">
                <Input
                  value={query.adCountry}
                  onChange={(e) => setQuery((prev) => ({ ...prev, adCountry: e.target.value || undefined }))}
                  placeholder="如 US"
                  style={{ width: 120 }}
                />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions }) => {
          const groupBy = resolveDailyGroupBy(dimensions);
          const res = await getProjectAggregatesDaily({
            startDate: query.dateRange[0],
            endDate: query.dateRange[1],
            projectCode: dimensions.includes('project') ? query.projectCode : undefined,
            adCountry: dimensions.includes('country') ? query.adCountry : undefined,
            groupBy,
            groupby: groupBy,
            page,
            pageSize,
            orderBy: 'reportDate',
            orderDir: 'desc',
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取项目聚合日报失败');
            return { list: [], total: 0 };
          }
          const payload = (res.data as any)?.data ?? res.data;
          const list = Array.isArray(payload) ? payload : (payload?.list ?? []);
          const total = typeof payload?.total === 'number' ? payload.total : list.length;
          return {
            list,
            total,
          };
        }}
        fetchGrandTotals={async ({ query, dimensions }) => {
          const firstDimension = dimensions[0] || 'project';
          const res = await getProjectAggregatesSummary({
            startDate: query.dateRange[0],
            endDate: query.dateRange[1],
            projectCode: dimensions.includes('project') ? query.projectCode : undefined,
            adCountry: dimensions.includes('country') ? query.adCountry : undefined,
            groupBy: (firstDimension as 'project' | 'country' | 'date') || 'project',
          });
          if (res.code !== 0) {
            return {};
          }
          const rows = res.data ?? [];
          return SUMMARY_KEYS.reduce<Record<string, number>>((acc, key) => {
            acc[key] = rows.reduce((sum, row) => sum + Number((row as any)[key] ?? 0), 0);
            return acc;
          }, {});
        }}
      />

    </PageContainer>
  );
};

export default ProjectAggregatesPage;
