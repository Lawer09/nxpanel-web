## ProTable 内建列拖拽与自定义列宽/排序冲突

### 出现场景

`UniversalReportTable` 同时接入列宽拖拽、服务端排序和列顺序调整时，使用 ProTable 内建 `setting.draggable` 容易出现列头拖动、排序点击和列宽拖动之间的误触发，项目报表页尤其明显。

### 问题原因

ProTable 内建列拖拽的触发区域就是列头本身，和当前自定义的：
- 列头点击排序
- 右侧列宽拖拽把手
- 动态列状态持久化

发生了交叉。这样会导致用户想调列宽时触发排序，或想点排序时被识别为拖拽。

### 解决方式

关闭 `setting.draggable`，改为在 `UniversalReportTable` 表头层接入 `dnd-kit` 自定义拖拽：
- 左侧独立拖拽把手仅负责列顺序
- 右侧独立拖拽把手仅负责列宽
- 拖拽结果只回写 `columnsStateMap.order`
- 统计行继续复用同一列顺序来源

### 影响范围

所有复用 `UniversalReportTable` 的动态报表页列排序交互，尤其是项目报表页。

### 相关文件

- `src/components/report/UniversalReportTable.tsx`
