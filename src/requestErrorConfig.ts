import { history } from '@umijs/max';
import {
  extractDevAdminErrorPayload,
  formatDevAdminErrorMessage,
} from '@/services/dev-admin/request';

const isV4Url = (url?: string) => typeof url === 'string' && url.includes('/v4/');

const isV4RequestError = (error: any) => {
  if (isV4Url(error?.response?.url)) {
    return true;
  }

  if (isV4Url(error?.request?.url)) {
    return true;
  }

  if (isV4Url(error?.config?.url)) {
    return true;
  }

  if (isV4Url(error?.info?.request?.url)) {
    return true;
  }

  return false;
};

const errorConfig = {
  // Error handling
  errorHandler: (error: any) => {
    const { response } = error;
    const payload = isV4RequestError(error)
      ? extractDevAdminErrorPayload(error)
      : undefined;

    if (payload) {
      error.message = formatDevAdminErrorMessage(
        payload,
        error?.message || `HTTP ${response?.status || 'request failed'}`,
      );
      error.errorType = error.errorType || payload.error?.type;
      error.errorDetail = error.errorDetail || payload.error?.detail;
      error.requestId = error.requestId || payload.request_id;
      error.responseCode = error.responseCode || payload.code;
      error.timestamp = error.timestamp || payload.timestamp;
    }

    if (response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('secure_path');
      history.push('/user/login');
      return;
    }

    if (response?.status === 403) {
      history.push('/exception/403');
      return;
    }

    if (response?.status === 404) {
      history.push('/exception/404');
      return;
    }

    if (response?.status === 500) {
      history.push('/exception/500');
      return;
    }

    throw error;
  },

  // Request interceptors
  requestInterceptors: [
    (config: any) => {
      if (typeof config?.url === 'string' && config.url.startsWith('/v4/')) {
        return config;
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = token;
      }

      const securePath = localStorage.getItem('secure_path');
      if (
        securePath &&
        typeof config?.url === 'string' &&
        config.url.startsWith('/') &&
        !config.url.startsWith('/api/') &&
        !config.url.startsWith('/v3')
      ) {
        config.url = `/api/v2/${securePath}${config.url}`;
      } else if (securePath && config.url.startsWith('/v3')) {
        const urlWithoutV3 = config.url.replace('/v3', '');
        config.url = `/api/v3/${securePath}${urlWithoutV3}`;
      }

      return config;
    },
  ],

  // Response interceptors
  responseInterceptors: [
    (response: any) => {
      return response;
    },
  ],
};

export { errorConfig };
