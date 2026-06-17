/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  dev: {
    '/v4/control/': {
      target: 'http://8.220.74.20:8080',
      changeOrigin: true,
      pathRewrite: { '^/v4/control': '/api/v1/control' },
    },
    '/v4/service-register-manager/': {
      target: 'http://8.220.74.20:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/v4/service-register-manager': '/api/v1/service-register-manager',
      },
    },
    '/v4/admin/': {
      target: 'http://8.220.74.20:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/v4/admin': '/api/v1/admin',
      },
    },
  },
  // 如果需要自定义本地开发服务器  请取消注释按需调整
  // dev: {
  //   // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
  //   '/api/': {
  //     // 要代理的地址
  //     target: 'https://preview.pro.ant.design',
  //     // 配置了这个可以从 http 代理到 https
  //     // 依赖 origin 的功能可能需要这个，比如 cookie
  //     changeOrigin: true,
  //   },
  // },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
