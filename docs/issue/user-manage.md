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

## 用户管理缺少 IP 白名单与白名单策略维护入口

### 出现场景

用户管理页已经支持封禁 IP 和封禁策略，但后端新增了 IP 白名单与自动白名单策略接口后，前端仍缺少对应的查询、批量录入、删除和规则维护入口，人工维护可信 IP 仍需借助外部接口调试工具。

### 问题原因

- 用户管理页工具栏只暴露了“封禁 IP / 封禁策略”两类风险控制入口。
- 用户服务层缺少 `allowedIp` 与 `ipAllowlistRule` 相关类型和接口封装。
- 页面内没有沿用现有弹窗模式承接白名单记录和规则维护。

### 解决方式

- 复用“封禁 IP”弹窗模式新增 `IP 白名单` 列表弹窗，支持按 IP、操作人筛选，支持批量录入多个 IP，并支持单条/批量删除。
- 复用“封禁策略”的列表加表单弹窗模式新增 `白名单策略`，支持启停、国家/项目代号/包名条件维护和删除。
- 白名单批量录入支持按空白字符或逗号拆分多个 IP，前端先去重并限制最多 500 个。
- 白名单策略表单增加前端校验，强制国家、项目代号、包名至少配置一类条件，国家输入统一转为大写。

### 影响范围

- 用户管理页工具栏新增白名单维护入口
- IP 白名单记录维护
- IP 白名单自动规则维护
- 用户相关接口文档与前端类型定义

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/pages/user-manage/components/AllowedIpModal.tsx`
- `src/pages/user-manage/components/IpAllowlistRuleModal.tsx`
- `src/pages/user-manage/components/IpAllowlistRuleFormModal.tsx`
- `src/services/user/api.ts`
- `src/services/user/typings.d.ts`
- `docs/api/user_api.md`

## 用户筛选仍沿用 onlyBanned 导致无法筛选未封禁用户

### 出现场景

用户管理页原有筛选项只有“仅封禁用户”开关，打开后只能查询已封禁用户，关闭后则完全不筛选，无法直接筛出“未封禁用户”。同时后端用户列表查询已改为直接读取 `banned` 字段，前端继续发送 `onlyBanned` 会和最新接口约定不一致。

### 问题原因

- 筛选栏仍保留旧的布尔开关设计，只覆盖“封禁”与“不筛选”两种状态。
- 用户查询参数类型和文档仍记录 `onlyBanned`，没有同步到新的 `banned` 语义。

### 解决方式

- 将筛选项改为“封禁状态”三态选择：已封禁、未封禁、不筛选。
- 用户列表查询统一发送 `banned` 字段：
  `banned=1/true` 查询已封禁，`banned=0/false` 查询未封禁，空值不传。
- 当前结果摘要同步按 `banned` 展示“已封禁 / 未封禁”标签。

### 影响范围

- 用户管理页筛选栏
- 用户列表查询参数构造
- 用户 API 文档与前端类型定义

### 相关文件

- `src/pages/user-manage/index.tsx`
- `src/services/user/typings.d.ts`
- `docs/api/user_api.md`

## 用户管理缺少邀请关系筛选入口

### 出现场景

用户管理页需要筛出“有邀请者 / 无邀请者”的用户，或直接按邀请人 ID、邀请人邮箱定位某一批被邀请用户，但当前筛选栏没有对应入口，只能手动拼接口请求。

### 问题原因

- 前端筛选栏尚未暴露用户列表接口里的通用 `filter` 邀请关系能力。
- `invite_user_id` 和 `invite_user.email` 虽然后端都支持筛选，但页面没有将这些条件映射成可操作的筛选控件。

### 解决方式

- 在用户管理筛选栏新增“邀请状态”“邀请人 ID”“邀请人邮箱”三个筛选项。
- “邀请状态”映射为 `invite_user_id` 的 `notnull:1 / null:1`。
- “邀请人 ID”映射为 `invite_user_id = eq:xxx`，“邀请人邮箱”映射为 `invite_user.email`。
- 当前筛选结果摘要同步展示邀请筛选条件，避免用户忘记当前查询上下文。

### 影响范围

- 用户管理页筛选栏
- 用户列表查询的 `filter` 参数构造
- 用户 API 文档

### 相关文件

- `src/pages/user-manage/index.tsx`
- `docs/api/user_api.md`

## 用户管理邀请筛选值被 ProTable transform 吞掉

### 出现场景

用户管理页新增“邀请状态”筛选后，界面上能正常选择“有邀请者 / 无邀请者”，但实际发往 `/v3/user/fetch` 的请求里 `filter` 仍为空，导致筛选完全不生效。

### 问题原因

- 相关筛选字段配置了 `search.transform: () => ({})`。
- `ProTable` 在存在 `transform` 时不会再把原始 `dataIndex` 值保留到 `request` 参数里，返回空对象等于把表单值直接丢弃。

### 解决方式

- 去掉邀请状态、邀请人 ID、邀请人邮箱三个筛选项上的空 `transform` 配置。
- 让 `request` 直接读取原始 `params.invite_filter / invite_user_id_search / invite_user_email_search` 并组装后端 `filter`。

### 影响范围

- 用户管理页邀请关系筛选
- `ProTable` 自定义筛选项取值方式

### 相关文件

- `src/pages/user-manage/index.tsx`

## 用户管理列表缺少邀请人信息展示

### 出现场景

后端用户列表已经返回 `invite_user.id` 和 `invite_user.email`，但用户管理主列表没有直接展示邀请人信息。排查用户来源或核对邀请关系时，需要先开筛选或进入详情页，效率偏低。

### 问题原因

- 主列表此前为了压缩横向空间，将邀请人列留在注释状态，没有真正渲染。
- 已有接口返回的 `invite_user` 关联信息没有在列表层复用。

### 解决方式

- 在用户管理主列表恢复“邀请人”列展示。
- 单元格上方显示邀请人邮箱，下方显示邀请人 ID；无邀请人时显示 `-`。

### 影响范围

- 用户管理主列表的邀请关系可见性
- 用户来源排查效率

### 相关文件

- `src/pages/user-manage/index.tsx`
