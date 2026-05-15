## 问题标题：Firebase 分析时间筛选参数及格式错误

### 出现场景

在 Dashboard 页面使用 FilterBar（特别是点击 `1h`、`6h` 等快捷时间按钮）触发查询时发生。

### 问题原因

1. **参数透传污染**：在构建 `apiParams` 下发给子组件（如 `ErrorTopPanel` 和 `NodeQualityTable`）时，使用了 `...filters` 结构，导致 `timeRange` 这个仅供前端 ProForm 使用的特殊数组参数被透传到了 API 请求的 Query 中，生成了无用的 `timeRange[]=...&timeRange[]=...`。
2. **时间格式未对齐要求**：根据后端接口规范，`start_time` 和 `end_time` 需要严格使用 `YYYY-MM-DD HH:mm:ss` 格式，但旧逻辑中使用了 `dayjs().toISOString()`，导致生成了带有时区后缀的格式（如 `2026-05-15T01:23:26.595Z`），在后端解析时可能被拦截或引起时区偏移。
3. **URL同步丢失**：当从带有 `start_time` 的链接加载时，初始化 state 未将这两个字段转回 `timeRange` 数组，导致 FilterBar 无法正确回显时间状态。

### 解决方式

在 `src/pages/firebase-analytics/Dashboard.tsx` 中增加了一套统一的参数清洗工具逻辑：

1. **统格式化标准**：创建了 `getApiParams` 统一方法。在这个方法内解构取出 `timeRange` 并从最终抛出的 `rest` 中剥离。
2. **重定义时间输出**：使用 `.format('YYYY-MM-DD HH:mm:ss')` 替代 `.toISOString()`，解决带有 `.595Z` 的格式错误。
3. **URL 反解同步**：在 `getInitialFilters` 内补充了反解逻辑，若 URL 携带 `start_time` 与 `end_time`，则重新拼装成 `timeRange` 提供给 `FilterBar` 使用，解决页面刷新丢失选中时间段的问题。

### 影响范围

Firebase 数据分析模块所有页面组件及其向下的 API Query 组装逻辑。

### 相关文件

- `src/pages/firebase-analytics/Dashboard.tsx`
