# Node Service Core API

## Core APIs

Agent:

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/nodes/agents` | 查询 Agent 列表。 |
| `GET` | `/api/v1/nodes/agents/{agent_id}` | 查询 Agent 详情。 |
| `POST` | `/api/v1/nodes/agents` | 创建 Agent，`agent_secret` 只在本次响应返回。 |
| `POST` | `/api/v1/nodes/agents/deploy` | 绑定资产机器并通过 asset-service 内部 SSH 执行安装脚本，`agent_secret` 只在本次响应返回。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/update` | 更新机器、状态和拉取/上报间隔。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/delete` | 软删除 Agent。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/reset-secret` | 重置 secret，仅本次响应返回明文。 |

### Agent List

`GET /api/v1/nodes/agents?page=1&page_size=100`

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `page` | 否 | 页码，默认 `1`。 |
| `page_size` | 否 | 每页数量，默认 `100`，最大 `500`。 |

响应 `data` 使用通用分页结构，`data.items[]` 为 Agent 控制面记录。

### Agent Object

Agent 控制面记录字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 内部数据库主键。 |
| `agent_id` | Agent 业务标识，也是 snapshot/report 的作用域。 |
| `machine_id` | 允许运行面鉴权的机器业务标识。 |
| `asset_machine_id` | 通过 asset-service 部署时绑定的资产机器 ID；未绑定时省略。 |
| `status` | Agent 状态：`active`、`disabled`、`deleted`。 |
| `snapshot_version` | Agent 当前快照版本，节点、绑定、用户等可见配置变化时会更新。 |
| `pull_interval` | snapshot 拉取间隔秒数。 |
| `report_interval` | runtime 上报间隔秒数。 |
| `last_seen_at` | 最近一次运行面成功访问时间，可能为 `null`。 |
| `created_at` | 创建时间。 |
| `updated_at` | 更新时间。 |

响应中不会返回 `agent_secret_hash`。

### Agent Detail

`GET /api/v1/nodes/agents/{agent_id}`

用途：查询指定 Agent 的控制面记录。

路径参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `agent_id` | 是 | Agent 业务标识。 |

响应 `data` 为 Agent 控制面记录。

### Agent Create

`POST /api/v1/nodes/agents`

权限：`node:agent:create`

用途：手动创建 Agent 控制面记录，并生成或写入运行面 Bearer 凭据。`agent_secret` 只在本次响应返回一次，数据库仅保存 hash。

请求体：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `agent_id` | 是 | Agent 业务标识，不能为空。 |
| `machine_id` | 是 | 允许运行面鉴权的机器业务标识，不能为空。 |
| `asset_machine_id` | 否 | 资产机器 ID。传入 `0` 或省略表示不绑定资产机器。 |
| `agent_secret` | 否 | 自定义运行面 Bearer secret。省略时服务端自动生成。 |
| `status` | 否 | Agent 状态，可选 `active`、`disabled`、`deleted`，省略默认 `active`。 |
| `pull_interval` | 否 | snapshot 拉取间隔秒数，省略默认 `30`，范围 `1..3600`。 |
| `report_interval` | 否 | runtime 上报间隔秒数，省略默认 `30`，范围 `1..3600`。 |

响应 `data`：

| 字段 | 说明 |
| --- | --- |
| `agent` | Agent 控制面记录。 |
| `agent_secret` | 一次性明文 secret，仅本次响应返回。 |

示例：

```json
{
  "agent_id": "agent-sg-01",
  "machine_id": "machine-sg-01",
  "status": "active",
  "pull_interval": 30,
  "report_interval": 30
}
```

### Agent Delete

`POST /api/v1/nodes/agents/{agent_id}/delete`

权限：`node:agent:delete`

用途：软删除 Agent。删除后该 Agent 不能继续通过运行面鉴权。

响应 `data`：

| 字段 | 说明 |
| --- | --- |
| `ok` | 删除成功时为 `true`。 |

### Agent Reset Secret

