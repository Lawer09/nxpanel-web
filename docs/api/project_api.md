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
| POST | `/projects/batch-save` | 按项目代号批量新增或更新项目 | `ProjectController::batchSave` |
| POST | `/projects/batch-update-department` | 批量更新项目部门 | `ProjectController::batchUpdateDepartment` |
| GET | `/projects/project-codes` | 项目代号列表 | `ProjectController::projectCodes` |
| GET | `/projects/departments` | 部门列表 | `ProjectController::departments` |
| POST | `/projects/aggregate` | 手动聚合（同步） | `ProjectController::aggregate` |
| POST | `/projects/aggregate-async` | 手动聚合（异步） | `ProjectController::aggregateAsync` |
| POST | `/projects/aggregate-hourly` | 手动聚合（小时） | `ProjectController::aggregateHourly` |
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
| GET | `/projects/version-records` | 项目版本记录列表 | `ProjectVersionRecordController::index` |
| POST | `/projects/version-records/create` | 新增项目版本记录 | `ProjectVersionRecordController::store` |
| POST | `/projects/version-records/batch-create` | 批量新增项目版本记录 | `ProjectVersionRecordController::batchCreate` |
| POST | `/projects/version-records/update` | 编辑项目版本记录 | `ProjectVersionRecordController::update` |
| POST | `/projects/version-records/delete` | 删除项目版本记录 | `ProjectVersionRecordController::destroy` |

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

## 5.1 按项目代号批量新增或更新

- **方法/路径**：`POST /v3/projects/batch-save`
- **说明**：按 `projectCode` 执行“存在则更新，不存在则新增”。

### 5.1.1 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| items | array | 是 | 项目数组 |
| items[].projectCode | string | 是 | 项目代号，作为更新或新增识别键 |
| items[].projectName | string | 否 | 项目名称 |
| items[].ownerName | string | 否 | 负责人 |
| items[].department | string/null | 否 | 所属部门 |
| items[].status | string | 否 | 项目状态 |
| items[].adStatus | string | 否 | 投放状态 |
| items[].appPlatform | string | 否 | 应用平台 |
| items[].packageName | string | 否 | 项目包名 |
| items[].remark | string | 否 | 备注 |

### 5.1.2 请求示例

```json
{
  "items": [
    {
      "projectCode": "A001",
      "projectName": "Project A",
      "ownerName": "Alice",
      "department": "技术部",
      "status": "active",
      "adStatus": "running",
      "appPlatform": "android",
      "packageName": "com.example.app",
      "remark": "optional"
    }
  ]
}
```

### 5.1.3 返回示例

```json
{
  "created": 1,
  "updated": 0,
  "total": 1,
  "items": [
    {
      "projectCode": "A001",
      "action": "created",
      "id": 101
    }
  ]
}
```

### 5.1.4 前端导入约定

- 项目管理页导入弹窗同时支持 `上传 CSV` 和 `粘贴文本` 两种导入源。
- CSV 导入基于表头映射，不依赖固定列顺序。
- 前端使用标准 CSV 解析语义，支持引号包裹字段中的换行、逗号、双引号转义和 BOM。
- CSV 模式下，前端会先让用户选择本次要导入的目标字段，再为每个目标字段指定 CSV 对应列；仅提交被勾选且映射完成的字段。
- 导入目标字段覆盖项目管理页可维护字段，默认不包含 `trafficAccounts`、`adAccounts`、`userApps`、`createdAt`、`updatedAt`、`id` 等只读或关联字段。
- `projectCode` 仍然是必需识别字段，用于决定“存在则更新，不存在则新增”。
- 若某一行映射后的 `projectCode` 为空，该行会在前端预览中标记为“跳过：缺少项目代号”，并在提交到 `batch-save` 前自动排除，不阻塞其他有效行导入。
- 粘贴文本模式不提供手工字段映射，而是按项目代号起始行切分项目块，并根据字段特征自动识别 `ownerName`、`packageName`、`admobAppId`、`storePageUrl` 等项目字段。
- 粘贴文本模式下，像 `白包在线`、`完整包在线`、`白包开发中`、`UI完毕`、`下架` 这类阶段信息不会写入 `status` 或 `adStatus`，而是并入 `remark`。
- 粘贴文本模式下，缺少 `projectCode`、存在字段冲突或存在无法归类内容的记录会在前端预览中标记为“跳过/异常”，默认不会提交到 `batch-save`。

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

## 8.6 项目版本记录

项目管理页展开行中的版本记录，用于维护单个项目的版本发布信息。该功能不同于系统版本管理页。

### 8.6.1 查询版本记录

- **方法/路径**：`GET /v3/projects/version-records`
- **说明**：按项目查询版本记录，前端用于项目管理展开行列表和新增版本时获取当前最新版本。

#### 请求参数（query）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 否 | 项目 ID |
| projectCode | string | 否 | 项目代号 |
| keyword | string | 否 | 关键字 |
| releaseTimeFrom | string | 否 | 上线时间开始 |
| releaseTimeTo | string | 否 | 上线时间结束 |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

