import { Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import React from 'react';
import { MACHINE_STATUS_OPTIONS } from '../../constants';
import AssetTagEditor from '../AssetTagEditor';

const { Text } = Typography;
const { TextArea } = Input;

export const MachineManualBaseFields: React.FC<{
  editing?: API.AssetMachine | null;
}> = ({ editing }) => (
  <>
    {!editing ? (
      <Form.Item
        name="machine_id"
        label="机器 ID"
        rules={[{ required: true, message: '请输入机器 ID。' }]}
      >
        <Input />
      </Form.Item>
    ) : null}
    <Form.Item
      name="name"
      label="名称"
      rules={[{ required: true, message: '请输入名称。' }]}
    >
      <Input />
    </Form.Item>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="region" label="地域" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="zone" label="可用区" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
    </Space>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="instance_type" label="实例规格" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="image_id" label="镜像 ID" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
    </Space>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="billing_type" label="计费类型" style={{ flex: 1 }}>
        <Input />
      </Form.Item>
      <Form.Item name="status" label="状态" style={{ flex: 1 }}>
        <Select options={MACHINE_STATUS_OPTIONS} />
      </Form.Item>
    </Space>
    {!editing ? (
      <Form.Item name="external_instance_id" label="外部实例 ID">
        <Input />
      </Form.Item>
    ) : null}
    <AssetTagEditor name="tags" />
  </>
);

export const MachineManualSpecFields: React.FC<{ rows?: number }> = ({
  rows = 4,
}) => (
  <>
    <Text strong style={{ display: 'block', marginBottom: 8 }}>
      本地规格
    </Text>
    <Space size={16} align="start" style={{ width: '100%' }}>
      <Form.Item name="cpu_cores" label="CPU 核数" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item name="memory_mb" label="内存 MiB" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item name="disk_gb" label="磁盘 GiB" style={{ flex: 1 }}>
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
      <Form.Item
        name="bandwidth_mbps"
        label="带宽 Mbps"
        style={{ flex: 1 }}
      >
        <InputNumber style={{ width: '100%' }} precision={0} />
      </Form.Item>
    </Space>
    <Form.Item name="spec_text" label="规格扩展 JSON">
      <TextArea rows={rows} placeholder='{"provider_spec": {...}}' />
    </Form.Item>
    <Form.Item name="metadata_text" label="Metadata JSON">
      <TextArea rows={rows} />
    </Form.Item>
  </>
);
