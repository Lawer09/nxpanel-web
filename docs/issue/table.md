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

## 弹窗 Table 使用服务端分页时只更新页码未重新请求

### 出现场景

广告变现页面点击“同步节点”卡片打开弹窗后，弹窗内同步节点列表点击下一页，表格页码变化但数据仍停留在第一页。

### 问题原因

弹窗内使用 Ant Design `Table`，但分页只配置了 `total` 和 `defaultPageSize`，没有维护受控的 `current/pageSize` 状态，也没有在 `onChange` 中触发带分页参数的接口请求。同时 `getSyncServers` 服务函数原本不接收分页参数，导致每次都只能请求默认页。

### 解决方式

为同步节点弹窗增加 `page/pageSize` 状态，分页变化时更新状态并重新请求；将 `getSyncServers` 扩展为可选接收 `{ page, pageSize }`，兼容原有无参调用。

### 影响范围

广告变现页面的同步节点弹窗分页刷新。

### 相关文件

- `src/pages/ad/ad-revenue/components/SyncServersModal.tsx`
- `src/services/ad/api.ts`
- `src/services/ad/typings.d.ts`
