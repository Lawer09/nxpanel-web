# AutomationRulesEntry

## 组件名称

`AutomationRulesEntry`

## 组件用途

在全局顶部操作区提供“自动化策略”入口按钮，并以内置弹窗形式打开通用自动化规则控制台。

## 使用场景

- 需要跨业务模块统一配置自动化规则时。
- 需要在同一套 UI 中切换不同 module（如 `traffic_platform`、`project_aggregate`、`project_ad_revenue_hourly`）进行规则管理时。

## Props 说明

当前无外部 Props。  
组件内部维护打开状态，并直接调用 `automation-rules` 通用接口。

## 示例代码

```tsx
import { AutomationRulesEntry } from '@/components';

actionsRender: () => [
  <AutomationRulesEntry key="AutomationRulesEntry" />,
  <SelectLang key="SelectLang" />,
];
```

## 注意事项

- 所有请求都依赖当前登录态下的 `secure_path` 与 token 拦截器，不能脱离项目请求封装单独使用。
- 模块切换后会重置当前选中规则，并按新模块重新查询规则与执行记录。
- 表单提交会进行通用校验：必填字段、条件/动作数量、条件值结构等。
- `project_aggregate` 模块下 `targetType` 固定为 `project_daily_aggregate`，作用范围使用 `projectCodes`。
- `project_aggregate` 的 `actions.type=webhook` 支持扩展字段：`webhookUrl`、`headers`、`timeoutSeconds`、`signing`（启用开关、密钥、请求头名）。
- `project_ad_revenue_hourly` 模块下 `targetType` 固定为 `project_ad_revenue_hourly`，作用范围使用 `projectCodes`，并支持 `includeDisabled` 控制是否包含已禁用的项目广告账号映射。
- `project_ad_revenue_hourly` 的手动运行 `targetIds` 对应 `project_code`，可用于上一完整小时广告收入缺数或异常指标排查。

## 已知限制

- Webhook 的 `headers` 在前端以 JSON 文本输入，需保证 JSON 格式正确。
