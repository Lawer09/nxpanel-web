import { Form, Input, InputNumber, Modal, Switch } from 'antd';
import React, { useEffect } from 'react';

const AgentDeployModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: API.ControlAgentDeployParams) => Promise<void>;
}> = ({ open, onOpenChange, onSubmit }) => {
  const [form] = Form.useForm<API.ControlAgentDeployParams>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      pull_interval: 30,
      report_interval: 30,
      timeout_seconds: 300,
      force: false,
    });
  }, [form, open]);

  return (
    <Modal
      title="Deploy Agent"
      open={open}
      destroyOnHidden
      width={720}
      onCancel={() => onOpenChange(false)}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="asset_machine_id"
          label="Asset Machine ID"
          tooltip="Required asset-service machine ID."
          rules={[{ required: true, message: 'Please input asset machine ID.' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item
          name="agent_id"
          label="Agent ID"
          tooltip="Optional. Defaults to agent-{asset_machine_id} when omitted."
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="binary_url"
          label="Binary URL"
          tooltip="Optional nx-node binary download URL."
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="node_service_base_url"
          label="Node Service Base URL"
          tooltip="Optional node-service runtime base URL written into agent config."
        >
          <Input />
        </Form.Item>
        <Form.Item name="pull_interval" label="Pull Interval" tooltip="Snapshot pull interval in seconds.">
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item
          name="report_interval"
          label="Report Interval"
          tooltip="Runtime report interval in seconds."
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item
          name="timeout_seconds"
          label="Timeout Seconds"
          tooltip="Asset SSH execution timeout in seconds."
        >
          <InputNumber style={{ width: '100%' }} min={1} />
        </Form.Item>
        <Form.Item
          name="force"
          label="Force Redeploy"
          tooltip="Reset secret and recreate the deploy task when the machine is already bound."
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AgentDeployModal;
