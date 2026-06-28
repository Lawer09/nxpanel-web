import { Form, Input, Select, Space, Tag } from 'antd';
import React from 'react';
import {
  MachineCreateCatalogSelect,
  MachineCreateHint,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  catalog: MachineCreateCatalogController;
};

const AUTH_TYPE_OPTIONS = [
  { label: '供应商 SSH 密钥', value: 'provider_key' },
  { label: '密码', value: 'password' },
];

const MachineCreateAccessStep: React.FC<Props> = ({ catalog }) => {
  const form = Form.useFormInstance();
  const authType = Form.useWatch(['login', 'auth_type'], form) as
    | 'provider_key'
    | 'password'
    | undefined;
  const sshKeyField = catalog.getFieldStatus('login.provider_key_id');
  const timezoneField = catalog.getFieldStatus('time_zone');

  return (
    <>
      <MachineCreateHint message="敏感字段不会进入预览 JSON。密码只会在最终提交时进入请求体。" />

      <MachineCreateSection
        title="登录方式"
        description="优先选择能长期稳定复用的登录方式，避免后续注入失败。"
        extra={
          authType ? (
            <Tag color={authType === 'provider_key' ? 'blue' : 'orange'}>
              {authType === 'provider_key' ? 'SSH 密钥' : '密码'}
            </Tag>
          ) : null
        }
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['login', 'auth_type']}
            label="认证方式"
            style={{ width: 220 }}
            rules={[{ required: true, message: '请选择认证方式。' }]}
          >
            <Select options={AUTH_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name={['login', 'username']}
            label="用户名"
            style={{ flex: 1, minWidth: 240 }}
            rules={[
              ({ getFieldValue }) => ({
                validator: async (_, value) => {
                  const nextAuthType = getFieldValue(['login', 'auth_type']);
                  if (
                    nextAuthType === 'password' &&
                    !String(value || '').trim()
                  ) {
                    throw new Error('请输入用户名。');
                  }
                },
              }),
            ]}
            extra={authType === 'provider_key' ? '通常使用 root。' : undefined}
          >
            <Input placeholder="root" />
          </Form.Item>
        </Space>

        {authType === 'provider_key' ? (
          <Form.Item
            name={['login', 'provider_key_id']}
            label="供应商 SSH 密钥"
            rules={[
              { required: true, message: '请选择供应商 SSH 密钥。' },
            ]}
          >
            <MachineCreateCatalogSelect
              options={sshKeyField.options}
              loading={sshKeyField.loading}
              disabled={sshKeyField.disabled}
              placeholder={sshKeyField.placeholder}
              notFoundContent={sshKeyField.emptyText}
            />
          </Form.Item>
        ) : null}

        {authType === 'password' ? (
          <Form.Item
            name={['login', 'password']}
            label="密码"
            rules={[{ required: true, message: '请输入密码。' }]}
          >
            <Input.Password placeholder="敏感字段" />
          </Form.Item>
        ) : null}
      </MachineCreateSection>

      <MachineCreateSection
        title="时区与元数据"
        description="时区参与创建请求，metadata 只用于本地资产标注。"
      >
        <Form.Item
          name="time_zone"
          label="时区"
          rules={[{ required: true, message: '请选择时区。' }]}
        >
          <MachineCreateCatalogSelect
            options={timezoneField.options}
            loading={timezoneField.loading}
            disabled={timezoneField.disabled}
            placeholder={timezoneField.placeholder}
            notFoundContent={timezoneField.emptyText}
          />
        </Form.Item>
        <Form.Item
          name="metadata_text"
          label="Metadata JSON"
          extra="只写归属、用途、备注，不要写凭证、密码或供应商敏感信息。"
        >
          <Input.TextArea rows={5} placeholder='{"owner":"ops"}' />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateAccessStep;
