# Firebase Analytics API

## 模块说明

面向管理后台的 Firebase 数据分析模块，提供事件总览、趋势、质量排行、错误分析、明细与筛选项接口。

统一前缀：`/v3/firebase-analytics`

---

## 通用查询参数

适用于所有统计与趋势接口。

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| start_time | string | 否 | - | 开始时间，格式 `YYYY-MM-DD HH:mm:ss` |
| end_time | string | 否 | - | 结束时间，格式 `YYYY-MM-DD HH:mm:ss` |
| time_field | string | 否 | received_at | `event_time` 或 `received_at` |
| app_id | string | 否 | - | App ID |
| platform | string | 否 | - | `android` / `ios` |
| app_version | string | 否 | - | App 版本 |
| user_country | string | 否 | - | 用户国家 |
| user_region | string | 否 | - | 用户地区 |
| network_type | string | 否 | - | `wifi` / `cellular` |
| isp | string | 否 | - | 运营商 |
| asn | string | 否 | - | ASN |
| event_name | string | 否 | - | 事件名称 |
| interval | string | 否 | 自动兜底 | `5m` / `15m` / `1h` / `1d` |

---

## 接口列表

| 接口名称 | 请求方法 | 请求路径 | 说明 |
|---|---|---|---|
| Dashboard 总览 | GET | /dashboard/summary | 首页 KPI 卡片 |
| Dashboard 事件趋势 | GET | /dashboard/event-trend | 事件趋势 |
| VPN 质量趋势 | GET | /vpn-session/quality-trend | VPN 连接质量趋势 |
| 地区质量分布 | GET | /dashboard/region-quality | 地区质量分布 |
| 错误 Top 排行 | GET | /errors/top | 错误排行 |
| 节点质量排行 | GET | /nodes/quality-rank | 节点质量排行 |
| App 打开汇总 | GET | /app-open/summary | App 打开汇总 |
| App 打开趋势 | GET | /app-open/trend | App 打开趋势 |
| 启动类型分布 | GET | /app-open/open-type-distribution | 启动类型分布 |
| 版本启动性能排行 | GET | /app-open/version-rank | 版本启动性能排行 |
| VPN 汇总 | GET | /vpn-session/summary | VPN 连接汇总 |
| 失败阶段分布 | GET | /vpn-session/fail-stage-distribution | 失败阶段分布 |
| 错误阶段分布 | GET | /vpn-session/error-stage-distribution | 错误阶段分布 |
| 连接方式分析 | GET | /vpn-session/connect-type-analysis | 连接方式分析 |
| 协议质量对比 | GET | /vpn-session/protocol-quality | 协议质量对比 |
| 测速汇总 | GET | /vpn-probe/summary | 节点测速汇总 |
| 测速趋势 | GET | /vpn-probe/trend | 节点测速趋势 |
| 测速触发场景分布 | GET | /vpn-probe/trigger-distribution | 测速触发场景分布 |
| 测速类型分布 | GET | /vpn-probe/type-distribution | 测速类型分布 |
| 节点测速排行 | GET | /vpn-probe/node-rank | 节点测速排行 |
| API 错误汇总 | GET | /server-api-error/summary | API 错误汇总 |
| API 错误趋势 | GET | /server-api-error/trend | API 错误趋势 |
| HTTP 状态码分布 | GET | /server-api-error/http-status-distribution | HTTP 状态码分布 |
| API 路径排行 | GET | /server-api-error/api-rank | API 路径错误排行 |
| 事件列表 | GET | /events | 事件明细列表 |
| 事件详情 | GET | /events/{event_id} | 事件详情 |
| 筛选项 | GET | /filters/options | 前端筛选项 |

---

## 接口详情

### 1. Dashboard 总览

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/dashboard/summary`
- 权限要求：`admin`
- 使用场景：首页 KPI 卡片

#### 请求参数

继承通用查询参数。

#### 返回字段

| 字段名 | 类型 | 说明 |
|---|---|---|
| code | int | 状态码 |
| msg | string | 返回消息 |
| data.total_events | int | 总事件数 |
| data.active_devices | int | 活跃设备数 |
| data.app_open_count | int | App 打开事件数 |
| data.vpn_session_count | int | VPN 会话数 |
| data.vpn_success_rate | float | VPN 成功率 |
| data.probe_success_rate | float | 测速成功率 |
| data.api_error_count | int | API 错误事件数 |
| data.duplicate_event_count | int | 重复事件数 |
| data.avg_receive_delay_ms | int | 平均上报延迟 |
| data.compare | object | 与上一周期对比 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "total_events": 128560,
    "active_devices": 8421,
    "app_open_count": 24560,
    "vpn_session_count": 38720,
    "vpn_success_rate": 0.9623,
    "probe_success_rate": 0.9341,
    "api_error_count": 1320,
    "duplicate_event_count": 85,
    "avg_receive_delay_ms": 820,
    "compare": {
      "total_events_rate": 0.125,
      "active_devices_rate": 0.083,
      "app_open_rate": 0.097,
      "vpn_success_rate_diff": 0.012,
      "probe_success_rate_diff": 0.008,
      "api_error_rate": 0.236
    }
  }
}
```

