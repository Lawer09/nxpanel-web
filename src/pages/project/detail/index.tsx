import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Descriptions, Tabs, Tag } from 'antd';
import { history, useParams } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { getProjectDetail } from '@/services/project/api';
import TrafficAccountsTab from './components/TrafficAccountsTab';
import AdAccountsTab from './components/AdAccountsTab';
import AdSpendTab from './components/AdSpendTab';

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '活跃' },
  inactive: { color: 'default', text: '停用' },
  archived: { color: 'warning', text: '归档' },
};

const ProjectDetailPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<API.ProjectItem | undefined>();

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getProjectDetail(Number(id));
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取项目详情失败');
      return;
    }
    setProject(res.data);
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const tabItems = [
    {
      key: 'traffic',
      label: '流量账号关联',
      children: <TrafficAccountsTab projectId={Number(id)} />,
    },
    {
      key: 'ad',
      label: '广告账号关联',
      children: <AdAccountsTab projectId={Number(id)} />,
    },
    {
      key: 'ad-spend',
      label: '投放消耗',
      children: project?.projectCode ? (
        <AdSpendTab projectCode={project.projectCode} />
      ) : null,
    },
  ];

  return (
    <PageContainer
      loading={loading}
      title={`项目详情 - ${project?.projectName || ''}`}
      onBack={() => history.back()}
    >
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="项目代号">{project?.projectCode}</Descriptions.Item>
          <Descriptions.Item label="项目名称">{project?.projectName}</Descriptions.Item>
          <Descriptions.Item label="所属人">
            {project?.ownerName} (ID: {project?.ownerId})
          </Descriptions.Item>
          <Descriptions.Item label="部门">{project?.department}</Descriptions.Item>
          <Descriptions.Item label="状态">
            {project && (
              <Tag color={STATUS_MAP[project.status]?.color || 'default'}>
                {STATUS_MAP[project.status]?.text || project.status}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{project?.createdAt}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {project?.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </PageContainer>
  );
};

export default ProjectDetailPage;
