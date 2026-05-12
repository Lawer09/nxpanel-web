import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Col, DatePicker, Input, Row, Select, Space, Spin, Statistic } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getAdAccounts,
  getAdRevenueFetch,
  getAdRevenueSummary,
  getSyncServers,
} from '@/services/ad/api';
import { ReloadOutlined } from '@ant-design/icons';
import { formatUtc8 } from '../utils/time';
import TrendChart from './components/TrendChart';
import AggregateTable from './components/AggregateTable';
import AccountsModal from './components/AccountsModal';
import SyncServersModal from './components/SyncServersModal';
import AppListModal from './components/AppListModal';

const { RangePicker } = DatePicker;

const PLATFORM_OPTIONS = [
  { label: 'AdMob', value: 'admob' },
  { label: 'Meta', value: 'meta' },
  { label: 'Unity', value: 'unity' },
  { label: 'AppLovin', value: 'applovin' },
  { label: 'IronSource', value: 'ironsource' },
];

function fmtMoney(v: any) {
  return `$${Number(v ?? 0).toFixed(2)}`;
}

function fmtRate(v: any) {
  return `${(Number(v ?? 0) * 100).toFixed(2)}%`;
}

function fmtUtc8Date(v?: string | null) {
  if (!v) return '-';
  return formatUtc8(`${v}T00:00:00Z`);
}

const AdRevenuePage: React.FC = () => {
  const { message: messageApi } = App.useApp();

  // ── 全局筛选 ──────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  
  const [platform, setPlatform] = useState<string>();
  const [accountId, setAccountId] = useState<number>();
  const [countryCode, setCountryCode] = useState<string>();
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  const filters: API.AdRevenueQuery = useMemo(
    () => ({
      dateFrom: dateRange[0],
      dateTo: dateRange[1],
      sourcePlatform: platform,
      accountId,
      countryCode,
    }),
    [dateRange, platform, accountId, countryCode],
  );

  // 手动刷新 key，用于强制 TrendChart / AggregateTable 重新挂载
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Summary 卡片 ──────────────────────────────────────────────────────────
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<API.AdRevenueSummary | null>(null);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getAdRevenueSummary(filters);
      if (res.code === 0 && res.data) {
        setSummary(res.data);
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [dateRange, platform, accountId, countryCode]);

  useEffect(() => {
    getAdAccounts({ page: 1, pageSize: 100 }).then((res) => {
      if (res.code !== 0) return;
      const rows = res.data?.data ?? [];
      setAccountOptions(
        rows.map((item) => ({
          label: ` ${item.id}-${item.accountLabel || item.accountName}`,
          value: item.id,
        })),
      );
    });
  }, []);

  // ── 同步节点计数 ──────────────────────────────────────────────────────────
  const [syncServerCount, setSyncServerCount] = useState(0);
  const [syncServers, setSyncServers] = useState<API.SyncServer[]>([]);

  useEffect(() => {
    getSyncServers().then((res) => {
      if (res.code === 0 && res.data) {
        setSyncServerCount(res.data.total ?? 0);
        setSyncServers(res.data.data ?? []);
      }
    });
  }, []);

  // ── 账号弹窗 ──────────────────────────────────────────────────────────────
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);

  // ── 同步节点弹窗 ──────────────────────────────────────────────────────────
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // ── APP 弹窗 ──────────────────────────────────────────────────────────────
  const [appsModalOpen, setAppsModalOpen] = useState(false);

  // ── 明细表 ────────────────────────────────────────────────────────────────
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<API.AdRevenueItem[]>([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [detailPage, setDetailPage] = useState(1);
  const [detailSize, setDetailSize] = useState(20);

  const fetchDetail = async () => {
    setDetailLoading(true);
    try {
      const res = await getAdRevenueFetch({
        ...filters,
        page: detailPage,
        pageSize: detailSize,
      });
      if (res.code === 0 && res.data) {
        setDetailData(res.data.data || []);
        setDetailTotal(res.data.total || 0);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [dateRange, platform, accountId, countryCode, detailPage, detailSize]);

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          刷新
        </Button>
      }
    >
      {/* 全局筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <span>日期范围：</span>
          <RangePicker
            size="small"
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDateRange([
                  dates[0].format('YYYY-MM-DD'),
                  dates[1].format('YYYY-MM-DD'),
                ]);
                setDetailPage(1);
              }
            }}
          />
          <span>平台：</span>
          <Select
            size="small"
            style={{ width: 130 }}
            placeholder="全部"
            allowClear
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(v) => { setPlatform(v); setDetailPage(1); }}
          />
          <span>账号 ID：</span>
          <Select
            size="small"
            style={{ width: 220 }}
            placeholder="选择账号"
            allowClear
            options={accountOptions}
            value={accountId}
            showSearch
            optionFilterProp="label"
            onChange={(v) => {
              setAccountId(v as number | undefined);
              setDetailPage(1);
            }}
          />
          <span>国家：</span>
          <Input
            size="small"
            style={{ width: 80 }}
            placeholder="如 US"
            allowClear
            onChange={(e) => { setCountryCode(e.target.value || undefined); setDetailPage(1); }}
          />
        </Space>
      </Card>

      {/* Summary 卡片 */}
      <Spin spinning={summaryLoading}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={3}>
            <Card size="small">
              <Statistic title="预估收益" value={Number(summary?.estimatedEarnings ?? 0)} precision={2} prefix="$" />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="展示量" value={Number(summary?.impressions ?? 0)} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="点击量" value={Number(summary?.clicks ?? 0)} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="eCPM" value={Number(summary?.ecpm ?? 0)} precision={2} prefix="$" />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="CTR" value={Number(summary?.ctr ?? 0) * 100} precision={2} suffix="%" />
            </Card>
          </Col>
          <Col span={3}>
            <Card
              size="small"
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setAccountsModalOpen(true);
              }}
            >
              <Statistic title="账号数" value={Number(summary?.accountCount ?? 0)} />
            </Card>
          </Col>
          <Col span={3}>
            <Card
              size="small"
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setAppsModalOpen(true);
              }}
            >
              <Statistic title="应用数" value={Number(summary?.appCount ?? 0)} />
            </Card>
          </Col>
          <Col span={3}>
            <Card
              size="small"
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => setSyncModalOpen(true)}
            >
              <Statistic title="同步节点" value={syncServerCount} />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 趋势图 */}
      <TrendChart refreshKey={refreshKey} filters={filters} />

      {/* 聚合分析 */}
      <AggregateTable refreshKey={refreshKey} filters={filters} />

      {/* Top 排行 */}
      {/* <TopRankTable filters={filters} /> */}

      {/* 广告账号弹窗 */}
      <AccountsModal open={accountsModalOpen} onClose={() => setAccountsModalOpen(false)} syncServers={syncServers} />

      {/* 同步节点弹窗 */}
      <SyncServersModal open={syncModalOpen} onClose={() => setSyncModalOpen(false)} />

      {/* APP 弹窗 */}
      <AppListModal open={appsModalOpen} onClose={() => setAppsModalOpen(false)} />
    </PageContainer>
  );
};

export default AdRevenuePage;
