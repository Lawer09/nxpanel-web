import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Form, Input, Modal, Select, Switch, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAdSpendAccounts,
  getAdSpendAccountDetail,
  createAdSpendAccount,
  updateAdSpendAccount,
  toggleAdSpendAccountStatus,
  testAdSpendAccount,
} from '@/services/ad-spend-platform/api';

interface AccountsPageProps {
  embedded?: boolean;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ embedded = false }) => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.AdSpendAccountDetail | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [testLoading, setTestLoading] = useState<Record<number, boolean>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.AdSpendAccountDetail | undefined>();

  const handleOpenForm = async (record?: API.AdSpendAccountItem) => {
    if (record) {
      const res = await getAdSpendAccountDetail(record.id);
      if (res.code !== 0) {
        messageApi.error(res.msg || '获取详情失败');
        return;
      }
      setCurrentRow(res.data);
      form.setFieldsValue({
        ...res.data,
        password: '',
      });
    } else {
      setCurrentRow(undefined);
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (currentRow?.id) {
        const res = await updateAdSpendAccount(currentRow.id, values);
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createAdSpendAccount(values);
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

  const handleToggleStatus = async (record: API.AdSpendAccountItem) => {
    const newEnabled = record.enabled === 1 ? 0 : 1;
    setSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleAdSpendAccountStatus(record.id, newEnabled);
    setSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    messageApi.success(newEnabled === 1 ? '已启用' : '已禁用');
    actionRef.current?.reload();
  };

  const handleTest = async (record: API.AdSpendAccountItem) => {
    setTestLoading((s) => ({ ...s, [record.id]: true }));
    try {
      const res = await testAdSpendAccount(record.id);
      if (res.code === 0) {
        messageApi.success(res.data?.loginSuccess ? '登录成功' : '登录失败');
      } else {
        messageApi.error(res.msg || '测试失败');
      }
    } catch {
      messageApi.error('测试失败');
    }
    setTestLoading((s) => ({ ...s, [record.id]: false }));
  };

  const handleShowDetail = async (record: API.AdSpendAccountItem) => {
    const res = await getAdSpendAccountDetail(record.id);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取详情失败');
      return;
    }
    setDetailRow(res.data);
    setDetailOpen(true);
  };

  const columns: ProColumns<API.AdSpendAccountItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    {
      title: '账号名称',
      dataIndex: 'accountName',
      width: 140,
      search: false,
      render: (_, r) => <a onClick={() => handleShowDetail(r)}>{r.accountName}</a>,
    },
    { title: '平台编码', dataIndex: 'platformCode', width: 120, search: false },
    { title: 'Base URL', dataIndex: 'baseUrl', width: 200, search: false, ellipsis: true },
    { title: '用户名', dataIndex: 'username', width: 120, search: false },
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
    { title: '最后同步', dataIndex: 'lastSyncAt', width: 170, search: false },
    { title: '备注', dataIndex: 'remark', width: 160, search: false, ellipsis: true },
    {
      title: '搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '账号名称 / 用户名' },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        <a key="edit" onClick={() => handleOpenForm(record)}>编辑</a>,
        <a
          key="test"
          onClick={() => handleTest(record)}
          style={{ color: testLoading[record.id] ? '#999' : undefined }}
        >
          {testLoading[record.id] ? '测试中...' : '测试'}
        </a>,
      ],
    },
  ];

  const content = (
    <>
      <ProTable<API.AdSpendAccountItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getAdSpendAccounts({
            platformCode: params.platformCode as string | undefined,
            enabled: params.enabled !== undefined ? Number(params.enabled) : undefined,
            keyword: params.keyword as string | undefined,
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
            新增账号
          </Button>,
        ]}
        pagination={{ defaultPageSize: 20 }}
      />

      <Modal
        title={currentRow ? '编辑账号' : '新增账号'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!currentRow && (
            <Form.Item name="platformCode" label="平台编码" rules={[{ required: true, message: '请输入平台编码' }]}>
              <Input placeholder="adsmakeup" />
            </Form.Item>
          )}
          <Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}>
            <Input placeholder="AdsMakeup 主账号" />
          </Form.Item>
          <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true, message: '请输入 Base URL' }]}>
            <Input placeholder="http://console.adsmakeup.com" />
          </Form.Item>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="beilin" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: !currentRow, message: '请输入密码' }]}
            extra={currentRow ? '密码留空表示不修改' : undefined}
          >
            <Input.Password placeholder={currentRow ? '留空不修改' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" initialValue={1}>
            <Select options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="账号详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={520}
      >
        {detailRow && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailRow.id}</Descriptions.Item>
            <Descriptions.Item label="平台编码">{detailRow.platformCode}</Descriptions.Item>
            <Descriptions.Item label="账号名称">{detailRow.accountName}</Descriptions.Item>
            <Descriptions.Item label="Base URL">{detailRow.baseUrl}</Descriptions.Item>
            <Descriptions.Item label="用户名">{detailRow.username}</Descriptions.Item>
            <Descriptions.Item label="密码">{detailRow.passwordMasked}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailRow.enabled === 1 ? 'success' : 'default'}>
                {detailRow.enabled === 1 ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最后同步">{detailRow.lastSyncAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{detailRow.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );

  if (embedded) {
    return content;
  }

  return <PageContainer>{content}</PageContainer>;
};

export default AccountsPage;
