import {
  clearDevAdminSession,
  getDevAdminSession,
  setDevAdminSession,
} from './session';

const DEV_ADMIN_ALIAS_PREFIX = '/v4/admin';
const NODE_CONTROL_ALIAS_PREFIX = '/v4/control';
const ASSET_SERVICE_ALIAS_PREFIX = '/v4/assets';

type DevAdminRequestOptions = {
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  body?: unknown;
  auth?: boolean;
};

export class DevAdminUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevAdminUnauthorizedError';
  }
}

const normalizePath = (path: string) => {
  if (
    !path.startsWith(DEV_ADMIN_ALIAS_PREFIX) &&
    !path.startsWith(NODE_CONTROL_ALIAS_PREFIX) &&
    !path.startsWith(ASSET_SERVICE_ALIAS_PREFIX)
  ) {
    throw new Error(`Unsupported Dev admin path: ${path}`);
  }
  return path;
};

const buildQuery = (params?: Record<string, unknown>) => {
  if (!params) {
    return '';
  }

  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

const getErrorMessage = (payload: Partial<API.DevAdminApiResponse<unknown>> | undefined) =>
  payload?.message || payload?.error?.detail || payload?.error?.type || 'Dev admin request failed.';

const isLegacyNodeControlSignatureError = (
  path: string,
  payload: Partial<API.DevAdminApiResponse<unknown>> | undefined,
) =>
  path.startsWith(NODE_CONTROL_ALIAS_PREFIX) &&
  typeof payload?.error?.detail === 'string' &&
  payload.error.detail.toLowerCase().includes('app signature');

const executeDevAdminRequest = async <T>(
  path: string,
  options: DevAdminRequestOptions,
  allowRefresh: boolean,
): Promise<API.DevAdminApiResponse<T>> => {
  const method = options.method ?? 'GET';
  const query = buildQuery(options.params);
  const url = query ? `${normalizePath(path)}?${query}` : normalizePath(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.auth !== false) {
    const session = getDevAdminSession();
    if (!session?.accessToken) {
      throw new DevAdminUnauthorizedError('Dev admin login required.');
    }
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  if (method !== 'GET' && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method === 'GET' || options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: API.DevAdminApiResponse<T> | undefined;
  try {
    payload = (await response.json()) as API.DevAdminApiResponse<T>;
  } catch {
    payload = undefined;
  }

  if (response.status === 401 && isLegacyNodeControlSignatureError(path, payload)) {
    throw new Error(getErrorMessage(payload));
  }

  if (response.status === 401 && options.auth !== false && allowRefresh) {
    const refreshed = await refreshDevAdminSession();
    if (refreshed) {
      return executeDevAdminRequest<T>(path, options, false);
    }
    clearDevAdminSession();
    throw new DevAdminUnauthorizedError(getErrorMessage(payload));
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearDevAdminSession();
      throw new DevAdminUnauthorizedError(getErrorMessage(payload));
    }
    throw new Error(getErrorMessage(payload) || `HTTP ${response.status}`);
  }

  if (!payload) {
    throw new Error(`Dev admin request failed with HTTP ${response.status}.`);
  }

  if (payload.code !== 0) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
};

export const refreshDevAdminSession = async () => {
  const session = getDevAdminSession();
  if (!session?.refreshToken) {
    return false;
  }

  try {
    const response = await executeDevAdminRequest<API.DevAdminLoginData>(
      '/v4/admin/auth/refresh',
      {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
        auth: false,
      },
      false,
    );
    setDevAdminSession(response.data);
    return true;
  } catch {
    clearDevAdminSession();
    return false;
  }
};

export const devAdminRequest = async <T>(
  path: string,
  options: DevAdminRequestOptions = {},
): Promise<API.DevAdminApiResponse<T>> => executeDevAdminRequest<T>(path, options, true);
