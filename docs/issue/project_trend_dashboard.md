# 项目趋势 Dashboard 跳转接入说明

## 出现场景

项目报表和项目管理都能看到 `projectCode`，但原先只能停留在列表或表格内继续筛选，不适合快速分析单个项目在时间范围内的数据变化。

## 问题原因

- 项目报表主要是通用表格形态，擅长查数，不擅长看趋势
- `projectCode` 缺少直接进入分析视图的入口
- 如果直接从项目报表跳转，又不继承当前已生效筛选条件，会导致“表里看到的是一组条件，Dashboard 打开却是另一组条件”的上下文断裂

## 解决方式

- 新增隐藏页面 `/report/project-trend`
- 项目报表和项目管理表格的 `projectCode` 列统一跳转到该页面
- 项目报表跳转时优先继承当前已应用的 `dateRange` 和 `adStatus`
- `UniversalReportTable` 新增一个轻量 `onAppliedStateChange` 回调，页面侧可读取当前已生效查询状态，但不改变原有查询协议

## 影响范围

- 项目报表页
- 项目管理表格页
- 新增项目趋势 Dashboard 页
- 通用报表组件增加 applied-state 对外回调

## 相关文件

- `src/pages/report/project/index.tsx`
- `src/pages/project-table/index.tsx`
- `src/pages/report/project-trend/index.tsx`
- `src/components/report/UniversalReportTable.tsx`
