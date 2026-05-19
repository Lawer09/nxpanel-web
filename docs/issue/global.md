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
