import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Alert, App, Button, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { logoutDevAdmin } from '@/services/dev-admin/api';
import {
  buildDevAdminCurrentUser,
  DEV_ADMIN_AUTH_CHANGE_EVENT,
  getDevAdminSession,
  hasDevAdminSession,
} from '@/services/dev-admin/session';
import DevLoginModal from './DevLoginModal';

const { Text } = Typography;

type DevAuthGateProps = {
  children: React.ReactNode;
};

const getSessionState = () => ({
  loggedIn: hasDevAdminSession(),
  user: getDevAdminSession()?.user,
});

const DevAuthGate: React.FC<DevAuthGateProps> = ({ children }) => {
  const { message } = App.useApp();
  const { setInitialState } = useModel('@@initialState');
  const [state, setState] = useState(getSessionState);

  const syncManagementUser = () => {
    const session = getDevAdminSession();
    if (!session?.accessToken) {
      return;
    }
    flushSync(() => {
      setInitialState((s) => ({
        ...s,
        currentUser: buildDevAdminCurrentUser(session.user),
      }));
    });
  };

  useEffect(() => {
    const handleChange = () => {
      const nextState = getSessionState();
      setState(nextState);
      if (nextState.loggedIn) {
        syncManagementUser();
        return;
      }
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
    };
    window.addEventListener(DEV_ADMIN_AUTH_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(DEV_ADMIN_AUTH_CHANGE_EVENT, handleChange);
  }, []);

  if (!state.loggedIn) {
    return (
      <PageContainer>
        <Alert
          type="warning"
          showIcon
          message="Dev admin login required"
          description="Dev admin APIs use a temporary JWT session during development. Log in here to continue without changing the normal platform login state."
          action={
            <Button icon={<LoginOutlined />} onClick={() => setState(getSessionState())}>
              Login
            </Button>
          }
        />
        <DevLoginModal
          open
          onSuccess={() => {
            setState(getSessionState());
            syncManagementUser();
          }}
        />
      </PageContainer>
    );
  }

  return (
    <>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Text type="secondary">
          Dev Admin: {state.user?.nickname || state.user?.username || 'Signed in'}
        </Text>
        <Button
          size="small"
          icon={<LogoutOutlined />}
          onClick={async () => {
            try {
              await logoutDevAdmin();
              message.success('Dev admin logged out.');
            } catch (error: any) {
              message.error(error?.message || 'Dev logout failed.');
            } finally {
              flushSync(() => {
                setInitialState((s) => ({ ...s, currentUser: undefined }));
              });
              setState(getSessionState());
              history.replace('/user/login?mode=management');
            }
          }}
        >
          Logout
        </Button>
      </Space>
      {children}
    </>
  );
};

export default DevAuthGate;