---

### 2. Dashboard 事件趋势

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/dashboard/event-trend`
- 权限要求：`admin`
- 使用场景：事件趋势折线图

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "interval": "1h",
    "items": [
      {
        "time": "2026-05-14 00:00:00",
        "total": 8760,
        "app_open": 1620,
        "vpn_session": 3540,
        "vpn_probe": 2280,
        "server_api_error": 420
      }
    ]
  }
}
```

---

### 3. VPN 质量趋势

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/quality-trend`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "interval": "1h",
    "items": [
      {
        "time": "2026-05-14 10:00:00",
        "session_count": 500,
        "success_count": 480,
        "fail_count": 20,
        "success_rate": 0.96,
        "avg_connect_ms": 420,
        "p95_connect_ms": 1200,
        "avg_duration_ms": 860000,
        "retry_count": 72
      }
    ]
  }
}
```

---

### 4. 地区质量分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/dashboard/region-quality`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

额外参数：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| sort_by | string | 否 | event_count | `event_count` / `vpn_success_rate` / `api_error_count` / `avg_connect_ms` |
| order | string | 否 | desc | `asc` / `desc` |
| limit | int | 否 | 50 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "user_country": "SG",
        "user_region": "Singapore",
        "event_count": 12342,
        "active_devices": 980,
        "vpn_session_count": 3600,
        "vpn_success_rate": 0.9812,
        "api_error_count": 98,
        "avg_connect_ms": 298
      }
    ]
  }
}
```

---

### 5. 错误 Top 排行

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/errors/top`
- 权限要求：`admin`

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| error_type | string | 是 | - | `vpn_session` / `vpn_probe` / `server_api` |
| limit | int | 否 | 10 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "error_type": "vpn_session",
    "items": [
      {
        "rank": 1,
        "error_stage": "dns",
        "error_code": "DNS_FAILED",
        "count": 1230,
        "ratio": 0.3218,
        "affected_devices": 842
      }
    ]
  }
}
```

---

### 6. 节点质量排行

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/nodes/quality-rank`
- 权限要求：`admin`

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| source | string | 否 | session | `session` / `probe` / `mixed` |
| sort_by | string | 否 | session_count | `success_rate` / `avg_connect_ms` / `p95_connect_ms` / `total_bytes` / `session_count` |
| order | string | 否 | desc | `asc` / `desc` |
| limit | int | 否 | 20 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "source": "session",
    "items": [
      {
        "rank": 1,
        "node_id": "node-sg-01",
        "node_name": "Singapore 01",
        "node_country": "SG",
        "node_region": "Singapore",
        "protocol": "vless_reality",
        "session_count": 3420,
        "success_count": 3360,
        "success_rate": 0.9824,
        "avg_connect_ms": 320,
        "p95_connect_ms": 900,
        "avg_duration_ms": 1100000,
        "total_bytes": 88400000000,
        "top_error_code": "TIMEOUT"
      }
    ]
  }
}
```

---

### 7. App 打开汇总

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/app-open/summary`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "open_count": 24560,
    "active_devices": 8421,
    "avg_launch_ms": 680,
    "p95_launch_ms": 2100,
    "cold_start_ratio": 0.42,
    "top_install_channel": "google_play"
  }
}
```

---

### 8. App 打开趋势

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/app-open/trend`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "interval": "1h",
    "items": [
      {
        "time": "2026-05-14 10:00:00",
        "open_count": 1200,
        "active_devices": 620,
        "avg_launch_ms": 710,
        "p95_launch_ms": 2200
      }
    ]
  }
}
```

---

### 9. 启动类型分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/app-open/open-type-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "open_type": "cold_start",
        "count": 10200,
        "ratio": 0.415
      }
    ]
  }
}
```

---

### 10. 版本启动性能排行

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/app-open/version-rank`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

额外参数：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| limit | int | 否 | 20 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "app_version": "1.0.0",
        "open_count": 12000,
        "active_devices": 4200,
        "avg_launch_ms": 720,
        "p95_launch_ms": 2300,
        "cold_start_ratio": 0.41
      }
    ]
  }
}
```

---

