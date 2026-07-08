import {
  clearDevAdminSession,
  getDevAdminSession,
  setDevAdminSession,
} from './session';

const DEV_ADMIN_ALIAS_PREFIX = '/v4/admin';
const IAM_ALIAS_PREFIX = '/v4/iam';
const NODE_CONTROL_ALIAS_PREFIX = '/v4/nodes';
const ASSET_SERVICE_ALIAS_PREFIX = '/v4/assets';
const TASK_SERVICE_ALIAS_PREFIX = '/v4/tasks';

type DevAdminRequestOptions = {
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  body?: unknown;
  auth?: boolean;
};

type DevAdminResponsePayload = Partial<API.DevAdminApiResponse<unknown>>;

export class DevAdminUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevAdminUnauthorizedError';
  }
}

export class DevAdminRequestError extends Error {
  httpStatus?: number;
  responseCode?: number;
  errorType?: string;
  errorDetail?: string;
  requestId?: string;
  timestamp?: number;

  constructor(
    message: string,
    options?: {
      httpStatus?: number;
      responseCode?: number;
      errorType?: string;
      errorDetail?: string;
      requestId?: string;
      timestamp?: number;
    },
  ) {
    super(message);
    this.name = 'DevAdminRequestError';
    this.httpStatus = options?.httpStatus;
    this.responseCode = options?.responseCode;
    this.errorType = options?.errorType;
    this.errorDetail = options?.errorDetail;
    this.requestId = options?.requestId;
    this.timestamp = options?.timestamp;
  }
}

const normalizePath = (path: string) => {
  if (
    !path.startsWith(DEV_ADMIN_ALIAS_PREFIX) &&
    !path.startsWith(IAM_ALIAS_PREFIX) &&
    !path.startsWith(NODE_CONTROL_ALIAS_PREFIX) &&
    !path.startsWith(ASSET_SERVICE_ALIAS_PREFIX) &&
    !path.startsWith(TASK_SERVICE_ALIAS_PREFIX)
  ) {
    throw new Error(`Unsupported management path: ${path}`);
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

const normalizeErrorText = (value?: string | null) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim();
  return text ? text : undefined;
};

const combineErrorMessage = (message?: string | null, detail?: string | null) => {
  const normalizedMessage = normalizeErrorText(message);
  const normalizedDetail = normalizeErrorText(detail);

  if (normalizedMessage && normalizedDetail) {
    const lowerMessage = normalizedMessage.toLowerCase();
    const lowerDetail = normalizedDetail.toLowerCase();
    if (
      lowerMessage === lowerDetail ||
      lowerMessage.includes(lowerDetail) ||
      lowerDetail.includes(lowerMessage)
    ) {
      return normalizedDetail.length >= normalizedMessage.length
        ? normalizedDetail
        : normalizedMessage;
    }
    return `${normalizedMessage}: ${normalizedDetail}`;
  }

  return normalizedDetail || normalizedMessage;
};

const isDevAdminResponsePayload = (value: unknown): value is DevAdminResponsePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'message' in value ||
    'error' in value ||
    'code' in value ||
    'request_id' in value ||
    'timestamp' in value
  );
};

const getErrorMessage = (
  payload: DevAdminResponsePayload | undefined,
  fallback: string = 'Management request failed.',
) =>
  combineErrorMessage(payload?.message, payload?.error?.detail) ||
  normalizeErrorText(payload?.error?.type) ||
  fallback;

export const extractDevAdminErrorPayload = (
  error: unknown,
): DevAdminResponsePayload | undefined => {
  if (isDevAdminResponsePayload(error)) {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const errorLike = error as {
    data?: unknown;
    info?: { data?: unknown };
    response?: { data?: unknown };
  };

  if (isDevAdminResponsePayload(errorLike.data)) {
    return errorLike.data;
  }

  if (isDevAdminResponsePayload(errorLike.info?.data)) {
    return errorLike.info?.data;
  }

  if (isDevAdminResponsePayload(errorLike.response?.data)) {
    return errorLike.response?.data;
  }

  return undefined;
};

export const formatDevAdminErrorMessage = (
  error: unknown,
  fallback: string = 'Management request failed.',
) => {
  if (error instanceof DevAdminRequestError) {
    return (
      combineErrorMessage(error.message, error.errorDetail) ||
      normalizeErrorText(error.errorType) ||
      fallback
    );
  }

  if (error instanceof DevAdminUnauthorizedError) {
    return normalizeErrorText(error.message) || fallback;
  }

  const payload = extractDevAdminErrorPayload(error);
  if (payload) {
    return getErrorMessage(payload, fallback);
  }

  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const errorLike = error as {
    message?: string;
    errorDetail?: string;
    errorType?: string;
    error?: {
      detail?: string;
      type?: string;
    } | null;
  };

  return (
    combineErrorMessage(
      errorLike.message,
      errorLike.errorDetail || errorLike.error?.detail,
    ) ||
    normalizeErrorText(errorLike.errorType || errorLike.error?.type) ||
    fallback
  );
};

const buildRequestError = (
  response: Response,
  payload: DevAdminResponsePayload | undefined,
) =>
  new DevAdminRequestError(getErrorMessage(payload, `HTTP ${response.status}`), {
    httpStatus: response.status,
    responseCode: payload?.code,
    errorType: payload?.error?.type,
    errorDetail: payload?.error?.detail,
    requestId: payload?.request_id,
    timestamp: payload?.timestamp,
  });

const isLegacyNodeControlSignatureError = (
  path: string,
  payload: DevAdminResponsePayload | undefined,
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
      throw new DevAdminUnauthorizedError('Management login required.');
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
    throw buildRequestError(response, payload);
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
    throw buildRequestError(response, payload);
  }

  if (!payload) {
    throw new Error(`Management request failed with HTTP ${response.status}.`);
  }

  if (payload.code !== 0) {
    throw buildRequestError(response, payload);
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
      '/v4/iam/auth/refresh',
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
