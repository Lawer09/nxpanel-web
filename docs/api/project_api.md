# Project API 文档

项目基础 CRUD 接口，基于 `project_projects` 表，提供项目列表、详情、创建、编辑、状态更新功能，以及关联的流量账号/广告账号/用户App绑定管理和手动聚合触发。

---

## 路由一览

| 方法 | 路径 | 功能 | 控制器#方法 |
|------|------|------|------------|
| GET | `/projects/` | 项目列表 | `ProjectController::index` |
| GET | `/projects/detail` | 项目详情 | `ProjectController::detail` |
| POST | `/projects/create` | 创建项目 | `ProjectController::store` |
| POST | `/projects/update` | 编辑项目 | `ProjectController::update` |
| POST | `/projects/update-status` | 更新项目状态 | `ProjectController::updateStatus` |
| POST | `/projects/batch-update-department` | 批量更新项目部门 | `ProjectController::batchUpdateDepartment` |
| GET | `/projects/departments` | 部门列表 | `ProjectController::departments` |
| POST | `/projects/aggregate` | 手动聚合（同步） | `ProjectController::aggregate` |
| POST | `/projects/aggregate-async` | 手动聚合（异步） | `ProjectController::aggregateAsync` |
| GET | `/projects/traffic-accounts` | 流量账号列表 | `ProjectTrafficAccountController::index` |
| POST | `/projects/traffic-accounts/create` | 新增流量账号关联 | `ProjectTrafficAccountController::store` |
| POST | `/projects/traffic-accounts/update` | 修改流量账号关联 | `ProjectTrafficAccountController::update` |
| POST | `/projects/traffic-accounts/delete` | 删除流量账号关联 | `ProjectTrafficAccountController::destroy` |
| GET | `/projects/ad-accounts` | 广告账号列表 | `ProjectAdAccountController::index` |
| POST | `/projects/ad-accounts/create` | 新增广告账号关联 | `ProjectAdAccountController::store` |
| POST | `/projects/ad-accounts/update` | 修改广告账号关联 | `ProjectAdAccountController::update` |
| POST | `/projects/ad-accounts/delete` | 删除广告账号关联 | `ProjectAdAccountController::destroy` |
| GET | `/projects/user-apps` | 用户App绑定列表 | `ProjectUserAppMapController::index` |
| GET | `/projects/user-apps/mappings` | 用户App项目映射列表 | `ProjectUserAppMapController::mappings` |
| POST | `/projects/user-apps/create` | 新增用户App绑定 | `ProjectUserAppMapController::store` |
| POST | `/projects/user-apps/update` | 修改用户App绑定 | `ProjectUserAppMapController::update` |
| POST | `/projects/user-apps/delete` | 删除用户App绑定 | `ProjectUserAppMapController::destroy` |

所有路径前缀均为 `/v3/`。

---

## 1. 项目列表

- **方法/路径**：`GET /v3/projects/`
- **控制器**：`ProjectController::index`
- **Request**：`ProjectFetchRequest`
- **数据来源**：`project_projects`

### 1.1 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 模糊搜索（匹配 projectCode / projectName） |
| status | string | 否 | 筛选：`active` / `inactive` / `archived` |
| adStatus | string | 否 | 按投放状态筛选，可选值：`暂停` / `在投` / `未上线` |
| packageName | string | 否 | 按项目包名筛选 |
| developerGmail | string | 否 | 按开发者 Gmail 筛选 |
| ownerId | int | 否 | 按拥有者 ID 筛选 |
| page | int | 否 | 默认 1 |
| pageSize | int | 否 | 默认 20，最大 200 |

### 1.2 返回结构

