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
      {
        path: '/user/no-menu',
        component: './user/NoMenu',
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
        path: '/report/project-hourly',
        name: 'project-hourly',
        component: './report/project-hourly',
      },
      {
        path: '/report/project-trend',
        hideInMenu: true,
        component: './report/project-trend',
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
    path: '/ads-console',
    name: '投放管理',
    icon: 'fundOutlined',
    routes: [
      {
        path: '/ads-console',
        redirect: '/ads-console/dashboard',
      },
      {
        path: '/ads-console/dashboard',
        name: '投放首页',
        component: './ads-console/dashboard',
      },
      {
        path: '/ads-console/report',
        name: '报表',
        routes: [
          {
            path: '/ads-console/report',
            redirect: '/ads-console/report/overall',
          },
          {
            path: '/ads-console/report/overall',
            name: 'Overall日报',
            component: './ads-console/report/overall',
          },
          {
            path: '/ads-console/report/overall-hour',
            name: 'Overall小时报表',
            component: './ads-console/report/overall-hour',
          },
          {
            path: '/ads-console/report/event',
            name: 'Event日报',
            component: './ads-console/report/event',
          },
        ],
      },
      {
        path: '/ads-console/changelog',
        name: '更新日志',
        component: './ads-console/changelog',
      },
      {
        path: '/ads-console/ads',
        name: '广告投放',
        routes: [
          {
            path: '/ads-console/ads',
            redirect: '/ads-console/ads/summary',
          },
          {
            path: '/ads-console/ads/summary',
            name: '广告汇总',
            component: './ads-console/ads/summary',
          },
          {
            path: '/ads-console/ads/account',
            name: '广告账户',
            component: './ads-console/ads/account',
          },
          {
            path: '/ads-console/ads/campaign',
            name: 'Campaign',
            component: './ads-console/ads/campaign',
          },
          {
            path: '/ads-console/ads/campaign/create',
            hideInMenu: true,
            component: './ads-console/ads/campaign/create',
          },
          {
            path: '/ads-console/ads/adset',
            name: 'Ad Set',
            component: './ads-console/ads/adset',
          },
          {
            path: '/ads-console/ads/ad',
            name: 'Ad',
            component: './ads-console/ads/ad',
          },
          {
            path: '/ads-console/ads/creative',
            name: 'Creative',
            component: './ads-console/ads/creative',
          },
          {
            path: '/ads-console/ads/create',
            name: '创建广告',
            hideInMenu: true,
            component: './ads-console/ads/create',
          },
        ],
      },
      {
        path: '/ads-console/automation',
        name: '自动化',
        routes: [
          {
            path: '/ads-console/automation',
            redirect: '/ads-console/automation/rule',
          },
          {
            path: '/ads-console/automation/rule',
            name: '规则管理',
            component: './ads-console/automation/rule',
          },
          {
            path: '/ads-console/automation/history',
            name: '执行历史',
            component: './ads-console/automation/history',
          },
        ],
      },
      {
        path: '/ads-console/org',
        name: '组织管理',
        routes: [
          {
            path: '/ads-console/org',
            redirect: '/ads-console/org/agency',
          },
          {
            path: '/ads-console/org/agency',
            name: '代理商管理',
            component: './ads-console/org/agency',
          },
          {
            path: '/ads-console/org/team',
            name: '团队管理',
            component: './ads-console/org/team',
          },
          {
            path: '/ads-console/org/group',
            name: '项目组管理',
            component: './ads-console/org/group',
          },
          {
            path: '/ads-console/org/account',
            name: '账户管理',
            component: './ads-console/org/account',
          },
        ],
      },
      {
        path: '/ads-console/system/token',
        name: 'Token 管理',
        component: './ads-console/system/token',
      },
      {
        path: '/ads-console/system/bm',
        name: 'BM 管理',
        component: './ads-console/system/bm',
      },
      {
        path: '/ads-console/system',
        name: '系统设置',
        routes: [
          {
            path: '/ads-console/system',
            redirect: '/ads-console/system/user',
          },
          {
            path: '/ads-console/system/user',
            name: '用户管理',
            component: './ads-console/system/user',
          },
          {
            path: '/ads-console/system/role',
            name: '角色管理',
            component: './ads-console/system/role',
          },
          {
            path: '/ads-console/system/permission',
            name: '权限管理',
            component: './ads-console/system/permission',
          },
          {
            path: '/ads-console/system/dict',
            name: '字典管理',
            component: './ads-console/system/dict',
          },
          {
            path: '/ads-console/system/tenant',
            name: '租户管理',
            component: './ads-console/system/tenant',
          },
          {
            path: '/ads-console/system/log',
            name: '操作日志',
            component: './ads-console/system/log',
          },
          {
            path: '/ads-console/system/changelog',
            name: '更新日志管理',
            component: './ads-console/system/changelog',
          },
        ],
      },
    ],
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
    path: '/project-table',
    name: 'project',
    icon: 'project',
    component: './project-table',
  },
  {
    path: '/project',
    name: 'project-card',
    icon: 'project',
    hideInMenu: true,
    component: './project',
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
        path: '/firebase-analytics/node-status',
        name: 'node-status',
        component: './firebase-analytics/NodeStatus',
      },
      {
        path: '/firebase-analytics/node-status/detail',
        hideInMenu: true,
        component: './firebase-analytics/NodeStatusDetail',
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
        path: '/business/external-order-receipt',
        name: 'external-order-receipt',
        component: './external-order-receipt',
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
    path: '/dns',
    name: 'dns',
    icon: 'globalOutlined',
    component: './dns',
  },
  {
    path: '/nodes',
    name: 'nodes',
    icon: 'cluster',
    routes: [
      {
        path: '/nodes',
        redirect: '/nodes/overview',
      },
      {
        path: '/nodes/overview',
        name: 'overview',
        component: './dev/NodesOverview',
      },
      {
        path: '/nodes/list',
        name: 'list',
        component: './dev/Nodes',
      },
      {
        path: '/nodes/agents',
        name: 'agents',
        component: './dev/Agents',
      },
    ],
  },
  {
    path: '/dev',
    name: 'dev',
    icon: 'code',
    routes: [
      {
        path: '/dev',
        redirect: '/dev/services',
      },
      {
        path: '/dev/nodes',
        redirect: '/nodes/list',
        hideInMenu: true,
      },
      {
        path: '/dev/agents',
        redirect: '/nodes/agents',
        hideInMenu: true,
      },
      {
        path: '/dev/services',
        name: 'services',
        component: './dev/Services',
      },
      {
        path: '/dev/menus',
        redirect: '/iam/menus',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/asset',
    name: '资源资产',
    icon: 'appstore',
    routes: [
      {
        path: '/asset',
        redirect: '/asset/machines',
      },
      {
        path: '/asset/provider-accounts',
        name: '供应商账号',
        component: './asset/ProviderAccounts',
      },
      {
        path: '/asset/regions',
        name: '区域',
        component: './asset/Regions',
      },
      {
        path: '/asset/zones',
        name: '可用区',
        component: './asset/Zones',
      },
      {
        path: '/asset/instance-types',
        name: '实例规格',
        component: './asset/InstanceTypes',
      },
      {
        path: '/asset/images',
        name: '镜像',
        component: './asset/Images',
      },
      {
        path: '/asset/security-groups',
        name: '安全组',
        component: './asset/SecurityGroups',
      },
      {
        path: '/asset/subnets',
        name: '子网',
        component: './asset/Subnets',
      },
      {
        path: '/asset/tags',
        name: '标签',
        component: './asset/Tags',
      },
      {
        path: '/asset/machines',
        name: '机器',
        component: './asset/Machines',
      },
      {
        path: '/asset/ips',
        name: 'IP',
        component: './asset/Ips',
      },
      {
        path: '/asset/ssh-keys',
        name: 'SSH 密钥',
        component: './asset/SshKeys',
      },
      {
        path: '/asset/scripts',
        name: '脚本',
        component: './asset/Scripts',
      },
      {
        path: '/asset/operations',
        name: '操作记录',
        component: './asset/Operations',
      },
      {
        path: '/asset/tasks/:taskId',
        hideInMenu: true,
        component: './asset/TaskDetail',
      },
    ],
  },
  {
    path: '/iam',
    name: 'iam',
    icon: 'safetyCertificate',
    routes: [
      {
        path: '/iam',
        redirect: '/iam/users',
      },
      {
        path: '/iam/users',
        name: 'users',
        component: './iam/Users',
      },
      {
        path: '/iam/roles',
        name: 'roles',
        component: './iam/Roles',
      },
      {
        path: '/iam/permissions',
        name: 'permissions',
        component: './iam/Permissions',
      },
      {
        path: '/iam/menus',
        name: 'menus',
        component: './iam/Menus',
      },
      {
        path: '/iam/clients',
        name: 'clients',
        component: './iam/Clients',
      },
      {
        path: '/iam/audit-logs',
        name: 'audit-logs',
        component: './iam/AuditLogs',
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
        redirect: '/system/queue-monitor',
      },
      {
        path: '/system/monitor',
        redirect: '/system/queue-monitor',
        hideInMenu: true,
      },
      {
        path: '/system/queue-monitor',
        name: 'queue-monitor',
        component: './system/queue-monitor',
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
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
