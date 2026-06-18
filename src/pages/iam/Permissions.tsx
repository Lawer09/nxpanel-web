import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import React from 'react';
import { listIamPermissions } from '@/services/iam/api';
import IamAuthPage from './components/IamAuthPage';

const PermissionsContent: React.FC = () => {
  const { message } = App.useApp();

  const columns: ProColumns<API.IamPermission>[] = [
    { title: 'Code', dataIndex: 'code', copyable: true, ellipsis: true },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    {
      title: 'Group',
      dataIndex: 'group_name',
      render: (_, record) => (record.group_name ? <Tag>{record.group_name}</Tag> : '-'),
    },
    { title: 'Resource', dataIndex: 'resource' },
    { title: 'Action', dataIndex: 'action' },
  ];

  return (
    <PageContainer>
      <ProTable<API.IamPermission>
        rowKey="code"
        columns={columns}
        search={{
          labelWidth: 100,
        }}
        pagination={false}
        request={async (params) => {
          try {
            const response = await listIamPermissions({
              group_name: params.group_name as string | undefined,
              resource: params.resource as string | undefined,
              action: params.action as string | undefined,
            });
            return {
              data: response.data?.items ?? [],
              success: true,
            };
          } catch (error: any) {
            message.error(error?.message || 'Failed to load permissions.');
            return {
              data: [],
              success: false,
            };
          }
        }}
      />
    </PageContainer>
  );
};

const PermissionsPage: React.FC = () => (
  <IamAuthPage>
    <PermissionsContent />
  </IamAuthPage>
);

export default PermissionsPage;
