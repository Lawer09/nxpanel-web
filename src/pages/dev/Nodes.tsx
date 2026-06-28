import { Line } from '@ant-design/charts';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createNodeUser,
  deleteNode,
  deleteNodeUser,
  getNodeDetail,
  getNodeOnlineSummary,
  getNodeRuntime,
  getNodeRuntimeSamples,
  getNodeSnapshot,
  getNodeTrafficSeries,
  getNodeUserClientConfig,
  getUserClientConfigs,
  listNodeRuntimeEvents,
  listNodeSummaries,
  listNodeUsers,
  updateNodeUser,
} from '@/services/node-control/api';
import JsonBlock from './components/JsonBlock';
import NodeFormModal from './components/NodeFormModal';
import NodeUserClientConfigModal from './components/NodeUserClientConfigModal';
import NodeUserClientConfigsModal from './components/NodeUserClientConfigsModal';
import NodeUserModal from './components/NodeUserModal';
import NodeUsersManageModal from './components/NodeUsersManageModal';
import {
  buildMetricChartData,
  extractHealthy,
  fillTrafficChartData,
  formatBytes,
  formatDateTime,
  formatMetricValue,
  renderFreshTag,
  runtimeMetricOptions,
  summarizeStartup,
  summarizeTls,
  type RuntimeMetricKey,
} from './components/nodeRuntimeUtils';
import { normalizeNodeSnapshotConfig } from './components/SnapshotConfigEditor';
import DevAuthGate from './components/DevAuthGate';
import { formatUnitNumber, speedLimitUnits } from './components/UnitNumberInput';

const { RangePicker } = DatePicker;

const METRIC_WINDOW_OPTIONS = ['10m', '30m', '1h'].map((value) => ({
  label: value,
  value,
}));
const TRAFFIC_STEP_OPTIONS = ['1m'].map((value) => ({ label: value, value }));
const EVENT_TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'kernel', value: 'kernel' },
  { label: 'startup', value: 'startup' },
  { label: 'tls', value: 'tls' },
];

const POLL_INTERVALS: Record<string, number> = {
  runtime: 15_000,
  metrics: 15_000,
  online: 15_000,
  traffic: 60_000,
  events: 30_000,
};

