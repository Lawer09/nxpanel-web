# Version Log

## 维护说明（必读）

当前开发版本：`1.2.6`

请后续严格按以下规则维护此文件。

### 1. 当前版本规则

- 以顶部 `当前开发版本：x.y.z` 作为唯一准则。
- 只允许在当前开发版本对应的 `## [x.y.z]` 区块下追加内容，不存在则按照发版切换规则中的说明执行操作。
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

- 优化域名管理主视图：将域名列表由 ProTable 升级为 ProList 卡片式展示，合并“域名总数/缺失域名”为域名池统计（总数+可用+缺失），并新增右侧抽屉详情展示域名信息与绑定 IP 列表；同时按区块拆分概览卡片、域名列表、详情抽屉组件（src/pages/dns/index.tsx, src/pages/dns/components/, src/services/dns-tool/typings.d.ts）。
- 优化域名详情抽屉交互：在绑定 IP 列表内增加就地“解绑”操作，支持直接带入 FQDN 和 IPv4 打开解绑确认弹窗（src/pages/dns/components/DomainDetailDrawer.tsx, src/pages/dns/index.tsx）。
- 优化域名详情抽屉操作能力：在绑定 IP 列表增加“编辑”操作，可直接打开元信息弹窗修改该绑定记录的 tags 与 note（src/pages/dns/components/DomainDetailDrawer.tsx, src/pages/dns/index.tsx）。

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
- 按照 `代理流量弹出框.md` 规范重构所有列表及表单页面容器：将「平台管理」、「账号管理」、「同步任务」由之前的右侧抽屉或内嵌标签页（Drawer/Tabs），全部重构为了基于 `Modal` 的居中弹窗展示，并统一样式、交互行为以及 API 数据联动（新增 `PlatformManageModal.tsx`、`AccountManageModal.tsx`、`SyncTaskModal.tsx`）。
- 修复因 `res.data.list` 与 `res.data.data` 解析字段不兼容导致的账号和日流量/月流量统计总数为 0 异常的问题，更新底层 `getPageInfo` 提取逻辑以兼容不规则层级数据。
- 修复右上角查询过滤组件区域在响应式排列时的右侧按钮组（查询、重置）悬浮问题：重设容器 Flex 布局让重置与查询紧贴右侧对齐。
- 修复 Firebase 分析页时间筛选器问题：剥离请求中无用的 `timeRange[]` 前端参数，并将时间格式从 `toISOString()` 统一修正为接口要求的 `YYYY-MM-DD HH:mm:ss`，同时修复 URL 时间参数无法回显的缺陷（src/pages/firebase-analytics/Dashboard.tsx）
- 修复 ProTable request 返回结构解析错误导致的 `rawData.some is not a function` 崩溃（src/pages/project/components/ResourceTabs/）
- 修复 ModalForm 内 React Fragment 子元素接收 autoFocus 属性导致的控制台警告（src/pages/project/components/ResourceTabs/）
- 修复各组件中 message 静态方法无法读取动态主题的警告，统一改用 App.useApp()（src/pages/project/components/）
- 完善同步节点管理功能：在节点列表操作栏补充“测试”和“同步”功能按钮，支持调用测试接口及按日期范围下发同步指令（src/pages/ad/ad-revenue/components/SyncServersModal.tsx）
- 新增公共的时间格式化方法 `formatUTC8`，修复项目管理页面时间显示问题，将后端 UTC 时间统一转换为东八区显示（src/utils/format.ts, src/pages/project/）
## [1.2.5] - 2026-05-19

### 新增功能

- 新增全局“自动化策略配置”入口与通用弹窗控制台，支持模块切换、规则卡片列表、动态作用范围/条件/动作配置、执行记录查看及试运行（src/components/AutomationRulesEntry.tsx, src/services/automation-rules/）

### 优化功能

