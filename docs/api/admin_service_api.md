# Admin Service API

本文档记录 Dev 控制台当前对接的 `admin-service` 接口。开发环境前端使用 `/v4/admin/*` 作为别名前缀，经 Umi proxy 转发到 `8.220.74.20:8080/api/v1/admin/*`。

## 通用返回

除特殊内部接口外，接口使用 common response envelope：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "error": null,
  "request_id": "req-xxx",
  "timestamp": 1717824000
}
```

前端成功判断：HTTP `200` 且 `code === 0`。

## 认证方式

Dev 菜单管理使用管理员 JWT：

```http
Authorization: Bearer <admin_jwt>
```

登录接口不需要前端携带 `Authorization`。登录成功后返回的 `access_token` 仅存放在当前浏览器标签页的 Dev 专用 `sessionStorage` 中，不写入运营后台使用的 `auth_token`、`secure_path` 或 `user_info`。

前端当前在 `/user/login` 提供 `运营` / `管理` 两种登录模式：

- `运营` 模式继续使用 passport 登录链路，并加载现有业务后台菜单。
- `管理` 模式调用本文档的管理员登录接口，登录成功后进入 `/dev/nodes`，布局只显示 Dev 菜单。
- 直接访问 `/dev/*` 且没有 Dev session 时，仍保留 Dev 页面内弹窗登录作为兜底入口。

## 管理员登录

```http
POST /api/v1/admin/auth/login
```

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 是 | 管理员用户名 |
| `password` | string | 是 | 管理员密码 |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `access_token` | string | 管理员访问令牌 |
| `refresh_token` | string | 刷新令牌 |
| `expires_in` | integer | 访问令牌有效期，单位秒 |
| `user` | object | 当前管理员信息 |

## 刷新令牌

```http
POST /api/v1/admin/auth/refresh
```

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `refresh_token` | string | 是 | 当前有效的刷新令牌 |

成功 `data` 同登录接口。

## 当前管理员

```http
GET /api/v1/admin/auth/me
```

认证：管理员 JWT。

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 管理员用户 ID |
| `username` | string | 用户名 |
| `nickname` | string | 昵称 |
| `permissions` | string[] | 权限码 |
| `is_super_admin` | boolean | 是否超级管理员 |

## 退出登录

```http
POST /api/v1/admin/auth/logout
```

认证：管理员 JWT。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `refresh_token` | string | 是 | 要撤销的刷新令牌 |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ok` | boolean | 是否处理成功 |

## 查询全部菜单

```http
GET /api/v1/admin/menus
```

认证：管理员 JWT。权限：`admin:menu:read`。

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | object[] | 菜单树列表 |

菜单对象字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 菜单 ID |
| `parent_id` | integer | 父菜单 ID，根菜单为 `0` |
| `name` | string | 菜单名称 |
| `path` | string | 路由路径 |
| `component` | string | 前端组件标识 |
| `icon` | string | 图标标识 |
| `sort` | integer | 排序值 |
| `visible` | boolean | 是否可见 |
| `permission_code` | string | 关联权限码，空表示不绑定权限 |
| `children` | object[] | 子菜单列表 |

## 查询当前用户菜单

```http
GET /api/v1/admin/menus/current
```

认证：管理员 JWT。不要求 `admin:menu:read`，按当前用户权限过滤菜单。

成功 `data` 同“查询全部菜单”。

## 创建菜单

```http
POST /api/v1/admin/menus/create
```

认证：管理员 JWT。权限：`admin:menu:create`。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `parent_id` | integer | 是 | 父菜单 ID，根菜单使用 `0` |
| `name` | string | 是 | 菜单名称 |
| `path` | string | 是 | 路由路径 |
| `component` | string | 是 | 前端组件标识 |
| `icon` | string | 否 | 图标标识 |
| `sort` | integer | 否 | 排序值 |
| `visible` | boolean | 否 | 是否可见 |
| `permission_code` | string | 否 | 关联权限码，非空时必须已存在 |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | integer | 新建菜单 ID |

## 更新菜单

```http
POST /api/v1/admin/menus/update
```

认证：管理员 JWT。权限：`admin:menu:update`。

请求体字段同创建菜单，并额外要求：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 菜单 ID |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ok` | boolean | 是否处理成功 |

## 删除菜单

```http
POST /api/v1/admin/menus/delete
```

认证：管理员 JWT。权限：`admin:menu:delete`。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 菜单 ID |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ok` | boolean | 是否处理成功 |

## 查询权限目录

```http
GET /api/v1/admin/permissions
```

认证：管理员 JWT。权限：`admin:permission:read`。

Query 参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `group_name` | string | 否 | 权限分组名称 |
| `resource` | string | 否 | 权限所属资源，例如 `admin:user` |
| `action` | string | 否 | 权限动作，例如 `read`、`create`、`update` |

成功 `data`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `items` | object[] | 权限列表 |

权限对象字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | string | 权限码，例如 `admin:user:read` |
| `name` | string | 权限名称 |
| `group_name` | string | 权限分组 |
| `resource` | string | 资源标识 |
| `action` | string | 动作标识 |
