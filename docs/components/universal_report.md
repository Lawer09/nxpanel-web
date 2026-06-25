# 通用报表组件使用说明

本文档说明 `UniversalReportTable` 的核心能力、基础用法、服务端排序接入方式与常见注意事项。

## 1. 组件位置

- 组件文件：`src/components/report/UniversalReportTable.tsx`

## 2. 核心能力

- 维度/指标可配置（动态展示列）
- 查询条件与“已应用查询”分离（点击查询后才生效）
- 维度选择与“筛选字段可见性”分离（漏斗图标控制）
- 视图保存与恢复（localStorage）
- 列设置（显示/固定/拖拽顺序）
- 可选合计行（当前页合计 / 总数据合计）
- 可选服务端排序（仅启用时展示列排序）

## 3. 最小使用示例

```tsx
<UniversalReportTable<Row, Query>
  storageKey="report.demo"
  title="示例报表"
  rowKey={(r) => String(r.id)}
  defaultQuery={{ dateRange: [today, today] }}
  defaultDimensions={['date']}
  defaultMetrics={['count']}
  dimensionOptions={dimensionOptions}
  metricOptions={metricOptions}
  renderFilters={({ query, setQuery, visibleFilterDimensions }) => (
    <Form layout="inline" style={{ rowGap: 4 }}>
      {visibleFilterDimensions.includes('date') ? (
        <Form.Item label="日期">
          <DatePicker />
        </Form.Item>
      ) : null}
    </Form>
  )}
  fetchData={async ({ query, page, pageSize, dimensions }) => {
    // 调用后端
    return { list: [], total: 0 };
  }}
/>
```

## 4. 服务端排序（可选）

### 4.1 何时开启

- 仅当后端接口支持排序参数时，传 `enableServerSort`
- 不支持排序时，不要开启；列头不会展示排序按钮

```tsx
<UniversalReportTable
  enableServerSort
  ...
/>
```

### 4.2 fetchData 接收的排序参数

`fetchData` 第四个参数结构：

```ts
sorter?: {
  field?: string;
  columnKey?: string;
  order?: 'ascend' | 'descend';
}
```

### 4.3 传给后端的推荐映射

- `orderBy = sorter.field`
- `orderDirection = sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined`

示例：

```ts
fetchData={async ({ query, page, pageSize, dimensions, sorter }) => {
  return request({
    ...query,
    groupBy: dimensions,
    page,
    pageSize,
    orderBy: sorter?.field,
    orderDirection:
      sorter?.order === 'ascend'
        ? 'asc'
        : sorter?.order === 'descend'
          ? 'desc'
          : undefined,
  });
}}
```

## 5. 维度与筛选展示控制

- 维度 Tag：控制“分组维度”
- 漏斗 Tag：控制“该维度对应筛选项是否显示”
- 两者互不强制绑定

渲染筛选时请使用：

```tsx
visibleFilterDimensions.includes('yourDimension')
```

## 6. 生效时机

- 修改查询条件/维度后，不会立即请求
- 点击“查询”或表格工具栏“刷新”后生效

## 7. 合计行控制

- `showCurrentSummary?: boolean`
- `showGrandSummary?: boolean`
- `hideSummaryRows?: boolean`（总开关）

建议默认关闭，通过页面按需开启。

- 开启 `showGrandSummary` 后，`fetchData` 可直接返回 `summary` 作为“总数据合计”行数据
- `fetchData` 返回结构可为 `return { list, total, summary }`
- 如果总计数据需要独立接口，也可以继续使用 `fetchGrandTotals`
- `summary` 支持 `number / string / null`，建议复用指标列 `formatter` 统一展示格式
- 指标列 `formatter` 在合计行会收到第二参数 `record`，当前页合计传入当前页各指标汇总对象，总数据合计传入后端 `summary`；依赖其它字段组合展示的指标可通过该参数读取伴随字段
- 统计行会跟随当前列设置顺序同步调整；列拖拽、隐藏/显示、恢复已保存视图后，主表列与“当前页合计 / 总数据合计”会保持同一顺序
- 新增显示的指标列会沿当前列布局顺序补到末尾，并同步写入受控 `order`；避免主表列与统计行对同一个新字段出现“一个提前、一个追加”的顺序分叉
- 当指标列被固定到首列时，统计行不会再用合计文案覆盖该指标值；合计文案会优先展示在可见维度列上，固定列、普通列和右固定列顺序会与主表保持一致

## 8. 导出配置（可选）

