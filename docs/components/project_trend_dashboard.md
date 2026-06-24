# 项目趋势 Dashboard

## 组件位置

- 页面文件：`src/pages/report/project-trend/index.tsx`

## 用途

- 围绕单个 `projectCode` 查看时间范围内的数据变化趋势
- 补足项目报表更适合查表、不适合看趋势的问题

## 入口

- 项目报表 `projectCode` 列点击跳转
- 项目管理表格 `projectCode` 列点击跳转

该页面是隐藏路由，不在左侧菜单直接展示。

## 页面能力

- 顶部项目上下文展示：
  - `projectCode`
  - 项目当前投放状态标签
  - 项目当前限流状态标签（`isLimited` -> `限流 / 正常 / 未知`）
  - 项目基础信息
- 轻量筛选：
  - `projectCode`
  - `dateRange`，复用项目报表同一套快捷日期预设
  - `country`
- 趋势分析区：
  - KPI 卡片
  - 收益趋势
  - 用户趋势
  - 广告漏斗量级趋势
  - 广告效率趋势
  - 成本结构趋势
  - 变现质量趋势
  - 国家贡献排行与国家收益趋势下钻

## 数据来源

- 继续复用 `queryProjectReport`
- 主趋势：`groupBy: ['reportDate']`
- 国家排行：`groupBy: ['country']`
- 国家下钻：`groupBy: ['reportDate', 'country']`

## 参数约定

- 路由：`/report/project-trend`
- query 参数：
  - `projectCode`
  - `dateFrom`
  - `dateTo`
  - `adStatus`
  - `country`
  - `from`

其中 `adStatus` 继续兼容保留在 URL 中，但 Dashboard 页面不再将它用于数据查询过滤。
若跳转进入时仅携带 `dateFrom` 或仅携带 `dateTo`，或两者是同一天，页面会回退为最近 7 天，避免趋势口径过窄或单边日期导致口径不稳定。

`from` 用于返回路径判定，当前支持：
- `report-project`
- `project-table`

## 展示约定

- KPI 标题不再携带“区间”前缀
- 金额保留 2 位小数
- 比例字段按百分比展示
- `roi` 前端按 `roi * 100` 展示
- `trafficCostRatio` 为接口返回小数，前端展示时乘以 `100`
- `dauUsers` 不展示区间求和，页面使用“最新 / 平均 DAU”
- 所有多序列折线图使用显式颜色映射，避免不同系列退化为同一颜色
- 折线图线条统一略微加粗，提升多指标趋势对比可读性
- 成本结构趋势图同样对 `投放成本 / 流量花费` 使用显式分色，避免堆叠面积图颜色混同
- 国家贡献排行仅展示贡献值大于 `0` 的国家，隐藏 `0` 或负值国家，减少无效干扰

## 注意事项

- 项目报表跳转时，仍会透传当前 URL 中的 `adStatus`，但 Dashboard 会忽略该值，不作为筛选条件
- 页面头部保留项目当前投放状态标签，仅做只读展示，不参与查询
- 图表点击国家排行柱子后，会进入该国家的收益趋势下钻
