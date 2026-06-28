# Asset Service 创建机器 API

本文档只描述机器创建相关接口。所有接口都使用项目通用返回格式，写操作成功返回 HTTP `200`。

## 1. 创建候选项查询

```http
GET /api/v1/assets/provider-accounts/{account_id}/machine-create/{category}
```

路径参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。后端通过该账号推导供应商。 |
| `category` | string | 是 | 候选项类型。 |

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `zone_id` | string | 部分必填 | 供应商位置 ID。查询规格、镜像、VPC 时通常必填。Zenlayer 映射为 `zoneId`。 |
| `country_code` | string | 否 | 国家缩写，主要用于前端筛选。 |
| `city` | string | 否 | 城市。Zenlayer 当前无城市维度，预留给其他供应商。 |
| `vpc_id` | string | 否 | VPC ID。当前公开候选不要求传入；创建时后端内部用它查找 subnet。 |
| `refresh` | boolean | 否 | 是否请求刷新缓存。即使为 `true`，也会受最小刷新间隔保护。 |

支持的 `category`：

| category | 返回 group | 说明 |
| --- | --- | --- |
| `zones` | `zone.zone_id` | 位置候选。`value` 是提交给创建接口的 `zone.zone_id`。 |
| `instance-types` | `spec.type` | 机器规格候选。需要 `zone_id`。 |
| `os-images` | `os.image_id` | 操作系统镜像候选。需要 `zone_id`。 |
| `vpcs` | `vpc.vpc_id` | VPC 候选。需要 `zone_id`；`extra` 包含 CIDR 展示字段。 |
| `bandwidth-options` | `internet.*` | 公网网络候选。推荐使用 `internet.charge_type`、`internet.bandwidth_mbps`、`internet.traffic_package_size`、`internet.eip_v4_type`。 |
| `ssh-keys` | `login.provider_key_id` | 供应商 SSH key 候选。 |
| `timezones` | `time_zone` | 操作系统时区候选。 |
| `billing-options` | `billing.*` | 计费模式候选。 |
| `tag-options` | `tags` | 标签候选，当前可为空数组。 |

候选响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.account_id` | integer | 供应商账号主键。 |
| `data.provider_code` | string | 供应商代码，例如 `zenlayer`。 |
| `data.category` | string | 请求的候选类型。 |
| `data.country_code` | string | 请求中的国家缩写。 |
| `data.city` | string | 请求中的城市。 |
| `data.zone_id` | string | 请求中的位置 ID。 |
| `data.vpc_id` | string | 请求中的 VPC ID。 |
| `data.cache_ttl_seconds` | integer | Redis 缓存 TTL，当前为 `86400`。 |
| `data.min_refresh_age_seconds` | integer | 最小刷新间隔。 |
| `data.option_groups` | array | 标准候选分组。 |

`option_groups[]` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `field` | string | 创建请求字段路径，例如 `zone.zone_id`。 |
| `depends_on` | string[] | 前端需要先选择的字段。 |
| `options` | array | 候选项。 |
| `extra` | object | 分组缓存状态和 catalog 类型。 |

`options[]` 固定格式：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 前端列表 key。 |
| `value` | string/number/boolean | 实际提交给创建接口的值。 |
| `extra.label` | string | 前端展示文本。 |
| `extra.selectable` | boolean | 是否可选择。 |
| `extra.raw` | object | 脱敏后的供应商原始摘要，仅用于排查，不应作为提交字段来源。 |

缓存规则：

| 项 | 说明 |
| --- | --- |
| 缓存介质 | Redis。 |
| TTL | 24 小时。 |
| key 格式 | `asset:machine-create-catalog:v1:{account_id}:{catalog_type}:{scope}:{request_hash}`。 |
| 刷新策略 | 懒加载。缓存未命中或过期时请求供应商并写入 Redis。 |
| 失败兜底 | 供应商失败且有旧缓存时返回 `stale=true`；完全无缓存时返回 `502 COMMON_BAD_GATEWAY`。 |

## 2. 创建询价

```http
POST /api/v1/assets/provider-accounts/{account_id}/machine-create/price
```

路径参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键，会覆盖请求体中的 `account_id`。 |

请求体与 `POST /api/v1/assets/machines/create-from-provider` 相同。

响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.account_id` | integer | 供应商账号主键。 |
| `data.provider_code` | string | 供应商代码。 |
| `data.currency` | string | 币种。 |
| `data.total_price` | number | 总价。供应商未返回时为 `0`。 |
| `data.breakdown` | object | 价格明细。 |
| `data.provider_raw` | object | 脱敏后的供应商询价响应。 |

