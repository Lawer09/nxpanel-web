import React, { useRef, useState } from 'react';
import { Button, Modal, Form, Input, Select, App, Space, Tag, Radio } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { useDashboard } from '../DashboardContext';
import { getTrafficPlatforms, toggleTrafficPlatformStatus, updateTrafficPlatform, createTrafficPlatform } from '@/services/traffic-platform/api';
import dayjs from 'dayjs';

const PlatformManageModal: React.FC = () => {
  const { platformModalOpen, setPlatformModalOpen, reloadKpi } = useDashboard();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  
  const [formOpen, setFormOpen] = useState(false);
  const [current, setCurrent] = useState<any>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [enabledStatus, setEnabledStatus] = useState<number | undefined>(undefined);

  const columns: ProColumns<API.TrafficPlatformItem>[] = [
    { title: '平台名称', dataIndex: 'name', width: 140 },
    { title: '平台编码', dataIndex: 'code', width: 120 },
    { title: '基础地址', dataIndex: 'baseUrl', width: 260, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (_, r) => (
        r.enabled === 1 
          ? <Tag color="success" style={{ color: '#10B981', backgroundColor: '#ECFDF5', borderColor: '#ECFDF5' }}>启用</Tag> 
          : <Tag style={{ color: '#6B7280', backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' }}>停用</Tag>
      ),
    },
    { 
      title: '更新时间', 
      dataIndex: 'updatedAt', 
      width: 160,
      render: (_, r) => r.updatedAt ? dayjs(r.updatedAt).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, r) => [
        <a
          key="edit"
          style={{ color: '#2563EB' }}
          onClick={() => {
            setCurrent(r);
            form.setFieldsValue(r);
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="toggle"
          style={{ color: r.enabled === 1 ? '#EF4444' : '#10B981' }}
          onClick={async () => {
            const res = await toggleTrafficPlatformStatus(r.id, r.enabled === 1 ? 0 : 1);
            if (res.code !== 0) {
              message.error(res.msg || '操作失败');
              return;
            }
            actionRef.current?.reload();
            reloadKpi();
          }}
        >
          {r.enabled === 1 ? '禁用' : '启用'}
        </a>,
      ],
    },
  ];

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>平台管理</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 'normal' }}>
            管理已接入的流量平台配置，可新增、编辑或停用平台
          </div>
        </div>
      }
      width={960}
      style={{ top: '10vh' }}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      open={platformModalOpen}
      onCancel={() => setPlatformModalOpen(false)}
      footer={null}
      destroyOnHidden
    >
      <ProTable<API.TrafficPlatformItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        options={false}
        params={{ keyword, enabled: enabledStatus }}
        headerTitle={
          <Space size={16}>
            <Input 
              placeholder="搜索平台名称 / 平台编码" 
              prefix={<SearchOutlined />} 
              style={{ width: 260 }}
              allowClear
              onPressEnter={(e) => setKeyword((e.target as HTMLInputElement).value)}
              onBlur={(e) => setKeyword(e.target.value)}
            />
            <Select 
              placeholder="状态"
              style={{ width: 120 }}
              options={[
                { label: '全部', value: undefined },
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
              value={enabledStatus}
              onChange={setEnabledStatus}
            />
          </Space>
        }
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#2563EB' }}
            onClick={() => {
              setCurrent(undefined);
              form.resetFields();
              form.setFieldsValue({ enabled: 1 });
              setFormOpen(true);
            }}
          >
            新增平台
          </Button>,
        ]}
        request={async (params) => {
          const res = await getTrafficPlatforms({ 
            keyword: params.keyword as string | undefined, 
            enabled: params.enabled as number | undefined,
            page: params.current, 
            pageSize: params.pageSize 
          });
          const payload = res.data?.data || res.data || [];
          return { data: payload, total: res.data?.total ?? payload.length, success: true };
        }}
        pagination={{ 
          defaultPageSize: 10, 
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />

      <Modal
        title={current ? '编辑平台' : '新增平台'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          setSubmitLoading(true);
          const res = current?.id
            ? await updateTrafficPlatform(current.id, values)
            : await createTrafficPlatform(values);
          setSubmitLoading(false);
          if (res.code !== 0) {
            message.error(res.msg || '保存失败');
            return;
          }
          setFormOpen(false);
          actionRef.current?.reload();
          reloadKpi();
        }}
        confirmLoading={submitLoading}
        width={560}
        destroyOnHidden
        okButtonProps={{ style: { backgroundColor: '#2563EB' } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}>
            <Input placeholder="请输入平台名称" />
          </Form.Item>
          {!current && (
            <Form.Item 
              name="code" 
              label="平台编码" 
              rules={[
                { required: true, message: '请输入平台编码' },
                { pattern: /^[a-zA-Z0-9_-]+$/, message: '只允许英文、数字、下划线、中划线' }
              ]}
            >
              <Input placeholder="请输入平台编码" />
            </Form.Item>
          )}
          <Form.Item name="baseUrl" label="基础地址" rules={[{ required: true, message: '请输入基础地址', type: 'url' }]}>
            <Input placeholder="https://api.example.com" />
          </Form.Item>
          <Form.Item name="enabled" label="状态" initialValue={1}>
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default PlatformManageModal;
