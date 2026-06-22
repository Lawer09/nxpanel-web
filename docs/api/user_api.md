# User API 文档

## 用户列表查询

`POST /v3/user/fetch`

支持 GET/POST。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 否 | 按 ID 查询，逗号分隔多个，例如 `"1,2,3"` |
| `current` | `int` | 否 | 页码，默认 `1` |
| `pageSize` | `int` | 否 | 每页条数，默认 `10` |
| `onlyBanned` | `bool` | 否 | 只查询已封禁用户 |
| `createdAtFrom` | `string\|int` | 否 | 注册时间起始，包含边界；支持 Unix 时间戳、`YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss` |
| `createdAtTo` | `string\|int` | 否 | 注册时间结束，包含边界；支持 Unix 时间戳、`YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss`，仅日期格式会按当天 `23:59:59` 处理 |
| `meta` | `object` | 否 | 按 `register_metadata` JSON 字段筛选，key 为元数据字段名 |
| `filter` | `array` | 否 | 通用字段筛选，格式 `[{id, value}]` |
| `sort` | `array` | 否 | 排序，格式 `[{id, desc: bool}]` |

### 示例

```json
POST /api/v3/admin/user/fetch
{
    "meta": {
        "app_id": "com.example.app",
        "channel": "telegram"
    },
    "onlyBanned": true,
    "createdAtFrom": "2026-06-01 00:00:00",
    "createdAtTo": "2026-06-14 23:59:59",
    "current": 1,
    "pageSize": 20,
    "filter": [
        {"id": "email", "value": "test"}
    ],
    "sort": [
        {"id": "created_at", "desc": true}
    ]
}
```

按 ID 查询（不走分页）：

```json
POST /api/v3/admin/user/fetch
{
    "id": "1,2,3"
}
```

### 返回

```json
{
    "data": [
        {
            "id": 1,
            "email": "user@example.com",
            "register_metadata": {
                "app_id": "com.example.app",
                "channel": "telegram"
            },
            "plan_id": 1,
            "plan": {"id": 1, "name": "Pro"},
            "invite_user": null,
            "group": null,
            "balance": 0,
            "commission_balance": 0,
            "subscribe_url": "...",
            "transfer_enable": 1073741824,
            "u": 0,
            "d": 0,
            "total_used": 0,
            "expired_at": 1767225600,
            "banned": false,
            "report_traffic": 0.0
        }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
}
```

## 封禁用户 IP 列表查询

`POST /v3/user/blockedIp/fetch`

支持 GET/POST。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ip` | `string` | 否 | 按封禁 IP 精确查询 |
| `bannedUserId` | `int` | 否 | 按被封禁用户 ID 查询 |
| `operatorUserId` | `int` | 否 | 按操作管理员 ID 查询 |
| `current` | `int` | 否 | 页码，默认 `1` |
| `pageSize` | `int` | 否 | 每页条数，默认 `10`，最大 `200` |

### 请求示例

```json
POST /api/v3/admin/user/blockedIp/fetch
{
    "ip": "203.0.113.30",
    "current": 1,
    "pageSize": 20
}
```

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": {
        "data": [
            {
                "id": 1,
                "ip": "203.0.113.30",
                "reason": "fraud batch",
                "metadata": {
                    "source": "admin_batch_ban",
                    "user_email": "with-ip@example.com"
                },
                "banned_user_id": 1001,
                "operator_user_id": 9001,
                "banned_user": {
                    "id": 1001,
                    "email": "with-ip@example.com"
                },
                "operator_user": {
                    "id": 9001,
                    "email": "admin@example.com"
                },
                "created_at": 1781400000,
                "updated_at": 1781400000
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 20
    }
}
```

## 删除封禁用户 IP 记录

`POST /v3/user/blockedIp/delete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 封禁 IP 记录 ID |

### 请求示例

```json
POST /api/v3/admin/user/blockedIp/delete
{
    "id": 1
}
```

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": true
}
```

## AID 登录封禁规则列表查询

`POST /v3/user/aidLoginBanRule/fetch`

