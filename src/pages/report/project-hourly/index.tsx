import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button, DatePicker, Form, Modal, Select, Space } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  fmtReportHour,
  normalizeAdStatuses,
  normalizeAppPlatforms,
  normalizeCountries,
  normalizeDepartments,
  normalizeProjectCodes,
  toOrderDirection,
} from '@/pages/report/project/reportShared';
import { applyIncludeExcludeField, toIncludeExcludeValue, type ProjectExcludeFilters } from '@/pages/report/project/includeExclude';
import { buildProjectTrendSearch, PROJECT_TREND_DASHBOARD_PATH } from '@/pages/report/project-trend/utils';
import { aggregateHourly, getProjectCodes, getProjectDepartments, getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';
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

type SyncHourlyFormValues = {
  dateRange: [Dayjs, Dayjs];
  hourFrom?: number;
  hourTo?: number;
  projectId?: number;
};

const REAL_PROJECT_HOURLY_DIMENSIONS: API.ProjectHourlyReportDimension[] = ['reportDate', 'hour', 'projectCode', 'country'];

const clearProjectHourlyQueryWhenFilterHidden = (query: QueryState, dimension: string): QueryState => {
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

const createDefaultSyncFormValues = (): SyncHourlyFormValues => ({
  dateRange: [dayjs(), dayjs()],
  hourFrom: DEFAULT_HOURLY_REPORT_HOUR,
  hourTo: DEFAULT_HOURLY_REPORT_HOUR,
  projectId: undefined,
});

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

const ProjectHourlyReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [syncForm] = Form.useForm<SyncHourlyFormValues>();
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectCodeOptions, setProjectCodeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [appliedState, setAppliedState] = useState<AppliedReportState | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const projectOptionsLoadedRef = useRef(false);

  const syncProjectOptions = useMemo(
    () =>
      projectItems.map((item) => ({
        label: item.projectCode,
        value: item.id,
      })),
    [projectItems],
  );

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
    async () => {
      const res = await getProjectCodes();
      if (res.code !== 0) {
        messageApi.error(res.msg || '获取项目代号失败');
        return;
      }

      const options = (Array.isArray(res.data?.data) ? res.data.data : [])
        .map((item) => (typeof item === 'string' ? item : item?.projectCode))
        .filter((item): item is string => Boolean(item));
      setProjectCodeOptions(Array.from(new Set(options)).map((item) => ({ label: item, value: item })));
    },
    [messageApi],
  );

  const refreshSyncProjects = useCallback(
    async () => {
      const res = await getProjects({
        page: 1,
        pageSize: 200,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '获取项目列表失败');
        return;
      }

      const nextItems = (res.data?.data ?? []).filter(
        (item): item is ProjectItem => Boolean(item?.id) && Boolean(item?.projectCode),
      );
      setProjectItems(nextItems);
    },
    [messageApi],
  );

  const refreshDepartments = useCallback(async () => {
    const res = await getProjectDepartments();
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取部门列表失败');
      return;
    }

    const options = (Array.isArray(res.data?.data) ? res.data.data : [])
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
    refreshSyncProjects();
    refreshDepartments();
  }, [refreshDepartments, refreshProjectCodes, refreshSyncProjects]);

  useEffect(() => {
    if (!syncModalOpen) {
      return;
    }
    syncForm.setFieldsValue(createDefaultSyncFormValues());
  }, [syncForm, syncModalOpen]);

  const openSyncModal = useCallback(() => {
    setSyncModalOpen(true);
  }, []);

  const closeSyncModal = useCallback(() => {
    setSyncModalOpen(false);
  }, []);

  const handleSyncHourly = useCallback(async () => {
    try {
      const values = await syncForm.validateFields();
      const [startDate, endDate] = values.dateRange;
      const resolvedHourFrom = values.hourFrom ?? values.hourTo;
      const resolvedHourTo = values.hourTo ?? values.hourFrom;

      if (
        resolvedHourFrom !== undefined &&
        resolvedHourTo !== undefined &&
        resolvedHourFrom > resolvedHourTo
      ) {
        messageApi.error('开始小时不能大于结束小时');
        return;
      }

      setSyncing(true);
      const res = await aggregateHourly({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        hourFrom: resolvedHourFrom,
        hourTo: resolvedHourTo,
        projectId: values.projectId,
      });

      if (res.code !== 0 || !res.data?.success) {
        messageApi.error(res.msg || res.data?.output || '同步项目小时数据失败');
        return;
      }

      messageApi.success(
        res.data.output
          ? `同步已触发：${res.data.output}`
          : `同步已触发：${res.data.startDate}${
              res.data.hourFrom !== undefined ? ` ${fmtReportHour(res.data.hourFrom)}` : ''
            } - ${res.data.endDate}${
              res.data.hourTo !== undefined ? ` ${fmtReportHour(res.data.hourTo)}` : ''
            }`,
      );
      closeSyncModal();
    } catch (error) {
      if ((error as { errorFields?: unknown[] } | undefined)?.errorFields) {
        return;
      }
      messageApi.error('同步项目小时数据失败');
    } finally {
      setSyncing(false);
    }
  }, [closeSyncModal, messageApi, syncForm]);

  const fetchHourlyReportData = useCallback(
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
    },
    [messageApi],
  );

  return (
    <PageContainer
      extra={[
        <Button key="sync-hourly" loading={syncing} onClick={openSyncModal}>
          同步小时数据
        </Button>,
      ]}
    >
      <Modal
        destroyOnHidden
        title="同步小时数据"
        open={syncModalOpen}
        confirmLoading={syncing}
        onCancel={closeSyncModal}
        onOk={handleSyncHourly}
      >
        <Form form={syncForm} layout="vertical" initialValues={createDefaultSyncFormValues()}>
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker presets={DATE_PRESETS} allowClear={false} />
          </Form.Item>
          <Form.Item label="小时">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="hourFrom" noStyle>
                <Select
                  allowClear
                  style={{ width: '50%' }}
                  options={HOUR_OPTIONS}
                  placeholder="开始小时"
                />
              </Form.Item>
              <Form.Item name="hourTo" noStyle>
                <Select
                  allowClear
                  style={{ width: '50%' }}
                  options={HOUR_OPTIONS}
                  placeholder="结束小时"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="projectId" label="项目编号">
            <Select
              allowClear
              showSearch
              filterOption
              placeholder="默认全部项目"
              options={syncProjectOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
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
          exclude: undefined,
          adStatuses: undefined,
          appPlatforms: undefined,
          departments: undefined,
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
        clearQueryWhenFilterHidden={clearProjectHourlyQueryWhenFilterHidden}
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
                allowClear
                style={{ width: 110 }}
                options={HOUR_OPTIONS}
                placeholder="全部小时"
                onChange={(value) => setQuery((prev) => ({ ...prev, hour: value }))}
              />
            </Form.Item>
            {visibleFilterDimensions.includes('projectCode') ? (
              <Form.Item label="项目代号">
                <IncludeExcludeSelect
                  mode="multiple"
                  value={toIncludeExcludeValue(query.projectCodes, query.exclude?.projectCodes)}
                  onChange={(value) => setQuery((prev) => applyIncludeExcludeField(prev, 'projectCodes', value))}
                  options={projectCodeOptions}
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
                  onChange={(value) => setQuery((prev) => applyIncludeExcludeField(prev, 'countries', value))}
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
                    const normalized = (value || []).map((item) => `${item}`.trim()).filter(Boolean);
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
        fetchData={fetchHourlyReportData}
      />
    </PageContainer>
  );
};

export default ProjectHourlyReportPage;
