import React, { useRef, useState } from 'react';
import { PageContainer, type ProColumns, ProTable, type ActionType } from '@ant-design/pro-components';
import { App, Button, Modal, Space, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  InboxOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { getProjects, updateProjectStatus } from '@/services/project/api';
import type { ProjectFetchRequest, ProjectItem } from '@/services/project/types';
import { formatUTC8 } from '@/utils/format';
import ProjectTableForm from './components/ProjectTableForm';
import ProjectTableDetailDrawer from './components/ProjectTableDetailDrawer';
import { PROJECT_TABLE_FIELDS } from './fields';
import { PROJECT_AD_STATUS_OPTIONS } from '@/pages/project/constants';

const { Text } = Typography;

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

const countEnabled = (items?: { enabled: number }[]) => {
  const total = items?.length ?? 0;
  const enabled = items?.filter((item) => item.enabled === 1).length ?? 0;
  return `${enabled} / ${total}`;
};

const ProjectTablePage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ProjectItem | null>(null);

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const handleStatusChange = (record: ProjectItem, status: ProjectItem['status']) => {
    Modal.confirm({
      title: '确认更新状态',
      content: `确定将项目 ${record.projectName} 的状态更新为 ${status} 吗？`,
      onOk: async () => {
        await updateProjectStatus({ id: record.id, status });
        message.success('状态更新成功');
        if (detailProject?.id === record.id) {
          setDetailProject({ ...detailProject, status });
        }
        reloadTable();
      },
    });
  };

  const openEdit = (record: ProjectItem) => {
    setEditingProject(record);
    setFormOpen(true);
  };

  const openDetail = (record: ProjectItem) => {
    setDetailProject(record);
    setDetailOpen(true);
  };

  const columns: ProColumns<ProjectItem>[] = [
    {
      title: '项目 ID',
      dataIndex: 'id',
      width: 90,
      search: false,
      fixed: 'left',
    },
    {
      title: '项目代号',
      dataIndex: 'projectCode',
      width: 140,
      search: false,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 180,
      search: false,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '项目代号 / 项目名称',
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: {
        active: { text: '启用' },
        inactive: { text: '停用' },
        archived: { text: '已归档' },
      },
      render: (_, record) => renderStatus(record.status),
    },
    {
      title: '投放状态',
      dataIndex: 'adStatus',
      width: 120,
      valueType: 'select',
      fieldProps: {
        options: PROJECT_AD_STATUS_OPTIONS,
      },
      ellipsis: true,
    },
    {
      title: '项目包名',
      dataIndex: 'packageName',
      width: 220,
      ellipsis: true,
    },
    {
      title: '开发者 Gmail',
      dataIndex: 'developerGmail',
      width: 180,
      ellipsis: true,
    },
    {
      title: '负责人 ID',
      dataIndex: 'ownerId',
      hideInTable: true,
      valueType: 'digit',
    },
    ...PROJECT_TABLE_FIELDS.filter(
      (field) =>
        !['projectCode', 'projectName', 'adStatus', 'packageName', 'developerGmail', 'remark'].includes(field.name),
    ).map<ProColumns<ProjectItem>>((field) => ({
      title: field.label,
      dataIndex: field.name,
      width: field.width ?? 160,
      search: false,
      ellipsis: true,
      render: (_, record) => {
        const value = record[field.name];
        return value ? <Text ellipsis>{String(value)}</Text> : '-';
      },
    })),
    {
      title: '备注',
      dataIndex: 'remark',
      width: 220,
      search: false,
      ellipsis: true,
      render: (_, record) => (record.remark ? <Text ellipsis>{record.remark}</Text> : '-'),
    },
    {
      title: '流量账号',
      dataIndex: 'trafficAccounts',
      width: 110,
      search: false,
      render: (_, record) => countEnabled(record.trafficAccounts),
    },
    {
      title: '广告账号',
      dataIndex: 'adAccounts',
      width: 110,
      search: false,
      render: (_, record) => countEnabled(record.adAccounts),
    },
    {
      title: '用户 App',
      dataIndex: 'userApps',
      width: 110,
      search: false,
      render: (_, record) => countEnabled(record.userApps),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      search: false,
      render: (_, record) => formatUTC8(record.createdAt),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      search: false,
      render: (_, record) => formatUTC8(record.updatedAt),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a onClick={() => openDetail(record)}>详情</a>
          <a onClick={() => openEdit(record)}>编辑</a>
          {record.status === 'active' ? (
            <a onClick={() => handleStatusChange(record, 'inactive')}>
              <StopOutlined /> 停用
            </a>
          ) : (
            <a onClick={() => handleStatusChange(record, 'active')}>
              <CheckCircleOutlined /> 启用
            </a>
          )}
          <a onClick={() => handleStatusChange(record, 'archived')}>
            <InboxOutlined /> 归档
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: '项目管理' }}>
      <ProTable<ProjectItem, ProjectFetchRequest>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 5600 }}
        search={{ labelWidth: 90 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(undefined);
              setFormOpen(true);
            }}
          >
            新建
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, keyword, status, adStatus, packageName, developerGmail, ownerId } = params;
          const res = await getProjects({
            page: current,
            pageSize,
            keyword,
            status,
            adStatus,
            packageName,
            developerGmail,
            ownerId,
          });
          const pageData = res.data;
          return {
            data: pageData?.data ?? [],
            total: pageData?.total ?? 0,
            success: true,
          };
        }}
      />

      <ProjectTableForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingProject(undefined);
          }
        }}
        initialValues={editingProject}
        onSuccess={(updated) => {
          setFormOpen(false);
          if (editingProject && updated && detailProject?.id === editingProject.id) {
            setDetailProject({ ...detailProject, ...updated });
          }
          setEditingProject(undefined);
          reloadTable();
        }}
      />

      <ProjectTableDetailDrawer
        open={detailOpen}
        project={detailProject}
        onClose={() => {
          setDetailOpen(false);
          setDetailProject(null);
        }}
        onProjectChange={setDetailProject}
        onRefresh={reloadTable}
      />
    </PageContainer>
  );
};

export default ProjectTablePage;
