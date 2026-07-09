### 过时方法
destroyOnClose 过时， 使用 destroyOnHidden 代替
bodyStyle 过时，使用 styles.body代替

### ModalForm / ProForm 内不能使用 React Fragment 作为直接子元素
ModalForm 内部会尝试向第一个子元素传递 `autoFocus` 属性，而 React Fragment 不支持 `autoFocus`，会导致控制台警告：
```
Invalid prop `autoFocus` supplied to `React.Fragment`.
```
**解决方式**：将 Fragment `<>` 替换为 `<div>` 包裹。例如：
```tsx
// ❌ 错误
<ModalForm>
  <>
    <ProFormText ... />
  </>
</ModalForm>

// ✅ 正确
<ModalForm>
  <div>
    <ProFormText ... />
  </div>
</ModalForm>
```

## ProLayout 菜单路由名与国际化 key 不一致

### 出现场景

Ant Design Pro 的左侧菜单使用中文 `route.name`，但 `src/locales/*/menu.ts` 里只维护了英文风格的 key，例如只定义了 `menu.asset.*`，未定义 `menu.资源资产.*`。

### 问题原因

ProLayout 会基于实际路由名拼接菜单国际化 key。若路由配置中的 `name` 是 `资源资产 / SSH 密钥 / 脚本 / 操作记录` 这类中文值，运行时会去查找 `menu.资源资产.SSH 密钥` 等 key；若 locale 文件只保留另一套命名，就会在控制台持续报 `[React Intl] Missing message`。

### 解决方式

保证 `config/routes.ts` 中实际使用的 `name` 与 `src/locales/*/menu.ts` 中的 key 一一对应；若历史上已存在 `menu.asset.*` 这类别名，可同时保留两套 key 兼容旧代码与现有路由。

### 影响范围

所有依赖 ProLayout 自动菜单国际化的路由配置，尤其是使用中文 `name` 的菜单分组和子页面。

### 相关文件

- `config/routes.ts`
- `src/locales/zh-CN/menu.ts`
- `src/locales/en-US/menu.ts`

## Dashboard 分页结构误告警

### 出现场景

流量平台 Dashboard 首页加载 KPI 时，控制台出现 `Unexpected data structure: {pageSize: Array(1)}` 告警。

### 问题原因

部分接口在特定条件下会返回仅包含分页元信息的对象，或将分页数组嵌套在不同字段中；旧的 `getPageInfo` 仅识别固定结构，导致误判为异常。

### 解决方式

扩展分页解析逻辑，兼容 `data/list/rows/items`、嵌套分页对象，以及仅含分页元信息的对象；仅在真正未知结构时输出告警。

### 影响范围

流量平台 Dashboard 的 KPI 数据聚合解析。

### 相关文件

- `src/pages/traffic-platform/dashboard/DashboardContext.tsx`

## Traffic Dashboard KPI 取值为 0

### 出现场景

流量平台 Dashboard 中「账号数量」「今日流量」卡片显示为 0，但接口侧有数据。

### 问题原因

KPI 取数与接口文档存在细节偏差：
- 日流量查询未显式传递空维度参数（`geo` / `externalUid`）。
- 流量换算未兼容仅返回 `trafficBytes` 的场景。
- 分页统计未兼容 `totalCount` 字段。

### 解决方式

按 `docs/api/traffic_platform_platforms_api.md` 对齐请求与解析：
- 日流量请求补齐 `geo`、`externalUid`（空字符串作为空维度）。
- `toGb` 增加 `trafficBytes` 到 GB 的换算兜底。
- 分页 `total` 解析增加 `totalCount` 兼容。

### 影响范围

流量平台 Dashboard KPI 卡片数据计算。

### 相关文件

- `src/pages/traffic-platform/dashboard/DashboardContext.tsx`

## 流量趋势图 Tooltip 值显示错误

### 出现场景

流量平台 Dashboard 的流量趋势图，鼠标悬浮点位时，Tooltip 两行都显示日期，未正确展示流量值。

### 问题原因

趋势图使用默认 Tooltip 字段映射，在当前数据形态下展示了横轴字段；同时流量值解析对字段兼容不足，导致提示值不稳定。

### 解决方式

