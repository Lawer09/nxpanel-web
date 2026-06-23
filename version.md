# Version Log

## 维护说明（必读）

当前开发版本：`1.4.1`

请后续严格按以下规则维护此文件。

### 1. 当前版本规则

- 以顶部 `当前开发版本：x.y.z` 作为唯一准则。
- 只允许在当前开发版本对应的 `## [x.y.z]` 区块下追加内容，不存在则按照发版切换规则中的说明执行操作。
- 禁止修改历史版本内容。
- 历史版本一旦切换后，视为冻结，只读，不再新增、删除或改写条目。

### 2. 记录粒度

- 一次功能改动对应一条日志。
- 日志必须具体说明：做了什么 + 影响范围。
- 避免空泛描述，例如：
  - 不推荐：`优化了体验`
  - 推荐：`优化版本检查频率，增加 60 秒节流，减少重复请求`
- 如涉及关键文件，建议在末尾补充文件路径，例如：
  - `- 新增版本一致性检查，菜单切换时发现新版本自动整页刷新（src/app.tsx）`

### 3. 分类标准

每个版本下按以下分类记录：

#### 新增功能

用于记录全新能力、页面、接口、交互、模块。

#### 优化功能

用于记录已有功能的性能、体验、结构、可维护性改进。

#### Bug 修复

用于记录明确的问题修复，包括异常、边界问题、错误逻辑、兼容性问题。

### 4. 结构规则

- 版本标题格式固定：
---
## [版本号] - YYYY-MM-DD
---
条目统一使用 - 无序列表。
某分类若无内容，可以暂不填写。
不要写 无、暂无、N/A。
新增记录只能追加到对应分类下，不要重排历史记录。

### 5. 发版切换规则
只通过修改顶部 当前开发版本：x.y.z 来切换开发版本。
切换版本后，上一版本区块自动冻结。
如果新版本区块不存在，则在文件末尾新增版本模板，参考模板如下：
---
## [x.y.z] - YYYY-MM-DD

### 新增功能

### 优化功能

- 优化项目管理用户 App 绑定：为用户 App 关联增加非必填 `appLink` 字段，并同步到列表展示、新增/编辑弹窗、前端类型与项目 API 文档（src/pages/project/components/ResourceTabs/UserApps.tsx, src/services/project/types.ts, docs/api/project_api.md）。
- 优化项目报表数值展示精度：将金额、比例、ROI、流量和其它小数字段的前端显示统一从 2 位小数调整为 3 位小数，并同步更新项目报表接口文档说明（src/pages/report/project/index.tsx, docs/api/project-report-api.md）。
### Bug 修复
---
后续所有改动记录，只能写入当前开发版本对应区块。

### 6. 新版本描述建议
推荐句式：

动词 + 具体功能/模块 + 场景/影响范围（可选文件路径）

示例：

- 新增客户端版本强制刷新策略，菜单切换时发现新版本立即刷新页面（src/app.tsx）
- 优化版本检查频率，增加 60 秒节流，减少重复请求
- 修复菜单渲染包装导致的点击失效问题，恢复侧边菜单可用性

## 7. Agent 执行要求

每次 Agent 修改代码后，必须检查本文件：

读取顶部 当前开发版本
查找对应版本区块
根据本次改动内容，追加到正确分类
如果对应版本区块不存在，先创建版本区块
不得修改非当前版本的任何内容

## 8. 当前版本日志

## [1.4.1] - 2026-06-17

### 新增功能

- 新增 Dev 资产控制台与操作记录页面，在 `Dev` 下补充 `/dev/assets` 和 `/dev/asset-operations` 两个菜单，使用共享筛选、页内 Tabs、抽屉与弹窗集中承载供应商账号、机器、IP、SSH 密钥和异步操作追踪（config/routes.ts, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts, src/pages/dev/Assets.tsx, src/pages/dev/AssetOperations.tsx）。
- 新增 asset-service 独立前端请求层与类型定义，统一通过 `/v4/assets/*` 代理到 `/api/v1/assets/*` 并复用当前 Dev 管理 JWT 鉴权，对接 ProviderAccount、Machine、IP、SSHKey、Operation 与 TaskAck 接口（config/proxy.ts, src/services/dev-admin/request.ts, src/services/asset-service/）。
- 新增 asset-service 接口文档，固化 Dev 资产控制台当前使用的资源范围、异步任务跳转规则和 `capability_not_supported` 交互约束（docs/api/asset_service_api.md）。
- 新增独立 Asset 管理菜单组，将 asset-service 资产能力从 Dev 迁移到 `/asset/provider-accounts`、`/asset/machines`、`/asset/ips`、`/asset/ssh-keys`、`/asset/operations` 子菜单，并按新版接口补充供应商机器重试创建和创建请求信息展示（config/routes.ts, src/pages/asset/, src/services/asset-service/）。
- 新增独立 IAM 管理菜单组，管理登录态下提供用户、角色、权限、菜单、Client 与审计日志页面，并将管理登录接口切换到 `/api/v1/iam/*`，与 Dev 菜单并列展示且不混入运营菜单（config/routes.ts, config/proxy.ts, src/pages/iam/, src/services/iam/, src/services/dev-admin/）。
- 新增项目管理表格页并接入项目扩展字段：保留原 `/project` 卡片页并改名为项目管理Card，新增 `/project-table` 表格管理入口，支持项目扩展字段展示、新建、编辑、状态切换、详情抽屉与资源管理复用（config/routes.ts, src/pages/project-table/, src/services/project/types.ts, docs/api/project_api.md）。
- 新增用户管理 AID 登录封禁策略弹窗，支持按启用状态、包名和国家查询规则，并提供新增、编辑、删除封禁策略能力（src/pages/user-manage/index.tsx, src/pages/user-manage/components/AidLoginBanRuleModal.tsx, src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx, src/services/user/, docs/api/user_api.md）。

