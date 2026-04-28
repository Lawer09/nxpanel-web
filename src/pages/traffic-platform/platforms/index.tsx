import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, InputNumber, Modal, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import {
  getTrafficPlatforms,
  createTrafficPlatform,
  updateTrafficPlatform,
  toggleTrafficPlatformStatus,
} from '@/services/traffic-platform/api';

const PlatformsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.TrafficPlatformItem | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});

  const handleOpenForm = (record?: API.TrafficPlatformItem) => {
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
        const res = await updateTrafficPlatform(currentRow.id, values);
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createTrafficPlatform(values);
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

  const handleToggleStatus = async (record: API.TrafficPlatformItem) => {
    const newEnabled = record.enabled === 1 ? 0 : 1;
    setSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleTrafficPlatformStatus(record.id, newEnabled);
    setSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    messageApi.success(newEnabled === 1 ? '已启用' : '已禁用');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.TrafficPlatformItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    { title: '平台编码', dataIndex: 'code', width: 120 },
    { title: '平台名称', dataIndex: 'name', width: 140 },
    { title: 'Base URL', dataIndex: 'baseUrl', width: 240, search: false, ellipsis: true },
    {
      title: '支持小时',
      dataIndex: 'supportsHourly',
      width: 90,
      search: false,
      render: (_, r) => (r.supportsHourly === 1 ? '是' : '否'),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 90,
      valueType: 'select',
      valueEnum: { 1: { text: '启用', status: 'Success' }, 0: { text: '禁用', status: 'Default' } },
      render: (_, record) => (
        <Switch
          checked={record.enabled === 1}
          loading={switchLoading[record.id]}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '备注', dataIndex: 'remark', width: 200, search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, search: false },
    {
      title: '搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '平台名称或编码' },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <a key="edit" onClick={() => handleOpenForm(record)}>
          编辑
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TrafficPlatformItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTrafficPlatforms({
            keyword: params.keyword as string | undefined,
            enabled: params.enabled !== undefined ? Number(params.enabled) : undefined,
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 20,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data ?? [],
            success: true,
            total: res.data?.total ?? 0,
          };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => handleOpenForm()}>
            新增平台
          </Button>,
        ]}
        pagination={{ defaultPageSize: 20 }}
      />

      <Modal
        title={currentRow ? '编辑平台' : '新增平台'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!currentRow && (
            <Form.Item name="code" label="平台编码" rules={[{ required: true, message: '请输入平台编码' }]}>
              <Input placeholder="如 kkoip" />
            </Form.Item>
          )}
          <Form.Item name="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}>
            <Input placeholder="如 KKOIP" />
          </Form.Item>
          <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true, message: '请输入 Base URL' }]}>
            <Input placeholder="https://www.kkoip.com" />
          </Form.Item>
          <Form.Item name="supportsHourly" label="支持小时粒度" initialValue={0}>
            <InputNumber min={0} max={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" initialValue={1}>
            <InputNumber min={0} max={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PlatformsPage;