页面需要导出能力时传入 `exportAction`；未传入时组件不展示导出按钮，不影响现有报表页。

```tsx
<UniversalReportTable<Row, Query>
  exportAction={{
    label: '导出 CSV',
    run: async ({ query, dimensions, metrics, sorter }) => {
      const result = await exportReport({
        ...query,
        groupBy: dimensions,
        orderBy: sorter?.field || sorter?.columnKey,
        orderDirection:
          sorter?.order === 'ascend'
            ? 'asc'
            : sorter?.order === 'descend'
              ? 'desc'
              : undefined,
      });
      return {
        blob: result.blob,
        filename: result.filename || 'report.csv',
      };
    },
  }}
  ...
/>
```

- 点击导出时，组件会先把当前草稿查询条件和维度同步为已应用状态，并将分页重置到第一页。
- `exportAction.run` 接收的是本次即将生效的 `query`、`dimensions`、`metrics` 和当前排序 `sorter`，不需要页面再等待表格刷新后取值。
- 组件内部统一处理 `Blob` 下载、导出中 loading、防重复点击和成功 / 失败提示。
- 后端返回文件名时建议页面在 service 层从 `Content-Disposition` 解析，失败时回退到业务默认文件名。

## 8.1 已应用状态回调

- 页面如果需要感知“当前已生效查询状态”，可以传入：

```tsx
onAppliedStateChange={(state) => {
  // state.query
  // state.dimensions
  // state.metrics
  // state.sorter
}}
```

- 该回调返回的是当前表格真正用于查询的已应用状态，而不是尚未点击“查询”的草稿状态。
- 适用于从报表页跳转到详情页、分析页时继承当前查询上下文。

## 9. 常见问题

- `pageSize` 异常（如缓存污染成 `[]`）
  - 组件内部已做容错与归一化
- `savedViews.map is not a function`
  - 组件内部已兼容历史脏缓存与结构迁移
- 排序点击无效
  - 检查是否开启 `enableServerSort`
  - 检查 `fetchData` 是否把 `sorter` 映射为后端参数

### 9.1 本次排序问题复盘（userReport）

现象：

- 点击列后请求能发出 `orderBy/orderDirection`，但表头排序图标不变色
- 再次点击同一列时，经常仍是 `asc`，看起来像“只能点一次”

根因：

- **排序状态与列标识不一致**：动态列场景下，`sorter.field/columnKey` 与列 `key/dataIndex` 没有稳定对齐，导致 Table 未识别“当前排序列”，图标保持未排序样式
- **排序状态是半受控**：一段时间内混用了内部排序状态和外部状态，视觉状态与请求参数不同步，出现“请求变化了但图标没变化”
- **分页/排序回调分流**：分页与排序更新路径不统一，放大了状态不同步问题

修复要点：

- 统一由 `ProTable.onChange` 处理分页 + 排序状态
- 对动态列保证稳定 key，并用同一套规则匹配 `sorter.field/columnKey`
- 为当前排序列显式回填 `sortOrder`（受控显示），确保图标状态与请求一致
- 在开发环境增加排序链路日志（onChange 原始值、归一化结果、fetchData 入参）用于排查

落地文件：

- `src/components/report/UniversalReportTable.tsx`
- `src/pages/report/user-report-admin/tabs/BaseUserReportTab.tsx`

### 9.2 视图更新与排序高亮补充说明

- 服务端排序场景下，动态列应保证列 `key` 与排序字段使用同一套可比较标识，否则请求参数正确时，表头排序图标也可能无法高亮
- `UniversalReportTable` 内部通过受控 `sortOrder` 回填当前排序列；页面侧只需要保证 `fetchData` 正确消费 `sorter`
- 若排序图标在特定动态列表场景下仍不稳定，可在视图操作区直接查看当前排序描述，格式为 `排序：字段 升序/降序`
- 选中某个视图后，如果当前草稿状态相对该视图发生变化，视图操作区会提示 `视图变更，未保存`
- 统计行不会再单独重建列顺序；组件内部会让 `ProTable` 列顺序与统计行共用同一份列布局状态，避免拖拽后主表与统计行错位
- 选中视图后点击 `更新`，会先覆盖保存当前视图，再将当前草稿查询条件/维度应用到表格；若这些条件尚未生效，会同步触发一次查询
- `metricOptions` 支持可选 `tooltip` 字段，用于在“统计字段”选择区给单个指标补充解释说明；适合展示接口新增字段含义或复合列展示规则
