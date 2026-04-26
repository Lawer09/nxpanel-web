import { Form, Radio, Select, Switch, Button, message, Typography } from 'antd';
import React, { useState } from 'react';

const { Title } = Typography;

export interface NodeScheduleConfig {
  scheduleMode: 'smart' | 'manual';
  enableNotify: boolean;
  notifyChannels: ('feishu' | 'system')[];
}

interface NodeScheduleSettingsProps {
  value?: NodeScheduleConfig;
  onChange?: (val: NodeScheduleConfig) => void;
}

const defaultConfig: NodeScheduleConfig = {
  scheduleMode: 'smart',
  enableNotify: false,
  notifyChannels: [],
};

const NodeScheduleSettings: React.FC<NodeScheduleSettingsProps> = ({
  value,
  onChange,
}) => {
  const [form] = Form.useForm<NodeScheduleConfig>();
  const initialValues = value ?? defaultConfig;
  const [showNotifyChannels, setShowNotifyChannels] = useState(initialValues.enableNotify);

  const handleSave = async () => {
    const values = await form.validateFields();
    if (!values.enableNotify) {
      values.notifyChannels = [];
    }
    onChange?.(values);
    message.success('节点调度配置已保存');
  };

  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>节点调度</Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          label="调度模式"
          name="scheduleMode"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="smart">智能调度</Radio>
            <Radio value="manual">手动</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="是否通知"
          name="enableNotify"
          valuePropName="checked"
        >
          <Switch onChange={(checked) => setShowNotifyChannels(checked)} />
        </Form.Item>

        {showNotifyChannels && (
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
        )}

        <Form.Item>
          <Button type="primary" onClick={handleSave}>
            保存配置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default NodeScheduleSettings;
