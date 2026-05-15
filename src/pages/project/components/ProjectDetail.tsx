import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, Row, Col, Statistic, Empty, Modal, Form, Input, App } from 'antd';
import { EditOutlined, StopOutlined, CheckCircleOutlined, InboxOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProjectItem } from '@/services/project/types';
import { updateProjectStatus, updateProject } from '@/services/project/api';
import TrafficAccounts, { ResourceActionRef as TrafficRef } from './ResourceTabs/TrafficAccounts';
import AdAccounts, { ResourceActionRef as AdRef } from './ResourceTabs/AdAccounts';
import UserApps, { ResourceActionRef as AppRef } from './ResourceTabs/UserApps';
import DailyAggregation from './DailyAggregation';
import { formatUTC8 } from '@/utils/format';

interface ProjectDetailProps {
  project: ProjectItem | null;
  onProjectUpdate: (project: ProjectItem) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onProjectUpdate }) => {
  const [activeCard, setActiveCard] = useState<'traffic' | 'ad' | 'app'>('traffic');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  const trafficRef = React.useRef<TrafficRef>(null);
  const adRef = React.useRef<AdRef>(null);
  const appRef = React.useRef<AppRef>(null);

  // 当选中的项目变化时，重置编辑状态和活动的 tab
  useEffect(() => {
    setIsEditing(false);
    setActiveCard('traffic');
  }, [project?.id]);

  if (!project) {
    return (
      <Card variant="borderless" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="请在左侧选择项目" />
      </Card>
    );
  }

  const handleStatusChange = (newStatus: 'active' | 'inactive' | 'archived') => {
    Modal.confirm({
      title: '确认更新状态?',
      content: `确定要将项目状态更改为 ${newStatus === 'active' ? '启用' : newStatus === 'inactive' ? '停用' : '已归档'} 吗？`,
      onOk: async () => {
        try {
          await updateProjectStatus({ id: project.id, status: newStatus });
          message.success('状态更新成功');
          onProjectUpdate({ ...project, status: newStatus });
        } catch (e) {
          // handled
        }
      }
    });
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

  const handleEdit = () => {
    form.setFieldsValue(project);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateProject({ id: project.id, ...values });
      message.success('保存成功');
      onProjectUpdate({ ...project, ...values });
      setIsEditing(false);
    } catch (e) {
      // Form validation failed or API error
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const activeTraffic = project.trafficAccounts?.filter(a => a.enabled === 1).length || 0;
  const totalTraffic = project.trafficAccounts?.length || 0;
  const activeAd = project.adAccounts?.filter(a => a.enabled === 1).length || 0;
  const totalAd = project.adAccounts?.length || 0;
  const activeApp = project.userApps?.filter(a => a.enabled === 1).length || 0;
  const totalApp = project.userApps?.length || 0;

  const renderCard = (key: 'traffic' | 'ad' | 'app', title: string, active: number, total: number, ref: React.RefObject<any>) => {
    const isActive = activeCard === key;
    return (
      <Card
        title={<span style={{ fontSize: 14 }}>{title}</span>}
        extra={
          <Button
            type="link"
            icon={<PlusOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCard(key);
              ref.current?.openAdd();
            }}
          >
            关联
          </Button>
        }
        variant={isActive ? 'outlined' : 'borderless'}
        style={{
          cursor: 'pointer',
          borderColor: isActive ? '#1890ff' : undefined,
          boxShadow: isActive ? '0 0 8px rgba(24,144,255,0.2)' : undefined,
        }}
        onClick={() => {
          setActiveCard(key);
          if (key === 'traffic') trafficRef.current?.reload();
          if (key === 'ad') adRef.current?.reload();
          if (key === 'app') appRef.current?.reload();
        }}
        styles={{ header: { borderBottom: 'none', minHeight: 38, padding: '12px 16px 0' }, body: { paddingTop: 8 } }}
      >
        <Statistic value={`${active} / ${total}`} />
      </Card>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 基础信息 */}
      <Card
        variant="borderless"
        title={
          <Space>
            <span>项目基础信息</span>
            {!isEditing && renderStatus(project.status)}
          </Space>
        }
        extra={
          isEditing ? (
            <Space>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存</Button>
              <Button icon={<CloseOutlined />} onClick={handleCancelEdit} disabled={saving}>取消</Button>
            </Space>
          ) : (
            <Space>
              <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
              {project.status === 'active' ? (
                <Button danger icon={<StopOutlined />} onClick={() => handleStatusChange('inactive')}>停用</Button>
              ) : (
                <Button type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('active')}>启用</Button>
              )}
              <Button icon={<InboxOutlined />} onClick={() => handleStatusChange('archived')}>归档</Button>
            </Space>
          )
        }
      >
        {isEditing ? (
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="projectCode" label="项目代号">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
                  <Input placeholder="请输入项目名称" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="department" label="部门">
                  <Input placeholder="请输入部门" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ownerId" label="负责人 ID">
                  <Input type="number" placeholder="请输入负责人 ID" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="ownerName" label="负责人名称">
                  <Input placeholder="请输入负责人名称" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="remark" label="备注" style={{ marginBottom: 0 }}>
                  <Input.TextArea rows={2} placeholder="请输入备注" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={3} size="small">
            <Descriptions.Item label="项目代号">{project.projectCode}</Descriptions.Item>
            <Descriptions.Item label="项目名称">{project.projectName}</Descriptions.Item>
            <Descriptions.Item label="部门">{project.department || '-'}</Descriptions.Item>
            <Descriptions.Item label="负责人">{project.ownerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatUTC8(project.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatUTC8(project.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="备注" span={3}>{project.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {/* 统计卡片 (作为切换 Tab 使用) */}
      <Row gutter={16}>
        <Col span={8}>
          {renderCard('traffic', '流量账号 (启用 / 总数)', activeTraffic, totalTraffic, trafficRef)}
        </Col>
        <Col span={8}>
          {renderCard('ad', '广告账号 (启用 / 总数)', activeAd, totalAd, adRef)}
        </Col>
        <Col span={8}>
          {renderCard('app', '用户 App (启用 / 总数)', activeApp, totalApp, appRef)}
        </Col>
      </Row>

      {/* 对应的详情表格 */}
      <Card variant="borderless">
        <div style={{ display: activeCard === 'traffic' ? 'block' : 'none' }}>
          <TrafficAccounts ref={trafficRef} projectId={project.id} />
        </div>
        <div style={{ display: activeCard === 'ad' ? 'block' : 'none' }}>
          <AdAccounts ref={adRef} projectId={project.id} />
        </div>
        <div style={{ display: activeCard === 'app' ? 'block' : 'none' }}>
          <UserApps ref={appRef} projectId={project.id} />
        </div>
      </Card>

      {/* 日聚合工具 */}
      <DailyAggregation projectId={project.id} />
    </div>
  );
};

export default ProjectDetail;
