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

type QueryState = {
  dateRange: [string, string];
  projectCode?: string;
  adCountry?: string;
};

const fmtNumber = (v: number) => Number(v ?? 0).toLocaleString();
const fmtMoney = (v: number) => Number(v ?? 0).toFixed(2);
const fmtRate = (v: number) => `${Number(v ?? 0).toFixed(4)}`;

const METRIC_OPTIONS = [
  { label: '上报新增', value: 'reportNewUsers', column: { title: '上报新增', dataIndex: 'reportNewUsers', width: 90 }, formatter: fmtNumber },
  { label: '日活', value: 'dauUsers', column: { title: '日活', dataIndex: 'dauUsers', width: 90 }, formatter: fmtNumber },
  { label: '注册新增', value: 'registerNewUsers', column: { title: '注册新增', dataIndex: 'registerNewUsers', width: 90 }, formatter: fmtNumber },
  { label: '收入', value: 'revenue', column: { title: '收入', dataIndex: 'revenue', width: 100 }, formatter: fmtMoney },
  { label: '投放成本', value: 'adSpendCost', column: { title: '投放成本', dataIndex: 'adSpendCost', width: 100 }, formatter: fmtMoney },
  { label: '流量 GB', value: 'trafficUsageGb', column: { title: '流量 GB', dataIndex: 'trafficUsageGb', width: 100 }, formatter: fmtMoney },
  { label: '流量成本', value: 'trafficCost', column: { title: '流量成本', dataIndex: 'trafficCost', width: 100 }, formatter: fmtMoney },
  { label: '毛利', value: 'grossProfit', column: { title: '毛利', dataIndex: 'grossProfit', width: 100 }, formatter: fmtMoney },
  { label: 'ROI', value: 'roi', column: { title: 'ROI', dataIndex: 'roi', width: 90 }, formatter: fmtRate },
  { label: 'CPI', value: 'cpi', column: { title: 'CPI', dataIndex: 'cpi', width: 90 }, formatter: fmtRate },
  { label: 'eCPM', value: 'ecpm', column: { title: 'eCPM', dataIndex: 'ecpm', width: 90 }, formatter: fmtRate },
  { label: 'FB eCPM', value: 'fbEcpm', column: { title: 'FB eCPM', dataIndex: 'fbEcpm', width: 90 }, formatter: fmtRate },
  { label: 'CTR', value: 'ctr', column: { title: 'CTR', dataIndex: 'ctr', width: 90 }, formatter: fmtRate },
  { label: '匹配率', value: 'matchRate', column: { title: '匹配率', dataIndex: 'matchRate', width: 90 }, formatter: fmtRate },
  { label: '展示率', value: 'showRate', column: { title: '展示率', dataIndex: 'showRate', width: 90 }, formatter: fmtRate },
  { label: '展示', value: 'impressions', column: { title: '展示', dataIndex: 'impressions', width: 100 }, formatter: fmtNumber },
  { label: '点击', value: 'clicks', column: { title: '点击', dataIndex: 'clicks', width: 90 }, formatter: fmtNumber },
  { label: '请求', value: 'adRequests', column: { title: '请求', dataIndex: 'adRequests', width: 100 }, formatter: fmtNumber },
  { label: '匹配', value: 'matchedRequests', column: { title: '匹配', dataIndex: 'matchedRequests', width: 100 }, formatter: fmtNumber },
];

const UniversalReportDemoPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <PageContainer>
      <UniversalReportTable<API.ProjectAggregatesDailyItem, QueryState>
        storageKey="devtest.universalReportDemo"
        title="通用报表组件 Demo"
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
        renderFilters={({ query, setQuery }) => (
          <Form layout="inline">
            <Form.Item label="日期范围">
              <RangePicker
                value={[dayjs(query.dateRange[0]), dayjs(query.dateRange[1])]}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setQuery((prev) => ({
                      ...prev,
                      dateRange: [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')],
                    }));
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="项目代号">
              <Input
                value={query.projectCode}
                onChange={(e) => setQuery((prev) => ({ ...prev, projectCode: e.target.value || undefined }))}
                placeholder="如 A003"
                style={{ width: 140 }}
              />
            </Form.Item>
            <Form.Item label="广告国家">
              <Input
                value={query.adCountry}
                onChange={(e) => setQuery((prev) => ({ ...prev, adCountry: e.target.value || undefined }))}
                placeholder="如 US"
                style={{ width: 120 }}
              />
            </Form.Item>
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions }) => {
          const firstDimension = dimensions[0] || 'project';
          const res = await getProjectAggregatesDaily({
            startDate: query.dateRange[0],
            endDate: query.dateRange[1],
            projectCode: query.projectCode,
            adCountry: query.adCountry,
            page,
            pageSize,
            orderBy: firstDimension === 'date' ? 'reportDate' : 'revenue',
            orderDir: 'desc',
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取项目聚合日报失败');
            return { list: [], total: 0 };
          }
          return {
            list: res.data?.list ?? [],
            total: res.data?.total ?? 0,
          };
        }}
        fetchGrandTotals={async ({ query, dimensions }) => {
          const firstDimension = dimensions[0] || 'project';
          const res = await getProjectAggregatesSummary({
            startDate: query.dateRange[0],
            endDate: query.dateRange[1],
            projectCode: query.projectCode,
            adCountry: query.adCountry,
            groupBy: (firstDimension as 'project' | 'country' | 'date') || 'project',
          });
          if (res.code !== 0) {
            return {};
          }
          const rows = res.data ?? [];
          const keys = [
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
          return keys.reduce<Record<string, number>>((acc, key) => {
            acc[key] = rows.reduce((sum, row) => sum + Number((row as any)[key] ?? 0), 0);
            return acc;
          }, {});
        }}
      />
    </PageContainer>
  );
};

export default UniversalReportDemoPage;
