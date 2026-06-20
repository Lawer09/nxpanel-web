import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Switch,
} from 'antd';
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
  const billingTypeOptions = catalog.getFieldOptions('billing.type');
  const periodUnitOptions = catalog.getFieldOptions('billing.period_unit');
  const billingInternetOptions = catalog.getFieldOptions(
    'billing.internet_charge_type',
  );
  const systemDiskOptions = catalog.getFieldOptions(
    'storage.system_disk.category',
  );
  const dataDiskOptions = catalog.getFieldOptions('storage.data_disks.category');

  return (
    <>
      {!zoneReady ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select zone before editing storage"
          description="Billing options can load after account selection, while storage candidates are loaded after the zone is selected."
        />
      ) : null}

      <MachineCreateSection
        title="Billing"
        description="Use catalog values for billing type and period unit. Extra JSON is limited to the documented provider-neutral extension object."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['billing', 'type']}
            label="Billing Type"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select billing type.' }]}
          >
            <MachineCreateCatalogSelect
              options={billingTypeOptions}
              loading={catalog.loadingByCategory['billing-options']}
              disabled={!catalog.available}
              placeholder="Select billing type"
            />
          </Form.Item>
          <Form.Item
            name={['billing', 'period']}
            label="Billing Period"
            style={{ width: 180 }}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['billing', 'period_unit']}
            label="Period Unit"
            style={{ width: 200 }}
          >
            <MachineCreateCatalogSelect
              options={periodUnitOptions}
              loading={catalog.loadingByCategory['billing-options']}
              disabled={!catalog.available}
              placeholder="Select unit"
            />
          </Form.Item>
        </Space>
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['billing', 'internet_charge_type']}
            label="Internet Charge Type"
            style={{ flex: 1 }}
          >
            <MachineCreateCatalogSelect
              options={billingInternetOptions}
              loading={catalog.loadingByCategory['billing-options']}
              disabled={!catalog.available}
              placeholder="Select internet charge type"
            />
          </Form.Item>
          <Form.Item
            name={['billing', 'traffic_package_size']}
            label="Traffic Package Size"
            style={{ width: 220 }}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['billing', 'auto_renew']}
            label="Auto Renew"
            valuePropName="checked"
            style={{ width: 160 }}
          >
            <Switch />
          </Form.Item>
        </Space>
        <Form.Item name={['billing', 'extra_text']} label="Billing Extra JSON">
          <Input.TextArea
            rows={4}
            placeholder='{"provider_option": "..."}'
          />
        </Form.Item>
      </MachineCreateSection>

      <MachineCreateSection
        title="Storage"
        description="System disk is required. Data disks are optional and can be added as repeated blocks."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['storage', 'system_disk', 'category']}
            label="System Disk Category"
            style={{ flex: 1 }}
          >
            <MachineCreateCatalogSelect
              options={systemDiskOptions}
              loading={catalog.loadingByCategory['storage-options']}
              disabled={!zoneReady}
              placeholder="Select system disk category"
            />
          </Form.Item>
          <Form.Item
            name={['storage', 'system_disk', 'size_gb']}
            label="System Disk Size (GiB)"
            style={{ width: 220 }}
            rules={[
              { required: true, message: 'Please enter system disk size.' },
            ]}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: '100%' }}
              disabled={!zoneReady}
            />
          </Form.Item>
        </Space>
        <Form.Item
          name={['storage', 'system_disk', 'extra_text']}
          label="System Disk Extra JSON"
        >
          <Input.TextArea
            rows={4}
            disabled={!zoneReady}
            placeholder='{"provider_option": "..."}'
          />
        </Form.Item>

        <Form.List name={['storage', 'data_disks']}>
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <Space
                    align="center"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <strong>Data Disk #{index + 1}</strong>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    >
                      Remove
                    </Button>
                  </Space>
                  <Space size={16} align="start" style={{ width: '100%' }}>
                    <Form.Item
                      {...field}
                      name={[field.name, 'category']}
                      label="Disk Category"
                      style={{ flex: 1 }}
                    >
                      <MachineCreateCatalogSelect
                        options={dataDiskOptions}
                        loading={catalog.loadingByCategory['storage-options']}
                        disabled={!zoneReady}
                        placeholder="Select data disk category"
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'size_gb']}
                      label="Size (GiB)"
                      style={{ width: 220 }}
                      rules={[
                        { required: true, message: 'Please enter disk size.' },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: '100%' }}
                        disabled={!zoneReady}
                      />
                    </Form.Item>
                  </Space>
                  <Form.Item
                    {...field}
                    name={[field.name, 'extra_text']}
                    label="Disk Extra JSON"
                  >
                    <Input.TextArea
                      rows={3}
                      disabled={!zoneReady}
                      placeholder='{"provider_option": "..."}'
                    />
                  </Form.Item>
                </div>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({})}
                disabled={!zoneReady}
                block
              >
                Add Data Disk
              </Button>
            </Space>
          )}
        </Form.List>
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateBillingStep;
