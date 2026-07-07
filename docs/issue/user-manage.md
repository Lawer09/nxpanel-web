## 用户管理页操作上下文与编辑入口混杂

### 出现场景

业务后台用户管理页同时承担筛选、批量操作、账号配置、注册归因排查等任务时，列表操作容易让人分不清当前动作究竟作用于“当前筛选结果”“当前勾选项”还是“单条记录”，并且点击邮箱会直接进入重表单编辑态，查看和修改缺少分层。

### 问题原因

原页面以单张 `ProTable` 承担绝大多数任务：

- 工具栏直接挂载导出、群发、生成用户等全局动作
- 列表项点击邮箱直接进入编辑弹窗
- 群发邮件与导出只部分复用了当前筛选条件
- `define` 用户菜单授权要求操作者手工输入菜单 path
- 单个创建与批量生成共用一个表单，通过提示文案区分模式

这会导致操作上下文不稳定、学习成本高，也增加误操作概率。

### 解决方式

对用户管理页交互进行收口：

- 增加用户详情抽屉，主表点击邮箱或“查看详情”先进入只读详情，再从详情进入编辑
- 顶部增加当前筛选结果摘要，明确当前结果总数和关键筛选条件
- 群发邮件入口改为强调“当前筛选结果”或“当前勾选项”
- `define` 用户菜单改为基于现有路由的可搜索多选，而非手填 path
- 生成用户弹窗拆成“单个创建 / 批量生成”两种模式，并统一套餐选择方式

### 影响范围

- 用户管理主表的查看、编辑、导出、群发邮件交互
- 用户创建/生成与自定义菜单授权配置

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/pages/user-manage/components/UserDetailDrawer.tsx`
- `src/pages/user-manage/components/UserFormModal.tsx`
- `src/pages/user-manage/components/GenerateUserModal.tsx`
- `src/pages/user-manage/menuOptions.ts`

## 用户管理列表的注册 IP 只读顶层字段导致显示为空

### 出现场景

用户管理列表与详情页需要展示注册 IP，但部分接口返回把 IP 放在 `register_metadata.ip` 中，顶层 `ip` 字段为 `null`。这时页面会显示成空值，即使注册元数据里已经带了真实 IP。

### 问题原因

前端原先只读取 `record.ip`，没有兼容 `register_metadata.ip` 这一返回形态。

### 解决方式

统一增加注册 IP 的兜底读取逻辑：

- 优先使用顶层 `ip`
- 顶层为空时回退读取 `register_metadata.ip`
- 用户管理主表新增独立的“注册 IP”列
- 注册信息摘要与详情抽屉复用同一套取值逻辑，避免不同区域显示不一致

### 影响范围

- 用户管理主表的注册 IP 展示
- 用户详情抽屉中的注册信息展示
- 用户接口类型定义中的注册元数据字段声明

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/pages/user-manage/components/UserDetailDrawer.tsx`
- `src/services/user/typings.d.ts`

## 用户管理筛选项重复与列表信息分散

### 出现场景

用户管理页同时存在列表列自动生成的邮箱搜索和手工定义的“搜索邮箱”，筛选栏会出现两个邮箱相关输入；另外“注册包名”原先是自由文本输入，不利于按现有应用 ID 快速筛选，列表中的套餐、流量、到期时间、角色、状态信息分散在多列，横向占用较大。

### 问题原因

- `ProTable` 默认会为可搜索列生成查询项，邮箱展示列未关闭搜索，和 `email_search` 重复。
- 用户管理页未复用项目侧已有的应用 ID 映射接口与下拉选项构建逻辑。
- 套餐、流量、到期时间属于同一组账户状态信息，角色与封禁状态也属于同一组账号状态信息，拆列后信息密度低，列表横向空间浪费明显。

### 解决方式

- 关闭邮箱展示列的默认搜索，只保留手工定义的“搜索邮箱”筛选项。
- 复用 `/v3/projects/user-apps/mappings` 接口生成“注册包名”可搜索下拉，选项文案采用“应用ID（projectCode）”。
- 将“流量使用”和“到期时间”并入“套餐”列，上方展示套餐标签，下方展示“已用 / 总量”和到期信息。
- 将“角色”并入“状态”列，在封禁/正常状态下补充管理员、员工标签，压缩横向占用同时保留关键身份信息。

### 影响范围

