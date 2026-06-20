import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Form, Input, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import { loginDevAdmin } from '@/services/dev-admin/api';

const { Text } = Typography;

type DevLoginModalProps = {
  open: boolean;
  onSuccess: () => void;
};

const DevLoginModal: React.FC<DevLoginModalProps> = ({ open, onSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<API.DevAdminLoginParams>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await loginDevAdmin(values);
      message.success('Management login successful.');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error?.message || 'Management login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Management Login"
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      okText="Login"
      confirmLoading={loading}
      onOk={() => void handleSubmit()}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        This temporary login only applies to management APIs in the current browser tab.
      </Text>
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please enter username.' }]}
        >
          <Input prefix={<UserOutlined />} autoComplete="username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter password.' }]}
        >
          <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DevLoginModal;
