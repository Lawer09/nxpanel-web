import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Modal,
  Row,
  Select,
  Spin,
  Statistic,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';
import UniversalReportTable from '@/components/report/UniversalReportTable';
import {
  getAdSpendAccounts,
  getAdSpendDaily,
  getAdSpendSyncJobs,
  getAdSpendProjectCodes,
} from '@/services/ad-spend-platform/api';
import { AccountsPage } from './accounts';
import { SyncJobsPage } from './sync-jobs';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
  { label: '昨日到今日', value: [dayjs().subtract(1, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一周', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  { label: '近一月', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
];

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

const AdSpendPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');

  const [platformOptions, setPlatformOptions] = useState<string[]>([]);
  const [accountOptions, setAccountOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);

  // ── 账号数 / 同步任务数 ──────────────────────────────────────────────────
  const [countsLoading, setCountsLoading] = useState(false);
  const [accountCount, setAccountCount] = useState(0);
  const [syncJobCount, setSyncJobCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCounts = useCallback(() => {
    setCountsLoading(true);
    Promise.all([
      getAdSpendAccounts({ page: 1, pageSize: 1 }),
      getAdSpendSyncJobs({ page: 1, pageSize: 1 }),
    ])
      .then(([accRes, jobRes]) => {
        if (accRes.code === 0 && accRes.data) setAccountCount(accRes.data.total ?? 0);
        if (jobRes.code === 0 && jobRes.data) setSyncJobCount(jobRes.data.total ?? 0);
      })
      .finally(() => setCountsLoading(false));
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, refreshKey]);

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

  useEffect(() => {
    getAdSpendAccounts({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        const accounts = res.data.data.map((a) => ({
          label: `${a.accountName} (${a.platformCode})`,
          value: a.id,
        }));
        const platforms = Array.from(new Set(accounts.map((a) => a.label.split(' (')[1]?.replace(')', '') || ''))).filter(Boolean);
        setAccountOptions(accounts);
        setPlatformOptions(platforms);
      }
    });
  }, []);

  // ── fetchData 需要 useCallback 避免每次 render 创建新引用触发重复请求
  const handleFetchData = useCallback(
    async ({ query, page, pageSize, dimensions }: {
      query: QueryState;
      page: number;
      pageSize: number;
      dimensions: string[];
    }) => {
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
    },
    [messageApi],
  );

  // ── 弹窗 ─────────────────────────────────────────────────────────────────
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);
  const [syncJobsModalOpen, setSyncJobsModalOpen] = useState(false);

  // ── 渲染 ─────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setRefreshKey((k) => k + 1);
          }}
        >
          刷新
        </Button>
      }
    >
      {/* 汇总卡片 */}
      <Spin spinning={countsLoading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={3}>
            <Card size="small" hoverable onClick={() => setAccountsModalOpen(true)}>
              <Statistic title="账号数" value={accountCount} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small" hoverable onClick={() => setSyncJobsModalOpen(true)}>
              <Statistic title="同步任务" value={syncJobCount} />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 通用报表组件 */}
      <UniversalReportTable<API.AdSpendDailyItem, QueryState>
        key={refreshKey}
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
        fetchData={handleFetchData}
      />

      {/* 账号弹窗 */}
      <Modal
        title="投放账号"
        open={accountsModalOpen}
        onCancel={() => {
          setAccountsModalOpen(false);
          loadCounts();
        }}
        footer={null}
        width={1200}
        destroyOnClose
        bodyStyle={{ maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}
      >
        <AccountsPage embedded />
      </Modal>

      {/* 同步任务弹窗 */}
      <Modal
        title="同步任务"
        open={syncJobsModalOpen}
        onCancel={() => {
          setSyncJobsModalOpen(false);
          loadCounts();
        }}
        footer={null}
        width={1200}
        destroyOnClose
        bodyStyle={{ maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}
      >
        <SyncJobsPage embedded />
      </Modal>
    </PageContainer>
  );
};

export default AdSpendPage;
