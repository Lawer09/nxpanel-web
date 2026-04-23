import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  getAdRevenueFetch,
  getAdRevenueSummary,
} from '@/services/ad/api';
import TrendChart from './components/TrendChart';
import AggregateTable from './components/AggregateTable';
import TopRankTable from './components/TopRankTable';

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

const AdRevenuePage: React.FC = () => {
  // ── 全局筛选 ──────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
  ]);
  const [platform, setPlatform] = useState<string>();
  const [accountId, setAccountId] = useState<number>();
  const [countryCode, setCountryCode] = useState<string>();

  const filters: API.AdRevenueQuery = {
    date_from: dateRange[0],
    date_to: dateRange[1],
    source_platform: platform,
    account_id: accountId,
    country_code: countryCode,
  };

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
        size: detailSize,
      });
      if (res.code === 0 && res.data) {
        setDetailData(res.data.items || []);
        setDetailTotal(res.data.total || 0);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [dateRange, platform, accountId, countryCode, detailPage, detailSize]);

  const detailColumns: ColumnsType<API.AdRevenueItem> = [
    { title: '日期', dataIndex: 'report_date', key: 'report_date', width: 100, fixed: 'left' },
    { title: '平台', dataIndex: 'source_platform', key: 'source_platform', width: 90, render: (v) => <Tag>{v}</Tag> },
    { title: '账号 ID', dataIndex: 'account_id', key: 'account_id', width: 80 },
    { title: '应用 ID', dataIndex: 'provider_app_id', key: 'provider_app_id', width: 140, ellipsis: true },
    { title: '广告单元', dataIndex: 'provider_ad_unit_id', key: 'provider_ad_unit_id', width: 140, ellipsis: true },
    { title: '国家', dataIndex: 'country_code', key: 'country_code', width: 60 },
    { title: '设备', dataIndex: 'device_platform', key: 'device_platform', width: 80 },
    { title: '广告格式', dataIndex: 'ad_format', key: 'ad_format', width: 90 },
    { title: '请求数', dataIndex: 'ad_requests', key: 'ad_requests', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '匹配数', dataIndex: 'matched_requests', key: 'matched_requests', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '展示量', dataIndex: 'impressions', key: 'impressions', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 80, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '预估收益', dataIndex: 'estimated_earnings', key: 'estimated_earnings', width: 100, render: (v) => fmtMoney(v) },
    { title: 'eCPM', dataIndex: 'ecpm', key: 'ecpm', width: 80, render: (v) => fmtMoney(v) },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', width: 70, render: (v) => fmtRate(v) },
    { title: '匹配率', dataIndex: 'match_rate', key: 'match_rate', width: 70, render: (v) => fmtRate(v) },
    { title: '展示率', dataIndex: 'show_rate', key: 'show_rate', width: 70, render: (v) => fmtRate(v) },
  ];

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
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
          <Input
            size="small"
            style={{ width: 100 }}
            placeholder="账号 ID"
            allowClear
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              setAccountId(v);
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
          <Col span={4}>
            <Card size="small">
              <Statistic title="预估收益" value={Number(summary?.estimated_earnings ?? 0)} precision={2} prefix="$" />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="展示量" value={Number(summary?.impressions ?? 0)} />
            </Card>
          </Col>
          <Col span={4}>
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
            <Card size="small">
              <Statistic title="账号数" value={Number(summary?.account_count ?? 0)} />
            </Card>
          </Col>
          <Col span={3}>
            <Card size="small">
              <Statistic title="应用数" value={Number(summary?.app_count ?? 0)} />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 趋势图 */}
      <TrendChart filters={filters} />

      {/* 聚合分析 */}
      <AggregateTable filters={filters} />

      {/* Top 排行 */}
      {/* <TopRankTable filters={filters} /> */}

      {/* 明细表 */}
      <Card title="收益明细">
        <Table<API.AdRevenueItem>
          rowKey={(record) => `${record.report_date}-${record.account_id}-${record.provider_app_id}-${record.provider_ad_unit_id}-${record.country_code}`}
          columns={detailColumns}
          dataSource={detailData}
          loading={detailLoading}
          size="small"
          scroll={{ x: 1800 }}
          pagination={{
            current: detailPage,
            pageSize: detailSize,
            total: detailTotal,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => { setDetailPage(p); setDetailSize(s); },
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default AdRevenuePage;
