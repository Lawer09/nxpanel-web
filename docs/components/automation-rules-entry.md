# AutomationRulesEntry

## 组件名称

`AutomationRulesEntry`

## 组件用途

在全局顶部操作区提供“自动化策略”入口按钮，并以内置弹窗形式打开通用自动化规则控制台。

## 使用场景

- 需要跨业务模块统一配置自动化规则时。
- 需要在同一套 UI 中切换不同 module（如 `traffic_platform`、`node_status`、`sync_monitor`）进行规则管理时。

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

## 已知限制

- `node_status`、`sync_monitor` 目前按可扩展配置预留，部分作用范围选项为占位数据。
- “触发历史/变更记录” Tab 为占位区域，后续可在接口就绪后接入。
