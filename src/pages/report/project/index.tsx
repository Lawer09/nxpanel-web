import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Select } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { getProjects } from '@/services/project/api';
import { queryProjectReport } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  {
    label: '今日',
    value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
  {
    label: '近三天',
    value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
  {
    label: '近一周',
    value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
  {
    label: '近一月',
    value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs],
  },
];

const COMMON_COUNTRY_OPTIONS = [
  'US',
  'JP',
  'KR',
  'SG',
  'HK',
  'TW',
  'GB',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'SE',
  'CA',
  'AU',
  'NZ',
  'IN',
  'ID',
  'TH',
  'VN',
  'MY',
  'PH',
  'BR',
  'MX',
  'TR',
  'AE',
  'SA',
  'ZA',
  'RU',
];

type QueryState = {
  dateRange: [string, string];
  projectCodes?: string[];
  countries?: string[];
};

const toSafeNumber = (v: unknown) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtInt = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return Math.round(n).toLocaleString();
};

const fmtCurrency = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtFixed2 = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtPercent = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return `${n.toFixed(2)}%`;
};

const fmtRoiPercent = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return `${(n * 100).toFixed(2)}%`;
};

const fmtCountry = (country?: string | null) => {
  if (!country) return '--';
  return country.toUpperCase();
};

