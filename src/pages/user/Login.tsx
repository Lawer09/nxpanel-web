import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel, useRequest } from '@umijs/max';
import { Button, Checkbox, Form, Input, message, Tabs } from 'antd';
import React from 'react';
import { flushSync } from 'react-dom';
import { login } from '@/services/auth/api';
import { loginDevAdmin } from '@/services/dev-admin/api';
import { buildDevAdminCurrentUser } from '@/services/dev-admin/session';
import styles from './login.less';

type LoginMode = 'operation' | 'management';

const loginPath = '/user/login';

const LoginPage: React.FC = () => {
  const [operationForm] = Form.useForm();
  const [managementForm] = Form.useForm<API.DevAdminLoginParams>();
  const [activeMode, setActiveMode] = React.useState<LoginMode>(() => {
    if (typeof window === 'undefined') {
      return 'operation';
    }
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'management' ? 'management' : 'operation';
  });
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

  const getRedirect = () => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return new URLSearchParams(window.location.search).get('redirect') || undefined;
  };

  const updateModeInUrl = (mode: LoginMode) => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set('mode', mode);
    history.replace({
      pathname: loginPath,
      search: params.toString(),
    });
  };

  const { run: handleOperationLogin, loading: operationLoading } = useRequest(
    login,
    {
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
              email: operationForm.getFieldValue('email'),
            }),
          );

          message.success(res.message || '登录成功');

          const fetchedUser = await initialState?.fetchUserInfo?.();
          const nextUser =
            fetchedUser ??
            ({
              email: operationForm.getFieldValue('email'),
              name: operationForm.getFieldValue('email'),
              access: is_admin ? 'admin' : 'user',
              is_admin,
              loginMode: 'operation',
            } as API.CurrentUser);
          flushSync(() => {
            setInitialState((s) => ({
              ...s,
              currentUser: { ...nextUser, loginMode: 'operation' },
            }));
          });

          const redirect = getRedirect();
          const targetPath =
            redirect?.startsWith('/') && !redirect.startsWith('/dev')
              ? redirect
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
    },
  );

  const { run: handleManagementLogin, loading: managementLoading } = useRequest(
    loginDevAdmin,
    {
      manual: true,
      formatResult: (res: any) => res,
      onSuccess: (res: API.DevAdminApiResponse<API.DevAdminLoginData>) => {
        const currentUser = buildDevAdminCurrentUser(res.data?.user);
        message.success(res.message || '登录成功');
        flushSync(() => {
          setInitialState((s) => ({
            ...s,
            currentUser,
          }));
        });

        const redirect = getRedirect();
        history.replace(redirect?.startsWith('/dev') ? redirect : '/dev/nodes');
      },
      onError: (error: any) => {
        message.error(getErrorMessage(error));
      },
    },
  );

  const onOperationFinish = (values: any) => {
    handleOperationLogin({
      email: values.email,
      password: values.password,
    });
  };

  const onManagementFinish = (values: API.DevAdminLoginParams) => {
    handleManagementLogin({
      username: values.username,
      password: values.password,
    });
  };

  const handleModeChange = (key: string) => {
    const nextMode: LoginMode = key === 'management' ? 'management' : 'operation';
    setActiveMode(nextMode);
    updateModeInUrl(nextMode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.header}>
          <h1>NxPanel</h1>
          <p>Welcome Back</p>
        </div>

        <Tabs
          className={styles.modeTabs}
          activeKey={activeMode}
          centered
          onChange={handleModeChange}
          items={[
            {
              key: 'operation',
              label: '运营',
              children: (
                <Form
                  form={operationForm}
                  layout="vertical"
                  onFinish={onOperationFinish}
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
                      loading={operationLoading}
                      block
                    >
                      登 录
                    </Button>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      size="large"
                      loading={operationLoading}
                      block
                      onClick={() => {
                        const email = 'admin@demo.com';
                        const password = 'qwer123456';
                        operationForm.setFieldsValue({ email, password });
                        handleOperationLogin({ email, password });
                      }}
                    >
                      测试登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'management',
              label: '管理',
              children: (
                <Form
                  form={managementForm}
                  layout="vertical"
                  onFinish={onManagementFinish}
                  autoComplete="off"
                >
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input
                      size="large"
                      placeholder="请输入管理员用户名"
                      prefix={<UserOutlined />}
                      autoComplete="username"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="请输入管理员密码"
                      prefix={<LockOutlined />}
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={managementLoading}
                      block
                    >
                      登 录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        {activeMode === 'operation' && (
          <div className={styles.footer}>
            <span>还没有账户？</span>
            <a href="/user/register">立即注册</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
