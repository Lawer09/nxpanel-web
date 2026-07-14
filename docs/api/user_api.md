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
| `banned` | `bool\|int` | 否 | 按封禁状态筛选：`1` / `true` 查询已封禁，`0` / `false` 查询未封禁，空值不筛选 |
| `createdAtFrom` | `string\|int` | 否 | 注册时间起始，包含边界；支持 Unix 时间戳、`YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss` |
| `createdAtTo` | `string\|int` | 否 | 注册时间结束，包含边界；支持 Unix 时间戳、`YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss`，仅日期格式会按当天 `23:59:59` 处理 |
| `meta` | `object` | 否 | 按 `register_metadata` JSON 字段筛选，key 为元数据字段名 |
| `filter` | `array` | 否 | 通用字段筛选，格式 `[{id, value}]` |
| `sort` | `array` | 否 | 排序，格式 `[{id, desc: bool}]` |

`filter` 可用于邀请关系筛选，例如：

- 查询“有邀请者”的用户：`{"id": "invite_user_id", "value": "notnull:1"}`
- 查询“没有邀请者”的用户：`{"id": "invite_user_id", "value": "null:1"}`
- 查询“由某个用户邀请”的用户：`{"id": "invite_user_id", "value": "eq:123"}`
- 按邀请人邮箱筛选：`{"id": "invite_user.email", "value": "example@example.com"}`

### 示例

