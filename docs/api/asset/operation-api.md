# Asset Service Operation API

## 资源字段说明

### Operation

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 操作记录主键。 |
| `operation_type` | string | 操作类型，例如 `create_machine`。 |
| `target_type` | string | 目标资源类型。 |
| `target_id` | string | 目标资源标识。 |
| `provider_id` | integer | 所属供应商主键。 |
| `provider_code` | string | 所属供应商代码。 |
| `account_id` | integer | 所属供应商账号主键。 |
| `account_name` | string | 所属供应商账号名称。 |
| `status` | string | 操作状态，例如 `pending`、`running`、`succeeded`、`failed`、`cancelled`。 |
| `request` | object | 脱敏后的请求数据。 |
| `result` | object | 脱敏后的执行结果。 |
| `error_summary` | string | 错误摘要。 |
| `created_by` | integer | 创建人 ID。 |
| `created_at` | string | 创建时间。 |
| `updated_at` | string | 更新时间。 |


## 接口说明

### 35. 获取操作记录列表

- 地址：`GET /api/v1/assets/operations`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码。 |
| `page_size` | integer | 否 | 每页条数。 |
| `provider_code` | string | 否 | 供应商代码。 |
| `account_id` | integer | 否 | 供应商账号主键。 |
| `status` | string | 否 | 操作状态。 |

返回值：

- `data.items`: `Operation` 数组


### 36. 获取操作记录详情

- 地址：`GET /api/v1/assets/operations/{operation_id}`

路径参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `operation_id` | integer | 是 | 操作记录主键。 |

返回值：

- `data`: `Operation`
