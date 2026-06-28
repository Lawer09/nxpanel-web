# Node Service 通用说明


本文档描述前端通过 `node-service` 控制面管理 Agent、节点、绑定、用户、运行状态和客户端分享配置的接口。前端不直接调用 `/api/v2/agent/*`，运行面接口只供 `nx-node` 使用。

所有控制面接口通过 gateway `jwt` 入口访问；下游 `node-service` 仍要求 `service_auth`、HTTP Subject 和 `X-Subject-Scopes`。缺少对应权限时返回 `403 AUTH_PERMISSION_DENIED`。

Agent 首次启动可调用 `POST /api/v2/agent/register` 主动注册。该接口不接受控制面 JWT，也不使用运行面 `agent_secret`；Agent 必须携带 `machine_id` 和 asset-service 下发的一次性 `asset-key_` 信任 token。`node-service` 会通过 asset-service 内部接口校验并消费该 token，成功后返回一次性明文 `agent_secret`。后续 snapshot/report 仍使用 `Authorization: Bearer <agent_secret>` 和 `X-Agent-ID`。

Agent 注册请求：

```http
POST /api/v2/agent/register
```

```json
{
  "machine_id": "machine-sg-01",
  "trust_token": "asset-key_xxxxxxxxxxxxx",
  "agent_id": "agent-machine-sg-01",
  "hostname": "sg-node-01",
  "version": "1.0.0"
}
```

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "agent_id": "agent-machine-sg-01",
    "agent_secret": "plain-secret-returned-once",
    "pull_interval": 30,
    "report_interval": 30
  }
}
```

权限码分组：
- Agent 管理：`node:agent:read`、`node:agent:create`、`node:agent:update`、`node:agent:delete`、`node:agent:reset-secret`、`node:agent:deploy`
- 节点管理：`node:node:read`、`node:node:create`、`node:node:update`、`node:node:delete`
- Agent 节点绑定：`node:binding:read`、`node:binding:create`、`node:binding:update`、`node:binding:delete`
- 节点用户与客户端配置：`node:user:read`、`node:user:create`、`node:user:update`、`node:user:delete`
- 运行态查询：`node:runtime:read`
- 配置模板：`node:template:*` 已在权限目录预留，当前模板控制面 handler 不存在时不会被消费。

成功响应统一为：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```