```json
{
  "data": [
    {
      "id": 1,
      "projectCode": "P001",
      "projectName": "测试项目",
      "ownerName": "张三",
      "department": "技术部",
      "status": "active",
      "adStatus": "在投",
      "remark": null,
      "createdAt": "2026-05-12T00:00:00.000Z",
      "updatedAt": "2026-05-12T00:00:00.000Z",
      "trafficAccounts": [
        {
          "id": 1,
          "trafficPlatformAccountId": 1,
          "platformCode": "google",
          "externalUid": null,
          "externalUsername": null,
          "bindType": "account",
          "enabled": 1,
          "remark": null,
          "createdAt": "2026-05-12T00:00:00.000Z",
          "updatedAt": "2026-05-12T00:00:00.000Z"
        }
      ],
      "adAccounts": [
        {
          "id": 1,
          "adPlatformAccountId": 1,
          "platformCode": "admob",
          "externalAppId": null,
          "externalAdUnitId": null,
          "bindType": "account",
          "enabled": 1,
          "remark": null,
          "createdAt": "2026-05-12T00:00:00.000Z",
          "updatedAt": "2026-05-12T00:00:00.000Z"
        }
      ],
      "userApps": [
        {
          "id": 1,
          "appId": "com.example.app",
          "appLink": "https://example.com/app",
          "enabled": 1,
          "remark": null,
          "createdAt": "2026-05-12T00:00:00.000Z",
          "updatedAt": "2026-05-12T00:00:00.000Z"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

### 1.3 data[] 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 项目 ID |
| projectCode | string | 项目代号 |
| projectName | string | 项目名称 |
| ownerName | string/null | 负责人 |
| department | string/null | 所属部门 |
| status | string | 状态：`active` / `inactive` / `archived` |
| adStatus | string/null | 投放状态，默认候选：`暂停` / `在投` / `未上线` |
| adspowerEnv | string/null | Adspower 环境 |
| developerGmail | string/null | 开发者 Gmail |
| appName | string/null | 应用名称 |
| packageName | string/null | 项目包名 |
| domainInfoStatus | string/null | 域名信息状态 |
| admobPubId | string/null | Admob pub id |
| domainUrl | string/null | 域名 URL |
| privacyPolicyUrl | string/null | 隐私协议 URL |
| termsUrl | string/null | 服务条款 URL |
| facebookInfoStatus | string/null | FB 信息状态 |
| facebookAppId | string/null | Facebook 应用 ID |
| facebookAppToken | string/null | Facebook 应用 Token |
| facebookKeyHash | string/null | Facebook 秘钥散列 |
| facebookClassName | string/null | Facebook 类名 |
| admobAccountStatus | string/null | Admob 账号状态 |
| admobAppId | string/null | Admob 应用 ID |
| admobAdIds | string/null | Admob 广告 ID 配置，支持多行文本 |
| admobAppAdsTxt | string/null | Admob app-ads.txt 内容 |
| firebaseConfigNote | string/null | Firebase 配置说明 |
| yandexAccount | string/null | Yandex 账号 |
| yandexAdIds | string/null | Yandex 广告 ID 配置，支持多行文本 |
| yandexAppAdsTxt | string/null | Yandex app-ads.txt 内容 |
| storePageUrl | string/null | 商店页链接 |
| remark | string/null | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |
| trafficAccounts | array | 关联的流量账号列表 |
| adAccounts | array | 关联的广告账号列表 |
| userApps | array | 关联的用户 App 绑定列表 |

### 1.4 trafficAccounts[] 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 关联记录 ID |
| trafficPlatformAccountId | int | 流量平台账号 ID |
| platformCode | string | 流量平台编码 |
| externalUid | string/null | 三方子账号 ID |
| externalUsername | string/null | 三方子账号名称 |
| bindType | string | 绑定类型：`account` / `sub_account` |
| enabled | int | 是否启用（1=启用） |
| remark | string/null | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 1.5 adAccounts[] 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 关联记录 ID |
| adPlatformAccountId | int | 广告变现平台账号 ID |
| platformCode | string | 广告平台编码 |
| externalAppId | string/null | 广告平台应用 ID |
| externalAdUnitId | string/null | 广告位 ID |
| bindType | string | 绑定类型：`account` / `app` / `ad_unit` |
| enabled | int | 是否启用（1=启用） |
| remark | string/null | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 1.6 userApps[] 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 绑定记录 ID |
| appId | string | 用户注册 metadata 中的 app_id |
| appLink | string/null | App 链接 |
| enabled | int | 是否启用（1=启用） |
| remark | string/null | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

---

## 2. 项目详情

- **方法/路径**：`GET /v3/projects/detail`
- **控制器**：`ProjectController::detail`
- **Request**：`IdRequest`

### 2.1 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 项目 ID |

### 2.2 返回字段

同 1.3 data[] 字段说明，单条记录。

### 2.3 错误

| HTTP 状态码 | 说明 |
| --- | --- |
| 404 | 项目不存在 |

---

## 3. 创建项目

- **方法/路径**：`POST /v3/projects/create`
- **控制器**：`ProjectController::store`
- **Request**：`ProjectSaveRequest`

### 3.1 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectCode | string | 是 | 项目代号，唯一 |
| projectName | string | 是 | 项目名称 |
| ownerName | string | 否 | 负责人 |
| department | string | 否 | 所属部门 |
| status | string | 否 | 默认 `active`，可选：`active` / `inactive` / `archived` |
| adStatus | string | 否 | 投放状态，默认候选：`暂停` / `在投` / `未上线` |
| remark | string | 否 | 备注 |

### 3.2 返回字段

同 1.3 data[] 字段说明，新增后的完整记录。

### 3.3 错误

| HTTP 状态码 | 说明 |
| --- | --- |
| 422 | 项目代号已存在 |

---

## 4. 编辑项目

- **方法/路径**：`POST /v3/projects/update`
- **控制器**：`ProjectController::update`
- **Request**：`ProjectUpdateRequest`

### 4.1 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 项目 ID |
| projectName | string | 否 | 项目名称 |
| ownerName | string | 否 | 负责人 |
| department | string | 否 | 所属部门 |
| status | string | 否 | `active` / `inactive` / `archived` |
| adStatus | string | 否 | 投放状态，默认候选：`暂停` / `在投` / `未上线` |
| remark | string | 否 | 备注 |

### 4.2 返回字段

同 1.3 data[] 字段说明，修改后的完整记录。

### 4.3 错误

| HTTP 状态码 | 说明 |
| --- | --- |
| 404 | 项目不存在 |

---

## 5. 更新项目状态

- **方法/路径**：`POST /v3/projects/update-status`
- **控制器**：`ProjectController::updateStatus`
- **Request**：`ProjectUpdateStatusRequest`

### 5.1 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 项目 ID |
| status | string | 是 | `active` / `inactive` / `archived` |

### 5.2 返回字段

同 1.3 data[] 字段说明，修改后的完整记录。

### 5.3 错误

| HTTP 状态码 | 说明 |
| --- | --- |
| 404 | 项目不存在 |

---

## 6. 流量账号关联管理

---

## 5.1 批量更新项目部门

- **方法/路径**：`POST /v3/projects/batch-update-department`
- **说明**：批量更新 `project_projects.department`，传 `null` 可清空部门。

### 5.1.1 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ids | int[] | 是 | 项目 ID 数组，单次最多 500 个，不能重复 |
| department | string/null | 否 | 所属部门，最大 100 字符；传 `null` 可清空 |

### 5.1.2 请求示例

```json
{
  "ids": [1, 2, 3],
  "department": "技术部"
}
```

### 5.1.3 返回示例

```json
{
  "requested": 3,
  "updated": 3,
  "missingIds": []
}
```

---

## 5.2 部门列表

- **方法/路径**：`GET /v3/projects/departments`
- **说明**：从现有 `project_projects.department` 数据中查询非空部门，去重后按部门名称升序返回；不新增独立部门配置表。

### 5.2.1 返回示例

```json
{
  "data": ["产品部", "技术部", "运营部"]
}
```

---

## 6. 流量账号关联管理

### 6.1 查询已关联流量账号

- **方法/路径**：`GET /v3/projects/traffic-accounts`
- **控制器**：`ProjectTrafficAccountController::index`
- **数据来源**：`project_traffic_platform_accounts`

#### 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| project_id | int | 是 | 项目 ID |

#### 返回结构

```json
{
  "data": [
    {
      "id": 1,
      "trafficPlatformAccountId": 1,
      "platformCode": "google",
      "externalUid": null,
      "externalUsername": null,
      "bindType": "account",
      "enabled": 1,
      "remark": null,
      "createdAt": "2026-05-12T00:00:00.000Z",
      "updatedAt": "2026-05-12T00:00:00.000Z"
    }
  ]
}
```

### 6.2 新增流量账号关联

- **方法/路径**：`POST /v3/projects/traffic-accounts/create`
- **控制器**：`ProjectTrafficAccountController::store`
- **Request**：`ProjectTrafficAccountStoreRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| trafficPlatformAccountId | int | 是 | 流量平台账号 ID |
| platformCode | string | 是 | 流量平台编码 |
| externalUid | string | 否 | 三方子账号 ID |
| externalUsername | string | 否 | 三方子账号名称 |
| bindType | string | 否 | 默认 `account` |
| enabled | int | 否 | 默认 1 |
| remark | string | 否 | 备注 |

