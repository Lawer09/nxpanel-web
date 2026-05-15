# Version Log

## Agent 维护说明（必读）

当前开发版本：`1.2.5`

请后续 Agent 严格按以下规则维护此文件。

### 1. 当前版本规则

- 以顶部 `当前开发版本：x.y.z` 作为唯一准则。
- 只允许在当前开发版本对应的 `## [x.y.z]` 区块下追加内容。
- 禁止修改历史版本内容。
- 历史版本一旦切换后，视为冻结，只读，不再新增、删除或改写条目。

### 2. 记录粒度

- 一次功能改动对应一条日志。
- 日志必须具体说明：做了什么 + 影响范围。
- 避免空泛描述，例如：
  - 不推荐：`优化了体验`
  - 推荐：`优化版本检查频率，增加 60 秒节流，减少重复请求`
- 如涉及关键文件，建议在末尾补充文件路径，例如：
  - `- 新增版本一致性检查，菜单切换时发现新版本自动整页刷新（src/app.tsx）`

### 3. 分类标准

每个版本下按以下分类记录：

#### 新增功能

用于记录全新能力、页面、接口、交互、模块。

#### 优化功能

用于记录已有功能的性能、体验、结构、可维护性改进。

#### Bug 修复

用于记录明确的问题修复，包括异常、边界问题、错误逻辑、兼容性问题。

### 4. 结构规则

- 版本标题格式固定：
---
## [版本号] - YYYY-MM-DD
---
条目统一使用 - 无序列表。
某分类若无内容，可以暂不填写。
不要写 无、暂无、N/A。
新增记录只能追加到对应分类下，不要重排历史记录。

### 5. 发版切换规则
只通过修改顶部 当前开发版本：x.y.z 来切换开发版本。
切换版本后，上一版本区块自动冻结。
如果新版本区块不存在，则在文件末尾新增版本模板，参考模板如下：
---
## [x.y.z] - YYYY-MM-DD

### 新增功能

### 优化功能

### Bug 修复
---
后续所有改动记录，只能写入当前开发版本对应区块。

### 6. 新版本描述建议
推荐句式：

动词 + 具体功能/模块 + 场景/影响范围（可选文件路径）

示例：

- 新增客户端版本强制刷新策略，菜单切换时发现新版本立即刷新页面（src/app.tsx）
- 优化版本检查频率，增加 60 秒节流，减少重复请求
- 修复菜单渲染包装导致的点击失效问题，恢复侧边菜单可用性

## 7. Agent 执行要求

每次 Agent 修改代码后，必须检查本文件：

读取顶部 当前开发版本
查找对应版本区块
根据本次改动内容，追加到正确分类
如果对应版本区块不存在，先创建版本区块
不得修改非当前版本的任何内容

## 8. 当前版本日志

## [1.2.4] - 2026-05-12

### 新增功能

- 新增业务管理菜单组，将用户管理、套餐管理、订单管理、工单管理归入该组（config/routes.ts, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts）
- 将邀请礼品卡菜单移至业务管理组，合并规则管理和发放日志，规则列表增加卡片发放记录板块，点击数量可查看发放日志（src/pages/invite-gift-card/, config/routes.ts, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts）
- 新增 Firebase 数据分析模块，包含 Dashboard、App 打开分析、VPN 连接分析、节点测速分析、API 错误分析、事件明细查询等 6 个页面（config/routes.ts, src/pages/firebase-analytics/）
- 实现 Firebase Analytics 通用筛选组件 FilterBar，支持时间范围、多维参数筛选及快键键（src/components/FirebaseAnalytics/FilterBar.tsx）
- 实现 Firebase Analytics KPI 卡片组件，支持昨日对比趋势显示（src/components/FirebaseAnalytics/KpiCard.tsx）
- 实现 Firebase Analytics 趋势图组件，集成 Ant Design Charts 折线图（src/components/FirebaseAnalytics/TrendChart.tsx）
- 实现 Firebase Analytics 基础服务封装，对接后端 v3 接口（src/services/firebase-analytics/api.ts）
- 实现 Dashboard 总览页面，展示 KPI 数据、事件趋势及 VPN 质量趋势（src/pages/firebase-analytics/Dashboard.tsx）
- 补全 Dashboard 页面缺失模块：地区质量分布 (RegionQualityPanel)、错误 Top 排行 (ErrorTopPanel) 和节点质量排行 (NodeQualityTable) （src/components/FirebaseAnalytics/, src/pages/firebase-analytics/Dashboard.tsx）
- 全新项目管理页面（左右分栏布局），左侧项目卡片列表支持分页/搜索/状态筛选，右侧展示项目基础信息内联编辑、资源统计卡片切换管理（流量账号/广告账号/用户App）、日聚合工具（同步/异步触发）（src/pages/project/, config/routes.ts, src/services/project/）

