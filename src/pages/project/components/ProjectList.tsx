import React, { useRef, useState } from 'react';
import { Card, Input, Select, Button, Space, Typography, Tag, List, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { getProjects } from '@/services/project/api';
import type { ProjectItem, ProjectFetchRequest } from '@/services/project/types';
import ProjectForm from './ProjectForm';

const { Text } = Typography;

interface ProjectListProps {
  selectedProject: ProjectItem | null;
  onSelect: (project: ProjectItem) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ selectedProject, onSelect }) => {
  const [params, setParams] = useState<ProjectFetchRequest>({ page: 1, pageSize: 20 });
  const [formVisible, setFormVisible] = useState(false);

  const { data, loading, run } = useRequest(() => getProjects(params), {
    refreshDeps: [params],
    onSuccess: (res) => {
      // Auto-select first if none selected
      if (!selectedProject && res?.data?.data?.length > 0) {
        onSelect(res.data.data[0]);
      }
    }
  });

  const projects = data?.data?.data || [];
  const total = data?.data?.total || 0;

  const handleSearch = () => {
    setParams({ ...params, page: 1 });
  };

  const handleReset = () => {
    setParams({ page: 1, pageSize: 20 });
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="success">启用</Tag>;
      case 'inactive':
        return <Tag color="default">停用</Tag>;
      case 'archived':
        return <Tag color="#595959">已归档</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  return (
    <>
      <Card variant="borderless" styles={{ body: { padding: 16 } }} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="关键字 (代号/名称)"
            value={params.keyword}
            onChange={(e) => setParams({ ...params, keyword: e.target.value })}
            allowClear
          />
          <Space.Compact style={{ width: '100%' }}>
            <Select
              placeholder="状态"
              style={{ width: '50%' }}
              value={params.status}
              onChange={(val) => setParams({ ...params, status: val })}
              allowClear
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
                { label: '已归档', value: 'archived' },
              ]}
            />
            <Input
              placeholder="负责人 ID"
              style={{ width: '50%' }}
              value={params.ownerId}
              onChange={(e) => setParams({ ...params, ownerId: e.target.value ? Number(e.target.value) : undefined })}
              allowClear
            />
          </Space.Compact>
          <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setFormVisible(true)}>新建</Button>
          </Space>
        </Space>
      </Card>

      <List
        loading={loading}
        dataSource={projects}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: total,
          onChange: (page, pageSize) => setParams({ ...params, page, pageSize }),
          size: 'small',
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          style: { padding: '16px 0', margin: 0, position: 'sticky', bottom: 0, background: '#fff', zIndex: 2, borderTop: '1px solid #f0f0f0' },
        }}
        renderItem={(item) => (
          <List.Item style={{ padding: 0, marginBottom: 16 }}>
            <Card
              hoverable
              variant={selectedProject?.id === item.id ? 'outlined' : 'borderless'}
              style={{
                width: '100%',
                borderColor: selectedProject?.id === item.id ? '#1890ff' : undefined,
                boxShadow: selectedProject?.id === item.id ? '0 0 8px rgba(24,144,255,0.2)' : undefined,
                cursor: 'pointer'
              }}
              styles={{ body: { padding: 16 } }}
              onClick={() => onSelect(item)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{item.projectName} ({item.projectCode})</Text>
                {renderStatus(item.status)}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                <div>负责人: {item.ownerName} | 部门: {item.department}</div>
                <div>更新时间: {item.updatedAt}</div>
              </div>
              <Space split={<Text type="secondary">|</Text>} size="small" style={{ fontSize: 12 }}>
                <Text>流量账号: {item.trafficAccounts?.length || 0}</Text>
                <Text>广告账号: {item.adAccounts?.length || 0}</Text>
                <Text>App: {item.userApps?.length || 0}</Text>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      {formVisible && (
        <ProjectForm
          open={formVisible}
          onOpenChange={setFormVisible}
          onSuccess={() => {
            setFormVisible(false);
            run();
          }}
        />
      )}
    </>
  );
};

export default ProjectList;
