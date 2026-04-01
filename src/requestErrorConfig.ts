import { history } from '@umijs/max';

const errorConfig = {
  // 错误处理
  errorHandler: (error: any) => {
    const { response } = error;

    // 只处理网络层错误，不处理业务逻辑错误
    // 业务逻辑错误（如 status: "fail"）已经在响应中返回了

    if (response?.status === 401) {
      // 清除 token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('secure_path');
      // 跳转登录页
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

    // 其他 HTTP 错误不拦截，让原始错误通过
    throw error;
  },

  // 请求拦截器 - 添加认证信息
  requestInterceptors: [
    (config: any) => {
      // 从本地存储读取 token
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = config.headers || {};
        // 直接使用 token（后端返回的已经是 "Bearer xxx" 格式）
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
      }
      else if (securePath && config.url.startsWith('/v3'))
      {
        let urlWithoutV3 = config.url.replace('/v3', ''); // 移除 "/v3"
        config.url = `/api/v3/${securePath}${urlWithoutV3}`;
      }
      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response: any) => {
      // 即使是 4xx 错误（如 400），如果响应体中有有效数据，也直接返回
      // 让业务层处理 status: "fail" 的情况
      return response;
    },
  ],
};

export { errorConfig };
