import React from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { history, useRequest } from '@umijs/max';
import { register } from '@/services/swagger/auth';
import styles from './login.less';

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();

  const { run: handleRegister, loading } = useRequest(register, {
    manual: true,
    onSuccess: (res) => {
      if (res.code === 0) {
        const { token, auth_data, is_admin } = res.data;

        // 存储 token 和用户信息
        localStorage.setItem('auth_token', auth_data);
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_info', JSON.stringify({
          is_admin,
          token,
        }));

        message.success('注册成功，正在跳转...');

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          history.push('/');
        }, 1000);
      } else {
        message.error(res.msg || '注册失败');
      }
    },
    onError: (error: any) => {
      console.error('Register error:', error);
      message.error(error?.message || '注册出错，请稍后重试');
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
            />
          </Form.Item>

          <Form.Item
            name="invite_code"
            label="邀请码（可选）"
          >
            <Input
              size="large"
              placeholder="输入邀请码（非必填）"
            />
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
    </div>
  );
};

export default RegisterPage;