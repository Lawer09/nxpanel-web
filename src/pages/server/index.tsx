import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Badge, Button, Modal, Space, Switch, Tabs, Tag, Tooltip, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  batchDeployServerNodes,
  copyServerNode,
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
import NodeStatusModal, { NodeStatusSummary } from './components/NodeStatusModal';
import OnlineUsersModal from './components/OnlineUsersModal';
import RouteFormModal from './components/RouteFormModal';
import SwitchDomainModal from './components/SwitchDomainModal';
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
  const [switchDomainOpen, setSwitchDomainOpen] = useState(false);
  const [switchDomainServers, setSwitchDomainServers] = useState<API.ServerNode[]>([]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusNode, setStatusNode] = useState<API.ServerNode | undefined>();

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
      width: 60,
      search: false,
    },
    {
      title: '节点名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => {
        const protocolColor: Record<string, string> = {
          vless: 'blue',
          vmess: 'purple',
          trojan: 'red',
          shadowsocks: 'cyan',
          hysteria: 'orange',
          tuic: 'green',
          anytls: 'magenta',
          socks: 'default',
          naive: 'volcano',
          http: 'geekblue',
          mieru: 'lime',
        };
        return (
          <Space>
            <Tag color={protocolColor[record.type] || 'default'} style={{ fontSize: 11 }}>
              {record.type}
            </Tag>
            <span>{record.name}</span>
          </Space>
        );
      },
    },
    {
      title: '协议',
      dataIndex: 'type',
      width: 100,
      hideInTable: true,
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
      title: '倍率',
      dataIndex: 'rate',
      width: 70,
      search: false,
    },
    {
      title: '在线用户',
      dataIndex: 'online',
      width: 100,
      search: false,
      render: (_, record) => {
        const limit = record.online_limit ? String(record.online_limit) : '不限';
        return (
          <a
            onClick={() => {
              if (!record.id) return;
              setOnlineUsersServerId(record.id);
              setOnlineUsersServerName(record.name);
              setOnlineUsersModalOpen(true);
            }}
          >
            {record.online || 0} / {limit}
          </a>
        );
      },
    },
    // {
    //   title: '绑定机器',
    //   dataIndex: 'machine_id',
    //   width: 80,
    //   search: false,
    //   render: (_, record) => (record.machine_id ? '是' : '否'),
    // },
    {
      title: '状态',
      dataIndex: 'available_status',
      width: 50,
      search: false,
      render: (_, record) => {
        const statusConfig: Record<number, { text: string; status: 'default' | 'warning' | 'success' }> = {
          0: { text: '未运行', status: 'default' },
          1: { text: '未使用/异常', status: 'warning' },
          2: { text: '正常运行', status: 'success' },
        };
        const config = statusConfig[record.available_status ?? 0] || statusConfig[0];
        return (
          <Tooltip title={config.text}>
            <Badge status={config.status} />
          </Tooltip>
        );
      },
    },
    // {
    //   title: '排序值',
    //   dataIndex: 'sort',
    //   width: 100,
    //   search: false,
    // },
    {
      title: '负载',
      key: 'load_info',
      width: 180,
      search: false,
      render: (_, record) => (
        <a
          onClick={() => {
            setStatusNode(record);
            setStatusModalOpen(true);
          }}
        >
          <NodeStatusSummary node={record} />
        </a>
      ),
    },
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
      width: 160,
      search: false,
      render: (_, record) => formatTimestamp(record.last_check_at),
    },
    {
      title: '显示',
      dataIndex: 'show',
      width: 80,
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
      {/* {contextHolder} */}
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
                request={async (params) => {
                  const { current = 1, pageSize = 20 } = params;
                  const [nodesRes, groupsRes, routesRes] = await Promise.all([
                    getServerNodes({ page: current, pageSize }),
                    fetchServerGroups(),
                    fetchServerRoutes(),
                  ]);
                  const nodesPage = nodesRes?.data;
                  const nodes = nodesPage?.data ?? [];
                  const groups = Array.isArray(groupsRes?.data) ? groupsRes.data : [];
                  const routes = Array.isArray(routesRes?.data) ? routesRes.data : [];
                  setNodeRows(nodes);
                  setGroupRows(groups);
                  setRouteRows(routes);
                  return {
                    data: nodes,
                    total: nodesPage?.total ?? 0,
                    success: true,
                  };
                }}
                pagination={{
                  defaultPageSize: 20,
                  showSizeChanger: true,
                  showTotal: (t) => `共 ${t} 条`,
                }}
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
                    key="switch-domain"
                    disabled={selectedNodeKeys.length === 0}
                    onClick={() => {
                      if (selectedNodeKeys.length === 0) return;
                      const servers = nodeRows.filter((item) => selectedNodeKeys.includes(item.id));
                      if (!servers.length) {
                        messageApi.warning('请选择有效节点');
                        return;
                      }
                      setSwitchDomainServers(servers);
                      setSwitchDomainOpen(true);
                    }}
                  >
                    切换域名
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
                    批量部署
                  </Button>,
                  <Button
                    key="test-port"
                    disabled={selectedNodeKeys.length === 0}
                    loading={portTestLoading != null}
                    onClick={async () => {
                      if (selectedNodeKeys.length === 0) return;
                      if (selectedNodeKeys.length > 20) {
                        messageApi.warning('端口测试最多支持 20 个节点');
                        return;
                      }
                      setPortTestLoading(0);
                      try {
                        const nodesMap = new Map(nodeRows.map((n) => [n.id, n]));
                        const results = await Promise.all(
                          selectedNodeKeys.map(async (id) => {
                            const res = await testServerPort({ id });
                            return { id, res };
                          }),
                        );
                        const success = results.filter((r) => r.res?.data?.reachable);
                        const failed = results.filter((r) => !r.res?.data?.reachable);
                        Modal.info({
                          title: '端口测试结果',
                          width: 600,
                          content: (
                            <div>
                              <div>成功：{success.length}</div>
                              <div>失败：{failed.length}</div>
                              {failed.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  {failed.slice(0, 10).map((item) => {
                                    const node = nodesMap.get(item.id);
                                    const d = item.res?.data;
                                    return (
                                      <div key={item.id}>
                                        {node?.name || item.id} - {d?.message || '端口不通'}
                                      </div>
                                    );
                                  })}
                                  {failed.length > 10 && (
                                    <div>...</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ),
                        });
                      } catch {
                        messageApi.error('端口测试请求失败');
                      } finally {
                        setPortTestLoading(null);
                      }
                    }}
                  >
                    端口测试
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
      <SwitchDomainModal
        open={switchDomainOpen}
        servers={switchDomainServers}
        onOpenChange={(open) => {
          setSwitchDomainOpen(open);
          if (!open) {
            setSwitchDomainServers([]);
          }
        }}
        onSuccess={() => {
          nodeActionRef.current?.reload();
        }}
      />
      <NodeStatusModal
        open={statusModalOpen}
        node={statusNode}
        onClose={() => {
          setStatusModalOpen(false);
          setStatusNode(undefined);
        }}
      />
    </PageContainer>
  );
};

export default ServerManagePage;
