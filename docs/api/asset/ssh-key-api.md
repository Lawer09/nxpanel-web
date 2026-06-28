# Asset Service SSH Key API

## 资源字段说明

### SSHKey

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 本地 SSH 密钥主键。 |
| `name` | string | 密钥名称。 |
| `scope` | string | 密钥范围，例如 `custom`、`provider`。 |
| `provider_id` | integer | 所属供应商主键。 |
| `provider_code` | string | 所属供应商代码。 |
| `account_id` | integer | 所属供应商账号主键。 |
| `account_name` | string | 所属供应商账号名称。 |
| `external_key_id` | string | 云平台密钥 ID。 |
| `public_key` | string | 公钥内容。 |
| `has_private_key` | boolean | 是否保存了可用私钥。 |
| `fingerprint` | string | 密钥指纹。 |
| `status` | string | 密钥状态，例如 `active`、`disabled`、`deleted`。 |
| `created_by` | integer | 创建人 ID。 |
| `metadata` | object | 附加元数据。 |
| `tags` | array | 资源标签，格式为 `[{key,value,label}]`。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


## 接口说明

### 27. 获取 SSH 密钥列表

- 地址：`GET /api/v1/assets/ssh-keys`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码。 |
| `page_size` | integer | 否 | 每页条数。 |
| `provider_code` | string | 否 | 供应商代码。 |
| `account_id` | integer | 否 | 供应商账号主键。 |
| `status` | string | 否 | 密钥状态。 |
| `tag_key` | string | 否 | 按标签 key 过滤。 |
| `tag_value` | string | 否 | 按标签 value 过滤。 |

返回值：

- `data.items`: `SSHKey` 数组


### 28. 获取 SSH 密钥详情

- 地址：`GET /api/v1/assets/ssh-keys/{key_id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key_id` | integer | 是 | 本地 SSH 密钥主键。 |

返回值：

- `data`: `SSHKey`


### 29. 创建自定义 SSH 密钥

- 地址：`POST /api/v1/assets/ssh-keys/create-custom`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | string | 是 | 密钥名称。 |
| `scope` | string | 否 | 作用域，默认 `custom`。 |
| `public_key` | string | 是 | OpenSSH 公钥。 |
| `private_key` | string | 否 | 私钥明文，仅写入时接收。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。 |

返回值：

- `data.id`: 新建密钥的本地主键


### 30. 导入单个供应商 SSH 密钥元数据

- 地址：`POST /api/v1/assets/ssh-keys/import-provider-key`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |
| `name` | string | 是 | 密钥名称。 |
| `external_key_id` | string | 否 | 供应商密钥 ID。 |
| `public_key` | string | 否 | 公钥内容。 |
| `payload` | object | 否 | 透传参数。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。 |

返回值：

- `data.id`: 新建密钥的本地主键


### 31. 从供应商导入 SSH 密钥

- 地址：`POST /api/v1/assets/ssh-keys/import-from-provider`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |

返回值：

- `data`: `TaskAck`


### 32. 在供应商侧创建 SSH 密钥

- 地址：`POST /api/v1/assets/ssh-keys/create-provider-key`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |
| `name` | string | 是 | 密钥名称。 |
| `external_key_id` | string | 否 | 供应商密钥 ID。 |
| `public_key` | string | 否 | 公钥内容。 |
| `payload` | object | 否 | 供应商透传参数。 |
| `tags` | array | 否 | 资源标签；供应商侧创建成功后可通过更新接口维护本地标签。 |

返回值：

- `data`: `TaskAck`


### 33. 更新 SSH 密钥

- 地址：`POST /api/v1/assets/ssh-keys/update`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地 SSH 密钥主键。 |
| `name` | string | 否 | 密钥名称。 |
| `scope` | string | 否 | 作用域。 |
| `status` | string | 否 | 状态。 |
| `public_key` | string | 否 | 公钥内容。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签；提交空数组表示清空。 |

返回值：

- `data.ok`: 是否执行成功


### 34. 删除 SSH 密钥

- 地址：`POST /api/v1/assets/ssh-keys/delete`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地 SSH 密钥主键。 |

返回值：

- `data.ok`: 是否执行成功
