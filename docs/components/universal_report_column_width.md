# UniversalReportTable 列宽调整补充说明

## 功能说明

`UniversalReportTable` 支持在表头右侧拖拽调整列宽，适用于所有使用该通用报表组件的页面。

## 保存规则

- 列宽保存到 `columnsStateMap.width`。
- 列宽会随本地缓存保存和恢复。
- 保存视图时会一起保存列宽，选择视图时会恢复列宽。
- 列宽变化会参与视图变更检测。

## 兼容说明

- 页面侧不需要新增 props。
- 原有列显示、固定、拖拽排序仍继续使用 `columnsStateMap`。
- ProTable 列设置变更时会保留已有列宽，避免打开列设置后丢失用户手动调整的宽度。
