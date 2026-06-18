import { Line } from '@ant-design/charts';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import dayjs, { type Dayjs } from 'dayjs';
import {
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createAgent,
  createAgentBinding,
  deleteAgent,
  deleteAgentBinding,
  getAgentRuntime,
  getAgentRuntimeSamples,
  getAgentTrafficSeries,
  listAgentBindings,
  listAgentRuntimeEvents,
  listAgents,
  listNodeSummaries,
  resetAgentSecret,
  updateAgent,
  updateAgentBinding,
} from '@/services/node-control/api';
import AgentFormModal from './components/AgentFormModal';
import DevAuthGate from './components/DevAuthGate';
import JsonBlock from './components/JsonBlock';
import {
  buildMetricChartData,
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

const { Paragraph, Text } = Typography;
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
  nodes: 15_000,
  metrics: 15_000,
  traffic: 60_000,
  events: 30_000,
};

const AgentsContent: React.FC = () => {
  const { message } = App.useApp();
  const [rows, setRows] = useState<API.ControlAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<API.ControlAgent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('basic');
  const [runtime, setRuntime] = useState<API.ControlAgentRuntime | null>(null);
  const [bindings, setBindings] = useState<API.ControlBinding[]>([]);
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [nodeOptions, setNodeOptions] = useState<{ label: string; value: number }[]>([]);
  const [secretResult, setSecretResult] = useState<{ agent_id: string; agent_secret: string } | null>(null);
  const [bindingForm] = Form.useForm();

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsData, setMetricsData] = useState<API.ControlRuntimeSamplesResponse | null>(null);
  const [metricsWindow, setMetricsWindow] = useState('30m');
  const [metricsNodeId, setMetricsNodeId] = useState<number | undefined>();
  const [metricsKey, setMetricsKey] = useState<RuntimeMetricKey>('cpu');

  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficData, setTrafficData] = useState<API.ControlTrafficSeriesResponse | null>(null);
  const [trafficNodeId, setTrafficNodeId] = useState<number | undefined>();
  const [trafficUserId, setTrafficUserId] = useState<number | undefined>();
  const [trafficStep, setTrafficStep] = useState('1m');
  const [trafficRange, setTrafficRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(1, 'hour'),
    dayjs(),
  ]);

  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsData, setEventsData] = useState<API.ControlRuntimeEvent[]>([]);
  const [eventsType, setEventsType] = useState<string>('');
  const [eventsLimit, setEventsLimit] = useState<number>(50);

  const runtimeNodeOptions = useMemo(
    () =>
      (runtime?.nodes ?? []).map((item) => ({
        label: `${item.node_id} - ${item.client?.name || item.tag}`,
        value: item.node_id,
      })),
    [runtime],
  );

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await listAgents();
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load agents.');
        return;
      }
      setRows(response.data);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load agents.');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (agentId: string) => {
    try {
      const [runtimeResponse, bindingsResponse, nodesResponse] = await Promise.all([
        getAgentRuntime(agentId),
        listAgentBindings(agentId),
        listNodeSummaries(),
      ]);
      if (runtimeResponse.code === 0) setRuntime(runtimeResponse.data);
      if (bindingsResponse.code === 0) setBindings(bindingsResponse.data);
      if (nodesResponse.code === 0) {
        setNodeOptions(
          nodesResponse.data.map((node) => ({
            label: `${node.id} - ${node.client?.name || node.tag}`,
            value: node.id,
          })),
        );
      }
      setDetailOpen(true);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load agent detail.');
    }
  };

  const loadMetrics = async (agentId: string) => {
    setMetricsLoading(true);
    try {
      const response = await getAgentRuntimeSamples(agentId, {
        node_id: metricsNodeId,
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

  const loadTraffic = async (agentId: string) => {
    setTrafficLoading(true);
    try {
      const response = await getAgentTrafficSeries(agentId, {
        node_id: trafficNodeId,
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

  const loadEvents = async (agentId: string) => {
    setEventsLoading(true);
    try {
      const response = await listAgentRuntimeEvents(agentId, {
        event_type: eventsType || undefined,
        limit: eventsLimit,
      });
      if (response.code === 0) {
        setEventsData(response.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    if (!detailOpen || !runtime) return;
    if (detailTab === 'metrics') {
      void loadMetrics(runtime.agent.agent_id);
    } else if (detailTab === 'traffic') {
      void loadTraffic(runtime.agent.agent_id);
    } else if (detailTab === 'events') {
      void loadEvents(runtime.agent.agent_id);
    }
  }, [
    detailOpen,
    runtime?.agent.agent_id,
    detailTab,
    metricsWindow,
    metricsNodeId,
    trafficNodeId,
    trafficUserId,
    trafficStep,
    trafficRange,
    eventsType,
    eventsLimit,
  ]);

  useEffect(() => {
    if (!detailOpen || !runtime) return undefined;
    const interval = POLL_INTERVALS[detailTab];
    if (!interval) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (detailTab === 'nodes') {
        void loadDetail(runtime.agent.agent_id);
      } else if (detailTab === 'metrics') {
        void loadMetrics(runtime.agent.agent_id);
      } else if (detailTab === 'traffic') {
        void loadTraffic(runtime.agent.agent_id);
      } else if (detailTab === 'events') {
        void loadEvents(runtime.agent.agent_id);
      }
    }, interval);
    return () => window.clearInterval(timer);
  }, [
    detailOpen,
    runtime?.agent.agent_id,
    detailTab,
    metricsWindow,
    metricsNodeId,
    trafficNodeId,
    trafficUserId,
    trafficStep,
    trafficRange,
    eventsType,
    eventsLimit,
  ]);

  const columns: ProColumns<API.ControlAgent>[] = [
    { title: 'Agent ID', dataIndex: 'agent_id' },
    { title: 'Machine ID', dataIndex: 'machine_id' },
    { title: 'Status', dataIndex: 'status', render: (_, record) => <Tag>{record.status}</Tag> },
    { title: 'Snapshot', dataIndex: 'snapshot_version', renderText: (_, record) => record.snapshot_version || '-' },
    { title: 'Pull', dataIndex: 'pull_interval', width: 90 },
    { title: 'Report', dataIndex: 'report_interval', width: 90 },
    { title: 'Last Seen', dataIndex: 'last_seen_at', renderText: (_, record) => record.last_seen_at || '-' },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            setDetailTab('basic');
            void loadDetail(record.agent_id);
          }}
        >
          Detail
        </a>,
        <a
          key="edit"
          onClick={() => {
            setEditingRow(record);
            setModalOpen(true);
          }}
        >
          Edit
        </a>,
        <a
          key="reset"
          onClick={async () => {
            const response = await resetAgentSecret(record.agent_id);
            if (response.code !== 0) {
              message.error(response.message || 'Reset failed.');
              return;
            }
            setSecretResult({
              agent_id: record.agent_id,
              agent_secret: response.data.agent_secret,
            });
            void loadRows();
          }}
        >
          Reset Secret
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this agent?"
          onConfirm={async () => {
            const response = await deleteAgent(record.agent_id);
            if (response.code !== 0) {
              message.error(response.message || 'Delete failed.');
              return;
            }
            message.success('Agent deleted.');
            void loadRows();
          }}
        >
          <a>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  const metricChartData = useMemo(
    () => buildMetricChartData(metricsData?.series ?? [], metricsKey),
    [metricsData, metricsKey],
  );
  const trafficChartData = useMemo(
    () => fillTrafficChartData(trafficData),
    [trafficData],
  );

  return (
    <PageContainer>
      <ProTable<API.ControlAgent>
        rowKey="agent_id"
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
              setEditingRow(null);
              setModalOpen(true);
            }}
          >
            Create Agent
          </Button>,
          <Button key="refresh" onClick={() => void loadRows()}>
            Refresh
          </Button>,
        ]}
      />

      <AgentFormModal
        open={modalOpen}
        current={editingRow}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingRow(null);
        }}
        onSubmit={async (values) => {
          const response = editingRow
            ? await updateAgent(editingRow.agent_id, values as API.ControlAgentUpdateParams)
            : await createAgent(values as API.ControlAgentCreateParams);
          if (response.code !== 0) {
            message.error(response.message || 'Save failed.');
            return;
          }
          if (!editingRow && 'agent_secret' in response.data) {
            setSecretResult({
              agent_id: (response.data as { agent: API.ControlAgent; agent_secret: string }).agent.agent_id,
              agent_secret: (response.data as { agent: API.ControlAgent; agent_secret: string }).agent_secret,
            });
          }
          message.success(editingRow ? 'Agent updated.' : 'Agent created.');
          setModalOpen(false);
          setEditingRow(null);
          await loadRows();
        }}
      />

      <Drawer
        title={runtime ? `Agent ${runtime.agent.agent_id}` : 'Agent Detail'}
        open={detailOpen}
        width={1100}
        onClose={() => {
          setDetailOpen(false);
          setRuntime(null);
          setBindings([]);
          setMetricsData(null);
          setTrafficData(null);
          setEventsData([]);
          setDetailTab('basic');
          bindingForm.resetFields();
        }}
      >
        {runtime ? (
          <Tabs
            activeKey={detailTab}
            onChange={setDetailTab}
            items={[
              {
                key: 'basic',
                label: 'Basic',
                children: (
                  <>
                    <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Agent ID">{runtime.agent.agent_id}</Descriptions.Item>
                      <Descriptions.Item label="Machine ID">{runtime.agent.machine_id}</Descriptions.Item>
                      <Descriptions.Item label="Status">{runtime.agent.status}</Descriptions.Item>
                      <Descriptions.Item label="Last Seen">
                        {formatDateTime(runtime.agent.last_seen_at)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Snapshot">{runtime.agent.snapshot_version || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Pull / Report">
                        {runtime.agent.pull_interval}s / {runtime.agent.report_interval}s
                      </Descriptions.Item>
                    </Descriptions>
                    <JsonBlock title="kernel" value={runtime.kernel} />
                  </>
                ),
              },
              {
                key: 'nodes',
                label: 'Nodes',
                children: runtime.nodes.length ? (
                  <Table
                    rowKey="node_id"
                    pagination={false}
                    dataSource={runtime.nodes}
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
                      { title: 'Node ID', dataIndex: 'node_id' },
                      {
                        title: 'Client',
                        render: (_, record) => record.client?.name || '-',
                      },
                      {
                        title: 'Node Tag',
                        render: (_, record) => record.client?.node_tag || '-',
                      },
                      { title: 'Tag', dataIndex: 'tag' },
                      { title: 'Type', dataIndex: 'type' },
                      {
                        title: 'Fresh',
                        render: (_, record) =>
                          renderFreshTag(record.fresh, record.source, record.stale_seconds),
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
                    ]}
                  />
                ) : (
                  <Empty description="No runtime nodes" />
                ),
              },
              {
                key: 'bindings',
                label: 'Bindings',
                children: (
                  <>
                    <Space style={{ marginBottom: 16 }}>
                      <Button
                        type="primary"
                        onClick={() => {
                          bindingForm.resetFields();
                          setBindingModalOpen(true);
                        }}
                      >
                        Add Binding
                      </Button>
                    </Space>
                    <Table
                      rowKey={(record) => `${record.agent_id}-${record.node_id}`}
                      pagination={false}
                      dataSource={bindings}
                      columns={[
                        { title: 'Node ID', dataIndex: 'node_id' },
                        { title: 'Status', dataIndex: 'status' },
                        {
                          title: 'Actions',
                          render: (_, record) => (
                            <Space>
                              <a
                                onClick={async () => {
                                  const nextStatus = record.status === 'active' ? 'deleted' : 'active';
                                  const response = await updateAgentBinding(record.agent_id, record.node_id, {
                                    status: nextStatus,
                                  });
                                  if (response.code !== 0) {
                                    message.error(response.message || 'Binding update failed.');
                                    return;
                                  }
                                  await loadDetail(record.agent_id);
                                }}
                              >
                                Toggle Status
                              </a>
                              <a
                                onClick={async () => {
                                  const response = await deleteAgentBinding(record.agent_id, record.node_id);
                                  if (response.code !== 0) {
                                    message.error(response.message || 'Binding delete failed.');
                                    return;
                                  }
                                  await loadDetail(record.agent_id);
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
              {
                key: 'metrics',
                label: 'Metrics',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Select
                        style={{ width: 180 }}
                        allowClear
                        placeholder="Node"
                        options={runtimeNodeOptions}
                        value={metricsNodeId}
                        onChange={setMetricsNodeId}
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
                      <Button onClick={() => void loadMetrics(runtime.agent.agent_id)}>Refresh</Button>
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
                        style={{ width: 180 }}
                        allowClear
                        placeholder="Node"
                        options={runtimeNodeOptions}
                        value={trafficNodeId}
                        onChange={setTrafficNodeId}
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
                      <Button onClick={() => void loadTraffic(runtime.agent.agent_id)}>Refresh</Button>
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
                key: 'events',
                label: 'Events',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
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
                      <Button onClick={() => void loadEvents(runtime.agent.agent_id)}>Refresh</Button>
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
                      ]}
                    />
                  </Space>
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>

      <Modal
        title="Add Binding"
        open={bindingModalOpen}
        destroyOnHidden
        onCancel={() => setBindingModalOpen(false)}
        onOk={async () => {
          if (!runtime) return;
          const values = await bindingForm.validateFields();
          const response = await createAgentBinding(runtime.agent.agent_id, values);
          if (response.code !== 0) {
            message.error(response.message || 'Binding create failed.');
            return;
          }
          message.success('Binding created.');
          setBindingModalOpen(false);
          await loadDetail(runtime.agent.agent_id);
        }}
      >
        <Form form={bindingForm} layout="vertical">
          <Form.Item name="node_id" label="Node" rules={[{ required: true, message: 'Please select node.' }]}>
            <Select options={nodeOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select options={[{ label: 'active', value: 'active' }, { label: 'deleted', value: 'deleted' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Agent Secret"
        open={Boolean(secretResult)}
        destroyOnHidden
        cancelButtonProps={{ style: { display: 'none' } }}
        onCancel={() => setSecretResult(null)}
        onOk={() => setSecretResult(null)}
      >
        <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
          Agent secret is shown only once. Keep it outside the UI.
        </Text>
        <Paragraph copyable code style={{ marginBottom: 8 }}>
          {secretResult?.agent_id}
        </Paragraph>
        <Paragraph copyable code style={{ marginBottom: 0 }}>
          {secretResult?.agent_secret}
        </Paragraph>
      </Modal>
    </PageContainer>
  );
};

const AgentsPage: React.FC = () => (
  <DevAuthGate>
    <AgentsContent />
  </DevAuthGate>
);

export default AgentsPage;
