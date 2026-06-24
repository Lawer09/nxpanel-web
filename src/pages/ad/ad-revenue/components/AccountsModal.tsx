import { App, Button, Input, Modal, Select, Space, Switch, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useState } from 'react';
import { getAdAccounts, testAdAccountCredential, toggleAdAccountStatus } from '@/services/ad/api';
import { formatUtc8 } from '../../utils/time';
import AdAccountFormModal from '../../ad-accounts/components/AdAccountFormModal';
import AdAccountSyncModal from '../../components/AdAccountSyncModal';

const PLATFORM_OPTIONS = [
  { label: 'AdMob', value: 'admob' },
  { label: 'Meta', value: 'meta' },
  { label: 'Unity', value: 'unity' },
  { label: 'AppLovin', value: 'applovin' },
  { label: 'IronSource', value: 'ironsource' },
];

const PLATFORM_COLORS: Record<string, string> = {
  admob: 'green',
  meta: 'blue',
  unity: 'purple',
  applovin: 'orange',
  ironsource: 'cyan',
};

interface AccountsModalProps {
  open: boolean;
  onClose: () => void;
  syncServers: API.SyncServer[];
}

const AccountsModal: React.FC<AccountsModalProps> = ({ open, onClose, syncServers }) => {
  const { message: messageApi } = App.useApp();

  const [data, setData] = useState<API.AdAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [platform, setPlatform] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [keyword, setKeyword] = useState<string>();

  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.AdAccount | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [testLoading, setTestLoading] = useState<Record<number, boolean>>({});
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncAccount, setSyncAccount] = useState<API.AdAccount | undefined>();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdAccounts({
        sourcePlatform: platform,
        status,
        keyword,
        page,
        pageSize,
      });
      if (res.code === 0 && res.data) {
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取账号列表失败');
      }
    } finally {
      setLoading(false);
    }
  }, [platform, status, keyword, page, pageSize, messageApi]);

  useEffect(() => {
    if (open) fetchAccounts();
  }, [open, fetchAccounts]);

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
      prev.map((item) => (item.id === record.id ? { ...item, status: newStatus } : item)),
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

  const resetFilters = useCallback(() => {
    setPage(1);
    setPageSize(20);
    setPlatform(undefined);
    setStatus(undefined);
    setKeyword(undefined);
  }, []);

  useEffect(() => {
    if (!open) resetFilters();
  }, [open, resetFilters]);

  const columns: ColumnsType<API.AdAccount> = [
    { title: 'ID', dataIndex: 'id', width: 60, fixed: 'left' },
    {
      title: '账号',
      dataIndex: 'accountName',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <Space size={8}>
          <Tag color={PLATFORM_COLORS[record.sourcePlatform] || 'default'}>
            {record.sourcePlatform}
          </Tag>
          <span>{record.accountLabel || record.accountName || '-'}</span>
        </Space>
      ),
    },
    {
      title: '同步节点',
      dataIndex: 'assignedServerId',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value) => formatUtc8(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      fixed: 'right',
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
      width: 180,
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
    <Modal
      title="广告账号"
      open={open}
      onCancel={onClose}
      width={960}
      footer={null}
      destroyOnHidden
    >
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Space wrap>
          <Select
            allowClear
            placeholder="平台"
            style={{ width: 120 }}
            value={platform}
            onChange={(value) => {
              setPlatform(value);
              setPage(1);
            }}
            options={PLATFORM_OPTIONS}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 100 }}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ]}
          />
          <Input.Search
            placeholder="关键词搜索"
            allowClear
            style={{ width: 200 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={() => setPage(1)}
          />
        </Space>
        <Button
          type="primary"
          onClick={() => {
            setCurrentRecord(undefined);
            setFormOpen(true);
          }}
        >
          新建账号
        </Button>
      </div>
      <Table<API.AdAccount>
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="small"
        scroll={{ x: 860 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => `共 ${count} 条`,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
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
          setPage(1);
          fetchAccounts();
        }}
      />
      <AdAccountSyncModal
        open={syncOpen}
        account={syncAccount}
        syncServers={syncServers}
        onOpenChange={setSyncOpen}
        onSuccess={fetchAccounts}
      />
    </Modal>
  );
};

export default AccountsModal;
