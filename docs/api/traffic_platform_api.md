# 流量代理相关接口（V3）

## 1. 基础信息

- 接口前缀：`/v3/`
- 管理端鉴权：需管理员登录态
- 统一返回：

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {}
}
```

---

## 2. 平台配置接口

### 2.1 平台列表

`GET /traffic-platform/platforms`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| enabled | int | 否 | 0/1 |
| keyword | string | 否 | 按 code/name 模糊搜索 |

### 2.2 新增平台

`POST /traffic-platform/platforms`

Body：

```json
{
  "code": "kkoip",
  "name": "KKOIP",
  "baseUrl": "https://www.kkoip.com",
  "enabled": 1
}
```

### 2.3 修改平台

`PUT /traffic-platform/platforms/{id}`

Body（可选字段）：

```json
{
  "name": "KKOIP",
  "baseUrl": "https://www.kkoip.com",
  "enabled": 1
}
```

### 2.4 启用/禁用平台

`PATCH /traffic-platform/platforms/{id}/status`

Body：

```json
{
  "enabled": 1
}
```

---

## 3. 平台账号接口

### 3.1 账号列表

`GET /traffic-platform/accounts`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| enabled | int | 否 | 0/1 |
| keyword | string | 否 | 按账号名/外部账号ID检索 |
| page | int | 否 | 默认1 |
| pageSize | int | 否 | 默认20，最大200 |

### 3.2 账号详情

`GET /traffic-platform/accounts/{id}`

### 3.3 新增账号

`POST /traffic-platform/accounts`

Body：

```json
{
  "platformCode": "kkoip",
  "accountName": "kkoip-main",
  "externalAccountId": "3494058",
  "credential": {
    "accessid": "3494058",
    "secret": "******"
  },
  "timezone": "Asia/Shanghai",
  "enabled": 1
}
```

### 3.4 修改账号

`PUT /traffic-platform/accounts/{id}`

Body（可选字段）：

```json
{
  "accountName": "kkoip-main",
  "externalAccountId": "3494058",
  "credential": {
    "secret": "******"
  },
  "timezone": "Asia/Shanghai",
  "enabled": 1
}
```

### 3.5 启用/禁用账号

`PATCH /traffic-platform/accounts/{id}/status`

Body：

```json
{
  "enabled": 1
}
```

### 3.6 测试账号连接

`POST /traffic-platform/accounts/{id}/test`

说明：用于测试账号连通与实时接口返回，不直接代表统计报表已入库。

---

## 4. 流量查询接口

### 4.1 小时流量明细

`GET /traffic-platform/usages/hourly`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| accountId | int | 否 | 平台账号ID |
| externalUid | string | 否 | 子账号ID；空维度请传空字符串 `""` |
| startTime | string | 否 | 开始时间（基于 `stat_time` 过滤） |
| endTime | string | 否 | 结束时间（基于 `stat_time` 过滤） |
| geo | string | 否 | 地区；空维度请传空字符串 `""` |
| page | int | 否 | 默认1 |
| pageSize | int | 否 | 默认50，最大200 |

返回字段（data 每项）包含：

- `platformAccountId`
- `platformCode`
- `externalUid`
- `externalUsername`
- `statTime`
- `statDate`
- `statHour`
- `statMinute`
- `geo`
- `region`
- `trafficBytes`
- `trafficMb`
- `accountName`

### 4.2 日流量汇总

`GET /traffic-platform/usages/daily`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| accountId | int | 否 | 平台账号ID |
| externalUid | string | 否 | 子账号ID；空维度请传空字符串 `""` |
| startDate | string | 否 | 开始日期 `YYYY-MM-DD` |
| endDate | string | 否 | 结束日期 `YYYY-MM-DD` |
| geo | string | 否 | 地区；空维度请传空字符串 `""` |
| page | int | 否 | 默认1 |
| pageSize | int | 否 | 默认50，最大200 |

返回字段（data 每项）包含：

- `statDate`
- `platformAccountId`
- `platformCode`
- `externalUid`
- `externalUsername`
- `geo`
- `region`
- `trafficBytes`
- `trafficMb`
- `trafficGb`（兼容字段，`trafficMb / 1024`）
- `accountName`

### 4.3 月流量汇总

`GET /traffic-platform/usages/monthly`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| accountId | int | 否 | 平台账号ID |
| externalUid | string | 否 | 子账号ID；空维度请传空字符串 `""` |
| startMonth | string | 否 | 开始月份 `YYYY-MM` |
| endMonth | string | 否 | 结束月份 `YYYY-MM` |
| page | int | 否 | 默认1 |
| pageSize | int | 否 | 默认50，最大200 |

返回字段（data 每项）包含：

- `statMonth`
- `platformAccountId`
- `platformCode`
- `externalUid`
- `externalUsername`
- `trafficBytes`
- `trafficMb`
- `trafficGb`（兼容字段）
- `accountName`

### 4.4 流量趋势

`GET /traffic-platform/usages/trend`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| accountId | int | 否 | 平台账号ID |
| externalUid | string | 否 | 子账号ID；空维度请传空字符串 `""` |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| dimension | string | 否 | `hour` / `day` / `month`，默认 `day` |

返回字段（data 每项）包含：

- `time`
- `trafficMb`
- `trafficGb`（兼容字段）

### 4.5 流量排行

`GET /traffic-platform/usages/ranking`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| rankBy | string | 否 | `account` / `external_uid` / `geo`，默认 `account` |
| limit | int | 否 | 默认20，最大100 |

返回字段（按 rankBy 不同）包含：

- `account` 维度：`platformAccountId`, `platformCode`, `trafficMb`, `trafficGb`, `accountName`
- `external_uid` 维度：`platformAccountId`, `platformCode`, `externalUid`, `externalUsername`, `trafficMb`, `trafficGb`, `accountName`
- `geo` 维度：`geo`, `region`, `trafficMb`, `trafficGb`

---

## 5. 同步接口

### 5.1 手动触发同步

`POST /traffic-platform/sync`

Body：

```json
{
  "accountId": 1,
  "startDate": "2026-04-27",
  "endDate": "2026-04-29"
}
```

可选字段：

```json
{
  "platformCode": "kkoip"
}
```

说明：

- `platformCode` 可不传，后端会根据 `accountId` 自动补齐
- 若传 `platformCode`，会做一致性校验，不匹配返回 `422`

### 5.2 同步任务列表

`GET /traffic-platform/sync-jobs`

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| platformCode | string | 否 | 平台编码 |
| accountId | int | 否 | 平台账号ID |
| status | string | 否 | `running` / `success` / `failed` |
| startTime | string | 否 | 创建时间起 |
| endTime | string | 否 | 创建时间止 |
| page | int | 否 | 默认1 |
| pageSize | int | 否 | 默认20，最大200 |

### 5.3 同步任务详情

`GET /traffic-platform/sync-jobs/{id}`


# 代理流量菜单设计

新增一级菜单：

```text
代理流量
```

建议不要拆太多页面，保持界面简洁。一个菜单下做成**一个主页面 + 多个 Tab / 抽屉弹窗**即可。

```text
代理流量
└── 代理流量看板
```

页面内部包含：

```text
代理流量看板
├── 数据概览
├── 流量趋势
├── 流量明细
├── 流量排行
├── 账号管理
├── 平台配置
└── 同步任务
```

## 页面定位

用于查看第三方代理平台的流量消耗情况，支持按平台、账号、子账号、地区、时间维度查看小时、日、月流量，并支持手动同步与账号配置。

页面风格建议：

```text
顶部筛选 + 卡片概览 + 图表趋势 + 明细表格
```

避免每个功能单独开菜单，减少页面跳转。

---

# 一、代理流量看板

## 1. 顶部筛选区

放在页面顶部，所有 Tab 共用。

字段：

| 字段     | 说明                 |
| ------ | ------------------ |
| 平台     | 下拉选择，例如 KKOIP      |
| 账号     | 下拉选择平台账号           |
| 子账号    | 输入 externalUid，可为空 |
| 地区     | 输入 geo，可为空         |
| 时间范围   | 日期范围选择             |
| 粒度     | 小时 / 日 / 月         |
| 查询按钮   | 刷新当前数据             |
| 手动同步按钮 | 打开同步弹窗             |

接口：

```http
GET /v3/traffic-platform/platforms
GET /v3/traffic-platform/accounts
```

说明：

* 平台下拉来自平台列表。
* 账号下拉来自账号列表。
* 选择平台后，账号列表按 `platformCode` 过滤。
* 查询条件统一作用于趋势、明细、排行。

---

# 二、数据概览区

页面顶部展示 4 个统计卡片：

```text
今日流量
昨日流量
本月流量
账号数量
```

建议使用日汇总、月汇总接口计算。

接口：

```http
GET /v3/traffic-platform/usages/daily
GET /v3/traffic-platform/usages/monthly
GET /v3/traffic-platform/accounts
```

展示建议：

```text
今日流量：128.45 GB
昨日流量：96.20 GB
本月流量：2.31 TB
启用账号：8 个
```

说明文案：

```text
展示当前筛选条件下的代理流量消耗概览，便于快速判断流量变化。
```

---

# 三、流量趋势 Tab

用于展示折线图。

接口：

```http
GET /v3/traffic-platform/usages/trend
```

参数：

| 参数           | 来源                |
| ------------ | ----------------- |
| platformCode | 顶部筛选              |
| accountId    | 顶部筛选              |
| externalUid  | 顶部筛选              |
| startDate    | 时间范围              |
| endDate      | 时间范围              |
| dimension    | 粒度：hour/day/month |

图表字段：

```text
x轴：time
y轴：trafficGb
```

界面描述：

```text
展示指定时间范围内的代理流量变化趋势，支持按小时、日、月切换。
```

建议：

* 默认展示最近 7 天日趋势。
* 小时维度适合查看当天或近 3 天。
* 月维度适合查看长期趋势。

---

# 四、流量明细 Tab

根据粒度切换不同接口。

## 小时明细

```http
GET /v3/traffic-platform/usages/hourly
```

表格列：

| 列名    | 字段                             |
| ----- | ------------------------------ |
| 时间    | statTime                       |
| 平台    | platformCode                   |
| 账号    | accountName                    |
| 子账号   | externalUsername / externalUid |
| 地区    | geo / region                   |
| 流量 MB | trafficMb                      |

## 日明细

```http
GET /v3/traffic-platform/usages/daily
```

表格列：

| 列名    | 字段                             |
| ----- | ------------------------------ |
| 日期    | statDate                       |
| 平台    | platformCode                   |
| 账号    | accountName                    |
| 子账号   | externalUsername / externalUid |
| 地区    | geo / region                   |
| 流量 GB | trafficGb                      |

## 月明细

```http
GET /v3/traffic-platform/usages/monthly
```

表格列：

| 列名    | 字段                             |
| ----- | ------------------------------ |
| 月份    | statMonth                      |
| 平台    | platformCode                   |
| 账号    | accountName                    |
| 子账号   | externalUsername / externalUid |
| 流量 GB | trafficGb                      |

界面描述：

```text
按所选粒度展示代理流量明细，适合排查某个账号、子账号或地区的具体消耗。
```

---

# 五、流量排行 Tab

接口：

```http
GET /v3/traffic-platform/usages/ranking
```

支持排行维度：

```text
按账号排行
按子账号排行
按地区排行
```

参数：

| 参数           | 说明                           |
| ------------ | ---------------------------- |
| rankBy       | account / external_uid / geo |
| platformCode | 平台                           |
| startDate    | 开始日期                         |
| endDate      | 结束日期                         |
| limit        | 默认 20                        |

展示方式：

* 左侧维度切换按钮
* 右侧柱状图 + 表格

界面描述：

```text
展示指定时间范围内流量消耗最高的账号、子账号或地区，方便快速定位主要消耗来源。
```

---

# 六、账号管理 Tab

接口：

```http
GET    /v3/traffic-platform/accounts
POST   /v3/traffic-platform/accounts
GET    /v3/traffic-platform/accounts/{id}
PUT    /v3/traffic-platform/accounts/{id}
PATCH  /v3/traffic-platform/accounts/{id}/status
POST   /v3/traffic-platform/accounts/{id}/test
```

表格列：

| 列名     | 说明                |
| ------ | ----------------- |
| 平台     | platformCode      |
| 账号名称   | accountName       |
| 外部账号ID | externalAccountId |
| 时区     | timezone          |
| 状态     | enabled           |
| 操作     | 编辑 / 启用禁用 / 测试连接  |

新增/编辑使用弹窗，不跳页面。

表单字段：

| 字段       | 类型  |
| -------- | --- |
| 平台       | 下拉  |
| 账号名称     | 输入框 |
| 外部账号ID   | 输入框 |
| accessid | 输入框 |
| secret   | 密码框 |
| timezone | 下拉  |
| enabled  | 开关  |

界面描述：

```text
维护第三方代理平台账号，用于后端定时拉取代理流量数据。
```

---

# 七、平台配置 Tab

接口：

```http
GET   /v3/traffic-platform/platforms
POST  /v3/traffic-platform/platforms
PUT   /v3/traffic-platform/platforms/{id}
PATCH /v3/traffic-platform/platforms/{id}/status
```

表格列：

| 列名     | 字段        |
| ------ | --------- |
| 平台编码   | code      |
| 平台名称   | name      |
| API 地址 | baseUrl   |
| 状态     | enabled   |
| 操作     | 编辑 / 启用禁用 |

界面描述：

```text
配置支持接入的第三方代理平台，后续可扩展更多流量平台。
```

建议：

* 普通运营人员可以隐藏此 Tab。
* 只给管理员显示。

---

# 八、同步任务 Tab

接口：

```http
GET /v3/traffic-platform/sync-jobs
GET /v3/traffic-platform/sync-jobs/{id}
```

表格列：

| 列名   | 字段           |
| ---- | ------------ |
| 平台   | platformCode |
| 账号ID | accountId    |
| 状态   | status       |
| 开始时间 | startTime    |
| 结束时间 | endTime      |
| 错误信息 | errorMessage |
| 创建时间 | createdAt    |
| 操作   | 查看详情         |

状态样式：

```text
running：蓝色
success：绿色
failed：红色
```

界面描述：

```text
展示代理流量同步任务执行记录，便于排查接口异常、账号异常或数据延迟问题。
```

---

# 九、手动同步弹窗

入口放在页面右上角：

```text
手动同步
```

接口：

```http
POST /v3/traffic-platform/sync
```

表单字段：

| 字段   | 说明 |
| ---- | -- |
| 平台   | 可选 |
| 账号   | 必填 |
| 开始日期 | 必填 |
| 结束日期 | 必填 |

请求示例：

```json
{
  "accountId": 1,
  "platformCode": "kkoip",
  "startDate": "2026-04-27",
  "endDate": "2026-04-29"
}
```

弹窗描述：

```text
用于手动补拉指定账号在指定日期范围内的代理流量数据。
```

---

# 十、推荐页面布局

```text
代理流量看板

[平台] [账号] [子账号] [地区] [时间范围] [粒度] [查询] [手动同步]

[今日流量] [昨日流量] [本月流量] [启用账号]

Tabs:
  流量趋势 | 流量明细 | 流量排行 | 账号管理 | 平台配置 | 同步任务
```

这样只需要一个菜单、一个页面，但功能完整。界面会比较清晰，不会显得臃肿。
