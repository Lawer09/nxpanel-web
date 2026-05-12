import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Input, InputNumber } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import React from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { queryUserReportHourly } from '@/services/report/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  { label: '今日', value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近三天', value: [dayjs().subtract(2, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

type QueryState = {
  dateRange: [string, string];
  hourFrom?: number;
  hourTo?: number;
  userId?: number;
  appId?: string;
  appVersion?: string;
  country?: string;
};

type ReportSorter = {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
};

const DIMENSIONS = [
  { label: '日期', value: 'date', backendField: 'date' },
  { label: '小时', value: 'hour', backendField: 'hour' },
  { label: '用户ID', value: 'userId', backendField: 'user_id' },
  { label: '应用ID', value: 'appId', backendField: 'app_id' },
  { label: '应用版本', value: 'appVersion', backendField: 'app_version' },
  { label: '国家', value: 'country', backendField: 'country' },
];

const METRICS = [
  { label: '用户上报流量', value: 'trafficUsage' },
  { label: '用户上报时长(s)', value: 'trafficUseTime' },
  { label: '节点上报上传流量(MB)', value: 'trafficUpload' },
  { label: '节点上报下载流量(MB)', value: 'trafficDownload' },
  { label: '用户侧上报数', value: 'reportCountUser' },
  { label: '节点侧上报数', value: 'reportCountNode' },
];

const DIMENSION_TO_BACKEND = DIMENSIONS.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.backendField;
  return acc;
}, {});

const TRAFFIC_FIELDS = new Set(['trafficUsage', 'trafficUpload', 'trafficDownload']);

const toNumber = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const fmtNumber = (value: any) => toNumber(value).toLocaleString();
const fmtKBtoMB = (value: any) => `${(toNumber(value) / 1024).toFixed(2)} MB`;

const toSnakeCase = (value: string) => value.replace(/([A-Z])/g, '_$1').toLowerCase();

const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

const UserSummaryReportPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <PageContainer>
      <UniversalReportTable<Record<string, any>, QueryState>
        storageKey="report.userSummary"
        title="用户汇总"
        rowKey={(record) =>
          [record.date, record.hour, record.userId, record.appId, record.appVersion, record.country]
            .filter((item) => item !== undefined && item !== null && item !== '')
            .join('|')
        }
        defaultQuery={{
          dateRange: [today, today],
        }}
        defaultDimensions={['date', 'hour', 'appId', 'country']}
        defaultMetrics={['trafficUsage', 'trafficUseTime', 'trafficUpload', 'trafficDownload', 'reportCountUser', 'reportCountNode']}
        enableServerSort
        dimensionOptions={DIMENSIONS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.value,
            width: 130,
            render: (value: any) => (value === null || value === undefined || value === '' ? '-' : String(value)),
          },
        }))}
        metricOptions={METRICS.map((item) => ({
          label: item.label,
          value: item.value,
          column: {
            title: item.label,
            dataIndex: item.value,
            width: 160,
            render: (value: any) => {
              if (TRAFFIC_FIELDS.has(item.value)) return fmtKBtoMB(value);
              return fmtNumber(value);
            },
          },
        }))}
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
            <Form.Item label="起始小时">
              <InputNumber min={0} max={23} value={query.hourFrom} style={{ width: 90 }} onChange={(value) => setQuery((prev) => ({ ...prev, hourFrom: value ?? undefined }))} />
            </Form.Item>
            <Form.Item label="结束小时">
              <InputNumber min={0} max={23} value={query.hourTo} style={{ width: 90 }} onChange={(value) => setQuery((prev) => ({ ...prev, hourTo: value ?? undefined }))} />
            </Form.Item>
            {visibleFilterDimensions.includes('userId') ? (
              <Form.Item label="用户ID">
                <InputNumber min={1} value={query.userId} style={{ width: 120 }} onChange={(value) => setQuery((prev) => ({ ...prev, userId: value ?? undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('appId') ? (
              <Form.Item label="应用ID">
                <Input value={query.appId} style={{ width: 160 }} onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('appVersion') ? (
              <Form.Item label="应用版本">
                <Input value={query.appVersion} style={{ width: 130 }} onChange={(e) => setQuery((prev) => ({ ...prev, appVersion: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
            {visibleFilterDimensions.includes('country') ? (
              <Form.Item label="国家">
                <Input value={query.country} style={{ width: 120 }} onChange={(e) => setQuery((prev) => ({ ...prev, country: e.target.value || undefined }))} />
              </Form.Item>
            ) : null}
          </Form>
        )}
        fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
          const mappedSorter: ReportSorter | undefined = sorter
            ? {
                ...sorter,
                field: sorter.field ? toSnakeCase(sorter.field) : undefined,
                columnKey: sorter.columnKey ? toSnakeCase(sorter.columnKey) : undefined,
              }
            : undefined;

          const res = await queryUserReportHourly({
            dateFrom: query.dateRange[0],
            dateTo: query.dateRange[1],
            hourFrom: query.hourFrom,
            hourTo: query.hourTo,
            groupBy: dimensions.map((item) => DIMENSION_TO_BACKEND[item] || item) as API.UserReportHourlyQuery['groupBy'],
            filters: {
              userIds: query.userId ? [query.userId] : undefined,
              appIds: query.appId ? [query.appId] : undefined,
              appVersions: query.appVersion ? [query.appVersion] : undefined,
              countries: query.country ? [query.country] : undefined,
            },
            page,
            pageSize,
            orderBy: mappedSorter?.field || mappedSorter?.columnKey,
            orderDirection: toOrderDirection(mappedSorter?.order),
          });

          if (res.code !== 0) {
            messageApi.error(res.msg || '获取用户汇总报表失败');
            return { list: [], total: 0 };
          }

          const payload = res.data;
          return {
            list: payload?.data || [],
            total: Number(payload?.total ?? 0),
          };
        }}
      />
    </PageContainer>
  );
};

export default UserSummaryReportPage;
