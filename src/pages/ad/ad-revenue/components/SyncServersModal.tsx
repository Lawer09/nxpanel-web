import { App, Button, Modal, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useState } from 'react';
import { ModalForm, ProFormDateRangePicker } from '@ant-design/pro-components';
import { getSyncServers, syncRevenueByDate, testSyncServer } from '@/services/ad/api';
import { formatUtc8 } from '../../utils/time';
import SyncDetailDrawer from '../../sync-servers/components/SyncDetailDrawer';
import SyncServerFormModal from '../../sync-servers/components/SyncServerFormModal';

interface SyncServersModalProps {
  open: boolean;
  onClose: () => void;
}

const SyncServersModal: React.FC<SyncServersModalProps> = ({ open, onClose }) => {
  const { message: messageApi, modal } = App.useApp();

  const [data, setData] = useState<API.SyncServer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.SyncServer | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailServer, setDetailServer] = useState<API.SyncServer | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncServerTarget, setSyncServerTarget] = useState<API.SyncServer | undefined>();

  const handleTestSync = async (record: API.SyncServer) => {
    try {
      const res = await testSyncServer(record.serverId);
      if (res.code === 0) {
        modal.success({
          title: '测试同步成功',
          content: (
            <div>
              <p>耗时: {res.data?.body?.elapsed || '-'}</p>
              <p>信息: {res.data?.body?.message || '-'}</p>
            </div>
          ),
        });
      } else {
        messageApi.error(res.msg || '测试同步失败');
      }
    } catch {
      // request interceptor handles errors
    }
  };

  const fetchSyncServers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSyncServers({ page, pageSize });
      if (res.code === 0 && res.data) {
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取同步节点失败');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, messageApi]);

  useEffect(() => {
    if (open) fetchSyncServers();
  }, [open, fetchSyncServers]);

  const columns: ColumnsType<API.SyncServer> = [
    { title: '节点 ID', dataIndex: 'serverId', width: 140 },
    { title: '节点名称', dataIndex: 'serverName', width: 160 },
    { title: '主机 IP', dataIndex: 'hostIp', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (value) => {
        const map: Record<string, { color: string; label: string }> = {
          online: { color: 'green', label: '在线' },
          offline: { color: 'default', label: '离线' },
          maintenance: { color: 'orange', label: '维护中' },
        };
        const status = map[value] || { color: 'default', label: value };
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeatAt',
      width: 170,
      render: (value) => formatUtc8(String(value)),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      render: (_, record) =>
        (record.tags ?? []).map((tag) => (
          <Tag key={tag} color="blue">
            {tag}
          </Tag>
        )),
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
              setDetailServer(record);
              setDetailOpen(true);
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
          <a onClick={() => handleTestSync(record)}>测试</a>
          <a
            onClick={() => {
              setSyncServerTarget(record);
              setSyncOpen(true);
            }}
          >
            同步
          </a>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="同步节点"
      open={open}
      onCancel={onClose}
      width={960}
      footer={null}
      destroyOnHidden
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          onClick={() => {
            setCurrentRecord(undefined);
            setFormOpen(true);
          }}
        >
          新建节点
        </Button>
      </div>
      <Table<API.SyncServer>
        rowKey="serverId"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="small"
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
          showTotal: (count) => `共 ${count} 条`,
        }}
      />
      <SyncServerFormModal
        open={formOpen}
        current={currentRecord}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          setPage(1);
          fetchSyncServers();
        }}
      />
      <SyncDetailDrawer
        open={detailOpen}
        server={detailServer}
        onClose={() => setDetailOpen(false)}
      />
      <ModalForm
        title="执行收入同步"
        open={syncOpen}
        onOpenChange={setSyncOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          if (!syncServerTarget) return false;
          try {
            const res = await syncRevenueByDate(syncServerTarget.serverId, {
              start_date: values.dateRange[0],
              end_date: values.dateRange[1],
            });
            if (res.code === 0) {
              messageApi.success(res.msg || res.data?.msg || '同步指令已下发');
              return true;
            }
            messageApi.error(res.msg || '同步请求失败');
            return false;
          } catch {
            return false;
          }
        }}
      >
        <div style={{ marginBottom: 16 }}>
          针对节点：<strong>{syncServerTarget?.serverName}</strong>
        </div>
        <ProFormDateRangePicker
          name="dateRange"
          label="同步日期范围"
          rules={[{ required: true, message: '请选择同步日期范围' }]}
        />
      </ModalForm>
    </Modal>
  );
};

export default SyncServersModal;