- 鏂板 Nodes 鐙珛绠＄悊鑿滃崟缁勫苟灏?node-service 鎺у埗闈㈣繕绉诲嚭 Dev锛氬皢 Agent/Node 鑿滃崟杩佺Щ鍒?`/nodes/overview`銆?`/nodes/list`銆?`/nodes/agents`锛屽悓鏃跺皢 node-service 璇锋眰鍓嶇紑鍒囨崲涓?`/v4/nodes/* -> /api/v1/nodes/*`锛屽苟琛ュ叏 Overview 棣栭〉銆丯odes/Agents 璇︽儏鐨?runtime銆乻amples銆乼raffic銆乷nline銆乪vents 鑳藉姏锛坈onfig/routes.ts, config/proxy.ts, src/app.tsx, src/pages/dev/NodesOverview.tsx, src/pages/dev/Nodes.tsx, src/pages/dev/Agents.tsx, src/services/node-control/锛夈€?

### 优化功能

- 优化项目报表流量费用展示：接入 `trafficCostRatio` 伴随字段，在“流量费用”列展示为“流量费用 (流量消耗占比)”，并支持普通行、当前页合计和总数据合计统一展示（src/pages/report/project/index.tsx, src/components/report/UniversalReportTable.tsx, docs/api/project-report-api.md, docs/api/project_report_query_api.md）。
- 优化项目报表筛选能力：新增仅用于筛选的 `adStatuses` 条件，下拉默认展示并提交“在投状态”“暂停状态”，同时支持手动输入，查询和导出时统一透传到 `filters` 参数（src/pages/report/project/index.tsx, src/services/report/typings.d.ts, docs/api/project-report-api.md, docs/api/project_report_query_api.md）。
- 优化项目报表投放状态展示：接口返回的 `adStatus` 伴随字段不单独新增列，合并到项目编码列右侧以 Tag 展示，`activate/deactivate` 显示为“在投状态/暂停状态”（src/pages/report/project/index.tsx, docs/api/project-report-api.md, docs/api/project_report_query_api.md）。
- 优化通用报表列设置：支持在表头拖拽调整列宽，拖动中仅显示参考线并在松手后写入 `columnsStateMap.width`，随本地缓存和保存视图一起恢复（src/components/report/UniversalReportTable.tsx, docs/components/universal_report_column_width.md, docs/issue/report_column_width.md）。
- 优化项目卡片列表展示：项目管理左侧卡片在“广告账号”旁增加 `adStatus` 标签展示，用于直观显示当前投放状态（src/pages/project/components/ProjectList.tsx, src/services/project/types.ts, docs/api/project_api.md）。
- 优化项目基础信息编辑：在项目详情内联编辑和项目新建/编辑弹窗中增加 `adStatus` 字段，默认下拉提供 `activate`、`deactivate` 两个候选并保留自定义输入能力，支持直接维护投放状态并与项目 API 参数保持一致（src/pages/project/components/ProjectDetail.tsx, src/pages/project/components/ProjectForm.tsx, src/services/project/types.ts, docs/api/project_api.md）。
- 优化项目管理聚合同步：日聚合同步和异步触发请求增加当前 `projectId` 参数，避免只按日期范围触发全局聚合（src/pages/project/components/DailyAggregation.tsx, src/services/project/types.ts, docs/api/project_api.md）。
- 优化 Asset 管理模块结构：将巨型 `src/pages/asset/index.tsx` 拆分为页面壳、共享筛选、资源面板、机器弹窗/详情抽屉与 payload 工具模块，并彻底移除 Dev 下旧资产兼容入口 `/dev/assets`、`/dev/asset-operations`，避免 Asset 与 Dev 旧页面继续混杂（config/routes.ts, src/pages/asset/, src/pages/dev/Assets.tsx, src/pages/dev/AssetOperations.tsx）。
- 优化用户管理 AID 登录封禁策略：新增 `projectCodes` 封禁匹配项目代号配置、列表展示与接口文档说明（src/pages/user-manage/components/AidLoginBanRuleModal.tsx, src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx, src/services/user/typings.d.ts, docs/api/user_api.md）。
- 优化用户管理 AID 登录封禁策略：新增 `timezone` 规则时区和 `dateWindows` 特定日期生效时间段配置，并同步列表展示、表单校验、类型声明与接口文档（src/pages/user-manage/components/AidLoginBanRuleModal.tsx, src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx, src/services/user/typings.d.ts, docs/api/user_api.md）。
- 优化用户管理 AID 登录封禁策略：规则时区字段改为常用时区列表选择，支持选择常用 IANA 时区并保留手动输入能力（src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx）。
- 优化用户管理 AID 登录封禁策略：常用时区列表补充俄罗斯多时区选项，并将时区与截止时间表单行调整为自适应双列布局，避免日期控件超出弹窗（src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx）。
- 优化用户管理 AID 登录封禁策略表单布局：将封禁匹配包名列表、封禁匹配项目代号、封禁匹配国家列表调整为独立三行并横向填满，提升长列表输入空间（src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx）。
- 优化项目管理表格页资源管理：详情抽屉的流量账号、广告账号、用户 App 标签页补充“关联”入口，复用原资源组件新增绑定弹窗（src/pages/project-table/components/ProjectTableDetailDrawer.tsx）。
- 优化项目管理表格页筛选能力：新增 `adStatus`、`packageName`、`developerGmail` 三个筛选项并透传项目列表接口（src/pages/project-table/index.tsx, src/services/project/types.ts, docs/api/project_api.md）。

### Bug 修复

