import { Form, Input, InputNumber, Space, Tag } from 'antd';
import React from 'react';
import AssetTagEditor from '../AssetTagEditor';
import {
  MachineCreateCatalogSelect,
  MachineCreateHint,
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
        <MachineCreateHint message="网络配置还没解锁。VPC、VSwitch 和公网参数会在可用区确定后继续收敛。" />
      ) : null}

      <MachineCreateSection
        title="VPC"
        description="先绑定网络归属，再补充可选的网段快照。"
        extra={showVswitch ? <Tag color="gold">含 VSwitch</Tag> : null}
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['vpc', 'vpc_id']}
            label="VPC"
            style={{ flex: 1, minWidth: 240 }}
            rules={[{ required: true, message: '请选择 VPC。' }]}
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
              style={{ flex: 1, minWidth: 240 }}
              rules={
                vswitchField.options.length
                  ? [{ required: true, message: '请选择 VSwitch。' }]
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

        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['vpc', 'cidr_block_v4']}
            label="IPv4 网段"
            style={{ flex: 1, minWidth: 240 }}
          >
            <Input placeholder="10.0.0.0/8" disabled={!zoneReady} />
          </Form.Item>
          <Form.Item
            name={['vpc', 'cidr_block_v6']}
            label="IPv6 网段"
            style={{ flex: 1, minWidth: 240 }}
          >
            <Input placeholder="可选，本地快照字段" disabled={!zoneReady} />
          </Form.Item>
        </Space>
      </MachineCreateSection>

      <MachineCreateSection
        title="公网"
        description="公网参数尽量控制在一屏内，先填带宽，再补充可选项。"
      >
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['internet', 'charge_type']}
            label="计费类型"
            style={{ flex: 1, minWidth: 220 }}
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
            label="带宽（Mbps）"
            style={{ width: 200 }}
            rules={[{ required: true, message: '请填写带宽。' }]}
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

        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['internet', 'traffic_package_size']}
            label="流量包大小"
            style={{ flex: 1, minWidth: 220 }}
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
            label="IPv4 EIP 类型"
            style={{ flex: 1, minWidth: 220 }}
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
        title="资源标签"
        description="标签写入本地资产记录，建议只放检索和归类字段。"
      >
        <AssetTagEditor name="tags" />
      </MachineCreateSection>
    </>
  );
};

export default MachineCreateNetworkStep;
