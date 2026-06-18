export const DEV_ADMIN_AUTH_CHANGE_EVENT = 'dev-admin-auth-change';

const ACCESS_TOKEN_KEY = 'dev_admin_access_token';
const REFRESH_TOKEN_KEY = 'dev_admin_refresh_token';
const USER_KEY = 'dev_admin_user';
const EXPIRES_AT_KEY = 'dev_admin_expires_at';

export type DevAdminSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: API.DevAdminUser;
};

export const buildDevAdminCurrentUser = (
  user?: API.DevAdminUser,
): API.CurrentUser => ({
  email: user?.username,
  name: user?.nickname || user?.username || 'Management',
  access: 'admin',
  is_admin: true,
  loginMode: 'management',
});

const emitAuthChange = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(DEV_ADMIN_AUTH_CHANGE_EVENT));
};

const getStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.sessionStorage;
};

export const getDevAdminSession = (): DevAdminSession | undefined => {
  const storage = getStorage();
  if (!storage) {
    return undefined;
  }

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    return undefined;
  }

  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY) || undefined;
  const expiresAtText = storage.getItem(EXPIRES_AT_KEY);
  const expiresAt = expiresAtText ? Number(expiresAtText) : undefined;
  const userText = storage.getItem(USER_KEY);
  let user: API.DevAdminUser | undefined;

  if (userText) {
    try {
      user = JSON.parse(userText) as API.DevAdminUser;
    } catch {
      user = undefined;
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined,
    user,
  };
};

export const hasDevAdminSession = () => Boolean(getDevAdminSession()?.accessToken);

export const setDevAdminSession = (data: API.DevAdminLoginData) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    storage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  } else {
    storage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (data.user) {
    storage.setItem(USER_KEY, JSON.stringify(data.user));
  } else {
    storage.removeItem(USER_KEY);
  }

  if (data.expires_in) {
    storage.setItem(EXPIRES_AT_KEY, String(Date.now() + data.expires_in * 1000));
  } else {
    storage.removeItem(EXPIRES_AT_KEY);
  }

  emitAuthChange();
};

export const clearDevAdminSession = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
  storage.removeItem(EXPIRES_AT_KEY);
  emitAuthChange();
};
