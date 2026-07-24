import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProForm,
  ProFormDateRangePicker,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Card, Space, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
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

const DEFAULT_PAGE_SIZE = 100;

type AppConnectionReportFilterValues = {
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  appId?: string;
  platform?: string;
  appVersion?: string;
};

type AppConnectionReportTableItem = FirebaseAppConnectionReportItem & {
  isSummary?: boolean;
};

const getDefaultDateRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [
  dayjs().subtract(14, 'day').startOf('day'),
  dayjs().endOf('day'),
];

const getDefaultFilters = (): AppConnectionReportFilterValues => ({
  dateRange: getDefaultDateRange(),
});

const normalizeOptions = (options?: FilterOption[]) => options || [];

const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const renderCount = (value: unknown) => formatNumber(toNumber(value));

const renderPing = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  return formatNumber(toNumber(value));
};

const renderRate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-';
  return formatRate(toNumber(value));
};

const resolveSorter = (
  sort: Record<string, SortOrder>,
): Pick<FirebaseAppConnectionReportQueryParams, 'orderBy' | 'orderDirection'> => {
  const sorter = Object.entries(sort).find(([, order]) => Boolean(order));
  if (!sorter) return {};

  const [orderBy, order] = sorter;
  return {
    orderBy: orderBy as FirebaseAppConnectionReportOrderBy,
    orderDirection: toRequestOrder(order),
  };
};

const buildRequestParams = (
  params: Record<string, any>,
  sort: Record<string, SortOrder>,
): FirebaseAppConnectionReportQueryParams => {
  const [start, end] = (params.dateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined) || getDefaultDateRange();
  const filters: FirebaseAppConnectionReportQueryParams['filters'] = {};

  if (params.appId) filters.appIds = [String(params.appId)];
  if (params.platform) filters.platforms = [String(params.platform)];
  if (params.appVersion) filters.appVersions = [String(params.appVersion)];

  return {
    dateFrom: start.format('YYYY-MM-DD'),
    dateTo: end.format('YYYY-MM-DD'),
    filters,
    page: params.current || 1,
    pageSize: params.pageSize || DEFAULT_PAGE_SIZE,
    ...resolveSorter(sort),
  };
};

const buildSyncPayload = (values: AppConnectionReportFilterValues) => {
  const [start, end] = values.dateRange || getDefaultDateRange();
  return {
    dateFrom: start.format('YYYY-MM-DD'),
    dateTo: end.format('YYYY-MM-DD'),
  };
};

const AppConnectionReportPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = ProForm.useForm<AppConnectionReportFilterValues>();
  const [queryState, setQueryState] = useState<AppConnectionReportFilterValues>(() => getDefaultFilters());
  const [options, setOptions] = useState<Partial<FilterOptionsResponse>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
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
          message.error(error?.message || '获取筛选项失败');
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
  }, [message]);

  const handleSync = async () => {
    let values: AppConnectionReportFilterValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload = buildSyncPayload(values);
    const days = dayjs(payload.dateTo).diff(dayjs(payload.dateFrom), 'day') + 1;

    modal.confirm({
      title: '同步应用连接数据',
      content:
        days > 31
          ? `将重新聚合 ${payload.dateFrom} 至 ${payload.dateTo} 的应用连接数据，时间范围超过 31 天，可能耗时较长。`
          : `将重新聚合 ${payload.dateFrom} 至 ${payload.dateTo} 的应用连接数据。`,
      okText: '开始同步',
      cancelText: '取消',
      onOk: async () => {
        setSyncLoading(true);
        try {
          const res = await syncAppConnectionReport(payload);
          if (res.data?.success) {
            message.success('应用连接数据同步完成');
            setQueryState(values);
            actionRef.current?.reload();
          } else {
            message.warning(res.data?.message || '应用连接数据同步未完成');
          }
        } catch (error: any) {
          message.error(error?.message || '同步应用连接数据失败');
        } finally {
          setSyncLoading(false);
        }
      },
    });
  };

  const columns = useMemo<ProColumns<AppConnectionReportTableItem>[]>(
    () => [
      {
        title: '应用',
        dataIndex: 'appId',
        key: 'appId',
        width: 160,
        sorter: true,
        render: (_, record) => (record.isSummary ? '-' : record.appId || '-'),
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        width: 130,
        sorter: true,
        render: (_, record) => (record.isSummary ? '-' : record.date || '-'),
      },
      {
        title: '平均ping值',
        dataIndex: 'avgPingMs',
        key: 'avgPingMs',
        width: 130,
        align: 'right',
        sorter: true,
        render: (_, record) => renderPing(record.avgPingMs),
      },
      {
        title: '客户端连接数',
        dataIndex: 'clientConnectCount',
        key: 'clientConnectCount',
        width: 150,
        align: 'right',
        sorter: true,
        render: (_, record) => renderCount(record.clientConnectCount),
      },
      {
        title: '成功次数',
        dataIndex: 'successCount',
        key: 'successCount',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_, record) => renderCount(record.successCount),
      },
      {
        title: '成功率',
        dataIndex: 'successRate',
        key: 'successRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: (_, record) => renderRate(record.successRate),
      },
      {
        title: '失败次数',
        dataIndex: 'failCount',
        key: 'failCount',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_, record) => renderCount(record.failCount),
      },
      {
        title: '失败率',
        dataIndex: 'failRate',
        key: 'failRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: (_, record) => renderRate(record.failRate),
      },
      {
        title: '取消率',
        dataIndex: 'cancelRate',
        key: 'cancelRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: (_, record) => renderRate(record.cancelRate),
      },
      {
        title: '活跃用户数',
        dataIndex: 'activeUserCount',
        key: 'activeUserCount',
        width: 130,
        align: 'right',
        sorter: true,
        render: (_, record) => renderCount(record.activeUserCount),
      },
    ],
    [],
  );

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <ProForm<AppConnectionReportFilterValues>
          form={form}
          layout="inline"
          submitter={false}
          initialValues={queryState}
          onFinish={async (values) => {
            setQueryState(values);
          }}
        >
          <Space wrap size={12}>
            <ProFormDateRangePicker
              name="dateRange"
              label="日期"
              fieldProps={{
                format: 'YYYY-MM-DD',
                allowClear: false,
              }}
            />
            <ProFormSelect
              name="appId"
              label="应用"
              width="md"
              options={normalizeOptions(options.apps)}
              fieldProps={{
                allowClear: true,
                showSearch: true,
                optionFilterProp: 'label',
                loading: optionsLoading,
              }}
            />
            <ProFormSelect
              name="platform"
              label="平台"
              width="sm"
              options={normalizeOptions(options.platforms)}
              fieldProps={{
                allowClear: true,
                showSearch: true,
                optionFilterProp: 'label',
                loading: optionsLoading,
              }}
            />
            <ProFormSelect
              name="appVersion"
              label="版本"
              width="sm"
              options={normalizeOptions(options.versions)}
              fieldProps={{
                allowClear: true,
                showSearch: true,
                optionFilterProp: 'label',
                loading: optionsLoading,
              }}
            />
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                const next = getDefaultFilters();
                form.setFieldsValue(next);
                setQueryState(next);
              }}
            >
              重置
            </Button>
            <Button
              icon={<SyncOutlined />}
              loading={syncLoading}
              onClick={handleSync}
            >
              同步数据
            </Button>
          </Space>
        </ProForm>
      </Card>

      <ProTable<AppConnectionReportTableItem>
        actionRef={actionRef}
        rowKey={(record) => (record.isSummary ? '__summary__' : `${record.appId || '-'}|${record.date || '-'}`)}
        columns={columns}
        search={false}
        params={queryState}
        scroll={{ x: 1350 }}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100, 200],
          showTotal: (total) => `共 ${total} 条`,
        }}
        request={async (params, sort) => {
          try {
            const res = await queryAppConnectionReport(buildRequestParams(params, sort));
            const report = res.data;
            const rows = report?.data || [];
            const summaryRows = report?.summary ? [{ ...report.summary, isSummary: true }] : [];

            return {
              data: [...summaryRows, ...rows],
              total: report?.total || 0,
              success: true,
            };
          } catch (error: any) {
            message.error(error?.message || '获取应用连接报表失败');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        options={{
          reload: true,
          density: true,
          setting: true,
          fullScreen: true,
        }}
        rowClassName={(record) => (record.isSummary ? 'firebase-app-connection-report-summary-row' : '')}
        onRow={(record) => ({
          style: record.isSummary ? { background: '#f8fafc', fontWeight: 600 } : undefined,
        })}
        toolBarRender={false}
      />
      <Typography.Text type="secondary">
        注：Firebase 报表聚合任务每 5 分钟重算最近 72 小时，历史区间请通过报表同步回填。
      </Typography.Text>
    </PageContainer>
  );
};

export default AppConnectionReportPage;
