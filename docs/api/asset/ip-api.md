# Asset Service IP API

## 资源字段说明

### IP

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 本地 IP 主键。 |
| `ip` | string | IP 地址。 |
| `ip_version` | integer | IP 版本，`4` 或 `6`。 |
| `type` | string | IP 类型，例如 `owned`、`eip`、`default_public`、`default_private`、`private`。 |
| `source` | string | IP 来源，例如 `manual`、`import`、`provider`。 |
| `provider_id` | integer | 所属供应商主键。 |
| `provider_code` | string | 所属供应商代码。 |
| `account_id` | integer | 所属供应商账号主键。 |
| `account_name` | string | 所属供应商账号名称。 |
| `external_ip_id` | string | 云平台 IP 或 EIP ID。 |
| `region` | string | 区域。 |
| `status` | string | IP 状态，例如 `available`、`bound`、`binding`、`unavailable`、`reserved`、`released`、`unknown`。 |
| `ownership` | string | 归属，例如 `self`、`provider`、`unknown`。 |
| `metadata` | object | 附加元数据。 |
| `tags` | array | 资源标签，格式为 `[{key,value,label}]`。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


### ProviderIPPullRun

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | IP 拉取批次 ID，当前等于拉取任务 `task_id`。 |
| `account_id` | integer | 供应商账号主键。 |
| `account_name` | string | 供应商账号名称。 |
| `provider_id` | integer | 供应商主键。 |
| `provider_code` | string | 供应商代码，例如 `zenlayer`、`alibaba_cloud`。 |
| `region` | string | 拉取时使用的区域参数。 |
| `status_filter` | string | 拉取时使用的状态筛选，取值为 `bound`、`unbound`、`binding`、`unavailable` 或空。 |
| `task_id` | integer | 拉取任务 ID。 |
| `status` | string | 拉取批次状态：`pending`、`running`、`succeeded`、`failed`、`cancelled`。 |
| `page` | integer | 本次调用供应商分页 API 的页码。 |
| `page_size` | integer | 本次调用供应商分页 API 的每页条数。 |
| `page_count` | integer | 按供应商总数和 `page_size` 计算出的总页数。 |
| `cached` | boolean | 摘要是否来自 Redis 暂存缓存。 |
| `total_count` | integer | 供应商返回的总条数；供应商未返回时等于实际拉取条数。 |
| `pulled_count` | integer | 当前 Redis 暂存页中的条数，不是全部页累计值。 |
| `imported_count` | integer | 已从该批次成功导入到本地 IP 账本的条数。 |
| `error_summary` | string | 拉取失败摘要。 |
| `request` | object | 脱敏后的拉取请求。 |
| `expires_at` | string/null | Redis 暂存过期时间。过期后需重新拉取。 |
| `created_by` | integer | 创建人 ID。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


### ProviderIPPullItem

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 当前 Redis 暂存页内的临时项 ID，从 `1` 开始。 |
| `pull_run_id` | integer | 所属 IP 拉取批次 ID，等于拉取任务 `task_id`。 |
| `provider_id` | integer | 供应商主键。 |
| `provider_code` | string | 供应商代码。 |
| `account_id` | integer | 供应商账号主键。 |
| `account_name` | string | 供应商账号名称。 |
| `external_ip_id` | string | 云平台 IP 或 EIP ID。 |
| `ip` | string | IP 地址。 |
| `ip_version` | integer | IP 版本。 |
| `type` | string | IP 类型，例如 `eip`、`default_public`、`private`。 |
| `region` | string | 区域。 |
| `status` | string | 归一化后的 IP 状态。 |
| `ownership` | string | 归属，例如 `provider`。 |
| `provider_binding_id` | string | 云平台绑定记录 ID。 |
| `raw` | object | 脱敏后的供应商 IP 原始摘要。 |
| `import_status` | string | 导入状态：`pending`、`imported`、`skipped`、`failed`。 |
| `imported` | boolean | 后端根据本地账本判断该 IP 是否已导入。 |
| `imported_ip_id` | integer | 成功导入后的本地 IP 主键。 |
| `error_summary` | string | 单条导入失败摘要。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


## 接口说明

### 18. 获取 IP 列表

