# Node Service 节点配置说明

## Node Config Fields

节点配置直接使用 Snapshot 同名字段保存。

- `id`: 省略或 `<= 0` 时由 `node-service` 自动生成。
- `tag`: Agent-facing inbound tag，省略时默认为 `<type>-<node_id>`，会进入 Agent Snapshot。
- `client`: 前端和客户端分享配置元数据，不进入 Agent Snapshot。
- `listen.bind_ip`: 省略时默认为 `0.0.0.0`。
- `listen.port`: 省略时默认为 `443`。
- `tls.mode=tls`: `tls.cert.domain` 默认取 `tls.server_name`，`tls.cert.timeout` 默认 `60`，`tls.cert.key_type` 默认 `ec256`；`key_type` 可选值为 `ec256`、`ec384`、`rsa2048`、`rsa3072`、`rsa4096`、`rsa8192`。
- `tls.mode=reality`: `tls.reality.private_key`、`tls.reality.public_key`、`tls.reality.short_id` 省略时自动生成；只传 `private_key` 时会派生 `public_key`。
- `tls.mode=reality`: `tls.reality.client_fingerprint` 只用于客户端分享配置，不进入 Agent Snapshot；可选值为 `chrome`、`chrome_psk`、`chrome_psk_shuffle`、`chrome_padding_psk_shuffle`、`chrome_pq`、`chrome_pq_psk`、`firefox`、`safari`、`ios`、`android`、`edge`、`360`、`qq`、`random`、`randomized`。
- `transport.network=ws`: `transport.settings.path` 省略时自动生成 `/` + 6 位随机数字字母。

`client` 字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 否 | 节点展示名称；创建时省略则默认使用 `tag`。 |
| `node_tag` | 否 | 前端自定义标记，不进入 Agent Snapshot。 |
| `public_host` | 是 | 客户端连接公网域名或 IP。生成分享 URI 不使用 `listen.bind_ip`。 |
| `public_port` | 否 | 客户端连接公网端口；生成分享 URI 时省略则回退到 `listen.port`。 |

Agent Snapshot 字段仍以 `backend-agent-api.md` 为准。`client` 只服务前端展示和客户端配置生成。

## Example Node Payload

```http
POST /api/v1/nodes
```

```json
{
  "id": 1001,
  "client": {
    "name": "SG Reality 01",
    "node_tag": "sg",
    "public_host": "sg02.example.com",
    "public_port": 443
  },
  "tag": "vless-1001",
  "type": "vless",
  "enabled": false,
  "listen": {
    "bind_ip": "0.0.0.0",
    "port": 443,
    "tcp_fast_open": false
  },
  "settings": {
    "flow": "xtls-rprx-vision"
  },
  "tls": {
    "mode": "reality",
    "server_name": "www.apple.com",
    "reality": {
      "client_fingerprint": "chrome"
    }
  },
  "transport": {
    "network": "tcp",
    "settings": {}
  },
  "multiplex": {
    "enabled": false,
    "padding": false,
    "brutal": {
      "enabled": false,
      "up_mbps": 0,
      "down_mbps": 0
    }
  },
  "limiter": {
    "enable_realtime": true,
    "speed_limit": 0,
    "ip_limit": 0,
    "ip_online_min_traffic": 200,
    "report_min_traffic": 0,
    "block": {
      "protocol": ["bittorrent"],
      "regexp": []
    }
  }
}
```
