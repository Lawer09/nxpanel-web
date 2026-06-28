# Asset Service Machine API

## 资源字段说明

### Machine

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 本地机器主键，路径参数中的 `machine_id` 指向此字段。 |
| `machine_id` | string | 业务机器标识。 |
| `provider_id` | integer | 所属供应商主键。手动录入的机器可能为空。 |
| `provider_code` | string | 所属供应商代码。 |
| `account_id` | integer | 所属供应商账号主键。 |
| `account_name` | string | 所属供应商账号名称。 |
| `external_instance_id` | string | 云平台实例 ID。云端创建未完成或失败时可能为空。 |
| `name` | string | 机器名称。 |
| `region` | string | 区域。 |
| `zone` | string | 可用区。 |
| `instance_type` | string | 实例规格。 |
| `image_id` | string | 镜像 ID 或镜像标识。 |
| `billing_type` | string | 计费方式。 |
| `status` | string | 机器状态，例如 `active`、`creating`、`create_failed`、`stopped`、`destroyed`、`missing`。`missing` 表示本地记录存在，但供应商成功同步时已不再返回该实例。 |
| `source` | string | 机器来源，例如 `manual`、`import`、`provider`。 |
| `sync_status` | string | 最近一次同步结果。 |
| `metadata` | object | 附加元数据。 |
| `tags` | array | 资源标签，格式为 `[{key,value,label}]`。 |
| `client_request_id` | string | 云端创建请求的可选幂等键。 |
| `create_task_id` | integer | 云端创建关联的 task-service 任务 ID。 |
| `create_request_json` | object | 脱敏后的云端创建请求，用于查看和重试。 |
| `create_attempt` | integer | 云端创建尝试次数。 |
| `last_error_summary` | string | 最近一次创建或同步失败摘要。 |
| `spec` | object | 机器规格信息。 |
| `ips` | array | 当前机器绑定的 IP 列表。 |
| `last_synced_at` | string/null | 最近同步时间。 |
| `created_by` | integer | 创建人 ID。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


### MachineSpec

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `cpu_cores` | integer | CPU 核数。 |
| `memory_mb` | integer | 内存大小，单位 MiB。 |
| `disk_gb` | integer | 磁盘大小，单位 GiB。 |
| `bandwidth_mbps` | integer | 带宽大小，单位 Mbps。 |
| `spec` | object | 供应商原始规格补充信息。 |


### MachineIP

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 绑定记录主键。 |
| `machine_id` | integer | 本地机器主键。 |
| `machine_business_id` | string | 机器业务标识。 |
| `ip_id` | integer | 本地 IP 主键。 |
| `ip` | string | IP 地址。 |
| `bind_type` | string | 绑定类型，例如 `manual`、`provider`、`default`、`elastic`。 |
| `is_primary` | boolean | 是否为主 IP。 |
| `status` | string | 绑定状态，例如 `bound`、`unbound`、`failed`。 |
| `provider_binding_id` | string | 云平台侧绑定记录 ID。 |
| `bound_at` | string/null | 绑定时间。 |
| `unbound_at` | string/null | 解绑时间。 |


## 接口说明

### 6.1. 机器创建接口

机器创建相关接口已拆分到独立文档，避免本文件过长。

- 文档：`create_machine_api.md`
- 候选查询：`GET /api/v1/assets/provider-accounts/{account_id}/machine-create/{category}`
- 询价：`POST /api/v1/assets/provider-accounts/{account_id}/machine-create/price`
- 创建：`POST /api/v1/assets/machines/create-from-provider`
- 重试：`POST /api/v1/assets/machines/{machine_id}/retry-provider-create`

说明：创建接口只接受通用创建字段，不接受旧的供应商透传 `payload` 字段。Zenlayer 与 Alibaba Cloud ECS 字段映射、时区、IP 选择、模板变量和错误码见独立文档。


### 6.2. 机器脚本接口

机器 Bash 脚本库与按脚本名执行接口已拆分到独立文档，避免本文件过长。

- 文档：`machine-scripts-api.md`
- 脚本列表：`GET /api/v1/assets/machine-scripts`
- 脚本详情：`GET /api/v1/assets/machine-scripts/{script_id}`
- 创建脚本：`POST /api/v1/assets/machine-scripts/create`
- 更新脚本：`POST /api/v1/assets/machine-scripts/update`
- 删除脚本：`POST /api/v1/assets/machine-scripts/delete`
- 执行脚本：`POST /api/v1/assets/machine-scripts/run`


### 7. 获取机器列表

- 地址：`GET /api/v1/assets/machines`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码。 |
| `page_size` | integer | 否 | 每页条数。 |
| `provider_code` | string | 否 | 供应商代码。 |
| `account_id` | integer | 否 | 供应商账号主键。 |
| `status` | string | 否 | 机器状态。 |
| `source` | string | 否 | 机器来源，例如 `manual`、`import`、`provider`。 |
| `region` | string | 否 | 区域。 |
| `name` | string | 否 | 模糊匹配机器名称。 |
| `tag_key` | string | 否 | 按标签 key 过滤。 |
| `tag_value` | string | 否 | 按标签 value 过滤。 |

返回值：

- `data.items`: `Machine` 数组


### 8. 获取机器详情

