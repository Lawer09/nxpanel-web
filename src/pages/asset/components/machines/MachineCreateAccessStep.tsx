import { Alert, Form, Input, Space } from 'antd';
import React from 'react';
import {
  MachineCreateCatalogSelect,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  catalog: MachineCreateCatalogController;
};

const MachineCreateAccessStep: React.FC<Props> = ({ catalog }) => {
  const sshKeyField = catalog.getFieldStatus('ssh_key.provider_key_id');
  const timezoneField = catalog.getFieldStatus('time_zone');

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Credential fields follow backend capability checks"
        description="The form exposes both provider SSH key and password inputs. Whether they can be combined is decided by the provider adapter and backend validation."
      />

      <MachineCreateSection
        title="Login"
        description="Select a provider SSH key or specify a password when supported."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['ssh_key', 'provider_key_id']}
            label="Provider SSH Key"
            style={{ flex: 1 }}
          >
            <MachineCreateCatalogSelect
              options={sshKeyField.options}
              loading={sshKeyField.loading}
              disabled={sshKeyField.disabled}
              placeholder={sshKeyField.placeholder}
              notFoundContent={sshKeyField.emptyText}
            />
          </Form.Item>
          <Form.Item
            name={['ssh_key', 'password']}
            label="Password"
            style={{ flex: 1 }}
          >
            <Input.Password placeholder="Sensitive field" />
          </Form.Item>
        </Space>
        <Form.Item
          name="time_zone"
          label="Time Zone"
          extra="Loaded from the provider account scope. Region and zone are not required for this catalog."
        >
          <MachineCreateCatalogSelect
            options={timezoneField.options}
            loading={timezoneField.loading}
            disabled={timezoneField.disabled}
            placeholder={timezoneField.placeholder}
            notFoundContent={timezoneField.emptyText}
          />
        </Form.Item>
      </MachineCreateSection>

      <MachineCreateSection
        title="Initialization"
        description="The init command template is rendered by the backend. Only `{index}` and `{id}` are supported."
      >
        <Form.Item name="init_command_template" label="Init Command Template">
          <Input.TextArea
            rows={6}
            placeholder="hostnamectl set-hostname edge-{index}"
          />
        </Form.Item>
        <Form.Item
          name="metadata_text"
          label="Metadata JSON"
          extra="Local metadata only. This is not provider passthrough."
        >
          <Input.TextArea rows={6} placeholder='{"owner": "ops"}' />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateAccessStep;