在趋势图中显式指定 Tooltip 的 `title` 与 `formatter`，固定展示“日期 + 流量(GB)”；并补充 `trafficMb/trafficGb/trafficBytes` 数值兜底解析。

### 影响范围

流量平台 Dashboard 趋势图交互提示展示。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/TrafficTrendChart.tsx`

## React 19 useRef 泛型初始化导致的编译错误

### 出现场景

流量平台 Dashboard 的多个 ProTable 弹窗组件在执行 `tsc` 时出现 `TS2554: Expected 1 arguments, but got 0`。

### 问题原因

React 19 类型定义下，`useRef<T>()` 需要显式传入初始值；旧写法在当前类型系统中不再通过。

### 解决方式

将 `useRef<ActionType>()` 统一改为 `useRef<ActionType | undefined>(undefined)`，保持与 ProTable `actionRef` 类型兼容。

### 影响范围

流量平台 Dashboard 相关表格组件的 TypeScript 编译。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/AccountManageModal.tsx`

## 代理流量账号标签编辑入口

### 出现场景

代理流量账号管理需要维护账号标签，并支持在列表中快速查看和编辑标签，而不应每次都进入完整账号编辑流程。

### 问题原因

账号标签属于轻量元数据，若仅依赖主编辑弹窗保存，会让“查看标签”和“只改标签”两个常见动作路径过长，也不利于按标签快速修订账号状态标记。

### 解决方式

在账号管理表格中新增标签列，直接展示 `tags`；点击任一标签或“添加标签”占位即可打开独立标签弹窗，同时在操作列增加“更新标签”入口，调用 `/accounts/update-tags` 单独保存。

### 影响范围

代理流量账号管理表格的标签展示与标签维护操作。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/AccountManageModal.tsx`
- `src/services/traffic-platform/api.ts`
- `src/services/traffic-platform/typings.d.ts`
- `src/pages/traffic-platform/dashboard/components/PlatformManageModal.tsx`
- `src/pages/traffic-platform/dashboard/components/SyncTaskModal.tsx`
- `src/pages/traffic-platform/dashboard/components/UsageDataTabs.tsx`

## ProTable 多选批量操作需要显式清理选中态

### 出现场景

在代理流量账号管理表格中新增批量更新标签、批量禁用这类多选操作后，如果提交成功后不主动清空 `selectedRowKeys`，表格刷新后仍会保留上一轮选中态，容易让用户误以为当前批量操作对象没有变化。

### 问题原因

`ProTable` 的 `rowSelection` 在受控模式下由外部状态驱动；仅调用 `actionRef.current?.reload()` 不会自动重置选中项。

### 解决方式

批量操作成功后同时执行数据刷新和 `setSelectedRowKeys([])`，并在批量标签弹窗关闭时清理批量编辑上下文，避免单个账号编辑和批量编辑状态串用。

### 影响范围

所有使用 `ProTable` 受控多选并带批量操作按钮的页面或弹窗。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/AccountManageModal.tsx`

## 流量接口响应结构与类型声明不一致导致的编译错误

### 出现场景

`TrafficRankingCard` 与 `TrafficTrendChart` 在 `tsc` 中出现 `Property 'data' does not exist on type '...[]'`。

### 问题原因

接口类型声明是 `ApiResponse<T[]>`，但运行时部分场景返回 `ApiResponse<{ data: T[] }>`；直接访问 `res.data?.data` 会触发类型冲突。

### 解决方式

使用 `Array.isArray(res.data)` 先判断数组直返，再兼容包装对象中的 `data` 字段。

### 影响范围

