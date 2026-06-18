import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Tag } from 'antd';
import React from 'react';
import { listIamAuditLogs } from '@/services/iam/api';
import { pageParams } from './components/utils';
import IamAuthPage from './components/IamAuthPage';

const AuditLogsContent: React.FC = () => {
  const { message } = App.useApp();

  const columns: ProColumns<API.IamAuditLog>[] = [
    { title: 'ID', dataIndex: 'id', width: 90, search: false },
    { title: 'Operator ID', dataIndex: 'operator_id', width: 120, search: false },
    { title: 'Action', dataIndex: 'action', ellipsis: true, search: false },
    { title: 'Path', dataIndex: 'path', copyable: true, ellipsis: true, search: false },
    {
      title: 'Result',
      dataIndex: 'result',
      width: 120,
      search: false,
      render: (_, record) => (record.result ? <Tag>{record.result}</Tag> : '-'),
    },
    { title: 'Request ID', dataIndex: 'request_id', copyable: true, ellipsis: true, search: false },
    { title: 'Created At', dataIndex: 'created_at', width: 180, search: false },
  ];

  return (
    <PageContainer>
      <ProTable<API.IamAuditLog>
        rowKey="id"
        columns={columns}
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        request={async (params) => {
          try {
            const response = await listIamAuditLogs(pageParams(params));
            return {
              data: response.data?.items ?? [],
              success: true,
              total: response.data?.total ?? 0,
            };
          } catch (error: any) {
            message.error(error?.message || 'Failed to load audit logs.');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
      />
    </PageContainer>
  );
};

const AuditLogsPage: React.FC = () => (
  <IamAuthPage>
    <AuditLogsContent />
  </IamAuthPage>
);

export default AuditLogsPage;