### 6.3 修改流量账号关联

- **方法/路径**：`POST /v3/projects/traffic-accounts/update`
- **控制器**：`ProjectTrafficAccountController::update`
- **Request**：`ProjectTrafficAccountUpdateRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 关联记录 ID |
| projectId | int | 是 | 项目 ID |
| enabled | int | 否 | 是否启用 |
| remark | string | 否 | 备注 |

### 6.4 删除流量账号关联

- **方法/路径**：`POST /v3/projects/traffic-accounts/delete`
- **控制器**：`ProjectTrafficAccountController::destroy`
- **Request**：`ProjectResourceIdRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 关联记录 ID |
| projectId | int | 是 | 项目 ID |

---

## 7. 广告账号关联管理

### 7.1 查询已关联广告账号

- **方法/路径**：`GET /v3/projects/ad-accounts`
- **控制器**：`ProjectAdAccountController::index`
- **数据来源**：`project_ad_platform_accounts`

#### 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| project_id | int | 是 | 项目 ID |

#### 返回结构

```json
{
  "data": [
    {
      "id": 1,
      "adPlatformAccountId": 1,
      "platformCode": "admob",
      "externalAppId": null,
      "externalAdUnitId": null,
      "bindType": "account",
      "enabled": 1,
      "remark": null,
      "createdAt": "2026-05-12T00:00:00.000Z",
      "updatedAt": "2026-05-12T00:00:00.000Z"
    }
  ]
}
```