`POST /api/v1/nodes/agents/{agent_id}/reset-secret`

权限：`node:agent:reset-secret`

用途：重置 Agent 运行面 Bearer secret。新的 `agent_secret` 只在本次响应返回一次，旧 secret 立即失效。

响应 `data`：

| 字段 | 说明 |
| --- | --- |
| `agent` | Agent 控制面记录。 |
| `agent_secret` | 新的一次性明文 secret，仅本次响应返回。 |

### Agent Update

`POST /api/v1/nodes/agents/{agent_id}/update`

用途：更新指定 Agent 的机器归属、状态和拉取/上报间隔。`agent_id` 是路径参数，不允许放入请求体。

请求体：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `machine_id` | 否 | 机器业务标识。传入时不能为空字符串。 |
| `asset_machine_id` | 否 | 资产机器 ID。传入 `0` 或负数会清空绑定。 |
| `status` | 否 | Agent 状态，可选 `active`、`disabled`、`deleted`。 |
| `pull_interval` | 否 | snapshot 拉取间隔秒数，范围 `1..3600`。 |
| `report_interval` | 否 | runtime 上报间隔秒数，范围 `1..3600`。 |

错误说明：

- 请求体包含未知字段会返回 `400`。例如不能包含 `agent_id`。
- 未传任何可更新字段时，返回当前 Agent 详情。

示例：

```json
{
  "machine_id": "provider-zenlayer-1-160",
  "status": "active",
  "pull_interval": 60,
  "report_interval": 60
}
```


### Agent Deploy

`POST /api/v1/nodes/agents/deploy`

权限：`node:agent:deploy`

用途：

- 通过 `asset_machine_id` 绑定 `asset-service` 机器和 `node-service` Agent。
- 生成新的 `agent_secret`，数据库只保存 bcrypt hash。
- 生成远端安装脚本，并调用 `asset-service` 内部 `/internal/v1/assets/machines/{machine_id}/run-command` 创建 SSH 执行任务。
- `node-service` 不保存 SSH 密码或私钥，也不直接连机器。

请求体：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `asset_machine_id` | 是 | `asset-service` 的 `sv_asset_machines.id`。 |
| `agent_id` | 否 | 省略时默认为 `agent-{asset_machine_id}`。 |
| `binary_url` | 否 | nx-node 二进制下载地址，省略时使用 `agent_deploy.binary_url`。 |
| `node_service_base_url` | 否 | 写入 Agent 配置的 node-service 运行面地址，省略时使用 `agent_deploy.node_service_base_url`。 |
| `pull_interval` | 否 | snapshot 拉取间隔秒数，默认 `30`。 |
| `report_interval` | 否 | runtime 上报间隔秒数，默认 `30`。 |
| `timeout_seconds` | 否 | asset SSH 执行任务超时，默认 `300`，最大 `1800`。 |
| `force` | 否 | 已绑定机器时是否重置 secret 并重新创建部署任务。默认 `false`。 |

响应 `data`：

| 字段 | 说明 |
| --- | --- |
| `agent` | Agent 控制面记录，包含 `asset_machine_id`。 |
| `agent_secret` | 一次性明文 secret，仅本次响应返回。 |
| `machine` | 资产机器摘要，不包含密码或私钥。 |
| `deploy_task` | asset-service 创建的 task ack，可继续通过 task-service 查询进度。 |

示例：

```json
{
  "asset_machine_id": 10001,
  "binary_url": "https://download.example.com/nx-node-linux-amd64",
  "node_service_base_url": "https://node.example.com",
  "force": true
}
```

