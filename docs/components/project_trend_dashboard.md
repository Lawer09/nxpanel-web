# 项目趋势 Dashboard

## 组件位置

- 页面文件：`src/pages/report/project-trend/index.tsx`

## 用途

- 围绕单个 `projectCode` 查看时间范围内的趋势变化
- 补足项目报表表格适合查数、不适合看趋势的问题

## 入口

- 项目报表 `projectCode` 列点击跳转
- 项目管理表格 `projectCode` 列点击跳转

该页面是隐藏路由，不在左侧菜单直接展示。

## 页面能力

- 顶部项目上下文展示：
  - `projectCode`
  - 当前投放状态
  - 项目基础信息
- 轻量筛选：
  - `projectCode`
  - `dateRange`
  - `adStatus`
  - `country`
- 趋势分析区：
  - KPI 卡片
  - 经营趋势
  - 用户趋势
  - 广告漏斗趋势
  - 广告效率趋势
  - 成本结构趋势
  - 变现质量趋势
  - 国家贡献排行与国家下钻趋势

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

其中 `from` 用于返回路径判定，当前支持：
- `report-project`
- `project-table`

## 展示约定

- 金额保留 2 位小数
- 比例字段按百分比展示
- `roi` 前端按 `roi * 100` 展示
- `trafficCostRatio` 为接口返回小数，前端展示时乘以 `100`
- `dauUsers` 不展示区间求和，页面使用“最新 / 平均 DAU”

## 注意事项

- 项目报表跳转时，优先继承当前“已生效”的筛选条件，而不是仅修改未查询的草稿条件
- 项目管理表格跳转时默认只带 `projectCode` 与当前行 `adStatus`
- 图表点击国家排行柱子后，会进入该国家的趋势下钻
