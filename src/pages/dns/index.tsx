import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  availableDomainsDetail,
  disableDomain,
  enableDomain,
  syncDomains,
  unavailableDomains,
  unbindRecord,
} from '@/services/swagger/dns';
import IpRecordsDrawer from './components/IpRecordsDrawer';
import ResolveModal from './components/ResolveModal';

const { Text, Title } = Typography;

const DnsPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();

  // ── 数据状态 ────────────────────────────────────
  const [availableDetail, setAvailableDetail] = useState<API.DnsDomainDetail[]>(
    [],
  );
  const [unavailable, setUnavailable] = useState<API.DnsDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ── 弹窗/抽屉状态 ────────────────────────────────
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveIp, setResolveIp] = useState('');
  const [ipDrawerOpen, setIpDrawerOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [detailRes, unavailRes] = await Promise.all([
      availableDomainsDetail(),
      unavailableDomains(),
    ]);
    setLoading(false);
    if (detailRes.code === 0) setAvailableDetail(detailRes.data ?? []);
    if (unavailRes.code === 0) setUnavailable(unavailRes.data ?? []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── 同步域名 ─────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    const res = await syncDomains();
    setSyncing(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '同步失败');
      return;
    }
    const d = res.data!;
    messageApi.success(
      `同步成功：远程 ${d.total_remote} 条，新增 ${d.inserted}，更新 ${d.updated}`,
    );
    loadAll();
  };

  // ── 启用 / 禁用域名 ──────────────────────────────
  const handleToggleDomain = (domain: string, currentEnabled: boolean) => {
    const action = currentEnabled ? '禁用' : '启用';
    modalApi.confirm({
      title: `确认${action}域名 ${domain}？`,
      onOk: async () => {
        const fn = currentEnabled ? disableDomain : enableDomain;
        const res = await fn({ domain });
        if (res.code !== 0) {
          messageApi.error(res.msg || `${action}失败`);
          return;
        }
        messageApi.success(`域名已${action}`);
        loadAll();
      },
    });
  };

  // ── 解绑记录 ─────────────────────────────────────
  const handleUnbindRecord = (ipv4: string, fqdn: string) => {
    modalApi.confirm({
      title: `确认解绑 ${fqdn}？`,
      okType: 'danger',
      onOk: async () => {
        const res = await unbindRecord({ ipv4, fqdn });
        if (res.code !== 0) {
          messageApi.error(res.msg || '解绑失败');
          return;
        }
        messageApi.success('解绑成功');
        loadAll();
      },
    });
  };

  // ── 可用域名 + 记录表格 ──────────────────────────
  const recordColumns = (domain: string) => [
    {
      title: 'FQDN',
      dataIndex: 'fqdn',
      render: (v: string) => (
        <Text copyable style={{ fontSize: 13 }}>
          {v}
        </Text>
      ),
    },
    {
      title: '子域名',
      dataIndex: 'subdomain',
      width: 100,
    },
    {
      title: 'IPv4',
      dataIndex: 'ipv4',
      width: 130,
      render: (v: string) => (
        <Text copyable code>
          {v}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 70,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      width: 110,
      render: (_: any, record: API.DnsDomainRecord) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setResolveIp(record.ipv4);
              setResolveOpen(true);
            }}
          >
            解析
          </Button>
          <Divider type="vertical" />
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleUnbindRecord(record.ipv4, record.fqdn)}
          >
            解绑
          </Button>
        </Space>
      ),
    },
  ];

  const availableItems = availableDetail.map((d) => ({
    key: String(d.id),
    label: (
      <Space>
        <Badge status="success" />
        <Text strong>{d.domain}</Text>
        <Tag style={{ fontSize: 11 }}>{d.provider}</Tag>
        <Tag color="blue" style={{ fontSize: 11 }}>
          {d.records?.length ?? 0} 条解析
        </Tag>
        {d.last_synced_at && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            同步于 {d.last_synced_at}
          </Text>
        )}
      </Space>
    ),
    extra: (
      <Space onClick={(e) => e.stopPropagation()}>
        <Tooltip title="新增解析">
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => {
              setResolveIp('');
              setResolveOpen(true);
            }}
          >
            + 解析
          </Button>
        </Tooltip>
        <Tooltip title="禁用该域名">
          <Button
            size="small"
            danger
            onClick={() => handleToggleDomain(d.domain, true)}
          >
            禁用
          </Button>
        </Tooltip>
      </Space>
    ),
    children: (
      <Table<API.DnsDomainRecord>
        size="small"
        rowKey="id"
        dataSource={d.records ?? []}
        columns={recordColumns(d.domain)}
        pagination={false}
        locale={{ emptyText: '暂无解析记录' }}
      />
    ),
  }));

  // ── 不可用域名列 ─────────────────────────────────
  const unavailableColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '域名',
      dataIndex: 'domain',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: '供应商', dataIndex: 'provider', width: 100 },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      render: () => (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          不可用
        </Tag>
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'last_synced_at',
      width: 160,
      render: (v: string) => v ?? '—',
    },
    {
      title: '操作',
      width: 90,
      render: (_: any, record: API.DnsDomain) => (
        <Button
          size="small"
          type="primary"
          ghost
          icon={<CheckCircleOutlined />}
          onClick={() => handleToggleDomain(record.domain, false)}
        >
          启用
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'available',
      label: (
        <span>
          <CheckCircleOutlined style={{ color: '#52c41a' }} /> 可用域名{' '}
          <Tag color="green">{availableDetail.length}</Tag>
        </span>
      ),
      children: loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : availableDetail.length === 0 ? (
        <Card>
          <Text type="secondary">暂无可用域名，请先同步。</Text>
        </Card>
      ) : (
        <Collapse
          items={availableItems}
          defaultActiveKey={availableDetail
            .slice(0, 1)
            .map((d) => String(d.id))}
        />
      ),
    },
    {
      key: 'unavailable',
      label: (
        <span>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 不可用域名{' '}
          {unavailable.length > 0 && (
            <Tag color="red">{unavailable.length}</Tag>
          )}
        </span>
      ),
      children: loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : (
        <Table<API.DnsDomain>
          size="small"
          rowKey="id"
          dataSource={unavailable}
          columns={unavailableColumns}
          pagination={false}
          locale={{ emptyText: '暂无不可用域名' }}
        />
      ),
    },
  ];

  return (
    <PageContainer
      extra={
        <Space>
          <Button
            icon={<SearchOutlined />}
            onClick={() => setIpDrawerOpen(true)}
          >
            查询 IP 绑定
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={syncing}
            onClick={handleSync}
          >
            同步域名
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setResolveIp('');
              setResolveOpen(true);
            }}
          >
            + IP 解析
          </Button>
        </Space>
      }
    >
      <Tabs items={tabItems} />

      <ResolveModal
        open={resolveOpen}
        initialIp={resolveIp}
        onOpenChange={(v) => {
          setResolveOpen(v);
          if (!v) setResolveIp('');
        }}
        onSuccess={() => {
          loadAll();
        }}
      />

      <IpRecordsDrawer
        open={ipDrawerOpen}
        onClose={() => setIpDrawerOpen(false)}
        onResolveClick={(ip) => {
          setResolveIp(ip);
          setIpDrawerOpen(false);
          setResolveOpen(true);
        }}
      />
    </PageContainer>
  );
};

export default DnsPage;