流量平台 Dashboard 趋势图与排行卡片的数据解析与类型检查。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/TrafficRankingCard.tsx`
- `src/pages/traffic-platform/dashboard/components/TrafficTrendChart.tsx`

## 弹窗提交前子组件编辑值未同步

### 出现场景

父级弹窗点击确定时，先调用子组件 `commit()` 再立即组装接口 payload。如果 `commit()` 只调用 `setState`，父组件可能仍读取旧的 JSON 状态。

### 问题原因

React state 更新是异步提交的，父组件在同一个事件流程内无法保证读取到子组件刚写入的新 state。

### 解决方式

让子组件 `commit()` 返回最终编辑值，父组件提交接口时直接使用返回值组装 payload，同时再更新本地 state 供 UI 后续展示。

### 影响范围

包含子组件 JSON/表单编辑器并由父级弹窗统一提交的页面。

### 相关文件

- `src/pages/dev/components/JsonConfigEditor.tsx`
- `src/pages/dev/components/NodeFormModal.tsx`
- `src/pages/dev/components/TemplateFormModal.tsx`

## 自动化策略弹窗视觉层级不足

### 出现场景

自动化策略配置弹窗已具备功能，但界面层级偏弱，模块切换、规则选择和右侧编辑区辨识度不高，整体观感不够“控制台化”。

### 问题原因

旧版布局偏线性表单，缺少固定区块和信息密度分层；模块区、概览区、规则区和详情区的视觉对比与交互反馈不足。

### 解决方式

重构自动化策略弹窗为卡片化控制台布局：
- 采用 88vh 固定高度 + 头部/模块/概览/底栏固定。
- 主体改为左 32% 规则列表、右 68% 详情编辑双滚动结构。
- 新增模块卡片选择区与模块级概览统计。
- 右侧详情改为 40/60 双列分组卡片（基础信息、作用范围、条件、动作、执行控制、最近执行记录）。
- 强化状态色、选中态和失败态视觉反馈。

### 影响范围

全局顶部入口的自动化策略配置弹窗交互与视觉呈现。

### 相关文件

- `src/components/AutomationRulesEntry.tsx`

## 自动化规则接口字段命名兼容

### 出现场景

自动化规则弹窗在加载规则详情和列表时，部分规则显示为空（作用范围、条件、动作丢失），或复制规则后结构不完整。

### 问题原因

`automation-rules` 接口在不同场景下同时存在两套字段命名：
- 列表/详情可能返回 `targetScopeJson`、`conditionsJson`、`actionsJson`
- 提交与部分响应使用 `targetScope`、`conditions`、`actions`

前端若只按单一命名读取，会造成回显和编辑不一致。

### 解决方式

在规则数据进入 UI 前统一做归一化：
- `targetScope = targetScope ?? targetScopeJson ?? {}`
- `conditions = conditions ?? conditionsJson ?? []`
- `actions = actions ?? actionsJson ?? []`

并在详情、列表、复制、保存链路复用同一归一化结果。

### 影响范围

自动化策略弹窗的规则回显、编辑、复制和保存稳定性。

### 相关文件

- `src/components/AutomationRulesEntry.tsx`

## Dashboard 收益日志有值但页面显示 0

### 出现场景

Dashboard 顶部“今日收益 / 本月收益”卡片排查时，请求日志中 `response:success` 已返回非 0 聚合结果，但同一时间段 render 日志仍显示 `todayForRender/monthForRender` 为 0。

### 问题原因

收益请求返回与页面渲染不在同一时刻：
- 请求成功日志代表异步请求函数已完成计算。
- 页面显示依赖 React state 提交后的下一次 render。
- 在 state 提交前的中间 render 仍会读取旧值或兜底值（0），开发环境下 StrictMode 会放大该现象。

### 解决方式

- 将今日/月收益请求并入同一 `useEffect` 内，通过 `Promise.all` 同步获取后一次性写入 state，减少分散更新导致的观测错位。
- 增加请求-渲染链路日志（`request:start`、`response:success`、`state:applied`、`render_values`）并附带 `requestId`，用于确认“哪次请求结果实际进入渲染态”。

### 影响范围

Dashboard 收益卡片的数据可观测性与调试定位效率。

### 相关文件

- `src/pages/dashboard/index.tsx`

## 自动化规则 project_aggregate 模块字段约束

### 出现场景

自动化规则新增 `module=project_aggregate` 后，若沿用 `traffic_platform` 的目标范围和动作结构，会导致创建/更新失败或执行行为不符合预期。

### 问题原因

`project_aggregate` 有独立的模块约束：
- `targetType` 固定为 `project_daily_aggregate`
- `targetScope` 使用 `projectCodes`（而非 `accountIds/platformCodes`）
- 可用动作包含 `webhook`，且包含签名/请求头等扩展字段

### 解决方式

在前端模块配置中单独增加 `project_aggregate`：
- 作用范围切换为项目编码远程多选
- 条件指标切换为项目聚合指标集合
- 动作增加 `webhook` 并补齐 `webhookUrl/headers/timeoutSeconds/signing` 表单与提交映射

### 影响范围

自动化策略弹窗中项目报表模块的规则创建、编辑、执行。

### 相关文件

- `src/components/AutomationRulesEntry.tsx`
- `src/services/automation-rules/typings.d.ts`

## 自动化规则 project_ad_revenue_hourly 模块字段约束

### 出现场景

自动化规则新增 `module=project_ad_revenue_hourly` 后，如果继续沿用 `traffic_platform` 或 `project_aggregate` 的默认目标范围、指标集合和手动运行目标映射，会导致创建规则、编辑规则或手动执行时参数不符合后端约束。

### 问题原因

`project_ad_revenue_hourly` 有独立的模块约束：
- `targetType` 固定为 `project_ad_revenue_hourly`
- `targetScope` 使用 `projectCodes`，并额外支持 `includeDisabled`
- `conditions.metric` 已收敛为上一完整小时广告收入统计字段，不再提供 `project_code`、`project_name`、`report_hour`、`has_data`
- 数值类条件操作符较旧版增加，需要同步放宽前端可选集合
- 手动运行 `targetIds` 对应 `project_code`

### 解决方式

在前端自动化模块配置中单独增加 `project_ad_revenue_hourly`：
- 作用范围复用项目编码远程多选，并补充 `includeDisabled`
- 条件指标切换为 `automation_rules_api.md` 第 11 节定义的小时广告收入统计指标集合
- 数值指标操作符扩展为 `eq/neq/gt/gte/lt/lte/in/not_in/between`
- 手动执行时改为从 `targetScope.projectCodes` 生成 `targetIds`

### 影响范围

自动化策略弹窗中 `project_ad_revenue_hourly` 模块的规则创建、编辑、试运行与正式执行。

### 相关文件

- `src/components/AutomationRulesEntry.tsx`
- `docs/components/automation-rules-entry.md`

## 系统队列监控接口返回结构不稳定

### 出现场景

系统管理新增任务队列监控页时，需要同时消费 `getQueueStats`、`getQueueWorkload`、`getQueueMasters`、`getHorizonFailedJobs` 和 `getSendWebhookTasks` 多组接口。

### 问题原因

系统接口在文档与项目现有公共类型之间存在差异：
- 项目大多数接口使用 `code/msg/data`
- 队列 API 文档描述为 `status/message/data`
- `wait`、`workload`、`masters` 等字段在不同实现下可能返回对象、数组或嵌套包装结构

如果页面直接按单一结构读取，监控页很容易因为某一组数据形态变化而整块渲染失败。

### 解决方式

在队列监控页中统一增加宽松解析层：
- 业务成功判断同时兼容 `code===0|200` 与 `status==='success'|'ok'`
- `wait` 快照统一归一化为 `{ queue, wait }[]`
- `workload` / `masters` 同时兼容数组直返、`data` 包装和对象映射结构
- 单接口失败时保留其他已成功数据，并通过页面告警提示“部分监控数据加载失败”

### 影响范围

系统管理下的任务队列监控页面，以及后续复用这些系统监控接口的页面。

### 相关文件

- `src/pages/system/queue-monitor/index.tsx`
- `src/services/system/api.ts`
- `src/services/system/typings.d.ts`

## 流量平台汇总字段命名变更

### 出现场景

流量平台 Dashboard 的日流量汇总、月流量汇总和小时流量数据接口字段从 `statDate/statMonth/statHour` 调整为 `reportDate/reportMonth/reportHour` 后，前端表格列与类型声明如果仍沿用旧字段，会出现日期列为空或行 key 不稳定的问题。

### 问题原因

前端流量平台模块直接使用接口返回字段渲染，没有统一的字段映射层；一旦接口命名调整，页面列配置、类型声明和文档需要同步更新。

### 解决方式

将流量平台 typings、表格列和接口文档统一切换到 `reportDate/reportMonth/reportHour`，同时保留旧字段兜底读取，避免联调切换期间页面异常。

### 影响范围

流量平台 Dashboard 的小时流量明细、日流量汇总、月流量汇总，以及相关接口文档。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/UsageDataTabs.tsx`
- `src/services/traffic-platform/typings.d.ts`
- `docs/api/traffic_platform_api.md`
- `docs/api/traffic_platform_platforms_api.md`