## 3. 从供应商创建机器

```http
POST /api/v1/assets/machines/create-from-provider
```

行为：

| 阶段 | 说明 |
| --- | --- |
| 1 | 先写入一条或多条本地机器账本，`status=creating`、`source=provider`、`sync_status=create_pending`。 |
| 2 | 创建 `asset.provider.create_machines` 异步任务，并返回 `task_id` 和本地机器列表。 |
| 3 | worker 调用供应商 `CreateInstance`。拿到 `instanceId` 后立即写入本地 `external_instance_id`，机器保持 `status=creating`，`sync_status=provider_created`。 |
| 4 | worker 最多轮询 2 分钟供应商实例详情。只有实例状态可归一为 `active` 且至少回填到一个 IP 时，任务才标记 `succeeded`，机器更新为 `active/synced`。 |
| 5 | 如果 2 分钟内详情或 IP 仍未就绪，任务标记 `failed`，但本地机器保留 `external_instance_id` 和 `creating/provider_detail_pending` 或 `creating/provider_ip_pending`，后续后台 worker 会继续周期性补齐。 |
| 6 | 创建期间机器被锁定，不允许修改、重试、删除或销毁。 |
| 7 | 后续供应商同步成功但不再返回该实例时，机器状态展示为 `missing`，表示云端实例可能已在供应商侧被直接删除或释放。 |