- 优化域名管理交互约束：解绑弹窗与元信息弹窗中的 FQDN、IPv4、域名改为只读文本展示，移除可编辑输入字段，避免误操作修改关键标识；同时补充详情抽屉绑定列表“编辑”快捷入口（src/pages/dns/index.tsx, src/pages/dns/components/DomainDetailDrawer.tsx）。
- 优化域名概览卡片布局：统一三张统计卡片高度与拉伸行为，修复域名池卡片高度与其它卡片不一致问题（src/pages/dns/components/DomainOverviewCards.tsx, src/pages/dns/index.less）。
- 优化 DNS 账号列表操作：新增“同步”按钮，按账号调用 `/v3/dns/domains/sync`（携带 `providerAccountId`）触发域名同步，并在成功后刷新域名与账号列表（src/pages/dns/index.tsx, src/services/dns-tool/api.ts）。
- 重构域名管理控制台页面：按最新设计文档实现双视图列表、右侧详情面板、执行解析/解绑风险弹窗、配置管理（Provider 与 Provider 账号）及 V3 DNS 接口对接（src/pages/dns/index.tsx, src/pages/dns/index.less, src/services/dns-tool/）。
- 优化域名管理页面交互：移除顶部搜索与操作行、取消域名/IP 绑定 Tab，改为概览卡片驱动的单表格视图切换（域名/活跃绑定/缺失域名/Provider/Provider账号），并在未选中记录时隐藏右侧详情面板以动态扩展表格宽度（src/pages/dns/index.tsx, src/pages/dns/index.less）。
- 优化域名管理表格布局稳定性：按视口动态设置主表容器最小高度并反推 scroll.y，加载态与空数据态保持固定占位，避免切换/加载时表格先缩短再拉伸，底部区域可持续填充（src/pages/dns/index.tsx, src/pages/dns/index.less）。

### Bug 修复

- 修复 Dashboard 包名筛选来源不正确：将下拉选项由前端固定值改为 `/v3/enum/app-ids` 动态枚举（`appId`）并接入新的枚举服务封装（src/pages/dashboard/index.tsx, src/services/enum/api.ts, src/services/enum/typings.d.ts）。
- 修复流量平台 Dashboard 趋势图 Tooltip 字段映射错误，改为明确展示日期与流量值，并补充 trafficMb/trafficGb/trafficBytes 数值解析兜底（src/pages/traffic-platform/dashboard/components/TrafficTrendChart.tsx）
- 修复流量平台 Dashboard 在 React 19 下 useRef 泛型未传初始值导致的 TS2554 编译错误，并统一兼容流量趋势/排行接口数组直返与包装对象两种响应结构（src/pages/traffic-platform/dashboard/components/）
- 修复域名管理卡片切换时列表高度突变：为各模式主表统一设置自适应固定滚动高度（scroll.y），避免因数据量差异造成表格容器收缩/拉伸抖动（src/pages/dns/index.tsx）。
- 修复域名管理页面双请求与首屏高度抖动：移除首屏对主表的手动 reload、移除卡片切换时的冗余 reload，仅在同卡片重复点击时主动刷新；并将表格滚动高度初始值直接按窗口高度计算，避免首次渲染二次跳变（src/pages/dns/index.tsx）。
- 调整域名管理主表高度计算策略：由固定视口估算改为基于主表卡片在当前视口中的实际 top 位置动态计算可用剩余高度，并预留页脚/底部间距，避免表格过高导致页面整体滚动（src/pages/dns/index.tsx）。
- 调整域名管理主表高度策略：移除页脚与底部间距预留，改为仅按主表卡片到视口底部的剩余高度计算容器高度与 scroll.y（src/pages/dns/index.tsx）。
- 回退域名管理列表高度策略到抖动修复版本：移除剩余空间自适应与主表容器最小高度占位，仅保留 scroll.y 随窗口变化的固定高度方案（src/pages/dns/index.tsx, src/pages/dns/index.less）。

## [1.2.6] - 2026-05-22

### 优化功能

- 优化 Dashboard 顶部卡片布局：将“今日收益/本月收益”与“在线节点/在线用户”统一为同一行四卡片，收敛指标字号并补充次级信息（流水、支出）以提升信息密度（src/pages/dashboard/components/StatsOverviewCards.tsx）。

### Bug 修复

- 修复 Dashboard 收益数据显示为 0：兼容项目报表接口多层返回结构（`res.data` / `res.data.data` / `res.data.data.data`），避免因取值路径不一致导致统计行丢失（src/pages/dashboard/index.tsx）。
- 修复 Dashboard 收益字段解析：按字符串金额字段 `adRevenue`、`totalCost` 做数值转换并参与汇总，确保收入（流水-支出）计算正确（src/pages/dashboard/index.tsx, src/pages/dashboard/components/StatsOverviewCards.tsx）。
- 补充 Dashboard 收益链路调试日志：分别记录 today/month 请求入参、失败兜底分支、成功聚合结果，以及 render 层最终使用值，便于定位“接口有数据但页面显示为 0”的状态时序问题（src/pages/dashboard/index.tsx）。
- 调整 Dashboard 收益报表筛选字段：移除 `filters.appIds`，改为先由包名映射 `projectCode` 集合，再使用 `filters.projectCodes` 查询今日/本月收益（src/pages/dashboard/index.tsx）。
- 清理 Dashboard 收益排查临时日志：移除 request/render 调试输出与关联辅助状态，保留正式收益计算与筛选逻辑（src/pages/dashboard/index.tsx）。