## 项目汇总报表总计行接入 summary 字段
### 出现场景

项目汇总报表接口 `/api/v3/admin/report/project/query` 在分页数据 `data` 之外新增 `summary` 字段，用于返回当前筛选条件下各统计指标的总计值；如果前端仍只渲染列表数据，就无法展示“总数据合计”行。

### 问题原因

`UniversalReportTable` 之前的总计行能力主要依赖当前页本地汇总或额外的 `fetchGrandTotals` 请求，未直接消费 `fetchData` 返回体中的 `summary`，导致已有项目报表页面不能直接接入后端新增总计字段。

### 解决方式

扩展 `UniversalReportTable` 的 `fetchData` 返回结构，允许页面直接返回 `summary`；在开启 `showGrandSummary` 时优先使用该字段渲染“总数据合计”行，并兼容数值、数值字符串和空值格式化显示。项目汇总报表页同步接入接口返回的 `summary`。

### 影响范围

项目汇总报表页的总计行展示，以及后续复用 `UniversalReportTable` 且接口直接返回总计对象的报表页面。

### 相关文件

- `src/components/report/UniversalReportTable.tsx`
- `src/pages/report/project/index.tsx`
- `src/services/report/typings.d.ts`
- `docs/api/project-report-api.md`
- `docs/components/universal_report.md`