请求体字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account_id` | integer | 是 | 供应商账号主键。 |
| `name` | string | 是 | 机器名称。批量创建时后端追加序号。 |
| `zone` | object | 是 | 位置对象。 |
| `spec` | object | 是 | 设备规格。 |
| `os` | object | 是 | 操作系统。 |
| `disk` | object | 是 | 磁盘。当前只支持系统盘大小。 |
| `vpc` | object | 是 | VPC。 |
| `bandwidth_mbps` | integer | 否 | 兼容字段，带宽 Mbps。推荐使用 `internet.bandwidth_mbps`。 |
| `internet` | object | 否 | 公网网络配置。未传 `internet.bandwidth_mbps` 时使用顶层 `bandwidth_mbps` 兜底。 |
| `login` | object | 是 | 登录认证。 |
| `tags` | array | 否 | 资源标签，格式为 `[{key,value,label}]`。创建时写入本地机器账本，后续供应商同步不会覆盖本地 tags。 |
| `time_zone` | string | 是 | 操作系统时区。 |
| `billing` | object | 是 | 计费模式。 |
| `count` | integer | 否 | 创建数量，默认 `1`，最大 `100`。 |
| `client_request_id` | string | 否 | 幂等键，作用域为 `account_id`。 |
| `metadata` | object | 否 | 本地展示元数据，不允许放敏感信息。 |

`zone` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `country_code` | string | 是 | 国家缩写。 |
| `city` | string | 否 | 城市。Zenlayer 下允许为空。 |
| `zone_id` | string | 是 | 供应商位置 ID。Zenlayer 映射为 `zoneId`。 |

`spec` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 规格 ID。使用候选项 `spec.type` 的 `value`。 |
| `cpu_cores` | integer | 否 | CPU 核心数，本地展示快照。 |
| `memory_mb` | integer | 否 | 内存 MiB，本地展示快照。 |

`os` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `image_id` | string | 是 | 镜像 ID。Zenlayer 映射为 `imageId`。 |
| `name` | string | 否 | 操作系统名称，本地展示快照。 |
| `version` | string | 否 | 操作系统版本，本地展示快照。 |

`disk` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `system_size_gb` | integer | 是 | 系统盘 GiB。Zenlayer 映射为 `systemDisk.diskSize`。 |

`vpc` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `vpc_id` | string | 是 | VPC ID。Zenlayer 创建不直接使用 `vpcId`，后端会按 `zone_id + vpc_id` 选择第一个 subnet 作为 `subnetId`。 |
| `vswitch_id` | string | 条件 | Alibaba Cloud ECS 必填，对应 `VSwitchId`。 |
| `cidr_block_v4` | string | 否 | IPv4 网段，本地展示快照。 |
| `cidr_block_v6` | string | 否 | IPv6 网段，本地展示快照。 |

`internet` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `charge_type` | string | 否 | 公网计费类型，Zenlayer 默认 `ByTrafficPackage`。 |
| `bandwidth_mbps` | integer | 条件 | 公网带宽 Mbps。未传时使用顶层 `bandwidth_mbps`，最终值必须大于 `0`。 |
| `traffic_package_size` | integer | 否 | 流量包大小，默认 `0`，允许为 `0`。 |
| `eip_v4_type` | string | 否 | 通用 IPv4 EIP 类型，默认 `BGP`。Zenlayer 实际发送 `eipV4Type=BGPLine` 和 `networkLineType=PremiumBGP`。 |

`login` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `auth_type` | string | 是 | `provider_key` 或 `password`。 |
| `provider_key_id` | string | 条件 | `auth_type=provider_key` 时必填。必须先通过 `POST /api/v1/assets/ssh-keys/import-from-provider` 或 `import-provider-key` 把供应商 SSH key 同步到本地。 |
| `ssh_key_id` | integer | 否 | 本地 SSH key 主键。通常由 `provider_key_id` 匹配得出。 |
| `username` | string | 条件 | `auth_type=password` 时必填；`provider_key` 时可传 `root` 作为展示用户名。 |
| `password` | string | 条件 | `auth_type=password` 时必填。敏感字段，只进入加密任务 payload，不写日志、不进入公开响应。 |

补充限制：

- Zenlayer 创建时 `password` 和 `provider_key_id` 二选一，不能同时指定。
- Zenlayer Windows 和 Generic 类型镜像不支持指定密码或 key，后端会以供应商返回错误为准。
- Provider SSH key 导入后如果 `has_private_key=false`，仍可用于供应商创建机器；但不能用于后续依赖本地私钥的 SSH 自动执行。

`billing` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `mode` | string | 是 | 计费模式，例如 `POSTPAID` 或 `PREPAID`。 |
| `period` | integer | 否 | 包年包月周期。 |
| `period_unit` | string | 否 | 周期单位。 |

请求示例：

```json
{
  "account_id": 1,
  "name": "na-edge",
  "zone": {
    "country_code": "US",
    "city": "",
    "zone_id": "na-central-2a"
  },
  "spec": {
    "type": "z2a.cpu.1",
    "cpu_cores": 1,
    "memory_mb": 2048
  },
  "os": {
    "image_id": "almalinux101_20260516",
    "name": "AlmaLinux",
    "version": "10.1"
  },
  "disk": {
    "system_size_gb": 20
  },
  "vpc": {
    "vpc_id": "1604048104989008897",
    "cidr_block_v4": "10.0.0.0/8",
    "cidr_block_v6": ""
  },
  "bandwidth_mbps": 10,
  "internet": {
    "charge_type": "ByTrafficPackage",
    "bandwidth_mbps": 10,
    "traffic_package_size": 0,
    "eip_v4_type": "BGP"
  },
  "login": {
    "auth_type": "provider_key",
    "provider_key_id": "key-xxx",
    "username": "root",
    "password": ""
  },
  "tags": [],
  "time_zone": "Africa/Abidjan",
  "billing": {
    "mode": "POSTPAID"
  },
  "count": 1,
  "client_request_id": "create-na-edge-001",
  "metadata": {}
}
```

响应字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.task_id` | integer | Task service 任务 ID。 |
| `data.status` | string | 初始任务状态。 |
| `data.task_url` | string | 任务详情 API 路径。 |
| `data.machines` | array | 已写入本地账本的机器列表。 |

