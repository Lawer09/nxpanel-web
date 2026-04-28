import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Modal, Popconfirm, Select, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getProjectTrafficAccounts,
  createProjectTrafficAccount,
  updateProjectTrafficAccount,
  deleteProjectTrafficAccount,
} from '@/services/project/api';
import { getTrafficAccounts } from '@/services/traffic-platform/api';

interface TrafficAccountsTabProps {
  projectId: number;
}

const BIND_TYPE_MAP: Record<string, string> = {
  account: '整个账号',
  sub_account: '子账号',
};

const TrafficAccountsTab: React.FC<TrafficAccountsTabProps> = ({ projectId }) => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ProjectTrafficAccountItem | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    getTrafficAccounts({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setAccountOptions(
          res.data.data.map((a) => ({
            label: `${a.accountName} (${a.platformCode})`,
            value: a.id,
          })),
        );
      }
    });
  }, []);

  const handleOpenForm = (record?: API.ProjectTrafficAccountItem) => {
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
      setSubmitLoading(true);
      if (currentRow?.id) {
        const res = await updateProjectTrafficAccount(projectId, currentRow.id, values);
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createProjectTrafficAccount(projectId, values);
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

  const handleDelete = async (record: API.ProjectTrafficAccountItem) => {
    const res = await deleteProjectTrafficAccount(projectId, record.id);
    if (res.code !== 0) {
      messageApi.error(res.msg || '删除失败');
      return;
    }
    messageApi.success('删除成功');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.ProjectTrafficAccountItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号名称', dataIndex: 'accountName', width: 140, search: false },
    { title: '子账号ID', dataIndex: 'externalUid', width: 120, search: false },
    { title: '子账号名', dataIndex: 'externalUsername', width: 120, search: false },
    {
      title: '绑定类型',
      dataIndex: 'bindType',
      width: 100,
      search: false,
      render: (_, r) => BIND_TYPE_MAP[r.bindType] || r.bindType,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      valueType: 'select',
      valueEnum: { 1: { text: '启用', status: 'Success' }, 0: { text: '禁用', status: 'Default' } },
      render: (_, r) => (
        <Tag color={r.enabled === 1 ? 'success' : 'default'}>
          {r.enabled === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', width: 160, search: false, ellipsis: true },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
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
      <ProTable<API.ProjectTrafficAccountItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await getProjectTrafficAccounts(projectId, {
            platformCode: params.platformCode as string | undefined,
            enabled: params.enabled !== undefined ? Number(params.enabled) : undefined,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false };
          }
          return {
            data: res.data?.data ?? [],
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
        title={currentRow ? '编辑流量账号关联' : '新增流量账号关联'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!currentRow && (
            <>
              <Form.Item
                name="trafficPlatformAccountId"
                label="流量平台账号"
                rules={[{ required: true, message: '请选择流量平台账号' }]}
              >
                <Select
                  options={accountOptions}
                  placeholder="选择账号"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item
                name="platformCode"
                label="平台编码"
                rules={[{ required: true, message: '请输入平台编码' }]}
              >
                <Input placeholder="如 kkoip" />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="bindType"
            label="绑定类型"
            rules={[{ required: true, message: '请选择绑定类型' }]}
          >
            <Select
              options={[
                { label: '整个账号', value: 'account' },
                { label: '子账号', value: 'sub_account' },
              ]}
            />
          </Form.Item>
          <Form.Item name="externalUid" label="子账号ID">
            <Input placeholder="绑定整个账号时留空" />
          </Form.Item>
          <Form.Item name="externalUsername" label="子账号名">
            <Input placeholder="绑定整个账号时留空" />
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

export default TrafficAccountsTab;
