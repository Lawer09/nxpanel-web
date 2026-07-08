import React, { useRef, useState } from 'react';
import { Button, Modal, Form, Input, Select, App, Space, Tag, InputNumber, Row, Col, Radio } from 'antd';
import { PlusOutlined, SearchOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { useDashboard } from '../DashboardContext';
import { createTrafficAllocation, getTrafficAccounts, toggleTrafficAccountStatus, updateTrafficAccount, createTrafficAccount, getTrafficAccountDetail, testTrafficAccount } from '@/services/traffic-platform/api';
import dayjs from 'dayjs';

const AccountManageModal: React.FC = () => {
  const { accountModalOpen, setAccountModalOpen, platformOptions, reloadKpi } = useDashboard();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [current, setCurrent] = useState<any>();
  const [form] = Form.useForm();
  const [allocationForm] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationAccount, setAllocationAccount] = useState<API.TrafficAccountItem | undefined>();

  const [keyword, setKeyword] = useState('');
  const [enabledStatus, setEnabledStatus] = useState<number | undefined>(undefined);
  const [filterPlatformCode, setFilterPlatformCode] = useState<string | undefined>(undefined);

  const columns: ProColumns<API.TrafficAccountItem>[] = [
    { title: '账号名称', dataIndex: 'accountName', width: 140 },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '外部账号ID', dataIndex: 'externalAccountId', width: 120 },
    { 
      title: '剩余流量', 
      dataIndex: 'balance', 
      width: 100,
      render: (_, r: any) => `${(Number(r.balance || 0) / 1024).toFixed(2)} GB`,
    },
    { title: '时区', dataIndex: 'timezone', width: 120 },
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
      width: 150,
      render: (_, r) => r.updatedAt ? dayjs(r.updatedAt).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, r) => [
        <a
          key="edit"
          style={{ color: '#2563EB' }}
          onClick={async () => {
            const detailRes = await getTrafficAccountDetail(r.id);
            if (detailRes.code !== 0) {
              message.error(detailRes.msg || '获取详情失败');
              return;
            }
            setCurrent(detailRes.data);
            const creds = Object.entries(detailRes.data.credentialMasked || {}).map(([key, val]) => ({ key, value: '' }));
            form.setFieldsValue({
              ...detailRes.data,
              credentials: creds.length ? creds : [{ key: '', value: '' }],
            });
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="test"
          style={{ color: '#06B6D4' }}
          onClick={async () => {
            const res = await testTrafficAccount(r.id);
            if (res.code !== 0) {
              message.error(res.msg || '测试失败');
              return;
            }
            const ov = res.data?.overview || res.data?.debug?.overview || res.data;
            Modal.success({
              title: '测试成功',
              content: (
                <div>
                  <div>余额: {ov?.balance ?? 0}</div>
                  <div>今日用量: {ov?.todayUse ?? ov?.today_use ?? 0}</div>
                  <div>本月用量: {ov?.monthUse ?? ov?.month_use ?? 0}</div>
                </div>
              ),
            });
          }}
        >
          测试连接
        </a>,
        <a
          key="allocate"
          style={{ color: '#7C3AED' }}
          onClick={() => {
            setAllocationAccount(r);
            allocationForm.resetFields();
            allocationForm.setFieldsValue({
              accountId: r.id,
              amountGb: 10,
            });
            setAllocationOpen(true);
          }}
        >
          流量分配
        </a>,
        <a
          key="toggle"
          style={{ color: r.enabled === 1 ? '#EF4444' : '#10B981' }}
          onClick={async () => {
            const res = await toggleTrafficAccountStatus(r.id, r.enabled === 1 ? 0 : 1);
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
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>账号管理</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 'normal' }}>
            管理各平台账号、外部账号 ID、剩余流量与凭证配置
          </div>
        </div>
      }
      width={1120}
      style={{ top: '8vh' }}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      open={accountModalOpen}
      onCancel={() => setAccountModalOpen(false)}
      footer={null}
      destroyOnHidden
    >
      <ProTable<API.TrafficAccountItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        options={false}
        params={{ keyword, enabled: enabledStatus, platformCode: filterPlatformCode }}
        headerTitle={
          <Space size={16} wrap>
            <Select 
              placeholder="全部平台"
              style={{ width: 140 }}
              options={platformOptions}
              value={filterPlatformCode}
              onChange={setFilterPlatformCode}
              allowClear
            />
            <Select 
              placeholder="全部状态"
              style={{ width: 120 }}
              options={[
                { label: '全部', value: undefined },
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
              value={enabledStatus}
              onChange={setEnabledStatus}
              allowClear
            />
            <Input 
              placeholder="搜索账号名称 / 外部账号ID" 
              prefix={<SearchOutlined />} 
              style={{ width: 260 }}
              allowClear
              onPressEnter={(e) => setKeyword((e.target as HTMLInputElement).value)}
              onBlur={(e) => setKeyword(e.target.value)}
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
              form.setFieldsValue({ 
                enabled: 1, 
                timezone: 'Asia/Shanghai', 
                balance: 0,
                credentials: [{ key: 'accessid', value: '' }, { key: 'secret', value: '' }]
              });
              setFormOpen(true);
            }}
          >
            新增账号
          </Button>,
        ]}
        request={async (params) => {
          const res = await getTrafficAccounts({ 
            platformCode: params.platformCode as string | undefined,
            enabled: params.enabled as number | undefined,
            keyword: params.keyword as string | undefined, 
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
        title={current ? '编辑账号' : '新增账号'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          setSubmitLoading(true);
          
          const credentialObj: Record<string, string> = {};
          (values.credentials || []).forEach((c: { key: string, value: string }) => {
            if (c.key && c.value) {
              credentialObj[c.key] = c.value;
            }
          });

          const payload: API.TrafficAccountCreateParams = {
            platformCode: values.platformCode,
            accountName: values.accountName,
            externalAccountId: values.externalAccountId,
            credential: credentialObj,
            timezone: values.timezone,
            enabled: values.enabled,
            remark: values.remark,
          };

          const res = current?.id
            ? await updateTrafficAccount(current.id, payload as API.TrafficAccountUpdateParams)
            : await createTrafficAccount(payload);
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
        width={720}
        destroyOnHidden
        okButtonProps={{ style: { backgroundColor: '#2563EB' } }}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto', paddingRight: '12px' } }}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="platformCode" label="所属平台" rules={[{ required: true, message: '请选择平台' }]}>
                <Select options={platformOptions} disabled={!!current} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="externalAccountId" label="外部账号ID" rules={[{ required: true, message: '请输入外部账号ID' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="balance" label="剩余流量 (MB)" rules={[{ required: true, message: '请输入剩余流量' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="timezone" label="时区" initialValue="Asia/Shanghai">
                <Select options={[{ label: 'Asia/Shanghai', value: 'Asia/Shanghai' }, { label: 'UTC', value: 'UTC' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enabled" label="状态" initialValue={1}>
                <Radio.Group>
                  <Radio value={1}>启用</Radio>
                  <Radio value={0}>停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>凭证配置</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>不同平台所需字段可能不同，请按平台要求填写</div>
            <Form.List name="credentials">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: 'Missing key' }]}
                      >
                        <Input placeholder="Key (如 apiKey)" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                      >
                        <Input.Password placeholder="Value (编辑时留空不修改)" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#EF4444' }} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加字段
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="流量分配"
        open={allocationOpen}
        onCancel={() => {
          setAllocationOpen(false);
          setAllocationAccount(undefined);
        }}
        onOk={async () => {
          const values = await allocationForm.validateFields();
          setAllocationLoading(true);
          try {
            const res = await createTrafficAllocation({
              accountId: Number(values.accountId),
              targetUserId: values.targetUserId,
              targetUsername: values.targetUsername,
              amountGb: Number(values.amountGb),
            });
            if (res.code !== 0) {
              message.error(res.msg || '流量分配失败');
              return;
            }

            const orderId = res.data?.response?.data?.order_id;
            message.success(orderId ? `流量分配成功，订单号 ${orderId}` : (res.msg || '流量分配成功'));
            setAllocationOpen(false);
            setAllocationAccount(undefined);
            allocationForm.resetFields();
            actionRef.current?.reload();
            reloadKpi();
          } finally {
            setAllocationLoading(false);
          }
        }}
        confirmLoading={allocationLoading}
        destroyOnHidden
        width={560}
        okText="确认分配"
        okButtonProps={{ style: { backgroundColor: '#7C3AED' } }}
      >
        <Form form={allocationForm} layout="vertical" preserve={false}>
          <Form.Item name="accountId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="流量账号">
            <Input
              value={allocationAccount ? `${allocationAccount.accountName} (${allocationAccount.platformCode})` : ''}
              disabled
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetUserId"
                label="目标用户 ID"
                rules={[{ required: true, message: '请输入目标用户 ID' }]}
              >
                <Input placeholder="例如 2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetUsername"
                label="目标用户名"
                rules={[{ required: true, message: '请输入目标用户名' }]}
              >
                <Input placeholder="例如 kookeey" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="amountGb"
            label="分配流量 (GB)"
            rules={[
              { required: true, message: '请输入分配流量' },
              {
                validator: async (_, value) => {
                  if (value === undefined || value === null || Number(value) <= 0) {
                    throw new Error('分配流量必须大于 0');
                  }
                },
              },
            ]}
          >
            <InputNumber min={0.01} precision={2} step={1} style={{ width: '100%' }} placeholder="例如 10" />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};

export default AccountManageModal;
