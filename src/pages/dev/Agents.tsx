import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  createAgent,
  createAgentBinding,
  deleteAgent,
  deleteAgentBinding,
  getAgentRuntime,
  listAgentBindings,
  listAgents,
  listNodeSummaries,
  resetAgentSecret,
  updateAgent,
  updateAgentBinding,
} from '@/services/node-control/api';
import AgentFormModal from './components/AgentFormModal';
import DevAuthGate from './components/DevAuthGate';
import JsonBlock from './components/JsonBlock';

const { Paragraph, Text } = Typography;

const AgentsContent: React.FC = () => {
  const { message } = App.useApp();
  const [rows, setRows] = useState<API.ControlAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<API.ControlAgent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [runtime, setRuntime] = useState<API.ControlAgentRuntime | null>(null);
  const [bindings, setBindings] = useState<API.ControlBinding[]>([]);
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [nodeOptions, setNodeOptions] = useState<{ label: string; value: number }[]>([]);
  const [secretResult, setSecretResult] = useState<{ agent_id: string; agent_secret: string } | null>(null);
  const [bindingForm] = Form.useForm();

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
      if (runtimeResponse.code === 0) {
        setRuntime(runtimeResponse.data);
      }
      if (bindingsResponse.code === 0) {
        setBindings(bindingsResponse.data);
      }
      if (nodesResponse.code === 0) {
        setNodeOptions(
          nodesResponse.data.map((node) => ({
            label: `${node.id} - ${node.tag}`,
            value: node.id,
          })),
        );
      }
      setDetailOpen(true);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load agent detail.');
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

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
          if (!open) {
            setEditingRow(null);
          }
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
        width={980}
        onClose={() => {
          setDetailOpen(false);
          setRuntime(null);
          setBindings([]);
          bindingForm.resetFields();
        }}
      >
        {runtime ? (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Agent ID">{runtime.agent.agent_id}</Descriptions.Item>
              <Descriptions.Item label="Machine ID">{runtime.agent.machine_id}</Descriptions.Item>
              <Descriptions.Item label="Status">{runtime.agent.status}</Descriptions.Item>
              <Descriptions.Item label="Last Seen">
                {runtime.agent.last_seen_at || '-'}
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock title="kernel" value={runtime.kernel} />
            <Table
              rowKey="node_id"
              pagination={false}
              dataSource={runtime.nodes}
              columns={[
                { title: 'Node ID', dataIndex: 'node_id' },
                { title: 'Tag', dataIndex: 'tag' },
                { title: 'Type', dataIndex: 'type' },
                { title: 'Online Users', dataIndex: 'online_users' },
                { title: 'Online IPs', dataIndex: 'online_ips' },
                { title: 'Reported At', dataIndex: 'runtime_reported_at' },
              ]}
              style={{ marginBottom: 16 }}
            />
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
        ) : null}
      </Drawer>

      <Modal
        title="Add Binding"
        open={bindingModalOpen}
        destroyOnHidden
        onCancel={() => setBindingModalOpen(false)}
        onOk={async () => {
          if (!runtime) {
            return;
          }
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