- 修复通用报表列宽拖拽误触排序的问题：拖拽手柄阻止 click 冒泡，并在拖拽后吞掉表头下一次 click，避免调整列宽时触发排序（src/components/report/UniversalReportTable.tsx）。
- 修复用户管理 AID 登录封禁策略表单时区控件布局异常：改为固定宽度行布局，避免输入框被压缩，并将常用时区下拉展示为 `Asia/Shanghai(UTC+8)` 格式且不随当前输入过滤为单项（src/pages/user-manage/components/AidLoginBanRuleFormModal.tsx）。
- 修复项目报表数值展示精度错误：将金额、比例、ROI 与流量相关字段的前端显示从 3 位小数恢复为 2 位小数，并同步修正文档示例（src/pages/report/project/index.tsx, docs/api/project-report-api.md）。
- 修复通用报表新增统计字段时主表列与合计行顺序不一致的问题：为当前激活列补全受控 `order`，并让指标列顺序跟随当前 `metrics` 选中顺序，避免新字段在主表提前插入、在合计行追加到末尾（src/components/report/UniversalReportTable.tsx, docs/components/universal_report.md, docs/issue/report_sorting_issue.md）。
- 修复项目 `adStatus` 编辑提交为数组的问题：将项目基础信息和项目弹窗中的投放状态控件从多值 tags 模式改为单值自动完成，保留 `activate/deactivate` 默认候选和自定义输入能力，同时确保保存请求始终传递字符串（src/pages/project/components/ProjectDetail.tsx, src/pages/project/components/ProjectForm.tsx）。
- 修复项目管理Card详情基础信息 `Descriptions` 最后一行 span 合计不匹配导致的 Ant Design 控制台警告（src/pages/project/components/ProjectDetail.tsx）。
- 修复 Asset 机器创建候选参数空态误导：为 machine-create 各字段补充按账号/区域/可用区分层的依赖禁用、下拉空态和字段级提示，避免在未满足 `region` / `zone` 前提时把未请求 catalog 误显示为“无数据”，并同步强调 image 为 zone-scoped、time zone 为 account-scoped（src/pages/asset/components/machines/useMachineCreateCatalogs.ts, src/pages/asset/components/machines/MachineCreateBasicStep.tsx, src/pages/asset/components/machines/MachineCreateBillingStep.tsx, src/pages/asset/components/machines/MachineCreateNetworkStep.tsx, src/pages/asset/components/machines/MachineCreateAccessStep.tsx, src/pages/asset/components/machines/MachineCreateShared.tsx）。
- 修复 Asset 机器创建区域联动不可选问题：按接口定义将 `region` 视为 Zenlayer `regionId`、`zone` 视为 `zoneId`，在前端按 `raw.regionId` 过滤当前 Region 下的 Zone 候选，并避免 catalog 加载期间把下拉控件硬禁用，确保选择 Region 后可继续选择 Zone，再联动加载 Instance Type 与 Image（src/pages/asset/components/machines/useMachineCreateCatalogs.ts）。
- 修复 Asset 机器创建 Catalog 下拉未写入表单的问题：`MachineCreateCatalogSelect` 透传 Ant Design Form 注入的 `value/onChange` 等 Select 属性，并撤回前端基于 `extra/raw` 的 Zone 过滤逻辑，统一只消费后端 `option_groups[].options[].value`（src/pages/asset/components/machines/MachineCreateShared.tsx, src/pages/asset/components/machines/useMachineCreateCatalogs.ts）。
- 修复 Asset 机器创建分步切换后 Catalog 状态丢失：在向导弹窗中使用 `Form.useWatch(..., { preserve: true })` 监听已卸载步骤字段，避免进入 Billing 后 `account_id/region/zone` 被误判为空并显示“Select provider account first”（src/pages/asset/components/machines/MachineCreateWizardModal.tsx）。
- 修复 Asset 页面控制台警告：将 Notification `btn` 替换为 `actions`，为禁用态操作按钮 Tooltip 补充稳定 key，并避免机器详情 IP 绑定表单挂载前调用 `resetFields()` 导致 useForm 未连接警告（src/pages/asset/components/AssetPageShell.tsx, src/pages/asset/utils.tsx, src/pages/asset/components/panels/MachinesPanel.tsx）。
### 优化功能

- 优化 Asset 机器供应商创建体验：新增 `machine-create-options` 候选参数请求层与解析工具，在供应商创建/重试弹窗中按账号、区域、可用区联动加载 Zone、规格、镜像、密钥、子网和安全组候选项，并保留高级 JSON 兜底未文档化字段，减少用户手动输入（src/services/asset-service/api.ts, src/services/asset-service/typings.d.ts, src/pages/asset/components/machines/, src/pages/asset/components/panels/MachinesPanel.tsx）。

 - 优化 Asset 机器供应商创建参数对齐：Zenlayer 创建表单与重试回填统一改用 `payload.timeZone`、`payload.instanceCount`、`payload.bandwidth` 和 `payload.subnetId`，将 `vpcId` 降级为前端子网筛选与 `metadata.provider_network.vpcId` 记录字段，并在高级 JSON 兜底场景下兼容旧键名后再归一化提交（src/pages/asset/components/machines/MachineFormFields.tsx, src/pages/asset/components/machines/machinePayload.ts, src/pages/asset/components/machines/MachineProviderRetryModal.tsx, src/pages/asset/components/panels/MachinesPanel.tsx）。
- Optimize Asset provider machine create and retry flow: replace the old payload passthrough modal with a 5-step wizard, generic machine-create catalog loading, explicit price quote, and protocol-aligned request mapping (src/pages/asset/components/machines/, src/pages/asset/components/panels/MachinesPanel.tsx, src/services/asset-service/api.ts, src/services/asset-service/typings.d.ts, src/services/dev-admin/request.ts).
## [1.3.1] - 2026-06-08

### 新增功能

- 新增通用报表可选导出能力，支持页面传入 `exportAction` 后展示导出按钮，并在导出前自动应用当前草稿查询条件、维度与排序；项目报表接入 CSV 导出接口，支持按当前筛选全量导出并从响应头解析文件名（src/components/report/UniversalReportTable.tsx, src/pages/report/project/index.tsx, src/services/report/api.ts, docs/components/universal_report.md）。
- 新增 Dev 控制面菜单组，接入 node-service 新版 Agent、节点、配置模板管理页面，并提供运行态查看、节点用户管理与模板绑定入口（config/routes.ts, src/pages/dev/, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts）。
- 新增 node-service 控制面独立请求层与 app 签名认证实现，支持 `/v4/control/*` 本地代理转发、`X-API-ID` / `X-Timestamp` / `X-Nonce` / `X-Body-SHA256` / `X-Signature` 请求头生成，以及基于表单模式与 JSON 模式的三段配置编辑器（src/services/node-control/, config/proxy.ts, src/requestErrorConfig.ts, src/pages/dev/components/JsonConfigEditor.tsx）。
- 新增 node-service 控制面接口文档，补充测试联调用 app 认证方式、签名串规则与创建接口按 HTTP 200 成功处理的约定（docs/api/node_service_control_api.md）。
- 新增 Dev 服务注册页面，复用 app 签名认证调用 `/api/v1/service-register-manager/services`，展示 services、routes 与 service_auth 信息并支持关键字段复制（config/routes.ts, config/proxy.ts, src/pages/dev/Services.tsx, src/services/node-control/）。
- 新增 Dev 节点 Snapshot 预览能力，支持调用 `/api/v1/control/nodes/{node_id}/snapshot` 查看模板合并和运行面映射后的 Agent 最终下发配置（src/pages/dev/Nodes.tsx, src/services/node-control/api.ts, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 新增用户管理封禁 IP 列表弹窗入口，支持按 IP、被封禁用户 ID、操作管理员 ID 查询封禁记录，并支持删除单条封禁 IP 记录（src/pages/user-manage/index.tsx, src/pages/user-manage/components/BlockedIpModal.tsx, src/services/user/, docs/api/user_api.md）。
- 新增 Dev 菜单管理页面与临时管理员 JWT 登录弹窗，支持对接 admin-service 菜单增删改查、当前用户菜单预览和权限码选择，并将 Dev 路由未登录行为与正式登录链路隔离（src/pages/dev/Menus.tsx, src/pages/dev/components/DevAuthGate.tsx, src/services/dev-admin/, docs/api/admin_service_api.md）。

