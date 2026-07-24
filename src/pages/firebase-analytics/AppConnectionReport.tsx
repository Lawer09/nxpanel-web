import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, DatePicker, Form, Modal, Select, Space, Typography } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs, { type Dayjs } from 'dayjs';
import {
  type DateRangePreset,
  getPresetByDateRange,
  resolveDateRangeByPreset,
  STANDARD_DATE_PRESET_ITEMS,
  toRangePickerPresets,
} from '@/components/report/reportDatePreset';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import {
  getFilterOptions,
  queryAppConnectionReport,
  syncAppConnectionReport,
} from '@/services/firebase-analytics/api';
import type {
  FilterOption,
  FilterOptionsResponse,
  FirebaseAppConnectionReportItem,
  FirebaseAppConnectionReportOrderBy,
  FirebaseAppConnectionReportQueryParams,
} from '@/services/firebase-analytics/types';
import { formatNumber, formatRate, toRequestOrder } from '@/utils/firebase-analytics';

const { RangePicker } = DatePicker;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);
const DEFAULT_PAGE_SIZE = 100;

type QueryState = {
  dateRange: [string, string];
  dateRangePreset?: DateRangePreset;
  appIds?: string[];
  platforms?: string[];
  appVersions?: string[];
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

type SyncFormValues = {
  dateRange: [Dayjs, Dayjs];
};

const getDefaultReportDateRange = (): [string, string] => [
  dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
];

const getDefaultQuery = (): QueryState => ({
  dateRange: getDefaultReportDateRange(),
  dateRangePreset: 'custom',
});

const normalizeOptions = (options?: FilterOption[]) => options || [];

const normalizeMultiValue = (values?: string[]) => {
  if (!Array.isArray(values) || !values.length) return undefined;
  const normalized = values.map((item) => `${item}`.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const renderText = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : value;
  return text ? String(text) : '--';
};

const renderApp = (_value: unknown, record: FirebaseAppConnectionReportItem) => {
  const appId = typeof record.appId === 'string' ? record.appId.trim() : '';
  if (!appId) return '--';

  const projectCode = record.projectCode?.trim();
  const ownerName = record.projectOwnerName?.trim();
  const meta = [
    projectCode ? `代号：${projectCode}` : undefined,
    ownerName ? `负责人：${ownerName}` : undefined,
  ].filter(Boolean);

  return (
    <Space direction="vertical" size={0}>
      <span>{appId}</span>
      {meta.length ? (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {meta.join(' / ')}
        </Typography.Text>
      ) : null}
    </Space>
  );
};

const renderCount = (value: unknown) => formatNumber(toNumber(value));

const renderPing = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--';
  return formatNumber(toNumber(value));
};

const renderRate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--';
  return formatRate(toNumber(value));
};

const resolveQueryDateRange = (query?: QueryState): [string, string] =>
  resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query?.dateRangePreset) ||
  query?.dateRange ||
  getDefaultReportDateRange();

const clearQueryWhenFilterHidden = (query: QueryState, dimension: string): QueryState => {
  if (dimension === 'appId') {
    return { ...query, appIds: undefined };
  }
  if (dimension === 'platform') {
    return { ...query, platforms: undefined };
  }
  if (dimension === 'appVersion') {
    return { ...query, appVersions: undefined };
  }
  return query;
};

const buildReportQuery = (
  query: QueryState,
  dimensions: string[],
  sorter?: ReportSorterState,
): FirebaseAppConnectionReportQueryParams => {
  const [dateFrom, dateTo] = resolveQueryDateRange(query);
  const orderBy = sorter?.field || sorter?.columnKey;

  return {
    dateFrom,
    dateTo,
    groupBy: dimensions as FirebaseAppConnectionReportQueryParams['groupBy'],
    filters: {
      appIds: normalizeMultiValue(query.appIds),
      platforms: normalizeMultiValue(query.platforms),
      appVersions: normalizeMultiValue(query.appVersions),
    },
    orderBy: orderBy as FirebaseAppConnectionReportOrderBy | undefined,
    orderDirection: toRequestOrder(sorter?.order),
  };
};

const createSyncFormValues = (query?: QueryState): SyncFormValues => {
  const [dateFrom, dateTo] = resolveQueryDateRange(query);
  return {
    dateRange: [dayjs(dateFrom), dayjs(dateTo)],
  };
};

const APP_CONNECTION_DIMENSION_OPTIONS = [
  {
    label: '日期',
    value: 'date',
    column: { title: '日期', dataIndex: 'date', width: 120, render: renderText },
  },
  {
    label: '应用',
    value: 'appId',
    column: { title: '应用', dataIndex: 'appId', width: 280, render: renderApp },
  },
  {
    label: '平台',
    value: 'platform',
    column: { title: '平台', dataIndex: 'platform', width: 110, render: renderText },
  },
  {
    label: '版本',
    value: 'appVersion',
    column: { title: '版本', dataIndex: 'appVersion', width: 130, render: renderText },
  },
];

