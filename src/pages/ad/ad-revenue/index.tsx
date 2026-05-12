import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getAdAccounts,
  getAdRevenueApps,
  getAdRevenueFetch,
  getAdRevenueSummary,
  getSyncServers,
  toggleAdAccountStatus,
  testAdAccountCredential,
} from '@/services/ad/api';
import { ClockCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatUtc8 } from '../utils/time';
import TrendChart from './components/TrendChart';
import AggregateTable from './components/AggregateTable';
import TopRankTable from './components/TopRankTable';
import AdAccountFormModal from '../ad-accounts/components/AdAccountFormModal';
import SyncServerFormModal from '../sync-servers/components/SyncServerFormModal';
import SyncDetailDrawer from '../sync-servers/components/SyncDetailDrawer';

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
  const [acctsData, setAcctsData] = useState<API.AdAccount[]>([]);
  const [acctsTotal, setAcctsTotal] = useState(0);
  const [acctsLoading, setAcctsLoading] = useState(false);
  const [acctsPage, setAcctsPage] = useState(1);
  const [acctsSize, setAcctsSize] = useState(20);
  const [acctsPlatform, setAcctsPlatform] = useState<string>();
  const [acctsStatus, setAcctsStatus] = useState<string>();
  const [acctsKeyword, setAcctsKeyword] = useState<string>();

  const PLATFORM_COLORS: Record<string, string> = {
    admob: 'green',
    meta: 'blue',
    unity: 'purple',
    applovin: 'orange',
    ironsource: 'cyan',
  };

  const fetchAccounts = async () => {
    setAcctsLoading(true);
    try {
      const res = await getAdAccounts({
        sourcePlatform: acctsPlatform,
        status: acctsStatus,
        keyword: acctsKeyword,
        page: acctsPage,
        pageSize: acctsSize,
      });
      if (res.code === 0 && res.data) {
        setAcctsData(res.data.data ?? []);
        setAcctsTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取账号列表失败');
      }
    } finally {
      setAcctsLoading(false);
    }
  };

  useEffect(() => {
    if (accountsModalOpen) {
      fetchAccounts();
    }
  }, [accountsModalOpen, acctsPage, acctsSize]);

  // ── 账号表单弹窗 ──────────────────────────────────────────────────────────
  const [acctsFormOpen, setAcctsFormOpen] = useState(false);
  const [acctsCurrentRecord, setAcctsCurrentRecord] = useState<API.AdAccount | undefined>();
  const [acctsSwitchLoading, setAcctsSwitchLoading] = useState<Record<number, boolean>>({});
  const [acctsTestLoading, setAcctsTestLoading] = useState<Record<number, boolean>>({});

  const handleAcctsToggleStatus = async (record: API.AdAccount) => {
    const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
    setAcctsSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleAdAccountStatus(record.id, newStatus);
    setAcctsSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    setAcctsData((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: newStatus } : r)),
    );
  };

  const handleAcctsTestCredential = async (record: API.AdAccount) => {
    setAcctsTestLoading((s) => ({ ...s, [record.id]: true }));
    try {
      const res = await testAdAccountCredential(record.id);
      if (res.code === 0) {
        messageApi.success('凭据可用');
      } else {
        messageApi.warning(res.msg || '凭据不可用');
      }
    } catch {
      messageApi.error('凭据不可用');
    }
    setAcctsTestLoading((s) => ({ ...s, [record.id]: false }));
  };

  const acctsColumns: ColumnsType<API.AdAccount> = [
    { title: 'ID', dataIndex: 'id', width: 60, fixed: 'left' },
    {
      title: '账号',
      dataIndex: 'accountName',
      width: 180,
      fixed: 'left',
      render: (_, r) => (
        <Space size={8}>
          <Tag color={PLATFORM_COLORS[r.sourcePlatform] || 'default'}>{r.sourcePlatform}</Tag>
          <span>{r.accountLabel || r.accountName || '-'}</span>
        </Space>
      ),
    },
    {
      title: '同步节点',
      dataIndex: 'assignedServerId',
      width: 120,
      render: (v) => (v || '-'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (v) => formatUtc8(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      fixed: 'right',
      render: (v, r) => (
        <Switch
          size="small"
          checked={v === 'enabled'}
          loading={!!acctsSwitchLoading[r.id]}
          onChange={() => handleAcctsToggleStatus(r)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setAcctsCurrentRecord(record);
              setAcctsFormOpen(true);
            }}
          >
            编辑
          </a>
          <a
            onClick={() => handleAcctsTestCredential(record)}
            style={{ color: acctsTestLoading[record.id] ? '#999' : undefined }}
          >
            {acctsTestLoading[record.id] ? '测试中...' : '测试凭据'}
          </a>
        </Space>
      ),
    },
  ];

  // ── 同步节点弹窗 ──────────────────────────────────────────────────────────
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncData, setSyncData] = useState<API.SyncServer[]>([]);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);

  const fetchSyncServers = async () => {
    setSyncLoading(true);
    try {
      const res = await getSyncServers();
      if (res.code === 0 && res.data) {
        setSyncData(res.data.data ?? []);
        setSyncTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取同步节点失败');
      }
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    if (syncModalOpen) {
      fetchSyncServers();
    }
  }, [syncModalOpen]);

  // ── APP 弹窗 ──────────────────────────────────────────────────────────────
  const [appsModalOpen, setAppsModalOpen] = useState(false);
  const [appsData, setAppsData] = useState<API.AdRevenueAppItem[]>([]);
  const [appsTotal, setAppsTotal] = useState(0);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const [appsSize, setAppsSize] = useState(20);
  const [appsPlatform, setAppsPlatform] = useState<string>();
  const [appsKeyword, setAppsKeyword] = useState<string>();

  const fetchApps = async () => {
    setAppsLoading(true);
    try {
      const res = await getAdRevenueApps({
        sourcePlatform: appsPlatform,
        keyword: appsKeyword,
        page: appsPage,
        pageSize: appsSize,
      });
      if (res.code === 0 && res.data) {
        setAppsData(res.data.data ?? []);
        setAppsTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取 APP 列表失败');
      }
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    if (appsModalOpen) {
      fetchApps();
    }
  }, [appsModalOpen, appsPage, appsSize]);

  const appsColumns: ColumnsType<API.AdRevenueAppItem> = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    {
      title: '应用',
      key: 'app',
      width: 200,
      render: (_, r) => (
        <div>
          <Space size={4}>
            <span>{r.providerAppName || '-'}</span>
            <Tooltip title={r.providerAppId}>
              <ExclamationCircleOutlined style={{ color: '#1890ff', cursor: 'pointer', fontSize: 13 }} />
            </Tooltip>
          </Space>
          <div style={{ fontSize: 12, color: '#999', lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.appStoreId || '-'}</div>
        </div>
      ),
    },
    {
      title: '账号',
      key: 'account',
      width: 220,
      render: (_, r) => (
        <div>
          <Space size={4}>
            <Tag style={{ fontSize: 12, lineHeight: '18px', padding: '0 4px', margin: 0 }}>{r.sourcePlatform}</Tag>
            <Tooltip title={r.accountName || '-'}>
              <span style={{ fontSize: 13 }}>{r.accountId}{r.accountLabel ? ` ${r.accountLabel}` : ''}</span>
            </Tooltip>
          </Space>
          <div style={{ fontSize: 12, color: '#999', lineHeight: '22px' }}>
            <Tooltip title="更新时间">
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatUtc8(r.updatedAt)}
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: '设备',
      dataIndex: 'devicePlatform',
      width: 80,
    },
    {
      title: '审核',
      dataIndex: 'appApprovalState',
      width: 80,
    },
  ];

  // ── 同步节点表单弹窗 ──────────────────────────────────────────────────────────
  const [syncFormOpen, setSyncFormOpen] = useState(false);
  const [syncCurrentRecord, setSyncCurrentRecord] = useState<API.SyncServer | undefined>();
  const [syncDetailOpen, setSyncDetailOpen] = useState(false);
  const [syncDetailServer, setSyncDetailServer] = useState<API.SyncServer | null>(null);

  const syncColumns: ColumnsType<API.SyncServer> = [
    { title: '节点 ID', dataIndex: 'serverId', width: 140 },
    { title: '节点名称', dataIndex: 'serverName', width: 160 },
    { title: '主机 IP', dataIndex: 'hostIp', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => {
        const map: Record<string, { color: string; label: string }> = {
          online: { color: 'green', label: '在线' },
          offline: { color: 'default', label: '离线' },
          maintenance: { color: 'orange', label: '维护中' },
        };
        const s = map[v] || { color: 'default', label: v };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeatAt',
      width: 170,
      render: (v) => formatUtc8(String(v)),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      render: (_, r) =>
        (r.tags ?? []).map((t) => (
          <Tag key={t} color="blue">
            {t}
          </Tag>
        )),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setSyncDetailServer(record);
              setSyncDetailOpen(true);
            }}
          >
            查看
          </a>
          <a
            onClick={() => {
              setSyncCurrentRecord(record);
              setSyncFormOpen(true);
            }}
          >
            编辑
          </a>
        </Space>
      ),
    },
  ];

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

  const detailColumns: ColumnsType<API.AdRevenueItem> = [
    { title: '日期', dataIndex: 'reportDate', key: 'reportDate', width: 130, render: (v) => fmtUtc8Date(v) },
    { title: '平台', dataIndex: 'sourcePlatform', key: 'sourcePlatform', width: 90, render: (v) => <Tag>{v}</Tag> },
    { title: '账号 ID', dataIndex: 'accountId', key: 'accountId', width: 80 },
    { title: '应用 ID', dataIndex: 'providerAppId', key: 'providerAppId', width: 140, ellipsis: true },
    { title: '广告单元', dataIndex: 'providerAdUnitId', key: 'providerAdUnitId', width: 140, ellipsis: true },
    { title: '国家', dataIndex: 'countryCode', key: 'countryCode', width: 60 },
    { title: '设备', dataIndex: 'devicePlatform', key: 'devicePlatform', width: 80 },
    { title: '广告格式', dataIndex: 'adFormat', key: 'adFormat', width: 90 },
    { title: '请求数', dataIndex: 'adRequests', key: 'adRequests', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '匹配数', dataIndex: 'matchedRequests', key: 'matchedRequests', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '展示量', dataIndex: 'impressions', key: 'impressions', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 80, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '预估收益', dataIndex: 'estimatedEarnings', key: 'estimatedEarnings', width: 100, render: (v) => fmtMoney(v) },
    { title: 'eCPM', dataIndex: 'ecpm', key: 'ecpm', width: 80, render: (v) => fmtMoney(v) },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', width: 70, render: (v) => fmtRate(v) },
    { title: '匹配率', dataIndex: 'matchRate', key: 'matchRate', width: 70, render: (v) => fmtRate(v) },
    { title: '展示率', dataIndex: 'showRate', key: 'showRate', width: 70, render: (v) => fmtRate(v) },
  ];

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
                setAcctsPage(1);
                setAcctsSize(20);
                setAcctsPlatform(undefined);
                setAcctsStatus(undefined);
                setAcctsKeyword(undefined);
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
                setAppsPage(1);
                setAppsSize(20);
                setAppsPlatform(undefined);
                setAppsKeyword(undefined);
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

      {/* 明细表 */}
      {/* <Card title="收益明细">
        <Table<API.AdRevenueItem>
          rowKey={(record) => `${record.reportDate}-${record.accountId}-${record.providerAppId}-${record.providerAdUnitId}-${record.countryCode}`}
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
      </Card> */}

      {/* 广告账号弹窗 */}
      <Modal
        title="广告账号"
        open={accountsModalOpen}
        onCancel={() => setAccountsModalOpen(false)}
        width={960}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Select
              allowClear
              placeholder="平台"
              style={{ width: 120 }}
              value={acctsPlatform}
              onChange={(v) => { setAcctsPlatform(v); setAcctsPage(1); }}
              options={PLATFORM_OPTIONS}
            />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 100 }}
              value={acctsStatus}
              onChange={(v) => { setAcctsStatus(v); setAcctsPage(1); }}
              options={[
                { label: '启用', value: 'enabled' },
                { label: '停用', value: 'disabled' },
              ]}
            />
            <Input.Search
              placeholder="关键词搜索"
              allowClear
              style={{ width: 200 }}
              value={acctsKeyword}
              onChange={(e) => setAcctsKeyword(e.target.value)}
              onSearch={() => { setAcctsPage(1); fetchAccounts(); }}
            />
          </Space>
          <Button
            type="primary"
            onClick={() => {
              setAcctsCurrentRecord(undefined);
              setAcctsFormOpen(true);
            }}
          >
            新建账号
          </Button>
        </div>
        <Table<API.AdAccount>
          rowKey="id"
          dataSource={acctsData}
          columns={acctsColumns}
          loading={acctsLoading}
          size="small"
          scroll={{ x: 800 }}
          pagination={{
            current: acctsPage,
            pageSize: acctsSize,
            total: acctsTotal,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => { setAcctsPage(p); setAcctsSize(s); },
          }}
        />
        <AdAccountFormModal
          open={acctsFormOpen}
          current={acctsCurrentRecord}
          syncServers={syncServers}
          onOpenChange={setAcctsFormOpen}
          onSuccess={() => {
            setAcctsFormOpen(false);
            fetchAccounts();
          }}
        />
      </Modal>

      {/* 同步节点弹窗 */}
      <Modal
        title="同步节点"
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        width={960}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            onClick={() => {
              setSyncCurrentRecord(undefined);
              setSyncFormOpen(true);
            }}
          >
            新建节点
          </Button>
        </div>
        <Table<API.SyncServer>
          rowKey="serverId"
          dataSource={syncData}
          columns={syncColumns}
          loading={syncLoading}
          size="small"
          scroll={{ x: 900 }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
        <SyncServerFormModal
          open={syncFormOpen}
          current={syncCurrentRecord}
          onOpenChange={setSyncFormOpen}
          onSuccess={() => {
            setSyncFormOpen(false);
            fetchSyncServers();
          }}
        />
        <SyncDetailDrawer
          open={syncDetailOpen}
          server={syncDetailServer}
          onClose={() => setSyncDetailOpen(false)}
        />
      </Modal>

      {/* APP 弹窗 */}
      <Modal
        title="应用列表"
        open={appsModalOpen}
        onCancel={() => setAppsModalOpen(false)}
        width={960}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
          <Select
            allowClear
            placeholder="平台"
            style={{ width: 120 }}
            value={appsPlatform}
            onChange={(v) => { setAppsPlatform(v); setAppsPage(1); }}
            options={PLATFORM_OPTIONS}
          />
          <Input.Search
            placeholder="搜索应用名称 / 应用 ID / 商店 ID"
            allowClear
            style={{ width: 300 }}
            value={appsKeyword}
            onChange={(e) => setAppsKeyword(e.target.value)}
            onSearch={() => { setAppsPage(1); fetchApps(); }}
          />
        </div>
        <Table<API.AdRevenueAppItem>
          rowKey="id"
          dataSource={appsData}
          columns={appsColumns}
          loading={appsLoading}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            current: appsPage,
            pageSize: appsSize,
            total: appsTotal,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => { setAppsPage(p); setAppsSize(s); },
          }}
        />
      </Modal>
    </PageContainer>
  );
};

export default AdRevenuePage;
