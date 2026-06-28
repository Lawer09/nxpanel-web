# Asset Service 通用说明


本文档描述 `asset-service` 对外提供的控制接口，重点说明请求地址、请求参数、返回值结构和字段含义。

所有接口均通过 `gateway-service` 对外暴露，基础路径为：

```text
/api/v1/assets
```


## 通用说明

### 请求方式

- 只使用 `GET` 和 `POST`
- 创建、更新、删除、执行类接口成功时统一返回 HTTP `200`

### 认证方式

前端通过网关访问时，使用：

```http
Authorization: Bearer <admin_jwt>
```

### 通用返回格式

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

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | integer | 业务状态码，`0` 表示成功。 |
| `message` | string | 状态消息。 |
| `data` | object/array/null | 接口实际返回的数据。 |
| `error` | object | 失败时返回的错误对象，通常包含 `type` 和 `detail`。 |
| `request_id` | string | 请求唯一标识，用于排查日志。 |
| `timestamp` | integer | 服务端返回时间戳，单位秒。 |

### 分页返回格式

列表接口中的 `data` 统一为：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | array | 当前页数据列表。 |
| `page` | integer | 当前页码，从 `1` 开始。 |
| `page_size` | integer | 每页条数。 |
| `total` | integer | 满足条件的总记录数。 |


## 通用资源类型

### TaskAck

异步接口成功后，`data` 返回：

```json
{
  "task_id": 123,
  "status": "pending",
  "task_url": "/api/v1/tasks/123"
}
```

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `task_id` | integer | 通用任务主键。 |
| `status` | string | 任务当前状态。 |
| `task_url` | string | 任务查询地址。 |


## 错误返回说明

常见错误类型：

| 场景 | 说明 |
| --- | --- |
| `401` | 认证失败。 |
| `403` | 无权限访问。 |
| `404` | 资源不存在。 |
| `409` | 资源冲突，或供应商能力不支持当前操作。 |
| `502` | 调用供应商接口失败。 |

失败返回示例：

```json
{
  "code": 100003,
  "message": "resource conflict",
  "error": {
    "type": "COMMON_CONFLICT",
    "detail": "capability_not_supported"
  },
  "request_id": "req-xxx",
  "timestamp": 1717824000
}
```
