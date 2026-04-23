import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getAdAccounts,
  toggleAdAccountStatus,
  testAdAccountCredential,
  getSyncServers,
} from '@/services/ad/api';
import AdAccountFormModal from './components/AdAccountFormModal';

const { Text } = Typography;

const PLATFORM_COLORS: Record<string, string> = {
  admob: 'green',
  meta: 'blue',
  unity: 'purple',
  applovin: 'orange',
  ironsource: 'cyan',
};

const AdAccountsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [data, setData] = useState<API.AdAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [syncServers, setSyncServers] = useState<API.SyncServer[]>([]);

  // filters
  const [filterPlatform, setFilterPlatform] = useState<string>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterServer, setFilterServer] = useState<string>();
  const [filterKeyword, setFilterKeyword] = useState<string>();

  // modal
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.AdAccount | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [testLoading, setTestLoading] = useState<Record<number, boolean>>({});

  const loadData = async (p?: number, s?: number) => {
    setLoading(true);
    const res = await getAdAccounts({
      source_platform: filterPlatform,
      status: filterStatus,
      assigned_server_id: filterServer,
      keyword: filterKeyword,
      page: p ?? page,
      size: s ?? pageSize,
    });
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取列表失败');
      return;
    }
    const paged = res.data;
    setData(paged?.items ?? []);
    setTotal(paged?.total ?? 0);
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  useEffect(() => {
    getSyncServers().then((res) => {
      if (res.code === 0 && res.data) setSyncServers(res.data);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadData(1, pageSize);
  };

  const handleToggleStatus = async (record: API.AdAccount) => {
    const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
    setSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleAdAccountStatus(record.id, newStatus);
    setSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    setData((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: newStatus } : r)),
    );
  };

  const handleTestCredential = async (record: API.AdAccount) => {
    setTestLoading((s) => ({ ...s, [record.id]: true }));
    try {
      const res = await testAdAccountCredential(record.id);
      if (res.code === 0) {
        messageApi.success('凭据可用');
      } else {
        messageApi.warning(res.msg || '凭据不可用');
      }
    } catch {
      messageApi.error('凭据不可用');
    }
    setTestLoading((s) => ({ ...s, [record.id]: false }));
  };

  const columns: ColumnsType<API.AdAccount> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '平台',
      dataIndex: 'source_platform',
      width: 100,
      render: (v) => <Tag color={PLATFORM_COLORS[v] || 'default'}>{v}</Tag>,
    },
    { title: '账号名', dataIndex: 'account_name', ellipsis: true },
    { title: '显示名', dataIndex: 'account_label', width: 120, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v, r) => (
        <Switch
          size="small"
          checked={v === 'enabled'}
          loading={!!switchLoading[r.id]}
          onChange={() => handleToggleStatus(r)}
        />
      ),
    },
    {
      title: '主节点',
      dataIndex: 'assigned_server_id',
      width: 120,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '备节点',
      dataIndex: 'backup_server_id',
      width: 120,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '隔离组',
      dataIndex: 'isolation_group',
      width: 100,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    { title: '时区', dataIndex: 'reporting_timezone', width: 120 },
    { title: '币种', dataIndex: 'currency_code', width: 70 },
    { title: '更新时间', dataIndex: 'updated_at', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setCurrentRecord(record);
              setFormOpen(true);
            }}
          >
            编辑
          </a>
          <a
            onClick={() => handleTestCredential(record)}
            style={{ color: testLoading[record.id] ? '#999' : undefined }}
          >
            {testLoading[record.id] ? '测试中...' : '测试凭据'}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      extra={[
        <Button
          key="add"
          type="primary"
          onClick={() => {
            setCurrentRecord(undefined);
            setFormOpen(true);
          }}
        >
          新建账号
        </Button>,
      ]}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="平台"
          style={{ width: 130 }}
          value={filterPlatform}
          onChange={setFilterPlatform}
          options={[
            { label: 'AdMob', value: 'admob' },
            { label: 'Meta', value: 'meta' },
            { label: 'Unity', value: 'unity' },
            { label: 'AppLovin', value: 'applovin' },
            { label: 'ironSource', value: 'ironsource' },
          ]}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 100 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { label: '启用', value: 'enabled' },
            { label: '停用', value: 'disabled' },
          ]}
        />
        <Select
          allowClear
          placeholder="主节点"
          style={{ width: 180 }}
          value={filterServer}
          onChange={setFilterServer}
          options={syncServers.map((s) => ({
            label: `${s.server_name} (${s.server_id})`,
            value: s.server_id,
          }))}
        />
        <Input.Search
          placeholder="关键词搜索"
          allowClear
          style={{ width: 200 }}
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onSearch={handleSearch}
        />
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
      </Space>

      <Table<API.AdAccount>
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="middle"
        bordered
        scroll={{ x: 1400 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
      />

      <AdAccountFormModal
        open={formOpen}
        current={currentRecord}
        syncServers={syncServers}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />
    </PageContainer>
  );
};

export default AdAccountsPage;
