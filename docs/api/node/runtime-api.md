# Node Service Runtime API

## Runtime Common Rules

通用约定：

- 所有时间字段使用 RFC3339 时间字符串；前端展示时自行转换到浏览器时区。
- `runtime` 详情接口优先读 Redis 热数据；Redis miss 或过期时回退 PostgreSQL 最新摘要。
- `fresh` 表示最近 runtime 上报是否仍在 `runtime.stale_after` 窗口内，默认配置为 `90s`。
- `stale_seconds` 表示距最近 runtime 上报的秒数，适合直接用于“已离线 N 秒”提示。
- `source` 固定为 `redis` 或 `postgres`。`postgres` 表示当前结果来自持久化摘要，通常意味着比热数据更旧。
- `runtime_reported_at` 是最近一次 runtime 上报时间。
- `reported_at` 当前实现与 `runtime_reported_at` 一致，可作为通用显示字段；前端优先展示 `runtime_reported_at`。
- `online_reported_at` 是在线窗口的最近时间。
- `traffic_reported_at` 是当前累计流量摘要的最近桶时间。
- `startup`、`tls`、`metrics` 是 Agent report 的透传字段，完整结构以 `backend-agent-api.md` 为准。

前端建议重点消费这些透传字段：

- `startup`：`healthy`、`state`、`stage`、`last_error`、`last_failed_at`。
- `tls`：`healthy`、`state`、`stage`、`domain`、`not_after`、`last_error`、`checked_at`。
- `metrics`：`cpu`、`mem.used`、`mem.total`、`active_connections`、`total_connections`、`tcp_connections`、`active_users`、`inbound_speed`、`outbound_speed`。

其余透传字段建议放到“原始 JSON / 高级详情”折叠区，不建议全部平铺在列表中。

## Runtime Overview

`GET /api/v1/nodes/runtime/overview`

用途：

- 驱动运行态总览页顶层卡片。
- 给首页提供全局健康和近 24 小时流量摘要。

响应字段：

| 字段 | 类型 | 说明 | 前端建议 |
| --- | --- | --- | --- |
| `online_agents` | int64 | 最近 `stale_after` 窗口内仍有心跳的 Agent 数。 | 顶部卡片。 |
| `unhealthy_agents` | int64 | `kernel.healthy=false` 的 Agent 数。 | 告警卡片。 |
| `unhealthy_nodes` | int64 | 最近热状态中 `startup.healthy=false` 的节点数。 | 告警卡片。 |
| `current_online_users` | int64 | 当前在线窗口内有在线记录的用户数。 | 顶部卡片。 |
| `current_online_ips` | int64 | 当前在线 IP 聚合数量。 | 顶部卡片。 |
| `traffic_upload_24h` | int64 | 近 24 小时上行流量，单位字节。 | 统计卡片。 |
| `traffic_download_24h` | int64 | 近 24 小时下行流量，单位字节。 | 统计卡片。 |

说明：

- 近 24 小时流量来自 PostgreSQL 分钟聚合，稳定可用。
- 在线数、异常数优先来自 Redis 热数据；若 Redis 不可用，这部分值可能偏低或为 `0`，但不会影响流量统计。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "online_agents": 3,
    "unhealthy_agents": 1,
    "unhealthy_nodes": 2,
    "current_online_users": 14,
    "current_online_ips": 19,
    "traffic_upload_24h": 123456789,
    "traffic_download_24h": 987654321
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Agent Runtime Detail

`GET /api/v1/nodes/agents/{agent_id}/runtime`

用途：

- 驱动 Agent 详情页。
- 展示该 Agent 的 kernel 状态，以及该 Agent 下各节点最近运行状态。

响应结构：

- `agent`：Agent 基本信息，来自控制面数据库。
- `kernel`：该 Agent 自身 runtime 状态。
- `nodes[]`：该 Agent 下每个节点的最近状态。

`kernel` 关键字段：

| 字段 | 说明 |
| --- | --- |
| `healthy` | Agent 进程整体是否健康。 |
| `state` | Agent 当前状态。 |
| `last_error` | 最近一次 kernel 失败摘要。 |
| `started_at` | Agent 启动时间。 |
| `updated_at` | Agent 内部状态更新时间。 |
| `reported_at` | 最近一次 kernel 上报时间。 |

`nodes[]` 关键字段：

