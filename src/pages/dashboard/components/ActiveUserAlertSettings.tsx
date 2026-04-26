import { Form, InputNumber, Select, Button, message, Typography } from 'antd';
import React from 'react';

const { Title } = Typography;

export interface ActiveUserAlertConfig {
  minActiveUsers: number;
  minDeclinePct: number;
  notifyChannels: ('feishu' | 'system')[];
}

interface ActiveUserAlertSettingsProps {
  value?: ActiveUserAlertConfig;
  onChange?: (val: ActiveUserAlertConfig) => void;
}

const defaultConfig: ActiveUserAlertConfig = {
  minActiveUsers: 100,
  minDeclinePct: 10,
  notifyChannels: ['system'],
};

const ActiveUserAlertSettings: React.FC<ActiveUserAlertSettingsProps> = ({
  value,
  onChange,
}) => {
  const [form] = Form.useForm<ActiveUserAlertConfig>();

  const initialValues = value ?? defaultConfig;

  const handleSave = async () => {
    const values = await form.validateFields();
    onChange?.(values);
    message.success('活跃用户预警配置已保存');
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>活跃用户预警</Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          label="最低活跃用户数"
          name="minActiveUsers"
          rules={[{ required: true, message: '请输入最低活跃用户数' }]}
          tooltip="当活跃用户低于此值时触发预警"
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="如：100" />
        </Form.Item>

        <Form.Item
          label="最低下降趋势 (%)"
          name="minDeclinePct"
          rules={[{ required: true, message: '请输入最低下降趋势百分比' }]}
          tooltip="当活跃用户环比下降超过此百分比时触发预警"
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" placeholder="如：10" />
        </Form.Item>

        <Form.Item
          label="通知方式"
          name="notifyChannels"
          rules={[{ required: true, message: '请选择至少一种通知方式' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择通知方式"
            options={[
              { label: '飞书', value: 'feishu' },
              { label: '系统通知', value: 'system' },
            ]}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSave}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ActiveUserAlertSettings;