### 11. VPN 汇总

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/summary`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "session_count": 38720,
    "success_count": 37260,
    "fail_count": 1460,
    "success_rate": 0.9623,
    "avg_connect_ms": 420,
    "p95_connect_ms": 1200,
    "avg_duration_ms": 860000,
    "total_upload_bytes": 32000000000,
    "total_download_bytes": 156000000000,
    "total_bytes": 188000000000,
    "retry_session_count": 2900,
    "retry_rate": 0.0749
  }
}
```

---

### 12. 失败阶段分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/fail-stage-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "fail_stage": "connect",
        "count": 940,
        "ratio": 0.6438
      }
    ]
  }
}
```

---

### 13. 错误阶段分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/error-stage-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "error_stage": "dns",
        "count": 1230,
        "ratio": 0.3218
      }
    ]
  }
}
```

---

### 14. 连接方式分析

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/connect-type-analysis`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "connect_type": "auto",
        "session_count": 18200,
        "success_rate": 0.972,
        "avg_connect_ms": 380,
        "retry_rate": 0.061
      }
    ]
  }
}
```

---

### 15. 协议质量对比

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-session/protocol-quality`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "protocol": "vless_reality",
        "session_count": 31200,
        "success_rate": 0.963,
        "avg_connect_ms": 410,
        "avg_duration_ms": 920000,
        "top_error_code": "TIMEOUT"
      }
    ]
  }
}
```

---

### 16. 测速汇总

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-probe/summary`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "probe_count": 8200,
    "probe_result_count": 98400,
    "avg_probe_success_rate": 0.9341,
    "avg_latency_ms": 180,
    "p95_latency_ms": 820,
    "avg_duration_ms": 3200,
    "failed_result_count": 6480
  }
}
```

---

### 17. 测速趋势

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-probe/trend`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "interval": "1h",
    "items": [
      {
        "time": "2026-05-14 10:00:00",
        "probe_count": 420,
        "result_count": 5040,
        "success_rate": 0.941,
        "avg_latency_ms": 160,
        "avg_duration_ms": 2800
      }
    ]
  }
}
```

---

### 18. 测速触发场景分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-probe/trigger-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "probe_trigger": "app_open",
        "count": 3600,
        "ratio": 0.439
      }
    ]
  }
}
```

---

### 19. 测速类型分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-probe/type-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "probe_type": "full_probe",
        "count": 4200,
        "ratio": 0.512
      }
    ]
  }
}
```

---

### 20. 节点测速排行

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/vpn-probe/node-rank`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

额外参数：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| sort_by | string | 否 | success_rate | `success_rate` / `avg_latency_ms` / `p95_latency_ms` / `avg_tcp_connect_ms` / `avg_tls_hk_ms` / `avg_proxy_hk_ms` |
| order | string | 否 | desc | `asc` / `desc` |
| limit | int | 否 | 20 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "rank": 1,
        "node_id": "node-sg-01",
        "node_name": "Singapore 01",
        "node_country": "SG",
        "protocol": "vless_reality",
        "test_count": 5230,
        "success_rate": 0.991,
        "avg_latency_ms": 80,
        "p95_latency_ms": 230,
        "avg_tcp_connect_ms": 40,
        "avg_tls_hk_ms": 60,
        "avg_proxy_hk_ms": 90,
        "top_error_code": "NONE"
      }
    ]
  }
}
```

---

### 21. API 错误汇总

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/server-api-error/summary`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "api_error_count": 1320,
    "affected_devices": 842,
    "http_5xx_count": 420,
    "http_4xx_count": 360,
    "timeout_count": 210,
    "business_error_count": 180,
    "avg_duration_ms": 1200,
    "retry_count": 260
  }
}
```

---

### 22. API 错误趋势

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/server-api-error/trend`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "interval": "1h",
    "items": [
      {
        "time": "2026-05-14 10:00:00",
        "error_count": 80,
        "affected_devices": 46,
        "avg_duration_ms": 1300
      }
    ]
  }
}
```

---

### 23. HTTP 状态码分布

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/server-api-error/http-status-distribution`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "http_status": 504,
        "count": 320,
        "ratio": 0.242
      }
    ]
  }
}
```

---

### 24. API 路径排行

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/server-api-error/api-rank`
- 权限要求：`admin`

#### 请求参数

继承通用查询参数。

额外参数：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| sort_by | string | 否 | error_count | `error_count` / `avg_duration_ms` |
| order | string | 否 | desc | `asc` / `desc` |
| limit | int | 否 | 20 | 返回条数 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "rank": 1,
        "api_domain": "api.example.com",
        "api_path": "/v1/node/list",
        "http_method": "GET",
        "error_count": 420,
        "main_http_status": 504,
        "main_error_code": "REQUEST_TIMEOUT",
        "avg_duration_ms": 1500,
        "affected_devices": 280
      }
    ]
  }
}
```

---

