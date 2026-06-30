# 项目小时汇总查询接口

## 基本说明

- 管理端查询路径：`POST /api/v3/{secure_path}/report/project/hourly/query`
- 控制器：`App\Http\Controllers\V3\Admin\ReportController`
- Service：`App\Services\ProjectReportService`

项目小时汇总复用项目日报的大部分指标与伴随项目元数据，只新增小时维度与小时筛选。

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
| page | int | 否 | 默认 `1` |
| pageSize | int | 否 | 默认 `50`，最大 `400` |
| orderBy | string | 否 | 支持维度字段和项目日报同款指标字段 |
| orderDirection | string | 否 | `asc` 或 `desc`，默认 `desc` |

## 返回字段

- 小时报表返回字段与项目日报保持一致，并额外返回 `hour`
- 当返回行包含唯一 `projectCode` 时，会附带项目元数据字段，例如 `adStatus`、`appPlatform`、`appName`、`packageName`
- 当 `groupBy` 不包含某个维度时，该维度字段返回 `null`
- 接口若返回伴随字段 `hourly_status`，前端会在项目编码列右侧展示单个 `异常` Tag；悬浮后按位显示具体原因：`1=无小时请求`、`2=无小时用户新增`，`3` 时同时展示两个原因

## 前端配合说明

- 页面路由：`/report/project-hourly`
- 前端菜单名：`项目小时汇总`
- 页面复用项目日报的大部分指标列、项目编码状态标签和平台/投放状态伪维度列
- 前端额外增加：
  - `小时` 维度列
  - 小时报表筛选项支持选择单个小时，也支持清空后按全部小时查询；默认当天的上一小时
  - “同步小时数据”按钮，使用独立弹窗收集同步参数，不直接复用筛选栏条件
  - 同步弹窗默认值：日期范围为今天、开始/结束小时均为上一小时、项目编号为空；小时支持指定范围或清空
- `adStatuses`、`appPlatforms` 仍仅作为筛选条件使用，不进入后端 `groupBy`
