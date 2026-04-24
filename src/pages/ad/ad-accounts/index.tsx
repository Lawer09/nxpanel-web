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
  getAdAccounts,
  toggleAdAccountStatus,
  testAdAccountCredential,
  batchAssignServer,
  getSyncServers,
} from '@/services/ad/api';
import AdAccountFormModal from './components/AdAccountFormModal';
import ProjectMappingDrawer from './components/ProjectMappingDrawer';

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

  // project mapping drawer
  const [mappingDrawerOpen, setMappingDrawerOpen] = useState(false);
  const [mappingAccount, setMappingAccount] = useState<API.AdAccount | undefined>();

  // batch assign
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchForm] = Form.useForm();

  const loadData = async (p?: number, s?: number) => {
    setLoading(true);
    const res = await getAdAccounts({
      sourcePlatform: filterPlatform,
      status: filterStatus,
      assignedServerId: filterServer,
      keyword: filterKeyword,
      page: p ?? page,
      pageSize: s ?? pageSize,
    });
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取列表失败');
      return;
    }
    const paged = res.data;
    setData(paged?.data ?? []);
    setTotal(paged?.total ?? 0);
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
      width: 120,
      fixed: 'left',
      render: (_, r) => (
        <Space size={8} align="start">
          <Tag color={PLATFORM_COLORS[r.sourcePlatform] || 'default'}>{r.sourcePlatform}</Tag>
          <div>
            <Tooltip title={r.accountName}>
              <div style={{ fontWeight: 500 }}>{r.accountLabel || '-'}</div>
            </Tooltip>
          </div>
        </Space>
      ),
    },

    {
      title: '同步节点',
      dataIndex: 'assignedServerId',
      width: 120,
      render: (v, r) => {
        const main = v || '-';
        const backup = r.backupServerId;
        return backup ? (
          <Tooltip title={`备选节点: ${backup}`}>
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
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    { title: '时区', dataIndex: 'reportingTimezone', width: 120 },
    { title: '币种', dataIndex: 'currencyCode', width: 70 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      fixed: 'right',
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
      title: '操作',
      key: 'action',
      width: 160,
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
            label: `${s.serverName} (${s.serverId})`,
            value: s.serverId,
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
              options={syncServers.map((s) => ({
                label: `${s.serverName} (${s.serverId})`,
                value: s.serverId,
              }))}
            />
          </Form.Item>
          <Form.Item name="backupServerId" label="备节点">
            <Select
              allowClear
              placeholder="选择备节点"
              options={syncServers.map((s) => ({
                label: `${s.serverName} (${s.serverId})`,
                value: s.serverId,
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
    </PageContainer>
  );
};

export default AdAccountsPage;
