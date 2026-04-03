import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Modal, Space, Switch, Tabs, Tag, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  batchDeployServerNodes,
  copyServerNode,
  deployServerNode,
  dropServerGroup,
  dropServerNode,
  dropServerRoute,
  fetchServerGroups,
  fetchServerRoutes,
  getServerNodes,
  sortServerNodes,
  testServerPort,
  updateServerNode,
} from '@/services/server/api';
import DeployResultModal, { type DeployTarget } from './components/DeployResultModal';
import GroupFormModal from './components/GroupFormModal';
import NodeFormModal from './components/NodeFormModal';
import OnlineUsersModal from './components/OnlineUsersModal';
import RouteFormModal from './components/RouteFormModal';
import { protocolOptions } from './components/constants';

const formatTimestamp = (timestamp?: number | null) => {
  if (!timestamp) {
    return '-';
  }
  return new Date(timestamp * 1000).toLocaleString();
};

const ServerManagePage: React.FC = () => {
  const nodeActionRef = useRef<ActionType | null>(null);
  const groupActionRef = useRef<ActionType | null>(null);
  const routeActionRef = useRef<ActionType | null>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [nodeRows, setNodeRows] = useState<API.ServerNode[]>([]);
  const [groupRows, setGroupRows] = useState<API.ServerGroup[]>([]);
  const [routeRows, setRouteRows] = useState<API.ServerRoute[]>([]);

  const [activeTab, setActiveTab] = useState('nodes');

  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<API.ServerNode | undefined>();

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<API.ServerGroup | undefined>();

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<API.ServerRoute | undefined>();

  const [selectedNodeKeys, setSelectedNodeKeys] = useState<number[]>([]);
  const [deployTarget, setDeployTarget] = useState<DeployTarget | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [portTestLoading, setPortTestLoading] = useState<number | null>(null);
  const [onlineUsersServerId, setOnlineUsersServerId] = useState<number | null>(null);
  const [onlineUsersServerName, setOnlineUsersServerName] = useState<string | undefined>();
  const [onlineUsersModalOpen, setOnlineUsersModalOpen] = useState(false);

  const groupOptions = useMemo(
    () => groupRows.map((item) => ({ label: item.name, value: item.id })),
    [groupRows],
  );

  const routeOptions = useMemo(
    () =>
      routeRows.map((item) => ({
        label: item.remarks,
        value: item.id,
      })),
    [routeRows],
  );

  const nodeColumns: ProColumns<API.ServerNode>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '协议',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: protocolOptions.reduce(
        (acc, item) => {
          acc[item.value] = { text: item.label };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
    },
    {
      title: '地址',
      dataIndex: 'host',
      width: 140,
      copyable: true,
      search: false,
    },
    {
      title: '连接端口',
      dataIndex: 'port',
      width: 110,
      search: false,
    },
    {
      title: '服务端口',
      dataIndex: 'server_port',
      width: 110,
      search: false,
    },
    {
      title: '倍率',
      dataIndex: 'rate',
      width: 90,
      search: false,
    },
    {
      title: '在线用户',
      dataIndex: 'online',
      width: 100,
      search: false,
    },
    {
      title: '可用状态',
      dataIndex: 'available_status',
      width: 120,
      search: false,
      valueEnum: {
        0: { text: '未运行', status: 'Default' },
        1: { text: '未使用/异常', status: 'Warning' },
        2: { text: '正常运行', status: 'Success' },
      },
    },
    // {
    //   title: '排序值',
    //   dataIndex: 'sort',
    //   width: 100,
    //   search: false,
    // },
    {
      title: '权限组',
      dataIndex: 'groups',
      search: false,
      render: (_, record) =>
        (record.groups || []).length ? (
          <Space wrap>
            {(record.groups || []).map((group) => (
              <Tag key={group.id}>{group.name}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '最后检查',
      dataIndex: 'last_check_at',
      search: false,
      render: (_, record) => formatTimestamp(record.last_check_at),
    },
    {
      title: '显示',
      dataIndex: 'show',
      width: 90,
      search: false,
      render: (_, record) => (
        <Switch
          checked={Boolean(record.show)}
          onChange={async (checked) => {
            if (!record.id) {
              return;
            }
            try {
              await updateServerNode({ id: record.id, show: checked ? 1 : 0 });
              messageApi.success('显示状态已更新');
              nodeActionRef.current?.reload();
            } catch (error: any) {
              messageApi.error(error?.message || '显示状态更新失败');
            }
          }}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditingNode(record);
            setNodeModalOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="copy"
          onClick={async () => {
            if (!record.id) {
              return;
            }
            await copyServerNode({ id: record.id });
            messageApi.success('节点已复制');
            nodeActionRef.current?.reload();
          }}
        >
          复制
        </a>,
        <a
          key="deploy"
          onClick={async () => {
            if (!record.id) return;
            try {
              const res = await deployServerNode({ server_id: record.id });
              if (res.code !== 0) {
                messageApi.error(res.msg || '部署请求失败');
                return;
              }
              setDeployTarget({ mode: 'single', task_id: res.data.task_id, server_name: record.name });
              setDeployModalOpen(true);
            } catch {
              messageApi.error('部署请求失败');
            }
          }}
        >
          部署
        </a>,
        <a
          key="testPort"
          onClick={async () => {
            if (!record.id) return;
            setPortTestLoading(record.id);
            try {
              const res = await testServerPort({ id: record.id });
              const d = res.data;
              if (d?.reachable) {
                Modal.success({
                  title: `端口连通 — ${record.name}`,
                  content: (
                    <div>
                      <div>地址：{d.host}:{d.port}</div>
                      <div>延迟：{d.latency_ms} ms</div>
                      <div>{d.message}</div>
                    </div>
                  ),
                });
              } else {
                Modal.error({
                  title: `端口不通 — ${record.name}`,
                  content: (
                    <div>
                      <div>地址：{d?.host}:{d?.port}</div>
                      <div>延迟：{d?.latency_ms} ms</div>
                      <div>{d?.message}</div>
                      {d?.errno != null && <div>错误码：{d.errno}</div>}
                    </div>
                  ),
                });
              }
            } catch {
              messageApi.error('端口测试请求失败');
            } finally {
              setPortTestLoading(null);
            }
          }}
        >
          {portTestLoading === record.id ? '测试中...' : '测试端口'}
        </a>,
        <a
          key="onlineUsers"
          onClick={() => {
            if (!record.id) return;
            setOnlineUsersServerId(record.id);
            setOnlineUsersServerName(record.name);
            setOnlineUsersModalOpen(true);
          }}
        >
          在线用户
        </a>,
        <a
          key="delete"
          onClick={() => {
            if (!record.id) {
              return;
            }
            Modal.confirm({
              title: '确认删除该节点？',
              onOk: async () => {
                await dropServerNode({ id: record.id as number });
                messageApi.success('节点已删除');
                nodeActionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  const groupColumns: ProColumns<API.ServerGroup>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '组名',
      dataIndex: 'name',
    },
    {
      title: '用户数',
      dataIndex: 'users_count',
      search: false,
    },
    {
      title: '节点数',
      dataIndex: 'server_count',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditingGroup(record);
            setGroupModalOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: '确认删除该权限组？',
              onOk: async () => {
                await dropServerGroup({ id: record.id });
                messageApi.success('权限组已删除');
                groupActionRef.current?.reload();
                nodeActionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  const routeColumns: ProColumns<API.ServerRoute>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
    },
    {
      title: '匹配规则',
      dataIndex: 'match',
      search: false,
      render: (_, record) =>
        record.match?.length ? (
          <Space wrap>
            {record.match.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 100,
      valueEnum: {
        block: { text: 'block' },
        dns: { text: 'dns' },
      },
    },
    {
      title: '动作值',
      dataIndex: 'action_value',
      search: false,
      renderText: (value) => value || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditingRoute(record);
            setRouteModalOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: '确认删除该路由？',
              onOk: async () => {
                await dropServerRoute({ id: record.id });
                messageApi.success('路由已删除');
                routeActionRef.current?.reload();
                nodeActionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'nodes',
            label: '节点管理',
            children: (
              <ProTable<API.ServerNode>
                rowKey="id"
                actionRef={nodeActionRef}
                columns={nodeColumns}
                rowSelection={{
                  selectedRowKeys: selectedNodeKeys,
                  onChange: (keys) => setSelectedNodeKeys(keys as number[]),
                  preserveSelectedRowKeys: true,
                }}
                request={async () => {
                  const [nodesRes, groupsRes, routesRes] = await Promise.all([
                    getServerNodes(),
                    fetchServerGroups(),
                    fetchServerRoutes(),
                  ]);
                  const nodes = Array.isArray(nodesRes?.data) ? nodesRes.data : [];
                  const groups = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
                  const routes = Array.isArray(routesRes?.data) ? routesRes.data : [];
                  setNodeRows(nodes);
                  setGroupRows(groups);
                  setRouteRows(routes);
                  return {
                    data: nodes,
                    success: true,
                  };
                }}
                pagination={false}
                search={false}
                toolBarRender={() => [
                  <Button
                    key="create"
                    type="primary"
                    onClick={() => {
                      setEditingNode(undefined);
                      setNodeModalOpen(true);
                    }}
                  >
                    新建节点
                  </Button>,
                  <Button
                    key="batch-deploy"
                    disabled={selectedNodeKeys.length === 0}
                    onClick={async () => {
                      if (selectedNodeKeys.length === 0) return;
                      if (selectedNodeKeys.length > 50) {
                        messageApi.warning('批量部署最多支持 50 个节点');
                        return;
                      }
                      try {
                        const res = await batchDeployServerNodes({ server_ids: selectedNodeKeys });
                        if (res.code !== 0) {
                          messageApi.error(res.msg || '批量部署请求失败');
                          return;
                        }
                        setSelectedNodeKeys([]);
                        setDeployTarget({ mode: 'batch', batch_id: res.data.batch_id });
                        setDeployModalOpen(true);
                      } catch {
                        messageApi.error('批量部署请求失败');
                      }
                    }}
                  >
                    {selectedNodeKeys.length > 0
                      ? `批量部署 (${selectedNodeKeys.length})`
                      : '批量部署'}
                  </Button>,
                  <Button
                    key="sort"
                    onClick={async () => {
                      const sortableRows = nodeRows.filter((item) => item.id);
                      if (!sortableRows.length) {
                        return;
                      }
                      const payload = sortableRows
                        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                        .map((item, index) => ({
                          id: item.id,
                          order: Number(item.sort || index + 1),
                        })) as API.ServerNodeSortItem[];
                      await sortServerNodes(payload);
                      messageApi.success('排序已提交');
                      nodeActionRef.current?.reload();
                    }}
                  >
                    提交排序
                  </Button>,
                ]}
              />
            ),
          },
          {
            key: 'groups',
            label: '权限组管理',
            children: (
              <ProTable<API.ServerGroup>
                rowKey="id"
                actionRef={groupActionRef}
                columns={groupColumns}
                request={async () => {
                  const res = await fetchServerGroups();
                  const rows = Array.isArray(res?.data) ? res.data : [];
                  setGroupRows(rows);
                  return {
                    data: rows,
                    success: true,
                  };
                }}
                pagination={false}
                search={false}
                toolBarRender={() => [
                  <Button
                    key="create"
                    type="primary"
                    onClick={() => {
                      setEditingGroup(undefined);
                      setGroupModalOpen(true);
                    }}
                  >
                    新建权限组
                  </Button>,
                ]}
              />
            ),
          },
          {
            key: 'routes',
            label: '路由管理',
            children: (
              <ProTable<API.ServerRoute>
                rowKey="id"
                actionRef={routeActionRef}
                columns={routeColumns}
                request={async () => {
                  const res = await fetchServerRoutes();
                  const rows = Array.isArray(res?.data) ? res.data : [];
                  setRouteRows(rows);
                  return {
                    data: rows,
                    success: true,
                  };
                }}
                pagination={false}
                search={false}
                toolBarRender={() => [
                  <Button
                    key="create"
                    type="primary"
                    onClick={() => {
                      setEditingRoute(undefined);
                      setRouteModalOpen(true);
                    }}
                  >
                    新建路由
                  </Button>,
                ]}
              />
            ),
          },
        ]}
      />

      <NodeFormModal
        open={nodeModalOpen}
        node={editingNode}
        groupOptions={groupOptions}
        routeOptions={routeOptions}
        onOpenChange={(open) => {
          setNodeModalOpen(open);
          if (!open) {
            setEditingNode(undefined);
          }
        }}
        onSuccess={() => {
          nodeActionRef.current?.reload();
        }}
      />
      <DeployResultModal
        open={deployModalOpen}
        target={deployTarget}
        onClose={() => {
          setDeployModalOpen(false);
          setDeployTarget(null);
        }}
      />
      <GroupFormModal
        open={groupModalOpen}
        group={editingGroup}
        onOpenChange={(open) => {
          setGroupModalOpen(open);
          if (!open) {
            setEditingGroup(undefined);
          }
        }}
        onSuccess={() => {
          groupActionRef.current?.reload();
          nodeActionRef.current?.reload();
        }}
      />
      <RouteFormModal
        open={routeModalOpen}
        route={editingRoute}
        onOpenChange={(open) => {
          setRouteModalOpen(open);
          if (!open) {
            setEditingRoute(undefined);
          }
        }}
        onSuccess={() => {
          routeActionRef.current?.reload();
          nodeActionRef.current?.reload();
        }}
      />
      <OnlineUsersModal
        open={onlineUsersModalOpen}
        serverId={onlineUsersServerId}
        serverName={onlineUsersServerName}
        onClose={() => {
          setOnlineUsersModalOpen(false);
          setOnlineUsersServerId(null);
          setOnlineUsersServerName(undefined);
        }}
      />
    </PageContainer>
  );
};

export default ServerManagePage;
