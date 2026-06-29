import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Col, DatePicker, Drawer, Modal, Row, Tooltip, message } from 'antd';
import { ExportOutlined, InfoCircleOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { useSearchParams } from '@umijs/max';
import dayjs from 'dayjs';
import {
  ErrorTopPanel,
  FilterBar,
  KpiCard,
  NodeStatusSummary,
  RegionQualityPanel,
  TrendChart,
} from '@/components/FirebaseAnalytics';
import RealtimeLogWindow from '@/components/report/RealtimeLogWindow';
import {
  getDashboardSummary,
  getEventTrend,
  getRecentEvents,
  getRegionQuality,
  getVpnProbeTrend,
  getVpnQualityTrend,
  syncReport,
} from '@/services/firebase-analytics/api';
import type {
  FilterOptionsResponse,
  FirebaseAnalyticsFilterFormValues,
} from '@/services/firebase-analytics/types';
import { formatNumber, formatRate } from '@/utils/firebase-analytics';
import {
  buildFirebaseApiParams,
  buildFirebasePathSearch,
  buildFirebaseSearchParams,
  getInitialFirebaseFilters,
} from '@/utils/firebase-analytics-filters';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [eventTrend, setEventTrend] = useState<any[]>([]);
  const [qualityTrend, setQualityTrend] = useState<any[]>([]);
  const [regionQuality, setRegionQuality] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);
  const [filters, setFilters] = useState<FirebaseAnalyticsFilterFormValues>(() =>
    getInitialFirebaseFilters(searchParams),
  );
  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);
  const [realtimeLogOpen, setRealtimeLogOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState<any[]>([]);

  const apiParams = useMemo(() => buildFirebaseApiParams(filters), [filters]);
  const nodeStatusHref = useMemo(
    () => buildFirebasePathSearch('/firebase-analytics/node-status', filters),
    [filters],
  );

  const fetchRealtimeLog = useCallback(async ({ page, pageSize }: { page: number; pageSize: number }) => {
    const res = await getRecentEvents({ page, pageSize });
    if (res.data) {
      return { rows: res.data.items || [], total: res.data.total || 0, page, pageSize };
    }
    return null;
  }, []);

  const formatEventLine = (row: any) => {
    const time = row.recv_at ? dayjs(row.recv_at).format('HH:mm:ss.SSS') : '';
    const name = row.event_name || '';
    const app = row.app_id || '';
    const platform = row.platform || '';
    const device = row.raw?.device_id ? row.raw.device_id.slice(-8) : '';
    const extra = row.raw
      ? Object.entries(row.raw)
          .filter(([key]) => !['app_id', 'event_id', 'event_name', 'platform', 'device_id', 'event_time', 'created_at'].includes(key))
          .map(([key, value]) => `${key}=${value}`)
          .join(' ')
      : '';
    return `${time}  [${name}]  ${app}  ${platform}  ${device}${extra ? `  ${extra}` : ''}`;
  };

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const res = await getRecentEvents({ pageSize: 1 });
        if (res.data?.total != null) {
          setRealtimeCount(res.data.total);
        }
      } catch {
        // Ignore realtime log polling failures.
      }
    };

    fetchRealtime();
    const timer = setInterval(fetchRealtime, 15000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async (params: typeof apiParams) => {
    setLoading(true);
    try {
      const [summaryRes, eventTrendRes, vpnTrendRes, probeTrendRes, regionRes] = await Promise.all([
        getDashboardSummary(params),
        getEventTrend(params),
        getVpnQualityTrend(params),
        getVpnProbeTrend(params),
        getRegionQuality(params),
      ]);

      setSummary(summaryRes.data || {});

      const flatEventTrend =
        eventTrendRes.data?.items?.flatMap((item: any) => [
          { timestamp: item.time, type: '总事件数', value: item.total },
          { timestamp: item.time, type: 'App 打开', value: item.app_open },
          { timestamp: item.time, type: 'VPN 连接', value: item.vpn_session },
          { timestamp: item.time, type: '节点探测', value: item.vpn_probe },
          { timestamp: item.time, type: 'API 错误', value: item.server_api_error },
        ]) || [];
      setEventTrend(flatEventTrend);

      const comparisonTrend: any[] = [];
      (vpnTrendRes.data?.items || []).forEach((item: any) => {
        comparisonTrend.push({
          timestamp: item.time,
          type: 'VPN 连接成功率',
          value: Number((((item.success_rate as number) || 0) * 100).toFixed(2)),
        });
      });

      const probeTrendItems = (probeTrendRes.data as any)?.list || (probeTrendRes.data as any)?.items || [];
      probeTrendItems.forEach((item: any) => {
        comparisonTrend.push({
          timestamp: item.time || item.timestamp,
          type: '节点探测成功率',
          value: Number((((item.success_rate as number) || 0) * 100).toFixed(2)),
        });
      });

      setQualityTrend(comparisonTrend);
      setRegionQuality(regionRes.data?.items || []);
    } catch (error) {
      console.error(error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(apiParams);
  }, [apiParams]);

  const handleFilterChange = (values: FirebaseAnalyticsFilterFormValues) => {
    setFilters(values);
    setSearchParams(buildFirebaseSearchParams(values));
  };

  const handleSyncSubmit = async () => {
    if (!syncDateRange || syncDateRange.length !== 2) {
      message.warning('请选择同步日期范围');
      return;
    }
    const [from, to] = syncDateRange;
    if (!from || !to) {
      message.warning('请选择同步日期范围');
      return;
    }

    setSyncing(true);
    try {
      const res = await syncReport({
        dateFrom: dayjs(from).format('YYYY-MM-DD'),
        dateTo: dayjs(to).format('YYYY-MM-DD'),
      });
      if (res.data?.success) {
        message.success(`同步任务已触发 (${res.data.dateFrom} ~ ${res.data.dateTo})`);
        setSyncModalOpen(false);
      } else {
        message.error(res.data?.message || '同步触发失败');
      }
    } catch (error: any) {
      message.error(error?.message || '同步触发失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: 'Dashboard',
        extra: [
          realtimeCount != null ? (
            <span
              key="realtime"
              onClick={() => setRealtimeLogOpen(true)}
              style={{
                marginRight: 16,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#6B7280',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'inline-block',
                }}
              />
              实时: <span style={{ fontWeight: 600, color: '#111827', marginLeft: 2 }}>{formatNumber(realtimeCount)}</span> 条
            </span>
          ) : null,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => fetchData(apiParams)}>
            刷新
          </Button>,
          <Button key="sync" icon={<SyncOutlined />} onClick={() => setSyncModalOpen(true)}>
            同步
          </Button>,
          <Button key="export" icon={<ExportOutlined />}>
            导出
          </Button>,
        ],
        subTitle: (
          <Tooltip title="展示 Firebase 事件总览、VPN 连接质量、节点探测与 API 错误情况。节点排查已迁移到独立的节点状态菜单。">
            <InfoCircleOutlined style={{ color: '#6B7280', cursor: 'pointer' }} />
          </Tooltip>
        ),
      }}
    >
      <FilterBar
        onFilterChange={handleFilterChange}
        initialValues={filters}
        onOptionsLoaded={setFilterOptions}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <KpiCard title="总事件数" value={formatNumber(summary.total_events)} change={summary.compare?.total_events_rate} loading={loading} />
        </Col>
        <Col span={4}>
          <KpiCard title="活跃设备数" value={formatNumber(summary.active_devices)} change={summary.compare?.active_devices_rate} loading={loading} />
        </Col>
        <Col span={4}>
          <KpiCard title="App 打开次数" value={formatNumber(summary.app_open_count)} change={summary.compare?.app_open_rate} loading={loading} />
        </Col>
        <Col span={4}>
          <KpiCard
            title="VPN 连接成功率"
            value={formatRate(summary.vpn_success_rate)}
            change={summary.compare?.vpn_success_rate_diff}
            loading={loading}
            color={
              summary.vpn_success_rate != null && summary.vpn_success_rate < 0.9
                ? '#ef4444'
                : summary.vpn_success_rate != null && summary.vpn_success_rate < 0.95
                  ? '#f59e0b'
                  : '#16a34a'
            }
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="节点探测成功率"
            value={formatRate(summary.probe_success_rate)}
            change={summary.compare?.probe_success_rate_diff}
            loading={loading}
            color={
              summary.probe_success_rate != null && summary.probe_success_rate < 0.9
                ? '#ef4444'
                : summary.probe_success_rate != null && summary.probe_success_rate < 0.95
                  ? '#f59e0b'
                  : '#16a34a'
            }
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="API 错误数"
            value={formatNumber(summary.api_error_count)}
            change={summary.compare?.api_error_rate}
            loading={loading}
            color={
              summary.compare?.api_error_rate != null && summary.compare?.api_error_rate > 0.5
                ? '#ef4444'
                : summary.compare?.api_error_rate != null && summary.compare?.api_error_rate > 0.2
                  ? '#f59e0b'
                  : '#111827'
            }
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} lg={24} span={24}>
          <TrendChart
            title="事件趋势图"
            data={eventTrend}
            xField="timestamp"
            yField="value"
            seriesField="type"
            loading={loading}
          />
        </Col>
        <Col xl={12} lg={24} span={24}>
          <TrendChart
            title="连接 / 探测成功率对照 (%)"
            data={qualityTrend}
            xField="timestamp"
            yField="value"
            seriesField="type"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} lg={24} span={24}>
          <RegionQualityPanel
            data={regionQuality}
            countryOptions={filterOptions?.countries}
            loading={loading}
          />
        </Col>
        <Col xl={12} lg={24} span={24}>
          <ErrorTopPanel filters={apiParams} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <NodeStatusSummary filters={apiParams} viewHref={nodeStatusHref} />
        </Col>
      </Row>

      <Drawer
        title="实时事件日志"
        placement="right"
        width="70%"
        open={realtimeLogOpen}
        onClose={() => setRealtimeLogOpen(false)}
        destroyOnHidden
      >
        <RealtimeLogWindow
          fetchData={fetchRealtimeLog}
          formatLine={formatEventLine}
          detailTitle="事件详情"
          initialPageSize={50}
          autoRefreshInterval={5000}
        />
      </Drawer>

      <Modal
        title="按日期范围同步"
        open={syncModalOpen}
        onOk={handleSyncSubmit}
        onCancel={() => {
          if (!syncing) {
            setSyncModalOpen(false);
          }
        }}
        confirmLoading={syncing}
        okText="开始同步"
        cancelText="取消"
        destroyOnHidden
      >
        <RangePicker
          style={{ width: '100%' }}
          value={syncDateRange as any}
          onChange={(value) => setSyncDateRange(value || [])}
          format="YYYY-MM-DD"
          allowClear
        />
      </Modal>
    </PageContainer>
  );
};

export default Dashboard;