## Dev 临时认证与正式登录链路隔离

### 出现场景

Dev 模块接入 admin-service 菜单管理时，需要在未登录正式后台的情况下直接访问 `/dev/menus`，并在页面内使用临时管理员 JWT 登录。后续又将 Dev 管理登录提升到 `/user/login` 主登录页的 `管理` Tab，需要避免管理登录后的 Dev 菜单与运营后台菜单混杂。

### 问题原因

项目全局 `onPageChange` 会在没有 `initialState.currentUser` 时跳转 `/user/login`，全局 request 拦截器也会给普通接口追加 `auth_token` 和 `secure_path`。如果 Dev 的 `/v4/admin/*` 请求复用旧链路，会被错误改写或跳转；如果管理登录复用运营登录态，则 ProLayout 会同时渲染 Dev 与运营菜单，导致权限和入口混乱。

### 解决方式

对 `/dev` 路由放行全局未登录跳转，由 Dev 页面自己的 `DevAuthGate` 弹窗登录；全局 request 拦截器跳过全部 `/v4/*` 请求。Dev admin 接口使用独立 `fetch` 请求层和 Dev 专用 `sessionStorage`，不写入 `auth_token`、`secure_path`、`user_info`。主登录页增加 `运营` / `管理` Tab 后，通过 `API.CurrentUser.loginMode` 区分登录来源：`management` 只显示 `/dev` 菜单并默认进入 `/dev/nodes`，`operation` 隐藏 `/dev` 菜单并继续使用原业务后台。

### 影响范围

Dev 模块下的 admin-service 菜单管理页，以及后续新增的 `/v4/*` 开发联调接口。

### 相关文件

- `src/app.tsx`
- `src/requestErrorConfig.ts`
- `src/pages/user/Login.tsx`
- `src/components/RightContent/AvatarDropdown.tsx`
- `src/pages/dev/components/DevAuthGate.tsx`
- `src/services/dev-admin/request.ts`

## 登录页 CSS Modules 顶层 :global 样式泄漏

### 出现场景

在登录页 `src/pages/user/login.less` 中为了定制 Ant Design 的 `Input`、`Button`、`Form.Item` 样式，直接在文件顶层使用 `:global` 包裹 `.ant-*` 选择器。

### 问题原因

CSS Modules 中顶层 `:global` 会生成真正的全局样式，不会自动带上当前页面的局部类名作用域。这样登录页里对 `.ant-input`、`.ant-btn` 的定制会影响整个项目里所有 Ant Design 输入框和按钮。

### 解决方式

将所有 `:global` 的 Ant Design 选择器放到登录页局部容器类下，例如 `.container { :global { .ant-btn { ... } } }`，让这些样式只在登录页容器内部生效。

### 影响范围

所有使用 CSS Modules 且需要覆盖 Ant Design 全局类名的页面，尤其是单页登录、弹窗、设置面板等局部定制界面。

