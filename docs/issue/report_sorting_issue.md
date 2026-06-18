# User Report 排序问题复盘

## 背景

- 模块：`用户上报报表`，基于 `UniversalReportTable`
- 场景：动态维度 / 指标列 + 服务端排序（`orderBy` / `orderDirection`）

## 问题现象

- 点击列头后，请求参数正确，例如 `orderBy=hour`、`orderDirection=asc`
- 但表头排序图标没有高亮，看起来像“未排序”
- 再次点击同一列时，方向切换不稳定，容易表现成一直是 `asc`

## 根因

- 动态列的 `key` 与排序字段没有严格对齐，导致 `sorter.field/columnKey` 无法稳定匹配当前列
- 排序状态虽然通过请求参数传到了后端，但前端没有把受控 `sortOrder` 回填到正确列上
- 视图恢复排序时，如果仍按页面各自处理 `sorter`，很容易出现恢复成功但图标不高亮的残留问题

## 解决方式

- 统一在 `UniversalReportTable` 内部处理排序状态，继续以 `ProTable.onChange` 作为唯一排序入口
- 动态列统一用同一套列身份标识计算 `key` / `sortField`，并同时兼容 `sorter.field` 与 `sorter.columnKey`
- 通过受控 `sortOrder` 精确回填当前排序列，确保点击排序与恢复视图排序两条链路都能正确高亮

## 补充：视图恢复排序与视图变更提示

### 新增场景

- 选中已保存视图后，需要恢复该视图保存时的排序状态，并让表头排序图标正确高亮
- 选中视图后，如果修改了筛选条件、维度、指标、排序或列设置，需要明确提示“视图变更，未保存”
- 点击 `更新` 时，不仅要覆盖保存当前视图，还要把尚未应用的查询条件同步生效

### 补充处理

- 统一在 `UniversalReportTable` 内部恢复视图排序状态，避免页面侧分别处理 `sorter.field/columnKey`
- 视图变更检测按完整视图快照比较：`query`、`dimensions`、`visibleFilterDimensions`、`metrics`、`sorter`、`columnsStateMap`
- 视图基线比较复用 `transformViewQuery`，确保相对日期视图在恢复后不会被误判为“已变更”
- 点击 `更新` 时仅在草稿查询条件 / 维度与当前已应用状态不一致时触发查询，避免只改排序或列配置时产生重复请求

## 补充：统计行顺序未跟随列设置

### 新增现象

- 项目汇总报表开启“当前页合计 / 总数据合计”后，主表列已按拖拽顺序变化，但统计行仍按固定顺序展示

### 根因

- 主表列顺序主要由 `ProTable` 基于 `columnsStateMap.order` 内部处理
- 统计行则在组件内部再次基于 `activeColumns + columnsStateMap` 重新推导可见列顺序
- 两条链路没有共享同一份最终列布局，动态列场景下容易出现主表已变、统计行未变的错位

### 解决方式

- 在 `UniversalReportTable` 内部统一构造“最终列布局描述”，先合并列身份信息，再合并 `columnsStateMap` 中的 `show/order/fixed`
- `ProTable.columns` 与统计行都从这份统一列布局派生，确保列拖拽、隐藏/显示、恢复视图后三者顺序一致
- 固定列场景还需要按 `left / normal / right` 重排统计行列布局；合计文案不能固定覆盖第一个视觉列，否则 ROI 等指标固定到首列时会丢失对应合计值

### 影响范围

- 所有使用 `UniversalReportTable` 且开启统计行的报表页

### 相关文件

- `src/components/report/UniversalReportTable.tsx`
- `docs/components/universal_report.md`

## 下次同类问题优先排查

1. 先看 Ant Table / ProTable 的排序回调是否处于受控模式
2. 再看动态列 `key`、`dataIndex`、`sorter.field/columnKey` 是否是一一映射
3. 最后再看页面层对后端排序字段的映射，例如 camelCase 到 snake_case 的转换是否正确

## 相关文件

- `src/components/report/UniversalReportTable.tsx`
- `src/components/report/ViewManager.tsx`
- `src/pages/report/user-report-admin/tabs/BaseUserReportTab.tsx`
