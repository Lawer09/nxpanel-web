import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Card, Col, Row, Switch, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  getNodesRuntimeOverview,
  listAgents,
  listNodeSummaries,
} from '@/services/node-control/api';
import DevAuthGate from './components/DevAuthGate';
import { extractHealthy, formatBytes } from './components/nodeRuntimeUtils';

const POLL_MS = 15_000;

const NodesOverviewContent: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<API.ControlRuntimeOverview | null>(null);
  const [nodes, setNodes] = useState<API.ControlNodeSummary[]>([]);
  const [agents, setAgents] = useState<API.ControlAgent[]>([]);

  const loadData = async () => {
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }
    setLoading(true);
    try {
      const [overviewResponse, nodesResponse, agentsResponse] = await Promise.all([
        getNodesRuntimeOverview(),
        listNodeSummaries(),
        listAgents(),
      ]);
      if (overviewResponse.code === 0) {
        setOverview(overviewResponse.data);
      }
      if (nodesResponse.code === 0) {
        setNodes(nodesResponse.data);
      }
      if (agentsResponse.code === 0) {
        setAgents(agentsResponse.data);
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to load nodes overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => {
      void loadData();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const nodeColumns: ProColumns<API.ControlNodeSummary>[] = [
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
    { title: 'Type', dataIndex: 'type', render: (_, record) => <Tag>{record.type}</Tag> },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 90,
      render: (_, record) => <Switch checked={record.enabled} disabled />,
    },
    { title: 'Bindings', dataIndex: 'binding_count', width: 90 },
    { title: 'Users', dataIndex: 'user_count', width: 90 },
    {
      title: 'Startup',
      key: 'startup',
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
  ];

  const agentColumns: ProColumns<API.ControlAgent>[] = [
    { title: 'Agent ID', dataIndex: 'agent_id' },
    { title: 'Machine ID', dataIndex: 'machine_id' },
    { title: 'Status', dataIndex: 'status', render: (_, record) => <Tag>{record.status}</Tag> },
    { title: 'Snapshot', dataIndex: 'snapshot_version', renderText: (_, record) => record.snapshot_version || '-' },
    { title: 'Last Seen', dataIndex: 'last_seen_at', renderText: (_, record) => record.last_seen_at || '-' },
  ];

  return (
    <PageContainer>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Online Agents" description={overview?.online_agents ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Unhealthy Agents" description={overview?.unhealthy_agents ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Unhealthy Nodes" description={overview?.unhealthy_nodes ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Online Users" description={overview?.current_online_users ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Online IPs" description={overview?.current_online_ips ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Upload 24h" description={formatBytes(overview?.traffic_upload_24h)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Card.Meta title="Download 24h" description={formatBytes(overview?.traffic_download_24h)} />
          </Card>
        </Col>
      </Row>

      <ProTable<API.ControlNodeSummary>
        rowKey="id"
        headerTitle="Nodes Summary"
        search={false}
        loading={loading}
        pagination={false}
        options={false}
        columns={nodeColumns}
        dataSource={nodes}
      />

      <div style={{ height: 16 }} />

      <ProTable<API.ControlAgent>
        rowKey="agent_id"
        headerTitle="Agents"
        search={false}
        loading={loading}
        pagination={false}
        options={false}
        columns={agentColumns}
        dataSource={agents}
      />
    </PageContainer>
  );
};

const NodesOverviewPage: React.FC = () => (
  <DevAuthGate>
    <NodesOverviewContent />
  </DevAuthGate>
);

export default NodesOverviewPage;