const NodesContent: React.FC = () => {
  const { message } = App.useApp();
  const [rows, setRows] = useState<API.ControlNodeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalNode, setModalNode] = useState<API.ControlNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailNode, setDetailNode] = useState<API.ControlNode | null>(null);
  const [runtime, setRuntime] = useState<API.ControlNodeRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<API.ControlNodeSnapshot | null>(null);
  const [users, setUsers] = useState<API.ControlNodeUser[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.ControlNodeUser | null>(null);
  const [usersManageOpen, setUsersManageOpen] = useState(false);
  const [usersManageNode, setUsersManageNode] = useState<API.ControlNode | null>(null);
  const [clientConfigOpen, setClientConfigOpen] = useState(false);
  const [clientConfigLoading, setClientConfigLoading] = useState(false);
  const [clientConfig, setClientConfig] = useState<API.ControlNodeUserClientConfig | null>(null);
  const [clientConfigsOpen, setClientConfigsOpen] = useState(false);
  const [clientConfigsLoading, setClientConfigsLoading] = useState(false);
  const [clientConfigs, setClientConfigs] = useState<API.ControlUserClientConfigsResponse | null>(null);
  const [detailTab, setDetailTab] = useState('basic');

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<API.ControlRuntimeSamplesResponse | null>(null);
  const [metricsWindow, setMetricsWindow] = useState('30m');
  const [metricsAgentId, setMetricsAgentId] = useState<string | undefined>();
  const [metricsKey, setMetricsKey] = useState<RuntimeMetricKey>('cpu');

  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficData, setTrafficData] = useState<API.ControlTrafficSeriesResponse | null>(null);
  const [trafficAgentId, setTrafficAgentId] = useState<string | undefined>();
  const [trafficUserId, setTrafficUserId] = useState<number | undefined>();
  const [trafficStep, setTrafficStep] = useState('1m');
  const [trafficRange, setTrafficRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'hour'),
    dayjs(),
  ]);

  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineData, setOnlineData] = useState<API.ControlNodeOnlineSummary | null>(null);
  const [onlineAgentId, setOnlineAgentId] = useState<string | undefined>();

  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsData, setEventsData] = useState<API.ControlRuntimeEvent[]>([]);
  const [eventsAgentId, setEventsAgentId] = useState<string | undefined>();
  const [eventsType, setEventsType] = useState<string>('');
  const [eventsLimit, setEventsLimit] = useState<number>(50);

  const agentOptions = useMemo(
    () =>
      (runtime?.agents ?? []).map((item) => ({
        label: `${item.agent_id} (${item.machine_id})`,
        value: item.agent_id,
      })),
    [runtime],
  );

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await listNodeSummaries();
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load nodes.');
        return;
      }
      setRows(response.data);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load nodes.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (nodeId: number) => {
    try {
      const [detailResponse, runtimeResponse, snapshotResponse, userResponse] = await Promise.all([
        getNodeDetail(nodeId),
        getNodeRuntime(nodeId),
        getNodeSnapshot(nodeId),
        listNodeUsers(nodeId),
      ]);
      if (detailResponse.code === 0) setDetailNode(detailResponse.data);
      if (runtimeResponse.code === 0) setRuntime(runtimeResponse.data);
      if (snapshotResponse.code === 0) setSnapshot(snapshotResponse.data);
      if (userResponse.code === 0) setUsers(userResponse.data);
      setDetailOpen(true);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load node detail.');
    }
  };

  const loadMetrics = async (nodeId: number) => {
    setMetricsLoading(true);
    try {
      const response = await getNodeRuntimeSamples(nodeId, {
        agent_id: metricsAgentId,
        window: metricsWindow,
      });
      if (response.code === 0) {
        setMetricsData(response.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load metrics.');
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadTraffic = async (nodeId: number) => {
    setTrafficLoading(true);
    try {
      const response = await getNodeTrafficSeries(nodeId, {
        agent_id: trafficAgentId,
        user_id: trafficUserId,
        start_time: trafficRange[0].toISOString(),
        end_time: trafficRange[1].toISOString(),
        step: trafficStep,
      });
      if (response.code === 0) {
        setTrafficData(response.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load traffic.');
    } finally {
      setTrafficLoading(false);
    }
  };

  const loadOnline = async (nodeId: number) => {
    setOnlineLoading(true);
    try {
      const response = await getNodeOnlineSummary(nodeId, {
        agent_id: onlineAgentId,
        include_users: true,
      });
      if (response.code === 0) {
        setOnlineData(response.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load online summary.');
    } finally {
      setOnlineLoading(false);
    }
  };

  const loadEvents = async (nodeId: number) => {
    setEventsLoading(true);
    try {
      const response = await listNodeRuntimeEvents(nodeId, {
        agent_id: eventsAgentId,
        event_type: eventsType || undefined,
        limit: eventsLimit,
      });
      if (response.code === 0) {
        setEventsData(response.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load runtime events.');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    if (!detailOpen || !detailNode) return;
    if (detailTab === 'metrics') {
      void loadMetrics(detailNode.id);
    } else if (detailTab === 'traffic') {
      void loadTraffic(detailNode.id);
    } else if (detailTab === 'online') {
      void loadOnline(detailNode.id);
    } else if (detailTab === 'events') {
      void loadEvents(detailNode.id);
    }
  }, [
    detailOpen,
    detailNode?.id,
    detailTab,
    metricsAgentId,
    metricsWindow,
    trafficAgentId,
    trafficUserId,
    trafficStep,
    trafficRange,
    onlineAgentId,
    eventsAgentId,
    eventsType,
    eventsLimit,
  ]);

  useEffect(() => {
    if (!detailOpen || !detailNode) return undefined;
    const interval = POLL_INTERVALS[detailTab];
    if (!interval) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (detailTab === 'runtime') {
        void loadDetail(detailNode.id);
      } else if (detailTab === 'metrics') {
        void loadMetrics(detailNode.id);
      } else if (detailTab === 'traffic') {
        void loadTraffic(detailNode.id);
      } else if (detailTab === 'online') {
        void loadOnline(detailNode.id);
      } else if (detailTab === 'events') {
        void loadEvents(detailNode.id);
      }
    }, interval);
    return () => window.clearInterval(timer);
  }, [
    detailOpen,
    detailNode?.id,
    detailTab,
    metricsAgentId,
    metricsWindow,
    trafficAgentId,
    trafficUserId,
    trafficStep,
    trafficRange,
    onlineAgentId,
    eventsAgentId,
    eventsType,
    eventsLimit,
  ]);

  const handleOpenClientConfig = async (nodeId: number, userId: number) => {
    setClientConfigLoading(true);
    setClientConfigOpen(true);
    try {
      const response = await getNodeUserClientConfig(nodeId, userId);
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load client config.');
        setClientConfig(null);
        return;
      }
      setClientConfig(response.data);
    } catch (error: any) {
      setClientConfig(null);
      message.error(error?.message || 'Failed to load client config.');
    } finally {
      setClientConfigLoading(false);
    }
  };

  const handleOpenUserClientConfigs = async (userId: number) => {
    setClientConfigsLoading(true);
    setClientConfigsOpen(true);
    try {
      const response = await getUserClientConfigs(userId);
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load client configs.');
        setClientConfigs(null);
        return;
      }
      setClientConfigs(response.data);
    } catch (error: any) {
      setClientConfigs(null);
      message.error(error?.message || 'Failed to load client configs.');
    } finally {
      setClientConfigsLoading(false);
    }
  };

  const metricChartData = useMemo(
    () => buildMetricChartData(metricsData?.series ?? [], metricsKey),
    [metricsData, metricsKey],
  );
  const trafficChartData = useMemo(
    () => fillTrafficChartData(trafficData),
    [trafficData],
  );

  const columns: ProColumns<API.ControlNodeSummary>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => record.client?.name || '-',
    },
    {
      title: 'Node Tag',
      key: 'node_tag',
      render: (_, record) => record.client?.node_tag || '-',
    },
    { title: 'Tag', dataIndex: 'tag' },
    { title: 'Type', dataIndex: 'type', render: (_, record) => <Tag>{record.type}</Tag> },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 100,
      render: (_, record) => <Switch checked={record.enabled} disabled />,
    },
    { title: 'Bindings', dataIndex: 'binding_count', width: 100 },
    { title: 'Users', dataIndex: 'user_count', width: 80 },
    {
      title: 'Latest Startup',
      key: 'latest_startup',
      render: (_, record) => {
        const healthy = extractHealthy(record.latest_startup);
        return healthy === undefined ? <Tag>Unknown</Tag> : <Tag color={healthy ? 'success' : 'error'}>{healthy ? 'Healthy' : 'Failed'}</Tag>;
      },
    },
    {
      title: 'Latest Agent',
      dataIndex: 'latest_runtime_agent',
      renderText: (_, record) => record.latest_runtime_agent || '-',
    },
    {
      title: 'Reported At',
      dataIndex: 'latest_reported_at',
      renderText: (_, record) => formatDateTime(record.latest_reported_at),
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            setDetailTab('basic');
            void loadDetail(record.id);
          }}
        >
          Detail
        </a>,
        <a
          key="snapshot"
          onClick={() => {
            setDetailTab('snapshot');
            void loadDetail(record.id);
          }}
        >
          Snapshot
        </a>,
        <a
          key="edit"
          onClick={async () => {
            const detail = await getNodeDetail(record.id);
            if (detail.code !== 0) {
              message.error(detail.message || 'Failed to load node.');
              return;
            }
            setModalNode(detail.data);
            setModalOpen(true);
          }}
        >
          Edit
        </a>,
        <a
          key="users"
          onClick={async () => {
            const detail = await getNodeDetail(record.id);
            if (detail.code !== 0) {
              message.error(detail.message || 'Failed to load node.');
              return;
            }
            setUsersManageNode(detail.data);
            setUsersManageOpen(true);
          }}
        >
          Users
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this node?"
          onConfirm={async () => {
            const response = await deleteNode(record.id);
            if (response.code !== 0) {
              message.error(response.message || 'Delete failed.');
              return;
            }
            message.success('Node deleted.');
            void loadRows();
          }}
        >
          <a>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ControlNodeSummary>
        rowKey="id"
        loading={loading}
        columns={columns}
        search={false}
        pagination={false}
        dataSource={rows}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => {
              setModalNode(null);
              setModalOpen(true);
            }}
          >
            Create Node
          </Button>,
          <Button key="refresh" onClick={() => void loadRows()}>
            Refresh
          </Button>,
        ]}
      />

      <NodeFormModal
        open={modalOpen}
        node={modalNode}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setModalNode(null);
        }}
        onSuccess={() => {
          void loadRows();
        }}
      />

      <Drawer
        title={detailNode ? `Node ${detailNode.id}` : 'Node Detail'}
        open={detailOpen}
        width={1100}
        onClose={() => {
          setDetailOpen(false);
          setDetailNode(null);
          setRuntime(null);
          setSnapshot(null);
          setUsers([]);
          setMetricsData(null);
          setTrafficData(null);
          setOnlineData(null);
          setEventsData([]);
          setClientConfig(null);
          setClientConfigOpen(false);
          setClientConfigs(null);
          setClientConfigsOpen(false);
          setDetailTab('basic');
        }}
      >
        {detailNode ? (
          <Tabs
            activeKey={detailTab}
            onChange={setDetailTab}
            items={[
              {
                key: 'basic',
                label: 'Basic',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="ID">{detailNode.id}</Descriptions.Item>
                    <Descriptions.Item label="Tag">{detailNode.tag}</Descriptions.Item>
                    <Descriptions.Item label="Client Name">{detailNode.client?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Node Tag">{detailNode.client?.node_tag || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Public Host">{detailNode.client?.public_host || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Public Port">
                      {detailNode.client?.public_port || detailNode.listen?.port || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">{detailNode.type}</Descriptions.Item>
                    <Descriptions.Item label="Enabled">
                      {detailNode.enabled ? 'true' : 'false'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated At">
                      {formatDateTime(detailNode.updated_at)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'config',
                label: 'Config',
                children: (
                  <JsonBlock
                    title="Node Snapshot Config"
                    value={normalizeNodeSnapshotConfig(detailNode)}
                  />
                ),
              },
              {
                key: 'snapshot',
                label: 'Snapshot',
                children: snapshot ? (
                  <>
                    <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="ID">{snapshot.id}</Descriptions.Item>
                      <Descriptions.Item label="Tag">{snapshot.tag}</Descriptions.Item>
                      <Descriptions.Item label="Type">{snapshot.type}</Descriptions.Item>
                      <Descriptions.Item label="Enabled">
                        {snapshot.enabled ? 'true' : 'false'}
                      </Descriptions.Item>
                    </Descriptions>
                    <JsonBlock title="Agent Snapshot" value={snapshot} />
                  </>
                ) : (
                  <Empty description="No snapshot" />
                ),
              },
              {
                key: 'runtime',
                label: 'Runtime',
                children: runtime ? (
                  <>
                    <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Client">
                        {runtime.node.client?.name || runtime.node.tag || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Type">{runtime.node.type}</Descriptions.Item>
                      <Descriptions.Item label="Enabled">
                        {runtime.node.enabled ? 'true' : 'false'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Updated At">
                        {formatDateTime(runtime.node.updated_at)}
                      </Descriptions.Item>
                    </Descriptions>
                    <Table
                      rowKey="agent_id"
                      pagination={false}
                      dataSource={runtime.agents}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <JsonBlock title="startup" value={record.startup} />
                            <JsonBlock title="tls" value={record.tls} />
                            <JsonBlock title="metrics" value={record.metrics} />
                          </Space>
                        ),
                      }}
                      columns={[
                        { title: 'Agent ID', dataIndex: 'agent_id' },
                        { title: 'Machine ID', dataIndex: 'machine_id' },
                        { title: 'Status', dataIndex: 'agent_status' },
                        {
                          title: 'Last Seen',
                          render: (_, record) => formatDateTime(record.last_seen_at),
                        },
                        {
                          title: 'Fresh',
                          render: (_, record) =>
                            renderFreshTag(record.fresh, record.source, record.stale_seconds),
                        },
                        {
                          title: 'Source',
                          dataIndex: 'source',
                          render: (_, record: API.ControlNodeRuntimeAgent) => record.source || '-',
                        },
                        {
                          title: 'Stale',
                          render: (_, record) =>
                            record.stale_seconds === undefined
                              ? '-'
                              : `${record.stale_seconds}s`,
                        },
                        {
                          title: 'Startup',
                          render: (_, record) => summarizeStartup(record.startup),
                        },
                        {
                          title: 'TLS',
                          render: (_, record) => summarizeTls(record.tls),
                        },
                        { title: 'Online Users', dataIndex: 'online_users' },
                        { title: 'Online IPs', dataIndex: 'online_ips' },
                        {
                          title: 'Upload',
                          render: (_, record) => formatBytes(record.traffic_upload_bytes),
                        },
                        {
                          title: 'Download',
                          render: (_, record) => formatBytes(record.traffic_download_bytes),
                        },
                        {
                          title: 'Reported At',
                          render: (_, record) =>
                            formatDateTime(record.runtime_reported_at || record.reported_at),
                        },
                        {
                          title: 'Online Reported',
                          render: (_, record) => formatDateTime(record.online_reported_at),
                        },
                        {
                          title: 'Traffic Reported',
                          render: (_, record) => formatDateTime(record.traffic_reported_at),
                        },
                      ]}
                    />
                  </>
                ) : (
                  <Empty description="No runtime" />
                ),
              },
              {
                key: 'metrics',
                label: 'Metrics',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Select
                        style={{ width: 160 }}
                        allowClear
                        placeholder="Agent"
                        options={agentOptions}
                        value={metricsAgentId}
                        onChange={setMetricsAgentId}
                      />
                      <Select
                        style={{ width: 120 }}
                        options={METRIC_WINDOW_OPTIONS}
                        value={metricsWindow}
                        onChange={setMetricsWindow}
                      />
                      <Select
                        style={{ width: 200 }}
                        options={runtimeMetricOptions}
                        value={metricsKey}
                        onChange={(value) => setMetricsKey(value as RuntimeMetricKey)}
                      />
                      <Button onClick={() => detailNode && void loadMetrics(detailNode.id)}>Refresh</Button>
                    </Space>
                    {metricChartData.length ? (
                      <Line
                        loading={metricsLoading}
                        data={metricChartData}
                        xField="time"
                        yField="value"
                        seriesField="series"
                        smooth
                        height={320}
                        tooltip={{
                          title: 'time',
                          items: [
                            (datum: any) => ({
                              name: datum.series,
                              value: formatMetricValue(Number(datum.value ?? 0), metricsKey),
                            }),
                          ],
                        }}
                      />
                    ) : (
                      <Empty description={metricsLoading ? 'Loading...' : 'No samples'} />
                    )}
                  </Space>
                ),
              },
              {
                key: 'traffic',
                label: 'Traffic',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Select
                        style={{ width: 160 }}
                        allowClear
                        placeholder="Agent"
                        options={agentOptions}
                        value={trafficAgentId}
                        onChange={setTrafficAgentId}
                      />
                      <InputNumber
                        style={{ width: 140 }}
                        placeholder="User ID"
                        value={trafficUserId}
                        onChange={(value) => setTrafficUserId(value ?? undefined)}
                      />
                      <RangePicker
                        showTime
                        value={trafficRange}
                        onChange={(value) => {
                          if (value?.[0] && value?.[1]) {
                            setTrafficRange([value[0], value[1]]);
                          }
                        }}
                      />
                      <Select
                        style={{ width: 100 }}
                        options={TRAFFIC_STEP_OPTIONS}
                        value={trafficStep}
                        onChange={setTrafficStep}
                      />
                      <Button onClick={() => detailNode && void loadTraffic(detailNode.id)}>Refresh</Button>
                    </Space>
                    {trafficChartData.length ? (
                      <Line
                        loading={trafficLoading}
                        data={trafficChartData}
                        xField="time"
                        yField="value"
                        seriesField="series"
                        smooth
                        height={320}
                        tooltip={{
                          title: 'time',
                          items: [
                            (datum: any) => ({
                              name: datum.series,
                              value: formatBytes(Number(datum.value ?? 0)),
                            }),
                          ],
                        }}
                      />
                    ) : (
                      <Empty description={trafficLoading ? 'Loading...' : 'No traffic data'} />
                    )}
                  </Space>
                ),
              },
              {
                key: 'online',
                label: 'Online',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Select
                        style={{ width: 160 }}
                        allowClear
                        placeholder="Agent"
                        options={agentOptions}
                        value={onlineAgentId}
                        onChange={setOnlineAgentId}
                      />
                      <Button onClick={() => detailNode && void loadOnline(detailNode.id)}>Refresh</Button>
                    </Space>
                    <Space wrap size={16}>
                      <Card loading={onlineLoading}>
                        <Card.Meta
                          title="Online Users"
                          description={onlineData?.online_users ?? 0}
                        />
                      </Card>
                      <Card loading={onlineLoading}>
                        <Card.Meta
                          title="Online IPs"
                          description={onlineData?.online_ips ?? 0}
                        />
                      </Card>
                    </Space>
                    <Table
                      rowKey="user_id"
                      pagination={false}
                      loading={onlineLoading}
                      dataSource={onlineData?.users ?? []}
                      columns={[
                        { title: 'User ID', dataIndex: 'user_id' },
                        { title: 'Online Count', dataIndex: 'online_count' },
                      ]}
                    />
                  </Space>
                ),
              },
              {
                key: 'events',
                label: 'Events',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Select
                        style={{ width: 160 }}
                        allowClear
                        placeholder="Agent"
                        options={agentOptions}
                        value={eventsAgentId}
                        onChange={setEventsAgentId}
                      />
                      <Select
                        style={{ width: 160 }}
                        options={EVENT_TYPE_OPTIONS}
                        value={eventsType}
                        onChange={setEventsType}
                      />
                      <InputNumber
                        style={{ width: 120 }}
                        min={1}
                        value={eventsLimit}
                        onChange={(value) => setEventsLimit(value ?? 50)}
                      />
                      <Button onClick={() => detailNode && void loadEvents(detailNode.id)}>Refresh</Button>
                    </Space>
                    <Table
                      rowKey="id"
                      pagination={false}
                      loading={eventsLoading}
                      dataSource={eventsData}
                      expandable={{
                        expandedRowRender: (record) => (
                          <JsonBlock title="payload" value={record.payload} />
                        ),
                      }}
                      columns={[
                        {
                          title: 'Reported At',
                          render: (_, record) => formatDateTime(record.reported_at),
                        },
                        { title: 'Type', dataIndex: 'event_type' },
                        {
                          title: 'Healthy',
                          render: (_, record) =>
                            record.healthy === undefined ? '-' : record.healthy ? 'true' : 'false',
                        },
                        { title: 'State', dataIndex: 'state' },
                        { title: 'Stage', dataIndex: 'stage' },
                        { title: 'Last Error', dataIndex: 'last_error', ellipsis: true },
                        { title: 'Agent ID', dataIndex: 'agent_id' },
                      ]}
                    />
                  </Space>
                ),
              },
              {
                key: 'users',
                label: 'Users',
                children: (
                  <>
                    <Space style={{ marginBottom: 16 }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          setEditingUser(null);
                          setUserModalOpen(true);
                        }}
                      >
                        Add User
                      </Button>
                    </Space>
                    <Table
                      rowKey="user_id"
                      pagination={false}
                      dataSource={users}
                      columns={[
                        { title: 'User ID', dataIndex: 'user_id' },
                        { title: 'UUID', dataIndex: 'uuid' },
                        {
                          title: 'User Speed',
                          dataIndex: 'speed_limit',
                          render: (_, record) =>
                            formatUnitNumber(record.speed_limit ?? 0, speedLimitUnits),
                        },
                        { title: 'IP Limit', dataIndex: 'ip_limit' },
                        { title: 'Status', dataIndex: 'status' },
                        {
                          title: 'Actions',
                          render: (_, record) => (
                            <Space>
                              <a
                                onClick={() =>
                                  void handleOpenClientConfig(detailNode.id, record.user_id)
                                }
                              >
                                Get Config
                              </a>
                              <a onClick={() => void handleOpenUserClientConfigs(record.user_id)}>
                                All Configs
                              </a>
                              <a
                                onClick={() => {
                                  setEditingUser(record);
                                  setUserModalOpen(true);
                                }}
                              >
                                Edit
                              </a>
                              <a
                                onClick={async () => {
                                  const response = await deleteNodeUser(detailNode.id, record.user_id);
                                  if (response.code !== 0) {
                                    message.error(response.message || 'Delete failed.');
                                    return;
                                  }
                                  message.success('User deleted.');
                                  void loadDetail(detailNode.id);
                                }}
                              >
                                Delete
                              </a>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </>
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>

      <NodeUserModal
        open={userModalOpen}
        current={editingUser}
        onOpenChange={(open) => {
          setUserModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        onSubmit={async (values) => {
          if (!detailNode) return;
          const response = editingUser
            ? await updateNodeUser(
                detailNode.id,
                editingUser.user_id,
                values as API.ControlNodeUserUpdateParams,
              )
            : await createNodeUser(
                detailNode.id,
                values as API.ControlNodeUserCreateParams,
              );
          if (response.code !== 0) {
            message.error(response.message || 'Save failed.');
            return;
          }
          message.success(editingUser ? 'User updated.' : 'User created.');
          setUserModalOpen(false);
          setEditingUser(null);
          await loadDetail(detailNode.id);
        }}
      />

      <NodeUsersManageModal
        open={usersManageOpen}
        nodeId={usersManageNode?.id}
        nodeTag={usersManageNode?.tag}
        onOpenChange={(open) => {
          setUsersManageOpen(open);
          if (!open) setUsersManageNode(null);
        }}
        onSuccess={async () => {
          await loadRows();
          const currentDetailNodeId = detailNode?.id;
          if (currentDetailNodeId && currentDetailNodeId === usersManageNode?.id) {
            await loadDetail(currentDetailNodeId);
          }
        }}
      />

      <NodeUserClientConfigModal
        open={clientConfigOpen}
        loading={clientConfigLoading}
        value={clientConfig}
        onOpenChange={(open) => {
          setClientConfigOpen(open);
          if (!open) setClientConfig(null);
        }}
      />

      <NodeUserClientConfigsModal
        open={clientConfigsOpen}
        loading={clientConfigsLoading}
        value={clientConfigs}
        onOpenChange={(open) => {
          setClientConfigsOpen(open);
          if (!open) setClientConfigs(null);
        }}
      />
    </PageContainer>
  );
};

const NodesPage: React.FC = () => (
  <DevAuthGate>
    <NodesContent />
  </DevAuthGate>
);

export default NodesPage;