### 优化功能

- 优化 Dev 控制面认证方式：将 `/v4/control/*` 从 app 签名认证切换为 Dev 临时管理员 JWT，并复用 Dev 登录弹窗保护节点与 Agent 页面；服务注册接口继续保留 app 签名认证（src/services/node-control/request.ts, src/pages/dev/Nodes.tsx, src/pages/dev/Agents.tsx, docs/api/node_service_control_api.md）。
- 优化主登录页交互：将 `/user/login` 的运营/管理双模式登录切换为 ProComponents `LoginFormPage` 表单实现，保留原有跳转与登录态隔离逻辑，并同步适配新的登录页局部样式（src/pages/user/Login.tsx, src/pages/user/login.less）。
- 优化主登录页样式策略：移除 `/user/login` 对 `login.less` 的自定义视觉覆盖，改为直接使用 ProComponents `LoginFormPage` 默认外观，仅保留登录模式切换和表单逻辑（src/pages/user/Login.tsx）。
- 优化 Dev 控制面节点与配置模板 JSON 编辑器：按新版 node-service Snapshot 协议生成 `config_json.listen/settings/tls/transport/multiplex`，将 `options_json` 调整为 snake_case limiter 字段，并允许创建时提交空 `config_json`（src/pages/dev/components/JsonConfigEditor.tsx, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 控制面节点创建与编辑：将节点提交 payload 从三段 JSON 调整为完整 Snapshot 顶层结构，新增覆盖全部字段的联动表单与完整 JSON tab，并在迁移期间将配置模板页改为只读以避免旧模板结构误写（src/pages/dev/components/SnapshotConfigEditor.tsx, src/pages/dev/components/NodeFormModal.tsx, src/pages/dev/ConfigTemplates.tsx, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 控制面节点 Snapshot 协议字段：按最新约定调整各协议 `settings` 表单字段，移除 vless/vmess 的 `encryption`，拆分 hysteria 与 hysteria2 字段，并裁剪 Reality 配置为 `private_key`、`short_id`、`dest`、`server_port`、`max_time_diff`（src/pages/dev/components/SnapshotConfigEditor.tsx, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 控制面节点 Snapshot 表单：将 shadowsocks `cipher` 改为固定方法下拉选择，并按协议约束 transport 可选类型，补充 vless/vmess 的 tcp 旧式 HTTP header、ws、grpc 与 httpupgrade 结构化配置（src/pages/dev/components/SnapshotConfigEditor.tsx, docs/api/node_service_control_api.md）。
- 优化 Dev 控制面节点 Snapshot 与用户管理：将 `id/tag` 调整为创建非必填，新增同级 `client` 配置，并限制只有 vless 暴露 Reality 与 Transport；同时新增节点独立用户管理弹窗与批量新增、批量更新、批量删除接口联动（src/pages/dev/components/SnapshotConfigEditor.tsx, src/pages/dev/components/NodeUsersManageModal.tsx, src/pages/dev/Nodes.tsx, src/services/node-control/api.ts, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 控制面节点用户列表操作：新增单用户“Get Config”连接获取能力，接入 `/api/v1/control/nodes/{node_id}/users/{user_id}/client-config` 展示分享 URI 与客户端连接信息，并同时覆盖节点详情用户表与批量用户管理弹窗（src/pages/dev/Nodes.tsx, src/pages/dev/components/NodeUsersManageModal.tsx, src/pages/dev/components/NodeUserClientConfigModal.tsx, src/services/node-control/api.ts, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 节点 Reality 配置表单：新增 `tls.reality.client_fingerprint` 下拉选择并接入 Snapshot 提交与文档说明，覆盖 chrome、firefox、safari、ios、android、edge、360、qq、random 等指纹选项（src/pages/dev/components/SnapshotConfigEditor.tsx, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 节点 TLS 证书配置：新增 `tls.cert.key_type` 下拉并接入证书分支提交，支持 ec256、ec384 与多档 RSA 私钥类型选择，保持仅作用于 ACME 证书私钥（src/pages/dev/components/SnapshotConfigEditor.tsx, src/services/node-control/typings.d.ts, docs/api/node_service_control_api.md）。
- 优化 Dev 节点 Snapshot 字段单位说明：在表单提示和接口文档中明确 `up_mbps/down_mbps` 使用 Mbps、`speed_limit` 使用 B/s、`ip_online_min_traffic/report_min_traffic` 使用 KiB，避免配置输入时产生单位歧义（src/pages/dev/components/SnapshotConfigEditor.tsx, docs/api/node_service_control_api.md）。
- 优化 Dev 节点单位输入体验：新增模块内 `UnitNumberInput`，支持限速按 B/s、KiB/s、MiB/s、GiB/s 输入并换算为 B/s 提交，支持流量阈值按 KiB、MiB、GiB 输入并换算为 KiB 提交，同时接入节点默认限速、节点阈值和节点用户限速配置（src/pages/dev/components/UnitNumberInput.tsx, src/pages/dev/components/SnapshotConfigEditor.tsx, src/pages/dev/components/NodeUserModal.tsx, src/pages/dev/components/NodeUsersManageModal.tsx, src/pages/dev/Nodes.tsx, docs/api/node_service_control_api.md）。
- 优化登录页与 Dev 菜单隔离：在 `/user/login` 增加 `运营` / `管理` 模式切换，管理模式使用 Dev admin JWT 登录后进入 `/dev/nodes`，并通过 `loginMode` 让布局只显示 Dev 菜单、运营模式隐藏 Dev 菜单（src/pages/user/Login.tsx, src/app.tsx, src/components/RightContent/AvatarDropdown.tsx, src/pages/dev/components/DevAuthGate.tsx）。
- 优化用户管理面板查询条件：新增“仅封禁用户”开关与注册时间范围筛选，并将 `onlyBanned`、`createdAtFrom`、`createdAtTo` 参数接入用户列表请求层，同时补充用户接口文档说明（src/pages/user-manage/index.tsx, src/services/user/typings.d.ts, docs/api/user_api.md）。