任务查询：

- 前端通过 `GET /api/v1/tasks/{task_id}` 查询创建任务。
- 批量创建时可通过 `GET /api/v1/tasks/{task_id}/items` 查看单机子项。
- 创建任务 `succeeded` 代表供应商实例已可查询、机器已 `active`、至少有一个 IP 已回填。
- 创建任务 `failed` 但机器存在 `external_instance_id` 时，不代表云端创建失败；若机器仍是 `creating/provider_detail_pending` 或 `creating/provider_ip_pending`，后台 worker 会继续补齐。

## 4. 手动添加机器

```http
POST /api/v1/assets/machines/create-manual
```

请求体复用创建公共字段，不需要 `account_id/count/client_request_id`。额外字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `machine_id` | string | 否 | 本地业务 ID，不传时后端生成。 |
| `status` | string | 否 | 默认 `stopped`。 |
| `external_instance_id` | string | 否 | 手动关联已有供应商实例时可填写。 |

手动添加只写本地资产，不调用供应商。

## 5. 重试供应商机器创建

```http
POST /api/v1/assets/machines/{machine_id}/retry-provider-create
```

仅允许 `source=provider`、`external_instance_id` 为空且状态为 `creating` 或 `create_failed` 的机器重试。已经拿到 `external_instance_id` 但仍处于 `provider_created`、`provider_detail_pending` 或 `provider_ip_pending` 的机器不能重试，后台会继续补齐。

请求体使用与供应商创建相同的公共字段；未传字段从机器保存的 `create_request_json` 中读取。

注意：`create_request_json` 是脱敏保存的展示请求，不保存登录密码明文。如果原创建请求使用 `login.auth_type=password`，重试时必须重新提交 `login.username` 和 `login.password`，不能依赖已保存的脱敏值。

## 6. Zenlayer 映射

| 公共字段 | Zenlayer 字段 |
| --- | --- |
| `zone.zone_id` | `zoneId` |
| `spec.type` | `instanceType` |
| `os.image_id` | `imageId` |
| `disk.system_size_gb` | `systemDisk.diskSize` |
| `vpc.vpc_id` | 后端查询 `DescribeSubnets` 后选择第一个 `subnetId` |
| `bandwidth_mbps` | 兼容字段，未传 `internet.bandwidth_mbps` 时作为 `bandwidth` 兜底 |
| `internet.charge_type` | `internetChargeType` |
| `internet.bandwidth_mbps` | `bandwidth` |
| `internet.traffic_package_size` | `trafficPackageSize`，默认传 `0` |
| `internet.eip_v4_type` | `eipV4Type` 和 `networkLineType`；通用值 `BGP` 在 Zenlayer 中映射为 `BGPLine` / `PremiumBGP` |
| `time_zone` | `timeZone` |
| `billing.mode` | `instanceChargeType` |
| `billing.period` | `period` |
| `billing.period_unit` | `periodUnit` |
| `login.provider_key_id` | `keyId` |
| `login.password` | `password` |

Zenlayer 当前没有城市维度，`zone.city` 允许为空。`country_name` 不提交，只用于候选展示。

Agent 注册配置不会通过 Zenlayer `userData` 下发。供应商实例创建完成并回填 IP 后，`asset-service` 会创建 SSH 注入任务，将 `machine_id` 和 `trust_token` 以 JSON 格式写入 `/etc/nx-platform/asset.config`。

## 7. Alibaba Cloud ECS 映射

