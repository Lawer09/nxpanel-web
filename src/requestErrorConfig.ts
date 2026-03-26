import { history } from '@umijs/max';

const errorConfig = {
  // 错误处理
  errorHandler: (error: any) => {
    const { response, message: msg } = error;

    // 处理 401 未授权
    if (response?.status === 401) {
      // 清除 token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      // 跳转登录页
      history.push('/user/login');
      return;
    }

    // 处理其他错误
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
      return config;
    },
  ],

  // 响应拦截器 - 处理统一响应格式
  responseInterceptors: [
    (response: any) => {
      // 如果响应状态码是 2xx，直接返回 data
      return response;
    },
  ],
};

export { errorConfig };