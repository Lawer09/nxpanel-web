import { Alert, Form, InputNumber, Space } from 'antd';
import React from 'react';
import {
  MachineCreateCatalogSelect,
  MachineCreateSection,
} from './MachineCreateShared';
import type { MachineCreateCatalogController } from './useMachineCreateCatalogs';

type Props = {
  catalog: MachineCreateCatalogController;
  zoneReady: boolean;
};

const MachineCreateBillingStep: React.FC<Props> = ({ catalog, zoneReady }) => {
  const billingModeField = catalog.getFieldStatus('billing.mode');
  const periodUnitField = catalog.getFieldStatus('billing.period_unit');

  return (
    <>
      {!zoneReady ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select zone before editing disk and billing"
          description="Billing mode loads from account scope. System disk size and most provider-side pricing context only make sense after the zone is fixed."
        />
      ) : null}

      <MachineCreateSection
        title="Billing"
        description="The new create contract uses `billing.mode`, `billing.period` and `billing.period_unit`."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['billing', 'mode']}
            label="Billing Mode"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select billing mode.' }]}
          >
            <MachineCreateCatalogSelect
              options={billingModeField.options}
              loading={billingModeField.loading}
              disabled={billingModeField.disabled}
              placeholder={billingModeField.placeholder}
              notFoundContent={billingModeField.emptyText}
            />
          </Form.Item>
          <Form.Item
            name={['billing', 'period']}
            label="Period"
            style={{ width: 160 }}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['billing', 'period_unit']}
            label="Period Unit"
            style={{ width: 220 }}
          >
            <MachineCreateCatalogSelect
              options={periodUnitField.options}
              loading={periodUnitField.loading}
              disabled={periodUnitField.disabled}
              placeholder={periodUnitField.placeholder}
              notFoundContent={periodUnitField.emptyText}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="Disk"
        description="The current public create contract only accepts `disk.system_size_gb`."
      >
        <Form.Item
          name={['disk', 'system_size_gb']}
          label="System Disk Size (GiB)"
          rules={[
            { required: true, message: 'Please enter system disk size.' },
          ]}
          extra="Provider-specific disk category and extra payload are no longer exposed in the new contract."
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: 240 }}
            disabled={!zoneReady}
          />
        </Form.Item>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBillingStep;
