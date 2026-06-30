import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import { Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  AutomationRulesEntry,
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
  SystemConfigEntry,
} from '@/components';
import VersionNoticeModal from '@/components/VersionNoticeModal';
import {
  buildDevAdminCurrentUser,
  getDevAdminSession,
} from '@/services/dev-admin/session';
import {
  getDefinedMenuPaths,
  getFirstAllowedDefinedMenuPath,
  isAllowedDefinedMenuPath,
  isDefinedMenuUser,
  NO_MENU_PATH,
} from '@/utils/definedMenus';
import { getLatestVersion } from '@/services/version/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';
const RUNTIME_VERSION_KEY = 'nxpanel_runtime_version';
const VERSION_CHECK_INTERVAL = 60_000;
const devHomePath = '/nodes/overview';
const authFreePaths = [
  loginPath,
  '/user/register',
  '/user/register-result',
  NO_MENU_PATH,
];
const isManagementPathname = (pathname: string) =>
  pathname.startsWith('/nodes') ||
  pathname.startsWith('/dev') ||
  pathname.startsWith('/iam') ||
  pathname.startsWith('/asset');
const filterOperationMenu = (menuData: any[]) =>
  menuData.filter(
    (item) =>
      item.path !== '/nodes' &&
      item.path !== '/dev' &&
      item.path !== '/iam' &&
      item.path !== '/asset',
  );
const filterDefinedMenu = (menuData: any[], allowedPaths: Set<string>): any[] =>
  filterOperationMenu(menuData)
    .map((item) => {
      const children = item.children
        ? filterDefinedMenu(item.children, allowedPaths)
        : undefined;
      const routes = item.routes
        ? filterDefinedMenu(item.routes, allowedPaths)
        : undefined;
      const matched = item.path ? allowedPaths.has(item.path) : false;

      if (!matched && !children?.length && !routes?.length) {
        return undefined;
      }

      const nextItem = { ...item };
      if (item.children) {
        nextItem.children = children ?? [];
      }
      if (item.routes) {
        nextItem.routes = routes ?? [];
      }
      return nextItem;
    })
    .filter(Boolean);

let lastCheckTime = 0;
let checking = false;