| 字段 | 说明 | 前端建议 |
| --- | --- | --- |
| `node_id` | 节点 ID。 | 列表主键。 |
| `client` | 前端展示元数据。 | 可取 `client.name`、`client.node_tag`。 |
| `tag` | Agent-facing tag。 | 技术字段，详情可见。 |
| `type` | 协议类型。 | 列表展示。 |
| `enabled` | 是否启用。 | 状态标签。 |
| `startup` | 最近启动/应用摘要。 | 列表优先读 `healthy/state/stage/last_error`。 |
| `tls` | 最近 TLS/Reality 摘要。 | 列表优先读 `healthy/state/domain/not_after/last_error`。 |
| `metrics` | 最近性能指标。 | 详情页或 hover 展示。 |
| `fresh` | 是否仍在新鲜窗口内。 | 新鲜/离线标签。 |
| `stale_seconds` | 距最近 runtime 上报秒数。 | “X 秒前上报”。 |
| `source` | `redis` 或 `postgres`。 | 可选显示，不必高亮。 |
| `online_users` | 当前在线用户数。 | 列表摘要。 |
| `online_ips` | 当前在线 IP 数。 | 列表摘要。 |
| `traffic_upload_bytes` | 当前累计上行流量。 | 详情页统计。 |
| `traffic_download_bytes` | 当前累计下行流量。 | 详情页统计。 |

空状态：

- `kernel=null` 表示该 Agent 还没有有效 report。
- `nodes=[]` 表示当前 Agent 没有有效绑定节点，或尚未产生可读状态。
- `startup`、`tls`、`metrics` 为空时，前端应显示“未上报”，不要显示为失败。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "agent": {
      "agent_id": "agent-sg-01",
      "machine_id": "machine-sg-01",
      "status": "active",
      "snapshot_version": "1761234567890",
      "pull_interval": 30,
      "report_interval": 30,
      "last_seen_at": "2026-06-16T10:00:20Z",
      "created_at": "2026-06-10T09:00:00Z",
      "updated_at": "2026-06-16T10:00:20Z"
    },
    "kernel": {
      "agent_id": "agent-sg-01",
      "version": "1.12.0",
      "healthy": true,
      "state": "running",
      "reported_at": "2026-06-16T10:00:20Z"
    },
    "nodes": [
      {
        "node_id": 1001,
        "client": {
          "name": "SG Reality 01",
          "node_tag": "sg"
        },
        "tag": "vless-1001",
        "type": "vless",
        "enabled": true,
        "startup": {
          "healthy": true,
          "state": "running",
          "stage": "ready"
        },
        "tls": {
          "mode": "reality",
          "healthy": true,
          "state": "ready",
          "checked_at": 1781235320
        },
        "metrics": {
          "cpu": 12.5,
          "active_connections": 48,
          "active_users": 12,
          "mem": {
            "used": 2147483648,
            "total": 4294967296
          },
          "inbound_speed": 1048576,
          "outbound_speed": 2097152
        },
        "runtime_reported_at": "2026-06-16T10:00:20Z",
        "reported_at": "2026-06-16T10:00:20Z",
        "fresh": true,
        "stale_seconds": 8,
        "source": "redis",
        "online_users": 12,
        "online_ips": 15,
        "online_reported_at": "2026-06-16T10:00:20Z",
        "traffic_upload_bytes": 123456789,
        "traffic_download_bytes": 987654321,
        "traffic_reported_at": "2026-06-16T10:00:00Z"
      }
    ]
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Node Runtime Detail

`GET /api/v1/nodes/{node_id}/runtime`

用途：

- 驱动节点详情页。
- 从“一个节点在多个 Agent 上”的视角展示运行状态。

响应结构：

- `node`：节点本身信息。
- `agents[]`：该节点在每个 Agent 上的最近 runtime 状态。

`agents[]` 与 `Agent Runtime` 的 `nodes[]` 共享大部分字段，额外提供：

| 字段 | 说明 |
| --- | --- |
| `agent_id` | Agent 标识。 |
| `machine_id` | 该 Agent 绑定机器。 |
| `agent_status` | Agent 控制面状态。 |
| `last_seen_at` | Agent 最近被服务端感知到的时间。 |

适合展示：

- 节点详情页顶部显示 `node.client.name`、`node.type`、`node.enabled`。
- 表格按 `agents[]` 展示不同机器上的运行差异。
- 若某个 Agent `fresh=false` 但其他 Agent 正常，不应将整个节点标记为全局失败，建议按 Agent 行区分。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "node": {
      "id": 1001,
      "client": {
        "name": "SG Reality 01",
        "node_tag": "sg"
      },
      "tag": "vless-1001",
      "type": "vless",
      "enabled": true,
      "updated_at": "2026-06-16T09:58:00Z"
    },
    "agents": [
      {
        "agent_id": "agent-sg-01",
        "machine_id": "machine-sg-01",
        "agent_status": "active",
        "last_seen_at": "2026-06-16T10:00:20Z",
        "startup": {
          "healthy": true,
          "state": "running",
          "stage": "ready"
        },
        "tls": {
          "mode": "reality",
          "healthy": true,
          "state": "ready"
        },
        "metrics": {
          "cpu": 12.5,
          "active_connections": 48,
          "active_users": 12
        },
        "runtime_reported_at": "2026-06-16T10:00:20Z",
        "reported_at": "2026-06-16T10:00:20Z",
        "fresh": true,
        "stale_seconds": 8,
        "source": "redis",
        "online_users": 12,
        "online_ips": 15,
        "online_reported_at": "2026-06-16T10:00:20Z",
        "traffic_upload_bytes": 123456789,
        "traffic_download_bytes": 987654321,
        "traffic_reported_at": "2026-06-16T10:00:00Z"
      }
    ]
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Runtime Samples

