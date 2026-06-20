import { Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import React from 'react';
import { MACHINE_STATUS_OPTIONS } from '../../constants';

const { Text } = Typography;
const { TextArea } = Input;

export const MachineManualBaseFields: React.FC<{
  editing?: API.AssetMachine | null;
}> = ({ editing }) => (
  <>
    {!editing ? (
      <Form.Item
        name="machine_id"
        label="Machine ID"
        rules={[{ required: true, message: 'Please enter machine id.' }]}
      >
        <Input />
      </Form.Item>
    ) : null}
    <Form.Item
      name="name"
      label="Name"
      rules={[{ required: true, message: 'Please enter name.' }]}
    >
      <Input />
    </Form.Item>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="region" label="Region" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="zone" label="Zone" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
    </Space>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="instance_type" label="Instance Type" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="image_id" label="Image ID" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
    </Space>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="billing_type" label="Billing Type" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label="Status" style={{ flex: 1 }}>
        <Select options={MACHINE_STATUS_OPTIONS} />
      </Form.Item>
    </Space>
    {!editing ? (
      <Form.Item name="external_instance_id" label="External Instance ID">
        <Input />
      </Form.Item>
    ) : null}
  </>
);

export const MachineManualSpecFields: React.FC<{ rows?: number }> = ({
  rows = 4,
}) => (
  <>
    <Text strong style={{ display: 'block', marginBottom: 8 }}>
      Local Spec
    </Text>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="cpu_cores" label="CPU Cores" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item name="memory_mb" label="Memory MiB" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item name="disk_gb" label="Disk GiB" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item
        name="bandwidth_mbps"
        label="Bandwidth Mbps"
        style={{ flex: 1 }}
      >
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
    </Space>
    <Form.Item name="spec_text" label="Spec Advanced JSON">
      <TextArea rows={rows} placeholder='{"provider_spec": {...}}' />
    </Form.Item>
    <Form.Item name="metadata_text" label="Metadata JSON">
      <TextArea rows={rows} />
    </Form.Item>
  </>
);
