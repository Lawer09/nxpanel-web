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

## 问题标题：地区质量分布地图国家码与 ECharts 世界地图区域名不兼容

### 出现场景

在 Firebase Analytics Dashboard 的“地区质量分布”卡片中，后端返回多个国家的数据时，地图着色会集中到错误国家，或仅少数国家生效。

### 问题原因

1. `/dashboard/region-quality` 接口返回的 `user_country` 是 ISO 国家码，例如 `SG`、`US`、`JP`。
2. ECharts `world.json` 地图默认按区域 `name` 匹配地图数据，不会直接把 ISO 国家码当作区域名处理。
3. 旧实现直接将 `user_country` 填到 `series.data[].name`，导致地图区域匹配失败或落到错误区域。

### 解决方式

1. 在 Firebase Analytics 模块内新增国家映射工具，将国家码转换为稳定的地图匹配值和展示名。
2. 维护一份轻量的 `ISO 国家码 -> ECharts 世界地图英文区域名` 映射表，保证 `series.data[].name` 与 `world.json` 的 `properties.name` 一致。
3. 表格列和 Tooltip 统一显示可读国家名，优先使用筛选接口 `countries` 的 `label`，再回退到浏览器内置地区名或原始国家码。
4. 对相同国家的多条记录先在前端按国家聚合，避免地图数据同名覆盖；同时将 `rowKey` 改为稳定组合键，移除 `Math.random()`。

### 影响范围

Firebase Analytics Dashboard 的“地区质量分布”地图与表格展示。

### 相关文件

- `src/components/FirebaseAnalytics/countryMapping.ts`
- `src/components/FirebaseAnalytics/RegionQualityPanel.tsx`
- `src/pages/firebase-analytics/Dashboard.tsx`

## 问题标题：Dashboard 节点质量区域只展示连接排行，缺少探测与连接联合诊断

### 出现场景

在 Firebase Dashboard 排查节点质量时，原页面只能看到真实连接的节点排行。对于“节点只被探测、未发生真实连接”或“探测成功但真实连接偏差”的情况，需要切换多个页面甚至人工比对，排查效率低。

### 问题原因

1. 节点区域原本仅调用 `/nodes/quality-rank`，缺少新补充的 `/vpn-probe/node-stats` 探测统计。
2. 页面结构只适合看单一排行，不适合识别“样本覆盖缺失”“探测与连接口径偏差”这类排查问题。
3. 缺少对重点节点的优先级分层，容易把 Dashboard 做成纯数据展示页。

### 解决方式

1. 为节点区域同时接入连接排行和探测统计接口。
2. 将原有 `NodeQualityTable` 升级为“节点质量诊断面板”，增加：
   - 重点节点成功率对照图
   - 仅探测节点、连接偏差节点、高风险节点的摘要卡
   - 诊断列表、连接排行、探测统计三个 Tab
3. 前端根据探测成功率、连接成功率、成功率落差和 P95 耗时做优先级排序，让 Dashboard 先暴露最适合排查的问题节点。

### 影响范围

Firebase Analytics Dashboard 的节点质量区域，以及节点探测 / 连接问题的日常排查入口。

### 相关文件

- `src/components/FirebaseAnalytics/NodeQualityTable.tsx`
- `src/pages/firebase-analytics/Dashboard.tsx`
- `src/services/firebase-analytics/api.ts`
- `src/services/firebase-analytics/types.ts`

## 问题标题：节点排查继续堆在 Dashboard 会导致筛选口径和排查路径失控

### 出现场景

当 Firebase 节点排查既要覆盖“仅探测未连接”，又要支持单节点连接明细、探测明细、错误分布时，如果继续在 `Dashboard` 里扩展节点区域，会同时出现筛选拥挤、URL 状态混乱和排查链路不闭环的问题。

### 问题原因

1. `Dashboard` 的职责应是全局总览，如果继续承载节点列表、单节点诊断和明细表格，会让页面同时承担总览与深度排查两类任务。
2. Firebase 页面之前已经出现过 `timeRange` 透传污染和 URL 回显缺失问题，若 `Dashboard`、节点列表、节点详情各自维护一套筛选参数转换逻辑，后续很容易再次出现口径漂移。
3. 节点排查需要保留“列表筛选 -> 详情排查 -> 返回原筛选结果”的完整链路，这种交互不适合继续塞在看板式页面中。

