# Firebase 节点状态摘要

## 组件名称

`NodeStatusSummary`

## 组件用途

在 Firebase Dashboard 中提供轻量的节点状态总览，只展示异常节点数量、重点异常节点预览和跳转入口。

该组件不承担完整节点排查职责，目的是把 Dashboard 保持为总览页，同时把节点问题引导到独立的 `节点状态` 菜单继续筛查。

## 使用场景

- Dashboard 需要保留节点质量信号，但不希望继续塞入完整节点诊断表
- 需要在当前 Firebase 全局筛选条件下快速看到异常节点规模
- 需要从摘要区跳转到节点状态页，并保留当前筛选上下文

## Props 说明

| Props | 类型 | 说明 |
|---|---|---|
| `filters` | `FirebaseAnalyticsFilter` | 当前 Firebase 查询参数，会透传给节点状态列表接口 |
| `viewHref` | `string` | 点击“查看节点状态”或“去排查”时跳转的目标地址，通常带当前筛选参数 |

## 数据来源

- `/v3/firebase-analytics/nodes/status`
  - 读取服务端合并后的节点状态列表
  - 摘要区会按不同 `diagnosis_status` 统计异常节点数量

## 展示内容

- 异常节点总数
- 探测正常但连接偏差数量
- 仅探测未连接数量
- 高风险节点数量
- 异常节点预览列表

## 示例代码

```tsx
<NodeStatusSummary
  filters={apiParams}
  viewHref={buildFirebasePathSearch('/firebase-analytics/node-status', filters)}
/>
```

## 注意事项

- 该组件依赖后端 `/nodes/status` 返回统一诊断口径，前端不再拼接两套分页接口自行计算状态。
- 预览列表只展示少量异常节点，完整筛查应进入 `节点状态` 页面。
- `viewHref` 应尽量保留当前筛选参数，避免用户从 Dashboard 跳转后丢失上下文。

## 已知限制

- 如果后端节点状态接口尚未部署，摘要区会回退为空列表和 0 计数。
- 当前高风险数量按 `dual_risk + session_risk + probe_risk` 汇总，不额外展示更细粒度的风险拆分。
