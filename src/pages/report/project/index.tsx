import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, DatePicker, Form, Select } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import IncludeExcludeSelect from '@/components/report/IncludeExcludeSelect';
import {
  type DateRangePreset,
  getPresetByDateRange,
  resolveDateRangeByPreset,
  STANDARD_DATE_PRESET_ITEMS,
  toRangePickerPresets,
} from '@/components/report/reportDatePreset';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { PROJECT_AD_STATUS_OPTIONS, PROJECT_APP_PLATFORM_OPTIONS } from '@/pages/project/constants';
import {
  AD_STATUS_DISPLAY_DIMENSION,
  DEPARTMENT_DISPLAY_DIMENSION,
  APP_PLATFORM_DISPLAY_DIMENSION,
  COMMON_COUNTRY_OPTIONS,
  PROJECT_REPORT_METRIC_OPTIONS,
  createProjectDimensionOptions,
  normalizeAdStatuses,
  normalizeAppPlatforms,
  normalizeCountries,
  normalizeDepartments,
  normalizeProjectCodes,
  toOrderDirection,
} from '@/pages/report/project/reportShared';
import {
  applyIncludeExcludeField,
  toIncludeExcludeValue,
  type ProjectExcludeFilters,
} from '@/pages/report/project/includeExclude';
import { buildProjectTrendSearch, PROJECT_TREND_DASHBOARD_PATH } from '@/pages/report/project-trend/utils';
import { getProjectDepartments, getProjects } from '@/services/project/api';
import { exportProjectReport, queryProjectReport } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

type QueryState = {
  dateRange: [string, string];
  dateRangePreset?: DateRangePreset;
  projectCodes?: string[];
  countries?: string[];
  exclude?: ProjectExcludeFilters;
  adStatuses?: string[];
  appPlatforms?: string[];
  departments?: string[];
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

const REAL_PROJECT_REPORT_DIMENSIONS: API.ProjectReportDimension[] = ['reportDate', 'projectCode', 'country'];

const clearProjectReportQueryWhenFilterHidden = (
  query: QueryState,
  dimension: string,
): QueryState => {
  if (dimension === 'projectCode') {
    return {
      ...query,
      projectCodes: undefined,
      exclude: query.exclude
        ? {
            ...query.exclude,
            projectCodes: undefined,
          }
        : undefined,
    };
  }

  if (dimension === 'country') {
    return {
      ...query,
      countries: undefined,
      exclude: query.exclude
        ? {
            ...query.exclude,
            countries: undefined,
          }
        : undefined,
    };
  }

  if (dimension === AD_STATUS_DISPLAY_DIMENSION) {
    return {
      ...query,
      adStatuses: undefined,
    };
  }

  if (dimension === APP_PLATFORM_DISPLAY_DIMENSION) {
    return {
      ...query,
      appPlatforms: undefined,
    };
  }

  if (dimension === DEPARTMENT_DISPLAY_DIMENSION) {
    return {
      ...query,
      departments: undefined,
    };
  }

  return query;
};

const buildProjectReportQuery = (
  query: QueryState,
  dimensions: string[],
  sorter?: ReportSorterState,
): API.ProjectReportQuery => {
  const backendDimensions = dimensions.filter(
    (dimension): dimension is API.ProjectReportDimension =>
      REAL_PROJECT_REPORT_DIMENSIONS.includes(dimension as API.ProjectReportDimension),
  );
  const resolvedDateRange =
    resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset) || query.dateRange;

  return {
    dateFrom: resolvedDateRange[0],
    dateTo: resolvedDateRange[1],
    groupBy: backendDimensions.length ? backendDimensions : undefined,
    filters: {
      projectCodes: normalizeProjectCodes(query.projectCodes),
      countries: normalizeCountries(query.countries),
      exclude: {
        projectCodes: normalizeProjectCodes(query.exclude?.projectCodes),
        countries: normalizeCountries(query.exclude?.countries),
      },
      adStatuses: normalizeAdStatuses(query.adStatuses),
      appPlatforms: normalizeAppPlatforms(query.appPlatforms),
      departments: normalizeDepartments(query.departments),
    },
    orderBy: sorter?.field || sorter?.columnKey,
    orderDirection: toOrderDirection(sorter?.order),
  };
};

const ProjectAggregatesPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [appliedState, setAppliedState] = useState<AppliedReportState | null>(null);
  const projectOptionsLoadedRef = useRef(false);

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

  const dimensionOptions = createProjectDimensionOptions({ onJump: handleJumpToDashboard });

  const refreshProjectCodes = useCallback(async () => {
    const res = await getProjects({
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

  const refreshDepartments = useCallback(async () => {
    const res = await getProjectDepartments();
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取部门列表失败');
      return;
    }

    const options = (Array.isArray(res.data) ? res.data : [])
      .map((item) => `${item}`.trim())
      .filter(Boolean);
    setDepartmentOptions(Array.from(new Set(options)));
  }, [messageApi]);

  useEffect(() => {
    if (projectOptionsLoadedRef.current) {
      return;
    }
    projectOptionsLoadedRef.current = true;
    refreshProjectCodes();
    refreshDepartments();
  }, [refreshDepartments, refreshProjectCodes]);

  const fetchProjectReportData = useCallback(
    async ({
      query,
      page,
      pageSize,
      dimensions,
      sorter,
    }: {
      query: QueryState;
      page: number;
      pageSize: number;
      dimensions: string[];
      sorter?: ReportSorterState;
    }) => {
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
    },
    [messageApi],
  );

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
          exclude: undefined,
          adStatuses: undefined,
          appPlatforms: undefined,
          departments: undefined,
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
        defaultVisibleFilterDimensions={['projectCode', 'country']}
        metricOptions={PROJECT_REPORT_METRIC_OPTIONS}
        clearQueryWhenFilterHidden={clearProjectReportQueryWhenFilterHidden}
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
                  const nextDateRange: [string, string] = [
                    start.format('YYYY-MM-DD'),
                    end.format('YYYY-MM-DD'),
                  ];
                  setQuery((prev) => ({
                    ...prev,
                    dateRange: nextDateRange,
                    dateRangePreset: getPresetByDateRange(
                      STANDARD_DATE_PRESET_ITEMS,
                      nextDateRange,
                    ),
                  }));
                }}
              />
            </Form.Item>
            {visibleFilterDimensions.includes('projectCode') ? (
              <Form.Item label="项目代号">
                <IncludeExcludeSelect
                  mode="multiple"
                  value={toIncludeExcludeValue(query.projectCodes, query.exclude?.projectCodes)}
                  onChange={(value) =>
                    setQuery((prev) => applyIncludeExcludeField(prev, 'projectCodes', value))
                  }
                  options={projectOptions.map((item) => ({ label: item, value: item }))}
                  showSearch
                  allowClear
                  placeholder="请选择项目代号"
                  filterOption
                  style={{ width: 260 }}
                  maxTagCount="responsive"
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('country') ? (
              <Form.Item label="国家">
                <IncludeExcludeSelect
                  mode="tags"
                  allowClear
                  maxTagCount="responsive"
                  style={{ width: 220 }}
                  placeholder="请选择国家，支持输入"
                  tokenSeparators={[',', '，', ' ']}
                  value={toIncludeExcludeValue(query.countries, query.exclude?.countries)}
                  options={COMMON_COUNTRY_OPTIONS.map((code) => ({ label: code, value: code }))}
                  normalizeValue={(item) => `${item}`.trim().toUpperCase()}
                  onChange={(value) =>
                    setQuery((prev) => applyIncludeExcludeField(prev, 'countries', value))
                  }
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes(AD_STATUS_DISPLAY_DIMENSION) ? (
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
                    setQuery((prev) => ({
                      ...prev,
                      adStatuses: deduped.length ? deduped : undefined,
                    }));
                  }}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes(APP_PLATFORM_DISPLAY_DIMENSION) ? (
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
                    setQuery((prev) => ({
                      ...prev,
                      appPlatforms: deduped.length ? deduped : undefined,
                    }));
                  }}
                />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes(DEPARTMENT_DISPLAY_DIMENSION) ? (
              <Form.Item label="部门">
                <Select
                  mode="tags"
                  allowClear
                  maxTagCount="responsive"
                  style={{ width: 240 }}
                  placeholder="请选择部门，支持输入"
                  tokenSeparators={[',', '，', ' ']}
                  value={query.departments}
                  options={departmentOptions.map((item) => ({ label: item, value: item }))}
                  onChange={(value) => {
                    const normalized = (value || [])
                      .map((item) => `${item}`.trim())
                      .filter(Boolean);
                    const deduped = Array.from(new Set(normalized));
                    setQuery((prev) => ({
                      ...prev,
                      departments: deduped.length ? deduped : undefined,
                    }));
                  }}
                />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={fetchProjectReportData}
      />
    </PageContainer>
  );
};

export default ProjectAggregatesPage;
