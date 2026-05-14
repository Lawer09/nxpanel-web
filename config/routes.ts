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
    path: '/ad',
    name: 'ad',
    icon: 'fundOutlined',
    component: './ad/ad-revenue',
  },
  {
    path: '/ad-spend',
    name: 'ad-spend',
    icon: 'fundOutlined',
    component: './ad-spend',
  },
    {
    path: '/report',
    name: 'report',
    icon: 'barChart',
    routes: [
      {
        path: '/report',
        redirect: '/report/project',
      },
      {
        path: '/report/project',
        name: 'project',
        component: './report/project',
      },
      {
        path: '/report/node-summary-report',
        name: 'node-summary-report',
        component: './report/node-summary-report',
      },
      {
        path: '/report/user-summary-report',
        name: 'user-summary-report',
        component: './report/user-summary-report',
      },
      {
        path: '/report/user-stat',
        redirect: '/report/traffic?tab=user',
      },
      {
        path: '/report/server-stat',
        redirect: '/report/traffic?tab=server',
      },
      {
        path: '/report/user-report-count',
        redirect: '/report/user-report-realtime',
      },
      {
        path: '/report/user-report-daily',
        redirect: '/report/user-report-realtime',
      },
      {
        path: '/report/user-report-realtime',
        name: 'user-report-realtime',
        hideInMenu: true,
        component: './report/user-report-realtime',
      },
      {
        path: '/report/app-traffic',
        redirect: '/report/traffic?tab=app',
      },
      {
        path: '/report/traffic',
        name: 'traffic',
        hideInMenu: true,
        component: './report/traffic',
      },
      {
        path: '/report/perf-group-analysis',
        redirect: '/report/performance-diagnosis?tab=perf-group',
      },
      {
        path: '/report/node-probe-analysis',
        redirect: '/report/performance-diagnosis?tab=node-probe',
      },
      {
        path: '/report/performance-diagnosis',
        name: 'performance-diagnosis',
        hideInMenu: true,
        component: './report/performance-diagnosis',
      },
      {
        path: '/report/user-report-admin',
        name: 'user-report-admin',
        component: './report/user-report-admin',
      },
      {
        path: '/report/node-report-admin',
        name: 'node-report-admin',
        component: './report/node-report-admin',
      },
      
    ],
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
    path: '/business',
    name: 'business',
    icon: 'solution',
    routes: [
      {
        path: '/business',
        redirect: '/business/user-manage',
      },
      {
        path: '/business/user-manage',
        name: 'user-manage',
        component: './user-manage',
      },
      {
        path: '/business/plan',
        name: 'plan',
        component: './plan',
      },
      {
        path: '/business/order',
        name: 'order',
        component: './order',
      },
      {
        path: '/business/ticket',
        name: 'ticket',
        component: './ticket',
      },
      {
        path: '/business/invite-gift-card',
        name: 'invite-gift-card',
        component: './invite-gift-card',
      },
      {
        path: '/business/invite-gift-card/logs',
        name: 'invite-gift-card-logs',
        component: './invite-gift-card/logs',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/dns',
    name: 'dns',
    icon: 'globalOutlined',
    component: './dns',
  },
  {
    path: '/traffic-platform',
    name: 'traffic-platform',
    icon: 'cloudServer',
    component: './traffic-platform/dashboard',
  },
  {
    path: '/traffic-platform/dashboard',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/platforms',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/accounts',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/hourly',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/daily',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/monthly',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/trend',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/ranking',
    redirect: '/traffic-platform',
  },
  {
    path: '/traffic-platform/sync-jobs',
    redirect: '/traffic-platform',
  },

  {
    path: '/project',
    name: 'project',
    icon: 'project',
    component: './project/list',
  },
  {
    path: '/project/list',
    redirect: '/project',
  },
  {
    path: '/project/:id',
    name: 'project.detail',
    component: './project/detail',
    hideInMenu: true,
  },
  {
    path: '/firebase-analytics',
    name: 'firebase-analytics',
    icon: 'barChart',
    routes: [
      {
        path: '/firebase-analytics',
        redirect: '/firebase-analytics/dashboard',
      },
      {
        path: '/firebase-analytics/dashboard',
        name: 'dashboard',
        component: './firebase-analytics/Dashboard',
      },
      {
        path: '/firebase-analytics/app-open',
        name: 'app-open',
        component: './firebase-analytics/AppOpenAnalysis',
        hideInMenu: true,
      },
      {
        path: '/firebase-analytics/vpn-session',
        name: 'vpn-session',
        component: './firebase-analytics/VpnSessionAnalysis',
        hideInMenu: true,
      },
      {
        path: '/firebase-analytics/vpn-probe',
        name: 'vpn-probe',
        component: './firebase-analytics/VpnProbeAnalysis',
        hideInMenu: true,
      },
      {
        path: '/firebase-analytics/api-error',
        name: 'api-error',
        component: './firebase-analytics/ServerApiErrorAnalysis',
        hideInMenu: true,
      },
      {
        path: '/firebase-analytics/events',
        name: 'events',
        component: './firebase-analytics/EventList',
        hideInMenu: true,
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
