import {
  Alert,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
} from 'antd';
import React from 'react';
import type { MachineCreateWizardMode } from '../../types';
import {
  MachineCreateCatalogSelect,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  mode: MachineCreateWizardMode;
  accounts: API.AssetProviderAccount[];
  catalog: MachineCreateCatalogController;
  retrying?: API.AssetMachine | null;
};

const MachineCreateBasicStep: React.FC<Props> = ({
  mode,
  accounts,
  catalog,
  retrying,
}) => {
  const form = Form.useFormInstance();
  const watchedCountryCode = Form.useWatch(['zone', 'country_code'], form) as
    | string
    | undefined;
  const watchedZoneId = Form.useWatch(['zone', 'zone_id'], form) as
    | string
    | undefined;
  const zoneField = catalog.getFieldStatus('zone.zone_id');
  const instanceTypeField = catalog.getFieldStatus('spec.type');
  const imageField = catalog.getFieldStatus('os.image_id');
  const accountLocked = mode === 'retry';

  return (
    <>
      {mode === 'retry' && retrying ? (
        <Descriptions
          bordered
          column={2}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="Machine">
            {retrying.name || retrying.machine_id || `#${retrying.id}`}
          </Descriptions.Item>
          <Descriptions.Item label="Account">
            {retrying.account_name || retrying.account_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Last Error" span={2}>
            {retrying.last_error_summary || '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : null}

      {!catalog.available ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select provider account first"
          description="Zone, billing, SSH key and time zone candidates are loaded after the provider account is selected."
        />
      ) : null}

      {catalog.available && !watchedZoneId ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select zone to continue"
          description="Instance type, image, VPC and internet candidates are requested after the zone is selected."
        />
      ) : null}

      <MachineCreateSection
        title="Placement"
        description="Create now follows the latest public contract: account, machine name, zone object, spec and OS are submitted as structured objects."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name="account_id"
            label="Provider Account"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Please select provider account.' },
            ]}
          >
            <Select
              showSearch
              disabled={accountLocked}
              optionFilterProp="label"
              options={accounts.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Machine Name"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please enter machine name.' }]}
            extra="Batch create appends a numeric suffix on the backend."
          >
            <Input placeholder="na-edge" />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['zone', 'country_code']}
            label="Country Code"
            style={{ width: 180 }}
            rules={[{ required: true, message: 'Please enter country code.' }]}
          >
            <Input placeholder="US" maxLength={8} />
          </Form.Item>
          <Form.Item
            name={['zone', 'city']}
            label="City"
            style={{ flex: 1 }}
            extra="Optional provider filter. Zenlayer can stay empty."
          >
            <Input placeholder="Los Angeles" />
          </Form.Item>
          <Form.Item
            name={['zone', 'zone_id']}
            label="Zone"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select zone.' }]}
          >
            <MachineCreateCatalogSelect
              options={zoneField.options}
              disabled={zoneField.disabled}
              loading={zoneField.loading}
              placeholder={zoneField.placeholder}
              notFoundContent={zoneField.emptyText}
            />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['spec', 'type']}
            label="Instance Type"
            style={{ flex: 1 }}
            rules={[
              { required: true, message: 'Please select instance type.' },
            ]}
          >
            <MachineCreateCatalogSelect
              options={instanceTypeField.options}
              disabled={instanceTypeField.disabled}
              loading={instanceTypeField.loading}
              placeholder={instanceTypeField.placeholder}
              notFoundContent={instanceTypeField.emptyText}
            />
          </Form.Item>
          <Form.Item
            name={['os', 'image_id']}
            label="OS Image"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select image.' }]}
          >
            <MachineCreateCatalogSelect
              options={imageField.options}
              disabled={imageField.disabled}
              loading={imageField.loading}
              placeholder={imageField.placeholder}
              notFoundContent={imageField.emptyText}
            />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['spec', 'cpu_cores']}
            label="CPU Cores"
            style={{ width: 180 }}
            extra="Optional local snapshot"
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['spec', 'memory_mb']}
            label="Memory (MiB)"
            style={{ width: 220 }}
            extra="Optional local snapshot"
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['os', 'name']}
            label="OS Name"
            style={{ flex: 1 }}
            extra="Optional local snapshot"
          >
            <Input placeholder="AlmaLinux" />
          </Form.Item>
          <Form.Item
            name={['os', 'version']}
            label="OS Version"
            style={{ width: 200 }}
            extra="Optional local snapshot"
          >
            <Input placeholder="10.1" />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="Request Control"
        description="Only `count` and `client_request_id` remain as create-level controls. Retry mode keeps the current machine scope."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name="count" label="Count" style={{ width: 180 }}>
            <InputNumber
              min={1}
              max={100}
              precision={0}
              style={{ width: '100%' }}
              disabled={mode === 'retry'}
            />
          </Form.Item>
          <Form.Item
            name="client_request_id"
            label="Client Request ID"
            style={{ flex: 1 }}
            extra={
              watchedCountryCode
                ? `Current country filter: ${watchedCountryCode.toUpperCase()}`
                : undefined
            }
          >
            <Input
              placeholder="create-na-edge-001"
              disabled={mode === 'retry'}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBasicStep;
