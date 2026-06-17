import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  createNodeUser,
  deleteNode,
  deleteNodeUser,
  getNodeDetail,
  getNodeRuntime,
  getNodeSnapshot,
  getNodeUserClientConfig,
  listNodeSummaries,
  listNodeUsers,
  updateNodeUser,
} from '@/services/node-control/api';
import { NodeControlConfigError } from '@/services/node-control/request';
import DevAuthGate from './components/DevAuthGate';
import JsonBlock from './components/JsonBlock';
import NodeFormModal from './components/NodeFormModal';
import NodeUserModal from './components/NodeUserModal';
import NodeUserClientConfigModal from './components/NodeUserClientConfigModal';
import NodeUsersManageModal from './components/NodeUsersManageModal';
import { normalizeNodeSnapshotConfig } from './components/SnapshotConfigEditor';
import { formatUnitNumber, speedLimitUnits } from './components/UnitNumberInput';

const formatJsonText = (value?: string | null) => value || '-';

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
  const [detailTab, setDetailTab] = useState('basic');

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
      if (detailResponse.code === 0) {
        setDetailNode(detailResponse.data);
      }
      if (runtimeResponse.code === 0) {
        setRuntime(runtimeResponse.data);
      }
      if (snapshotResponse.code === 0) {
        setSnapshot(snapshotResponse.data);
      }
      if (userResponse.code === 0) {
        setUsers(userResponse.data);
      }
      setDetailOpen(true);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load node detail.');
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

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

  const columns: ProColumns<API.ControlNodeSummary>[] = [
    { title: 'ID', dataIndex: 'id', width: 90 },
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
      title: 'Latest Agent',
      dataIndex: 'latest_runtime_agent',
      renderText: (_, record) => record.latest_runtime_agent || '-',
    },
    {
      title: 'Reported At',
      dataIndex: 'latest_reported_at',
      renderText: (_, record) => formatJsonText(record.latest_reported_at),
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
          if (!open) {
            setModalNode(null);
          }
        }}
        onSuccess={() => {
          void loadRows();
        }}
      />

      <Drawer
        title={detailNode ? `Node ${detailNode.id}` : 'Node Detail'}
        open={detailOpen}
        width={960}
        onClose={() => {
          setDetailOpen(false);
          setDetailNode(null);
          setRuntime(null);
          setSnapshot(null);
          setUsers([]);
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
                    <Descriptions.Item label="Type">{detailNode.type}</Descriptions.Item>
                    <Descriptions.Item label="Enabled">
                      {detailNode.enabled ? 'true' : 'false'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated At">
                      {formatJsonText(detailNode.updated_at)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'config',
                label: 'Config',
                children: (
                  <JsonBlock title="Node Snapshot Config" value={normalizeNodeSnapshotConfig(detailNode)} />
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
                ) : null,
              },
              {
                key: 'runtime',
                label: 'Runtime',
                children: runtime ? (
                  <>
                    <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Tag">{runtime.node.tag}</Descriptions.Item>
                      <Descriptions.Item label="Enabled">
                        {runtime.node.enabled ? 'true' : 'false'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Updated At">
                        {formatJsonText(runtime.node.updated_at)}
                      </Descriptions.Item>
                    </Descriptions>
                    <Table
                      rowKey="agent_id"
                      pagination={false}
                      dataSource={runtime.agents}
                      columns={[
                        { title: 'Agent ID', dataIndex: 'agent_id' },
                        { title: 'Machine ID', dataIndex: 'machine_id' },
                        { title: 'Status', dataIndex: 'agent_status' },
                        { title: 'Online Users', dataIndex: 'online_users' },
                        { title: 'Online IPs', dataIndex: 'online_ips' },
                        { title: 'Reported At', dataIndex: 'runtime_reported_at' },
                      ]}
                    />
                  </>
                ) : null,
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
                              <a onClick={() => void handleOpenClientConfig(detailNode.id, record.user_id)}>
                                Get Config
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
          if (!open) {
            setEditingUser(null);
          }
        }}
        onSubmit={async (values) => {
          if (!detailNode) {
            return;
          }
          try {
            const response = editingUser
              ? await updateNodeUser(detailNode.id, editingUser.user_id, values as API.ControlNodeUserUpdateParams)
              : await createNodeUser(detailNode.id, values as API.ControlNodeUserCreateParams);
            if (response.code !== 0) {
              message.error(response.message || 'Save failed.');
              return;
            }
            message.success(editingUser ? 'User updated.' : 'User created.');
            setUserModalOpen(false);
            setEditingUser(null);
            await loadDetail(detailNode.id);
          } catch (error: any) {
            const text =
              error instanceof NodeControlConfigError
                ? error.message
                : error?.message || 'Save failed.';
            message.error(text);
          }
        }}
      />

      <NodeUsersManageModal
        open={usersManageOpen}
        nodeId={usersManageNode?.id}
        nodeTag={usersManageNode?.tag}
        onOpenChange={(open) => {
          setUsersManageOpen(open);
          if (!open) {
            setUsersManageNode(null);
          }
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
          if (!open) {
            setClientConfig(null);
          }
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
