import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ActionType, ProTable, ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Space, Popconfirm, Tag, App } from 'antd';
import { getUserApps, createUserApp, updateUserApp, deleteUserApp } from '@/services/project/api';
import type { ProjectUserApp } from '@/services/project/types';

interface UserAppsProps {
  projectId: number;
}

export interface ResourceActionRef {
  openAdd: () => void;
  reload: () => void;
}

const UserApps = forwardRef<ResourceActionRef, UserAppsProps>(({ projectId }, ref) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<ProjectUserApp | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    openAdd: () => {
      setCurrentRow(undefined);
      setFormVisible(true);
    },
    reload: () => {
      actionRef.current?.reload();
    }
  }));

  const columns: ProColumns<ProjectUserApp>[] = [
    { title: 'App ID', dataIndex: 'appId' },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: {
        1: { text: <Tag color="success">启用</Tag>, status: 'Success' },
        0: { text: <Tag color="default">停用</Tag>, status: 'Default' },
      },
    },
    { title: '备注', dataIndex: 'remark', hideInSearch: true },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', hideInSearch: true },
    { title: '更新时间', dataIndex: 'updatedAt', valueType: 'dateTime', hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => { setCurrentRow(record); setFormVisible(true); }}>编辑</a>
          <Popconfirm
            title="确认删除该关联？"
            onConfirm={async () => {
              await deleteUserApp({ id: record.id, projectId });
              message.success('删除成功');
              actionRef.current?.reload();
            }}
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<ProjectUserApp>
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        params={{ projectId }}
        request={async (params) => {
          const res = await getUserApps(params.projectId);
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          return { data: list, success: true };
        }}
        columns={columns}
      />

      {formVisible && (
        <ModalForm
          title={currentRow ? '编辑 App 绑定' : '新增 App 绑定'}
          open={formVisible}
          onOpenChange={setFormVisible}
          initialValues={currentRow || { enabled: 1 }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            try {
              if (currentRow) {
                // 编辑时只允许修改 enabled 和 remark
                await updateUserApp({
                  id: currentRow.id,
                  projectId,
                  enabled: values.enabled,
                  remark: values.remark,
                });
                message.success('编辑成功');
              } else {
                await createUserApp({
                  ...values,
                  projectId,
                } as any);
                message.success('新增成功');
              }
              setFormVisible(false);
              actionRef.current?.reload();
              return true;
            } catch (error) {
              return false;
            }
          }}
        >
          {!currentRow && (
            <ProFormText name="appId" label="App ID" rules={[{ required: true }]} />
          )}
          <ProFormSelect
            name="enabled"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
            rules={[{ required: true }]}
          />
          <ProFormTextArea name="remark" label="备注" />
        </ModalForm>
      )}
    </>
  );
});

export default UserApps;
