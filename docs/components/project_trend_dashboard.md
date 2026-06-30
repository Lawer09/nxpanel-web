# 项目趋势 Dashboard

## 组件位置

- 页面文件：`src/pages/report/project-trend/index.tsx`

## 用途

- 围绕单个 `projectCode` 查看时间范围内的趋势变化
- 补足项目报表表格不适合看趋势的问题

## 入口

- 项目报表 `projectCode` 列点击跳转
- 项目管理列表 `projectCode` 列点击跳转

该页面为隐藏路由，不出现在左侧菜单。

## 页面能力

- 顶部上下文展示：
  - `projectCode`
  - 当前投放状态标签
  - 项目基础信息
- 轻量筛选：
  - `projectCode`
  - `granularity`：`日 / 小时`
  - `dateRange`
    - 日模式：使用项目报表同一套快捷日期预设
    - 小时模式：切换为带小时的时间范围选择器，可直接选如“昨日 08:00 到今日 06:00”
  - `查询` 按钮：筛选修改后先停留在草稿态，点击后才真正查询
- 趋势分析区：
  - KPI 卡片
  - 收益趋势
  - 广告收益对比趋势
  - 用户趋势
  - 广告漏斗量级趋势
  - 广告效率趋势
  - 成本结构趋势
  - 变现质量趋势
  - 国家贡献排行

## 数据来源

- 日模式使用 `queryProjectReport`
- 小时模式使用 `queryProjectHourlyReport`
- Dashboard 查询会默认补入 `projectCode`
- 日模式主趋势：`groupBy: ['projectCode', 'reportDate']`
- 小时模式主趋势：`groupBy: ['projectCode', 'reportDate', 'hour']`
- 国家排行：
  - 日模式：`groupBy: ['projectCode', 'country']`
  - 小时模式：`groupBy: ['projectCode', 'country']`
- 国家排行仅在 `projectCode / dateRange / granularity` 变化时重新请求，切换排行指标只做前端本地重算

## 参数约定

- 路由：`/report/project-trend`
- query 参数：
  - `projectCode`
  - `dateFrom`
  - `dateTo`
  - `adStatus`
  - `granularity`
  - `hourFrom`
  - `hourTo`
  - `from`

说明：

- `adStatus` 仍兼容保留在 URL 中，但 Dashboard 不再用它过滤数据。
- 若跳转只携带单边日期，或起止为同一天，则回退为最近 7 天。
- `granularity=hour` 时进入小时模式，默认使用最近两天数据。
- 小时模式下，前端用一个带小时的时间范围选择器映射：
  - 开始时间 -> `dateFrom + hourFrom`
  - 结束时间 -> `dateTo + hourTo`
- 切回日模式时，会恢复用户上一次使用的日报日期范围。
- URL 只跟随“已应用查询状态”变化，不跟随筛选草稿即时变化。
- `from` 目前支持：
  - `report-project`
  - `project-table`

## 展示约定

- KPI 标题不再带“区间”字样
- `广告收入` 卡片：
  - 主值展示 `adRevenue`
  - 主值右上角展示 `AdRevenueNow / AdRevenue` 比例，保留 1 位小数
  - 主值下方展示 `最新收入（差值）`
  - tooltip 文案为 `最新收入（广告收益差值）`
- `roi` 前端按 `roi * 100` 展示
- `trafficCostRatio` 前端按百分比展示
- `dauUsers` 使用“最新 / 平均 DAU”
- 多序列折线图显式指定颜色映射，并统一略微加粗线条
- 成本结构趋势图显式区分 `投放成本 / 流量花费`
- 小时模式下，所有趋势图统一使用“日期 + 小时”作为横轴，例如 `06-30 13:00`
- 国家贡献排行：
  - 仅展示贡献值 `> 0` 的国家
  - 当前指标占比 `< 0.1%` 的国家合并为 `其他`
- 国家下钻已移除，仅保留国家贡献排行

## 实现说明

- 页面已拆分为：
  - `TrendDashboardHeader`
  - `TrendKpiGrid`
  - `TrendChartCard`
  - `data.ts / utils.ts / types.ts / constants.ts`
- 页面内部区分两套状态：
  - `draftQuery`：绑定筛选控件
  - `appliedQuery`：用于发请求和同步 URL

## 注意事项

- 小时模式下不再使用单独的 `开始小时 / 结束小时` 下拉框。
- 筛选调整后不会自动刷新，必须点击 `查询`。
- 小时范围校验为“开始时间不能晚于结束时间”。