### Bug 修复

- 修复通用报表统计行在固定指标列到首列时合计值丢失的问题：统计行列布局按固定左列、普通列、固定右列同步排序，并将合计文案优先放到可见维度列，避免覆盖 ROI 等指标列的合计值（src/components/report/UniversalReportTable.tsx, docs/components/universal_report.md, docs/issue/report_sorting_issue.md）。
- 修复登录页样式污染全局 Ant Design 组件的问题：将 `src/pages/user/login.less` 中按钮、输入框、表单项的 `:global` 样式收敛到登录页容器作用域内，避免非登录页面的输入框和按钮被一并改样式（src/pages/user/login.less, docs/issue/global.md）。
- 修复 Dev 控制面节点与模板弹窗提交 JSON 时可能读取旧状态的问题：`JsonConfigEditor.commit()` 返回最终编辑值，父弹窗直接使用返回值组装 payload，避免最后一次表单或 JSON 编辑丢失（src/pages/dev/components/JsonConfigEditor.tsx, src/pages/dev/components/NodeFormModal.tsx, src/pages/dev/components/TemplateFormModal.tsx, docs/issue/global.md）。
- 修复 Dev 控制面响应三段 JSON 回显异常：在 node-control 请求层统一将响应中的 `config_json`、`rules_json`、`options_json` base64 字符串解码为 JSON 对象，确保节点详情、模板详情和绑定模板填充使用可编辑结构（src/services/node-control/request.ts, docs/api/node_service_control_api.md）。

- 修复 Dev 节点用户管理弹窗中用户 `speed_limit` 只能查看不能编辑的问题：将隐藏的单位输入列恢复为可编辑列，并区分节点默认限速与用户限速文案；同时修正单位下拉切换时不应改变后端基础值的逻辑（src/pages/dev/components/NodeUsersManageModal.tsx, src/pages/dev/components/NodeUserModal.tsx, src/pages/dev/components/UnitNumberInput.tsx, src/pages/dev/Nodes.tsx）。

