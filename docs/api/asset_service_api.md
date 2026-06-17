# Asset Service API

本文档整理 `asset-service` 当前对外提供的资产控制接口，供 Dev 资产控制台前端对接使用。

## 基础信息

- 网关基础路径：`/api/v1/assets`
- 前端 Dev 代理别名：`/v4/assets/*`
- 认证方式：`Authorization: Bearer <admin_jwt>`
- 成功判定：HTTP `200` 且响应体 `code === 0`

## 通用返回格式

所有接口统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "request_id": "req-xxx",
  "timestamp": 1717824000
}
```

分页列表中的 `data` 结构为：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

## 资源范围

本期 Dev 资产控制台只覆盖以下资源：

- `Provider`
- `ProviderAccount`
- `Machine`
- `MachineIP`
- `IP`
- `SSHKey`
- `Operation`
- `TaskAck`

## 主要接口

### Provider / ProviderAccount

- `GET /api/v1/assets/providers`
- `GET /api/v1/assets/provider-accounts`
- `POST /api/v1/assets/provider-accounts/create`
- `POST /api/v1/assets/provider-accounts/update`
- `POST /api/v1/assets/provider-accounts/delete`
- `POST /api/v1/assets/provider-accounts/{account_id}/test-connection`

前端约定：

- 编辑供应商账号时，凭证区默认折叠。
- 更新时若未提交 `credential`，表示不更新凭证。

### Machine

- `GET /api/v1/assets/machines`
- `GET /api/v1/assets/machines/{machine_id}`
- `POST /api/v1/assets/machines/create-manual`
- `POST /api/v1/assets/machines/create-from-provider`
- `POST /api/v1/assets/machines/import-from-provider`
- `POST /api/v1/assets/machines/update`
- `POST /api/v1/assets/machines/delete`
- `POST /api/v1/assets/machines/{machine_id}/destroy-provider-instance`
- `POST /api/v1/assets/machines/{machine_id}/sync`
- `POST /api/v1/assets/machines/run-command`

前端约定：

- 手动创建和编辑共用一套表单，`spec` 只暴露高频字段，保留高级 JSON。
- 销毁云实例前必须要求用户输入 `external_instance_id` 二次确认。
- 执行命令按高危动作处理，使用批量弹窗，不单独开页面。

### IP

- `GET /api/v1/assets/ips`
- `GET /api/v1/assets/ips/{ip_id}`
- `POST /api/v1/assets/ips/import-manual`
- `POST /api/v1/assets/ips/import-from-provider`
- `POST /api/v1/assets/ips/update`
- `POST /api/v1/assets/ips/delete`
- `POST /api/v1/assets/machines/{machine_id}/ips/bind`
- `POST /api/v1/assets/machines/{machine_id}/ips/unbind`
- `POST /api/v1/assets/machines/{machine_id}/ips/switch-primary`

前端约定：

- IP 绑定流程统一从机器详情抽屉的 `IP 绑定` 页签发起。
- IP 详情页只展示当前关联机器信息，不承载复杂双向绑定表单。

### SSH Key

- `GET /api/v1/assets/ssh-keys`
- `GET /api/v1/assets/ssh-keys/{key_id}`
- `POST /api/v1/assets/ssh-keys/create-custom`
- `POST /api/v1/assets/ssh-keys/import-provider-key`
- `POST /api/v1/assets/ssh-keys/import-from-provider`
- `POST /api/v1/assets/ssh-keys/create-provider-key`
- `POST /api/v1/assets/ssh-keys/update`
- `POST /api/v1/assets/ssh-keys/delete`

前端约定：

- SSH 密钥详情不回显私钥明文，只展示 `has_private_key`。
- 单个供应商密钥导入和供应商侧创建共用表单骨架，保留 `payload` 高级 JSON。

### Operation

- `GET /api/v1/assets/operations`
- `GET /api/v1/assets/operations/{operation_id}`

前端约定：

- 所有返回 `TaskAck` 的异步动作提交成功后，统一跳转 `/dev/asset-operations`。
- 操作详情使用抽屉查看 `摘要 / 请求数据 / 结果数据`，不单独拆详情页。

## TaskAck

异步提交类接口成功时，`data` 返回：

```json
{
  "task_id": 123,
  "status": "pending",
  "task_url": "/api/v1/tasks/123"
}
```

前端统一行为：

- 弹成功提示
- 提供“查看操作记录”入口
- 默认跳转到 `/dev/asset-operations?task_id=<task_id>`

## 错误处理

常见错误：

- `401`：认证失败
- `403`：无权限
- `404`：资源不存在
- `409`：资源冲突，或供应商能力不支持当前动作
- `502`：供应商侧调用失败

当响应为 `409` 且 `error.detail === "capability_not_supported"` 时，前端应明确提示“当前供应商能力不支持此操作”，并保留按钮但禁用提示，不伪装为功能缺失。
