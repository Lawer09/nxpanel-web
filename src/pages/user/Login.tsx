import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useModel, useRequest } from '@umijs/max';
import { Checkbox, Divider, Flex, message, Tabs, Typography } from 'antd';
import type { CSSProperties } from 'react';
import React from 'react';
import { flushSync } from 'react-dom';
import { login } from '@/services/auth/api';
import { loginDevAdmin } from '@/services/dev-admin/api';
import { buildDevAdminCurrentUser } from '@/services/dev-admin/session';
import {
  getFirstAllowedDefinedMenuPath,
  isAllowedDefinedMenuPath,
  isDefinedMenuUser,
  NO_MENU_PATH,
} from '@/utils/definedMenus';

type LoginMode = 'operation' | 'management';

const { Link, Text } = Typography;

const loginPath = '/user/login';
const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
};
const getPathnameFromPath = (path?: string) => path?.split(/[?#]/)[0];

const modeCopy: Record<
  LoginMode,
  {
    title: string;
    subTitle: string;
    submitText: string;
  }
> = {
  operation: {
    title: 'NXPANEL',
    subTitle: '管理后台登录',
    submitText: '登录',
  },
  management: {
    title: 'NXPANEL',
    subTitle: '开发控制面登录',
    submitText: '登录',
  },
};

const LoginPage: React.FC = () => {
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

  const { run: handleOperationLogin, loading: operationLoading } = useRequest(login, {
    manual: true,
    formatResult: (res: any) => res,
    onSuccess: async (res: any, params: [{ email: string; password: string }]) => {
      if (res.status === 'success' && res.data) {
        const { token, auth_data, is_admin, secure_path, user_type } = res.data;
        const menus = Array.isArray(res.data.menus) ? res.data.menus : undefined;
        const email = params[0]?.email;

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
            email,
            user_type,
            menus,
          }),
        );

        message.success(res.message || '登录成功');

        const fetchedUser = await initialState?.fetchUserInfo?.();
        const nextUser =
          fetchedUser ??
          ({
            email,
            name: email,
            access: is_admin ? 'admin' : 'user',
            is_admin,
            user_type,
            menus,
            loginMode: 'operation',
          } as API.CurrentUser);

        flushSync(() => {
          setInitialState((s) => ({
            ...s,
            currentUser: { ...nextUser, loginMode: 'operation' },
          }));
        });

        const redirect = getRedirect();
        const operationRedirect =
          redirect?.startsWith('/') &&
          !redirect.startsWith('/nodes') &&
          !redirect.startsWith('/dev') &&
          !redirect.startsWith('/iam') &&
          !redirect.startsWith('/asset')
            ? redirect
            : '/';
        const redirectPathname = getPathnameFromPath(redirect);
        const definedRedirect =
          redirect &&
          redirectPathname &&
          isAllowedDefinedMenuPath(redirectPathname, nextUser)
            ? redirect
            : getFirstAllowedDefinedMenuPath(nextUser) ?? NO_MENU_PATH;
        const targetPath =
          isDefinedMenuUser(nextUser) ? definedRedirect : operationRedirect;
        history.replace(targetPath);
      } else {
        message.error(res.message || '登录失败，请检查邮箱和密码');
      }
    },
    onError: (error: any) => {
      message.error(getErrorMessage(error));
    },
  });

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
        history.replace(
          redirect?.startsWith('/nodes') ||
            redirect?.startsWith('/dev') ||
            redirect?.startsWith('/iam') ||
            redirect?.startsWith('/asset')
            ? redirect
            : '/nodes/overview',
        );
      },
      onError: (error: any) => {
        message.error(getErrorMessage(error));
      },
    },
  );

  const handleModeChange = (key: string) => {
    const nextMode: LoginMode = key === 'management' ? 'management' : 'operation';
    setActiveMode(nextMode);
    updateModeInUrl(nextMode);
  };

  const activeCopy = modeCopy[activeMode];

  return (
    <div style={pageStyle}>
      <LoginForm
        logo={null}
        title={activeCopy.title}
        subTitle={activeCopy.subTitle}
        style={cardStyle}
        submitter={{
          searchConfig: {
            submitText: activeCopy.submitText,
          },
          submitButtonProps: {
            loading: activeMode === 'operation' ? operationLoading : managementLoading,
            size: 'large',
          },
          resetButtonProps: false,
        }}
        onFinish={async (values) => {
          if (activeMode === 'management') {
            await handleManagementLogin({
              username: values.username as string,
              password: values.password as string,
            });
            return true;
          }

          await handleOperationLogin({
            email: values.email as string,
            password: values.password as string,
          });
          return true;
        }}
        actions={
          activeMode === 'operation' ? (
            <>
              <Divider style={{ marginBlock: 8 }} />
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Checkbox defaultChecked>记住我</Checkbox>
                <Text type="secondary">
                  还没有账户？<Link href="/user/register">立即注册</Link>
                </Text>
              </Flex>
            </>
          ) : (
            <>
              <Divider style={{ marginBlock: 8 }} />
              <Text type="secondary">
                当前登录只写入开发会话，不影响管理侧登录态。
              </Text>
            </>
          )
        }
      >
        <Tabs
          activeKey={activeMode}
          centered
          onChange={handleModeChange}
          items={[
            { key: 'operation', label: '管理' },
            { key: 'management', label: '开发' },
          ]}
        />

        {activeMode === 'operation' ? (
          <>
            <ProFormText
              name="email"
              fieldProps={{
                size: 'large',
                prefix: <MailOutlined />,
                autoComplete: 'email',
              }}
              placeholder="请输入您的邮箱"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
                autoComplete: 'current-password',
              }}
              placeholder="请输入密码（最少 8 位）"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码至少需要 8 位' },
              ]}
            />
          </>
        ) : (
          <>
            <ProFormText
              name="username"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined />,
                autoComplete: 'username',
              }}
              placeholder="请输入管理员用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined />,
                autoComplete: 'current-password',
              }}
              placeholder="请输入管理员密码"
              rules={[{ required: true, message: '请输入密码' }]}
            />
          </>
        )}
      </LoginForm>
    </div>
  );
};

export default LoginPage;
