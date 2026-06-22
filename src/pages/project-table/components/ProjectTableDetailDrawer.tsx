import React, { useState } from 'react';
import { Button, Descriptions, Drawer, Modal, Space, Tabs, Tag, Typography, App } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  InboxOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ProjectItem } from '@/services/project/types';
import { updateProjectStatus } from '@/services/project/api';
import { formatUTC8 } from '@/utils/format';
import TrafficAccounts from '@/pages/project/components/ResourceTabs/TrafficAccounts';
import AdAccounts from '@/pages/project/components/ResourceTabs/AdAccounts';
import UserApps from '@/pages/project/components/ResourceTabs/UserApps';
import DailyAggregation from '@/pages/project/components/DailyAggregation';
import { PROJECT_FIELD_GROUPS } from '../fields';
import ProjectTableForm from './ProjectTableForm';

interface ProjectTableDetailDrawerProps {
  open: boolean;
  project: ProjectItem | null;
  onClose: () => void;
  onProjectChange: (project: ProjectItem) => void;
  onRefresh: () => void;
}

const renderStatus = (status?: string) => {
  switch (status) {
    case 'active':
      return <Tag color="success">启用</Tag>;
    case 'inactive':
      return <Tag color="default">停用</Tag>;
    case 'archived':
      return <Tag color="#595959">已归档</Tag>;
    default:
      return status ? <Tag>{status}</Tag> : '-';
  }
};

const renderValue = (value: unknown, multiline?: boolean) => {
  if (value === undefined || value === null || value === '') return '-';
  if (!multiline) return String(value);
  return (
    <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
      {String(value)}
    </Typography.Paragraph>
  );
};

const ProjectTableDetailDrawer: React.FC<ProjectTableDetailDrawerProps> = ({
  open,
  project,
  onClose,
  onProjectChange,
  onRefresh,
}) => {
  const { message } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);

  const handleStatusChange = (status: ProjectItem['status']) => {
    if (!project) return;
    Modal.confirm({
      title: '确认更新状态',
      content: `确定将项目状态更新为 ${status} 吗？`,
      onOk: async () => {
        await updateProjectStatus({ id: project.id, status });
        const nextProject = { ...project, status };
        message.success('状态更新成功');
        onProjectChange(nextProject);
        onRefresh();
      },
    });
  };

  return (
    <>
      <Drawer
        title={project ? `${project.projectName} (${project.projectCode})` : '项目详情'}
        width={1120}
        open={open}
        onClose={onClose}
        destroyOnHidden
        extra={
          project ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => setFormOpen(true)}>
                编辑
              </Button>
              {project.status === 'active' ? (
                <Button danger icon={<StopOutlined />} onClick={() => handleStatusChange('inactive')}>
                  停用
                </Button>
              ) : (
                <Button
                  type="primary"
                  ghost
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusChange('active')}
                >
                  启用
                </Button>
              )}
              <Button icon={<InboxOutlined />} onClick={() => handleStatusChange('archived')}>
                归档
              </Button>
            </Space>
          ) : null
        }
      >
        {project ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Tabs
              items={[
                {
                  key: 'detail',
                  label: '项目详情',
                  children: (
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Descriptions
                        title="状态"
                        bordered
                        size="small"
                        column={3}
                        items={[
                          { key: 'id', label: '项目 ID', children: project.id },
                          { key: 'status', label: '状态', children: renderStatus(project.status) },
                          {
                            key: 'createdAt',
                            label: '创建时间',
                            children: formatUTC8(project.createdAt),
                          },
                          {
                            key: 'updatedAt',
                            label: '更新时间',
                            children: formatUTC8(project.updatedAt),
                          },
                        ]}
                      />
                      {PROJECT_FIELD_GROUPS.map((group) => (
                        <Descriptions
                          key={group.key}
                          title={group.label}
                          bordered
                          size="small"
                          column={group.fields.some((field) => field.multiline) ? 1 : 3}
                          items={group.fields.map((field) => ({
                            key: field.name,
                            label: field.label,
                            children: renderValue(project[field.name], field.multiline),
                          }))}
                        />
                      ))}
                    </Space>
                  ),
                },
                {
                  key: 'traffic',
                  label: '流量账号',
                  children: <TrafficAccounts projectId={project.id} />,
                },
                {
                  key: 'ad',
                  label: '广告账号',
                  children: <AdAccounts projectId={project.id} />,
                },
                {
                  key: 'app',
                  label: '用户 App',
                  children: <UserApps projectId={project.id} />,
                },
                {
                  key: 'aggregation',
                  label: '日聚合',
                  children: <DailyAggregation projectId={project.id} />,
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>

      {project ? (
        <ProjectTableForm
          open={formOpen}
          onOpenChange={setFormOpen}
          initialValues={project}
          onSuccess={(updated) => {
            setFormOpen(false);
            onProjectChange({ ...project, ...updated });
            onRefresh();
          }}
        />
      ) : null}
    </>
  );
};

export default ProjectTableDetailDrawer;

