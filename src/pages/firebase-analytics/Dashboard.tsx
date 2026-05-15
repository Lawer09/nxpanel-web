import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Row, Col, Button, Tooltip, message } from 'antd';
import { ReloadOutlined, ExportOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
} from '@/services/firebase-analytics/api';
import { formatNumber, formatRate } from '@/utils/firebase-analytics';

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>({});
  const [eventTrend, setEventTrend] = useState<any[]>([]);
  const [vpnTrend, setVpnTrend] = useState<any[]>([]);
  const [regionQuality, setRegionQuality] = useState<any[]>([]);

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

  const apiParams = getApiParams(filters);

  return (
    <PageContainer
      header={{
        title: 'Dashboard',
        extra: [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => fetchData(filters)}>刷新</Button>,
          <Button key="export" icon={<ExportOutlined />}>导出</Button>,
        ],
        subTitle: (
          <Tooltip title="展示 Firebase 上报事件的整体质量、VPN 连接质量、节点测速、API 错误情况。">
            <InfoCircleOutlined style={{ color: '#6B7280', cursor: 'pointer' }} />
          </Tooltip>
        ),
      }}
    >
      <FilterBar onFilterChange={handleFilterChange} initialValues={filters} />

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
          <RegionQualityPanel data={regionQuality} loading={loading} />
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

    </PageContainer>
  );
};

export default Dashboard;