- 移除 Dev 控制面中过时的配置模板能力：删除 `/dev/config-templates` 路由与菜单、ConfigTemplates 页面、旧三段 JSON 模板弹窗和 node-control 模板接口/类型，同时清理节点列表和详情中的模板字段展示（config/routes.ts, src/locales/*/menu.ts, src/pages/dev/, src/services/node-control/, docs/api/node_service_control_api.md）。

- 优化 Dev 限速单位输入：为节点默认限速和节点用户限速的 `UnitNumberInput` 增加 Mbps 选项，并按 `1 Mbps = 125000 B/s` 换算后提交后端基础值（src/pages/dev/components/UnitNumberInput.tsx, docs/api/node_service_control_api.md）。

## [1.3.0] - 2026-06-05

### 新增功能

### 优化功能

- 优化通用报表视图更新交互：在选中视图后增加“视图变更，未保存”提示，并将 `更新` 按钮扩展为覆盖保存当前视图后同步应用未生效的查询条件/维度，避免视图与当前草稿状态脱节（src/components/report/UniversalReportTable.tsx, src/components/report/ViewManager.tsx, docs/components/universal_report.md, docs/issue/report_sorting_issue.md）。
- 优化通用报表视图操作区展示：在 `更新` 按钮右侧补充当前排序字段与升降序描述，并调整提示布局使排序描述与“视图变更，未保存”始终保持同一行展示，降低视觉突兀感（src/components/report/UniversalReportTable.tsx, src/components/report/ViewManager.tsx, docs/components/universal_report.md）。

### Bug 修复

- 修复通用报表服务端排序图标高亮异常：统一动态列排序标识与受控 `sortOrder` 回填逻辑，确保点击排序和恢复已保存视图排序时，表头高亮与请求参数保持一致（src/components/report/UniversalReportTable.tsx, src/components/report/ViewManager.tsx, docs/components/universal_report.md, docs/issue/report_sorting_issue.md）。
- 修复通用报表统计行列顺序错位：统一 `ProTable` 列顺序与“当前页合计 / 总数据合计”统计行的列布局来源，确保列拖拽、隐藏/显示和恢复视图后统计行同步跟随当前展示顺序（src/components/report/UniversalReportTable.tsx, docs/components/universal_report.md, docs/issue/report_sorting_issue.md）。

## [1.2.4] - 2026-05-12

### 新增功能

- 新增业务管理菜单组，将用户管理、套餐管理、订单管理、工单管理归入该组（config/routes.ts, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts）
- 将邀请礼品卡菜单移至业务管理组，合并规则管理和发放日志，规则列表增加卡片发放记录板块，点击数量可查看发放日志（src/pages/invite-gift-card/, config/routes.ts, src/locales/zh-CN/menu.ts, src/locales/en-US/menu.ts）
- 新增 Firebase 数据分析模块，包含 Dashboard、App 打开分析、VPN 连接分析、节点测速分析、API 错误分析、事件明细查询等 6 个页面（config/routes.ts, src/pages/firebase-analytics/）
- 实现 Firebase Analytics 通用筛选组件 FilterBar，支持时间范围、多维参数筛选及快键键（src/components/FirebaseAnalytics/FilterBar.tsx）
- 实现 Firebase Analytics KPI 卡片组件，支持昨日对比趋势显示（src/components/FirebaseAnalytics/KpiCard.tsx）
- 实现 Firebase Analytics 趋势图组件，集成 Ant Design Charts 折线图（src/components/FirebaseAnalytics/TrendChart.tsx）
- 实现 Firebase Analytics 基础服务封装，对接后端 v3 接口（src/services/firebase-analytics/api.ts）
- 实现 Dashboard 总览页面，展示 KPI 数据、事件趋势及 VPN 质量趋势（src/pages/firebase-analytics/Dashboard.tsx）
- 补全 Dashboard 页面缺失模块：地区质量分布 (RegionQualityPanel)、错误 Top 排行 (ErrorTopPanel) 和节点质量排行 (NodeQualityTable) （src/components/FirebaseAnalytics/, src/pages/firebase-analytics/Dashboard.tsx）
- 全新项目管理页面（左右分栏布局），左侧项目卡片列表支持分页/搜索/状态筛选，右侧展示项目基础信息内联编辑、资源统计卡片切换管理（流量账号/广告账号/用户App）、日聚合工具（同步/异步触发）（src/pages/project/, config/routes.ts, src/services/project/）

### 优化功能
- 优化 Dashboard 页面布局，将图表和组件改为左右两列瀑布流排列（事件趋势、VPN连接质量、地区质量分布、错误Top排行），并为长列表单独占满整行（src/pages/firebase-analytics/Dashboard.tsx）
- 地区质量分布 (RegionQualityPanel) 引入 `echarts` 和 `echarts-for-react`，动态加载 GeoJSON 实现了可交互的事件热力地图渲染（src/components/FirebaseAnalytics/RegionQualityPanel.tsx）
- 优化 ErrorTopPanel 及 RegionQualityPanel 内部结构，由于缩减为半宽卡片，将其内部排列从左右改为上下堆叠以避免挤压（src/components/FirebaseAnalytics/）
- 新增前端通用工具类 utils，包含数值、流量、时长、成功率等格式化方法（src/utils/firebase-analytics.ts）
- 更改侧边菜单及页面名称层级：将 `Firebase 数据分析` 改为 `Firebase`，`总览 Dashboard` 改为 `Dashboard`，同时将其余 5 个详细分析子菜单进行 `hideInMenu: true` 隐藏处理（config/routes.ts, src/locales/zh-CN/menu.ts, src/pages/firebase-analytics/Dashboard.tsx）
- 重写项目管理服务层 API，基于新接口文档规范重构项目 CRUD、资源关联和日聚合接口（src/services/project/）
- 广告账号关联表单优化：通过 `/v3/ad-accounts` 选取账号、`/v3/ad-revenue/apps` 选取 App，自动填充平台代码和绑定类型（src/pages/project/components/ResourceTabs/AdAccounts.tsx）
- 流量账号关联表单优化：通过 `/v3/traffic-platform/accounts` 选取账号，自动填充平台代码，隐藏外部UID/用户名、绑定类型默认 account（src/pages/project/components/ResourceTabs/TrafficAccounts.tsx）
- 项目资源卡片"新增"改为"关联"并移至统计卡片右上角，点击卡片自动切换并刷新对应资源列表（src/pages/project/components/ProjectDetail.tsx）

### Bug 修复

- 对齐流量平台日流量汇总、月流量汇总和小时流量字段命名：将前端类型声明、表格列和接口文档从 `statDate/statMonth/statHour` 更新为 `reportDate/reportMonth/reportHour`，并保留旧字段兼容兜底（src/pages/traffic-platform/dashboard/components/UsageDataTabs.tsx, src/services/traffic-platform/typings.d.ts, docs/api/traffic_platform_api.md, docs/api/traffic_platform_platforms_api.md, docs/issue/global.md）。
- 修复 `FilterBar` 组件 ProForm 使用 `initialValues` 的警告，改为 `request` 异步加载默认值（src/components/FirebaseAnalytics/FilterBar.tsx）
- 修复 `RegionQualityPanel` 地图组件中使用废弃 API `mapType` 的警告，替换为 `map`（src/components/FirebaseAnalytics/RegionQualityPanel.tsx）
- 修复各个图表、表格组件中使用 Antd Card 废弃属性 `bordered` 和 `bodyStyle` 的警告，替换为 `variant="borderless"` 和 `styles={{ body: ... }}`（src/components/FirebaseAnalytics/*.tsx）
- 修正 API 数据结构和字段映射，以对齐实际后端接口契约（docs/api/firebase_analytics.md）：更新 Types、Dashboard 解析逻辑及底层数据组件对应 key（src/services/firebase-analytics/types.ts, src/services/firebase-analytics/api.ts, src/components/FirebaseAnalytics/*）
- 按照 `代理流量弹出框.md` 规范重构所有列表及表单页面容器：将「平台管理」、「账号管理」、「同步任务」由之前的右侧抽屉或内嵌标签页（Drawer/Tabs），全部重构为了基于 `Modal` 的居中弹窗展示，并统一样式、交互行为以及 API 数据联动（新增 `PlatformManageModal.tsx`、`AccountManageModal.tsx`、`SyncTaskModal.tsx`）。
- 修复因 `res.data.list` 与 `res.data.data` 解析字段不兼容导致的账号和日流量/月流量统计总数为 0 异常的问题，更新底层 `getPageInfo` 提取逻辑以兼容不规则层级数据。
- 修复右上角查询过滤组件区域在响应式排列时的右侧按钮组（查询、重置）悬浮问题：重设容器 Flex 布局让重置与查询紧贴右侧对齐。
- 修复 Firebase 分析页时间筛选器问题：剥离请求中无用的 `timeRange[]` 前端参数，并将时间格式从 `toISOString()` 统一修正为接口要求的 `YYYY-MM-DD HH:mm:ss`，同时修复 URL 时间参数无法回显的缺陷（src/pages/firebase-analytics/Dashboard.tsx）
- 修复 Dashboard 饼图 `Undefined variable: percentage` 错误：G2 label 模板 `{percentage}` 解析失败，替换为函数计算百分比并格式化（src/components/FirebaseAnalytics/ErrorTopPanel.tsx）
- 修复节点质量排行 table rowKey 潜在冲突：原 `rowKey="node_id"` 在相同节点对应多条记录时可能重复，改为 `node_id + rank` 复合 key（src/components/FirebaseAnalytics/NodeQualityTable.tsx）
- 修复 React key 重复警告：`record.match` 中 hostname 直接用作 key 时因重复值导致报错，统一加上数组索引前缀确保唯一性（src/pages/server/index.tsx, src/pages/dns/index.tsx, src/pages/server/components/OnlineUsersModal.tsx）
- 在 Dashboard 刷新按钮旁增加实时数据展示：使用专用接口 GET /events/recent 轮询 Redis 实时事件队列总数，每 15 秒自动刷新；点击可弹出 Drawer，内嵌 RealtimeLogWindow 组件展示最近接收事件明细日志（src/pages/firebase-analytics/Dashboard.tsx, src/services/firebase-analytics/api.ts）
- 修复 ProTable request 返回结构解析错误导致的 `rawData.some is not a function` 崩溃（src/pages/project/components/ResourceTabs/）
- 修复 ModalForm 内 React Fragment 子元素接收 autoFocus 属性导致的控制台警告（src/pages/project/components/ResourceTabs/）
- 修复各组件中 message 静态方法无法读取动态主题的警告，统一改用 App.useApp()（src/pages/project/components/）
- 完善同步节点管理功能：在节点列表操作栏补充“测试”和“同步”功能按钮，支持调用测试接口及按日期范围下发同步指令（src/pages/ad/ad-revenue/components/SyncServersModal.tsx）
- 新增公共的时间格式化方法 `formatUTC8`，修复项目管理页面时间显示问题，将后端 UTC 时间统一转换为东八区显示（src/utils/format.ts, src/pages/project/）
## [1.2.5] - 2026-05-19

### 新增功能

- 新增全局“自动化策略配置”入口与通用弹窗控制台，支持模块切换、规则卡片列表、动态作用范围/条件/动作配置、执行记录查看及试运行（src/components/AutomationRulesEntry.tsx, src/services/automation-rules/）

### 优化功能

- 优化域名管理交互约束：解绑弹窗与元信息弹窗中的 FQDN、IPv4、域名改为只读文本展示，移除可编辑输入字段，避免误操作修改关键标识；同时补充详情抽屉绑定列表“编辑”快捷入口（src/pages/dns/index.tsx, src/pages/dns/components/DomainDetailDrawer.tsx）。
- 优化域名概览卡片布局：统一三张统计卡片高度与拉伸行为，修复域名池卡片高度与其它卡片不一致问题（src/pages/dns/components/DomainOverviewCards.tsx, src/pages/dns/index.less）。
- 优化 DNS 账号列表操作：新增“同步”按钮，按账号调用 `/v3/dns/domains/sync`（携带 `providerAccountId`）触发域名同步，并在成功后刷新域名与账号列表（src/pages/dns/index.tsx, src/services/dns-tool/api.ts）。
- 重构域名管理控制台页面：按最新设计文档实现双视图列表、右侧详情面板、执行解析/解绑风险弹窗、配置管理（Provider 与 Provider 账号）及 V3 DNS 接口对接（src/pages/dns/index.tsx, src/pages/dns/index.less, src/services/dns-tool/）。
- 优化域名管理页面交互：移除顶部搜索与操作行、取消域名/IP 绑定 Tab，改为概览卡片驱动的单表格视图切换（域名/活跃绑定/缺失域名/Provider/Provider账号），并在未选中记录时隐藏右侧详情面板以动态扩展表格宽度（src/pages/dns/index.tsx, src/pages/dns/index.less）。
- 优化域名管理表格布局稳定性：按视口动态设置主表容器最小高度并反推 scroll.y，加载态与空数据态保持固定占位，避免切换/加载时表格先缩短再拉伸，底部区域可持续填充（src/pages/dns/index.tsx, src/pages/dns/index.less）。

### Bug 修复

- 修复 Dashboard 包名筛选来源不正确：将下拉选项由前端固定值改为 `/v3/enum/app-ids` 动态枚举（`appId`）并接入新的枚举服务封装（src/pages/dashboard/index.tsx, src/services/enum/api.ts, src/services/enum/typings.d.ts）。
- 修复流量平台 Dashboard 趋势图 Tooltip 字段映射错误，改为明确展示日期与流量值，并补充 trafficMb/trafficGb/trafficBytes 数值解析兜底（src/pages/traffic-platform/dashboard/components/TrafficTrendChart.tsx）
- 修复流量平台 Dashboard 在 React 19 下 useRef 泛型未传初始值导致的 TS2554 编译错误，并统一兼容流量趋势/排行接口数组直返与包装对象两种响应结构（src/pages/traffic-platform/dashboard/components/）
- 修复域名管理卡片切换时列表高度突变：为各模式主表统一设置自适应固定滚动高度（scroll.y），避免因数据量差异造成表格容器收缩/拉伸抖动（src/pages/dns/index.tsx）。
- 修复域名管理页面双请求与首屏高度抖动：移除首屏对主表的手动 reload、移除卡片切换时的冗余 reload，仅在同卡片重复点击时主动刷新；并将表格滚动高度初始值直接按窗口高度计算，避免首次渲染二次跳变（src/pages/dns/index.tsx）。
- 调整域名管理主表高度计算策略：由固定视口估算改为基于主表卡片在当前视口中的实际 top 位置动态计算可用剩余高度，并预留页脚/底部间距，避免表格过高导致页面整体滚动（src/pages/dns/index.tsx）。
- 调整域名管理主表高度策略：移除页脚与底部间距预留，改为仅按主表卡片到视口底部的剩余高度计算容器高度与 scroll.y（src/pages/dns/index.tsx）。
- 回退域名管理列表高度策略到抖动修复版本：移除剩余空间自适应与主表容器最小高度占位，仅保留 scroll.y 随窗口变化的固定高度方案（src/pages/dns/index.tsx, src/pages/dns/index.less）。

## [1.2.6] - 2026-05-22

### 优化功能

- 优化 Dashboard 顶部卡片布局：将“今日收益/本月收益”与“在线节点/在线用户”统一为同一行四卡片，收敛指标字号并补充次级信息（流水、支出）以提升信息密度（src/pages/dashboard/components/StatsOverviewCards.tsx）。
- 优化节点管理字段对齐：按后端最新约定将 `rate_limit` 统一按 `Mbps` 直接展示与编辑（不再做字节单位换算）；节点列表显示为 `xx Mbps`，节点新增/编辑表单标签与提示同步为 Mbps，并补充 `rate_limit`、`device_limit` 字段以适配后端接口新增参数（src/pages/server/index.tsx, src/pages/server/components/NodeFormModal.tsx, src/services/server/typings.d.ts）。
- 通用报表视图保存一致性：视图增加保存并恢复列排序状态（升序/降序/取消），同时为用户上报报表增加 `dateRangePreset` 持久化，确保“今日/近三天/近一周/近一月”按相对时间语义恢复，手动日期范围保持 `custom`（src/components/report/UniversalReportTable.tsx, src/pages/report/user-report-admin/tabs/BaseUserReportTab.tsx）。

### Bug 修复

- 修复 Dashboard 收益数据显示为 0：兼容项目报表接口多层返回结构（`res.data` / `res.data.data` / `res.data.data.data`），避免因取值路径不一致导致统计行丢失（src/pages/dashboard/index.tsx）。
- 修复 Dashboard 收益字段解析：按字符串金额字段 `adRevenue`、`totalCost` 做数值转换并参与汇总，确保收入（流水-支出）计算正确（src/pages/dashboard/index.tsx, src/pages/dashboard/components/StatsOverviewCards.tsx）。
- 补充 Dashboard 收益链路调试日志：分别记录 today/month 请求入参、失败兜底分支、成功聚合结果，以及 render 层最终使用值，便于定位“接口有数据但页面显示为 0”的状态时序问题（src/pages/dashboard/index.tsx）。
- 调整 Dashboard 收益报表筛选字段：移除 `filters.appIds`，改为先由包名映射 `projectCode` 集合，再使用 `filters.projectCodes` 查询今日/本月收益（src/pages/dashboard/index.tsx）。
- 清理 Dashboard 收益排查临时日志：移除 request/render 调试输出与关联辅助状态，保留正式收益计算与筛选逻辑（src/pages/dashboard/index.tsx）。
- 代理流量接口api调整
- 修复节点保存参数默认值：`device_limit` 在前端空值场景下由 `null` 调整为 `0` 传递，满足后端默认值约定（src/pages/server/components/NodeFormModal.tsx）。

## [1.2.7] - 2026-05-30

### 新增功能

- 在 Firebase Dashboard 顶部刷新按钮旁新增“同步”操作，点击后弹窗选择日期范围并调用 `POST /v3/firebase-analytics/report/sync` 触发聚合重算（src/pages/firebase-analytics/Dashboard.tsx, src/services/firebase-analytics/api.ts）。

### 优化功能

- 补充 Firebase API 文档：新增“日期范围同步”接口说明，明确请求参数 `dateFrom/dateTo` 与返回字段（docs/api/firebase_analytics.md）。
- 优化自动化策略配置模块能力：新增 `project_aggregate` 模块（项目范围 `projectCodes`、指标集合、动作 `webhook` 扩展字段），并在规则表单中支持 Webhook 地址、请求头 JSON、超时和签名配置提交（src/components/AutomationRulesEntry.tsx, src/services/automation-rules/typings.d.ts, docs/components/automation-rules-entry.md）。

### Bug 修复

## [1.2.8] - 2026-06-03

### 新增功能

- 新增全局系统配置入口与 WooCommerce 订单映射配置面板，支持在顶部自动化按钮旁打开双栏设置弹窗，维护 WooCommerce Product ID 到本地套餐和周期的全量映射配置（src/components/SystemConfigEntry.tsx, src/services/woocommerce-order-mapping/, docs/api/woocommerce_order_mapping_api.md, docs/components/system-config-entry.md）。
- 新增业务管理下的回执订单子菜单，支持按第三方来源、状态、外部订单号、用户、本地订单和交易流水查询回执记录，并在详情抽屉中查看本地订单转换结果与原始回调 payload（config/routes.ts, src/pages/external-order-receipt/, src/services/external-order-receipt/）。
- 替换系统品牌图标为本地产品图标，统一 ProLayout logo 与浏览器 favicon 引用（public/logo.svg, config/defaultSettings.ts, config/config.ts）。

### 优化功能

- 优化全局系统配置入口与弹窗交互：顶部入口改为纯图标按钮并增加 Tooltip，左侧配置项增加本地模糊搜索，同时移除弹窗 header 内额外关闭按钮以保留右上角默认关闭入口（src/components/SystemConfigEntry.tsx, docs/components/system-config-entry.md）。

## [1.2.9] - 2026-06-04

### 新增功能

- 新增系统管理下的任务队列监控页面，集中展示调度器 / Horizon 健康状态、队列等待快照、workload、master supervisor、全局失败任务以及 `send_webhook` 专项诊断信息，支持自动刷新与分页排查（config/routes.ts, src/pages/system/queue-monitor/, src/services/system/）。

### 优化功能

- 优化系统队列接口兼容性：补充 `getSendWebhookTasks` 接口封装与类型定义，并对 `wait`、`workload`、`masters` 等不稳定返回结构做宽松解析，避免单组监控数据异常导致整页不可用（src/services/system/api.ts, src/services/system/typings.d.ts, src/pages/system/queue-monitor/index.tsx, docs/issue/global.md）。
- 优化自动化策略配置模块能力：新增 `project_ad_revenue_hourly` 模块，支持按项目范围与上一完整小时广告收入指标配置告警规则，并对手动执行 `targetIds=projectCodes`、`includeDisabled` 范围过滤和远程项目搜索做兼容（src/components/AutomationRulesEntry.tsx, docs/components/automation-rules-entry.md, docs/issue/global.md）。
- 优化自动化策略配置 `project_ad_revenue_hourly` 模块：按最新接口文档移除 `project_code/project_name/report_hour/has_data` 条件指标，并将数值指标操作符扩展为 `eq/neq/gt/gte/lt/lte/in/not_in/between`（src/components/AutomationRulesEntry.tsx, docs/components/automation-rules-entry.md, docs/issue/global.md）。
- 优化项目汇总报表总计行展示：接入 `/api/v3/admin/report/project/query` 返回的 `summary` 字段作为“总数据合计”行数据，支持按当前筛选条件展示统计字段总计（src/pages/report/project/index.tsx, src/components/report/UniversalReportTable.tsx, src/services/report/typings.d.ts, docs/api/project-report-api.md, docs/components/universal_report.md, docs/issue/global.md）。

### Bug 修复

- 对齐流量平台日流量汇总、月流量汇总和小时流量字段命名：将前端类型声明、表格列和接口文档从 `statDate/statMonth/statHour` 更新为 `reportDate/reportMonth/reportHour`，并保留旧字段兼容兜底（src/pages/traffic-platform/dashboard/components/UsageDataTabs.tsx, src/services/traffic-platform/typings.d.ts, docs/api/traffic_platform_api.md, docs/api/traffic_platform_platforms_api.md, docs/issue/global.md）。