`GET /api/v1/nodes/agents/{agent_id}/runtime/samples`

`GET /api/v1/nodes/{node_id}/runtime/samples`

用途：

- 驱动最近 CPU、内存、连接数、速率、在线用户变化曲线。

查询参数：

| 参数 | 用于 Agent 维度 | 用于节点维度 | 说明 |
| --- | --- | --- | --- |
| `node_id` | 可选 | 否 | 只看某个节点。 |
| `agent_id` | 否 | 可选 | 节点维度下只看某个 Agent。 |
| `window` | 可选 | 可选 | 例如 `10m`、`30m`、`1h`。省略时默认 `runtime.sample_retention`，当前默认 `30m`。超过 `runtime.max_chart_window` 时会被截断，当前默认上限 `1h`。 |

响应字段：

| 字段 | 说明 |
| --- | --- |
| `window` | 实际生效窗口，可能小于请求值。 |
| `step` | 服务端返回的建议图表步长，由 `sample_retention / sample_max_points` 计算；当前示例配置下默认是 `10s`。 |
| `series[]` | 一条曲线对应一个 `agent_id + node_id` 维度。 |
| `series[].points[]` | 原始采样点，不做补点。 |

`points[]` 固定字段：

| 字段 | 单位 | 说明 |
| --- | --- | --- |
| `reported_at` | RFC3339 | 采样点时间。 |
| `cpu` | 百分比 | CPU 使用率。 |
| `mem_used` | 字节 | 已用内存。 |
| `mem_total` | 字节 | 总内存。 |
| `active_connections` | 个 | 当前活跃连接数。 |
| `total_connections` | 个 | 累计连接数。 |
| `tcp_connections` | 个 | 当前 TCP 连接数。 |
| `inbound_speed` | B/s | 入站速率。 |
| `outbound_speed` | B/s | 出站速率。 |
| `active_users` | 个 | 当前活跃用户数。 |

说明：

- 数据来自 Agent report 中的 `metrics`，只保留最近窗口，不做长期历史仓储。
- 返回的 `step` 是建议展示粒度，不代表每个时间点都一定有数据。
- 实际点间隔受 Agent 的 `report_interval` 限制。如果 Agent 每 `30s` 上报一次，曲线上也只会出现约 `30s` 一次的点。
- 无数据时返回 `series=[]` 或 `points=[]`，前端应展示“最近窗口暂无采样”。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "window": "30m0s",
    "step": "10s",
    "series": [
      {
        "agent_id": "agent-sg-01",
        "node_id": 1001,
        "points": [
          {
            "reported_at": "2026-06-16T10:00:00Z",
            "cpu": 12.5,
            "mem_used": 2147483648,
            "mem_total": 4294967296,
            "active_connections": 48,
            "total_connections": 1024,
            "tcp_connections": 40,
            "inbound_speed": 1048576,
            "outbound_speed": 2097152,
            "active_users": 12
          }
        ]
      }
    ]
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Traffic Series

`GET /api/v1/nodes/{node_id}/traffic`

`GET /api/v1/nodes/agents/{agent_id}/traffic`

用途：

- 驱动节点或 Agent 的流量时间序列图。

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `agent_id` | 否 | 节点维度下按 Agent 过滤。 |
| `node_id` | 否 | Agent 维度下按节点过滤。 |
| `user_id` | 否 | 按用户过滤。 |
| `start_time` | 否 | RFC3339。省略时默认 `end_time - 1h`。 |
| `end_time` | 否 | RFC3339。省略时默认当前 UTC 时间。 |
| `step` | 否 | 当前实现按持久化桶大小精确查询。建议省略，或传 `runtime.traffic_bucket` 的实际值；默认配置为 `1m`。 |

说明：

- 流量数据来自 PostgreSQL 分钟聚合表，不依赖 Redis 热缓存。
- 当前实现只落库一个桶粒度，默认是 `1m`。如果前端传入与落库桶大小不一致的 `step`，结果可能为空。
- 返回结果不会自动补零。若图表需要连续时间轴，前端应自行补空桶。

响应字段：

