import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  Badge,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  fetchPerformance,
  getPerformanceGeoDistribution,
  getPerformanceNodeStats,
  getPerformancePlatformStats,
  getPerformanceTrend,
} from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PLATFORM_COLOR: Record<string, string> = {
  ios: 'blue',
  android: 'green',
  windows: 'purple',
  macos: 'cyan',
  linux: 'orange',
};

const delayTag = (delay: number) => {
  if (delay <= 100) return <Tag color="success">{delay} ms</Tag>;
  if (delay <= 300) return <Tag color="warning">{delay} ms</Tag>;
  return <Tag color="error">{delay} ms</Tag>;
};

const successRateTag = (rate: number) => {
  if (rate >= 95) return <Tag color="success">{rate}%</Tag>;
  if (rate >= 80) return <Tag color="warning">{rate}%</Tag>;
  return <Tag color="error">{rate}%</Tag>;
};

const PerformancePage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  // Filter states for record list
  const [nodeFilter, setNodeFilter] = useState<number | undefined>();
  const [userFilter, setUserFilter] = useState<number | undefined>();
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [countryFilter, setCountryFilter] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<[number, number] | undefined>();

  // Stats panel states
  const [statsDays, setStatsDays] = useState(7);
  const [geoNodeId, setGeoNodeId] = useState<number | undefined>();
  const [platformNodeId, setPlatformNodeId] = useState<number | undefined>();

  // Trend drawer
  const [trendOpen, setTrendOpen] = useState(false);
  const [trendNodeId, setTrendNodeId] = useState<number | undefined>();
  const [trendDays, setTrendDays] = useState(7);
  const [trendGranularity, setTrendGranularity] = useState<'hour' | 'day'>(
    'day',
  );

  const { data: nodeStats, loading: nodeStatsLoading } = useRequest(
    () => getPerformanceNodeStats({ days: statsDays }),
    { refreshDeps: [statsDays] },
  );

  const { data: geoData, loading: geoLoading } = useRequest(
    () =>
      getPerformanceGeoDistribution({ days: statsDays, node_id: geoNodeId }),
    { refreshDeps: [statsDays, geoNodeId] },
  );

  const { data: platformData, loading: platformLoading } = useRequest(
    () =>
      getPerformancePlatformStats({ days: statsDays, node_id: platformNodeId }),
    { refreshDeps: [statsDays, platformNodeId] },
  );

  const { data: trendData, loading: trendLoading } = useRequest(
    () =>
      trendNodeId
        ? getPerformanceTrend({
            node_id: trendNodeId,
            days: trendDays,
            granularity: trendGranularity,
          })
        : Promise.resolve(undefined),
    { refreshDeps: [trendNodeId, trendDays, trendGranularity] },
  );

  const recordColumns: ProColumns<API.PerformanceRecord>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      search: false,
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      width: 180,
      render: (_, record) =>
        record.user ? (
          <Tooltip title={`ID: ${record.user_id}`}>
            <Text>{record.user.email}</Text>
          </Tooltip>
        ) : (
          `#${record.user_id}`
        ),
      search: false,
    },
    {
      title: '节点ID',
      dataIndex: 'node_id',
      width: 90,
      search: false,
    },
    {
      title: '延迟',
      dataIndex: 'delay',
      width: 100,
      search: false,
      render: (_, record) => delayTag(record.delay),
      sorter: (a, b) => a.delay - b.delay,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      width: 100,
      search: false,
      render: (_, record) => successRateTag(record.success_rate),
      sorter: (a, b) => a.success_rate - b.success_rate,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 100,
      search: false,
      render: (_, record) =>
        record.platform ? (
          <Tag color={PLATFORM_COLOR[record.platform] || 'default'}>
            {record.platform}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '客户端国家',
      dataIndex: 'client_country',
      width: 110,
      search: false,
      render: (_, record) => record.client_country || '-',
    },
    {
      title: '客户端城市',
      dataIndex: 'client_city',
      width: 110,
      search: false,
      render: (_, record) => record.client_city || '-',
    },
    {
      title: 'ISP',
      dataIndex: 'client_isp',
      width: 150,
      search: false,
      ellipsis: true,
      render: (_, record) => record.client_isp || '-',
    },
    {
      title: '客户端IP',
      dataIndex: 'client_ip',
      width: 130,
      search: false,
      render: (_, record) => record.client_ip || '-',
    },
    {
      title: '版本',
      dataIndex: 'app_version',
      width: 90,
      search: false,
      render: (_, record) => record.app_version || '-',
    },
    {
      title: '上报时间',
      dataIndex: 'created_at',
      width: 160,
      search: false,
      render: (_, record) =>
        record.created_at
          ? dayjs.unix(record.created_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
  ];

  const nodeStatColumns = [
    { title: '节点ID', dataIndex: 'node_id', key: 'node_id', width: 90 },
    {
      title: '上报次数',
      dataIndex: 'report_count',
      key: 'report_count',
      sorter: (
        a: API.PerformanceNodeStatItem,
        b: API.PerformanceNodeStatItem,
      ) => a.report_count - b.report_count,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (v: number) => delayTag(Math.round(v)),
      sorter: (
        a: API.PerformanceNodeStatItem,
        b: API.PerformanceNodeStatItem,
      ) => a.avg_delay - b.avg_delay,
    },
    {
      title: '最低延迟',
      dataIndex: 'min_delay',
      key: 'min_delay',
      render: (v: number) => <Tag color="success">{v} ms</Tag>,
    },
    {
      title: '最高延迟',
      dataIndex: 'max_delay',
      key: 'max_delay',
      render: (v: number) => <Tag color="error">{v} ms</Tag>,
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (v: number) => successRateTag(Math.round(v * 10) / 10),
      sorter: (
        a: API.PerformanceNodeStatItem,
        b: API.PerformanceNodeStatItem,
      ) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '独立用户',
      dataIndex: 'unique_users',
      key: 'unique_users',
      sorter: (
        a: API.PerformanceNodeStatItem,
        b: API.PerformanceNodeStatItem,
      ) => a.unique_users - b.unique_users,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.PerformanceNodeStatItem) => (
        <a
          onClick={() => {
            setTrendNodeId(record.node_id);
            setTrendOpen(true);
          }}
        >
          查看趋势
        </a>
      ),
    },
  ];

  const geoColumns = [
    { title: '国家', dataIndex: 'client_country', key: 'client_country' },
    { title: '上报次数', dataIndex: 'report_count', key: 'report_count' },
    { title: '独立用户', dataIndex: 'unique_users', key: 'unique_users' },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (v: number) => delayTag(Math.round(v)),
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (v: number) => successRateTag(Math.round(v * 10) / 10),
    },
  ];

  const platformColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (v: string) => (
        <Tag color={PLATFORM_COLOR[v] || 'default'}>{v}</Tag>
      ),
    },
    { title: '上报次数', dataIndex: 'report_count', key: 'report_count' },
    { title: '独立用户', dataIndex: 'unique_users', key: 'unique_users' },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (v: number) => delayTag(Math.round(v)),
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (v: number) => successRateTag(Math.round(v * 10) / 10),
    },
  ];

  const trendColumns = [
    { title: '时间', dataIndex: 'time_slot', key: 'time_slot' },
    { title: '上报次数', dataIndex: 'report_count', key: 'report_count' },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (v: number) => delayTag(Math.round(v)),
    },
    {
      title: '最低延迟',
      dataIndex: 'min_delay',
      key: 'min_delay',
      render: (v: number) => <Tag color="success">{v} ms</Tag>,
    },
    {
      title: '最高延迟',
      dataIndex: 'max_delay',
      key: 'max_delay',
      render: (v: number) => <Tag color="error">{v} ms</Tag>,
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (v: number) => successRateTag(Math.round(v * 10) / 10),
    },
  ];

  return (
    <PageContainer>
      {/* Stats period selector */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 8 }}>
        <Space>
          <span>统计周期：</span>
          <Select
            value={statsDays}
            onChange={setStatsDays}
            options={[
              { label: '近 7 天', value: 7 },
              { label: '近 14 天', value: 14 },
              { label: '近 30 天', value: 30 },
              { label: '近 90 天', value: 90 },
            ]}
            style={{ width: 120 }}
          />
        </Space>
      </Card>

      {/* Node aggregated stats */}
      <Card
        title="节点聚合统计"
        style={{ marginBottom: 16 }}
        loading={nodeStatsLoading}
      >
        <Table
          size="small"
          columns={nodeStatColumns}
          dataSource={(
            (nodeStats?.data as any as API.PerformanceNodeStatItem[]) || []
          ).map((item: API.PerformanceNodeStatItem, idx: number) => ({
            ...item,
            key: idx,
          }))}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Card>

      {/* Geo & Platform side by side */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            title="客户端地域分布"
            loading={geoLoading}
            extra={
              <Space>
                <span style={{ fontSize: 12, color: '#666' }}>节点ID：</span>
                <InputNumber
                  size="small"
                  placeholder="全部"
                  value={geoNodeId}
                  onChange={(v) => setGeoNodeId(v ?? undefined)}
                  style={{ width: 80 }}
                  min={1}
                />
              </Space>
            }
          >
            <Table
              size="small"
              columns={geoColumns}
              dataSource={(
                (geoData?.data as any as API.PerformanceGeoItem[]) || []
              ).map((item: API.PerformanceGeoItem, idx: number) => ({
                ...item,
                key: idx,
              }))}
              pagination={{ pageSize: 8 }}
              bordered
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="客户端平台分布"
            loading={platformLoading}
            extra={
              <Space>
                <span style={{ fontSize: 12, color: '#666' }}>节点ID：</span>
                <InputNumber
                  size="small"
                  placeholder="全部"
                  value={platformNodeId}
                  onChange={(v) => setPlatformNodeId(v ?? undefined)}
                  style={{ width: 80 }}
                  min={1}
                />
              </Space>
            }
          >
            <Table
              size="small"
              columns={platformColumns}
              dataSource={(
                (platformData?.data as any as API.PerformancePlatformItem[]) ||
                []
              ).map((item: API.PerformancePlatformItem, idx: number) => ({
                ...item,
                key: idx,
              }))}
              pagination={false}
              bordered
            />
          </Card>
        </Col>
      </Row>

      {/* Raw records */}
      <Card title="上报记录列表">
        {/* Manual filters */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Space>
            <span>节点ID：</span>
            <InputNumber
              placeholder="全部"
              value={nodeFilter}
              onChange={(v) => setNodeFilter(v ?? undefined)}
              style={{ width: 100 }}
              min={1}
            />
          </Space>
          <Space>
            <span>用户ID：</span>
            <InputNumber
              placeholder="全部"
              value={userFilter}
              onChange={(v) => setUserFilter(v ?? undefined)}
              style={{ width: 100 }}
              min={1}
            />
          </Space>
          <Space>
            <span>平台：</span>
            <Select
              placeholder="全部"
              value={platformFilter}
              onChange={(v) => setPlatformFilter(v)}
              allowClear
              style={{ width: 120 }}
              options={[
                { label: 'iOS', value: 'ios' },
                { label: 'Android', value: 'android' },
                { label: 'Windows', value: 'windows' },
                { label: 'macOS', value: 'macos' },
                { label: 'Linux', value: 'linux' },
              ]}
            />
          </Space>
          <Space>
            <span>国家：</span>
            <Select
              placeholder="全部"
              value={countryFilter}
              onChange={(v) => setCountryFilter(v)}
              allowClear
              style={{ width: 100 }}
              options={[
                { label: 'CN', value: 'CN' },
                { label: 'US', value: 'US' },
                { label: 'JP', value: 'JP' },
                { label: 'HK', value: 'HK' },
                { label: 'SG', value: 'SG' },
              ]}
            />
          </Space>
          <Space>
            <span>时间范围：</span>
            <RangePicker
              showTime
              onChange={(_, strings) => {
                if (strings[0] && strings[1]) {
                  setTimeRange([
                    dayjs(strings[0]).unix(),
                    dayjs(strings[1]).unix(),
                  ]);
                } else {
                  setTimeRange(undefined);
                }
              }}
            />
          </Space>
        </Space>

        <ProTable<API.PerformanceRecord>
          actionRef={actionRef}
          rowKey="id"
          search={false}
          toolBarRender={false}
          columns={recordColumns}
          request={async (params) => {
            const res = await fetchPerformance({
              node_id: nodeFilter,
              user_id: userFilter,
              platform: platformFilter as any,
              client_country: countryFilter,
              start_at: timeRange?.[0],
              end_at: timeRange?.[1],
              page: params.current,
              page_size: params.pageSize,
            });
            return {
              data: res?.data?.data || [],
              total: res?.data?.total || 0,
              success: true,
            };
          }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '50', '100'],
          }}
          scroll={{ x: 1200 }}
          size="small"
          bordered
        />
      </Card>

      {/* Trend Drawer */}
      <Drawer
        title={`节点 ${trendNodeId} 性能趋势`}
        open={trendOpen}
        onClose={() => setTrendOpen(false)}
        width={800}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Space>
            <span>统计天数：</span>
            <Select
              value={trendDays}
              onChange={setTrendDays}
              options={[
                { label: '7 天', value: 7 },
                { label: '14 天', value: 14 },
                { label: '30 天', value: 30 },
                { label: '90 天', value: 90 },
              ]}
              style={{ width: 100 }}
            />
          </Space>
          <Space>
            <span>粒度：</span>
            <Select
              value={trendGranularity}
              onChange={setTrendGranularity}
              options={[
                { label: '按天', value: 'day' },
                { label: '按小时', value: 'hour' },
              ]}
              style={{ width: 100 }}
            />
          </Space>
        </Space>

        <Table
          size="small"
          loading={trendLoading}
          columns={trendColumns}
          dataSource={((trendData?.data as any)?.data || []).map(
            (item: API.PerformanceTrendItem, idx: number) => ({
              ...item,
              key: idx,
            }),
          )}
          pagination={false}
          bordered
        />
      </Drawer>
    </PageContainer>
  );
};

export default PerformancePage;