### 相关文件

- `src/pages/user/login.less`

## Ant Design Descriptions 列跨度告警

### 出现场景

在项目详情这类信息展示卡片中，`Descriptions` 设置了固定 `column`，但某一行 `Descriptions.Item` 的 `span` 总和与列数不一致时，控制台会出现 `Sum of column span in a line not match column of Descriptions` 告警。

### 问题原因

`Descriptions` 会按行累计每个 Item 的 `span`。如果一行累计值不是组件声明的 `column`，即使页面看起来还能渲染，也会持续输出告警。

### 解决方式

调整字段顺序或 `span` 配置，保证每一行的累计列数与 `column` 完全一致；不要依赖自动换行兜底。

### 影响范围

所有使用 Ant Design `Descriptions` 展示详情信息的页面和 Drawer。

### 相关文件

- `src/pages/project/components/ProjectDetail.tsx`

## guest/version/latest 刷新首屏重复请求

### 出现场景

浏览器刷新页面时，`/api/v3/guest/version/latest` 在短时间内连续发起多次请求，网络面板可见首屏出现 3 次拉取。

### 问题原因

首屏存在三处独立的版本查询逻辑：
- `HeaderVersionTitle` 挂载后拉取最新版本号
- `VersionNoticeModal` 挂载后拉取版本详情
- `layout.onPageChange` 首次进页时执行运行时版本检查

这三处都直接调用 `getLatestVersion`，原公共 service 层没有做进行中请求合并或短时缓存，因此同一次刷新会打出多条相同 GET 请求。

### 解决方式

在 `src/services/version/api.ts` 中为 `getLatestVersion` 增加“进行中请求共享 + 3 秒短缓存”。这样可以在不改动现有页面调用点的前提下，将同时消费最新版本的多处初始化请求收敛为单次实际网络调用。

### 影响范围

全局页顶版本号展示、版本发布弹窗以及页面切换时的运行时版本检查链路。

### 相关文件

- `src/services/version/api.ts`
- `src/app.tsx`
- `src/components/VersionNoticeModal/index.tsx`

## 代理流量账号列表流量分配误用广告账户

### 出现场景

在代理流量 Dashboard 的账号管理弹窗中，点击某个代理流量账号行的“流量分配”操作时，弹窗曾加载广告账户列表并将广告账户 ID 作为分配目标提交。

### 问题原因

`/v3/traffic-platform/traffic-allocations/create` 的 `accountId` 表示本地代理流量账号 ID，不应从广告账户列表派生。流量分配弹窗应基于代理流量账号列表提供选择，默认带出当前行，但仍允许切换到其他代理流量账号。

### 解决方式

流量分配弹窗不再加载广告账户列表，改为加载代理流量账号列表并默认选中当前行作为来源流量账号；目标用户固定为当前点击行，用户切换流量账号时只更新 `accountId`，不再改动 `targetUserId/targetUsername`。

### 影响范围

代理流量账号管理弹窗中的“流量分配”行操作。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/AccountManageModal.tsx`

## 代理流量分配需要基于主账号标签约束来源与目标

### 出现场景

代理流量账号管理新增标签筛选和“主账号”标签后，流量分配不再是任意账号之间可互相划转：主账号只能作为来源账号，普通账号只能作为目标账号，且来源账号还要和目标账号共享同一组业务标签。

### 问题原因

如果前端仅按“当前行可分配、来源账号全量可选”处理，会出现两类错误：
- 把带“主账号”标签的账号也当作可分配目标
- 让来源账号列表出现与当前目标账号标签不匹配的主账号

### 解决方式

在账号列表请求中增加 `tags[]` 筛选支持；账号管理表格增加默认“主账号”标签下拉。分配入口增加标签约束：
- 目标账号标签包含“主账号”时，直接禁用“流量分配”
- 来源账号列表仅拉取并展示同时包含“主账号”与目标账号全部标签的账号
- 目标账号没有标签时，来源账号列表直接置空

### 影响范围

代理流量账号管理表格筛选与流量分配弹窗。

### 相关文件

- `src/pages/traffic-platform/dashboard/components/AccountManageModal.tsx`
- `src/services/traffic-platform/api.ts`
- `src/services/traffic-platform/typings.d.ts`
