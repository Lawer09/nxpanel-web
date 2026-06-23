# 通用报表列宽保存问题

## 出现场景

通用报表需要支持用户手动调整列宽，并且列宽需要随保存视图一起恢复。

## 问题原因

`UniversalReportTable` 的列显示、固定、排序和视图保存已经集中使用 `columnsStateMap`。如果列宽单独保存到另一份状态，视图保存、视图变更检测和本地缓存会出现状态分叉。

## 解决方式

将列宽作为 `columnsStateMap.width` 保存，并在表头拖拽时更新同一份列状态。视图保存和恢复继续复用原有 `columnsStateMap` 链路。

## 影响范围

所有使用 `UniversalReportTable` 的报表页。

## 相关文件

- `src/components/report/UniversalReportTable.tsx`
- `docs/components/universal_report_column_width.md`
