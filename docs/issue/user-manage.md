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
