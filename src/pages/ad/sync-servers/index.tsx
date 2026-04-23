import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getSyncServers,
  toggleSyncServerStatus,
} from '@/services/ad/api';
import SyncServerFormModal from './components/SyncServerFormModal';

const { Text } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  online: { color: 'green', label: '在线' },
  offline: { color: 'default', label: '离线' },
  maintenance: { color: 'orange', label: '维护中' },
};

const SyncServersPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [data, setData] = useState<API.SyncServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    const res = await getSyncServers();
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取列表失败');
      return;
    }
    setData(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (record: API.SyncServer, newStatus: string) => {
    setStatusLoading((s) => ({ ...s, [record.server_id]: true }));
    const res = await toggleSyncServerStatus(record.server_id, newStatus);
    setStatusLoading((s) => ({ ...s, [record.server_id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    setData((prev) =>
      prev.map((r) =>
        r.server_id === record.server_id ? { ...r, status: newStatus } : r,
      ),
    );
  };

  const columns: ColumnsType<API.SyncServer> = [
    { title: '节点 ID', dataIndex: 'server_id', width: 160 },
    { title: '节点名称', dataIndex: 'server_name', width: 180 },
    { title: '主机 IP', dataIndex: 'host_ip', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (v) => {
        const s = STATUS_MAP[v] || { color: 'default', label: v };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '最后心跳',
      dataIndex: 'last_heartbeat_at',
      width: 180,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (tags: string[]) =>
        (tags ?? []).map((t) => (
          <Tag key={t} color="blue">
            {t}
          </Tag>
        )),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Select
          size="small"
          value={record.status}
          loading={!!statusLoading[record.server_id]}
          style={{ width: 120 }}
          onChange={(v) => handleStatusChange(record, v)}
          options={[
            { label: '在线', value: 'online' },
            { label: '离线', value: 'offline' },
            { label: '维护中', value: 'maintenance' },
          ]}
        />
      ),
    },
  ];

  return (
    <PageContainer
      extra={[
        <Button
          key="add"
          type="primary"
          onClick={() => setFormOpen(true)}
        >
          新建节点
        </Button>,
      ]}
    >
      <Table<API.SyncServer>
        rowKey="server_id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="middle"
        bordered
        scroll={{ x: 1000 }}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <SyncServerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />
    </PageContainer>
  );
};

export default SyncServersPage;
