import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Divider,
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
import ProjectMappingFormModal from './components/ProjectMappingFormModal';

const { Text } = Typography;

const ProjectMappingsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [data, setData] = useState<API.ProjectMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<API.ProjectMapping | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    const res = await getProjectMappings();
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取列表失败');
      return;
    }
    setData(res.data?.data ?? []);
  };

  useEffect(() => {
    loadData();
  }, []);

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
    { title: '项目 ID', dataIndex: 'projectId', width: 90 },
    { title: '账号 ID', dataIndex: 'accountId', width: 90 },
    {
      title: '平台',
      dataIndex: 'sourcePlatform',
      width: 100,
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: 'Provider App ID', dataIndex: 'providerAppId', ellipsis: true },
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
    { title: '更新时间', dataIndex: 'updatedAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 80,
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
    <PageContainer
      extra={[
        <Space key="actions">
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={() => {
              messageApi.info('CSV 批量导入功能开发中');
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>批量导入 CSV</Button>
          </Upload>
          <Button
            type="primary"
            onClick={() => {
              setCurrentRecord(undefined);
              setFormOpen(true);
            }}
          >
            新建映射
          </Button>
        </Space>,
      ]}
    >
      <Table<API.ProjectMapping>
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="middle"
        bordered
        scroll={{ x: 900 }}
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
    </PageContainer>
  );
};

export default ProjectMappingsPage;