- 地址：`GET /api/v1/assets/machines/{machine_id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

返回值：

- `data`: `Machine`


### 9. 手动创建机器

- 地址：`POST /api/v1/assets/machines/create-manual`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | string | 是 | 业务机器标识。 |
| `name` | string | 是 | 机器名称。 |
| `region` | string | 否 | 区域。 |
| `zone` | string | 否 | 可用区。 |
| `instance_type` | string | 否 | 实例规格。 |
| `image_id` | string | 否 | 镜像标识。 |
| `billing_type` | string | 否 | 计费方式。 |
| `status` | string | 否 | 机器状态。 |
| `external_instance_id` | string | 否 | 云平台实例 ID。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。 |
| `spec` | object | 否 | 机器规格对象，结构见 `MachineSpec`。 |

返回值：

- `data.id`: 新建机器的本地主键
- `data.trust_token`: Agent 首次注册一次性凭证信息，包含 `machine_id`、`asset_machine_id`、`trust_token`、`config`、`expires_in_seconds`、`inject_task_id`、`inject_task_url`、`inject_status`。

说明：手动创建机器成功后，`asset-service` 会生成 `asset-key_` 前缀的一次性 trust token，并使用机器保存的 SSH 凭据创建配置注入任务，将 `{"machine_id":"...","trust_token":"..."}` 写入 `/etc/nx-platform/asset.config`。如果缺少可用 SSH 凭据、`task-service` 不可用或注入任务无法创建，接口返回失败，不返回可用 token。


### 10. 从供应商创建机器

- 地址：`POST /api/v1/assets/machines/create-from-provider`
- 详细请求体、返回值、字段意义、供应商映射和错误码见 `create_machine_api.md`。

说明：该接口采用“本地资产账本先行，云端执行异步补齐”。提交后会先写入 `status=creating`、`source=provider` 的本地机器记录，并返回 `task_id` 与本地机器列表。后台创建任务拿到供应商 `external_instance_id` 后会立即落库，然后最多轮询 2 分钟补齐供应商详情和 IP；只有实例可归一为 `active` 且至少回填到一个 IP 后，任务才标记 `succeeded`。若详情或 IP 仍未就绪，任务失败但机器保留 `creating`、`external_instance_id` 和 `provider_detail_pending/provider_ip_pending`，后台 worker 会继续周期性补齐；创建期间不允许修改、重试、删除或销毁。

Agent 注册配置：创建任务会为每台机器生成独立的一次性 trust token。云端实例创建完成并回填 IP 后，`asset-service` 会创建 SSH 注入任务，将 `machine_id` 和 `trust_token` 以 JSON 格式写入 `/etc/nx-platform/asset.config`。创建请求不再接受自定义初始化命令；后续刷新 trust-token 时也只通过 SSH 更新同一个配置文件。任务展示请求、机器 `create_request_json` 和操作审计中不会保存明文 trust token。


### 11. 重试供应商机器创建

- 地址：`POST /api/v1/assets/machines/{machine_id}/retry-provider-create`
- 详细请求体、返回值、字段意义和限制见 `create_machine_api.md`。

说明：仅允许重试 `source=provider`、`external_instance_id` 为空，且状态为 `creating` 或 `create_failed` 的机器。已经拿到 `external_instance_id` 但仍处于 `provider_detail_pending/provider_ip_pending` 的机器不能重试，后台会继续补齐。

重试会重新生成一次性 trust token，并在云端实例创建完成后通过 SSH 注入任务更新 `/etc/nx-platform/asset.config`。


### 12. 从供应商导入机器

- 地址：`POST /api/v1/assets/machines/import-from-provider`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |
| `region` | string | 否 | 区域。 |

返回值：

- `data`: `TaskAck`


### 13. 更新机器

- 地址：`POST /api/v1/assets/machines/update`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地机器主键。 |
| `name` | string | 否 | 机器名称。 |
| `region` | string | 否 | 区域。 |
| `zone` | string | 否 | 可用区。 |
| `instance_type` | string | 否 | 实例规格。 |
| `image_id` | string | 否 | 镜像标识。 |
| `billing_type` | string | 否 | 计费方式。 |
| `status` | string | 否 | 机器状态。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签；提交空数组表示清空。 |
| `spec` | object | 否 | 机器规格对象。 |

返回值：

- `data.ok`: 是否执行成功


### 14. 删除机器

- 地址：`POST /api/v1/assets/machines/delete`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地机器主键。 |

说明：

- 该接口只删除本地资产记录，不销毁云平台实例

返回值：

- `data.ok`: 是否执行成功


### 15. 销毁供应商机器

- 地址：`POST /api/v1/assets/machines/{machine_id}/destroy-provider-instance`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `confirm_instance_id` | string | 是 | 必须与机器的 `external_instance_id` 一致。 |

返回值：

- `data`: `TaskAck`


### 16. 同步单台机器

- 地址：`POST /api/v1/assets/machines/{machine_id}/sync`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

返回值：

- `data`: `TaskAck`


### 17. 执行 SSH 命令

- 地址：`POST /api/v1/assets/machines/run-command`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_ids` | integer array | 是 | 要执行命令的机器主键列表。 |
| `ssh_key_id` | integer | 是 | SSH 密钥主键。要求该密钥具备私钥。 |
| `username` | string | 是 | SSH 登录用户名。 |
| `port` | integer | 否 | SSH 端口，默认 `22`。 |
| `command` | string | 是 | 要执行的命令文本。该字段视为敏感信息。 |
| `timeout_seconds` | integer | 否 | 单机执行超时时间，默认 `60` 秒。 |

返回值：

- `data`: `TaskAck`

说明：

- 完整命令文本不会出现在公开查询接口返回中
