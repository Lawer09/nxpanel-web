import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { history, useModel, useRequest } from '@umijs/max';
import { Button, Checkbox, Form, Input, message } from 'antd';
import React from 'react';
import { flushSync } from 'react-dom';
import { login } from '@/services/swagger/auth';
import styles from './login.less';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const { initialState, setInitialState } = useModel('@@initialState');

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

  const { run: handleLogin, loading } = useRequest(login, {
    manual: true,
    formatResult: (res: any) => res,
    onSuccess: async (res: any) => {
      // 检查响应状态
      if (res.status === 'success' && res.data) {
        // 登录成功
        const { token, auth_data, is_admin, secure_path } = res.data;

        // 存储 token 和用户信息
        localStorage.setItem('auth_token', auth_data);
        localStorage.setItem('user_token', token);
        if (secure_path) {
          localStorage.setItem('secure_path', secure_path);
        } else {
          localStorage.removeItem('secure_path');
        }
        localStorage.setItem(
          'user_info',
          JSON.stringify({
            is_admin,
            token,
            email: form.getFieldValue('email'),
          }),
        );

        message.success(res.message || '登录成功');

        const fetchedUser = await initialState?.fetchUserInfo?.();
        const nextUser =
          fetchedUser ??
          ({
            email: form.getFieldValue('email'),
            name: form.getFieldValue('email'),
            access: is_admin ? 'admin' : 'user',
            is_admin,
          } as API.CurrentUser);
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: nextUser }));
        });

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        const targetPath = redirect?.startsWith('/')
          ? redirect
          : is_admin
            ? '/admin'
            : '/';
        history.replace(targetPath);
      } else {
        // 登录失败 - 显示后端返回的错误信息
        message.error(res.message || '登录失败，请检查邮箱和密码');
      }
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error));
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
              autoComplete="email"
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
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
            initialValue={true}
          >
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
          <Form.Item>
            <Button
              size="large"
              loading={loading}
              block
              onClick={() => {
                const email = 'admin@demo.com';
                const password = 'qwer123456';
                form.setFieldsValue({ email, password });
                handleLogin({ email, password });
              }}
            >
              测试登录
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
