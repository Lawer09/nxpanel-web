import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { history, useRequest } from '@umijs/max';
import { Button, Form, Input, Modal, message } from 'antd';
import React, { useState } from 'react';
import { register } from '@/services/auth/api';
import styles from './login.less';

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [errorModal, setErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getErrorMessage = (error: any) => {
    const data = error?.data ?? error?.response?.data;
    const backendMessage = data?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }
    const fallbackMessage = error?.message;
    if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
      return fallbackMessage;
    }
    return '网络错误，请稍后重试';
  };

  const { run: handleRegister, loading } = useRequest(register, {
    manual: true,
    formatResult: (res: any) => res,
    onSuccess: (res: any) => {
      // 检查响应状态
      if (res.status === 'success' && res.data) {
        // 注册成功
        const { token, auth_data, is_admin } = res.data;

        // 存储 token 和用户信息
        localStorage.setItem('auth_token', auth_data);
        localStorage.setItem('user_token', token);
        localStorage.setItem(
          'user_info',
          JSON.stringify({
            is_admin,
            token,
            email: form.getFieldValue('email'),
          }),
        );

        message.success(res.message || '注册成功！');

        // 延迟跳转到注册结果页面
        setTimeout(() => {
          history.push('/user/register-result');
        }, 800);
      } else {
        // 注册失败
        setErrorMessage(res.message || '注册失败，请稍后重试');
        setErrorModal(true);
      }
    },
    onError: (error: any) => {
      setErrorMessage(getErrorMessage(error));
      setErrorModal(true);
    },
  });

  const onFinish = (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    handleRegister({
      email: values.email,
      password: values.password,
      invite_code: values.invite_code || undefined,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <h1>NxPanel</h1>
          <p>Create Account</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              size="large"
              placeholder="请输入邮箱地址"
              prefix={<MailOutlined />}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少需要 8 位' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*[0-9])/,
                message: '密码必须包含字母和数字',
              },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="请设置密码（最少 8 位，需包含字母和数字）"
              prefix={<LockOutlined />}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password
              size="large"
              placeholder="请再次输入密码"
              prefix={<LockOutlined />}
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item name="invite_code" label="邀请码（可选）">
            <Input size="large" placeholder="输入邀请码（非必填）" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              block
            >
              注 册
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <span>已有账户？</span>
          <a href="/user/login">立即登录</a>
        </div>
      </div>

      {/* 错误提示弹窗 */}
      <Modal
        title="注册失败"
        open={errorModal}
        onOk={() => setErrorModal(false)}
        onCancel={() => setErrorModal(false)}
        okText="确定"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>{errorMessage}</p>
      </Modal>
    </div>
  );
};

export default RegisterPage;
