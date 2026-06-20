import {
  Alert,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
} from 'antd';
import React from 'react';
import type { MachineCommandFormValues } from '../../types';

const { TextArea } = Input;

type Props = {
  open: boolean;
  selectedRows: API.AssetMachine[];
  sshKeys: API.AssetSshKey[];
  form: ReturnType<typeof Form.useForm<MachineCommandFormValues>>[0];
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
};

const MachineCommandModal: React.FC<Props> = ({
  open,
  selectedRows,
  sshKeys,
  form,
  saving,
  onCancel,
  onSubmit,
}) => (
  <Modal
    title={`Run Command on ${selectedRows.length} Machine(s)`}
    open={open}
    destroyOnHidden
    width={760}
    confirmLoading={saving}
    onCancel={onCancel}
    onOk={onSubmit}
  >
    <Space
      direction="vertical"
      size={16}
      style={{ width: '100%', marginBottom: 16 }}
    >
      {selectedRows.length ? (
        <Alert
          type="warning"
          showIcon
          message={`Selected machines: ${selectedRows
            .map((item) => item.name || item.machine_id || item.id)
            .join(', ')}`}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Select machines in the table first."
        />
      )}
    </Space>
    <Form<MachineCommandFormValues> form={form} layout="vertical">
      <Form.Item
        name="ssh_key_id"
        label="SSH Key"
        rules={[{ required: true, message: 'Please select SSH key.' }]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          options={sshKeys.map((item) => ({
            label: `${item.name} (#${item.id})`,
            value: item.id,
          }))}
        />
      </Form.Item>
      <Space size={16} align="start" style={{ width: '100%' }}>
        <Form.Item
          name="username"
          label="Username"
          style={{ flex: 1 }}
          rules={[{ required: true, message: 'Please enter username.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="port" label="Port" style={{ width: 160 }}>
          <InputNumber style={{ width: '100%' }} precision={0} min={1} />
        </Form.Item>
        <Form.Item
          name="timeout_seconds"
          label="Timeout Seconds"
          style={{ width: 180 }}
        >
          <InputNumber style={{ width: '100%' }} precision={0} min={1} />
        </Form.Item>
      </Space>
      <Form.Item
        name="command"
        label="Command"
        rules={[{ required: true, message: 'Please enter command.' }]}
      >
        <TextArea rows={6} />
      </Form.Item>
      <Form.Item
        name="confirmed"
        valuePropName="checked"
        rules={[
          {
            validator: async (_, value) => {
              if (value) {
                return;
              }
              throw new Error('Please confirm this high-risk action.');
            },
          },
        ]}
      >
        <Checkbox>
          I understand this command will run on all selected machines.
        </Checkbox>
      </Form.Item>
    </Form>
  </Modal>
);

export default MachineCommandModal;
