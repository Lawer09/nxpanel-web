# Node Service Node Users API

## Node Users

用户写入时 `uuid` 为明文凭据，读接口和写入响应都会按存储值直接返回，不做脱敏。`speed_limit = 0` 表示不限速，`ip_limit <= 0` 表示不限在线 IP 数。用户新增、更新、删除都会更新绑定该节点的 Agent `snapshot_version`，前端应提示等待 Agent 下一轮拉取生效。

单个新增：

```http
POST /api/v1/nodes/{node_id}/users
```

```json
{
  "user_id": 1001,
  "uuid": "15154628-502d-48ee-8a85-4155a9fa0547",
  "speed_limit": 0,
  "ip_limit": 0,
  "status": "active"
}
```

批量新增：

```http
POST /api/v1/nodes/{node_id}/users/batch-create
```

```json
{
  "users": [
    {
      "user_id": 1001,
      "uuid": "15154628-502d-48ee-8a85-4155a9fa0547",
      "speed_limit": 0,
      "ip_limit": 0,
      "status": "active"
    }
  ]
}
```

批量更新：

```http
POST /api/v1/nodes/{node_id}/users/batch-update
```

```json
{
  "users": [
    {
      "user_id": 1001,
      "uuid": "15154628-502d-48ee-8a85-4155a9fa0547",
      "speed_limit": 10485760,
      "ip_limit": 2,
      "status": "active"
    }
  ]
}
```

批量删除：

```http
POST /api/v1/nodes/{node_id}/users/batch-delete
```

```json
{
  "user_ids": [1001, 1002]
}
```

批量接口采用 all-or-nothing 语义：数组不能为空，请求内 `user_id` 不能重复；任一用户非法、缺失或数据库写入失败都会回滚整批操作。批量删除是物理删除，不使用 `status = "deleted"`。
