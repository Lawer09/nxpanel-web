import { Form, Input, InputNumber, Modal, Select } from 'antd';
import React, { useEffect } from 'react';

const AgentFormModal: React.FC<{
  open: boolean;
  current?: API.ControlAgent | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: API.ControlAgentCreateParams | API.ControlAgentUpdateParams) => Promise<void>;
}> = ({ open, current, onOpenChange, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      agent_id: current?.agent_id,
      machine_id: current?.machine_id,
      asset_machine_id: current?.asset_machine_id,
      status: current?.status ?? 'active',
      pull_interval: current?.pull_interval ?? 30,
      report_interval: current?.report_interval ?? 30,
    });
  }, [current, form, open]);

  return (
    <Modal
      title={current ? `Edit Agent ${current.agent_id}` : 'Create Agent'}
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
          name="agent_id"
          label="Agent ID"
          rules={[{ required: !current, message: 'Please input agent ID.' }]}
        >
          <Input disabled={Boolean(current)} />
        </Form.Item>
        <Form.Item
          name="machine_id"
          label="Machine ID"
        >
          <Input />
        </Form.Item>
        {current ? (
          <Form.Item
            name="asset_machine_id"
            label="Asset Machine ID"
            tooltip="Optional. Set 0 or a negative value to clear the asset machine binding."
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        ) : null}
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'active', value: 'active' },
              { label: 'disabled', value: 'disabled' },
              { label: 'deleted', value: 'deleted' },
            ]}
          />
        </Form.Item>
        <Form.Item name="pull_interval" label="Pull Interval">
          <InputNumber style={{ width: '100%' }} min={1} max={3600} />
        </Form.Item>
        <Form.Item name="report_interval" label="Report Interval">
          <InputNumber style={{ width: '100%' }} min={1} max={3600} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AgentFormModal;
