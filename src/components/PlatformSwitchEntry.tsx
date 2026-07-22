import { SwapOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, message } from 'antd';
import React from 'react';
import { flushSync } from 'react-dom';
import {
  clearAdsLoginData,
  getAdsLoginData,
} from '@/services/ads-console/authStorage';
import { getAdsConsoleUserInfo } from '@/services/ads-console/auth';
import { buildAdsCurrentUserFromLoginData } from '@/services/ads-console/session';
import {
  clearOperationSession,
  getCachedOperationUser,
} from '@/services/auth/session';

const adsHomePath = '/ads-console/dashboard';
const adsLoginRedirect = () => {
  const searchParams = new URLSearchParams({
    mode: 'ads',
    redirect: adsHomePath,
  });
  return `/user/login?${searchParams.toString()}`;
};
const operationLoginRedirect = () => {
  const searchParams = new URLSearchParams({
    mode: 'operation',
    redirect: adsHomePath,
  });
  return `/user/login?${searchParams.toString()}`;
};

const isAdsAuthExpired = (error: any) =>
  error?.response?.status === 401 ||
  error?.status === 401 ||
  error?.data?.errorCode === 401 ||
  error?.response?.data?.errorCode === 401;

const verifyAdsLoginData = async () => {
  try {
    const res = await getAdsConsoleUserInfo({
      skipAdsAuthRedirect: true,
      skipErrorHandler: true,
    });
    return res?.success !== false || res?.errorCode !== 401;
  } catch (error) {
    if (isAdsAuthExpired(error)) {
      return false;
    }
    throw error;
  }
};

const PlatformSwitchEntry: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [loading, setLoading] = React.useState(false);
  const currentUser = initialState?.currentUser;
  const loginMode = currentUser?.loginMode;

  if (loginMode === 'management') {
    return null;
  }

  if (
    loginMode === 'operation' &&
    (!currentUser?.is_admin || !currentUser?.hasAdSpendPlatformLogin)
  ) {
    return null;
  }

  if (loginMode !== 'operation' && loginMode !== 'ads') {
    return null;
  }

  const switchToAdsConsole = async () => {
    setLoading(true);
    try {
      const adsLoginData = getAdsLoginData();

      if (!adsLoginData?.token) {
        clearAdsLoginData();
        history.replace(adsLoginRedirect());
        return;
      }

      const isAdsTokenValid = await verifyAdsLoginData();
      if (!isAdsTokenValid) {
        clearAdsLoginData();
        clearOperationSession();
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: undefined }));
        });
        message.warning('投放平台登录已过期，请重新登录管理平台');
        history.replace(operationLoginRedirect());
        return;
      }

      const adsUser = await buildAdsCurrentUserFromLoginData(adsLoginData);
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: adsUser }));
      });
      history.replace(adsHomePath);
    } catch (error: any) {
      message.error(error?.message || '切换投放平台失败');
    } finally {
      setLoading(false);
    }
  };

  const switchToOperation = () => {
    const operationUser = getCachedOperationUser();
    if (!operationUser) {
      clearAdsLoginData();
      clearOperationSession();
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: undefined }));
      });
      history.replace('/user/login?mode=operation');
      return;
    }

    flushSync(() => {
      setInitialState((s) => ({ ...s, currentUser: operationUser }));
    });
    history.replace('/');
  };

  return (
    <Button
      icon={<SwapOutlined />}
      loading={loading}
      onClick={loginMode === 'ads' ? switchToOperation : switchToAdsConsole}
      size="small"
      type="text"
    >
      {loginMode === 'ads' ? '管理平台' : '投放平台'}
    </Button>
  );
};

export default PlatformSwitchEntry;