```json
POST /api/v3/admin/user/fetch
{
    "meta": {
        "app_id": "com.example.app",
        "channel": "telegram"
    },
    "banned": true,
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

按邀请关系筛选示例：

```json
POST /api/v3/admin/user/fetch
{
    "filter": [
        {"id": "invite_user_id", "value": "notnull:1"}
    ],
    "current": 1,
    "pageSize": 20
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
                "type": "dangerous",
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

## 更新封禁用户 IP 类型

`POST /v3/user/blockedIp/updateType`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 封禁 IP 记录 ID |
| `type` | `string` | 是 | 封禁 IP 类型，例如 `dangerous` |

### 请求示例

```json
POST /api/v3/admin/user/blockedIp/updateType
{
    "id": 1,
    "type": "dangerous"
}
```

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": {
        "id": 1,
        "ip": "203.0.113.30",
        "type": "dangerous"
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

## 批量删除封禁用户 IP 记录

`POST /v3/user/blockedIp/batchDelete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | `int[]` | 是 | 需要删除的封禁 IP 记录 ID 列表；服务端会去重，空数组会返回校验错误 |

### 请求示例

```json
POST /api/v3/admin/user/blockedIp/batchDelete
{
    "ids": [1, 2, 3]
}
```

### 返回示例

```json
{
    "code": 0,
    "msg": "操作成功",
    "data": {
        "deletedCount": 2,
        "requestedCount": 3,
        "missingIds": [3]
    }
}
```

## 批量新增封禁用户 IP

`POST /v3/user/blockedIp/batchBlock`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ips` | `string[]` | 是 | IP 数组，最多 `500` 个，服务端去重 |
| `type` | `string` | 否 | 封禁 IP 类型，支持 `normal` / `dangerous`，默认 `normal` |
| `banUsers` | `bool` | 否 | 是否同时封禁 `register_metadata.ip` 命中的用户，默认 `false` |
| `reason` | `string` | 否 | 封禁原因 |

### 请求示例

```json
POST /api/v3/admin/user/blockedIp/batchBlock
{
    "ips": ["203.0.113.10", "203.0.113.11"],
    "type": "dangerous",
    "banUsers": true,
    "reason": "manual risk ip batch"
}
```

### 返回示例

```json
{
    "requestedCount": 2,
    "blockedIpCount": 2,
    "blockedIps": ["203.0.113.10", "203.0.113.11"],
    "bannedUserCount": 1,
    "bannedUserIds": [10001]
}
```

## IP 白名单列表查询

`POST /v3/user/allowedIp/fetch`

支持 GET/POST。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ip` | `string` | 否 | 按白名单 IP 精确筛选 |
| `operatorUserId` | `int` | 否 | 按操作人用户 ID 筛选 |
| `current` | `int` | 否 | 页码，默认 `1` |
| `pageSize` | `int` | 否 | 每页数量，默认 `10`，最大 `200` |

### 请求示例

```json
POST /api/v3/admin/user/allowedIp/fetch
{
    "ip": "203.0.113.10",
    "current": 1,
    "pageSize": 10
}
```

### 返回字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `int` | 白名单记录 ID |
| `ip` | `string` | IP 地址 |
| `reason` | `string \| null` | 加入原因 |
| `metadata` | `object \| null` | 来源上下文 |
| `operator_user_id` | `int \| null` | 操作人用户 ID |
| `operator_user` | `object \| null` | 操作人信息 |
| `created_at` | `int` | 创建时间戳 |
| `updated_at` | `int` | 更新时间戳 |

## 添加或更新 IP 白名单

`POST /v3/user/allowedIp/save`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ips` | `string[]` | 是 | IP 列表，最大 `500` 个；服务端去重 |
| `reason` | `string` | 否 | 加入原因，最大 `500` 字符 |

同一个 IP 已存在时会更新 `reason`、`operator_user_id` 和 `metadata`。

### 请求示例

```json
POST /api/v3/admin/user/allowedIp/save
{
    "ips": ["203.0.113.10", "203.0.113.11"],
    "reason": "trusted source"
}
```

### 返回示例

```json
{
    "requestedCount": 2,
    "allowedIpCount": 2,
    "allowedIps": ["203.0.113.10", "203.0.113.11"]
}
```

## 删除 IP 白名单

`POST /v3/user/allowedIp/delete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 白名单记录 ID |

删除白名单记录不会自动封禁或解封用户。

## 批量删除 IP 白名单

`POST /v3/user/allowedIp/batchDelete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | `int[]` | 是 | 白名单记录 ID 列表，服务端去重 |

### 返回示例

```json
{
    "deletedCount": 2,
    "requestedCount": 3,
    "missingIds": [99]
}
```

## IP 白名单策略查询

`POST /v3/user/ipAllowlistRule/fetch`

支持 GET/POST。

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | `bool` | 否 | 是否启用 |
| `country` | `string` | 否 | 国家缩写，按大写精确匹配 |
| `projectCode` | `string` | 否 | 项目代号 |
| `packageName` | `string` | 否 | 包名 / app_id |
| `current` | `int` | 否 | 页码，默认 `1` |
| `pageSize` | `int` | 否 | 每页数量，默认 `10`，最大 `200` |

## 新增 IP 白名单策略

`POST /v3/user/ipAllowlistRule/save`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 规则名称 |
| `enabled` | `bool` | 否 | 是否启用，默认 `true` |
| `countries` | `string[]` | 否 | 国家缩写数组，保存时统一转大写 |
| `projectCodes` | `string[]` | 否 | 项目代号数组 |
| `packageNames` | `string[]` | 否 | 包名 / app_id 数组 |
| `reason` | `string` | 否 | 自动加入白名单原因 |

`countries`、`projectCodes`、`packageNames` 至少需要配置一类，避免误配置成全局自动白名单。规则命中时，只对已配置的条件做限制；未配置的条件表示不限制。若一个规则同时配置了国家、项目和包名，则三类条件都需要匹配。

### 请求示例

```json
{
    "name": "US Rocket allow",
    "enabled": true,
    "countries": ["US"],
    "projectCodes": ["rocket"],
    "packageNames": ["com.rocket.vpn"],
    "reason": "trusted launch cohort"
}
```

## 更新 IP 白名单策略

`POST /v3/user/ipAllowlistRule/update`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 规则 ID |
| `name` | `string` | 否 | 规则名称 |
| `enabled` | `bool` | 否 | 是否启用 |
| `countries` | `string[]` | 否 | 国家缩写数组 |
| `projectCodes` | `string[]` | 否 | 项目代号数组 |
| `packageNames` | `string[]` | 否 | 包名 / app_id 数组 |
| `reason` | `string` | 否 | 自动加入白名单原因 |

更新后仍必须至少保留 `countries`、`projectCodes`、`packageNames` 中任意一类条件。

## 删除 IP 白名单策略

`POST /v3/user/ipAllowlistRule/delete`

### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `int` | 是 | 规则 ID |

删除规则不会删除已经自动写入的 `allowed_user_ips` 记录。

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
                "timezone": "Asia/Shanghai",
                "cutoffAt": "2026-06-30 23:59:59",
                "weeklyWindows": [
                    {"weekday": 1, "start": "00:00", "end": "06:00"}
                ],
                "dateWindows": [
                    {"date": "2026-06-18", "start": "00:00", "end": "06:00"}
                ],
                "packageNames": ["com.example.vpn"],
                "projectCodes": ["project-demo"],
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
| `timezone` | `string` | 是 | 规则时区，例如 `Asia/Shanghai`；所有时间条件均按该时区解释 |
| `cutoffAt` | `string\|null` | 否 | 规则有效截止时间，例如 `2026-06-30 23:59:59`；空表示不限制 |
| `weeklyWindows` | `array` | 否 | 一周内生效时间段，空数组或不传表示不限制 |
| `weeklyWindows[].weekday` | `int` | 是 | 传 `weeklyWindows` 时必填；星期，`1=周一`，`7=周日` |
| `weeklyWindows[].start` | `string` | 是 | 传 `weeklyWindows` 时必填；开始时间，格式 `HH:mm` |
| `weeklyWindows[].end` | `string` | 是 | 传 `weeklyWindows` 时必填；结束时间，格式 `HH:mm`，必须大于 `start` |
| `dateWindows` | `array` | 否 | 特定日期生效时间段，空数组或不传表示不限制 |
| `dateWindows[].date` | `string` | 是 | 传 `dateWindows` 时必填；日期，格式 `Y-m-d` |
| `dateWindows[].start` | `string` | 是 | 传 `dateWindows` 时必填；开始时间，格式 `HH:mm` |
| `dateWindows[].end` | `string` | 是 | 传 `dateWindows` 时必填；结束时间，格式 `HH:mm`，必须大于 `start` |
| `packageNames` | `string[]` | 否 | 封禁匹配包名列表；最终列表为空时规则不会参与封禁检测 |
| `projectCodes` | `string[]` | 否 | 项目代号列表；保存时会查询 `project_user_app_map` 中 `enabled=1` 的相同 `project_code`，并将对应 `app_id` 合并到最终 `packageNames` |
| `countries` | `string[]` | 否 | 封禁匹配国家列表，空数组或不传表示不限制国家 |
| `reason` | `string` | 否 | 封禁原因，最大 500 字符 |

### 请求示例

```json
{
    "name": "US night fraud block",
    "enabled": true,
    "timezone": "Asia/Shanghai",
    "cutoffAt": "2026-06-30 23:59:59",
    "weeklyWindows": [
        {"weekday": 1, "start": "00:00", "end": "06:00"},
        {"weekday": 2, "start": "00:00", "end": "06:00"}
    ],
    "dateWindows": [
        {"date": "2026-06-18", "start": "00:00", "end": "06:00"}
    ],
    "packageNames": ["com.example.vpn"],
    "projectCodes": ["project-demo"],
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
| `timezone` | `string` | 否 | 规则时区，例如 `Asia/Shanghai`；所有时间条件均按该时区解释 |
| `cutoffAt` | `string\|null` | 否 | 规则有效截止时间；空表示不限制 |
| `weeklyWindows` | `array` | 否 | 一周内生效时间段，格式同新增接口；空数组或不传表示不限制 |
| `dateWindows` | `array` | 否 | 特定日期生效时间段，格式同新增接口；空数组或不传表示不限制 |
| `packageNames` | `string[]` | 否 | 封禁匹配包名列表；最终列表为空时规则不会参与封禁检测 |
| `projectCodes` | `string[]` | 否 | 项目代号列表；保存时会查询 `project_user_app_map` 中 `enabled=1` 的相同 `project_code`，并将对应 `app_id` 合并到最终 `packageNames` |
| `countries` | `string[]` | 否 | 封禁匹配国家列表，空数组或不传表示不限制国家 |
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
| `user_type` | `string` | 否 | 用户类型，`global` 或 `define`；`define` 时按 `menus` 菜单路径白名单限制可见菜单 |
| `menus` | `string[]` | 否 | 菜单路径白名单，仅 `user_type=define` 时生效 |

### 示例

```json
POST /api/v3/admin/user/update
{
    "id": 1,
    "email": "new@example.com",
    "plan_id": 2,
    "user_type": "define",
    "menus": ["/dashboard", "/business/user-manage"],
    "register_metadata": {
        "app_id": "com.new.app",
        "channel_type": "organic"
    }
}
```

---

## 更新用户

`POST /v3/user/update`

说明：

- 用户手动解封应调用 `POST /api/v3/{secure_path}/user/update`，将 `banned` 改为 `false` 或 `0`。
- `POST /api/v3/{secure_path}/user/blockedIp/delete` 和 `POST /api/v3/{secure_path}/user/blockedIp/batchDelete` 仅删除 IP 封禁记录，不会自动把已有用户的 `banned` 改回未封禁。

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
| `user_type` | `string` | 否 | 用户类型，`global` 或 `define`；`define` 时按 `menus` 菜单路径白名单限制可见菜单 |
| `menus` | `string[]` | 否 | 菜单路径白名单，仅 `user_type=define` 时生效 |

### 示例

```json
POST /v3/user/update
{
    "id": 1,
    "email": "new@example.com",
    "plan_id": 2,
    "expired_at": 1767225600,
    "user_type": "define",
    "menus": ["/dashboard", "/business/user-manage"],
    "register_metadata": {
        "app_id": "com.example.app",
        "channel": "telegram"
    }
}
```

手动解封示例：

```json
POST /api/v3/admin/user/update
{
    "id": 123,
    "banned": false
}
```

或：

```json
POST /api/v3/admin/user/update
{
    "id": 123,
    "banned": 0
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