const METRIC_OPTIONS = [
  {
    label: '新增用户',
    value: 'newUsers',
    column: { title: '新增用户', dataIndex: 'newUsers', width: 110 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '上报新增用户',
    value: 'reportNewUsers',
    column: { title: '上报新增用户', dataIndex: 'reportNewUsers', width: 120 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '日活用户',
    value: 'dauUsers',
    column: { title: '日活用户', dataIndex: 'dauUsers', width: 110 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '广告收入',
    value: 'adRevenue',
    column: { title: '广告收入', dataIndex: 'adRevenue', width: 110, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '广告请求数',
    value: 'adRequests',
    column: { title: '广告请求数', dataIndex: 'adRequests', width: 120 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '广告匹配请求数',
    value: 'adMatchedRequests',
    column: { title: '广告匹配请求数', dataIndex: 'adMatchedRequests', width: 140 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '广告展示数',
    value: 'adImpressions',
    column: { title: '广告展示数', dataIndex: 'adImpressions', width: 120 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '人均展示',
    value: 'impressionsPerUser',
    column: { title: '人均展示', dataIndex: 'impressionsPerUser', width: 110, render: fmtFixed2 },
    formatter: (v: unknown) => fmtFixed2(v),
  },
  {
    label: '广告点击数',
    value: 'adClicks',
    column: { title: '广告点击数', dataIndex: 'adClicks', width: 120 },
    formatter: (v: number) => fmtInt(v),
  },
  {
    label: '广告 eCPM',
    value: 'adEcpm',
    column: { title: '广告 eCPM', dataIndex: 'adEcpm', width: 110, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: 'ARPU',
    value: 'arpu',
    column: { title: 'ARPU', dataIndex: 'arpu', width: 110, render: fmtCurrency },
    formatter: (v: unknown) => fmtCurrency(v),
  },
  {
    label: '广告 CTR',
    value: 'adCtr',
    column: { title: '广告 CTR', dataIndex: 'adCtr', width: 100, render: fmtPercent },
    formatter: (v: number) => fmtPercent(v),
  },
  {
    label: '广告匹配率',
    value: 'adMatchRate',
    column: { title: '广告匹配率', dataIndex: 'adMatchRate', width: 110, render: fmtPercent },
    formatter: (v: number) => fmtPercent(v),
  },
  {
    label: '广告展示率',
    value: 'adShowRate',
    column: { title: '广告展示率', dataIndex: 'adShowRate', width: 110, render: fmtPercent },
    formatter: (v: number) => fmtPercent(v),
  },
  {
    label: '投放支出',
    value: 'adSpendCost',
    column: { title: '投放支出', dataIndex: 'adSpendCost', width: 110, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '投放 CPI',
    value: 'adSpendCpi',
    column: { title: '投放 CPI', dataIndex: 'adSpendCpi', width: 100, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '投放 CPC',
    value: 'adSpendCpc',
    column: { title: '投放 CPC', dataIndex: 'adSpendCpc', width: 100, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '投放 CPM',
    value: 'adSpendCpm',
    column: { title: '投放 CPM', dataIndex: 'adSpendCpm', width: 100, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '总支出',
    value: 'totalCost',
    column: { title: '总支出', dataIndex: 'totalCost', width: 110, render: fmtCurrency },
    formatter: (v: unknown) => fmtCurrency(v),
  },
  {
    label: '流量使用量',
    value: 'trafficUsageMb',
    column: { title: '流量使用量(MB)', dataIndex: 'trafficUsageMb', width: 130, render: fmtFixed2 },
    formatter: (v: number) => fmtFixed2(v),
  },
  {
    label: '流量支出',
    value: 'trafficCost',
    column: { title: '流量支出', dataIndex: 'trafficCost', width: 110, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: '利润',
    value: 'profit',
    column: { title: '利润', dataIndex: 'profit', width: 100, render: fmtCurrency },
    formatter: (v: number) => fmtCurrency(v),
  },
  {
    label: 'ROI',
    value: 'roi',
    column: { title: 'ROI', dataIndex: 'roi', width: 100, render: fmtRoiPercent },
    formatter: (v: number) => fmtRoiPercent(v),
  },
  {
    label: '更新时间',
    value: 'updatedAt',
    column: {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (v: unknown) => (v ? String(v) : '--'),
    },
    formatter: (v: number) => String(v),
  },
];

const DIMENSION_OPTIONS = [
  {
    label: '日期',
    value: 'reportDate',
    column: { title: '日期', dataIndex: 'reportDate', width: 120 },
  },
  {
    label: '项目编码',
    value: 'projectCode',
    column: { title: '项目编码', dataIndex: 'projectCode', width: 140 },
  },
  {
    label: '国家',
    value: 'country',
    column: { title: '国家', dataIndex: 'country', width: 100, render: (v: string) => fmtCountry(v) },
  },
];

const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

const normalizeCountries = (countries?: string[]) => {
  if (!Array.isArray(countries) || !countries.length) return undefined;
  const normalized = countries
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

const normalizeProjectCodes = (projectCodes?: string[]) => {
  if (!Array.isArray(projectCodes) || !projectCodes.length) return undefined;
  const normalized = projectCodes.map((item) => item.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
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
      messageApi.error(res.msg || '获取项目编码失败');
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
      <UniversalReportTable<API.ProjectReportItem, QueryState>
        storageKey="report.projectReport"
        title="项目报表"
        rowKey={(record) => {
          if (record.id !== undefined && record.id !== null) {
            return String(record.id);
          }
          return [record.reportDate, record.projectCode, record.country, record.updatedAt]
            .filter((item) => Boolean(item))
            .join('|');
        }}
        defaultQuery={{
          dateRange: [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), today],
          projectCodes: undefined,
          countries: undefined,
        }}
        defaultDimensions={['projectCode']}
        defaultMetrics={[
          'newUsers',
          'reportNewUsers',
          'dauUsers',
          'adRevenue',
          'adSpendCost',
          'trafficCost',
          'profit',
          'roi',
        ]}
        enableServerSort
        dimensionOptions={DIMENSION_OPTIONS}
        metricOptions={METRIC_OPTIONS}
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
            {visibleFilterDimensions.includes('projectCode') ? (
              <Form.Item label="项目编码">
                <Select
                  mode="multiple"
                  value={query.projectCodes}
                  onChange={(value) =>
                    setQuery((prev) => ({ ...prev, projectCodes: value?.length ? value : undefined }))
                  }
                  options={projectOptions.map((item) => ({ label: item, value: item }))}
                  showSearch
                  allowClear
                  placeholder="请选择项目编码"
                  onSearch={(value) => refreshProjectCodes(value)}
                  filterOption={false}
                  style={{ width: 260 }}
                  maxTagCount="responsive"
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('country') ? (
              <Form.Item label="国家">
                <Select
                  mode="tags"
                  allowClear
                  maxTagCount="responsive"
                  style={{ width: 220 }}
                  placeholder="请选择国家，支持输入"
                  tokenSeparators={[',', '，', ' ']}
                  value={query.countries}
                  options={COMMON_COUNTRY_OPTIONS.map((code) => ({ label: code, value: code }))}
                  onChange={(value) => {
                    const normalized = (value || [])
                      .map((item) => `${item}`.trim().toUpperCase())
                      .map((item) => item.trim())
                      .filter(Boolean);
                    const deduped = Array.from(new Set(normalized));
                    setQuery((prev) => ({ ...prev, countries: deduped.length ? deduped : undefined }));
                  }}
                />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
          const res = await queryProjectReport({
            dateFrom: query.dateRange[0],
            dateTo: query.dateRange[1],
            groupBy: dimensions.length ? (dimensions as API.ProjectReportDimension[]) : undefined,
            filters: {
              projectCodes: normalizeProjectCodes(query.projectCodes),
              countries: normalizeCountries(query.countries),
            },
            page,
            pageSize,
            orderBy: sorter?.field || sorter?.columnKey,
            orderDirection: toOrderDirection(sorter?.order),
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取项目报表失败');
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

export default ProjectAggregatesPage;