- 用户管理页筛选栏
- 用户管理页主列表列布局
- 用户按应用 ID 的筛选体验

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/pages/report/node-summary-report/index.tsx`
- `src/services/project/api.ts`

## 封禁 IP 列表缺少 type 展示与更新入口

### 出现场景

封禁 IP 列表接口新增了 `type` 字段，且后台支持通过 `updateType` 单独修改类型；但前端列表仍然只展示 IP、原因、操作者等信息，没有展示当前 type，也没有提供更新入口。

### 问题原因

- `UserBlockedIpItem` 类型定义未补充 `type` 字段。
- 用户服务层未封装 `/v3/user/blockedIp/updateType` 接口。
- 列表缺少针对已知类型的统一展示与更新交互，导致人工维护成本高。

### 解决方式

- 在封禁 IP 列表中新增 `Type` 列，直接展示后端返回的当前类型。
- 新增 `updateBlockedIpType` 服务封装，操作列补充“更新类型”入口。
- 更新类型弹窗改为固定下拉，先内置 `dangerous` 和 `normal` 两个选项，并通过标签颜色区分展示。

### 影响范围

- 用户管理页中的封禁 IP 列表展示
- 封禁 IP 类型的人工维护操作
- 用户服务层 blocked IP 相关类型定义与接口封装

### 相关文件

- `src/pages/user-manage/components/BlockedIpModal.tsx`
- `src/services/user/api.ts`
- `src/services/user/typings.d.ts`
- `docs/api/user_api.md`

## 封禁 IP 列表中的操作者文案错误

### 出现场景

封禁 IP 列表“关联用户”列会同时展示命中用户和执行操作的后台账号，但第二行文案写成了“管理员”，和后端返回字段 `operator_user` 的语义不一致。

### 问题原因

- 前端在压缩展示布局时，直接把 `operator_user` 的说明文案写成了固定“管理员”。
- 页面文案没有准确对齐接口字段里的“操作人/操作者”含义。

### 解决方式

- 保持展示字段不变，仍然读取 `operator_user`。
- 将列表中的标签文案从“管理员”改为“操作人”，避免误导用户理解该字段含义。

### 影响范围

- 用户管理页中的封禁 IP 列表
- 封禁记录操作者信息的认知准确性

### 相关文件

- `src/pages/user-manage/components/BlockedIpModal.tsx`

## 用户管理新增国家与 IP 注册筛选

### 出现场景

用户管理页需要按注册国家和注册 IP 快速定位用户，但当前筛选栏只有注册包名、注册渠道等注册元数据筛选项，排查特定地域或特定来源 IP 的用户时需要人工翻列表。

### 问题原因

- 用户查询接口支持通过 `meta` 对 `register_metadata` 字段过滤，但前端未暴露 `country`、`ip` 两个常用键。
- 当前没有独立的国家或 IP 候选接口，不适合凭空构造固定枚举。

### 解决方式

- 在用户管理筛选栏新增“国家”和“IP”两个筛选项。
- 两者沿用注册包名所在的注册元数据过滤逻辑，最终分别映射到 `meta.country` 和 `meta.ip`。
- 交互采用可输入的单值下拉，既保持筛选栏样式一致，也允许直接输入精确值。

### 影响范围

- 用户管理页筛选栏
- 用户查询请求中的 `register_metadata` 过滤参数
- 当前筛选结果摘要标签展示

### 相关文件

- `src/pages/user-manage/index.tsx`
- `docs/api/user_api.md`

## 用户管理手动解封误复用封禁接口

### 出现场景

用户管理页单条记录的“解封”操作原先复用了封禁接口，但后端当前约定中，用户手动解封必须走用户更新接口，把 `banned` 改回 `false` 或 `0`；删除封禁 IP 记录也不会自动解除用户封禁。

### 问题原因

- 前端把“封禁”和“解封”都收口到了 `banUsers`。
- 页面交互层没有区分“解除用户封禁”和“删除 IP 封禁记录”这两类后端语义不同的操作。

### 解决方式

- 保持“封禁”仍调用 `banUsers`。
- 将单条“解封”改为调用 `updateUser({ id, banned: false })`。
- 在接口文档中补充说明：`blockedIp/delete`、`blockedIp/batchDelete` 不会自动把用户的 `banned` 改回未封禁。

### 影响范围

- 用户管理页单条记录的“解封”操作
- 用户更新接口的 `banned` 字段使用约束
- 封禁 IP 删除与用户解封的操作认知边界

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/services/user/api.ts`
- `docs/api/user_api.md`

## 封禁 IP 缺少批量新增入口

### 出现场景

风控或人工排查时，需要一次性录入多条风险 IP，并可选择同步封禁这些 IP 命中的已注册用户。当前封禁 IP 列表只支持查看、更新类型和删除记录，无法直接在页面中批量新增。

### 问题原因

- 用户服务层未封装 `/v3/user/blockedIp/batchBlock`。
- 封禁 IP 弹窗缺少适合批量录入多 IP 的表单入口。
- 多 IP 输入需要兼容复制粘贴场景，单个输入框或逐条新增交互成本过高。

### 解决方式

- 新增 `batchBlockBlockedIps` 服务封装和对应返回类型。
- 在封禁 IP 列表工具栏新增“批量封禁 IP”入口。
- 弹窗支持输入多个 IP，前端按空白字符或逗号拆分、去重，并支持设置 `type`、`banUsers`、`reason`。

### 影响范围

- 用户管理页中的封禁 IP 维护操作
- 风控场景下的批量封禁录入效率
- blocked IP 相关接口文档与前端类型定义

### 相关文件

- `src/pages/user-manage/components/BlockedIpModal.tsx`
- `src/services/user/api.ts`
- `src/services/user/typings.d.ts`
- `docs/api/user_api.md`