#### 返回字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 版本记录 ID |
| projectId | int | 项目 ID |
| projectCode | string | 项目代号 |
| version | string | 版本号，例如 `1.0.1`，不带 `v` 前缀 |
| versionName | string/null | 版本名称 |
| content | string | 版本说明 |
| releaseTime | string | 上线时间 |
| remark | string/null | 备注 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 8.6.2 新增版本记录

- **方法/路径**：`POST /v3/projects/version-records/create`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 是 | 项目 ID |
| version | string | 是 | 版本号，例如 `1.0.1`，不传 `v` 前缀 |
| versionName | string/null | 否 | 版本名称，空值可传 `null` |
| content | string | 是 | 版本说明 |
| releaseTime | string | 是 | 上线时间 |
| remark | string/null | 否 | 备注 |

### 8.6.3 编辑版本记录

- **方法/路径**：`POST /v3/projects/version-records/update`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 版本记录 ID |
| projectId | int | 否 | 项目 ID |
| version | string | 否 | 版本号，例如 `1.0.1`，不传 `v` 前缀 |
| versionName | string/null | 否 | 版本名称，空值可传 `null` |
| content | string | 否 | 版本说明 |
| releaseTime | string | 否 | 上线时间 |
| remark | string/null | 否 | 备注 |

### 8.6.4 批量新增版本记录

- **方法/路径**：`POST /v3/projects/version-records/batch-create`
- **说明**：批量新增项目版本记录，前端版本导入使用该接口。

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| items | array | 是 | 版本记录数组 |
| items[].projectId | int | 是 | 项目 ID |
| items[].version | string | 是 | 版本号，例如 `1.0.1`，不传 `v` 前缀 |
| items[].versionName | string/null | 否 | 版本名称，空值可传 `null` |
| items[].content | string | 是 | 版本说明 |
| items[].releaseTime | string | 是 | 上线时间 |
| items[].remark | string/null | 否 | 备注 |

#### 返回示例

```json
{
  "created": 2,
  "total": 2,
  "items": []
}
```

### 8.6.5 删除版本记录

- **方法/路径**：`POST /v3/projects/version-records/delete`

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | int | 是 | 版本记录 ID |

### 8.6.6 前端交互说明

- 项目管理页版本记录弹窗中的 `小版本 / 大版本` 仅用于前端生成版本号和预览，不作为接口字段提交。
- 新增默认按当前最新版本生成小版本，即 `patch + 1`；切换大版本时默认生成 `major + 1.0.0`。
- 用户可直接修改任意版本号输入框，最终只提交合成后的 `version` 字符串。
- 项目管理页支持版本记录 TSV 粘贴导入，列顺序固定为：版本号、负责人、内容、项目 App、上线时间。
- 版本导入会从 `项目 App` 字段中提取项目代号，例如 `A034 - PrimeTunnel VPN` 提取为 `A034`，再通过项目列表查询得到 `projectId`。
- 版本导入使用 `/v3/projects/version-records/batch-create` 一次提交有效行，跳过行不进入 `items`。
- 版本导入中的负责人当前写入 `remark`，格式为 `负责人：李广`；`versionName` 无来源时传 `null`。
- 版本导入只新增版本记录，不做同项目同版本号的更新或覆盖。

---

## 9. 手动触发日聚合

### 9.1 同步聚合

- **方法/路径**：`POST /v3/projects/aggregate`
- **控制器**：`ProjectController::aggregate`
- **说明**：通过 Artisan command `project:aggregate-daily` 同步执行日数据聚合（等待完成）

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 否 | 项目 ID；不传时同步全部项目 |
| startDate | string | 是 | 开始日期（Y-m-d） |
| endDate | string | 是 | 结束日期（Y-m-d），须 >= startDate |

#### 前端接入说明

- 项目管理页在标题右侧提供“同步”入口。
- 弹窗中项目代号为可选项；留空时前端不会传 `projectId`，后端按全部项目执行同步。

### 9.2 小时聚合

- **方法/路径**：`POST /v3/projects/aggregate-hourly`
- **说明**：手动重建项目小时报表数据，可按日期、小时范围和项目限制范围。

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| startDate | string | 是 | 开始日期（Y-m-d） |
| endDate | string | 是 | 结束日期（Y-m-d），须 >= startDate |
| hourFrom | int | 否 | 开始小时，0-23 |
| hourTo | int | 否 | 结束小时，0-23，须 >= hourFrom |
| projectId | int | 否 | 项目 ID；不传时同步全部项目 |

#### 请求示例

```json
{
  "startDate": "2026-06-29",
  "endDate": "2026-06-29",
  "hourFrom": 9,
  "hourTo": 12,
  "projectId": 12
}
```

#### 前端接入说明

- 项目管理页“同步”弹窗支持切换到“小时同步”。
- 小时范围可清空；清空时前端不传 `hourFrom/hourTo`。
- 项目代号可留空；留空时前端不传 `projectId`，后端按全部项目执行同步。

### 9.3 异步聚合

- **方法/路径**：`POST /v3/projects/aggregate-async`
- **控制器**：`ProjectController::aggregateAsync`
- **说明**：将聚合任务 `AggregateProjectDailyJob` 投递到队列异步执行

#### 请求参数（body JSON）

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| projectId | int | 否 | 项目 ID；不传时同步全部项目 |
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
