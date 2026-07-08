import { request } from '@umijs/max';

export async function loginAdsConsole(
  body: { username: string; password: string },
  options?: Record<string, any>,
) {
  return request<AdsConsole.Result<AdsConsole.LoginData>>('/ads-api/auth/login', {
    method: 'POST',
    data: body,
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function logoutAdsConsole(options?: Record<string, any>) {
  return request<AdsConsole.Result<null>>('/ads-api/auth/logout', {
    method: 'POST',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function getAdsConsoleUserInfo(options?: Record<string, any>) {
  return request<AdsConsole.Result<AdsConsole.LoginData>>('/ads-api/auth/info', {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export function adsLoginDataToCurrentUser(
  data: AdsConsole.LoginData,
): AdsConsole.CurrentUser {
  return {
    id: data.userId ? Number(data.userId) : undefined,
    userId: data.userId,
    username: data.username,
    realName: data.realName,
    name: data.realName || data.username,
    avatar: data.avatar,
    roles: data.roles || [],
    permissions: data.permissions || [],
    isSuperAdmin:
      (data.roles || []).includes('SUPER_ADMIN') ||
      (data.roles || []).includes('ACCOUNT_MANAGER'),
    teamId: data.teamId,
    teamName: data.teamName,
    agencyNames: data.agencyNames || [],
    groupNames: data.groupNames || [],
    loginMode: 'ads',
  };
}
