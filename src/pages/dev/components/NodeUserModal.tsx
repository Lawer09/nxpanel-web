import { Form, Input, InputNumber, Modal, Select } from 'antd';
import React, { useEffect } from 'react';
import UnitNumberInput, { speedLimitUnits } from './UnitNumberInput';

const NodeUserModal: React.FC<{
  open: boolean;
  current?: API.ControlNodeUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: API.ControlNodeUserCreateParams | API.ControlNodeUserUpdateParams) => Promise<void>;
}> = ({ open, current, onOpenChange, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      user_id: current?.user_id,
      uuid: current?.uuid,
      speed_limit: current?.speed_limit ?? 0,
      ip_limit: current?.ip_limit ?? 0,
      status: current?.status ?? 'active',
    });
  }, [current, form, open]);

  return (
    <Modal
      title={current ? `Edit Node User ${current.user_id}` : 'Create Node User'}
      open={open}
      destroyOnHidden
      onCancel={() => onOpenChange(false)}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="user_id"
          label="User ID"
          rules={[{ required: !current, message: 'Please input user ID.' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} disabled={Boolean(current)} />
        </Form.Item>
        <Form.Item
          name="uuid"
          label="UUID / Credential"
          rules={[{ required: true, message: 'Please input credential.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="speed_limit"
          label="User Speed Limit"
          tooltip="User speed limit, unit bytes per second (B/s). 0 means unlimited."
        >
          <UnitNumberInput units={speedLimitUnits} />
        </Form.Item>
        <Form.Item name="ip_limit" label="IP Limit">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select options={[{ label: 'active', value: 'active' }, { label: 'deleted', value: 'deleted' }]} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NodeUserModal;