### 7.2 新增广告账号关联

- **方法/路径**：`POST /v3/projects/ad-accounts/create`
- **控制器**：`ProjectAdAccountController::store`
- **Request**：`ProjectAdAccountStoreRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| adPlatformAccountId | int | 是 | 广告变现平台账号 ID |
| platformCode | string | 是 | 广告平台编码 |
| externalAppId | string | 否 | 广告平台应用 ID |
| externalAdUnitId | string | 否 | 广告位 ID |
| bindType | string | 否 | 默认 `account` |
| enabled | int | 否 | 默认 1 |
| remark | string | 否 | 备注 |

### 7.3 修改广告账号关联

- **方法/路径**：`POST /v3/projects/ad-accounts/update`
- **控制器**：`ProjectAdAccountController::update`
- **Request**：`ProjectAdAccountUpdateRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 关联记录 ID |
| projectId | int | 是 | 项目 ID |
| enabled | int | 否 | 是否启用 |
| remark | string | 否 | 备注 |

### 7.4 删除广告账号关联

- **方法/路径**：`POST /v3/projects/ad-accounts/delete`
- **控制器**：`ProjectAdAccountController::destroy`
- **Request**：`ProjectResourceIdRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 关联记录 ID |
| projectId | int | 是 | 项目 ID |

---

## 8. 用户 App 绑定管理

### 8.1 查询已绑定用户 App

- **方法/路径**：`GET /v3/projects/user-apps`
- **控制器**：`ProjectUserAppMapController::index`
- **数据来源**：`project_user_app_map`

#### 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| project_id | int | 是 | 项目 ID |

#### 返回结构

```json
{
  "data": [
    {
      "id": 1,
      "appId": "com.example.app",
      "appLink": "https://example.com/app",
      "enabled": 1,
      "remark": null,
      "createdAt": "2026-05-12T00:00:00.000Z",
      "updatedAt": "2026-05-12T00:00:00.000Z"
    }
  ]
}
```

### 8.2 查询用户 App 项目映射

- **方法/路径**：`GET /v3/projects/user-apps/mappings`
- **说明**：返回项目代号与用户 App 包名的映射列表，可用于报表中的应用 ID 下拉筛选。

#### 返回结构

```json
{
  "data": [
    {
      "projectCode": "rocket",
      "packageNames": [
        "com.rocket.vpn",
        "com.rocket.secure"
      ],
      "appCount": 2
    }
  ]
}
```

#### data[] 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| projectCode | string | 项目代号 |
| packageNames | string[] | 项目下绑定的用户 App 包名列表 |
| appCount | int | 绑定 App 数量 |

前端报表筛选使用 `packageNames[0]` 作为应用 ID 值，下拉展示格式为 `应用ID（projectCode）`。

### 8.3 新增用户 App 绑定

- **方法/路径**：`POST /v3/projects/user-apps/create`
- **控制器**：`ProjectUserAppMapController::store`
- **Request**：`ProjectUserAppMapStoreRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| appId | string | 是 | 用户注册 metadata 中的 app_id |
| appLink | string | 否 | App 链接 |
| enabled | int | 否 | 默认 1 |
| remark | string | 否 | 备注 |

