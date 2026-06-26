import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Button, Tooltip, message, Drawer, Modal } from 'antd';
import { ReloadOutlined, ExportOutlined, InfoCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import { useSearchParams } from '@umijs/max';
import dayjs from 'dayjs';

import { 
  FilterBar, 
  KpiCard, 
  TrendChart, 
  RegionQualityPanel, 
  ErrorTopPanel, 
  NodeQualityTable 
} from '@/components/FirebaseAnalytics';

import {
  getDashboardSummary,
  getEventTrend,
  getVpnQualityTrend,
  getRegionQuality,
  getRecentEvents,
  syncReport,
} from '@/services/firebase-analytics/api';
import type { FilterOptionsResponse } from '@/services/firebase-analytics/types';
import { formatNumber, formatRate } from '@/utils/firebase-analytics';
import RealtimeLogWindow from '@/components/report/RealtimeLogWindow';

const Dashboard: React.FC = () => {
  const { RangePicker } = DatePicker;
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [eventTrend, setEventTrend] = useState<any[]>([]);
  const [vpnTrend, setVpnTrend] = useState<any[]>([]);
  const [regionQuality, setRegionQuality] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);

  // 从 URL 获取初始参数
  const getInitialFilters = () => {
    const filters: any = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    // 恢复 timeRange 结构，供 FilterBar 初始显示使用
    if (filters.start_time && filters.end_time) {
      filters.timeRange = [dayjs(filters.start_time), dayjs(filters.end_time)];
    }
    return filters;
  };

  const [filters, setFilters] = useState<any>(getInitialFilters());

  const [realtimeCount, setRealtimeCount] = useState<number | null>(null);
  const [realtimeLogOpen, setRealtimeLogOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncDateRange, setSyncDateRange] = useState<any[]>([]);

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
    const extra = row.raw ? Object.entries(row.raw).filter(([k]) => !['app_id', 'event_id', 'event_name', 'platform', 'device_id', 'event_time', 'created_at'].includes(k)).map(([k, v]) => `${k}=${v}`).join(' ') : '';
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
        // 静默失败，不影响页面
      }
    };
    fetchRealtime();
    const timer = setInterval(fetchRealtime, 15000);
    return () => clearInterval(timer);
  }, []);

  // 统一的参数转换逻辑：剥离 timeRange 避免污染请求，并格式化时间
  const getApiParams = (currentFilters: any) => {
    const { timeRange, ...rest } = currentFilters;
    const params = { ...rest };
    if (timeRange && timeRange.length === 2) {
      params.start_time = dayjs(timeRange[0]).format('YYYY-MM-DD HH:mm:ss');
      params.end_time = dayjs(timeRange[1]).format('YYYY-MM-DD HH:mm:ss');
    }
    return params;
  };

  const fetchData = async (currentFilters: any) => {
    setLoading(true);
    try {
      const params = getApiParams(currentFilters);

      const [summaryRes, eventTrendRes, vpnTrendRes, regionRes] = await Promise.all([
        getDashboardSummary(params),
        getEventTrend(params),
        getVpnQualityTrend(params),
        getRegionQuality(params),
      ]);

      if (summaryRes.data) setSummary(summaryRes.data);
      if (eventTrendRes.data?.items) {
        // 将后端数据转换为多折线格式
        const flatList: any[] = [];
        eventTrendRes.data.items.forEach((item: any) => {
          flatList.push({ timestamp: item.time, type: '总事件数', value: item.total });
          flatList.push({ timestamp: item.time, type: 'app_open', value: item.app_open });
          flatList.push({ timestamp: item.time, type: 'vpn_session', value: item.vpn_session });
          flatList.push({ timestamp: item.time, type: 'vpn_probe', value: item.vpn_probe });
          flatList.push({ timestamp: item.time, type: 'server_api_error', value: item.server_api_error });
        });
        setEventTrend(flatList);
      }
      if (vpnTrendRes.data?.items) {
        const formattedVpnTrend = vpnTrendRes.data.items.map((item: any) => ({
          ...item,
          timestamp: item.time
        }));
        setVpnTrend(formattedVpnTrend);
      }
      if (regionRes.data?.items) setRegionQuality(regionRes.data.items);
    } catch (error) {
      console.error(error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (values: any) => {
    setFilters(values);
    // 更新 URL
    const newParams: any = {};
    Object.keys(values).forEach(key => {
      if (values[key]) {
        if (key === 'timeRange') {
          newParams.start_time = dayjs(values[key][0]).format('YYYY-MM-DD HH:mm:ss');
          newParams.end_time = dayjs(values[key][1]).format('YYYY-MM-DD HH:mm:ss');
        } else {
          newParams[key] = values[key];
        }
      }
    });
    setSearchParams(newParams);
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

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

  const apiParams = getApiParams(filters);

  return (
    <PageContainer
      header={{
        title: 'Dashboard',
        extra: [
          realtimeCount != null ? (
            <span key="realtime" onClick={() => setRealtimeLogOpen(true)} style={{ marginRight: 16, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, cursor: 'pointer' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              实时: <span style={{ fontWeight: 600, color: '#111827', marginLeft: 2 }}>{formatNumber(realtimeCount)}</span> 条
            </span>
          ) : null,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => fetchData(filters)}>刷新</Button>,
          <Button key="sync" icon={<SyncOutlined />} onClick={() => setSyncModalOpen(true)}>同步</Button>,
          <Button key="export" icon={<ExportOutlined />}>导出</Button>,
        ],
        subTitle: (
          <Tooltip title="展示 Firebase 上报事件的整体质量、VPN 连接质量、节点测速、API 错误情况。">
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
          <KpiCard
            title="总事件数"
            value={formatNumber(summary.total_events)}
            change={summary.compare?.total_events_rate}
            loading={loading}
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="活跃设备数"
            value={formatNumber(summary.active_devices)}
            change={summary.compare?.active_devices_rate}
            loading={loading}
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="App 打开次数"
            value={formatNumber(summary.app_open_count)}
            change={summary.compare?.app_open_rate}
            loading={loading}
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="VPN 连接成功率"
            value={formatRate(summary.vpn_success_rate)}
            change={summary.compare?.vpn_success_rate_diff}
            loading={loading}
            color={summary.vpn_success_rate != null && summary.vpn_success_rate < 0.9 ? '#ef4444' : summary.vpn_success_rate != null && summary.vpn_success_rate < 0.95 ? '#f59e0b' : '#16a34a'}
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="节点测速成功率"
            value={formatRate(summary.probe_success_rate)}
            change={summary.compare?.probe_success_rate_diff}
            loading={loading}
            color={summary.probe_success_rate != null && summary.probe_success_rate < 0.9 ? '#ef4444' : summary.probe_success_rate != null && summary.probe_success_rate < 0.95 ? '#f59e0b' : '#16a34a'}
          />
        </Col>
        <Col span={4}>
          <KpiCard
            title="API 错误数"
            value={formatNumber(summary.api_error_count)}
            change={summary.compare?.api_error_rate}
            loading={loading}
            color={summary.compare?.api_error_rate != null && summary.compare?.api_error_rate > 0.5 ? '#ef4444' : summary.compare?.api_error_rate != null && summary.compare?.api_error_rate > 0.2 ? '#f59e0b' : '#111827'}
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
            title="VPN 连接质量趋势 (成功率)"
            data={vpnTrend}
            xField="timestamp"
            yField="success_rate"
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
          <NodeQualityTable filters={apiParams} />
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