| 字段 | 说明 |
| --- | --- |
| `start_time` | 实际起始时间。 |
| `end_time` | 实际结束时间。 |
| `step` | 实际查询桶大小。 |
| `points[]` | 每个时间桶的流量值。 |
| `points[].bucket_start` | 桶开始时间。 |
| `points[].upload_bytes` | 本桶上行字节数。 |
| `points[].download_bytes` | 本桶下行字节数。 |

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "start_time": "2026-06-16T09:00:00Z",
    "end_time": "2026-06-16T10:00:00Z",
    "step": "1m",
    "points": [
      {
        "bucket_start": "2026-06-16T09:58:00Z",
        "upload_bytes": 1048576,
        "download_bytes": 2097152
      },
      {
        "bucket_start": "2026-06-16T09:59:00Z",
        "upload_bytes": 2097152,
        "download_bytes": 3145728
      }
    ]
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Online Summary

`GET /api/v1/nodes/{node_id}/online`

用途：

- 驱动节点详情页的“当前在线”卡片和按用户在线排行。

查询参数：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `agent_id` | 否 | 只看某个 Agent 上该节点的在线情况。省略时聚合所有 Agent。 |
| `include_users` | 否 | 传 `true` 时返回 `users[]`；省略或其他值视为 `false`。 |

响应字段：

| 字段 | 说明 |
| --- | --- |
| `node_id` | 节点 ID。 |
| `agent_id` | 当前过滤的 Agent；聚合全部 Agent 时为空。 |
| `online_users` | 当前在线用户数。统计口径是 `online_count > 0` 的用户个数。 |
| `online_ips` | 当前在线 IP 数。统计口径是所有 `online_count` 之和。 |
| `users[]` | 可选，仅在 `include_users=true` 时返回。 |
| `users[].user_id` | 用户 ID。 |
| `users[].online_count` | 当前用户在线 IP 数。 |

说明：

- 不返回原始 IP 列表，只返回聚合结果。
- 省略 `agent_id` 时，`users[]` 会按所有 Agent 聚合。
- 无在线数据时返回 `online_users=0`、`online_ips=0`、`users=[]`。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "node_id": 1001,
    "agent_id": "agent-sg-01",
    "online_users": 12,
    "online_ips": 15,
    "users": [
      {
        "user_id": 2001,
        "online_count": 2
      },
      {
        "user_id": 2002,
        "online_count": 1
      }
    ]
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Runtime Events

`GET /api/v1/nodes/{node_id}/events`

`GET /api/v1/nodes/agents/{agent_id}/events`

用途：

- 驱动异常事件列表、时间线和最近告警面板。

查询参数：

| 参数 | 节点维度 | Agent 维度 | 说明 |
| --- | --- | --- | --- |
| `agent_id` | 可选 | 否 | 节点维度下只看某个 Agent。 |
| `event_type` | 可选 | 可选 | 当前可用值为 `kernel`、`startup`、`tls`。 |
| `limit` | 可选 | 可选 | 返回条数，默认 `100`。当前无分页。 |

响应字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 事件 ID。 |
| `agent_id` | 事件所属 Agent。 |
| `node_id` | 节点事件才会有值；`kernel` 事件通常为空。 |
| `event_type` | `kernel`、`startup`、`tls`。 |
| `healthy` | 该次状态是否健康。 |
| `state` | 当前状态。 |
| `stage` | 当前阶段或失败阶段。 |
| `last_error` | 最近错误摘要。 |
| `payload` | 事件原始 JSON。`startup`/`tls`/`kernel` 的结构分别对应对应 report 字段。 |
| `reported_at` | 事件发生时间。 |

说明：

- 事件只在状态变化时写入，不是每次 report 都会写。
- `kernel` 更适合展示 Agent 整体异常与恢复。
- `startup` 更适合展示节点应用配置失败、规则失败、端口占用等问题。
- `tls` 更适合展示证书申请、续期、Reality 校验异常。
- 当前没有分页，前端应按 `limit` 控制首屏数量。

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "agent_id": "agent-sg-01",
      "node_id": 1001,
      "event_type": "startup",
      "healthy": false,
      "state": "failed",
      "stage": "apply_inbound",
      "last_error": "listen tcp :443: bind: address already in use",
      "payload": {
        "healthy": false,
        "state": "failed",
        "stage": "apply_inbound",
        "last_error": "listen tcp :443: bind: address already in use"
      },
      "reported_at": "2026-06-16T10:00:00Z"
    }
  ],
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

## Frontend Display Notes

如果前端只做展示，以上接口已经足够覆盖：

- 总览卡片。
- Agent 详情页。
- 节点详情页。
- 最近变化图表。
- 在线用户/IP 摘要。
- 异常事件列表。

仍需前端自己处理的部分：

- 字节、速率、时间戳、本地时区格式化。
- `traffic` 空桶补零。
- `startup`、`tls`、`metrics` 原始 JSON 的高级展开视图。
- “未上报”“已离线”“使用数据库回退”这三类空/旧数据状态文案。
