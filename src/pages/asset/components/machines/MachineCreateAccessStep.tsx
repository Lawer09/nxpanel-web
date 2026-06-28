import { Alert, Form, Input, Select, Space } from 'antd';
import React from 'react';
import {
  MachineCreateCatalogSelect,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  catalog: MachineCreateCatalogController;
};

const AUTH_TYPE_OPTIONS = [
  { label: 'Provider SSH Key', value: 'provider_key' },
  { label: 'Password', value: 'password' },
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
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Sensitive login fields stay out of public previews"
        description="`login.password` is only sent in the final request body and is not written into preview JSON or retry source snapshots."
      />

      <MachineCreateSection
        title="Login"
        description="Use the new `login` object. `provider_key` and `password` follow backend validation and provider capability checks."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['login', 'auth_type']}
            label="Auth Type"
            style={{ width: 220 }}
            rules={[{ required: true, message: 'Please select auth type.' }]}
          >
            <Select options={AUTH_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name={['login', 'username']}
            label="Username"
            style={{ flex: 1 }}
            rules={[
              ({ getFieldValue }) => ({
                validator: async (_, value) => {
                  const nextAuthType = getFieldValue(['login', 'auth_type']);
                  if (
                    nextAuthType === 'password' &&
                    !String(value || '').trim()
                  ) {
                    throw new Error('Please enter username.');
                  }
                },
              }),
            ]}
            extra={
              authType === 'provider_key'
                ? 'Optional display username. `root` is commonly used.'
                : undefined
            }
          >
            <Input placeholder={authType === 'password' ? 'root' : 'root'} />
          </Form.Item>
        </Space>

        {authType === 'provider_key' ? (
          <Form.Item
            name={['login', 'provider_key_id']}
            label="Provider SSH Key"
            rules={[
              { required: true, message: 'Please select provider SSH key.' },
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
            label="Password"
            rules={[{ required: true, message: 'Please enter password.' }]}
          >
            <Input.Password placeholder="Sensitive field" />
          </Form.Item>
        ) : null}
      </MachineCreateSection>

      <MachineCreateSection
        title="Time Zone And Metadata"
        description="`time_zone` is part of the public create contract. Metadata stays local to the asset record."
      >
        <Form.Item
          name="time_zone"
          label="Time Zone"
          rules={[{ required: true, message: 'Please select time zone.' }]}
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
          extra="Local display metadata only. Do not place credentials, passwords or provider secrets here."
        >
          <Input.TextArea rows={6} placeholder='{"owner":"ops"}' />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateAccessStep;
