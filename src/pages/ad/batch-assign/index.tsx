import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getAdAccounts,
  batchAssignServer,
  getSyncServers,
} from '@/services/ad/api';

const { Text } = Typography;

const BatchAssignPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [accounts, setAccounts] = useState<API.AdAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [syncServers, setSyncServers] = useState<API.SyncServer[]>([]);

  const loadAccounts = async (p?: number, s?: number) => {
    setLoading(true);
    const res = await getAdAccounts({ page: p ?? page, size: s ?? pageSize });
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取账号列表失败');
      return;
    }
    const paged = res.data;
    setAccounts(paged?.items ?? []);
    setTotal(paged?.total ?? 0);
  };

  useEffect(() => {
    loadAccounts();
  }, [page, pageSize]);

  useEffect(() => {
    getSyncServers().then((res) => {
      if (res.code === 0 && res.data) setSyncServers(res.data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedIds.length) {
      messageApi.warning('请先选择账号');
      return;
    }
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      const res = await batchAssignServer({
        account_ids: selectedIds,
        assigned_server_id: values.assigned_server_id,
        backup_server_id: values.backup_server_id,
        isolation_group: values.isolation_group,
      });
      setSubmitLoading(false);
      if (res.code !== 0) {
        messageApi.error(res.msg || '分配失败');
        return;
      }
      messageApi.success(`已成功分配 ${selectedIds.length} 个账号`);
      setSelectedIds([]);
      loadAccounts();
    } catch {
      // validation
    }
  };

  const columns: ColumnsType<API.AdAccount> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '平台',
      dataIndex: 'source_platform',
      width: 100,
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: '账号名', dataIndex: 'account_name', ellipsis: true },
    { title: '显示名', dataIndex: 'account_label', width: 120, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => (
        <Tag color={v === 'enabled' ? 'green' : 'default'}>{v === 'enabled' ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '当前主节点',
      dataIndex: 'assigned_server_id',
      width: 140,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '当前备节点',
      dataIndex: 'backup_server_id',
      width: 140,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '隔离组',
      dataIndex: 'isolation_group',
      width: 100,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
  ];

  const serverOptions = syncServers.map((s) => ({
    label: `${s.server_name} (${s.server_id})`,
    value: s.server_id,
  }));

  return (
    <PageContainer>
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="assigned_server_id"
          label="主节点"
          rules={[{ required: true, message: '请选择主节点' }]}
        >
          <Select
            placeholder="选择主节点"
            style={{ width: 200 }}
            options={serverOptions}
          />
        </Form.Item>
        <Form.Item name="backup_server_id" label="备节点">
          <Select
            allowClear
            placeholder="选择备节点"
            style={{ width: 200 }}
            options={serverOptions}
          />
        </Form.Item>
        <Form.Item name="isolation_group" label="隔离组">
          <Input placeholder="可选" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            loading={submitLoading}
            onClick={handleSubmit}
          >
            批量分配 ({selectedIds.length})
          </Button>
        </Form.Item>
      </Form>

      <Table<API.AdAccount>
        rowKey="id"
        dataSource={accounts}
        columns={columns}
        loading={loading}
        size="middle"
        bordered
        scroll={{ x: 1000 }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
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
    </PageContainer>
  );
};

export default BatchAssignPage;
