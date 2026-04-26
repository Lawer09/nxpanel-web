import {
  App,
  Button,
  Drawer,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getProjectMappings,
  toggleProjectMappingStatus,
} from '@/services/ad/api';
import ProjectMappingFormModal from '../../project-mappings/components/ProjectMappingFormModal';

const { Text } = Typography;

interface Props {
  open: boolean;
  account: API.AdAccount | null;
  onClose: () => void;
}

const ProjectMappingDrawer: React.FC<Props> = ({ open, account, onClose }) => {
  const { message: messageApi } = App.useApp();
  const [data, setData] = useState<API.ProjectMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.ProjectMapping | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const res = await getProjectMappings({ accountId: account.id });
      if (res.code === 0) {
        setData(Array.isArray(res.data) ? res.data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && account) {
      loadData();
    }
  }, [open, account?.id]);

  const handleToggleStatus = async (record: API.ProjectMapping) => {
    const newStatus = record.status === 'enabled' ? 'disabled' : 'enabled';
    setSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleProjectMappingStatus(record.id, newStatus);
    setSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    setData((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: newStatus } : r)),
    );
  };

  const columns: ColumnsType<API.ProjectMapping> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目 ID', dataIndex: 'projectId', width: 80 },
    {
      title: '平台',
      dataIndex: 'sourcePlatform',
      width: 90,
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: 'Provider App ID', dataIndex: 'providerAppId', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (v, r) => (
        <Switch
          size="small"
          checked={v === 'enabled'}
          loading={!!switchLoading[r.id]}
          onChange={() => handleToggleStatus(r)}
        />
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <a
          onClick={() => {
            setCurrentRecord(record);
            setFormOpen(true);
          }}
        >
          编辑
        </a>
      ),
    },
  ];

  return (
    <Drawer
      title={account ? `项目映射 — ${account.accountLabel || account.accountName}（ID: ${account.id}）` : '项目映射'}
      open={open}
      onClose={onClose}
      width={820}
      destroyOnHidden
      extra={
        <Space>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={() => {
              messageApi.info('CSV 批量导入功能开发中');
              return false;
            }}
          >
            <Button size="small" icon={<UploadOutlined />}>导入 CSV</Button>
          </Upload>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setCurrentRecord(undefined);
              setFormOpen(true);
            }}
          >
            新建映射
          </Button>
        </Space>
      }
    >
      <Table<API.ProjectMapping>
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="small"
        bordered
        scroll={{ x: 700 }}
        pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <ProjectMappingFormModal
        open={formOpen}
        current={currentRecord}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          loadData();
        }}
      />
    </Drawer>
  );
};

export default ProjectMappingDrawer;
