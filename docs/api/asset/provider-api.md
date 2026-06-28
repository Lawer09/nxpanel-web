# Asset Service Provider API

## 资源字段说明

### Provider

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 本地供应商主键。 |
| `code` | string | 供应商代码，例如 `zenlayer`、`alibaba_cloud`。 |
| `name` | string | 供应商名称。 |
| `type` | string | 供应商类型，例如 `cloud`。 |
| `status` | string | 供应商状态。 |
| `capabilities` | object | 供应商能力描述。 |
| `default_region` | string | 默认区域。 |


### ProviderAccount

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 本地账号主键。 |
| `provider_id` | integer | 所属供应商主键。 |
| `provider_code` | string | 所属供应商代码。 |
| `name` | string | 账号显示名称。 |
| `status` | string | 账号状态，例如 `active`、`disabled`、`deleted`。 |
| `has_credential` | boolean | 是否已保存加密后的凭证。 |
| `credential_masked` | string | 脱敏后的凭证摘要。 |
| `credential_version` | integer | 凭证版本号，更新凭证后递增。 |
| `last_synced_at` | string/null | 最近同步时间。 |
| `tags` | array | 资源标签，格式为 `[{key,value,label}]`。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


## 接口说明

### 1. 获取供应商列表

- 地址：`GET /api/v1/assets/providers`

返回值：

- `data.items`: `Provider` 数组


### 2. 获取供应商账号列表

- 地址：`GET /api/v1/assets/provider-accounts`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码，默认 `1`。 |
| `page_size` | integer | 否 | 每页条数，默认 `20`，最大 `200`。 |
| `provider_code` | string | 否 | 供应商代码，例如 `zenlayer`、`alibaba_cloud`。 |
| `status` | string | 否 | 账号状态。 |
| `tag_key` | string | 否 | 按标签 key 过滤。 |
| `tag_value` | string | 否 | 按标签 value 过滤。 |

返回值：

- `data.items`: `ProviderAccount` 数组


### 3. 创建供应商账号

- 地址：`POST /api/v1/assets/provider-accounts/create`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `provider_code` | string | 是 | 供应商代码，当前支持 `zenlayer`、`alibaba_cloud`。 |
| `name` | string | 是 | 账号显示名称。 |
| `status` | string | 否 | 账号状态，默认 `active`。 |
| `credential` | object | 是 | 供应商凭证对象。 |
| `credential.access_key_id` | string | 否 | Access Key ID。 |
| `credential.access_key_secret` | string | 否 | Access Key Secret。 |
| `credential.access_token` | string | 否 | Access Token。 |
| `credential.api_base_url` | string | 否 | 自定义 API 地址。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。 |

说明：

- 当 `access_token` 为空时，通常需要同时提供 `access_key_id` 和 `access_key_secret`
- 凭证明文只在写入时接收，不会在读取接口中返回

返回值：

- `data.id`: 新建账号的本地主键


### 4. 更新供应商账号

- 地址：`POST /api/v1/assets/provider-accounts/update`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地账号主键。 |
| `name` | string | 否 | 账号显示名称。 |
| `status` | string | 否 | 账号状态。 |
| `credential` | object | 否 | 新的凭证对象。未传表示不更新凭证。 |
| `tags` | array | 否 | 资源标签；提交空数组表示清空。 |

返回值：

- `data.ok`: 是否执行成功


### 5. 删除供应商账号

- 地址：`POST /api/v1/assets/provider-accounts/delete`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地账号主键。 |

返回值：

- `data.ok`: 是否执行成功


### 6. 测试供应商账号连通性

- 地址：`POST /api/v1/assets/provider-accounts/{account_id}/test-connection`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 本地账号主键。 |

返回值：

- `data.ok`: 是否测试成功