### 8.4 修改用户 App 绑定

- **方法/路径**：`POST /v3/projects/user-apps/update`
- **控制器**：`ProjectUserAppMapController::update`
- **Request**：`ProjectUserAppMapUpdateRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 绑定记录 ID |
| projectId | int | 是 | 项目 ID |
| appLink | string | 否 | App 链接 |
| enabled | int | 否 | 是否启用 |
| remark | string | 否 | 备注 |

### 8.5 删除用户 App 绑定

- **方法/路径**：`POST /v3/projects/user-apps/delete`
- **控制器**：`ProjectUserAppMapController::destroy`
- **Request**：`ProjectResourceIdRequest`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 绑定记录 ID |
| projectId | int | 是 | 项目 ID |

---

## 9. 手动触发日聚合

### 9.1 同步聚合

- **方法/路径**：`POST /v3/projects/aggregate`
- **控制器**：`ProjectController::aggregate`
- **说明**：通过 Artisan command `project:aggregate-daily` 同步执行日数据聚合（等待完成）

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| startDate | string | 是 | 开始日期（Y-m-d） |
| endDate | string | 是 | 结束日期（Y-m-d），须 >= startDate |

### 9.2 异步聚合

- **方法/路径**：`POST /v3/projects/aggregate-async`
- **控制器**：`ProjectController::aggregateAsync`
- **说明**：将聚合任务 `AggregateProjectDailyJob` 投递到队列异步执行

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| startDate | string | 是 | 开始日期（Y-m-d） |
| endDate | string | 是 | 结束日期（Y-m-d），须 >= startDate |

#### 返回结构

```json
{
  "accepted": true,
  "triggerId": "uuid-string",
  "startDate": "2026-05-01",
  "endDate": "2026-05-15",
  "status": "queued"
}
```

---

## 通用说明

- 路径中的 `{securePath}` 由 `admin_setting('secure_path', ...)` 动态生成
- 所有请求/返回参数均为 **camelCase**
- 分页接口统一返回 `data` / `total` / `page` / `pageSize`
- 项目代号（projectCode）在创建接口中全局唯一，重复返回 422

---

## 10. 项目扩展字段补充

以下字段均使用 camelCase 命名，适用于项目列表、项目详情、创建项目和编辑项目接口。创建和编辑时均为非必填字段，空值可不传或传 `null`。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| adspowerEnv | string/null | Adspower 环境 |
| developerGmail | string/null | 开发者 Gmail |
| appName | string/null | 应用名称 |
| packageName | string/null | 项目包名 |
| domainInfoStatus | string/null | 域名信息状态 |
| admobPubId | string/null | Admob pub id |
| domainUrl | string/null | 域名 URL |
| privacyPolicyUrl | string/null | 隐私协议 URL |
| termsUrl | string/null | 服务条款 URL |
| facebookInfoStatus | string/null | FB 信息状态 |
| facebookAppId | string/null | Facebook 应用 ID |
| facebookAppToken | string/null | Facebook 应用 Token |
| facebookKeyHash | string/null | Facebook 秘钥散列 |
| facebookClassName | string/null | Facebook 类名 |
| admobAccountStatus | string/null | Admob 账号状态 |
| admobAppId | string/null | Admob 应用 ID |
| admobAdIds | string/null | Admob 广告 ID 配置，支持多行文本 |
| admobAppAdsTxt | string/null | Admob app-ads.txt 内容 |
| firebaseConfigNote | string/null | Firebase 配置说明 |
| yandexAccount | string/null | Yandex 账号 |
| yandexAdIds | string/null | Yandex 广告 ID 配置，支持多行文本 |
| yandexAppAdsTxt | string/null | Yandex app-ads.txt 内容 |
| storePageUrl | string/null | 商店页链接 |