### 优化功能
- 优化 Dashboard 页面布局，将图表和组件改为左右两列瀑布流排列（事件趋势、VPN连接质量、地区质量分布、错误Top排行），并为长列表单独占满整行（src/pages/firebase-analytics/Dashboard.tsx）
- 地区质量分布 (RegionQualityPanel) 引入 `echarts` 和 `echarts-for-react`，动态加载 GeoJSON 实现了可交互的事件热力地图渲染（src/components/FirebaseAnalytics/RegionQualityPanel.tsx）
- 优化 ErrorTopPanel 及 RegionQualityPanel 内部结构，由于缩减为半宽卡片，将其内部排列从左右改为上下堆叠以避免挤压（src/components/FirebaseAnalytics/）
- 新增前端通用工具类 utils，包含数值、流量、时长、成功率等格式化方法（src/utils/firebase-analytics.ts）
- 更改侧边菜单及页面名称层级：将 `Firebase 数据分析` 改为 `Firebase`，`总览 Dashboard` 改为 `Dashboard`，同时将其余 5 个详细分析子菜单进行 `hideInMenu: true` 隐藏处理（config/routes.ts, src/locales/zh-CN/menu.ts, src/pages/firebase-analytics/Dashboard.tsx）
- 重写项目管理服务层 API，基于新接口文档规范重构项目 CRUD、资源关联和日聚合接口（src/services/project/）
- 广告账号关联表单优化：通过 `/v3/ad-accounts` 选取账号、`/v3/ad-revenue/apps` 选取 App，自动填充平台代码和绑定类型（src/pages/project/components/ResourceTabs/AdAccounts.tsx）
- 流量账号关联表单优化：通过 `/v3/traffic-platform/accounts` 选取账号，自动填充平台代码，隐藏外部UID/用户名、绑定类型默认 account（src/pages/project/components/ResourceTabs/TrafficAccounts.tsx）
- 项目资源卡片"新增"改为"关联"并移至统计卡片右上角，点击卡片自动切换并刷新对应资源列表（src/pages/project/components/ProjectDetail.tsx）

### Bug 修复
- 修复 `FilterBar` 组件 ProForm 使用 `initialValues` 的警告，改为 `request` 异步加载默认值（src/components/FirebaseAnalytics/FilterBar.tsx）
- 修复 `RegionQualityPanel` 地图组件中使用废弃 API `mapType` 的警告，替换为 `map`（src/components/FirebaseAnalytics/RegionQualityPanel.tsx）
- 修复各个图表、表格组件中使用 Antd Card 废弃属性 `bordered` 和 `bodyStyle` 的警告，替换为 `variant="borderless"` 和 `styles={{ body: ... }}`（src/components/FirebaseAnalytics/*.tsx）
- 修正 API 数据结构和字段映射，以对齐实际后端接口契约（docs/api/firebase_analytics.md）：更新 Types、Dashboard 解析逻辑及底层数据组件对应 key（src/services/firebase-analytics/types.ts, src/services/firebase-analytics/api.ts, src/components/FirebaseAnalytics/*）
- 修复 Firebase 分析页时间筛选器问题：剥离请求中无用的 `timeRange[]` 前端参数，并将时间格式从 `toISOString()` 统一修正为接口要求的 `YYYY-MM-DD HH:mm:ss`，同时修复 URL 时间参数无法回显的缺陷（src/pages/firebase-analytics/Dashboard.tsx）
- 修复 ProTable request 返回结构解析错误导致的 `rawData.some is not a function` 崩溃（src/pages/project/components/ResourceTabs/）
- 修复 ModalForm 内 React Fragment 子元素接收 autoFocus 属性导致的控制台警告（src/pages/project/components/ResourceTabs/）
- 修复各组件中 message 静态方法无法读取动态主题的警告，统一改用 App.useApp()（src/pages/project/components/）
- 新增公共的时间格式化方法 `formatUTC8`，修复项目管理页面时间显示问题，将后端 UTC 时间统一转换为东八区显示（src/utils/format.ts, src/pages/project/）