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
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { getFilterOptions, queryNodeDailyReport } from '@/services/firebase-analytics/api';
import type {
  FilterOption,
  FilterOptionsResponse,
  FirebaseNodeDailyReportItem,
  FirebaseNodeDailyReportOrderBy,
  FirebaseNodeDailyReportQueryParams,
} from '@/services/firebase-analytics/types';
import { formatNumber, formatRate, toRequestOrder } from '@/utils/firebase-analytics';

const DEFAULT_PAGE_SIZE = 100;

type NodeReportFilterValues = {
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  appId?: string;
  platform?: string;
  appVersion?: string;
};

type NodeReportTableItem = FirebaseNodeDailyReportItem & {
  isSummary?: boolean;
};

const getDefaultDateRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [
  dayjs().subtract(14, 'day').startOf('day'),
  dayjs().endOf('day'),
];

const getDefaultFilters = (): NodeReportFilterValues => ({
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
): Pick<FirebaseNodeDailyReportQueryParams, 'orderBy' | 'orderDirection'> => {
  const sorter = Object.entries(sort).find(([, order]) => Boolean(order));
  if (!sorter) return {};

  const [orderBy, order] = sorter;
  return {
    orderBy: orderBy as FirebaseNodeDailyReportOrderBy,
    orderDirection: toRequestOrder(order),
  };
};

const buildRequestParams = (
  params: Record<string, any>,
  sort: Record<string, SortOrder>,
): FirebaseNodeDailyReportQueryParams => {
  const [start, end] = (params.dateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined) || getDefaultDateRange();
  const filters: FirebaseNodeDailyReportQueryParams['filters'] = {};

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

const shouldShowSummary = (summary: FirebaseNodeDailyReportItem | undefined, total: number) => {
  if (!summary) return false;
  return (
    total > 0 ||
    toNumber(summary.clientConnectCount) > 0 ||
    toNumber(summary.activeUserCount) > 0 ||
    summary.avgPingMs !== undefined && summary.avgPingMs !== null
  );
};

const NodeReportPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = ProForm.useForm<NodeReportFilterValues>();
  const [queryState, setQueryState] = useState<NodeReportFilterValues>(() => getDefaultFilters());
  const [options, setOptions] = useState<Partial<FilterOptionsResponse>>({});
  const [optionsLoading, setOptionsLoading] = useState(false);

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

  const columns = useMemo<ProColumns<NodeReportTableItem>[]>(
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
        <ProForm<NodeReportFilterValues>
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
          </Space>
        </ProForm>
      </Card>

      <ProTable<NodeReportTableItem>
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
            const res = await queryNodeDailyReport(buildRequestParams(params, sort));
            const report = res.data;
            const rows = report?.data || [];
            const summaryRows = shouldShowSummary(report?.summary, report?.total || 0)
              ? [{ ...report.summary, isSummary: true }]
              : [];

            return {
              data: [...summaryRows, ...rows],
              total: report?.total || 0,
              success: true,
            };
          } catch (error: any) {
            message.error(error?.message || '获取节点报表失败');
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
        rowClassName={(record) => (record.isSummary ? 'firebase-node-report-summary-row' : '')}
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

export default NodeReportPage;
