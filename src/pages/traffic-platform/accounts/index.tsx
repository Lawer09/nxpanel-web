import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Form, Input, Modal, Select, Switch, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getTrafficAccounts,
  getTrafficAccountDetail,
  createTrafficAccount,
  updateTrafficAccount,
  toggleTrafficAccountStatus,
  testTrafficAccount,
  getTrafficPlatforms,
} from '@/services/traffic-platform/api';

const AccountsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.TrafficAccountDetail | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [testLoading, setTestLoading] = useState<Record<number, boolean>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.TrafficAccountDetail | undefined>();
  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setPlatformOptions(
          res.data.data.map((p) => ({ label: p.name, value: p.code })),
        );
      }
    });
  }, []);

  const handleOpenForm = async (record?: API.TrafficAccountItem) => {
    if (record) {
      const res = await getTrafficAccountDetail(record.id);
      if (res.code !== 0) {
        messageApi.error(res.msg || '获取详情失败');
        return;
      }
      setCurrentRow(res.data);
      form.setFieldsValue({
        ...res.data,
        credentialAccessid: res.data.credentialMasked?.accessid ?? '',
        credentialSecret: '',
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
      const credential = {
        accessid: values.credentialAccessid,
        secret: values.credentialSecret ?? '',
      };
      if (currentRow?.id) {
        const res = await updateTrafficAccount(currentRow.id, {
          accountName: values.accountName,
          externalAccountId: values.externalAccountId,
          credential,
          timezone: values.timezone,
          enabled: values.enabled,
          remark: values.remark,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createTrafficAccount({
          platformCode: values.platformCode,
          accountName: values.accountName,
          externalAccountId: values.externalAccountId,
          credential,
          timezone: values.timezone,
          enabled: values.enabled,
          remark: values.remark,
        });
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

  const handleToggleStatus = async (record: API.TrafficAccountItem) => {
    const newEnabled = record.enabled === 1 ? 0 : 1;
    setSwitchLoading((s) => ({ ...s, [record.id]: true }));
    const res = await toggleTrafficAccountStatus(record.id, newEnabled);
    setSwitchLoading((s) => ({ ...s, [record.id]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    messageApi.success(newEnabled === 1 ? '已启用' : '已禁用');
    actionRef.current?.reload();
  };

  const handleTest = async (record: API.TrafficAccountItem) => {
    setTestLoading((s) => ({ ...s, [record.id]: true }));
    try {
      const res = await testTrafficAccount(record.id);
      if (res.code === 0) {
        const d = res.data;
        const overview = d?.overview || d?.debug?.overview || d;
        const balance = overview?.balance ?? d?.balance ?? 0;
        const todayUse = overview?.todayUse ?? overview?.today_use ?? d?.todayUse ?? 0;
        const monthUse = overview?.monthUse ?? overview?.month_use ?? d?.monthUse ?? 0;
        Modal.success({
          title: '测试成功',
          content: (
            <div>
              <p>余额: {balance}</p>
              <p>今日用量: {todayUse}</p>
              <p>本月用量: {monthUse}</p>
            </div>
          ),
        });
      } else {
        messageApi.error(res.msg || '测试失败');
      }
    } catch {
      messageApi.error('测试失败');
    }
    setTestLoading((s) => ({ ...s, [record.id]: false }));
  };

  const handleShowDetail = async (record: API.TrafficAccountItem) => {
    const res = await getTrafficAccountDetail(record.id);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取详情失败');
      return;
    }
    setDetailRow(res.data);
    setDetailOpen(true);
  };

  const columns: ProColumns<API.TrafficAccountItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    {
      title: '账号名称',
      dataIndex: 'accountName',
      width: 140,
      search: false,
      render: (_, r) => <a onClick={() => handleShowDetail(r)}>{r.accountName}</a>,
    },
    { title: '平台', dataIndex: 'platformName', width: 100, search: false },
    {
      title: '平台编码',
      dataIndex: 'platformCode',
      width: 110,
      valueType: 'select',
      fieldProps: { options: platformOptions, allowClear: true },
    },
    { title: '三方账号ID', dataIndex: 'externalAccountId', width: 120, search: false },
    { title: '时区', dataIndex: 'timezone', width: 140, search: false },
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
      fieldProps: { placeholder: '账号名称 / 三方账号ID' },
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

  return (
    <PageContainer>
      <ProTable<API.TrafficAccountItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTrafficAccounts({
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
            <Form.Item name="platformCode" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
              <Select options={platformOptions} placeholder="选择平台" />
            </Form.Item>
          )}
          <Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}>
            <Input placeholder="如 kkoip-main" />
          </Form.Item>
          <Form.Item name="externalAccountId" label="三方账号ID" rules={[{ required: true, message: '请输入三方账号ID' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="credentialAccessid" label="Access ID" rules={[{ required: !currentRow, message: '请输入 Access ID' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="credentialSecret"
            label="Secret"
            rules={[{ required: !currentRow, message: '请输入 Secret' }]}
            extra={currentRow ? 'Secret 留空表示不修改' : undefined}
          >
            <Input.Password placeholder={currentRow ? '留空不修改' : '请输入 Secret'} />
          </Form.Item>
          <Form.Item name="timezone" label="时区" initialValue="Asia/Shanghai">
            <Input placeholder="Asia/Shanghai" />
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
        width={500}
      >
        {detailRow && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailRow.id}</Descriptions.Item>
            <Descriptions.Item label="平台">{detailRow.platformName} ({detailRow.platformCode})</Descriptions.Item>
            <Descriptions.Item label="账号名称">{detailRow.accountName}</Descriptions.Item>
            <Descriptions.Item label="三方账号ID">{detailRow.externalAccountId}</Descriptions.Item>
            <Descriptions.Item label="凭据">
              {detailRow.credentialMasked
                ? Object.entries(detailRow.credentialMasked).map(([k, v]) => (
                    <Tag key={k}>{k}: {String(v)}</Tag>
                  ))
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="时区">{detailRow.timezone}</Descriptions.Item>
            <Descriptions.Item label="状态">{detailRow.enabled === 1 ? '启用' : '禁用'}</Descriptions.Item>
            <Descriptions.Item label="最后同步">{detailRow.lastSyncAt || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注">{detailRow.remark || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default AccountsPage;