Node:

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/nodes` | 查询节点列表。 |
| `GET` | `/api/v1/nodes/summary` | 查询前端列表摘要，包含 `client`、绑定数、用户数和最近启动状态。 |
| `GET` | `/api/v1/nodes/{node_id}` | 查询节点详情。 |
| `POST` | `/api/v1/nodes` | 创建节点。 |
| `POST` | `/api/v1/nodes/{node_id}/update` | 更新节点元数据或配置字段。 |
| `POST` | `/api/v1/nodes/{node_id}/delete` | 删除节点并生成绑定 tombstone。 |
| `GET` | `/api/v1/nodes/{node_id}/snapshot` | 查询该节点实际下发给 Agent 的配置；用户 `uuid` 按存储值返回。 |
| `GET` | `/api/v1/nodes/{node_id}/runtime` | 查询节点在各 Agent 上的最近运行状态。 |

节点列表支持通用分页参数：`page`、`page_size`，响应 `data` 使用通用分页结构，`data.items[]` 为节点记录。

Binding and user:

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/nodes/agents/{agent_id}/bindings` | 查询 Agent 节点绑定。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/bindings` | 绑定节点到 Agent。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/bindings/{node_id}/update` | 更新绑定状态。 |
| `POST` | `/api/v1/nodes/agents/{agent_id}/bindings/{node_id}/delete` | 删除绑定并进入删除语义。 |
| `GET` | `/api/v1/nodes/{node_id}/users` | 查询节点用户，`uuid` 按存储值返回，不做脱敏。 |
| `POST` | `/api/v1/nodes/{node_id}/users` | 新增用户。 |
| `POST` | `/api/v1/nodes/{node_id}/users/batch-create` | 批量新增用户，整批事务写入。 |
| `POST` | `/api/v1/nodes/{node_id}/users/batch-update` | 批量更新用户，整批事务写入。 |
| `POST` | `/api/v1/nodes/{node_id}/users/batch-delete` | 批量物理删除用户，整批事务写入。 |
| `POST` | `/api/v1/nodes/{node_id}/users/{user_id}/update` | 更新用户凭据、限速、IP 限制或状态。 |
| `POST` | `/api/v1/nodes/{node_id}/users/{user_id}/delete` | 物理删除用户。 |

绑定列表和用户列表支持通用分页参数：`page`、`page_size`，响应 `data` 使用通用分页结构。

Client config:

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/nodes/{node_id}/users/{user_id}/client-config` | 生成该用户在该节点上的客户端分享配置。首期仅支持 `vless://`。 |
| `GET` | `/api/v1/nodes/users/{user_id}/client-configs` | 查询包含该用户的所有启用节点客户端分享配置。首期仅支持 `vless://`。 |

Runtime:

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/nodes/agents/{agent_id}/runtime` | 查询 Agent 运行状态、节点启动状态、在线和流量汇总。 |
| `GET` | `/api/v1/nodes/{node_id}/runtime` | 查询节点在所有绑定 Agent 上的运行状态。 |
| `GET` | `/api/v1/nodes/runtime/overview` | 查询运行态总览，包含在线 Agent 数、异常 Agent 数、异常节点数、当前在线用户/IP 和近 24h 流量。 |
| `GET` | `/api/v1/nodes/agents/{agent_id}/runtime/samples?node_id=&window=30m` | 查询 Agent 维度最近采样曲线。 |
| `GET` | `/api/v1/nodes/{node_id}/runtime/samples?agent_id=&window=30m` | 查询节点维度最近采样曲线。 |
| `GET` | `/api/v1/nodes/{node_id}/traffic?agent_id=&user_id=&start_time=&end_time=&step=1m` | 查询节点流量时间序列。 |
| `GET` | `/api/v1/nodes/agents/{agent_id}/traffic?node_id=&user_id=&start_time=&end_time=&step=1m` | 查询 Agent 流量时间序列。 |
| `GET` | `/api/v1/nodes/{node_id}/online?agent_id=&include_users=true` | 查询节点当前在线用户数和在线 IP 数。 |
| `GET` | `/api/v1/nodes/{node_id}/events?agent_id=&event_type=&limit=100` | 查询节点 runtime 事件。 |
| `GET` | `/api/v1/nodes/agents/{agent_id}/events?event_type=&limit=100` | 查询 Agent runtime 事件。 |


Runtime 详细字段、参数、前端接入建议和示例见 [runtime-api.md](runtime-api.md)。
