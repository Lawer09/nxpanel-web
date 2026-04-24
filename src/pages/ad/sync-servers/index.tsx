import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  App,
  Button,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import { getSyncServers } from '@/services/ad/api';
import SyncServerFormModal from './components/SyncServerFormModal';
import SyncDetailDrawer from './components/SyncDetailDrawer';
import { formatUtc8 } from '../utils/time';

const { Text } = Typography;

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  online: { color: 'green', label: '在线' },
  offline: { color: 'default', label: '离线' },
  maintenance: { color: 'orange', label: '维护中' },
};

const SyncServersPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.SyncServer | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentServer, setCurrentServer] = useState<API.SyncServer | null>(null);

  const columns: ProColumns<API.SyncServer>[] = [
    { title: '节点 ID', dataIndex: 'serverId', width: 160, search: false, fixed: 'left' },
    { title: '节点名称', dataIndex: 'serverName', width: 180, search: false },
    { title: '主机 IP', dataIndex: 'hostIp', width: 140, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      search: false,
      render: (_, r) => {
        const s = STATUS_MAP[r.status] || { color: 'default', label: r.status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeatAt',
      width: 180,
      search: false,
      render: (v) => {
        const formatted = formatUtc8(String(v));
        return formatted === '-' ? <Text type="secondary">-</Text> : formatted;
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      search: false,
      render: (_, r) =>
        (r.tags ?? []).map((t) => (
          <Tag key={t} color="blue">
            {t}
          </Tag>
        )),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setCurrentServer(record);
              setDrawerOpen(true);
            }}
          >
            查看
          </a>
          <a
            onClick={() => {
              setCurrentRecord(record);
              setFormOpen(true);
            }}
          >
            编辑
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
          新建节点
        </Button>,
      ]}
    >
      <ProTable<API.SyncServer>
        actionRef={actionRef}
        rowKey="serverId"
        columns={columns}
        search={false}
        size="middle"
        bordered
        scroll={{ x: 1000 }}
        request={async () => {
          const res = await getSyncServers();
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], total: 0, success: false };
          }
          const paged = res.data;
          return {
            data: paged?.data ?? [],
            total: paged?.total ?? 0,
            success: true,
          };
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <SyncServerFormModal
        open={formOpen}
        current={currentRecord}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />

      <SyncDetailDrawer
        open={drawerOpen}
        server={currentServer}
        onClose={() => setDrawerOpen(false)}
      />
    </PageContainer>
  );
};

export default SyncServersPage;
