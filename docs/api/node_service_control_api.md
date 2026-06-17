# Node Service Control API

## Overview

- Frontend prefix: `/v4/control/*`
- Service register frontend prefix: `/v4/service-register-manager/*`
- Gateway verify path: `/api/v1/control/*`
- Service register verify path: `/api/v1/service-register-manager/*`
- Local dev proxy target: `http://8.220.74.20:8080`
- Dev control requests use the temporary Dev admin JWT flow: `Authorization: Bearer <admin_jwt>`.
- Service register requests still use app auth headers during development.
- Create interfaces are handled as HTTP `200` on success.

Success response shape:

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "request_id": "req_xxx",
  "timestamp": 1781235331
}
```

Frontend success detection must use `HTTP 200` and `code === 0`.

## Dev Control Auth

`/v4/control/*` does not use app signature auth. It uses the same temporary Dev admin login as `/v4/admin/*`.

```http
Authorization: Bearer <admin_jwt>
```

The frontend stores this token only in Dev-specific `sessionStorage` keys. It does not write to the existing `auth_token`, `secure_path`, or `user_info` fields used by the old management console login.

## Service Register Test Auth

`/v4/service-register-manager/*` still uses app signature auth.

```http
X-API-ID: <app_id>
X-Timestamp: <unix-seconds>
X-Nonce: <unique-random-string>
X-Body-SHA256: <lowercase-sha256-hex>
X-Signature: <lowercase-hmac-sha256-hex>
```

`X-Signature` is computed as:

```text
HMAC-SHA256(app_secret, signing_string)
```

`signing_string` is:

```text
HTTP_METHOD + "\n" +
REQUEST_PATH + "\n" +
CANONICAL_QUERY + "\n" +
BODY_SHA256 + "\n" +
TIMESTAMP + "\n" +
NONCE + "\n" +
API_ID
```

`CANONICAL_QUERY` rules:

- only query params, never the path
- sort by key ascending
- URL encode both key and value
- join as `a=1&b=2`
- empty string when there is no query

`REQUEST_PATH` must use the gateway verify path. For service register requests, use `/api/v1/service-register-manager/services`, not `/v4/service-register-manager/services`.

## Node Snapshot Config

Node create and update requests now submit a complete Snapshot-style object at the top level. The Dev frontend no longer submits `config_json`, `rules_json`, or `options_json` for node create/update. `id` and `tag` are optional on create.

Legacy detail responses may still contain base64-encoded `config_json`, `rules_json`, and `options_json`. The frontend request layer keeps decoding those fields for backwards-compatible detail rendering.

Node create/update payload:

```json
{
  "type": "shadowsocks",
  "enabled": false,
  "client": {
    "public_host": "node.example.com"
  },
  "listen": {
    "bind_ip": "0.0.0.0",
    "port": 10001,
    "tcp_fast_open": false
  },
  "settings": {
    "cipher": "2022-blake3-aes-128-gcm",
    "server_key": "server-key"
  },
  "tls": {
    "mode": "none"
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

The non-JSON form tab covers every editable field in this payload. The JSON tab edits the same complete object, not a nested section. There are no `Advanced JSON` fields in form mode.

`limiter.block.protocol` and `limiter.block.regexp` replace the previous `rules_json` form fields. `users` and `limiter.remote_online_ip_count` are runtime/authorization data and are not edited by the node create/update form.

### Snapshot field groups

| Field | Type | Description |
| --- | --- | --- |
| `id` | number | Backend node ID |
| `tag` | string | sing-box inbound tag |
| `type` | string | Protocol type |
| `enabled` | boolean | Whether the node is enabled |
| `client` | object | Client-facing connection metadata |
| `listen` | object | Listen config |
| `settings` | object | Protocol-specific server parameters |
| `tls` | object | none/tls/reality security config |
| `transport` | object | tcp/ws/grpc/httpupgrade transport config |
| `multiplex` | object | sing-box multiplex config |
| `limiter` | object | Node limiter and block rules |

`client` fields:

| Field | Required | Description |
| --- | --- | --- |
| `name` | No | Display name. When omitted on create, the backend defaults to `tag`. |
| `node_tag` | No | Frontend custom marker. It is not part of Agent Snapshot semantics. |
| `public_host` | Yes | Client connection public domain or IP. |
| `public_port` | No | Client connection public port. When omitted, share URI generation falls back to `listen.port`. |

Form mode field visibility is linked to related choices:

- `type=shadowsocks`: `settings.cipher`, `settings.server_key`
- `type=vless`: `settings.flow`
- `type=vmess`: no recommended required settings fields
- `type=trojan`: no protocol-specific required settings fields
- `type=tuic`: `settings.congestion_control`, `settings.zero_rtt_handshake`
- `type=hysteria`: `settings.up_mbps`, `settings.down_mbps`, `settings.obfs`
- `type=hysteria2`: `settings.ignore_client_bandwidth`, `settings.up_mbps`, `settings.down_mbps`, `settings.obfs`, `settings.obfs_password`
- `type=anytls`: `settings.padding_scheme`
- `tls.mode=none`: submit only `{ "mode": "none" }`
- `tls.mode=tls`: submit `server_name` and `cert`
- `type=vless` allows `tls.mode=reality`; other protocols do not expose `reality`
- only `type=vless` exposes `transport`; other protocols submit `transport: { "network": "tcp", "settings": {} }`
- `transport.network=tcp`: submit empty `settings`, except `vless` may submit legacy HTTP header transport fields
- `transport.network=grpc`: submit `settings.service_name`
- `transport.network=ws`: submit `settings.path` and `settings.headers`
- `transport.network=httpupgrade`: submit `settings.path` and `settings.host`; only `vless` consumes this structure
- `multiplex.enabled=false`: clear `padding` and brutal values to disabled defaults

### Protocol settings

`vless`:

| Field | Type | Description |
| --- | --- | --- |
| `flow` | string | Optional. Current available value is `xtls-rprx-vision`; empty or omitted means disabled. |

`vmess`: no recommended required `settings` fields.

`shadowsocks`:

| Field | Type | Description |
| --- | --- | --- |
| `cipher` | string | Required. shadowsocks method. |
| `server_key` | string | Required. Server master password. |

Method and key length:

| Method | Key length |
| --- | --- |
| `2022-blake3-aes-128-gcm` | `16` |
| `2022-blake3-aes-256-gcm` | `32` |
| `2022-blake3-chacha20-poly1305` | `32` |
| `none` | `/` |
| `aes-128-gcm` | `/` |
| `aes-192-gcm` | `/` |
| `aes-256-gcm` | `/` |
| `chacha20-ietf-poly1305` | `/` |
| `xchacha20-ietf-poly1305` | `/` |

`trojan`: no protocol-specific required `settings` fields. TLS uses `tls`; transport uses `transport`.

`tuic`:

| Field | Type | Description |
| --- | --- | --- |
| `congestion_control` | string | tuic congestion control. |
| `zero_rtt_handshake` | boolean | tuic 0-RTT. |

`anytls`:

| Field | Type | Description |
| --- | --- | --- |
| `padding_scheme` | string[] | anytls padding scheme. |

`hysteria`:

| Field | Type | Description |
| --- | --- | --- |
| `up_mbps` | number | Upload bandwidth parameter, unit Mbps. |
| `down_mbps` | number | Download bandwidth parameter, unit Mbps. |
| `obfs` | string | Obfuscation parameter. |

`hysteria2`:

| Field | Type | Description |
| --- | --- | --- |
| `ignore_client_bandwidth` | boolean | Whether to ignore client bandwidth. |
| `up_mbps` | number | Upload bandwidth parameter, unit Mbps. |
| `down_mbps` | number | Download bandwidth parameter, unit Mbps. |
| `obfs` | string | Obfuscation type or compatible parameter. |
| `obfs_password` | string | Obfuscation password. |

Limiter config:

| Field | Type | Description |
| --- | --- | --- |
| `enable_realtime` | boolean | Whether realtime limiter checks are enabled. |
| `speed_limit` | number | Default node speed limit, unit bytes per second (B/s); `0` means unlimited. |
| `ip_limit` | number | Default IP limit; `0` or negative means unlimited. |
| `ip_online_min_traffic` | number | Minimum traffic threshold used to identify online IPs, unit KiB. |
| `report_min_traffic` | number | Minimum traffic threshold for reporting, unit KiB. |
| `block` | object | Blocked protocol and regexp rules. |

The frontend may let operators enter friendlier units for these values. Requests still submit the original backend units: `speed_limit` in B/s, and traffic thresholds in KiB. The speed unit selector supports `B/s`, `KiB/s`, `MiB/s`, `GiB/s`, and `Mbps`; `Mbps` is converted as `1 Mbps = 125000 B/s`.

Reality config:

| Field | Type | Description |
| --- | --- | --- |
| `private_key` | string | Reality server private key. |
| `short_id` | string | Reality short id. |
| `client_fingerprint` | string | Reality client fingerprint. |
| `dest` | string | Reality handshake target address. Empty uses `server_name`. |
| `server_port` | string | Reality handshake target port. |
| `max_time_diff` | string | Maximum time difference, for example `1m`; may be empty. |

Current recommended `client_fingerprint` values:

- `chrome`
- `chrome_psk`
- `chrome_psk_shuffle`
- `chrome_padding_psk_shuffle`
- `chrome_pq`
- `chrome_pq_psk`
- `firefox`
- `safari`
- `ios`
- `android`
- `edge`
- `360`
- `qq`
- `random`
- `randomized`

TLS cert config adds:

| Field | Type | Description |
| --- | --- | --- |
| `key_type` | string | Certificate private key type. Available values: `ec256`, `ec384`, `rsa2048`, `rsa3072`, `rsa4096`, `rsa8192`. Default is `ec256`. It only affects the ACME-issued certificate private key, not Reality and not the ACME account key. |

### Transport

```json
{
  "network": "tcp",
  "settings": {}
}
```

| Field | Type | Description |
| --- | --- | --- |
| `network` | string | Transport type. Current supported values are `tcp`, `ws`, `grpc`, and `httpupgrade`. |
| `settings` | object | Transport settings for the selected `network`. Field names use `snake_case`. |

Protocol constraints:

- `vless`: supports `tcp`, `ws`, `grpc`, `httpupgrade`.
- Other protocols: do not use this transport structure; the frontend submits `tcp` with empty `settings`.

`tcp`:

Plain `tcp` can use an empty object:

```json
{
  "network": "tcp",
  "settings": {}
}
```

`vless` also supports legacy HTTP header transport under `tcp`:

```json
{
  "network": "tcp",
  "settings": {
    "header": {
      "type": "http",
      "request": {
        "method": "GET",
        "path": ["/"],
        "headers": {
          "Host": ["example.com"]
        }
      }
    }
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `header.type` | string | Enables HTTP header transport only when the value is `http`; other values fall back to plain `tcp`. |
| `header.request.method` | string | HTTP request method. |
| `header.request.path` | string[] | HTTP request paths; the current project consumes only the first item. |
| `header.request.headers.Host` | string[] | HTTP Host list. |

`header.response` is not consumed.

`ws`:

```json
{
  "network": "ws",
  "settings": {
    "path": "/ws?ed=256",
    "headers": {
      "Host": "example.com"
    }
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `path` | string | WebSocket path. It may include a query string; the current project parses `ed` as early data. |
| `headers` | object | WebSocket request headers as `map[string]string`. |

The current project always uses `Sec-WebSocket-Protocol` as the early data header name, so it does not need to be included in the snapshot. `vless` consumes this structure.

`grpc`:

```json
{
  "network": "grpc",
  "settings": {
    "service_name": "grpc-service"
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `service_name` | string | gRPC service name. |

`vless` consumes this structure.

`httpupgrade`:

```json
{
  "network": "httpupgrade",
  "settings": {
    "path": "/upgrade",
    "host": "example.com"
  }
}
```

| Field | Type | Description |
| --- | --- | --- |
| `path` | string | HTTP Upgrade path. |
| `host` | string | HTTP Upgrade Host. |

Only `vless` currently consumes this structure.

## Resources

### Agents

- `GET /api/v1/control/agents`
- `GET /api/v1/control/agents/{agent_id}`
- `GET /api/v1/control/agents/{agent_id}/runtime`
- `POST /api/v1/control/agents`
- `POST /api/v1/control/agents/{agent_id}/update`
- `POST /api/v1/control/agents/{agent_id}/delete`
- `POST /api/v1/control/agents/{agent_id}/reset-secret`

### Nodes

- `GET /api/v1/control/nodes`
- `GET /api/v1/control/nodes/summary`
- `GET /api/v1/control/nodes/{node_id}`
- `GET /api/v1/control/nodes/{node_id}/runtime`
- `GET /api/v1/control/nodes/{node_id}/snapshot`
- `POST /api/v1/control/nodes`
- `POST /api/v1/control/nodes/{node_id}/update`
- `POST /api/v1/control/nodes/{node_id}/delete`

Node create payload:

```json
{
  "id": 1001,
  "tag": "shadowsocks-1001",
  "type": "shadowsocks",
  "enabled": false,
  "listen": {
    "bind_ip": "0.0.0.0",
    "port": 10001,
    "tcp_fast_open": false
  },
  "settings": {
    "cipher": "2022-blake3-aes-128-gcm",
    "server_key": "change-me-server-key"
  },
  "tls": {
    "mode": "none"
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

Node snapshot preview:

```http
GET /api/v1/control/nodes/{node_id}/snapshot
```

The response `data` is the actual single-node config that an Agent will see. It has completed runtime Snapshot mapping and does not return Agent-level `version`, `full`, or `deleted_nodes`.

| Field | Type | Description |
| --- | --- | --- |
| `id` | number | Node ID |
| `tag` | string | Inbound tag |
| `type` | string | Protocol type |
| `enabled` | boolean | Whether the node is enabled |
| `listen` | object | Effective listen config |
| `settings` | object | Effective protocol settings |
| `tls` | object | Effective TLS/Reality config |
| `transport` | object | Effective transport config |
| `multiplex` | object | Effective multiplex config |
| `users` | array | Current node user authorization |
| `limiter` | object | Effective limiter config, including `remote_online_ip_count` and `block` |

### Bindings

- `GET /api/v1/control/agents/{agent_id}/bindings`
- `POST /api/v1/control/agents/{agent_id}/bindings`
- `POST /api/v1/control/agents/{agent_id}/bindings/{node_id}/update`
- `POST /api/v1/control/agents/{agent_id}/bindings/{node_id}/delete`

### Node Users

- `GET /api/v1/control/nodes/{node_id}/users`
- `POST /api/v1/control/nodes/{node_id}/users`
- `POST /api/v1/control/nodes/{node_id}/users/batch-create`
- `POST /api/v1/control/nodes/{node_id}/users/batch-update`
- `POST /api/v1/control/nodes/{node_id}/users/batch-delete`
- `GET /api/v1/control/nodes/{node_id}/users/{user_id}/client-config`
- `POST /api/v1/control/nodes/{node_id}/users/{user_id}/update`
- `POST /api/v1/control/nodes/{node_id}/users/{user_id}/delete`

Batch create:

`speed_limit` uses bytes per second (B/s); the frontend unit selector converts the displayed value before submit. `Mbps` is supported as a display/input unit and converts as `1 Mbps = 125000 B/s`.

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

Batch update:

`speed_limit` uses bytes per second (B/s); the frontend unit selector converts the displayed value before submit. `Mbps` is supported as a display/input unit and converts as `1 Mbps = 125000 B/s`.

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

Batch delete:

```json
{
  "user_ids": [1001, 1002]
}
```

Client config:

```json
{
  "node_id": 1001,
  "user_id": 2001,
  "type": "vless",
  "name": "SG Reality 01",
  "uri": "vless://15154628-502d-48ee-8a85-4155a9fa0547@sg02.example.com:443?encryption=none&flow=xtls-rprx-vision&pbk=ZjpNYQmksW-TtrdY5VgodkC6_E4ZLd8AfvrdTJU6El0&security=reality&servername=www.apple.com&sid=f8fce744dd0f88a0&sni=www.apple.com&type=tcp#SG+Reality+01",
  "client": {
    "name": "SG Reality 01",
    "node_tag": "sg",
    "public_host": "sg02.example.com",
    "public_port": 443
  }
}
```

This endpoint generates the current user's share config on the specified node. The frontend uses it for the user list "Get Config" action and displays both the generated `uri` and resolved `client` connection metadata.

## Service Register Manager

The Dev console reads service registration state through app auth headers and signature rules.

Frontend alias:

```http
GET /v4/service-register-manager/services
```

Gateway verify path:

```http
GET /api/v1/service-register-manager/services
```

Successful response:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "services": [
      {
        "service_name": "node-service",
        "ip": "127.0.0.1",
        "base_url": "http://127.0.0.1:8082",
        "route_root_path": "/api/v2/node/"
      }
    ],
    "routes": [
      {
        "service_name": "node-service",
        "ip": "127.0.0.1",
        "base_url": "http://127.0.0.1:8082",
        "route_root_path": "/api/v2/node/"
      }
    ],
    "service_auth": [
      {
        "service_name": "node-service",
        "service_token": "node-token"
      }
    ]
  },
  "error": null,
  "request_id": "req-xxxx",
  "timestamp": 1717824000
}
```
