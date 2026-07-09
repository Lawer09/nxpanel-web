# 项目小时汇总查询接口

## 基本说明

- 管理端查询路径：`POST /api/v3/{secure_path}/report/project/hourly/query`
- 控制器：`App\Http\Controllers\V3\Admin\ReportController`
- Service：`App\Services\ProjectReportService`

项目小时汇总复用项目日报的大部分指标与伴随项目元数据，额外返回 `hour` 维度，并支持按小时范围过滤。

## 请求参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| dateFrom | string | 否 | 开始日期，默认昨天 |
| dateTo | string | 否 | 结束日期，默认今天 |
| hourFrom | int | 否 | 开始小时，`0-23` |
| hourTo | int | 否 | 结束小时，`0-23` |
| groupBy | string[] | 否 | 分组维度：`reportDate`、`hour`、`projectCode`、`country` |
| filters.projectCodes | string[] | 否 | 项目代号筛选 |
| filters.countries | string[] | 否 | 国家筛选，服务端统一转大写 |
| filters.adStatuses | string[] | 否 | 投放状态筛选，仅过滤不返回 |
| filters.appPlatforms | string[] | 否 | 应用平台筛选，仅过滤不返回 |
| filters.departments | string[] | 否 | 部门筛选，仅过滤不返回 |
| page | int | 否 | 默认 `1` |
| pageSize | int | 否 | 默认 `50`，最大 `400` |
| orderBy | string | 否 | 支持维度字段和日报同款指标字段 |
| orderDirection | string | 否 | `asc` 或 `desc`，默认 `desc` |

## 返回字段

- 小时报表返回字段与项目日报保持一致，并额外返回 `hour`
- 当返回行包含唯一 `projectCode` 时，会附带项目元数据字段，例如 `adStatus`、`appPlatform`、`appName`、`packageName`
- 当 `groupBy` 不包含某个维度时，该维度字段返回 `null`
- 若返回伴随字段 `hourly_status`，前端会在项目编码列右侧展示单个 `异常` Tag；悬浮后按位展示原因：
  - `1 = 无小时请求`
  - `2 = 无小时用户新增`
  - `3 = 同时展示两个原因`
- `限流` Tag 在项目报表/项目小时汇总中始终展示，并按最近 12 小时状态使用三色语义：
  - 绿色：最近 12 小时均未发生限流
  - 黄色：最近 12 小时存在限流，但当前未限流
  - 红色：当前正在限流
- 前端会在 `限流` Tag 悬浮层中始终展示最近 12 小时广告匹配率迷你图，并以 `70%` 参考线辅助判断；若后端未返回该字段，则展示空态图表
- 点击 `限流` Tag 后，前端会按当前已选日期范围调用 `POST /v3/report/project/hourly/ad-match-rate`，并在弹窗中展示可手动切换日期范围的小时匹配率图表详情；弹窗不再展示下方明细列表
- 若返回伴随字段 `topRevenueCountries`，前端会在 `广告收入` 列补充展示 TOP 收益国家；悬浮后展示完整国家收益列表，格式为 `国家 / 收益 / 占比`

## 前端配合说明

- 页面路由：`/report/project-hourly`
- 菜单名称：`项目小时汇总`
- 页面复用项目日报的大部分指标列、项目编码状态标签和平台/投放状态伪维度列
- 小时报表筛选：
  - 支持日期范围
  - 支持选择单个小时，也支持清空后查询全天小时
  - 默认小时为当前时间的上一个小时
- “同步小时数据”使用独立弹窗，不直接复用筛选栏条件
- `adStatuses`、`appPlatforms`、`departments` 仅作为筛选条件使用，不进入后端 `groupBy`

## 2026-07-02 补充

- `filters` 现已支持排除结构：

```json
{
  "filters": {
    "projectCodes": ["A001"],
    "countries": ["US"],
    "exclude": {
      "projectCodes": ["A002", "A003"],
      "countries": ["BR", "IN"]
    }
  }
}
```

- `filters.exclude.projectCodes`：项目代号排除筛选
- `filters.exclude.countries`：国家排除筛选，前端仍按大写口径归一化
- 项目小时汇总页前端已使用单个多选控件同时维护包含和排除：
  - 新选择的值默认进入包含
  - 已选 tag 可在包含/排除之间切换
  - 同一个值不会同时存在于包含和排除中