const HeaderVersionTitle: React.FC = () => {
  const [latestVersion, setLatestVersion] = useState<string>();

  useEffect(() => {
    let canceled = false;

    const loadLatestVersion = async () => {
      try {
        const res = await getLatestVersion();
        const payload = (res as any)?.data ?? res;
        const version = payload?.version;
        if ((res as any)?.code !== 0 || !version || canceled) return;
        setLatestVersion(version);
      } catch {
        // ignore network errors
      }
    };

    void loadLatestVersion();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <Space size={8} align="center">
      <Typography.Text
        strong
        style={{ margin: 0, fontSize: 18, color: 'inherit' }}
      >
        {defaultSettings.title ?? 'Pupu Panel'}
      </Typography.Text>
      {latestVersion ? (
        <Typography.Text
          type="secondary"
          style={{ fontSize: 12, lineHeight: 1, whiteSpace: 'nowrap' }}
        >
          v{latestVersion}
        </Typography.Text>
      ) : null}
    </Space>
  );
};

const checkRuntimeVersionAndReload = async () => {
  const now = Date.now();
  if (now - lastCheckTime < VERSION_CHECK_INTERVAL) return;
  if (typeof window === 'undefined' || checking) return;
  checking = true;
  lastCheckTime = now;
  try {
    const res = await getLatestVersion();
    const payload = (res as any)?.data ?? res;
    const latestVersion = payload?.version;
    if (!latestVersion || (res as any)?.code !== 0) return;

    const currentVersion = sessionStorage.getItem(RUNTIME_VERSION_KEY);
    if (!currentVersion) {
      sessionStorage.setItem(RUNTIME_VERSION_KEY, latestVersion);
      return;
    }

    if (currentVersion !== latestVersion) {
      sessionStorage.setItem(RUNTIME_VERSION_KEY, latestVersion);
      window.location.reload();
    }
  } catch {
    // ignore network errors
  } finally {
    checking = false;
  }
};

/**
 * 动态获取 API 基础 URL
 * 本地开发: 使用相对路径走 dev proxy，避免浏览器跨域
 * 远程生产: https://pupu.apptilaus.com
 */
const getBaseURL = (): string => {
  // 服务端渲染时直接返回远程地址
  if (typeof window === 'undefined') {
    return 'https://pupu.apptilaus.com';
  }

  const hostname = window.location.hostname;

  // 本地开发环境
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.')
  ) {
    return '';
  }
  // 默认远程生产环境
  return 'https://pupu.apptilaus.com';
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const getCachedUser = (): API.CurrentUser | undefined => {
    if (typeof window === 'undefined') return undefined;
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) return undefined;
    try {
      const info = JSON.parse(userInfoStr) as {
        email?: string;
        is_admin?: boolean;
        user_type?: string;
        menus?: string[];
      };
      if (typeof info !== 'object' || !info) return undefined;
      return {
        email: info.email,
        name: info.email,
        access: info.is_admin ? ('admin' as const) : ('user' as const),
        is_admin: info.is_admin,
        user_type: info.user_type,
        menus: Array.isArray(info.menus) ? info.menus : undefined,
        loginMode: 'operation',
      };
    } catch (_error) {
      return undefined;
    }
  };

  const fetchUserInfo = async () => {
    return getCachedUser();
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (!authFreePaths.includes(location.pathname)) {
    const devSession = isManagementPathname(location.pathname)
      ? getDevAdminSession()
      : undefined;
    const currentUser = devSession?.accessToken
      ? buildDevAdminCurrentUser(devSession.user)
      : await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const isManagementMode =
    initialState?.currentUser?.loginMode === 'management';
  const isDefinedMenuMode = isDefinedMenuUser(initialState?.currentUser);

  return {
    actionsRender: () => {
      const commonActions = [
        <Question key="doc" />,
        <SelectLang key="SelectLang" />,
      ];
      if (isManagementMode) {
        return commonActions;
      }
      return [
        ...commonActions,
        <AutomationRulesEntry key="AutomationRulesEntry" />,
        <SystemConfigEntry key="SystemConfigEntry" />,
      ];
    },
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    menuDataRender: (menuData) => {
      if (isManagementMode) {
        return menuData.filter(
          (item) =>
            item.path === '/nodes' ||
            item.path === '/dev' ||
            item.path === '/iam' ||
            item.path === '/asset',
        );
      }
      if (isDefinedMenuMode) {
        return filterDefinedMenu(
          menuData,
          getDefinedMenuPaths(initialState?.currentUser),
        );
      }
      return filterOperationMenu(menuData);
    },
    onPageChange: () => {
      const { location } = history;
      void checkRuntimeVersionAndReload();
      const isManagementPath = isManagementPathname(location.pathname);
      const isAuthFreePath = authFreePaths.includes(location.pathname);
      const currentUser = initialState?.currentUser;
      const loginMode = currentUser?.loginMode;

      if (!currentUser && !isAuthFreePath && !isManagementPath) {
        history.push(`${loginPath}?mode=operation`);
        return;
      }

      if (loginMode === 'management' && !isManagementPath && !isAuthFreePath) {
        history.replace(devHomePath);
        return;
      }

      if (loginMode === 'operation' && isManagementPath) {
        const searchParams = new URLSearchParams({
          mode: 'management',
          redirect: location.pathname + location.search,
        });
        history.replace({
          pathname: loginPath,
          search: searchParams.toString(),
        });
        return;
      }

      if (
        isDefinedMenuUser(currentUser) &&
        !isAuthFreePath &&
        !isAllowedDefinedMenuPath(location.pathname, currentUser)
      ) {
        history.replace(
          getFirstAllowedDefinedMenuPath(currentUser) ?? NO_MENU_PATH,
        );
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev && !isManagementMode
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    headerTitleRender: (logo) => (
      <div
        onClick={() => {
          history.push(isManagementMode ? devHomePath : '/');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        {logo}
        <HeaderVersionTitle />
      </div>
    ),
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          <VersionNoticeModal />
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: getBaseURL(),
  ...errorConfig,
};
