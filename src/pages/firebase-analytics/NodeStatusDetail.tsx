import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Column, Pie } from '@ant-design/charts';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { history, useSearchParams } from '@umijs/max';
import { EmptyState, FilterBar, TrendChart } from '@/components/FirebaseAnalytics';
import type { FirebaseFilterField } from '@/components/FirebaseAnalytics/FilterBar';
import { aggregateRegionQualityItems } from '@/components/FirebaseAnalytics/countryMapping';
import {
  getErrorTop,
  getNodeConnectionErrorDistribution,
  getNodeConnectionResults,
  getNodeConnectionSummary,
  getRegionQuality,
  getVpnProbeNodeStats,
  getVpnProbeResults,
  getVpnProbeTrend,
  getVpnQualityTrend,
} from '@/services/firebase-analytics/api';
import type {
  ErrorTopItem,
  FirebaseAnalyticsFilterFormValues,
  NodeConnectionErrorDistributionItem,
  NodeConnectionResultItem,
  NodeConnectionSummaryResponse,
  NodeDiagnosisStatus,
  NodeSampleScope,
  ProbeNodeStatsItem,
  ProbeResultItem,
  RegionQualityItem,
} from '@/services/firebase-analytics/types';
import {
  formatBytes,
  formatDateTime,
  formatDateTimeShort,
  formatDuration,
  formatNodeLabel,
  formatPercentPointGap,
  formatRate,
  getNodeDiagnosisMeta,
  toRequestOrder,
} from '@/utils/firebase-analytics';
import {
  buildFirebaseApiParams,
  buildFirebaseSearchParams,
  getInitialFirebaseFilters,
} from '@/utils/firebase-analytics-filters';

type ConnectionFilters = {
  success?: 'true' | 'false';
  error_stage?: string;
  error_code?: string;
};

type ProbeFilters = {
  success?: 'true' | 'false';
  error_code?: string;
};

type TrendPoint = {
  timestamp: string;
  type: string;
  value: number;
};

type CountrySuccessItem = {
  key: string;
  country: string;
  successRate: number;
  sessionCount: number;
  eventCount: number;
};

const FILTER_FIELDS: FirebaseFilterField[] = [
  'timeRange',
  'time_field',
  'app_id',
  'platform',
  'app_version',
  'user_country',
  'network_type',
  'isp',
];

const buildDetailSearchState = (
  filters: FirebaseAnalyticsFilterFormValues,
  nodeInfo: Record<string, string | undefined>,
  diagnosisStatus?: NodeDiagnosisStatus,
  sampleScope?: NodeSampleScope,
  returnSearch?: string,
) => {
  const search = new URLSearchParams(buildFirebaseSearchParams(filters) as Record<string, string>);

  Object.entries(nodeInfo).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  if (diagnosisStatus) {
    search.set('diagnosis_status', diagnosisStatus);
  }
  if (sampleScope) {
    search.set('sample_scope', sampleScope);
  }
  if (returnSearch) {
    search.set('return_search', returnSearch);
  }

  return Object.fromEntries(search.entries());
};

const buildErrorPieConfig = (
  data: Array<{ type: string; value: number }>,
  totalLabel: string,
) => ({
  appendPadding: 10,
  data,
  angleField: 'value',
  colorField: 'type',
  radius: 0.82,
  innerRadius: 0.62,
  legend: { position: 'right' as const },
  label: {
    formatter: (item: { value?: number }) => {
      const total = data.reduce((sum, current) => sum + current.value, 0);
      if (!total || !item?.value) {
        return '0%';
      }
      return `${((item.value / total) * 100).toFixed(1)}%`;
    },
    style: { fontSize: 12 },
  },
  statistic: {
    title: false as const,
    content: {
      style: { whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: '18px' },
      content: `${totalLabel}\n${data.reduce((sum, item) => sum + item.value, 0)}`,
    },
  },
});

const NodeStatusDetailPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const connectionActionRef = useRef<ActionType | undefined>(undefined);
  const probeActionRef = useRef<ActionType | undefined>(undefined);

  const nodeInfo = useMemo(
    () => ({
      node_id: searchParams.get('node_id') || undefined,
      node_name: searchParams.get('node_name') || undefined,
      node_country: searchParams.get('node_country') || undefined,
      node_region: searchParams.get('node_region') || undefined,
      protocol: searchParams.get('protocol') || undefined,
    }),
    [searchParams],
  );

  const diagnosisStatus = (searchParams.get('diagnosis_status') as NodeDiagnosisStatus | null) || undefined;
  const sampleScope = (searchParams.get('sample_scope') as NodeSampleScope | null) || undefined;
  const returnSearch = searchParams.get('return_search') || '';

  const [filters, setFilters] = useState<FirebaseAnalyticsFilterFormValues>(() =>
    getInitialFirebaseFilters(searchParams),
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [probeSummary, setProbeSummary] = useState<ProbeNodeStatsItem | null>(null);
  const [connectionSummary, setConnectionSummary] = useState<NodeConnectionSummaryResponse | null>(null);
  const [connectionErrorDistribution, setConnectionErrorDistribution] = useState<
    NodeConnectionErrorDistributionItem[]
  >([]);
  const [probeErrorDistribution, setProbeErrorDistribution] = useState<ErrorTopItem[]>([]);
  const [successTrend, setSuccessTrend] = useState<TrendPoint[]>([]);
  const [countrySuccess, setCountrySuccess] = useState<CountrySuccessItem[]>([]);
  const [connectionFilters, setConnectionFilters] = useState<ConnectionFilters>({});
  const [probeFilters, setProbeFilters] = useState<ProbeFilters>({});

  const commonFilters = useMemo(() => buildFirebaseApiParams(filters), [filters]);
  const requestBase = useMemo(
    () => ({
      ...commonFilters,
      ...nodeInfo,
    }),
    [commonFilters, nodeInfo],
  );

  useEffect(() => {
    setFilters(getInitialFirebaseFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (!nodeInfo.node_id) {
      return;
    }

    let active = true;

    const fetchOverview = async () => {
      setSummaryLoading(true);
      try {
        const [
          probeSummaryRes,
          connectionSummaryRes,
          connectionErrorRes,
          probeErrorRes,
          connectionTrendRes,
          probeTrendRes,
          regionQualityRes,
        ] = await Promise.allSettled([
          getVpnProbeNodeStats({
            ...requestBase,
            page: 1,
            page_size: 1,
            sort_by: 'last_received_at',
            order: 'desc',
          }),
          getNodeConnectionSummary(requestBase),
          getNodeConnectionErrorDistribution({
            ...requestBase,
            limit: 10,
          }),
          getErrorTop({
            ...requestBase,
            error_type: 'vpn_probe',
            limit: 10,
          }),
          getVpnQualityTrend(requestBase),
          getVpnProbeTrend(requestBase),
          getRegionQuality({
            ...requestBase,
            sort_by: 'event_count',
            order: 'desc',
            limit: 20,
          }),
        ]);

        if (!active) {
          return;
        }

        const nextProbeSummary =
          probeSummaryRes.status === 'fulfilled' ? probeSummaryRes.value.data?.items?.[0] || null : null;
        const nextConnectionSummary =
          connectionSummaryRes.status === 'fulfilled' ? connectionSummaryRes.value.data || null : null;
        const nextConnectionErrors =
          connectionErrorRes.status === 'fulfilled' ? connectionErrorRes.value.data?.items || [] : [];
        const nextProbeErrors =
          probeErrorRes.status === 'fulfilled' ? probeErrorRes.value.data?.items || [] : [];

        const connectionTrendItems =
          connectionTrendRes.status === 'fulfilled' ? connectionTrendRes.value.data?.items || [] : [];
        const rawProbeTrend =
          probeTrendRes.status === 'fulfilled'
            ? ((probeTrendRes.value.data as any)?.items || (probeTrendRes.value.data as any)?.list || [])
            : [];
        const regionItems: RegionQualityItem[] =
          regionQualityRes.status === 'fulfilled' ? regionQualityRes.value.data?.items || [] : [];

        setProbeSummary(nextProbeSummary);
        setConnectionSummary(nextConnectionSummary);
        setConnectionErrorDistribution(nextConnectionErrors);
        setProbeErrorDistribution(nextProbeErrors);

        setSuccessTrend([
          ...connectionTrendItems.map((item: any) => ({
            timestamp: item.time || item.timestamp,
            type: '连接成功率',
            value: Number((((item.success_rate as number) || 0) * 100).toFixed(2)),
          })),
          ...rawProbeTrend.map((item: any) => ({
            timestamp: item.time || item.timestamp,
            type: '探测成功率',
            value: Number((((item.success_rate as number) || 0) * 100).toFixed(2)),
          })),
        ]);

        setCountrySuccess(
          aggregateRegionQualityItems(regionItems)
            .slice(0, 10)
            .map((item) => ({
              key: item.rowKey,
              country: item.countryCode ? `${item.displayName} (${item.countryCode})` : item.displayName,
              successRate: Number(((item.vpn_success_rate || 0) * 100).toFixed(2)),
              sessionCount: item.vpn_session_count || 0,
              eventCount: item.event_count || 0,
            })),
        );
      } finally {
        if (active) {
          setSummaryLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      active = false;
    };
  }, [nodeInfo.node_id, reloadToken, requestBase]);

  const hasProbeData = (probeSummary?.test_count || 0) > 0;
  const hasConnectionData = (connectionSummary?.session_count || 0) > 0;
  const showConnectionEmpty = diagnosisStatus === 'probe_only' || (!hasConnectionData && hasProbeData);
  const showProbeEmpty = diagnosisStatus === 'session_only' || (!hasProbeData && hasConnectionData);

  const diagnosisMeta = getNodeDiagnosisMeta(diagnosisStatus);
  const nodeLabel = formatNodeLabel(nodeInfo);
  const successRateGap =
    probeSummary?.success_rate != null && connectionSummary?.success_rate != null
      ? probeSummary.success_rate - connectionSummary.success_rate
      : undefined;

  const connectionPieData = useMemo(
    () =>
      connectionErrorDistribution
        .filter((item) => item.count > 0)
        .map((item) => ({
          type: item.error_code || item.error_stage || 'Unknown',
          value: item.count,
        })),
    [connectionErrorDistribution],
  );

  const probePieData = useMemo(
    () =>
      probeErrorDistribution
        .filter((item) => item.count > 0)
        .map((item) => ({
          type: item.error_code || item.error_stage || 'Unknown',
          value: item.count,
        })),
    [probeErrorDistribution],
  );

  const handleFilterChange = (nextValues: FirebaseAnalyticsFilterFormValues) => {
    setFilters(nextValues);
    setSearchParams(
      buildDetailSearchState(nextValues, nodeInfo, diagnosisStatus, sampleScope, returnSearch),
    );
  };

  const connectionColumns = useMemo<ProColumns<NodeConnectionResultItem>[]>(
    () => [
      {
        title: '接收时间',
        dataIndex: 'received_at',
        key: 'received_at',
        width: 160,
        sorter: true,
        render: (_dom, record) => formatDateTime(record.received_at),
      },
      {
        title: '设备',
        dataIndex: 'device_id',
        key: 'device_id',
        width: 160,
        ellipsis: true,
      },
      {
        title: '平台/版本',
        key: 'platform_version',
        width: 160,
        render: (_value, record) => `${record.platform || '-'} / ${record.app_version || '-'}`,
      },
      {
        title: '用户国家',
        dataIndex: 'user_country',
        key: 'user_country',
        width: 100,
      },
      {
        title: '网络',
        key: 'network',
        width: 140,
        render: (_value, record) => `${record.network_type || '-'} / ${record.isp || '-'}`,
      },
      {
        title: '连接方式',
        dataIndex: 'connect_type',
        key: 'connect_type',
        width: 100,
      },
      {
        title: '结果',
        dataIndex: 'success',
        key: 'success',
        width: 90,
        render: (_dom, record) => (
          <Tag color={record.success ? 'success' : 'error'}>{record.success ? '成功' : '失败'}</Tag>
        ),
      },
      {
        title: '连接耗时',
        dataIndex: 'connect_ms',
        key: 'connect_ms',
        width: 110,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.connect_ms),
      },
      {
        title: '持续时长',
        dataIndex: 'duration_ms',
        key: 'duration_ms',
        width: 110,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.duration_ms),
      },
      {
        title: '重试次数',
        dataIndex: 'retry_count',
        key: 'retry_count',
        width: 100,
        align: 'right',
        sorter: true,
      },
      {
        title: '错误阶段',
        dataIndex: 'error_stage',
        key: 'error_stage',
        width: 120,
      },
      {
        title: '错误码',
        dataIndex: 'error_code',
        key: 'error_code',
        width: 150,
        ellipsis: true,
      },
      {
        title: '错误信息',
        dataIndex: 'error_message',
        key: 'error_message',
        width: 240,
        ellipsis: true,
      },
    ],
    [],
  );

  const probeColumns = useMemo<ProColumns<ProbeResultItem>[]>(
    () => [
      {
        title: '接收时间',
        dataIndex: 'received_at',
        key: 'received_at',
        width: 160,
        sorter: true,
        render: (_dom, record) => formatDateTime(record.received_at),
      },
      {
        title: '设备',
        dataIndex: 'device_id',
        key: 'device_id',
        width: 160,
        ellipsis: true,
      },
      {
        title: '平台/版本',
        key: 'platform_version',
        width: 160,
        render: (_value, record) => `${record.platform || '-'} / ${record.app_version || '-'}`,
      },
      {
        title: '用户国家',
        dataIndex: 'user_country',
        key: 'user_country',
        width: 100,
      },
      {
        title: '网络',
        key: 'network',
        width: 140,
        render: (_value, record) => `${record.network_type || '-'} / ${record.isp || '-'}`,
      },
      {
        title: '探测类型',
        dataIndex: 'probe_type',
        key: 'probe_type',
        width: 120,
      },
      {
        title: '触发场景',
        dataIndex: 'probe_trigger',
        key: 'probe_trigger',
        width: 120,
      },
      {
        title: '结果',
        dataIndex: 'success',
        key: 'success',
        width: 90,
        render: (_dom, record) => (
          <Tag color={record.success ? 'success' : 'error'}>{record.success ? '成功' : '失败'}</Tag>
        ),
      },
      {
        title: '延迟',
        dataIndex: 'latency_ms',
        key: 'latency_ms',
        width: 100,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.latency_ms),
      },
      {
        title: 'TCP',
        dataIndex: 'tcp_connect_ms',
        key: 'tcp_connect_ms',
        width: 100,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.tcp_connect_ms),
      },
      {
        title: 'TLS',
        dataIndex: 'tls_hk_ms',
        key: 'tls_hk_ms',
        width: 100,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.tls_hk_ms),
      },
      {
        title: 'Proxy',
        dataIndex: 'proxy_hk_ms',
        key: 'proxy_hk_ms',
        width: 100,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.proxy_hk_ms),
      },
      {
        title: '超时阈值',
        dataIndex: 'timeout_ms',
        key: 'timeout_ms',
        width: 100,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.timeout_ms),
      },
      {
        title: '错误码',
        dataIndex: 'error_code',
        key: 'error_code',
        width: 150,
        ellipsis: true,
      },
      {
        title: '错误信息',
        dataIndex: 'error_message',
        key: 'error_message',
        width: 240,
        ellipsis: true,
      },
    ],
    [],
  );

  if (!nodeInfo.node_id) {
    return (
      <PageContainer title="节点状态详情">
        <EmptyState description="缺少 node_id，无法加载节点详情。" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={nodeLabel.title}
      subTitle={nodeLabel.meta || nodeInfo.node_id}
      extra={[
        <Tag key="diagnosis" color={diagnosisMeta.color}>
          {diagnosisMeta.label}
        </Tag>,
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (returnSearch) {
              history.push(`/firebase-analytics/node-status?${returnSearch}`);
              return;
            }
            if (window.history.length > 1) {
              history.back();
              return;
            }
            history.push('/firebase-analytics/node-status');
          }}
        >
          返回列表
        </Button>,
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={() => {
            setReloadToken((value) => value + 1);
            connectionActionRef.current?.reload();
            probeActionRef.current?.reload();
          }}
        >
          刷新
        </Button>,
      ]}
    >
      <FilterBar fields={FILTER_FIELDS} initialValues={filters} onFilterChange={handleFilterChange} />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={6} md={12} span={24}>
          <Card loading={summaryLoading}>
            {showProbeEmpty ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前节点暂无探测摘要" />
            ) : (
              <Space direction="vertical" size={8}>
                <Statistic title="探测成功率" value={formatRate(probeSummary?.success_rate)} />
                <Typography.Text type="secondary">
                  样本 {probeSummary?.test_count || 0}，P95 延迟 {formatDuration(probeSummary?.p95_latency_ms)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  主要错误 {probeSummary?.top_error_code || '-'}
                </Typography.Text>
              </Space>
            )}
          </Card>
        </Col>
        <Col xl={6} md={12} span={24}>
          <Card loading={summaryLoading}>
            {showConnectionEmpty ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前节点暂无连接摘要" />
            ) : (
              <Space direction="vertical" size={8}>
                <Statistic title="连接成功率" value={formatRate(connectionSummary?.success_rate)} />
                <Typography.Text type="secondary">
                  会话 {connectionSummary?.session_count || 0}，P95 连接 {formatDuration(connectionSummary?.p95_connect_ms)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  主要错误 {connectionSummary?.top_error_code || '-'}
                </Typography.Text>
              </Space>
            )}
          </Card>
        </Col>
        <Col xl={6} md={12} span={24}>
          <Card loading={summaryLoading}>
            <Space direction="vertical" size={8}>
              <Statistic title="成功率差值" value={formatPercentPointGap(successRateGap)} />
              <Typography.Text type="secondary">当前判定：{diagnosisMeta.label}</Typography.Text>
              <Typography.Text type="secondary">
                重试率 {showConnectionEmpty ? '-' : formatRate(connectionSummary?.retry_rate)}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xl={6} md={12} span={24}>
          <Card loading={summaryLoading}>
            <Space direction="vertical" size={8}>
              <Statistic
                title="最近上报"
                value={formatDateTimeShort(connectionSummary?.last_received_at || probeSummary?.last_received_at)}
              />
              <Typography.Text type="secondary">
                最近探测 {formatDateTimeShort(probeSummary?.last_received_at)}
              </Typography.Text>
              <Typography.Text type="secondary">
                最近连接 {formatDateTimeShort(connectionSummary?.last_received_at)}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} span={24}>
          <TrendChart
            title="连接 / 探测成功率趋势 (%)"
            data={successTrend}
            xField="timestamp"
            yField="value"
            seriesField="type"
            loading={summaryLoading}
          />
        </Col>
        <Col xl={12} span={24}>
          <Card
            title="国家成功率分布"
            loading={summaryLoading}
            style={{ height: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
          >
            {countrySuccess.length > 0 ? (
              <>
                <Column
                  data={countrySuccess}
                  xField="country"
                  yField="successRate"
                  height={280}
                  label={{
                    position: 'top',
                    formatter: (datum: CountrySuccessItem) => `${datum.successRate.toFixed(1)}%`,
                  }}
                  xAxis={{ label: { autoHide: true, autoRotate: true } }}
                  meta={{
                    successRate: {
                      alias: '成功率(%)',
                      min: 0,
                      max: 100,
                    },
                  }}
                  color="#2563eb"
                  tooltip={{
                    formatter: (datum: CountrySuccessItem) => ({
                      name: datum.country,
                      value: `${datum.successRate.toFixed(2)}%`,
                    }),
                  }}
                />
                <Table<CountrySuccessItem>
                  size="small"
                  style={{ marginTop: 12 }}
                  pagination={false}
                  dataSource={countrySuccess.slice(0, 5)}
                  rowKey="key"
                  columns={[
                    { title: '国家', dataIndex: 'country', key: 'country', ellipsis: true },
                    {
                      title: '成功率',
                      dataIndex: 'successRate',
                      key: 'successRate',
                      align: 'right',
                      render: (value: number) => `${value.toFixed(2)}%`,
                    },
                    {
                      title: '连接样本',
                      dataIndex: 'sessionCount',
                      key: 'sessionCount',
                      align: 'right',
                    },
                  ]}
                />
              </>
            ) : (
              <EmptyState
                description="当前筛选下暂无国家维度成功率数据。该图复用地区质量分布接口并携带节点参数。"
                height={360}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xl={12} span={24}>
          <Card
            title="连接错误占比"
            loading={summaryLoading}
            style={{ height: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
          >
            {showConnectionEmpty ? (
              <EmptyState description="该节点当前没有连接样本，无法展示连接错误占比。" height={360} />
            ) : connectionPieData.length > 0 ? (
              <>
                <Pie {...buildErrorPieConfig(connectionPieData, '连接错误')} height={260} />
                <Table<NodeConnectionErrorDistributionItem>
                  size="small"
                  pagination={false}
                  dataSource={connectionErrorDistribution}
                  rowKey={(record) => `${record.error_stage || '-'}_${record.error_code || '-'}`}
                  columns={[
                    { title: '错误阶段', dataIndex: 'error_stage', key: 'error_stage' },
                    { title: '错误码', dataIndex: 'error_code', key: 'error_code', ellipsis: true },
                    { title: '数量', dataIndex: 'count', key: 'count', align: 'right' },
                    {
                      title: '占比',
                      dataIndex: 'ratio',
                      key: 'ratio',
                      align: 'right',
                      render: (value?: number) => formatRate(value),
                    },
                  ]}
                />
              </>
            ) : (
              <EmptyState description="当前筛选下暂无连接错误分布数据。" height={360} />
            )}
          </Card>
        </Col>
        <Col xl={12} span={24}>
          <Card
            title="探测错误占比"
            loading={summaryLoading}
            style={{ height: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
          >
            {showProbeEmpty ? (
              <EmptyState description="该节点当前没有探测样本，无法展示探测错误占比。" height={360} />
            ) : probePieData.length > 0 ? (
              <>
                <Pie {...buildErrorPieConfig(probePieData, '探测错误')} height={260} />
                <Table<ErrorTopItem>
                  size="small"
                  pagination={false}
                  dataSource={probeErrorDistribution}
                  rowKey={(record) => `${record.error_stage || '-'}_${record.error_code || '-'}`}
                  columns={[
                    { title: '错误阶段', dataIndex: 'error_stage', key: 'error_stage' },
                    { title: '错误码', dataIndex: 'error_code', key: 'error_code', ellipsis: true },
                    { title: '数量', dataIndex: 'count', key: 'count', align: 'right' },
                    {
                      title: '占比',
                      dataIndex: 'ratio',
                      key: 'ratio',
                      align: 'right',
                      render: (value: number) => formatRate(value),
                    },
                  ]}
                />
              </>
            ) : (
              <EmptyState description="当前筛选下暂无探测错误分布数据。" height={360} />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="节点明细" style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}>
        <Tabs
          items={[
            {
              key: 'connection',
              label: '连接明细',
              children: showConnectionEmpty ? (
                <EmptyState description="当前节点没有连接样本，连接明细为空。" />
              ) : (
                <ProTable<NodeConnectionResultItem>
                  rowKey="id"
                  actionRef={connectionActionRef}
                  search={false}
                  scroll={{ x: 1880 }}
                  columns={connectionColumns}
                  params={{
                    requestBaseKey: JSON.stringify(requestBase),
                    filters: JSON.stringify(connectionFilters),
                    reloadToken,
                  }}
                  request={async (params, sort) => {
                    try {
                      const firstSort = Object.entries(sort || {}).find(([, value]) => value);
                      const sortBy = (firstSort?.[0] as any) || 'received_at';
                      const order = toRequestOrder(firstSort?.[1]) || 'desc';

                      const response = await getNodeConnectionResults({
                        ...requestBase,
                        ...connectionFilters,
                        success:
                          connectionFilters.success === undefined
                            ? undefined
                            : connectionFilters.success === 'true',
                        page: Number(params.current || 1),
                        page_size: Number(params.pageSize || 20),
                        sort_by: sortBy,
                        order,
                      });

                      return {
                        data: response.data?.items || [],
                        total: response.data?.total || 0,
                        success: true,
                      };
                    } catch (error: any) {
                      message.error(error?.message || '连接明细加载失败');
                      return { data: [], total: 0, success: false };
                    }
                  }}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <Select
                          allowClear
                          style={{ width: 120 }}
                          placeholder="结果"
                          value={connectionFilters.success}
                          options={[
                            { label: '成功', value: 'true' },
                            { label: '失败', value: 'false' },
                          ]}
                          onChange={(value) =>
                            setConnectionFilters((prev) => ({ ...prev, success: value }))
                          }
                        />
                        <Input
                          style={{ width: 180 }}
                          placeholder="错误阶段"
                          value={connectionFilters.error_stage}
                          onChange={(event) =>
                            setConnectionFilters((prev) => ({
                              ...prev,
                              error_stage: event.target.value || undefined,
                            }))
                          }
                        />
                        <Input
                          style={{ width: 180 }}
                          placeholder="错误码"
                          value={connectionFilters.error_code}
                          onChange={(event) =>
                            setConnectionFilters((prev) => ({
                              ...prev,
                              error_code: event.target.value || undefined,
                            }))
                          }
                        />
                      </Space>
                    ),
                  }}
                />
              ),
            },
            {
              key: 'probe',
              label: '探测明细',
              children: showProbeEmpty ? (
                <EmptyState description="当前节点没有探测样本，探测明细为空。" />
              ) : (
                <ProTable<ProbeResultItem>
                  rowKey="id"
                  actionRef={probeActionRef}
                  search={false}
                  scroll={{ x: 2000 }}
                  columns={probeColumns}
                  params={{
                    requestBaseKey: JSON.stringify(requestBase),
                    filters: JSON.stringify(probeFilters),
                    reloadToken,
                  }}
                  request={async (params, sort) => {
                    try {
                      const firstSort = Object.entries(sort || {}).find(([, value]) => value);
                      const sortBy = (firstSort?.[0] as any) || 'received_at';
                      const order = toRequestOrder(firstSort?.[1]) || 'desc';

                      const response = await getVpnProbeResults({
                        ...requestBase,
                        ...probeFilters,
                        success:
                          probeFilters.success === undefined
                            ? undefined
                            : probeFilters.success === 'true',
                        page: Number(params.current || 1),
                        page_size: Number(params.pageSize || 20),
                        sort_by: sortBy,
                        order,
                      });

                      return {
                        data: response.data?.items || [],
                        total: response.data?.total || 0,
                        success: true,
                      };
                    } catch (error: any) {
                      message.error(error?.message || '探测明细加载失败');
                      return { data: [], total: 0, success: false };
                    }
                  }}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <Select
                          allowClear
                          style={{ width: 120 }}
                          placeholder="结果"
                          value={probeFilters.success}
                          options={[
                            { label: '成功', value: 'true' },
                            { label: '失败', value: 'false' },
                          ]}
                          onChange={(value) => setProbeFilters((prev) => ({ ...prev, success: value }))}
                        />
                        <Input
                          style={{ width: 180 }}
                          placeholder="错误码"
                          value={probeFilters.error_code}
                          onChange={(event) =>
                            setProbeFilters((prev) => ({
                              ...prev,
                              error_code: event.target.value || undefined,
                            }))
                          }
                        />
                      </Space>
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default NodeStatusDetailPage;
