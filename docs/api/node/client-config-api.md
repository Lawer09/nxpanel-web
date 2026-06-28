# Node Service Client Config API

## Client Config Generation

客户端配置不保存完整 `vless://` 文本，而是按请求动态生成：

- 用户 UUID 来自 `sv_node_users.uuid`，必须是 active 用户。
- 节点必须是 enabled 且 `type=vless`。
- `host` 来自 `client.public_host`，缺失返回 `400`。
- `port` 优先来自 `client.public_port`，缺失时回退到 `listen.port`。
- `security` 来自 `tls.mode`：`reality`、`tls` 或 `none`。
- Reality 参数：`pbk=tls.reality.public_key`，`sid=tls.reality.short_id`，`sni/servername=tls.server_name`，`fp=tls.reality.client_fingerprint`。
- Transport 参数：`transport.network` 写入 `type`，`ws` 时写入 `path` 和可用 host header。
- `flow` 优先读取 `settings.flow`；`encryption=none` 固定输出。
- URI fragment 使用 `client.name`，缺失时使用 `tag`，再缺失使用 `<type>-<node_id>`。

单节点响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "node_id": 1001,
    "user_id": 2001,
    "type": "vless",
    "name": "SG Reality 01",
    "uri": "vless://15154628-502d-48ee-8a85-4155a9fa0547@sg02.example.com:443?encryption=none&flow=xtls-rprx-vision&fp=chrome&pbk=ZjpNYQmksW-TtrdY5VgodkC6_E4ZLd8AfvrdTJU6El0&security=reality&servername=www.apple.com&sid=f8fce744dd0f88a0&sni=www.apple.com&type=tcp#SG+Reality+01",
    "client": {
      "name": "SG Reality 01",
      "node_tag": "sg",
      "public_host": "sg02.example.com",
      "public_port": 443
    }
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

按用户聚合响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user_id": 2001,
    "configs": []
  },
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```
