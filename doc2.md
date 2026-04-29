根据该《项目配置与绑定接口说明》，前端建议新增一个统一菜单：

# 项目配置

用于完成：

* 项目基础信息维护
* 项目绑定流量账号
* 项目绑定广告账号
* 项目绑定用户 AppId（用于用户指标归属）

接口前缀：

```text
/v3/
```

统一返回格式：

```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {}
}
```

---

# 一、菜单结构建议

建议只做一个菜单，减少页面复杂度：

```text
项目配置
└── 项目管理
```

页面内部用：

```text
左侧项目列表 + 右侧 Tab 配置
```

结构如下：

```text
项目管理
├── 项目基础信息
├── 流量账号绑定
├── 广告账号绑定
└── 用户App绑定
```

这样前端界面简洁、操作集中。

---

# 二、页面布局建议

```text
┌────────────────────────────┐
│ 项目管理                    │
├──────────────┬─────────────┤
│ 左侧项目列表  │ 右侧配置区域 │
│              │             │
│ Game001      │ [基础信息]   │
│ Game002      │ [流量账号]   │
│ Game003      │ [广告账号]   │
│              │ [用户App]    │
└──────────────┴─────────────┘
```

---

# 三、左侧：项目列表

接口：

```http
GET /projects
```

支持搜索 / 分页 / 状态筛选。

筛选项：

| 字段      | 说明                           |
| ------- | ---------------------------- |
| keyword | 项目编码 / 项目名称                  |
| ownerId | 所属人                          |
| status  | active / inactive / archived |

展示字段：

| 列名   | 字段          |
| ---- | ----------- |
| 项目编码 | projectCode |
| 项目名称 | projectName |
| 所属人  | ownerName   |
| 部门   | department  |
| 状态   | status      |

操作：

```text
新增项目
编辑
启用/禁用
```

接口：

```http
POST /projects
GET /projects/{id}
PUT /projects/{id}
PATCH /projects/{id}/status
```

---

# 四、右侧 Tab：项目基础信息

默认选中。

展示内容：

```text
项目编码
项目名称
所属人
部门
状态
备注
创建时间
更新时间
```

编辑使用 Drawer / Modal。

新增/编辑表单字段：

| 字段          | 类型     |
| ----------- | ------ |
| projectCode | 输入框    |
| projectName | 输入框    |
| ownerName   | 输入框    |
| department  | 输入框/下拉 |
| status      | 下拉     |
| remark      | 文本域    |

---

# 五、流量账号绑定 Tab

用于绑定项目对应的代理流量账号。

接口：

```http
GET /projects/{id}/traffic-accounts
POST /projects/{id}/traffic-accounts
PUT /projects/{id}/traffic-accounts/{relationId}
DELETE /projects/{id}/traffic-accounts/{relationId}
```

列表字段：

| 列名    | 字段               |
| ----- | ---------------- |
| 平台    | platformCode     |
| 账号名称  | accountName      |
| 子账号ID | externalUid      |
| 子账号名称 | externalUsername |
| 绑定类型  | bindType         |
| 状态    | enabled          |
| 备注    | remark           |

绑定类型：

```text
account       整账号归属
sub_account   子账号归属
```

新增/编辑弹窗字段：

| 字段       | 类型   |
| -------- | ---- |
| 流量账号     | 下拉   |
| 平台       | 自动填充 |
| 子账号ID    | 输入框  |
| 子账号名称    | 输入框  |
| bindType | 单选   |
| enabled  | 开关   |
| remark   | 输入框  |

流量账号下拉接口：

```http
GET /traffic-platform/accounts
```

建议参数：

```text
enabled=1&page=1&pageSize=200
```

---

# 六、广告账号绑定 Tab

用于绑定项目对应广告收入账号。

接口：

```http
GET /projects/{id}/ad-accounts
POST /projects/{id}/ad-accounts
PUT /projects/{id}/ad-accounts/{relationId}
DELETE /projects/{id}/ad-accounts/{relationId}
```

列表字段：

| 列名    | 字段               |
| ----- | ---------------- |
| 平台    | platformCode     |
| 账号名称  | accountName      |
| AppID | externalAppId    |
| 广告位ID | externalAdUnitId |
| 绑定类型  | bindType         |
| 状态    | enabled          |
| 备注    | remark           |

绑定类型：

```text
account 整账号
app     App级
ad_unit 广告位级
```

新增/编辑字段：

| 字段       | 类型  |
| -------- | --- |
| 广告账号     | 下拉  |
| AppID    | 输入框 |
| 广告位ID    | 输入框 |
| bindType | 单选  |
| enabled  | 开关  |
| remark   | 输入框 |

广告账号下拉接口：

```http
GET /ad-accounts
```

---

# 七、用户 AppId 绑定 Tab

用于用户指标归属。

接口：

```http
GET /projects/{id}/user-apps
POST /projects/{id}/user-apps
PUT /projects/{id}/user-apps/{relationId}
DELETE /projects/{id}/user-apps/{relationId}
```

列表字段：

| 列名    | 字段        |
| ----- | --------- |
| AppId | appId     |
| 状态    | enabled   |
| 备注    | remark    |
| 创建时间  | createdAt |

新增/编辑字段：

| 字段      | 类型  |
| ------- | --- |
| appId   | 输入框 |
| enabled | 开关  |
| remark  | 输入框 |

约束：

```text
同项目下 appId 唯一
不能为空
自动 trim
```

---

# 八、交互建议

### 1. 项目切换自动刷新右侧

左侧切换项目后自动刷新：

```text
基础信息
流量账号绑定
广告账号绑定
用户App绑定
```

---

### 2. 新增/编辑使用弹窗

不要跳新页面：

```text
Modal / Drawer
```

---

### 3. 删除直接二次确认

文案：

```text
确认删除该绑定关系？
```

删除成功后刷新列表。

---

### 4. 错误提示

错误码说明：

```text
404：项目不存在 / 记录不存在
422：参数错误 / 重复绑定
500：服务异常
```

前端提示规则：

```text
优先显示 msg
```

---

# 九、推荐最终页面效果

```text
项目配置

[搜索项目] [新增项目]

左侧：
项目列表

右侧：
Tabs:
基础信息 | 流量账号绑定 | 广告账号绑定 | 用户App绑定
```

这种结构最适合后台管理系统：

* 页面少
* 信息集中
* 操作路径短
* 可扩展性强