### 25. 事件列表

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/events`
- 权限要求：`admin`

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| page | int | 否 | 1 | 当前页 |
| page_size | int | 否 | 20 | 每页数量 |
| start_time | string | 否 | - | 开始时间 |
| end_time | string | 否 | - | 结束时间 |
| time_field | string | 否 | received_at | `event_time` / `received_at` |
| event_id | string | 否 | - | 事件 ID |
| device_id | string | 否 | - | 设备 ID |
| user_id | string | 否 | - | 用户 ID |
| app_id | string | 否 | - | App ID |
| platform | string | 否 | - | 平台 |
| app_version | string | 否 | - | App 版本 |
| event_name | string | 否 | - | 事件名称 |
| user_country | string | 否 | - | 国家 |
| network_type | string | 否 | - | 网络类型 |
| isp | string | 否 | - | 运营商 |
| asn | string | 否 | - | ASN |
| node_id | string | 否 | - | 节点 ID |
| api_path | string | 否 | - | API 路径 |
| trace_id | string | 否 | - | Trace ID |
| error_code | string | 否 | - | 错误码 |
| success | bool | 否 | - | 是否成功 |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "page": 1,
    "page_size": 20,
    "total": 10000,
    "items": [
      {
        "event_id": "evt_xxx",
        "event_name": "vpn_session",
        "received_at": "2026-05-14 10:12:33.123",
        "event_time_ms": 1778734353123,
        "app_id": "test.app.pupu",
        "platform": "android",
        "app_version": "1.0.0",
        "device_id": "device_xxx",
        "user_id": "user_xxx",
        "user_country": "SG",
        "network_type": "wifi",
        "isp": "Singtel",
        "asn": "AS3758",
        "success": false,
        "error_stage": "dns",
        "error_code": "DNS_FAILED",
        "duplicate_count": 0
      }
    ]
  }
}
```

---

### 26. 事件详情

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/events/{event_id}`
- 权限要求：`admin`

#### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| event_id | string | 是（路径） | - | 事件 ID |

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "common": {
      "event_id": "evt_xxx",
      "app_id": "test.app.pupu",
      "event_name": "vpn_session",
      "platform": "android",
      "app_version": "1.0.0",
      "device_id": "device_xxx",
      "user_id": "user_xxx",
      "user_country": "SG",
      "user_region": "Singapore",
      "language": "zh-CN",
      "network_type": "wifi",
      "isp": "Singtel",
      "asn": "AS3758",
      "event_time_ms": 1778734353123,
      "created_at_ms": 1778734353000,
      "received_at": "2026-05-14 10:12:33.123",
      "firebase_event_id": "firebase_xxx",
      "firebase_event_time": "2026-05-14T10:12:33Z",
      "firebase_source": "firestore-trigger",
      "forwarded_at": "2026-05-14T10:12:34Z",
      "duplicate_count": 0,
      "last_duplicate_at": null
    },
    "extension": {
      "session_id": "sess_xxx",
      "node_id": "node-sg-01",
      "node_host": "sg01.example.com",
      "node_name": "Singapore 01",
      "node_country": "SG",
      "protocol": "vless_reality",
      "connect_type": "auto",
      "success": false,
      "connect_ms": 3000,
      "error_stage": "dns",
      "error_code": "DNS_FAILED",
      "error_message": "dns lookup failed",
      "retry_count": 1
    }
  }
}
```

---

### 27. 筛选项

#### 请求信息

- 请求方法：`GET`
- 请求路径：`/filters/options`
- 权限要求：`admin`

#### 返回示例

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "apps": [{"label": "test.app.pupu", "value": "test.app.pupu"}],
    "platforms": [{"label": "Android", "value": "android"}],
    "versions": [{"label": "1.0.0", "value": "1.0.0"}],
    "countries": [{"label": "Singapore", "value": "SG"}],
    "network_types": [{"label": "WiFi", "value": "wifi"}],
    "isps": [{"label": "Singtel", "value": "Singtel"}],
    "asns": [{"label": "AS3758", "value": "AS3758"}],
    "event_names": [
      {"label": "App 打开", "value": "app_open"},
      {"label": "VPN 连接", "value": "vpn_session"},
      {"label": "节点测速", "value": "vpn_probe"},
      {"label": "API 错误", "value": "server_api_error"}
    ]
  }
}
```

---

## 错误码

| code | msg | 说明 |
|---|---|---|
| 422 | 参数验证失败 | 请求参数不合法 |
| 500 | 操作失败 | 服务端异常 |

---

## 相关文件

- `app/Http/Routes/V3/AdminRoute.php`
- `app/Http/Controllers/V3/Admin/FirebaseAnalytics*Controller.php`
- `app/Http/Requests/Admin/FirebaseAnalytics*Request.php`
- `app/Services/FirebaseAnalytics*Service.php`
