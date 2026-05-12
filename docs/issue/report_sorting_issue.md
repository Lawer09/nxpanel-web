# User Report 排序问题复盘

## 背景

- 模块：`用户上报报表`（基于 `UniversalReportTable`）
- 场景：动态维度/指标列 + 服务端排序（`orderBy` / `orderDirection`）

## 问题现象

- 点击列后，请求参数正确（例如 `orderBy: hour, orderDirection: asc`）
- 但表头排序图标不变色，视觉上仍像“未排序”
- 再次点击同一列时，常出现仍为 `asc`，看起来像“不能继续切换”

## 最终根因

- **列 `key` 与 sorter 标识不一致**。
- Ant Table 在排序时返回的 `sorter.field/columnKey` 更接近列的 `dataIndex`（这里是 `sortField`），而动态列曾使用了另一套 key（如内部 fallback key）。
- 由于匹配不到“当前排序列”，`sortOrder` 无法回填到正确列，导致：
  - 图标状态不更新
  - 下一次点击的排序状态判断异常

## 关键修复

- 在动态列构建时，将列 key 与排序字段对齐：

```ts
const sortField = getColumnSortField(originalColumn, fallbackKey);
const key = sortField || `${fallbackKey}-${index}`;
```

- 继续按当前 sorter 回填列 `sortOrder`，并通过 `field/columnKey` 匹配当前列。
- 统一由 `ProTable.onChange` 同步分页与排序状态。
- 排序调试日志仅用于排查，现已移除。

## 下次同类问题先回顾

在再次遇到“排序参数对了但 UI 不对”这类问题时，先按下面顺序检查组件理解与实现：

1. 先看 Ant Table 机制

- `sorter.field/columnKey` 是如何生成的（通常与 `dataIndex` 强相关）
- 是否处于受控排序（`sortOrder`）模式，受控值是否只回填到当前列

2. 再看动态列身份

- 列 `key` 是否稳定
- 列 `key` 与 `dataIndex`、`sorter.field/columnKey` 是否可一一映射

3. 最后看业务映射

- 前端字段（camel）到后端排序字段（snake）的映射是否正确
- `orderDirection` 是否与 `ascend/descend` 正确转换

建议：先校验组件层，再校验接口层，避免把组件状态问题误判为后端问题。
