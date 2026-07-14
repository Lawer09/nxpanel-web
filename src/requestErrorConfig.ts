import { history } from '@umijs/max';
import {
  extractDevAdminErrorPayload,
  formatDevAdminErrorMessage,
} from '@/services/dev-admin/request';
import {
  clearAdsAuthToken,
  getAdsAuthToken,
} from '@/services/ads-console/authStorage';

const ADS_CONSOLE_BASE_URL = 'https://console.adsmakeup.com';

const isV4Url = (url?: string) => typeof url === 'string' && url.includes('/v4/');
const isLocalHostname = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { hostname } = window.location;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.')
  );
};
const isAdsConsoleUrl = (url?: string) =>
  typeof url === 'string' &&
  (url.includes('/ads-api') || url.startsWith(ADS_CONSOLE_BASE_URL));
const isAdsConsoleConfig = (config?: { baseURL?: string; url?: string }) =>
  isAdsConsoleUrl(config?.url) ||
  (typeof config?.baseURL === 'string' &&
    config.baseURL.startsWith(ADS_CONSOLE_BASE_URL));

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

    if (
      response?.status === 401 &&
      (isAdsConsoleUrl(error?.response?.url) ||
        isAdsConsoleUrl(error?.request?.url) ||
        isAdsConsoleConfig(error?.config))
    ) {
      clearAdsAuthToken();
      history.push('/user/login?mode=ads');
      return;
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
      if (
        typeof config?.url === 'string' &&
        config.url.startsWith('/ads-api')
      ) {
        config.baseURL = isLocalHostname() ? '' : ADS_CONSOLE_BASE_URL;
        if (config.baseURL) {
          config.url = config.url.replace(/^\/ads-api/, '/api');
        }

        const token = getAdsAuthToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }

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
        !config.url.startsWith('/ads-api') &&
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
      if (
        isAdsConsoleConfig(response?.config) &&
        response?.data?.success === false &&
        response?.data?.errorCode === 401
      ) {
        clearAdsAuthToken();
        history.replace('/user/login?mode=ads');
      }
      return response;
    },
  ],
};

export { errorConfig };
