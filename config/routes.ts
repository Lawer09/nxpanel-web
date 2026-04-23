/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        component: './user/Login',
      },
      {
        path: '/user/register',
        component: './user/Register',
      },
      {
        path: '/user/register-result',
        component: './user/RegisterResult',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboardOutlined',
    component: './dashboard',
  },
  {
    path: '/resource',
    name: 'resource',
    icon: 'appstore',
    routes: [
      {
        path: '/resource',
        redirect: '/resource/server',
      },
      {
        path: '/resource/server',
        name: 'server',
        component: './server',
      },
      {
        path: '/resource/asn',
        name: 'asn',
        component: './asn',
      },
      {
        path: '/resource/provider',
        name: 'provider',
        component: './provider',
      },
      {
        path: '/resource/ip-pool',
        name: 'ip-pool',
        component: './ip-pool',
      },
      {
        path: '/resource/machine',
        name: 'machine',
        component: './machine',
      },
      {
        path: '/resource/deploy-template',
        name: 'deploy-template',
        component: './deploy-template',
      },
      {
        path: '/resource/server-template',
        name: 'server-template',
        component: './server-template',
      },
      {
        path: '/resource/ssh-key',
        name: 'ssh-key',
        component: './ssh-key',
      },
    ],
  },
  {
    path: '/report',
    name: 'report',
    icon: 'barChart',
    routes: [
      {
        path: '/report',
        redirect: '/report/performance',
      },
      {
        path: '/report/performance',
        name: 'performance',
        component: './report/performance',
      },
      {
        path: '/report/user-stat',
        name: 'user-stat',
        component: './report/user-stat',
      },
      {
        path: '/report/server-stat',
        name: 'server-stat',
        component: './report/server-stat',
      },
      {
        path: '/report/user-report-count',
        name: 'user-report-count',
        component: './report/user-report-count',
      },
      {
        path: '/report/user-report-daily',
        name: 'user-report-daily',
        component: './report/user-report-daily',
      },
      {
        path: '/report/failed-nodes',
        name: 'failed-nodes',
        component: './report/failed-nodes',
      },
      {
        path: '/report/app-traffic',
        name: 'app-traffic',
        component: './report/app-traffic',
      },
      {
        path: '/report/perf-group-analysis',
        name: 'perf-group-analysis',
        component: './report/perf-group-analysis',
      },
    ],
  },
  {
    path: '/invite-gift-card',
    name: 'invite-gift-card',
    icon: 'gift',
    routes: [
      {
        path: '/invite-gift-card',
        redirect: '/invite-gift-card/rules',
      },
      {
        path: '/invite-gift-card/rules',
        name: 'invite-gift-card-rules',
        component: './invite-gift-card',
      },
      {
        path: '/invite-gift-card/logs',
        name: 'invite-gift-card-logs',
        component: './invite-gift-card/logs',
      },
    ],
  },
  {
    path: '/system',
    name: 'system',
    icon: 'dashboard',
    routes: [
      {
        path: '/system',
        redirect: '/system/monitor',
      },
      {
        path: '/system/monitor',
        name: 'monitor',
        component: './system',
      },
      {
        path: '/system/version',
        name: 'version',
        component: './system/version',
      },
      {
        path: '/system/app-client',
        name: 'app-client',
        component: './system/app-client',
      },
    ],
  },
  {
    path: '/user-manage',
    name: 'user-manage',
    icon: 'user',
    component: './user-manage',
  },
  {
    path: '/plan',
    name: 'plan',
    icon: 'appstoreAdd',
    component: './plan',
  },
  {
    path: '/order',
    name: 'order',
    icon: 'shoppingCart',
    component: './order',
  },
  {
    path: '/dns',
    name: 'dns',
    icon: 'globalOutlined',
    component: './dns',
  },
  {
    path: '/ticket',
    name: 'ticket',
    icon: 'customerService',
    component: './ticket',
  },
  {
    path: '/ad',
    name: 'ad',
    icon: 'fundOutlined',
    routes: [
      {
        path: '/ad',
        redirect: '/ad/ad-accounts',
      },
      {
        path: '/ad/ad-accounts',
        name: 'ad-accounts',
        component: './ad/ad-accounts',
      },
      {
        path: '/ad/project-mappings',
        name: 'project-mappings',
        component: './ad/project-mappings',
      },
      {
        path: '/ad/sync-servers',
        name: 'sync-servers',
        component: './ad/sync-servers',
      },
      {
        path: '/ad/sync-monitor',
        name: 'sync-monitor',
        component: './ad/sync-monitor',
      },
      {
        path: '/ad/ad-revenue',
        name: 'ad-revenue',
        component: './ad/ad-revenue',
      },
    ],
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
