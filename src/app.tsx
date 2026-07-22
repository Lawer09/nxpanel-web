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
  PlatformSwitchEntry,
  Question,
  SelectLang,
  SystemConfigEntry,
} from '@/components';
import VersionNoticeModal from '@/components/VersionNoticeModal';
import { getCachedOperationUser } from '@/services/auth/session';
import {
  buildDevAdminCurrentUser,
  getDevAdminSession,
} from '@/services/dev-admin/session';
import {
  adsLoginDataToCurrentUser,
  getAdsConsolePermissionRoutes,
  getAdsConsoleUserInfo,
} from '@/services/ads-console/auth';
import {
  clearAdsLoginData,
  getAdsAuthToken,
} from '@/services/ads-console/authStorage';
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
const adsHomePath = '/ads-console/dashboard';
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
const isAdsConsolePathname = (pathname: string) =>
  pathname.startsWith('/ads-console');
const filterOperationMenu = (menuData: any[]) =>
  menuData.filter(
    (item) =>
      item.path !== '/nodes' &&
      item.path !== '/dev' &&
      item.path !== '/iam' &&
      item.path !== '/asset' &&
      item.path !== '/ads-console',
  );
const filterAdsConsoleMenu = (menuData: any[]) =>
  menuData.filter((item) => item.path === '/ads-console');
const normalizeAdsPermissionPath = (path?: string) => {
  if (!path) return undefined;
  if (path.startsWith('/ads-console')) return path;
  if (path === '/') return '/ads-console/dashboard';
  if (path === '/dashboard') return '/ads-console/dashboard';
  if (path === '/changelog') return '/ads-console/changelog';
  if (path === '/system/token') return '/ads-console/token';
  if (path === '/system/bm') return '/ads-console/bm';
  if (path === '/system/platform') return '/ads-console/platform';
  return `/ads-console${path.startsWith('/') ? path : `/${path}`}`;
};
const collectAdsAllowedPaths = (
  menus?: AdsConsole.RouteMenuItem[] | null,
  options?: { includeHidden?: boolean },
): Set<string> | undefined => {
  if (!menus?.length) return undefined;
  const allowedPaths = new Set<string>();
  const visit = (items?: AdsConsole.RouteMenuItem[] | null) => {
    items?.forEach((item) => {
      if (options?.includeHidden || !item.meta?.hidden) {
        const normalized = normalizeAdsPermissionPath(item.path);
        if (normalized) allowedPaths.add(normalized);
      }
      visit(item.children);
    });
  };
  visit(menus);
  return allowedPaths;
};
const getAdsConsoleAllowedPaths = (currentUser?: API.CurrentUser) =>
  collectAdsAllowedPaths(
    (currentUser as AdsConsole.CurrentUser | undefined)?.adsMenus,
    { includeHidden: true },
  );
const getAdsConsoleMenuPaths = (currentUser?: API.CurrentUser) =>
  collectAdsAllowedPaths(
    (currentUser as AdsConsole.CurrentUser | undefined)?.adsMenus,
  );
