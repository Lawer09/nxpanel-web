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
- `src/pages/traffic-platform/dashboard/components/PlatformManageModal.tsx`
- `src/pages/traffic-platform/dashboard/components/SyncTaskModal.tsx`
- `src/pages/traffic-platform/dashboard/components/UsageDataTabs.tsx`

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
