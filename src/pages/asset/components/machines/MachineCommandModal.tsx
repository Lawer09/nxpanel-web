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
    title={`批量执行命令（${selectedRows.length} 台机器）`}
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
          message={`已选机器：${selectedRows
            .map((item) => item.name || item.machine_id || item.id)
            .join(', ')}`}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请先在表格中勾选机器。"
        />
      )}
    </Space>
    <Form<MachineCommandFormValues> form={form} layout="vertical">
      <Form.Item
        name="ssh_key_id"
        label="SSH 密钥"
        rules={[{ required: true, message: '请选择 SSH 密钥。' }]}
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
          label="用户名"
          style={{ flex: 1 }}
          rules={[{ required: true, message: '请输入用户名。' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="port" label="端口" style={{ width: 160 }}>
          <InputNumber style={{ width: '100%' }} precision={0} min={1} />
        </Form.Item>
        <Form.Item
          name="timeout_seconds"
          label="超时时间（秒）"
          style={{ width: 180 }}
        >
          <InputNumber style={{ width: '100%' }} precision={0} min={1} />
        </Form.Item>
      </Space>
      <Form.Item
        name="command"
        label="命令"
        rules={[{ required: true, message: '请输入命令。' }]}
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
              throw new Error('请确认这是高风险操作。');
            },
          },
        ]}
      >
        <Checkbox>我已知晓该命令会在所有已选机器上执行。</Checkbox>
      </Form.Item>
    </Form>
  </Modal>
);

export default MachineCommandModal;