const APP_CONNECTION_METRIC_OPTIONS = [
  {
    label: '平均 ping 值',
    value: 'avgPingMs',
    column: {
      title: '平均 ping 值',
      dataIndex: 'avgPingMs',
      width: 130,
      align: 'right' as const,
      render: renderPing,
    },
    formatter: (_value: number, record?: Record<string, unknown>) => renderPing(record?.avgPingMs),
  },
  {
    label: '客户端连接数',
    value: 'clientConnectCount',
    column: {
      title: '客户端连接数',
      dataIndex: 'clientConnectCount',
      width: 150,
      align: 'right' as const,
      render: renderCount,
    },
    formatter: (value: number) => renderCount(value),
  },
  {
    label: '成功次数',
    value: 'successCount',
    column: {
      title: '成功次数',
      dataIndex: 'successCount',
      width: 120,
      align: 'right' as const,
      render: renderCount,
    },
    formatter: (value: number) => renderCount(value),
  },
  {
    label: '成功率',
    value: 'successRate',
    column: {
      title: '成功率',
      dataIndex: 'successRate',
      width: 110,
      align: 'right' as const,
      render: renderRate,
    },
    formatter: (value: number) => renderRate(value),
  },
  {
    label: '失败次数',
    value: 'failCount',
    column: {
      title: '失败次数',
      dataIndex: 'failCount',
      width: 120,
      align: 'right' as const,
      render: renderCount,
    },
    formatter: (value: number) => renderCount(value),
  },
  {
    label: '失败率',
    value: 'failRate',
    column: {
      title: '失败率',
      dataIndex: 'failRate',
      width: 110,
      align: 'right' as const,
      render: renderRate,
    },
    formatter: (value: number) => renderRate(value),
  },
  {
    label: '取消率',
    value: 'cancelRate',
    column: {
      title: '取消率',
      dataIndex: 'cancelRate',
      width: 110,
      align: 'right' as const,
      render: renderRate,
    },
    formatter: (value: number) => renderRate(value),
  },
  {
    label: '活跃用户数',
    value: 'activeUserCount',
    column: {
      title: '活跃用户数',
      dataIndex: 'activeUserCount',
      width: 130,
      align: 'right' as const,
      render: renderCount,
    },
    formatter: (value: number) => renderCount(value),
  },
];

