import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, DatePicker, Form, Select } from 'antd';
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
import { PROJECT_AD_STATUS_OPTIONS, PROJECT_APP_PLATFORM_OPTIONS } from '@/pages/project/constants';
import {
  AD_STATUS_DISPLAY_DIMENSION,
  APP_PLATFORM_DISPLAY_DIMENSION,
  COMMON_COUNTRY_OPTIONS,
  PROJECT_REPORT_METRIC_OPTIONS,
  createProjectDimensionOptions,
  fmtReportHour,
  normalizeAdStatuses,
  normalizeAppPlatforms,
  normalizeCountries,
  normalizeProjectCodes,
  toOrderDirection,
} from '@/pages/report/project/reportShared';
import { buildProjectTrendSearch, PROJECT_TREND_DASHBOARD_PATH } from '@/pages/report/project-trend/utils';
import { aggregateHourly, getProjects } from '@/services/project/api';
import { queryProjectHourlyReport } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  label: fmtReportHour(hour),
  value: hour,
}));
const DEFAULT_HOURLY_REPORT_HOUR = (dayjs().hour() + 23) % 24;

type QueryState = {
  dateRange: [string, string];
  dateRangePreset?: DateRangePreset;
  hour?: number;
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

const REAL_PROJECT_HOURLY_DIMENSIONS: API.ProjectHourlyReportDimension[] = ['reportDate', 'hour', 'projectCode', 'country'];

const buildProjectHourlyReportQuery = (
  query: QueryState,
  dimensions: string[],
  sorter?: ReportSorterState,
): API.ProjectHourlyReportQuery => {
  const backendDimensions = dimensions.filter(
    (dimension): dimension is API.ProjectHourlyReportDimension =>
      REAL_PROJECT_HOURLY_DIMENSIONS.includes(dimension as API.ProjectHourlyReportDimension),
  );
  const resolvedDateRange =
    resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset) || query.dateRange;
  return {
    dateFrom: resolvedDateRange[0],
    dateTo: resolvedDateRange[1],
    hourFrom: query.hour,
    hourTo: query.hour,
    groupBy: backendDimensions.length ? backendDimensions : undefined,
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

const ProjectHourlyReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [appliedState, setAppliedState] = useState<AppliedReportState | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleJumpToDashboard = useCallback(
    (projectCode: string, record: API.ProjectReportItem) => {
      const dateRange =
        resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, appliedState?.query.dateRangePreset) ||
        appliedState?.query.dateRange ||
        [today, today];
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

  const dimensionOptions = createProjectDimensionOptions({ onJump: handleJumpToDashboard, includeHour: true });

  const refreshProjectCodes = useCallback(
    async (keyword?: string) => {
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
    },
    [messageApi],
  );

  useEffect(() => {
    refreshProjectCodes();
  }, [refreshProjectCodes]);

  const handleSyncHourly = useCallback(async () => {
    const query = appliedState?.query;
    const resolvedDateRange =
      resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query?.dateRangePreset) ||
      query?.dateRange ||
      [today, today];
    const targetHour = query?.hour ?? DEFAULT_HOURLY_REPORT_HOUR;

    setSyncing(true);
    try {
      const res = await aggregateHourly({
        startDate: resolvedDateRange[0],
        endDate: resolvedDateRange[1],
        hourFrom: targetHour,
        hourTo: targetHour,
      });

      if (res.code !== 0 || !res.data?.success) {
        messageApi.error(res.msg || res.data?.output || '同步项目小时数据失败');
        return;
      }

      messageApi.success(
        res.data.output
          ? `同步已触发：${res.data.output}`
          : `同步已触发：${res.data.startDate} ${fmtReportHour(res.data.hourFrom)} - ${res.data.endDate} ${fmtReportHour(res.data.hourTo)}`,
      );
    } catch {
      messageApi.error('同步项目小时数据失败');
    } finally {
      setSyncing(false);
    }
  }, [appliedState, messageApi, today]);

  return (
    <PageContainer
      extra={[
        <Button key="sync-hourly" loading={syncing} onClick={handleSyncHourly}>
          同步小时数据
        </Button>,
      ]}
    >
      <UniversalReportTable<API.ProjectReportItem, QueryState>
        storageKey="report.projectHourlyReport"
        title="项目小时汇总"
        rowKey={(record) => {
          if (record.id !== undefined && record.id !== null) {
            return String(record.id);
          }
          return [record.reportDate, record.hour, record.projectCode, record.country, record.updatedAt]
            .filter((item) => Boolean(item))
            .join('|');
        }}
        defaultQuery={{
          dateRange: [today, today],
          dateRangePreset: 'today',
          hour: DEFAULT_HOURLY_REPORT_HOUR,
          projectCodes: undefined,
          countries: undefined,
          adStatuses: undefined,
          appPlatforms: undefined,
        }}
        defaultDimensions={['reportDate', 'hour', 'projectCode']}
        defaultMetrics={['newUsers', 'reportNewUsers', 'dauUsers', 'adRevenue', 'adSpendCost', 'trafficCost', 'profit', 'roi']}
        showGrandSummary
        enableServerSort
        transformViewQuery={(query) => {
          const resolved = resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset);
          if (!resolved) return query;
          return { ...query, dateRange: resolved };
        }}
        dimensionOptions={dimensionOptions}
        defaultVisibleFilterDimensions={['projectCode', 'country']}
        metricOptions={PROJECT_REPORT_METRIC_OPTIONS}
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
            <Form.Item label="小时">
              <Select
                value={query.hour}
                style={{ width: 110 }}
                options={HOUR_OPTIONS}
                onChange={(value) => setQuery((prev) => ({ ...prev, hour: value }))}
              />
            </Form.Item>
            {visibleFilterDimensions.includes('projectCode') ? (
              <Form.Item label="项目编码">
                <Select
                  mode="multiple"
                  value={query.projectCodes}
                  onChange={(value) => setQuery((prev) => ({ ...prev, projectCodes: value?.length ? value : undefined }))}
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
                      .filter(Boolean);
                    const deduped = Array.from(new Set(normalized));
                    setQuery((prev) => ({ ...prev, countries: deduped.length ? deduped : undefined }));
                  }}
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
                    const normalized = (value || []).map((item) => `${item}`.trim()).filter(Boolean);
                    const deduped = Array.from(new Set(normalized));
                    setQuery((prev) => ({ ...prev, adStatuses: deduped.length ? deduped : undefined }));
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
                    const normalized = (value || []).map((item) => `${item}`.trim().toUpperCase()).filter(Boolean);
                    const deduped = Array.from(new Set(normalized));
                    setQuery((prev) => ({ ...prev, appPlatforms: deduped.length ? deduped : undefined }));
                  }}
                />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
          const res = await queryProjectHourlyReport({
            ...buildProjectHourlyReportQuery(query, dimensions, sorter),
            page,
            pageSize,
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取项目小时汇总失败');
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

export default ProjectHourlyReportPage;
