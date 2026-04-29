import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getProjectUserApps,
  createProjectUserApp,
  updateProjectUserApp,
  deleteProjectUserApp,
} from '@/services/project/api';

interface UserAppsTabProps {
  projectId: number;
}

const UserAppsTab: React.FC<UserAppsTabProps> = ({ projectId }) => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ProjectUserAppItem | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleOpenForm = (record?: API.ProjectUserAppItem) => {
    setCurrentRow(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        appId: values.appId?.trim(),
      };
      setSubmitLoading(true);
      if (currentRow?.id) {
        const res = await updateProjectUserApp(projectId, currentRow.id, payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createProjectUserApp(projectId, payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '新增失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('新增成功');
      }
      setSubmitLoading(false);
      setFormOpen(false);
      actionRef.current?.reload();
    } catch {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (record: API.ProjectUserAppItem) => {
    const res = await deleteProjectUserApp(projectId, record.id);
    if (res.code !== 0) {
      messageApi.error(res.msg || '删除失败');
      return;
    }
    messageApi.success('删除成功');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.ProjectUserAppItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: 'AppId', dataIndex: 'appId', width: 220 },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 90,
      valueType: 'select',
      valueEnum: { 1: { text: '启用', status: 'Success' }, 0: { text: '禁用', status: 'Default' } },
      render: (_, r) => (
        <Tag color={r.enabled === 1 ? 'success' : 'default'}>{r.enabled === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', width: 220, search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, search: false },
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '按 AppId 搜索' },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 130,
      render: (_, record) => [
        <a key="edit" onClick={() => handleOpenForm(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除？"
          onConfirm={() => handleDelete(record)}
          okText="确认"
          cancelText="取消"
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.ProjectUserAppItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getProjectUserApps(projectId, {
            enabled: params.enabled !== undefined ? Number(params.enabled) : undefined,
            keyword: params.keyword as string | undefined,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false };
          }
          const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          return {
            data: list,
            success: true,
          };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => handleOpenForm()}>
            新增关联
          </Button>,
        ]}
        pagination={false}
      />

      <Modal
        title={currentRow ? '编辑用户 AppId 关联' : '新增用户 AppId 关联'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="appId"
            label="AppId"
            rules={[
              { required: true, message: '请输入 AppId' },
              {
                validator: async (_, value) => {
                  if (typeof value === 'string' && !value.trim()) {
                    throw new Error('AppId 不能为空');
                  }
                },
              },
            ]}
          >
            <Input placeholder="如 com.demo.ios" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" initialValue={1}>
            <Select options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserAppsTab;
