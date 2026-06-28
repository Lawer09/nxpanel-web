# Asset Service Machine Scripts API

本文档描述机器 Bash 脚本库与脚本执行接口。基础路径为：

```text
/api/v1/assets
```

脚本执行会创建 `asset.machine_script.run` 异步任务。前端通过 task-service 查询执行状态和结果：

- `GET /api/v1/tasks/{task_id}`：任务汇总。
- `GET /api/v1/tasks/{task_id}/items`：每台机器执行结果。
- `GET /api/v1/tasks/{task_id}/events`：执行事件。

本文所有返回值都包裹在平台通用响应结构中，业务字段位于 `data` 下；分页接口返回 `data.items`、`data.total` 等分页字段。

## 数据结构

### MachineScript

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 脚本主键。 |
| `name` | string | 全局唯一脚本名，执行时通过该字段查找 active 脚本。 |
| `description` | string | 脚本说明。 |
| `content` | string | Bash 脚本内容，仅详情接口返回。 |
| `tags` | array | 标签数组，格式为 `key/value/label`。 |
| `metadata` | object | 附加元数据。 |
| `status` | string | `active` 或 `disabled`。 |
| `created_by` | integer | 创建人。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |

标签格式：

```json
[
  {"key": "purpose", "value": "bootstrap", "label": "初始化"}
]
```

## 接口

### 1. 获取脚本列表

- 地址：`GET /api/v1/assets/machine-scripts`
- 权限：`asset:machine-script:read`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码，默认 `1`。 |
| `page_size` | integer | 否 | 每页条数，默认 `20`。 |
| `name` | string | 否 | 按脚本名模糊搜索。 |
| `status` | string | 否 | `active` 或 `disabled`。 |
| `tag_key` | string | 否 | 按标签 key 过滤。 |
| `tag_value` | string | 否 | 按标签 value 过滤。 |

返回值：

- `data.items`: `MachineScript` 数组。
- 列表项不返回 `content`。

说明：

- 同时传 `tag_key` 和 `tag_value` 时，后端分别判断脚本标签数组中存在指定 key 和指定 value；不要求二者必须出现在同一个标签对象内。

### 2. 获取脚本详情

- 地址：`GET /api/v1/assets/machine-scripts/{script_id}`
- 权限：`asset:machine-script:read`

返回值：

- `data`: `MachineScript`，包含完整 `content`。

### 3. 创建脚本

- 地址：`POST /api/v1/assets/machine-scripts/create`
- 权限：`asset:machine-script:create`

请求体：

```json
{
  "name": "install-agent",
  "description": "Install nx agent",
  "content": "#!/usr/bin/env bash\nset -e\n echo ok",
  "tags": [
    {"key": "purpose", "value": "bootstrap", "label": "初始化"}
  ],
  "metadata": {},
  "status": "active"
}
```

校验：

- `name` 必填且全局唯一。
- `content` 必填，最大 `64 KiB`。
- `status` 为空时默认为 `active`，仅允许 `active/disabled`。

返回值：

- `data.id`: 新建脚本 ID。

### 4. 更新脚本

- 地址：`POST /api/v1/assets/machine-scripts/update`
- 权限：`asset:machine-script:update`

请求体字段同创建接口，额外要求 `id`。

返回值：

- `data.ok`: 是否成功。

### 5. 删除脚本

- 地址：`POST /api/v1/assets/machine-scripts/delete`
- 权限：`asset:machine-script:delete`

请求体：

```json
{
  "id": 1
}
```

说明：

- 删除为物理删除。
- 已创建的执行任务保存了脚本内容快照，删除脚本不会影响已提交任务。

### 6. 执行脚本

- 地址：`POST /api/v1/assets/machine-scripts/run`
- 权限：`asset:machine:execute`

请求体：

```json
{
  "script_name": "install-agent",
  "machine_ids": [1, 2],
  "timeout_seconds": 300,
  "port": 22
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `script_name` | string | 是 | 脚本名，只解析 `active` 脚本。 |
| `machine_ids` | integer array | 是 | 要执行的机器主键列表，后端会去重。 |
| `timeout_seconds` | integer | 否 | 单机执行超时，默认 `60`，最大 `30min`。 |
| `port` | integer | 否 | SSH 端口，默认 `22`。 |

返回值：

```json
{
  "task_id": 123,
  "status": "pending",
  "task_url": "/api/v1/tasks/123"
}
```

执行规则：

- 执行时固定使用机器保存的 SSH 凭据，不接收 `ssh_key_id`、`username` 或 `command`。
- SSH 目标地址优先选择机器已绑定的公网 IP，例如 `default_public`、`eip`、`public`、`elastic`、`elastic_ip`；没有公网 IP 时才退回 primary IP 或其他可用 IP。
- 任务 payload 加密保存脚本内容快照，后续脚本修改或删除不影响该任务。
- 公开 `request_json`、task event 和日志不返回完整脚本内容，只返回 `script_id`、`script_name`、`content_sha256`、`content_length` 等摘要。
- `content_sha256` 是脚本内容的 SHA-256 十六进制字符串，不包含 `sha256:` 前缀。
- 只要任意机器执行失败，任务最终状态为 `failed`，`error_summary` 通常为 `failed_items:<数量>`；成功和失败明细需要查看 task items。

## 任务结果

`GET /api/v1/tasks/{task_id}` 的 `result_json` 示例：

```json
{
  "script_id": 1,
  "script_name": "install-agent",
  "content_sha256": "b5666b591cc81ea7e1fe3fc253de65ebceb1317786572300aa59eb6432bf7ad6",
  "failed_items": 0,
  "results": []
}
```

`GET /api/v1/tasks/{task_id}/items` 的 `items[].result_json` 示例：

```json
{
  "machine_id": 1,
  "machine_business_id": "asset_xxx",
  "host": "203.0.113.10",
  "script_id": 1,
  "script_name": "install-agent",
  "content_sha256": "b5666b591cc81ea7e1fe3fc253de65ebceb1317786572300aa59eb6432bf7ad6",
  "exit_code": 0,
  "stdout_tail": "ok\n",
  "stderr_tail": "",
  "duration_ms": 1200
}
```

说明：

- `stdout_tail` 和 `stderr_tail` 只保留尾部输出；如果没有输出，字段可能为空字符串或不存在。
- SSH 连接失败、认证失败、会话创建失败等错误可能没有 `exit_code`，需要结合 item 的 `error_summary` 判断。

## 错误语义

- 脚本不存在：`404 COMMON_NOT_FOUND`。
- 脚本非 active：执行接口按不存在处理。
- 脚本名重复：`409 COMMON_CONFLICT`。
- 请求字段缺失或非法：`400 INVALID_REQUEST`。
- 单台机器无 IP、无 SSH 凭据、认证失败或脚本非 0 退出：该 task item 标记 failed，不阻断其他机器执行。
