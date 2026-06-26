import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, DatePicker, Form, Select, Tag } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import {
  type DateRangePreset,
  getPresetByDateRange,
  resolveDateRangeByPreset,
  STANDARD_DATE_PRESET_ITEMS,
  toRangePickerPresets,
} from '@/components/report/reportDatePreset';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { getProjects } from '@/services/project/api';
import { exportProjectReport, queryProjectReport } from '@/services/report/api';
import { PROJECT_APP_PLATFORM_OPTIONS, PROJECT_AD_STATUS_OPTIONS } from '@/pages/project/constants';
import { buildProjectTrendSearch, PROJECT_TREND_DASHBOARD_PATH } from '@/pages/report/project-trend/utils';

const { RangePicker } = DatePicker;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

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
  dateRangePreset?: DateRangePreset;
  projectCodes?: string[];
  countries?: string[];
  adStatuses?: string[];
  appPlatforms?: string[];
};

type ReportSorterState = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

type AppliedReportState = {
  query: QueryState;
  dimensions: string[];
  metrics: string[];
  sorter?: ReportSorterState;
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

const fmtRevenueWithDiff = (adRevenue: unknown, record?: Record<string, unknown>) => {
  const revenueText = fmtCurrency(adRevenue);
  if (revenueText === '--') return revenueText;

  const diffValue = record?.adRevenueDiff;
  const diffText = fmtCurrency(diffValue);
  if (diffText === '--') return revenueText;

  return `${revenueText} (${diffText})`;
};

const fmtFixed2 = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtTraffic = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  if (n >= 1024) return `${(n / 1024).toFixed(2)} GB`;
  return `${n.toFixed(2)} MB`;
}

const fmtPercent = (v: unknown) => {
  const n = toSafeNumber(v);
  if (n === null) return '--';
  return `${n.toFixed(2)}%`;
};

const getTrafficCostRatio = (record?: Record<string, unknown>) => {
  const explicitRatio = toSafeNumber(record?.trafficCostRatio);
  if (explicitRatio !== null) return explicitRatio * 100;

  const trafficCost = toSafeNumber(record?.trafficCost);
  const totalCost = toSafeNumber(record?.totalCost);
  if (trafficCost === null || totalCost === null || totalCost === 0) return null;
  return (trafficCost / totalCost) * 100;
};

