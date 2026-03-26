import React from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { history, useRequest } from '@umijs/max';
import { login } from '@/services/swagger/auth';
import styles from './login.less';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();

  const { run: handleLogin, loading } = useRequest(login, {
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

        message.success('登录成功');

        // 跳转到首页或仪表板
        history.push('/');
      } else {
        message.error(res.msg || '登录失败');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      message.error(error?.message || '登录出错，请稍后重试');
    },
  });

  const onFinish = (values: any) => {
    handleLogin({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <h1>NxPanel</h1>
          <p>Welcome Back</p>
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
              placeholder="请输入您的邮箱"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少需要 8 位' },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="请输入密码（最少 8 位）"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" initialValue={true}>
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              block
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <span>还没有账户？</span>
          <a href="/user/register">立即注册</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;