供应商代码为 `alibaba_cloud`，产品线为 ECS。后端使用 `github.com/alibabacloud-go/ecs-20140526/v7` SDK，不接受前端传递阿里云原始 payload。

候选接口补充说明：

| category | 返回 group | 说明 |
| --- | --- | --- |
| `zones` | `zone.zone_id` | `value` 为 ECS `ZoneId`；`extra.region_id` 为创建、镜像、VPC、EIP 查询所需的 `RegionId`。 |
| `instance-types` | `spec.type` | `value` 为 ECS `InstanceType`。 |
| `os-images` | `os.image_id` | `value` 为 ECS `ImageId`；查询时按 `zone_id` 推导 `RegionId`。 |
| `vpcs` | `vpc.vpc_id`、`vpc.vswitch_id` | ECS 创建必须提交 `vpc.vswitch_id`，其 `value` 为 `VSwitchId`。 |
| `ssh-keys` | `login.provider_key_id` | `value` 为 ECS KeyPairName。 |
| `billing-options` | `billing.mode`、`billing.period_unit` | `billing.mode` 使用 `PostPaid` 或 `PrePaid`。 |
| `bandwidth-options` | `internet.charge_type`、`internet.bandwidth_mbps` | `internet.charge_type` 使用 `PayByTraffic` 或 `PayByBandwidth`。 |

创建字段映射：

| 公共字段 | Alibaba Cloud ECS 字段 |
| --- | --- |
| `zone.zone_id` | `ZoneId` |
| `zone.extra.region_id` / 后端推导值 | `RegionId` |
| `spec.type` | `InstanceType` |
| `os.image_id` | `ImageId` |
| `disk.system_size_gb` | `SystemDisk.Size` |
| `vpc.vswitch_id` | `VSwitchId` |
| `internet.bandwidth_mbps` | `InternetMaxBandwidthOut` |
| `internet.charge_type` | `InternetChargeType` |
| `billing.mode` | `InstanceChargeType` |
| `billing.period` | `Period` |
| `billing.period_unit` | `PeriodUnit` |
| `login.provider_key_id` | `KeyPairName` |
| `login.password` | `Password` |

限制：

- Alibaba Cloud ECS 创建必须传 `vpc.vswitch_id`，不能只传 `vpc.vpc_id` 后让后端自动选择交换机。
- 第一版不支持机器创建询价，`POST /api/v1/assets/provider-accounts/{account_id}/machine-create/price` 返回 `409 CAPABILITY_NOT_SUPPORTED`。
- Alibaba Cloud 凭证只支持 `access_key_id` 和 `access_key_secret`，不支持 `access_token`。
- `time_zone` 会保存在本地创建请求和机器元数据中；ECS `RunInstances` 当前不使用该字段作为 SDK 参数。
- Agent 注册配置不会通过 ECS `UserData` 下发。供应商实例创建完成并回填 IP 后，`asset-service` 会创建 SSH 注入任务，将 `machine_id` 和 `trust_token` 以 JSON 格式写入 `/etc/nx-platform/asset.config`。

## 8. 错误

| HTTP | 错误类型 | 说明 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 缺少必填字段、未知字段、登录方式冲突、模板变量非法。 |
| 404 | `COMMON_NOT_FOUND` | 供应商账号或机器不存在。 |
| 409 | `COMMON_CONFLICT` / `CAPABILITY_NOT_SUPPORTED` | 资源冲突、创建期间机器被锁定、供应商不支持该能力，或无法为选定 VPC 自动找到 subnet。 |
| 502 | `COMMON_BAD_GATEWAY` | 供应商 catalog、询价或创建调用失败且没有缓存兜底。 |
| 503 | `COMMON_UNAVAILABLE` | task-service、Redis 或 service token 未就绪。 |

敏感字段如供应商凭证、登录密码、SSH 私钥、token、签名串不得进入日志、公开响应、Redis 缓存或 `create_request_json`。