const fmtTrafficCostWithRatio = (trafficCost: unknown, record?: Record<string, unknown>) => {
  const costText = fmtCurrency(trafficCost);
  if (costText === '--') return costText;

  const ratio = getTrafficCostRatio(record);
  if (ratio === null) return costText;
  return `${costText} (${fmtPercent(ratio)})`;
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

const getAdStatusLabel = (adStatus?: string | null) => {
  const normalized = adStatus?.trim();
  if (!normalized) return undefined;
  return normalized;
};

const getAdStatusColor = (adStatus?: string | null) => {
  if (adStatus === '在投') return 'green';
  if (adStatus === '暂停') return 'orange';
  if (adStatus === '未上线') return 'default';
  return 'blue';
};

const getAppPlatformLabel = (appPlatform?: string | null) => {
  const normalized = appPlatform?.trim().toUpperCase();
  if (!normalized) return undefined;
  if (normalized === 'IOS') return 'iOS';
  if (normalized === 'ANDROID') return 'Android';
  return normalized;
};

const getAppPlatformColor = (appPlatform?: string | null) => {
  const normalized = appPlatform?.trim().toUpperCase();
  if (normalized === 'IOS') return 'purple';
  if (normalized === 'ANDROID') return 'cyan';
  return 'blue';
};

const getIsLimitTagMeta = (isLimited: unknown) => {
  if (isLimited === true || isLimited === 'true' || isLimited === 1 || isLimited === '1') {
    return { label: '限流', color: 'red' as const };
  }
  if (isLimited === false || isLimited === 'false' || isLimited === 0 || isLimited === '0') {
    return null;
  }
  return { label: '未知', color: 'default' as const };
};

const adRevenueMetricTooltip = '广告收入（最新广告收入差值）';

const trafficCostMetricTooltip = '流量费用（流量花费占比）';

const renderProjectCodeWithAdStatus = (
  projectCode: unknown,
  record: API.ProjectReportItem,
  onJump?: (projectCode: string, record: API.ProjectReportItem) => void,
) => {
  const codeText = projectCode ? String(projectCode) : '--';
  const adStatus = typeof record.adStatus === 'string' ? record.adStatus : undefined;
  const adStatusLabel = getAdStatusLabel(adStatus);
  const appPlatform = typeof record.appPlatform === 'string' ? record.appPlatform : undefined;
  const appPlatformLabel = getAppPlatformLabel(appPlatform);
  const isLimitTagMeta = getIsLimitTagMeta(record.isLimited);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
      {projectCode && onJump ? (
        <a
          onClick={(event) => {
            event.preventDefault();
            onJump(String(projectCode), record);
          }}
          style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {codeText}
        </a>
      ) : (
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{codeText}</span>
      )}
      {appPlatformLabel ? (
        <Tag color={getAppPlatformColor(appPlatform)} style={{ marginInlineEnd: 0 }}>
          {appPlatformLabel}
        </Tag>
      ) : null}
      {adStatusLabel ? (
        <Tag color={getAdStatusColor(adStatus)} style={{ marginInlineEnd: 0 }}>
          投放-{adStatusLabel}
        </Tag>
      ) : null}
      
      {isLimitTagMeta ? (
        <Tag color={isLimitTagMeta.color} style={{ marginInlineEnd: 0 }}>
          {isLimitTagMeta.label}
        </Tag>
      ) : null}
    </span>
  );
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
    tooltip: adRevenueMetricTooltip,
    column: {
      title: '广告收入',
      tooltip: adRevenueMetricTooltip,
      dataIndex: 'adRevenue',
      width: 150,
      render: (value: unknown, record: API.ProjectReportItem) => fmtRevenueWithDiff(value, record),
    },
    formatter: (v: number, record?: Record<string, unknown>) => fmtRevenueWithDiff(v, record),
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
    column: { title: '流量使用量', dataIndex: 'trafficUsageMb', width: 130, render: fmtTraffic },
    formatter: (v: number) => fmtTraffic(v),
  },
  {
    label: '流量费用',
    value: 'trafficCost',
    tooltip: trafficCostMetricTooltip,
    column: {
      title: '流量费用',
      tooltip: trafficCostMetricTooltip,
      dataIndex: 'trafficCost',
      width: 150,
      render: (v: unknown, record: API.ProjectReportItem) => fmtTrafficCostWithRatio(v, record),
    },
    formatter: (v: number, record?: Record<string, unknown>) => fmtTrafficCostWithRatio(v, record),
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

const createDimensionOptions = (
  onJump?: (projectCode: string, record: API.ProjectReportItem) => void,
) => [
  {
    label: '日期',
    value: 'reportDate',
    column: { title: '日期', dataIndex: 'reportDate', width: 120 },
  },
  {
    label: '项目编码',
    value: 'projectCode',
    column: {
      title: '项目编码',
      dataIndex: 'projectCode',
      width: 180,
      render: (v: unknown, record: API.ProjectReportItem) => renderProjectCodeWithAdStatus(v, record, onJump),
    },
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

const normalizeAdStatuses = (adStatuses?: string[]) => {
  if (!Array.isArray(adStatuses) || !adStatuses.length) return undefined;
  const normalized = adStatuses.map((item) => item.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

const normalizeAppPlatforms = (appPlatforms?: string[]) => {
  if (!Array.isArray(appPlatforms) || !appPlatforms.length) return undefined;
  const normalized = appPlatforms
    .map((item) => `${item}`.trim().toUpperCase())
    .filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

type ReportSorter = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

const buildProjectReportQuery = (
  query: QueryState,
  dimensions: string[],
  sorter?: ReportSorter,
): API.ProjectReportQuery => {
  const resolvedDateRange =
    resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset) || query.dateRange;
  return {
    dateFrom: resolvedDateRange[0],
    dateTo: resolvedDateRange[1],
    groupBy: dimensions.length ? (dimensions as API.ProjectReportDimension[]) : undefined,
    filters: {
      projectCodes: normalizeProjectCodes(query.projectCodes),
      countries: normalizeCountries(query.countries),
      adStatuses: normalizeAdStatuses(query.adStatuses),
      appPlatforms: normalizeAppPlatforms(query.appPlatforms),
    },
    orderBy: sorter?.field || sorter?.columnKey,
    orderDirection: toOrderDirection(sorter?.order),
  };
};

const ProjectAggregatesPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [appliedState, setAppliedState] = useState<AppliedReportState | null>(null);

  const handleJumpToDashboard = useCallback(
    (projectCode: string, record: API.ProjectReportItem) => {
      const dateRange =
        resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, appliedState?.query.dateRangePreset) ||
        appliedState?.query.dateRange ||
        [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), today];
      const adStatus =
        appliedState?.query.adStatuses?.[0] ||
        (typeof record.adStatus === 'string' ? record.adStatus : undefined);
      const search = buildProjectTrendSearch({
        projectCode,
        dateFrom: dateRange[0],
        dateTo: dateRange[1],
        adStatus,
        from: 'report-project',
      });
      history.push(`${PROJECT_TREND_DASHBOARD_PATH}?${search}`);
    },
    [appliedState, today],
  );

  const dimensionOptions = createDimensionOptions(handleJumpToDashboard);

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
          dateRangePreset: 'yesterdayToToday',
          projectCodes: undefined,
          countries: undefined,
          adStatuses: undefined,
          appPlatforms: undefined,
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
        showGrandSummary
        enableServerSort
        exportAction={{
          label: '导出 CSV',
          run: async ({ query, dimensions, sorter }) => {
            const result = await exportProjectReport(buildProjectReportQuery(query, dimensions, sorter));
            return {
              blob: result.blob,
              filename: result.filename || 'project_report_daily.csv',
            };
          },
        }}
        transformViewQuery={(query) => {
          const resolved = resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset);
          if (!resolved) return query;
          return { ...query, dateRange: resolved };
        }}
        dimensionOptions={dimensionOptions}
        metricOptions={METRIC_OPTIONS}
        onAppliedStateChange={setAppliedState}
        renderFilters={({ query, setQuery, visibleFilterDimensions }) => (
          <Form layout="inline" style={{ rowGap: 4 }}>
            <Form.Item label="日期范围">
              <RangePicker
                value={(() => {
                  const resolved = resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset);
                  const [start, end] = resolved || query.dateRange;
                  return [dayjs(start), dayjs(end)] as [dayjs.Dayjs, dayjs.Dayjs];
                })()}
                presets={DATE_PRESETS}
                onChange={(dates) => {
                  const [start, end] = dates ?? [];
                  if (!start || !end) return;
                  const nextDateRange: [string, string] = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
                  setQuery((prev) => ({
                    ...prev,
                    dateRange: nextDateRange,
                    dateRangePreset: getPresetByDateRange(STANDARD_DATE_PRESET_ITEMS, nextDateRange),
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
            <Form.Item label="投放状态">
              <Select
                mode="tags"
                allowClear
                maxTagCount="responsive"
                style={{ width: 240 }}
                placeholder="请选择投放状态，支持输入"
                tokenSeparators={[',', '，', ' ']}
                value={query.adStatuses}
                options={PROJECT_AD_STATUS_OPTIONS}
                onChange={(value) => {
                  const normalized = (value || [])
                    .map((item) => `${item}`.trim())
                    .filter(Boolean);
                  const deduped = Array.from(new Set(normalized));
                  setQuery((prev) => ({ ...prev, adStatuses: deduped.length ? deduped : undefined }));
                }}
              />
            </Form.Item>
            <Form.Item label="应用平台">
              <Select
                mode="tags"
                allowClear
                maxTagCount="responsive"
                style={{ width: 220 }}
                placeholder="请选择应用平台，支持输入"
                tokenSeparators={[',', '，', ' ']}
                value={query.appPlatforms}
                options={PROJECT_APP_PLATFORM_OPTIONS}
                onChange={(value) => {
                  const normalized = (value || [])
                    .map((item) => `${item}`.trim().toUpperCase())
                    .filter(Boolean);
                  const deduped = Array.from(new Set(normalized));
                  setQuery((prev) => ({ ...prev, appPlatforms: deduped.length ? deduped : undefined }));
                }}
              />
            </Form.Item>
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
          const res = await queryProjectReport({
            ...buildProjectReportQuery(query, dimensions, sorter),
            page,
            pageSize,
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取项目报表失败');
            return { list: [], total: 0 };
          }

          const payload = res.data;
          const list = Array.isArray(payload?.data) ? payload.data : [];
          const summary =
            payload?.summary && typeof payload.summary === 'object'
              ? (payload.summary as Record<string, unknown>)
              : undefined;
          const total = Number(payload?.total ?? list.length);
          return { list, total, summary };
        }}
      />
    </PageContainer>
  );
};

export default ProjectAggregatesPage;