const getFirstAllowedAdsConsolePath = (currentUser?: API.CurrentUser) => {
  const allowedPaths = getAdsConsoleAllowedPaths(currentUser);
  if (!allowedPaths?.size) return adsHomePath;
  if (allowedPaths.has(adsHomePath)) return adsHomePath;
  return Array.from(allowedPaths).find(
    (path) => path.startsWith('/ads-console') && path !== '/ads-console',
  ) ?? adsHomePath;
};
const isAllowedAdsConsolePath = (
  pathname: string,
  currentUser?: API.CurrentUser,
) => {
  const allowedPaths = getAdsConsoleAllowedPaths(currentUser);
  if (!allowedPaths?.size) return true;
  return allowedPaths.has(pathname);
};
const filterAdsConsoleMenuByPermission = (
  menuData: any[],
  currentUser?: API.CurrentUser,
) => {
  const adsMenu = filterAdsConsoleMenu(menuData);
  const allowedPaths = getAdsConsoleMenuPaths(currentUser);

  if (!allowedPaths?.size) {
    return adsMenu;
  }

  const filterItem = (item: any): any | undefined => {
    if (item.hideInMenu) return undefined;
    const children = item.children
      ?.map(filterItem)
      .filter(Boolean);
    const routes = item.routes
      ?.map(filterItem)
      .filter(Boolean);
    const matched = item.path ? allowedPaths.has(item.path) : false;
    const isAdsRoot = item.path === '/ads-console';

    if (!isAdsRoot && !matched && !children?.length && !routes?.length) {
      return undefined;
    }

    return {
      ...item,
      ...(item.children ? { children: children ?? [] } : {}),
      ...(item.routes ? { routes: routes ?? [] } : {}),
    };
  };

  return adsMenu.map(filterItem).filter(Boolean);
};
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
  const fetchUserInfo = async () => {
    return getCachedOperationUser();
  };

  const fetchAdsUserInfo = async () => {
    if (typeof window === 'undefined' || !getAdsAuthToken()) {
      return undefined;
    }
    try {
      const res = await getAdsConsoleUserInfo();
      if (res?.success && res.data) {
        let adsMenus: AdsConsole.RouteMenuItem[] | undefined;
        try {
          const routesRes = await getAdsConsolePermissionRoutes();
          if (routesRes?.success && Array.isArray(routesRes.data)) {
            adsMenus = routesRes.data;
          }
        } catch (_error) {
          adsMenus = undefined;
        }
        return adsLoginDataToCurrentUser(res.data, adsMenus);
      }
    } catch (_error) {
      clearAdsLoginData();
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (!authFreePaths.includes(location.pathname)) {
    let currentUser: API.CurrentUser | undefined;
    if (isManagementPathname(location.pathname)) {
      const devSession = getDevAdminSession();
      currentUser = devSession?.accessToken
        ? buildDevAdminCurrentUser(devSession.user)
        : undefined;
    } else if (isAdsConsolePathname(location.pathname)) {
      currentUser = await fetchAdsUserInfo();
    } else {
      currentUser = await fetchUserInfo();
    }
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
  const isAdsMode = initialState?.currentUser?.loginMode === 'ads';
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
      if (isAdsMode) {
        return [
          ...commonActions,
          <PlatformSwitchEntry key="PlatformSwitchEntry" />,
        ];
      }
      return [
        ...commonActions,
        <PlatformSwitchEntry key="PlatformSwitchEntry" />,
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
      if (isAdsMode) {
        return filterAdsConsoleMenuByPermission(
          menuData,
          initialState?.currentUser,
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
      const isAdsPath = isAdsConsolePathname(location.pathname);
      const isAuthFreePath = authFreePaths.includes(location.pathname);
      const currentUser = initialState?.currentUser;
      const loginMode = currentUser?.loginMode;

      if (!currentUser && !isAuthFreePath && isAdsPath) {
        const searchParams = new URLSearchParams({
          mode: 'ads',
          redirect: location.pathname + location.search,
        });
        history.push({
          pathname: loginPath,
          search: searchParams.toString(),
        });
        return;
      }

      if (!currentUser && !isAuthFreePath && !isManagementPath) {
        history.push(`${loginPath}?mode=operation`);
        return;
      }

      if (currentUser && isAdsPath && loginMode !== 'ads') {
        const searchParams = new URLSearchParams({
          mode: 'ads',
          redirect: location.pathname + location.search,
        });
        history.replace({
          pathname: loginPath,
          search: searchParams.toString(),
        });
        return;
      }

      if (loginMode === 'ads' && !isAdsPath && !isAuthFreePath) {
        history.replace(adsHomePath);
        return;
      }

      if (
        loginMode === 'ads' &&
        isAdsPath &&
        !isAllowedAdsConsolePath(location.pathname, currentUser)
      ) {
        history.replace(getFirstAllowedAdsConsolePath(currentUser));
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
    links: isDev && !isManagementMode && !isAdsMode
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
          history.push(
            isManagementMode ? devHomePath : isAdsMode ? adsHomePath : '/',
          );
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
