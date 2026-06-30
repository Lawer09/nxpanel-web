# 项目趋势 Dashboard 问题记录

## Dashboard 查询口径与展示收敛

### 出现场景

项目趋势 Dashboard 从项目报表和项目管理跳转进入后，顶部筛选、趋势图颜色和国家排行交互持续扩展，容易出现筛选口径不透明、图表区分度不稳定和不必要的重复请求。

### 问题原因

- `adStatus` 一度在 URL 中透传，又继续参与 Dashboard 隐式过滤，导致页面口径不透明。
- 多序列折线图依赖默认主题推断颜色，在部分配置组合下会退化成相同颜色。
- 国家排行指标切换原本与整页请求链路耦合，导致切一次指标就刷新整个 Dashboard。

### 解决方式

- Dashboard 彻底移除 `adStatus` 查询过滤，仅保留页头只读展示。
- 折线图和成本结构图都改为显式颜色映射。
- 国家排行改为本地重算，且 `< 0.1%` 的国家合并到 `其他`。

### 影响范围

- `src/pages/report/project-trend/index.tsx`
- `docs/components/project_trend_dashboard.md`

## 小时模式筛选不应自动查询

### 出现场景

项目趋势 Dashboard 增加小时粒度后，如果仍沿用“筛选一变就自动查询”，用户在调整时间范围时会频繁触发请求，尤其不适合跨天小时范围的分析场景。

### 问题原因

- 小时分析通常需要精确选择起止时间，例如“昨日 08:00 到今日 06:00”。
- 原先拆分为“日期范围 + 小时下拉”的交互不直观，而且任一控件变化都会立即打断当前图表阅读。

### 解决方式

- 小时模式改为单个带小时的时间范围选择器，统一表达开始时间和结束时间。
- 页面内部将查询状态拆分为：
  - `draftQuery`：绑定筛选草稿
  - `appliedQuery`：控制真实请求和 URL
- 用户只有点击 `查询` 按钮后，才会真正刷新 Dashboard 数据。

### 影响范围

- `src/pages/report/project-trend/index.tsx`
- `src/pages/report/project-trend/components/TrendDashboardHeader.tsx`
- `src/pages/report/project-trend/utils.ts`

### 相关文件

- `src/pages/report/project-trend/index.tsx`
- `src/pages/report/project-trend/components/TrendDashboardHeader.tsx`
- `docs/components/project_trend_dashboard.md`
