import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { getProjects } from '@/services/project/api';
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
  country?: string;
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
const fmtCountry = (country?: string | null) => {
  if (!country) return '-';
  return country.toUpperCase() === 'XX' ? '未知' : country;
};

const METRIC_OPTIONS = [
  { label: '新增', value: 'newUsers', column: { title: '新增', dataIndex: 'newUsers', width: 90 }, formatter: fmtNumber },
  { label: '日活', value: 'dauUsers', column: { title: '日活', dataIndex: 'dauUsers', width: 90 }, formatter: fmtNumber },
  {
    label: '广告收入',
    value: 'adRevenue',
    column: { title: '广告收入', dataIndex: 'adRevenue', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '投放成本',
    value: 'adSpendCost',
    column: { title: '投放成本', dataIndex: 'adSpendCost', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '流量 MB',
    value: 'trafficUsageMb',
    column: { title: '流量 MB', dataIndex: 'trafficUsageMb', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '流量成本',
    value: 'trafficCost',
    column: { title: '流量成本', dataIndex: 'trafficCost', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: '利润',
    value: 'profit',
    column: { title: '利润', dataIndex: 'profit', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: 'ROI',
    value: 'roi',
    column: { title: 'ROI', dataIndex: 'roi', width: 90, render: (v: number | string) => fmtPercent(v) },
    formatter: fmtPercent,
  },
  { label: '投放 CPI', value: 'adSpendCpi', column: { title: '投放 CPI', dataIndex: 'adSpendCpi', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: '投放 CPC', value: 'adSpendCpc', column: { title: '投放 CPC', dataIndex: 'adSpendCpc', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: '投放 CPM', value: 'adSpendCpm', column: { title: '投放 CPM', dataIndex: 'adSpendCpm', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: '广告 eCPM', value: 'adEcpm', column: { title: '广告 eCPM', dataIndex: 'adEcpm', width: 90, render: (v: number | string) => fmtFixed2(v) }, formatter: fmtFixed2 },
  { label: '广告 CTR', value: 'adCtr', column: { title: '广告 CTR', dataIndex: 'adCtr', width: 90, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '广告匹配率', value: 'adMatchRate', column: { title: '广告匹配率', dataIndex: 'adMatchRate', width: 100, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '广告展示率', value: 'adShowRate', column: { title: '广告展示率', dataIndex: 'adShowRate', width: 100, render: (v: number | string) => fmtPercent(v) }, formatter: fmtPercent },
  { label: '广告展示', value: 'adImpressions', column: { title: '广告展示', dataIndex: 'adImpressions', width: 100 }, formatter: fmtNumber },
  { label: '广告点击', value: 'adClicks', column: { title: '广告点击', dataIndex: 'adClicks', width: 90 }, formatter: fmtNumber },
  { label: '请求', value: 'adRequests', column: { title: '请求', dataIndex: 'adRequests', width: 100 }, formatter: fmtNumber },
  {
    label: '广告匹配',
    value: 'adMatchedRequests',
    column: {
      title: '广告匹配',
      dataIndex: 'adMatchedRequests',
      width: 140,
      render: (v: number | string, row: API.ProjectAggregatesDailyItem) => `${fmtNumber(v)}(${fmtPercent(row.adMatchRate)})`,
    },
    formatter: fmtNumber,
  },
];

const SUMMARY_KEYS = [
  'newUsers',
  'dauUsers',
  'adRevenue',
  'adSpendCost',
  'adSpendCpi',
  'adSpendCpc',
  'adSpendCpm',
  'trafficUsageMb',
  'trafficCost',
  'profit',
  'roi',
  'adEcpm',
  'adCtr',
  'adMatchRate',
  'adShowRate',
  'adImpressions',
  'adClicks',
  'adRequests',
  'adMatchedRequests',
];

const resolveDailyGroupBy = (dimensions: string[]): API.ProjectAggregatesDailyGroupField[] => {
  const hasDate = dimensions.includes('date');
  const hasProject = dimensions.includes('project');
  const hasCountry = dimensions.includes('country');

  const groupBy: API.ProjectAggregatesDailyGroupField[] = [];
  if (hasDate) groupBy.push('reportDate');
  if (hasProject) groupBy.push('projectCode');
  if (hasCountry) groupBy.push('country');
  return groupBy;
};

const ProjectAggregatesPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  const refreshProjectCodes = useCallback(async (keyword?: string) => {
    const res = await getProjects({
      keyword,
      page: 1,
      pageSize: 200,
    });
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取项目代号失败');
      return;
    }
    const options = (res.data?.data ?? [])
      .map((item) => item.projectCode)
      .filter((item): item is string => Boolean(item));
    setProjectOptions(Array.from(new Set(options)));
  }, [messageApi]);

  useEffect(() => {
    refreshProjectCodes();
  }, [refreshProjectCodes]);

  return (
    <PageContainer>
      <UniversalReportTable<API.ProjectAggregatesDailyItem, QueryState>
        storageKey="report.projectAggregates"
        title="项目聚合报表"
        rowKey={(record) => {
          if (record.id !== undefined && record.id !== null) {
            return String(record.id);
          }
          return [
            record.reportDate,
            record.projectCode,
            record.country,
          ]
            .filter((item) => Boolean(item))
            .join('|');
        }}
        defaultQuery={{
          dateRange: [today, today],
          projectCode: undefined,
          country: undefined,
        }}
        defaultDimensions={["project"]}
        defaultMetrics={[
          'newUsers',
          'dauUsers',
          'adRevenue',
          'adSpendCost',
          'trafficCost',
          'profit',
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
            column: { title: '国家', dataIndex: 'country', width: 100, render: (v: string) => fmtCountry(v) },
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
                <Select
                  value={query.projectCode}
                  onChange={(value) => setQuery((prev) => ({ ...prev, projectCode: value || undefined }))}
                  options={projectOptions.map((item) => ({ label: item, value: item }))}
                  showSearch
                  allowClear
                  placeholder="请选择项目代号"
                  onSearch={(value) => refreshProjectCodes(value)}
                  filterOption={false}
                  style={{ width: 140 }}
                />
              </Form.Item>
            ) : null}
            {dimensions.includes('country') ? (
              <Form.Item label="国家">
                <Input
                  value={query.country}
                  onChange={(e) => setQuery((prev) => ({ ...prev, country: e.target.value || undefined }))}
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
            projectCode: query.projectCode,
            country: query.country,
            groupBy: groupBy.length ? groupBy : undefined,
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
            projectCode: query.projectCode,
            country: query.country,
            groupBy:
              (firstDimension as 'project' | 'country' | 'date') || 'project',
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
