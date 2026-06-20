import { Alert, Descriptions, Form, Input, InputNumber, Select, Space } from 'antd';
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
  const regionOptions = catalog.getFieldOptions('region');
  const zoneOptions = catalog.getFieldOptions('zone');
  const instanceTypeOptions = catalog.getFieldOptions('instance_type');
  const imageOptions = catalog.getFieldOptions('image_id');
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
          description="The remaining fields are enabled after the account is selected."
        />
      ) : null}

      <MachineCreateSection
        title="Placement"
        description="Choose the provider account, region, zone, instance type, and image. All selectable values are driven by the machine-create catalog."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name="account_id"
            label="Provider Account"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select provider account.' }]}
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
            name="region"
            label="Region"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select region.' }]}
          >
            <MachineCreateCatalogSelect
              options={regionOptions}
              disabled={!catalog.available}
              loading={catalog.loadingByCategory.regions}
              placeholder="Select region"
            />
          </Form.Item>
        </Space>
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name="zone"
            label="Zone"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select zone.' }]}
          >
            <MachineCreateCatalogSelect
              options={zoneOptions}
              disabled={!catalog.available}
              loading={catalog.loadingByCategory.zones}
              placeholder="Select zone"
            />
          </Form.Item>
          <Form.Item
            name="instance_type"
            label="Instance Type"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select instance type.' }]}
          >
            <MachineCreateCatalogSelect
              options={instanceTypeOptions}
              disabled={!catalog.available}
              loading={catalog.loadingByCategory['instance-types']}
              placeholder="Select instance type"
            />
          </Form.Item>
        </Space>
        <Form.Item
          name="image_id"
          label="Image"
          rules={[{ required: true, message: 'Please select image.' }]}
        >
          <MachineCreateCatalogSelect
            options={imageOptions}
            disabled={!catalog.available}
            loading={catalog.loadingByCategory.images}
            placeholder="Select image"
          />
        </Form.Item>
      </MachineCreateSection>

      <MachineCreateSection
        title="Templates"
        description="Templates are optional. `{index}` and `{id}` are the only supported variables."
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
          >
            <Input placeholder="Idempotency key" disabled={mode === 'retry'} />
          </Form.Item>
        </Space>
        <Form.Item
          name="machine_id_template"
          label="Machine ID Template"
          extra="Inherited on retry; not resubmitted in retry requests."
        >
          <Input
            placeholder="edge-{index}"
            disabled={mode === 'retry'}
          />
        </Form.Item>
        <Form.Item name="name_template" label="Name Template">
          <Input placeholder="edge-{index}" />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBasicStep;