支持 GET/POST。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | `bool` | 否 | 按启用状态筛选 |
| `packageName` | `string` | 否 | 按包名精确筛选 |
| `country` | `string` | 否 | 按国家精确筛选，服务端会转大写 |
| `current` | `int` | 否 | 页码，默认 `1` |
| `pageSize` | `int` | 否 | 每页条数，默认 `10`，最大 `200` |

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": {
        "data": [
            {
                "id": 1,
                "name": "US night fraud block",
                "enabled": true,
                "cutoffAt": "2026-06-30 23:59:59",
                "weeklyWindows": [
                    {"weekday": 1, "start": "00:00", "end": "06:00"}
                ],
                "packageNames": ["com.example.vpn"],
                "countries": ["US"],
                "reason": "aid login custom rule",
                "createdBy": {"id": 1, "email": "admin@example.com"},
                "updatedBy": {"id": 1, "email": "admin@example.com"},
                "createdAt": 1782144000,
                "updatedAt": 1782144000
            }
        ],
        "total": 1,
        "page": 1,
        "pageSize": 10
    }
}
```

## 新增 AID 登录封禁规则

`POST /v3/user/aidLoginBanRule/save`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 规则名称，最大 191 字符 |
| `enabled` | `bool` | 否 | 是否启用，默认启用 |
| `cutoffAt` | `string` | 是 | 规则有效截止时间，例如 `2026-06-30 23:59:59` |
| `weeklyWindows` | `array` | 是 | 一周内生效时间段 |
| `weeklyWindows[].weekday` | `int` | 是 | 星期，`1=周一`，`7=周日` |
| `weeklyWindows[].start` | `string` | 是 | 开始时间，格式 `HH:mm` |
| `weeklyWindows[].end` | `string` | 是 | 结束时间，格式 `HH:mm`，必须大于 `start` |
| `packageNames` | `string[]` | 否 | 包名白名单，空数组或不传表示不限制 |
| `countries` | `string[]` | 否 | 国家白名单，空数组或不传表示不限制 |
| `reason` | `string` | 否 | 封禁原因，最大 500 字符 |

### 请求示例

```json
{
    "name": "US night fraud block",
    "enabled": true,
    "cutoffAt": "2026-06-30 23:59:59",
    "weeklyWindows": [
        {"weekday": 1, "start": "00:00", "end": "06:00"},
        {"weekday": 2, "start": "00:00", "end": "06:00"}
    ],
    "packageNames": ["com.example.vpn"],
    "countries": ["US"],
    "reason": "aid login custom rule"
}
```

## 更新 AID 登录封禁规则

`POST /v3/user/aidLoginBanRule/update`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 规则 ID |
| `name` | `string` | 否 | 规则名称 |
| `enabled` | `bool` | 否 | 是否启用 |
| `cutoffAt` | `string` | 否 | 规则有效截止时间 |
| `weeklyWindows` | `array` | 否 | 一周内生效时间段，格式同新增接口 |
| `packageNames` | `string[]` | 否 | 包名白名单 |
| `countries` | `string[]` | 否 | 国家白名单 |
| `reason` | `string` | 否 | 封禁原因 |

## 删除 AID 登录封禁规则

`POST /v3/user/aidLoginBanRule/delete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 规则 ID |

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": true
}
```

## 用户更新

`POST /v3/user/update`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 用户 ID |
| `email` | `string` | 否 | 邮箱 |
| `password` | `string` | 否 | 密码 |
| `transfer_enable` | `int` | 否 | 总流量 (bytes) |
| `expired_at` | `int` | 否 | 过期时间 (unix timestamp)，传 `null` 设为长期有效 |
| `banned` | `int` | 否 | 封禁状态，`0` 或 `1` |
| `plan_id` | `int` | 否 | 套餐 ID，传 `null` 移出套餐 |
| `balance` | `number` | 否 | 余额 (元) |
| `commission_balance` | `number` | 否 | 佣金余额 (元) |
| `commission_rate` | `int` | 否 | 返佣比例 (%) |
| `commission_type` | `int` | 否 | 返佣类型：`0` 跟随系统、`1` 循环返佣、`2` 一次性返佣 |
| `discount` | `int` | 否 | 专属折扣 (%) |
| `speed_limit` | `int` | 否 | 限速 (Mbps)，传 `null` 不限速 |
| `device_limit` | `int` | 否 | 设备数量限制，传 `null` 不限 |
| `is_admin` | `int` | 否 | 管理员，`0` 或 `1` |
| `is_staff` | `int` | 否 | 员工，`0` 或 `1` |
| `remarks` | `string` | 否 | 备注 |
| `invite_user_email` | `string` | 否 | 邀请人邮箱 |
| `register_metadata` | `object` | 否 | 注册元数据，key 为元数据字段名 |

### 示例

```json
POST /api/v3/admin/user/update
{
    "id": 1,
    "email": "new@example.com",
    "plan_id": 2,
    "register_metadata": {
        "app_id": "com.new.app",
        "channel_type": "organic"
    }
}
```

---

## 更新用户

`POST /v3/user/update`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 用户 ID |
| `email` | `string` | 否 | 邮箱 |
| `password` | `string` | 否 | 密码，最少 8 位 |
| `transfer_enable` | `numeric` | 否 | 总流量 (KB) |
| `expired_at` | `int` | 否 | 过期时间戳 |
| `banned` | `bool` | 否 | 是否封禁 |
| `plan_id` | `int` | 否 | 订阅计划 ID，变更时自动更新 `group_id` |
| `commission_rate` | `int` | 否 | 返佣比例 0-100 |
| `discount` | `int` | 否 | 折扣比例 0-100 |
| `is_admin` | `bool` | 否 | 是否管理员 |
| `is_staff` | `bool` | 否 | 是否员工 |
| `u` | `int` | 否 | 上行流量 |
| `d` | `int` | 否 | 下行流量 |
| `balance` | `numeric` | 否 | 余额 |
| `commission_type` | `int` | 否 | 返佣类型 |
| `commission_balance` | `numeric` | 否 | 佣金余额 |
| `remarks` | `string` | 否 | 备注 |
| `speed_limit` | `int` | 否 | 限速 Mbps |
| `device_limit` | `int` | 否 | 设备数量限制 |
| `register_metadata` | `object` | 否 | 注册元数据，支持 `{"app_id": "..."}` 格式 |
| `invite_user_email` | `string` | 否 | 邀请人邮箱 |

### 示例

```json
POST /v3/user/update
{
    "id": 1,
    "email": "new@example.com",
    "plan_id": 2,
    "expired_at": 1767225600,
    "register_metadata": {
        "app_id": "com.example.app",
        "channel": "telegram"
    }
}
```

### 返回

```json
{
    "data": true
}
```

```json
// 失败
{
    "code": 400202,
    "message": "用户不存在"
}
```
