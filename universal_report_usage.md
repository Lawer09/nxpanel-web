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

## 8. 常见问题

- `pageSize` 异常（如缓存污染成 `[]`）
  - 组件内部已做容错与归一化
- `savedViews.map is not a function`
  - 组件内部已兼容历史脏缓存与结构迁移
- 排序点击无效
  - 检查是否开启 `enableServerSort`
  - 检查 `fetchData` 是否把 `sorter` 映射为后端参数

### 8.1 本次排序问题复盘（userReport）

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
