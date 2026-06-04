# SystemConfigEntry

## 组件名称

`SystemConfigEntry`

## 组件用途

在全局顶部操作区提供“系统配置”图标入口，并以内置弹窗形式打开系统级配置面板。

## 使用场景

- 需要在后台全局入口集中维护系统配置时。
- 需要按 IDE 设置面板风格，在左侧搜索和切换配置项、右侧编辑配置详情时。
- 当前用于维护 WooCommerce 商品到本地套餐和周期的订单映射。

## Props 说明

当前无外部 Props。

组件内部维护弹窗打开状态、配置项搜索关键词、当前配置项、订单映射表单数据，并直接调用 `woocommerce-order-mapping` 接口。

## 示例代码

```tsx
import { SystemConfigEntry } from '@/components';

actionsRender: () => [
  <AutomationRulesEntry key="AutomationRulesEntry" />,
  <SystemConfigEntry key="SystemConfigEntry" />,
];
```

## 注意事项

- 顶部入口仅显示设置图标，hover 时通过 Tooltip 显示“系统配置”。
- 弹窗通过右上角默认叉按钮关闭，header 内不再提供额外关闭按钮。
- 左侧配置项支持按标题、描述和 key 进行本地模糊搜索。
- 请求路径使用 `/v3/woocommerce-order-mapping/*`，由项目 request 拦截器自动补齐 `/api/v3/{secure_path}`。
- 订单映射保存为全量覆盖语义，提交的 `mappings` 数组会成为完整配置。
- `plan_name` 仅用于接口回显展示，不参与保存提交。
- 套餐下拉复用现有 `fetchPlans()` 数据，套餐加载失败时禁止保存，避免误提交错误套餐 ID。
- 保存前会在前端校验重复 `product_id`，后端仍会进行最终校验。

## 已知限制

- 当前仅包含“订单映射配置”一个配置项。
- 周期选项以接口返回的 `periods` 为准，中文标签只用于展示。
