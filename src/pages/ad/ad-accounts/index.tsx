import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  batchAssignServer,
  getAdAccounts,
  getSyncServers,
  testAdAccountCredential,
  toggleAdAccountStatus,
} from '@/services/ad/api';
import AdAccountSyncModal from '../components/AdAccountSyncModal';
import { formatUtc8 } from '../utils/time';
import AdAccountFormModal from './components/AdAccountFormModal';
import ProjectMappingDrawer from './components/ProjectMappingDrawer';

const { Text } = Typography;

const PLATFORM_OPTIONS = [
  { label: 'AdMob', value: 'admob' },
  { label: 'Meta', value: 'meta' },
  { label: 'Unity', value: 'unity' },
  { label: 'AppLovin', value: 'applovin' },
  { label: 'ironSource', value: 'ironsource' },
];

const STATUS_OPTIONS = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

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

  const [filterPlatform, setFilterPlatform] = useState<string>();
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterServer, setFilterServer] = useState<string>();
  const [filterKeyword, setFilterKeyword] = useState<string>();

  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.AdAccount | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [testLoading, setTestLoading] = useState<Record<number, boolean>>({});
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncAccount, setSyncAccount] = useState<API.AdAccount | undefined>();

  const [mappingDrawerOpen, setMappingDrawerOpen] = useState(false);
  const [mappingAccount, setMappingAccount] = useState<API.AdAccount | undefined>();

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchForm] = Form.useForm();

  const loadData = async (nextPage?: number, nextPageSize?: number) => {
    setLoading(true);
    try {
      const res = await getAdAccounts({
        sourcePlatform: filterPlatform,
        status: filterStatus,
        assignedServerId: filterServer,
        keyword: filterKeyword,
        page: nextPage ?? page,
        pageSize: nextPageSize ?? pageSize,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '获取列表失败');
        return;
      }
      setData(res.data?.data ?? []);
      setTotal(res.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  useEffect(() => {
    getSyncServers().then((res) => {
      if (res.code === 0 && res.data) setSyncServers(res.data.data ?? []);
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadData(1, pageSize);
  };

  const handleToggleStatus = async (record: API.AdAccount) => {
    const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
    setSwitchLoading((state) => ({ ...state, [record.id]: true }));
    const res = await toggleAdAccountStatus(record.id, newStatus);
    setSwitchLoading((state) => ({ ...state, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    setData((prev) =>
      prev.map((item) => (item.id === record.id ? { ...item, status: newStatus } : item)),
    );
  };

  const handleTestCredential = async (record: API.AdAccount) => {
    setTestLoading((state) => ({ ...state, [record.id]: true }));
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
    setTestLoading((state) => ({ ...state, [record.id]: false }));
  };

  const handleBatchAssign = async () => {
    try {
      const values = await batchForm.validateFields();
      setBatchLoading(true);
      const res = await batchAssignServer({
        accountIds: selectedRowKeys,
        assignedServerId: values.assignedServerId,
        backupServerId: values.backupServerId,
        isolationGroup: values.isolationGroup,
      });
      setBatchLoading(false);
      if (res.code !== 0) {
        messageApi.error(res.msg || '分配失败');
        return;
      }
      messageApi.success(`已成功分配 ${selectedRowKeys.length} 个账号`);
      setBatchOpen(false);
      setSelectedRowKeys([]);
      batchForm.resetFields();
      loadData();
    } catch {
      setBatchLoading(false);
    }
  };

  const columns: ColumnsType<API.AdAccount> = [
    { title: 'ID', dataIndex: 'id', width: 60, fixed: 'left' },
    {
      title: '账号',
      dataIndex: 'accountName',
      width: 140,
      fixed: 'left',
      render: (_, record) => (
        <Space size={8} align="start">
          <Tag color={PLATFORM_COLORS[record.sourcePlatform] || 'default'}>
            {record.sourcePlatform}
          </Tag>
          <Tooltip title={record.accountName}>
            <div style={{ fontWeight: 500 }}>{record.accountLabel || '-'}</div>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '同步节点',
      dataIndex: 'assignedServerId',
      width: 130,
      render: (value, record) => {
        const main = value || '-';
        return record.backupServerId ? (
          <Tooltip title={`备选节点: ${record.backupServerId}`}>
            <span style={{ cursor: 'pointer', borderBottom: '1px dashed #999' }}>{main}</span>
          </Tooltip>
        ) : (
          <span>{main}</span>
        );
      },
    },
    {
      title: '隔离组',
      dataIndex: 'isolationGroup',
      width: 100,
      render: (value) => value || <Text type="secondary">-</Text>,
    },
    { title: '时区', dataIndex: 'reportingTimezone', width: 120 },
    { title: '币种', dataIndex: 'currencyCode', width: 70 },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value) => {
        const formatted = formatUtc8(value);
        return formatted === '-' ? <Text type="secondary">-</Text> : formatted;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      fixed: 'right',
      width: 60,
      render: (value, record) => (
        <Switch
          size="small"
          checked={value === 'enabled'}
          loading={!!switchLoading[record.id]}
          onChange={() => handleToggleStatus(record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 210,
      fixed: 'right',
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
            onClick={() => {
              setMappingAccount(record);
              setMappingDrawerOpen(true);
            }}
          >
            映射
          </a>
          <a
            onClick={() => handleTestCredential(record)}
            style={{ color: testLoading[record.id] ? '#999' : undefined }}
          >
            {testLoading[record.id] ? '测试中...' : '测试凭据'}
          </a>
          <Tooltip title={record.assignedServerId ? undefined : '请先分配同步节点'}>
            <a
              onClick={() => {
                if (!record.assignedServerId) return;
                setSyncAccount(record);
                setSyncOpen(true);
              }}
              style={{
                color: record.assignedServerId ? undefined : '#999',
                cursor: record.assignedServerId ? 'pointer' : 'not-allowed',
              }}
            >
              同步
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      extra={[
        <Button
          key="batch"
          disabled={selectedRowKeys.length === 0}
          onClick={() => setBatchOpen(true)}
        >
          批量分配 ({selectedRowKeys.length})
        </Button>,
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
          options={PLATFORM_OPTIONS}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 100 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={STATUS_OPTIONS}
        />
        <Select
          allowClear
          placeholder="主节点"
          style={{ width: 180 }}
          value={filterServer}
          onChange={setFilterServer}
          options={syncServers.map((server) => ({
            label: `${server.serverName} (${server.serverId})`,
            value: server.serverId,
          }))}
        />
        <Input.Search
          placeholder="关键词搜索"
          allowClear
          style={{ width: 200 }}
          value={filterKeyword}
          onChange={(event) => setFilterKeyword(event.target.value)}
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
        scroll={{ x: 1460 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
          fixed: true,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => `共 ${count} 条`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
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

      <Modal
        title={`批量分配 (${selectedRowKeys.length} 个账号)`}
        open={batchOpen}
        onCancel={() => setBatchOpen(false)}
        onOk={handleBatchAssign}
        confirmLoading={batchLoading}
        destroyOnHidden
      >
        <Form form={batchForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="assignedServerId"
            label="主节点"
            rules={[{ required: true, message: '请选择主节点' }]}
          >
            <Select
              placeholder="选择主节点"
              options={syncServers.map((server) => ({
                label: `${server.serverName} (${server.serverId})`,
                value: server.serverId,
              }))}
            />
          </Form.Item>
          <Form.Item name="backupServerId" label="备节点">
            <Select
              allowClear
              placeholder="选择备节点"
              options={syncServers.map((server) => ({
                label: `${server.serverName} (${server.serverId})`,
                value: server.serverId,
              }))}
            />
          </Form.Item>
          <Form.Item name="isolationGroup" label="隔离组">
            <Input placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <ProjectMappingDrawer
        open={mappingDrawerOpen}
        account={mappingAccount ?? null}
        onClose={() => setMappingDrawerOpen(false)}
      />
      <AdAccountSyncModal
        open={syncOpen}
        account={syncAccount}
        syncServers={syncServers}
        onOpenChange={setSyncOpen}
        onSuccess={() => loadData()}
      />
    </PageContainer>
  );
};

export default AdAccountsPage;
