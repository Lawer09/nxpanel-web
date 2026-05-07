import { PageContainer } from '@ant-design/pro-components';
import { App, DatePicker, Form, Select } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import { getAdSpendAccounts, getAdSpendDaily, getAdSpendProjectCodes } from '@/services/ad-spend-platform/api';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  { label: '昨日到今日', value: [dayjs().subtract(1, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

interface ReportsPageProps {
  embedded?: boolean;
}

type QueryState = {
  dateRange: [string, string];
  platformCodes?: string[];
  accountIds?: number[];
  projectCodes?: string[];
  countries?: string[];
};

const DIMENSION_OPTIONS = [
  {
    label: '日期',
    value: 'date',
    column: { title: '日期', dataIndex: 'date', width: 120 },
  },
  {
    label: '平台',
    value: 'platform_code',
    column: { title: '平台', dataIndex: 'platformCode', width: 110 },
  },
  {
    label: '账号',
    value: 'platform_account_id',
    column: {
      title: '账号',
      dataIndex: 'accountName',
      width: 180,
      render: (_: any, row: API.AdSpendDailyItem) => row.accountName || row.platformAccountId || '-',
    },
  },
  {
    label: '项目',
    value: 'project_code',
    column: { title: '项目代号', dataIndex: 'projectCode', width: 140 },
  },
  {
    label: '国家',
    value: 'country',
    column: {
      title: '国家',
      dataIndex: 'country',
      width: 100,
      render: (v: string | undefined) => (v ? v : '-'),
    },
  },
];

const toSafeNumber = (v: number | string | undefined | null) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtNumber = (v: number | string) => toSafeNumber(v).toLocaleString();
const fmtFixed2 = (v: number | string) => toSafeNumber(v).toFixed(2);
const fmtPercent = (v: number | string) => `${toSafeNumber(v).toFixed(2)}%`;

const METRIC_OPTIONS = [
  {
    label: '展示',
    value: 'impressions',
    column: { title: '展示', dataIndex: 'impressions', width: 110, render: (v: number | string) => fmtNumber(v) },
    formatter: fmtNumber,
  },
  {
    label: '点击',
    value: 'clicks',
    column: { title: '点击', dataIndex: 'clicks', width: 100, render: (v: number | string) => fmtNumber(v) },
    formatter: fmtNumber,
  },
  {
    label: '花费',
    value: 'spend',
    column: { title: '花费', dataIndex: 'spend', width: 120, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: 'CTR',
    value: 'ctr',
    column: { title: 'CTR', dataIndex: 'ctr', width: 100, render: (v: number | string) => fmtPercent(v) },
    formatter: fmtFixed2,
  },
  {
    label: 'CPM',
    value: 'cpm',
    column: { title: 'CPM', dataIndex: 'cpm', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
  {
    label: 'CPC',
    value: 'cpc',
    column: { title: 'CPC', dataIndex: 'cpc', width: 100, render: (v: number | string) => fmtFixed2(v) },
    formatter: fmtFixed2,
  },
];

export const ReportsPage: React.FC<ReportsPageProps> = ({ embedded = false }) => {
  const { message: messageApi } = App.useApp();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [accountOptions, setAccountOptions] = useState<Array<{ label: string; value: number; platformCode: string }>>([]);
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);

  useEffect(() => {
    getAdSpendAccounts({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        const accounts = res.data.data.map((a) => ({
          label: `${a.accountName} (${a.platformCode})`,
          value: a.id,
          platformCode: a.platformCode,
        }));
        const platforms = Array.from(new Set(accounts.map((a) => a.platformCode))).filter(Boolean);
        setAccountOptions(accounts);
        setPlatformOptions(platforms);
      }
    });
  }, []);

  const refreshProjectCodes = useCallback(async (keyword?: string, dateFrom?: string, dateTo?: string) => {
    const res = await getAdSpendProjectCodes({
      keyword,
      startDate: dateFrom,
      endDate: dateTo,
    });
    if (res.code === 0 && res.data) {
      setProjectOptions(res.data.map((item) => item.projectCode));
    }
  }, []);

  useEffect(() => {
    refreshProjectCodes(undefined, yesterday, today);
  }, [refreshProjectCodes, today, yesterday]);

  const content = (
    <UniversalReportTable<API.AdSpendDailyItem, QueryState>
      storageKey="report.adSpend"
      title="投放报表"
      rowKey={(record) =>
        String(record.id ?? [record.date, record.platformCode, record.platformAccountId, record.projectCode, record.country].join('|'))
      }
      defaultQuery={{
        dateRange: [yesterday, today],
        platformCodes: undefined,
        accountIds: undefined,
        projectCodes: undefined,
        countries: undefined,
      }}
      defaultDimensions={['date', 'platform_code', 'platform_account_id', 'project_code', 'country']}
      defaultMetrics={['impressions', 'clicks', 'spend', 'ctr', 'cpm', 'cpc']}
      dimensionOptions={DIMENSION_OPTIONS}
      metricOptions={METRIC_OPTIONS}
      hideSummaryRows
      renderFilters={({ query, setQuery }) => (
        <Form layout="inline">
          <Form.Item label="日期范围">
            <RangePicker
              value={[dayjs(query.dateRange[0]), dayjs(query.dateRange[1])]}
              presets={DATE_PRESETS}
              onChange={(dates) => {
                const [start, end] = dates ?? [];
                if (!start || !end) return;
                const nextStart = start.format('YYYY-MM-DD');
                const nextEnd = end.format('YYYY-MM-DD');
                setQuery((prev) => ({ ...prev, dateRange: [nextStart, nextEnd] }));
                refreshProjectCodes(undefined, nextStart, nextEnd);
              }}
            />
          </Form.Item>
          <Form.Item label="平台">
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              style={{ width: 220 }}
              placeholder="全部平台"
              value={query.platformCodes}
              options={platformOptions.map((code) => ({ label: code, value: code }))}
              onChange={(value) => setQuery((prev) => ({ ...prev, platformCodes: value?.length ? value : undefined }))}
            />
          </Form.Item>
          <Form.Item label="账号">
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              style={{ width: 260 }}
              placeholder="全部账号"
              value={query.accountIds}
              options={accountOptions.map((item) => ({ label: item.label, value: item.value }))}
              onChange={(value) => setQuery((prev) => ({ ...prev, accountIds: value?.length ? value : undefined }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="项目代号">
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              style={{ width: 220 }}
              placeholder="全部项目"
              value={query.projectCodes}
              options={projectOptions.map((item) => ({ label: item, value: item }))}
              onChange={(value) => setQuery((prev) => ({ ...prev, projectCodes: value?.length ? value : undefined }))}
              onSearch={(value) => refreshProjectCodes(value, query.dateRange[0], query.dateRange[1])}
              showSearch
              filterOption={false}
            />
          </Form.Item>
          <Form.Item label="国家">
            <Select
              mode="tags"
              allowClear
              maxTagCount="responsive"
              style={{ width: 200 }}
              placeholder="如 US, JP"
              tokenSeparators={[',', ' ']}
              value={query.countries}
              onChange={(value) => {
                const normalized = (value || [])
                  .map((item) => `${item}`.trim().toUpperCase())
                  .filter(Boolean);
                setQuery((prev) => ({ ...prev, countries: normalized.length ? normalized : undefined }));
              }}
            />
          </Form.Item>
        </Form>
      )}
      fetchData={async ({ query, page, pageSize, dimensions }) => {
        const res = await getAdSpendDaily({
          dateFrom: query.dateRange[0],
          dateTo: query.dateRange[1],
          groupBy: dimensions as API.AdSpendDailyGroupField[],
          filters: {
            platformCodes: query.platformCodes,
            accountIds: query.accountIds,
            projectCodes: query.projectCodes,
            countries: query.countries,
          },
          page,
          pageSize,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '获取投放报表失败');
          return { list: [], total: 0 };
        }
        const payload = res.data;
        return {
          list: payload?.data ?? [],
          total: payload?.total ?? 0,
        };
      }}
    />
  );

  if (embedded) {
    return content;
  }

  return <PageContainer>{content}</PageContainer>;
};

export default ReportsPage;
