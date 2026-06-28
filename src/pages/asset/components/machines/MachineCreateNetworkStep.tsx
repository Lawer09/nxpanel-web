import { Alert, Form, Input, InputNumber, Space } from 'antd';
import React from 'react';
import AssetTagEditor from '../AssetTagEditor';
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
  const vpcField = catalog.getFieldStatus('vpc.vpc_id');
  const vswitchField = catalog.getFieldStatus('vpc.vswitch_id');
  const chargeTypeField = catalog.getFieldStatus('internet.charge_type');
  const bandwidthField = catalog.getFieldStatus('internet.bandwidth_mbps');
  const trafficPackageField = catalog.getFieldStatus(
    'internet.traffic_package_size',
  );
  const eipTypeField = catalog.getFieldStatus('internet.eip_v4_type');
  const showVswitch =
    !!vswitchField.group ||
    vswitchField.options.length > 0 ||
    vswitchField.loading;

  return (
    <>
      {!zoneReady ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Select zone before editing VPC and internet settings"
          description="VPC, VSwitch and internet option catalogs are loaded after the zone is selected."
        />
      ) : null}

      <MachineCreateSection
        title="VPC"
        description="The new contract submits a VPC object. `vpc_id` is always part of the request, while `vswitch_id` only appears for providers such as Alibaba Cloud ECS."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['vpc', 'vpc_id']}
            label="VPC"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Please select VPC.' }]}
          >
            <MachineCreateCatalogSelect
              options={vpcField.options}
              loading={vpcField.loading}
              disabled={vpcField.disabled}
              placeholder={vpcField.placeholder}
              notFoundContent={vpcField.emptyText}
            />
          </Form.Item>
          {showVswitch ? (
            <Form.Item
              name={['vpc', 'vswitch_id']}
              label="VSwitch"
              style={{ flex: 1 }}
              rules={
                vswitchField.options.length
                  ? [{ required: true, message: 'Please select VSwitch.' }]
                  : undefined
              }
            >
              <MachineCreateCatalogSelect
                options={vswitchField.options}
                loading={vswitchField.loading}
                disabled={vswitchField.disabled}
                placeholder={vswitchField.placeholder}
                notFoundContent={vswitchField.emptyText}
              />
            </Form.Item>
          ) : null}
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['vpc', 'cidr_block_v4']}
            label="IPv4 CIDR"
            style={{ flex: 1 }}
          >
            <Input placeholder="10.0.0.0/8" disabled={!zoneReady} />
          </Form.Item>
          <Form.Item
            name={['vpc', 'cidr_block_v6']}
            label="IPv6 CIDR"
            style={{ flex: 1 }}
          >
            <Input
              placeholder="Optional local snapshot"
              disabled={!zoneReady}
            />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="Internet"
        description="Internet settings are now provider-neutral fields under `internet.*`. The top-level compatibility field `bandwidth_mbps` is filled from `internet.bandwidth_mbps`."
      >
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['internet', 'charge_type']}
            label="Charge Type"
            style={{ flex: 1 }}
          >
            {chargeTypeField.options.length ? (
              <MachineCreateCatalogSelect
                options={chargeTypeField.options}
                loading={chargeTypeField.loading}
                disabled={chargeTypeField.disabled}
                placeholder={chargeTypeField.placeholder}
                notFoundContent={chargeTypeField.emptyText}
              />
            ) : (
              <Input placeholder="ByTrafficPackage" disabled={!zoneReady} />
            )}
          </Form.Item>
          <Form.Item
            name={['internet', 'bandwidth_mbps']}
            label="Bandwidth (Mbps)"
            style={{ width: 220 }}
            rules={[{ required: true, message: 'Please provide bandwidth.' }]}
          >
            {bandwidthField.options.length ? (
              <MachineCreateCatalogSelect
                options={bandwidthField.options}
                loading={bandwidthField.loading}
                disabled={bandwidthField.disabled}
                placeholder={bandwidthField.placeholder}
                notFoundContent={bandwidthField.emptyText}
              />
            ) : (
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
                disabled={!zoneReady}
              />
            )}
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item
            name={['internet', 'traffic_package_size']}
            label="Traffic Package Size"
            style={{ flex: 1 }}
          >
            {trafficPackageField.options.length ? (
              <MachineCreateCatalogSelect
                options={trafficPackageField.options}
                loading={trafficPackageField.loading}
                disabled={trafficPackageField.disabled}
                placeholder={trafficPackageField.placeholder}
                notFoundContent={trafficPackageField.emptyText}
              />
            ) : (
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            )}
          </Form.Item>
          <Form.Item
            name={['internet', 'eip_v4_type']}
            label="IPv4 EIP Type"
            style={{ flex: 1 }}
          >
            {eipTypeField.options.length ? (
              <MachineCreateCatalogSelect
                options={eipTypeField.options}
                loading={eipTypeField.loading}
                disabled={eipTypeField.disabled}
                placeholder={eipTypeField.placeholder}
                notFoundContent={eipTypeField.emptyText}
              />
            ) : (
              <Input placeholder="BGP" disabled={!zoneReady} />
            )}
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="Tags"
        description="Tags are stored on the local asset record and submitted in the provider-neutral tag array format."
      >
        <AssetTagEditor name="tags" />
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateNetworkStep;