### 解决方式

1. 在 `Firebase` 菜单下新增独立的 `节点状态` 页面，承接节点筛选、排序、分页和风险分层。
2. 将 `Dashboard` 的节点区域收口为摘要卡和跳转入口，不再承载完整节点诊断表。
3. 抽出 Firebase 通用筛选参数工具，统一处理：
   - `timeRange -> start_time/end_time`
   - URL 参数回显
   - 列表页与详情页之间的筛选透传
4. 节点详情页通过 `return_search` 保留列表态，保证排查后能回到原筛选上下文。

### 影响范围

Firebase Analytics 的 `Dashboard`、`节点状态` 列表页、节点详情页，以及所有依赖 Firebase 筛选参数透传的页面。

### 相关文件

- `src/pages/firebase-analytics/Dashboard.tsx`
- `src/pages/firebase-analytics/NodeStatus.tsx`
- `src/pages/firebase-analytics/NodeStatusDetail.tsx`
- `src/components/FirebaseAnalytics/NodeStatusSummary.tsx`
- `src/components/FirebaseAnalytics/FilterBar.tsx`
- `src/utils/firebase-analytics-filters.ts`

## 问题标题：节点状态列表暴露诊断口径细节，节点详情缺少可延续筛选的分析图表

### 出现场景

在 Firebase 菜单下使用“节点状态”页面排查节点时，列表页同时暴露了 `诊断状态`、`样本范围` 这类面向实现的诊断口径；点击节点名称进入详情后，又只有摘要卡和明细表，缺少趋势图、国家成功率分布和错误占比图，也无法继续沿用全局筛选条件做节点下钻分析。

### 问题原因

1. 节点状态列表沿用了后端诊断字段的完整暴露方式，把服务端内部诊断口径直接做成了前端筛选项，用户需要理解 `sample_scope` 之类的实现概念才能操作页面。
2. 节点详情页只完成了“从列表跳进去看明细”的最小链路，没有继续复用 Firebase 全局筛选栏，导致从列表进入后无法直接切换时间、App、平台、用户国家等上下文。
3. 详情页虽然已有节点连接摘要、探测摘要和错误分布接口，但没有把 `/vpn-session/quality-trend`、`/vpn-probe/trend`、`/dashboard/region-quality`、`/errors/top` 这类现有分析接口在节点维度下复用起来，造成详情页缺少趋势和对比视角。

### 解决方式

1. 节点状态列表只保留有业务含义的快捷视图和核心字段，移除单独暴露的 `诊断状态`、`样本范围` 下拉，避免把内部诊断口径继续外翻给用户。
2. 节点详情页顶部补回统一 `FilterBar`，继续走 Firebase 通用筛选参数工具，保证 `timeRange`、URL 回显和详情页刷新后的查询口径一致。
3. 在详情页新增三类分析图：
   - 国家成功率分布：复用 `/dashboard/region-quality`，携带节点参数后展示该节点在不同用户国家下的成功率。
   - 成功率趋势图：复用 `/vpn-session/quality-trend` 和 `/vpn-probe/trend`，展示连接成功率与探测成功率的时间趋势对比。
   - 错误占比图：连接侧复用 `/nodes/connection-error-distribution`，探测侧复用 `/errors/top?error_type=vpn_probe`。
4. 明细表继续保留节点上下文，并与新的详情页筛选栏共享同一套 URL 状态，保持“列表筛选 -> 节点详情 -> 返回原列表”的链路闭环。

### 影响范围

Firebase Analytics 的 `节点状态` 列表页、节点详情页，以及所有通过节点名称进入详情后继续做时间/App/平台/国家筛查的排查路径。

### 相关文件

- `src/pages/firebase-analytics/NodeStatus.tsx`
- `src/pages/firebase-analytics/NodeStatusDetail.tsx`
- `src/components/FirebaseAnalytics/FilterBar.tsx`
- `src/components/FirebaseAnalytics/TrendChart.tsx`
- `src/components/FirebaseAnalytics/countryMapping.ts`