const AppConnectionReportPage: React.FC = () => {
  const { message: messageApi, modal } = App.useApp();
  const [syncForm] = Form.useForm<SyncFormValues>();
  const [options, setOptions] = useState<Partial<FilterOptionsResponse>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [appliedState, setAppliedState] = useState<AppliedReportState | null>(null);
  const [syncRefreshKey, setSyncRefreshKey] = useState(0);
  const optionsLoadedRef = useRef(false);

  useEffect(() => {
    if (optionsLoadedRef.current) {
      return;
    }
    optionsLoadedRef.current = true;

    let ignore = false;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const res = await getFilterOptions();
        if (!ignore) {
          setOptions(res.data || {});
        }
      } catch (error: any) {
        if (!ignore) {
          messageApi.error(error?.message || '获取筛选项失败');
          setOptions({});
        }
      } finally {
        if (!ignore) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();
    return () => {
      ignore = true;
    };
  }, [messageApi]);

  const openSyncModal = useCallback(() => {
    syncForm.setFieldsValue(createSyncFormValues(appliedState?.query));
    setSyncModalOpen(true);
  }, [appliedState, syncForm]);

  const closeSyncModal = useCallback(() => {
    setSyncModalOpen(false);
  }, []);

  const handleSync = useCallback(async () => {
    let values: SyncFormValues;
    try {
      values = await syncForm.validateFields();
    } catch {
      return;
    }

    const [start, end] = values.dateRange;
    const payload = {
      dateFrom: start.format('YYYY-MM-DD'),
      dateTo: end.format('YYYY-MM-DD'),
    };
    const days = dayjs(payload.dateTo).diff(dayjs(payload.dateFrom), 'day') + 1;

    const runSync = async () => {
      setSyncing(true);
      try {
        const res = await syncAppConnectionReport(payload);
        if (!res.data?.success) {
          messageApi.error(res.data?.message || '同步应用连接数据失败');
          return;
        }

        messageApi.success(res.data?.message || '同步应用连接数据完成');
        closeSyncModal();
        setSyncRefreshKey((value) => value + 1);
      } catch (error: any) {
        messageApi.error(error?.message || '同步应用连接数据失败');
      } finally {
        setSyncing(false);
      }
    };

    if (days > 31) {
      modal.confirm({
        title: '确认同步较长日期范围',
        content: `将重新聚合 ${payload.dateFrom} 至 ${payload.dateTo} 的应用连接数据，时间范围超过 31 天，可能耗时较长。`,
        okText: '继续同步',
        cancelText: '取消',
        onOk: runSync,
      });
      return;
    }

    await runSync();
  }, [closeSyncModal, messageApi, modal, syncForm]);

  const fetchReportData = useCallback(
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
      try {
        const res = await queryAppConnectionReport({
          ...buildReportQuery(query, dimensions, sorter),
          page,
          pageSize,
        });
        const payload = res.data;
        return {
          list: Array.isArray(payload?.data) ? payload.data : [],
          total: Number(payload?.total ?? 0),
          summary: payload?.summary ? (payload.summary as unknown as Record<string, unknown>) : {},
        };
      } catch (error: any) {
        messageApi.error(error?.message || '获取应用连接报表失败');
        return { list: [], total: 0, summary: {} };
      }
    },
    [messageApi, syncRefreshKey],
  );

  const defaultQuery = useMemo(() => getDefaultQuery(), []);

  return (
    <PageContainer
      extra={[
        <Button key="sync" loading={syncing} onClick={openSyncModal}>
          同步数据
        </Button>,
      ]}
    >
      <Modal
        destroyOnHidden
        title="同步应用连接数据"
        open={syncModalOpen}
        confirmLoading={syncing}
        onCancel={closeSyncModal}
        onOk={handleSync}
      >
        <Form form={syncForm} layout="vertical" initialValues={createSyncFormValues(appliedState?.query)}>
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker presets={DATE_PRESETS} allowClear={false} />
          </Form.Item>
        </Form>
        <Typography.Text type="secondary">
          Firebase 报表聚合任务每 5 分钟重算最近 72 小时，历史区间可在此选择日期范围后同步回填。
        </Typography.Text>
      </Modal>

      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <UniversalReportTable<FirebaseAppConnectionReportItem, QueryState>
          storageKey="firebaseAnalytics.appConnectionReport"
          title="应用连接报表"
          rowKey={(record) => {
            const parts = [record.date, record.appId, record.platform, record.appVersion].filter((item) =>
              Boolean(item),
            );
            return parts.length ? parts.join('|') : '__all__';
          }}
          defaultQuery={defaultQuery}
          defaultDimensions={['date', 'appId']}
          defaultMetrics={[
            'avgPingMs',
            'clientConnectCount',
            'successCount',
            'successRate',
            'failCount',
            'failRate',
            'cancelRate',
            'activeUserCount',
          ]}
          defaultVisibleFilterDimensions={['appId', 'platform', 'appVersion']}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          dimensionOptions={APP_CONNECTION_DIMENSION_OPTIONS}
          metricOptions={APP_CONNECTION_METRIC_OPTIONS}
          showGrandSummary
          enableServerSort
          transformViewQuery={(query) => {
            const resolved = resolveDateRangeByPreset(STANDARD_DATE_PRESET_ITEMS, query.dateRangePreset);
            if (!resolved) return query;
            return { ...query, dateRange: resolved };
          }}
          clearQueryWhenFilterHidden={clearQueryWhenFilterHidden}
          onAppliedStateChange={setAppliedState}
          renderFilters={({ query, setQuery, visibleFilterDimensions }) => (
            <Form layout="inline" style={{ rowGap: 4 }}>
              <Form.Item label="日期范围">
                <RangePicker
                  value={(() => {
                    const [start, end] = resolveQueryDateRange(query);
                    return [dayjs(start), dayjs(end)] as [Dayjs, Dayjs];
                  })()}
                  presets={DATE_PRESETS}
                  allowClear={false}
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
                      dateRangePreset: getPresetByDateRange(STANDARD_DATE_PRESET_ITEMS, nextDateRange),
                    }));
                  }}
                />
              </Form.Item>
              {visibleFilterDimensions.includes('appId') ? (
                <Form.Item label="应用">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: 260 }}
                    placeholder="请选择应用"
                    optionFilterProp="label"
                    loading={optionsLoading}
                    value={query.appIds}
                    options={normalizeOptions(options.apps)}
                    onChange={(value) =>
                      setQuery((prev) => ({ ...prev, appIds: normalizeMultiValue(value) }))
                    }
                  />
                </Form.Item>
              ) : null}
              {visibleFilterDimensions.includes('platform') ? (
                <Form.Item label="平台">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: 180 }}
                    placeholder="请选择平台"
                    optionFilterProp="label"
                    loading={optionsLoading}
                    value={query.platforms}
                    options={normalizeOptions(options.platforms)}
                    onChange={(value) =>
                      setQuery((prev) => ({ ...prev, platforms: normalizeMultiValue(value) }))
                    }
                  />
                </Form.Item>
              ) : null}
              {visibleFilterDimensions.includes('appVersion') ? (
                <Form.Item label="版本">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    maxTagCount="responsive"
                    style={{ width: 220 }}
                    placeholder="请选择版本"
                    optionFilterProp="label"
                    loading={optionsLoading}
                    value={query.appVersions}
                    options={normalizeOptions(options.versions)}
                    onChange={(value) =>
                      setQuery((prev) => ({ ...prev, appVersions: normalizeMultiValue(value) }))
                    }
                  />
                </Form.Item>
              ) : null}
            </Form>
          )}
          fetchData={fetchReportData}
        />
        <Typography.Text type="secondary">
          注：Firebase 报表聚合任务每 5 分钟重算最近 72 小时；更早日期可点击右上角“同步数据”选择范围后回填。
        </Typography.Text>
      </Space>
    </PageContainer>
  );
};

export default AppConnectionReportPage;
