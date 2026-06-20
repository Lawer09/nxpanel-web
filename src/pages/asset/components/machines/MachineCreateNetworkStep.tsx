import { Alert, Form, Input, InputNumber, Space, Switch } from 'antd';
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

const MachineCreateNetworkStep: React.FC<Props> = ({ catalog, zoneReady }) => {
  const form = Form.useFormInstance();
  const ipMode = Form.useWatch(['ip_assignment', 'mode'], form) as
    | string
    | undefined;

  const vpcOptions = catalog.getFieldOptions('network.vpc_id');
  const subnetOptions = catalog.getFieldOptions('network.subnet_id');
  const securityGroupOptions = catalog.getFieldOptions(
    'network.security_group_id',
  );
  const ipModeOptions = catalog.getFieldOptions('ip_assignment.mode');
  const ipOptions = catalog.getFieldOptions('ip_assignment.ip_ids');
  const ipExistingMode =
    ipMode === 'provider_existing' || ipMode === 'self_owned';

  return (
    <>
      {!zoneReady ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select zone before editing network"
          description="Network, subnet, and security group candidates are loaded after the zone is selected."
        />
      ) : null}

      <MachineCreateSection
        title="Network"
        description="VPC is used for selection and record keeping. The actual create request depends on `network.subnet_id`."
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="VPC is not the final create key"
          description="For Zenlayer and the current generic API, `network.subnet_id` is the actual create field. `network.vpc_id` is still shown to narrow subnet choices and record network context."
        />
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name={['network', 'vpc_id']} label="VPC" style={{ flex: 1 }}>
            <MachineCreateCatalogSelect
              options={vpcOptions}
              loading={catalog.loadingByCategory['network-options']}
              disabled={!zoneReady}
              placeholder="Select VPC"
            />
          </Form.Item>
          <Form.Item
            name={['network', 'subnet_id']}
            label="Subnet"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select subnet.' }]}
          >
            <MachineCreateCatalogSelect
              options={subnetOptions}
              loading={catalog.loadingByCategory['network-options']}
              disabled={!zoneReady}
              placeholder="Select subnet"
            />
          </Form.Item>
        </Space>
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['network', 'security_group_id']}
            label="Security Group"
            style={{ flex: 1 }}
          >
            <MachineCreateCatalogSelect
              options={securityGroupOptions}
              loading={catalog.loadingByCategory['network-options']}
              disabled={!zoneReady}
              placeholder="Select security group"
            />
          </Form.Item>
          <Form.Item
            name={['network', 'nic_network_type']}
            label="NIC Network Type"
            style={{ width: 220 }}
          >
            <Input disabled={!zoneReady} />
          </Form.Item>
          <Form.Item
            name={['network', 'lan_ip']}
            label="LAN IP"
            style={{ width: 220 }}
          >
            <Input disabled={!zoneReady} />
          </Form.Item>
        </Space>
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['network', 'resource_group_id']}
            label="Resource Group ID"
            style={{ flex: 1 }}
          >
            <Input disabled={!zoneReady} />
          </Form.Item>
          <Form.Item
            name={['network', 'enable_agent']}
            label="Enable Agent"
            valuePropName="checked"
            style={{ width: 160 }}
          >
            <Switch disabled={!zoneReady} />
          </Form.Item>
          <Form.Item
            name={['network', 'enable_ip_forward']}
            label="Enable IP Forward"
            valuePropName="checked"
            style={{ width: 180 }}
          >
            <Switch disabled={!zoneReady} />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="IP Assignment"
        description="The mode controls whether the provider auto-allocates a public IP or whether existing local IP records are bound after create."
      >
        <Form.Item
          name={['ip_assignment', 'mode']}
          label="IP Assignment Mode"
        >
          <MachineCreateCatalogSelect
            options={ipModeOptions}
            loading={catalog.loadingByCategory['ip-options']}
            disabled={!catalog.available}
            placeholder="Select IP assignment mode"
          />
        </Form.Item>

        {ipExistingMode ? (
          <Form.Item
            name={['ip_assignment', 'ip_ids']}
            label="Existing IPs"
            rules={[
              {
                validator: async (_, value) => {
                  const count = form.getFieldValue('count') || 1;
                  const nextValue = Array.isArray(value) ? value : [];

                  if (nextValue.length === 0) {
                    throw new Error('Please select at least one IP.');
                  }

                  if (count > 1 && nextValue.length !== count) {
                    throw new Error(
                      `When count is ${count}, selected IP count must also be ${count}.`,
                    );
                  }
                },
              },
            ]}
          >
            <MachineCreateCatalogSelect
              mode="multiple"
              options={ipOptions}
              loading={catalog.loadingByCategory['ip-options']}
              disabled={!catalog.available}
              placeholder="Select IPs"
            />
          </Form.Item>
        ) : (
          <>
            <Space size={16} align="start" style={{ width: '100%' }}>
              <Form.Item
                name={['ip_assignment', 'quantity']}
                label="IP Quantity"
                style={{ width: 180 }}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name={['ip_assignment', 'bandwidth_mbps']}
                label="Bandwidth (Mbps)"
                style={{ width: 220 }}
              >
                <InputNumber min={0} precision={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                name={['ip_assignment', 'internet_charge_type']}
                label="Internet Charge Type"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['ip_assignment', 'traffic_package_size']}
                label="Traffic Package Size"
                style={{ width: 220 }}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Space size={16} align="start" style={{ width: '100%' }}>
              <Form.Item
                name={['ip_assignment', 'eip_bind_type']}
                label="EIP Bind Type"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['ip_assignment', 'eip_v4_type']}
                label="EIP IPv4 Type"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['ip_assignment', 'cluster_id']}
                label="Cluster ID"
                style={{ flex: 1 }}
              >
                <Input />
              </Form.Item>
            </Space>
          </>
        )}
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateNetworkStep;
