type CachedOperationUserInfo = {
  email?: string;
  is_admin?: boolean;
  user_type?: string;
  menus?: string[];
  hasAdSpendPlatformLogin?: boolean;
};

export const getCachedOperationUser = (): API.CurrentUser | undefined => {
  if (typeof window === 'undefined') return undefined;
  const userInfoStr = localStorage.getItem('user_info');
  if (!userInfoStr) return undefined;

  try {
    const info = JSON.parse(userInfoStr) as CachedOperationUserInfo;
    if (typeof info !== 'object' || !info) return undefined;

    return {
      email: info.email,
      name: info.email,
      access: info.is_admin ? ('admin' as const) : ('user' as const),
      is_admin: info.is_admin,
      user_type: info.user_type,
      menus: Array.isArray(info.menus) ? info.menus : undefined,
      hasAdSpendPlatformLogin: info.hasAdSpendPlatformLogin === true,
      loginMode: 'operation',
    };
  } catch (_error) {
    return undefined;
  }
};

export const cacheOperationLoginData = (
  data: API.AuthResponse,
  email?: string,
) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('auth_token', data.auth_data);
  localStorage.setItem('user_token', data.token);
  if (data.secure_path) {
    localStorage.setItem('secure_path', data.secure_path);
  } else {
    localStorage.removeItem('secure_path');
  }
  localStorage.setItem(
    'user_info',
    JSON.stringify({
      is_admin: data.is_admin,
      token: data.token,
      email,
      user_type: data.user_type,
      menus: Array.isArray(data.menus) ? data.menus : undefined,
      hasAdSpendPlatformLogin: !!data.ad_spend_platform_login?.token,
    }),
  );
};

export const clearOperationSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('secure_path');
};