- 地址：`GET /api/v1/assets/ips`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码。 |
| `page_size` | integer | 否 | 每页条数。 |
| `provider_code` | string | 否 | 供应商代码。 |
| `account_id` | integer | 否 | 供应商账号主键。 |
| `status` | string | 否 | IP 状态。 |
| `region` | string | 否 | 区域。 |
| `tag_key` | string | 否 | 按标签 key 过滤。 |
| `tag_value` | string | 否 | 按标签 value 过滤。 |

返回值：

- `data.items`: `IP` 数组


### 19. 获取 IP 详情

- 地址：`GET /api/v1/assets/ips/{ip_id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ip_id` | integer | 是 | 本地 IP 主键。 |

返回值：

- `data`: `IP`


### 20. 手动导入 IP

- 地址：`POST /api/v1/assets/ips/import-manual`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ip` | string | 是 | IP 地址。 |
| `ip_version` | integer | 否 | IP 版本，默认 `4`。 |
| `type` | string | 否 | IP 类型。 |
| `source` | string | 否 | 来源。 |
| `region` | string | 否 | 区域。 |
| `status` | string | 否 | 状态。 |
| `ownership` | string | 否 | 归属。 |
| `external_ip_id` | string | 否 | 云平台 IP ID。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。 |

返回值：

- `data.id`: 新建 IP 的本地主键


### 21. 从供应商拉取 IP

- 地址：`POST /api/v1/assets/ips/pull-from-provider`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |
| `region` | string | 否 | 区域。 |
| `status` | string | 否 | 要从供应商拉取的 IP 状态。通用取值：`bound` 表示已绑定，`unbound` 表示未绑定，`binding` 表示绑定中，`unavailable` 表示不可用。也兼容 `available`。未传表示不按状态过滤。 |
| `page` | integer | 否 | 要拉取的供应商分页页码，默认 `1`。 |
| `page_size` | integer | 否 | 供应商分页大小，默认 `50`，最大 `200`。 |
| `refresh` | boolean | 否 | 是否忽略未过期 Redis 缓存并重新请求供应商，默认 `false`。 |

返回值：

- `data.pull_run_id`: IP 拉取批次 ID，等于 `task_id`
- `data.task_id`: 拉取任务 ID
- `data.status`: 任务状态
- `data.task_url`: 任务查询地址
- `data.cached`: 是否命中 Redis 暂存缓存；命中缓存时不会创建新任务，也不会请求供应商

说明：

- 该接口只调用供应商分页 API 的指定页，并把结果写入 Redis TTL 暂存，不会写入本地 IP 账本 `sv_asset_ips`。
- Redis 暂存 TTL 为 2 小时。缓存 key 由 `account_id + region + status + page + page_size` 生成。
- `refresh=false` 且 Redis 已有未过期结果时，接口直接返回之前的 `pull_run_id/task_id`，不会创建新任务。
- `refresh=true` 会忽略未过期缓存并重新请求供应商，完成后覆盖相同筛选和分页条件的 Redis 暂存。
- 每次只保存当前页，不跨页合并；前端需要更多页时使用相同筛选条件并传不同 `page` 再调用该接口。
- 后端会把通用 `status` 映射为供应商参数。Zenlayer 映射关系：`bound/绑定 -> BINDED`，`unbound/未绑定 -> UNBIND`，`binding/绑定中 -> BINDING`，`unavailable/不可用 -> UNAVAILABLE`。
- Zenlayer 返回的 `BINDED` 状态会归一为本地 `bound`，`BINDING` 归一为 `binding`，`UNAVAILABLE` 归一为 `unavailable`。已绑定公网 IP 不能作为绑定接口的可用目标；测试绑定/解绑需要导入 `status=unbound` 且带有 `external_ip_id` 的独立 EIP。
- 如果供应商暂存项没有返回可识别状态，但本次拉取请求指定了 `status=unbound`，后端会把该暂存项展示为 `available`，避免前端把可绑定 IP 误判为 `unknown`。


### 21.1. 获取 IP 拉取批次

- 地址：`GET /api/v1/assets/ip-pull-runs/{pull_run_id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pull_run_id` | integer | 是 | IP 拉取批次 ID，等于拉取任务 `task_id`。 |

返回值：

- `data`: `ProviderIPPullRun`

说明：

- 该接口读取 Redis 暂存摘要。若 TTL 已过期，返回稳定错误 `IP_PULL_RUN_EXPIRED`，前端需要重新调用 `pull-from-provider`。
- 返回中包含 `page`、`page_size`、`page_count`、`expires_at`、`cached`、`total_count`、`pulled_count`、`imported_count`。


### 21.2. 获取 IP 拉取暂存列表

- 地址：`GET /api/v1/assets/ip-pull-runs/{pull_run_id}/items`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pull_run_id` | integer | 是 | IP 拉取批次 ID，等于拉取任务 `task_id`。 |

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码。 |
| `page_size` | integer | 否 | 每页条数。 |
| `status` | string | 否 | 暂存 IP 状态。 |
| `type` | string | 否 | IP 类型。 |
| `region` | string | 否 | 区域。 |
| `ip` | string | 否 | IP 地址模糊匹配。 |

返回值：

- `data.items`: `ProviderIPPullItem` 数组

说明：

- 该接口读取 Redis 暂存项，并支持在当前暂存页内按 `status/type/region/ip` 过滤和本地分页。
- 每条暂存项包含 `imported` 和 `imported_ip_id`。后端会根据本地 `sv_asset_ips.ip` 或 `account_id + external_ip_id` 判断是否已导入。
- 若 Redis TTL 已过期，返回稳定错误 `IP_PULL_RUN_EXPIRED`。


### 21.3. 从暂存结果导入 IP

- 地址：`POST /api/v1/assets/ips/import-from-provider`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pull_run_id` | integer | 是 | IP 拉取批次 ID，等于拉取任务 `task_id`。该批次必须为 `succeeded` 且 Redis 暂存未过期。 |
| `import_all` | boolean | 否 | 是否导入该批次当前 Redis 暂存页的全部项。 |
| `item_ids` | integer array | 否 | 要导入的暂存项 ID 列表。`import_all=false` 时必填。 |

返回值：

- `data`: `TaskAck`

说明：

- 导入任务只读取 Redis 暂存项，不再直接调用供应商 IP 查询接口。
- 已导入过的暂存项再次导入会按幂等逻辑跳过或更新，不会重复创建本地 IP。
- 任务完成后会更新 Redis 暂存项的 `import_status`、`imported`、`imported_ip_id` 和摘要的 `imported_count`。


### 22. 更新 IP

- 地址：`POST /api/v1/assets/ips/update`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地 IP 主键。 |
| `type` | string | 否 | IP 类型。 |
| `region` | string | 否 | 区域。 |
| `status` | string | 否 | 状态。 |
| `ownership` | string | 否 | 归属。 |
| `external_ip_id` | string | 否 | 云平台 IP ID。 |
| `metadata` | object | 否 | 附加元数据。 |
| `tags` | array | 否 | 资源标签；提交空数组表示清空。 |

返回值：

- `data.ok`: 是否执行成功


### 23. 删除 IP

- 地址：`POST /api/v1/assets/ips/delete`

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 本地 IP 主键。 |

返回值：

- `data.ok`: 是否执行成功


### 24. 绑定 IP 到机器

- 地址：`POST /api/v1/assets/machines/{machine_id}/ips/bind`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ip_id` | integer | 是 | 本地 IP 主键。 |
| `bind_type` | string | 否 | 绑定类型。 |
| `is_primary` | boolean | 否 | 是否设为主 IP。 |
| `provider_binding_id` | string | 否 | 云平台绑定记录 ID。 |

返回值：

- `data.id`: 绑定记录主键


### 25. 解绑 IP

- 地址：`POST /api/v1/assets/machines/{machine_id}/ips/unbind`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ip_id` | integer | 是 | 本地 IP 主键。 |

返回值：

- `data.ok`: 是否执行成功


### 26. 切换主 IP

- 地址：`POST /api/v1/assets/machines/{machine_id}/ips/switch-primary`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | integer | 是 | 本地机器主键。 |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `ip_id` | integer | 是 | 目标主 IP 的本地主键。 |

返回值：

- `data.ok`: 是否执行成功

说明：

- 如果供应商不支持主 IP 切换，接口可能返回冲突错误
