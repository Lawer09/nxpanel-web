import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';

type AnyRecord = Record<string, any>;

type MetricFormatter = (value: number) => React.ReactNode;
type FixedPosition = 'left' | 'right';
type ColumnState = { show?: boolean; fixed?: FixedPosition; order?: number };
type ColumnStateMap = Record<string, ColumnState>;

interface SummaryMetric {
  key: string;
  formatter?: MetricFormatter;
}

interface MetricOption<T> {
  label: string;
  value: string;
  column: ColumnsType<T>[number];
  formatter?: MetricFormatter;
}

interface SavedView<Q extends AnyRecord> {
  id: string;
  name: string;
  query: Q;
  dimensions: string[];
  metrics: string[];
  columnsStateMap?: ColumnStateMap;
}

interface ActiveColumn<T> {
  id: string;
  kind: 'dimension' | 'metric';
  value: string;
  label: string;
  column: ColumnsType<T>[number];
}

interface DimensionOption<T> {
  label: string;
  value: string;
  column: ColumnsType<T>[number];
}

interface ReportFetchResult<T> {
  list: T[];
  total: number;
}

interface UniversalReportTableProps<T extends AnyRecord, Q extends AnyRecord> {
  storageKey: string;
  title: string;
  rowKey: string | ((record: T) => string);
  defaultQuery: Q;
  defaultDimensions: string[];
  defaultMetrics: string[];
  dimensionOptions: DimensionOption<T>[];
  metricOptions: MetricOption<T>[];
  defaultPageSize?: number;
  renderFilters: (args: {
    query: Q;
    setQuery: React.Dispatch<React.SetStateAction<Q>>;
  }) => React.ReactNode;
  fetchData: (args: {
    query: Q;
    page: number;
    pageSize: number;
    dimensions: string[];
  }) => Promise<ReportFetchResult<T>>;
  fetchGrandTotals?: (args: { query: Q; dimensions: string[] }) => Promise<Record<string, number>>;
}

function safeNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function readLocalState<Q extends AnyRecord>(storageKey: string, fallback: Q, defaultDimensions: string[], defaultPageSize: number) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        query: fallback,
        dimensions: defaultDimensions,
        pageSize: defaultPageSize,
        metrics: [],
        savedViews: [],
        columnsStateMap: {},
      };
    }
    const parsed = JSON.parse(raw) as {
      query?: Q;
      dimension?: string;
      dimensions?: string[];
      metrics?: string[];
      pageSize?: number;
      savedViews?: SavedView<Q>[];
      columnsStateMap?: ColumnStateMap;
    };
    const dimensions = parsed.dimensions ?? (parsed.dimension ? [parsed.dimension] : defaultDimensions);
    const metrics = parsed.metrics ?? [];
    return {
      query: parsed.query ?? fallback,
      dimensions,
      metrics,
      pageSize: parsed.pageSize ?? defaultPageSize,
      savedViews: parsed.savedViews ?? [],
      columnsStateMap: parsed.columnsStateMap ?? {},
    };
  } catch {
    return {
      query: fallback,
      dimensions: defaultDimensions,
      metrics: [],
      pageSize: defaultPageSize,
      savedViews: [],
      columnsStateMap: {},
    };
  }
}

function writeLocalState<Q extends AnyRecord>(
  storageKey: string,
  query: Q,
  dimensions: string[],
  metrics: string[],
  pageSize: number,
  savedViews: SavedView<Q>[],
  columnsStateMap: ColumnStateMap,
) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ query, dimensions, metrics, pageSize, savedViews, columnsStateMap }),
  );
}

function UniversalReportTable<T extends AnyRecord, Q extends AnyRecord>(props: UniversalReportTableProps<T, Q>) {
  const {
    storageKey,
    title,
    rowKey,
    defaultQuery,
    defaultDimensions,
    defaultMetrics,
    dimensionOptions,
    metricOptions,
    defaultPageSize = 50,
    renderFilters,
    fetchData,
    fetchGrandTotals,
  } = props;

  const persisted = readLocalState(storageKey, defaultQuery, defaultDimensions, defaultPageSize);
  const [query, setQuery] = useState<Q>(persisted.query);
  const [appliedQuery, setAppliedQuery] = useState<Q>(persisted.query);
  const [dimensions, setDimensions] = useState<string[]>(
    persisted.dimensions.length ? persisted.dimensions : defaultDimensions,
  );
  const [metrics, setMetrics] = useState<string[]>(
    persisted.metrics.length ? persisted.metrics : defaultMetrics,
  );
  const [savedViews, setSavedViews] = useState<SavedView<Q>[]>(persisted.savedViews ?? []);
  const [columnsStateMap, setColumnsStateMap] = useState<ColumnStateMap>(persisted.columnsStateMap ?? {});
  const [selectedViewId, setSelectedViewId] = useState<string>();
  const [viewName, setViewName] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(persisted.pageSize);
  const [total, setTotal] = useState(0);
  const [grandTotals, setGrandTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    writeLocalState(storageKey, query, dimensions, metrics, pageSize, savedViews, columnsStateMap);
  }, [storageKey, query, dimensions, metrics, pageSize, savedViews, columnsStateMap]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchData({
          query: appliedQuery,
          page: current,
          pageSize,
          dimensions,
        });
        if (!alive) return;
        setData(result.list || []);
        setTotal(result.total || 0);
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [fetchData, appliedQuery, current, pageSize, dimensions]);

  useEffect(() => {
    if (!fetchGrandTotals) return;
    let alive = true;
    const run = async () => {
      const totals = await fetchGrandTotals({ query: appliedQuery, dimensions });
      if (alive) {
        setGrandTotals(totals || {});
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [fetchGrandTotals, appliedQuery, dimensions]);

  const dimColumns = useMemo<ActiveColumn<T>[]>(
    () =>
      dimensions
        .map((value) => {
          const option = dimensionOptions.find((item) => item.value === value);
          if (!option) return null;
          return {
            id: `d:${value}`,
            kind: 'dimension' as const,
            value,
            label: option.label,
            column: option.column,
          };
        })
        .filter(Boolean) as ActiveColumn<T>[],
    [dimensions, dimensionOptions],
  );

  const metricColumns = useMemo<ActiveColumn<T>[]>(
    () => {
      return metricOptions
        .filter((item) => metrics.includes(item.value))
        .map((item) => ({
          id: `m:${item.value}`,
          kind: 'metric' as const,
          value: item.value,
          label: item.label,
          column: item.column,
        }));
    },
    [metricOptions, metrics],
  );

  const activeColumns = useMemo(() => [...dimColumns, ...metricColumns], [dimColumns, metricColumns]);

  const tableColumns = useMemo<ProColumns<T>[]>(
    () =>
      activeColumns.map((item) => {
        const key = String((item.column as any).key ?? item.id);
        return {
          ...(item.column as ProColumns<T>),
          key,
        };
      }),
    [activeColumns],
  );

  const visibleOrderedColumns = useMemo(() => {
    return activeColumns
      .map((item, index) => {
        const key = String((item.column as any).key ?? item.id);
        const state = columnsStateMap[key];
        return { ...item, index, key, order: state?.order, show: state?.show };
      })
      .filter((item) => item.show !== false)
      .sort((a, b) => {
        const hasA = typeof a.order === 'number';
        const hasB = typeof b.order === 'number';
        if (hasA && hasB) return (a.order as number) - (b.order as number);
        if (hasA) return -1;
        if (hasB) return 1;
        return a.index - b.index;
      });
  }, [activeColumns, columnsStateMap]);

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    return metricOptions
      .filter((item) => metrics.includes(item.value))
      .map((item) => ({ key: item.value, formatter: item.formatter }));
  }, [metricOptions, metrics]);

  const currentTotals = useMemo(() => {
    return summaryMetrics.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = data.reduce((sum, row) => sum + safeNumber(row[item.key as keyof T]), 0);
      return acc;
    }, {});
  }, [data, summaryMetrics]);

  const metricMap = useMemo(
    () =>
      summaryMetrics.reduce<Record<string, SummaryMetric>>((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {}),
    [summaryMetrics],
  );

  const handleSearch = () => {
    setCurrent(1);
    setAppliedQuery(query);
  };

  const handleReset = () => {
    setQuery(defaultQuery);
    setAppliedQuery(defaultQuery);
    setDimensions(defaultDimensions);
    setMetrics(defaultMetrics);
    setColumnsStateMap({});
    setCurrent(1);
    setPageSize(defaultPageSize);
  };

  const handleSaveView = () => {
    const name = viewName.trim();
    if (!name) {
      message.warning('请输入视图名称');
      return;
    }
    const existed = savedViews.find((item) => item.name === name);
    const nextView: SavedView<Q> = {
      id: existed?.id ?? `${Date.now()}`,
      name,
      query,
      dimensions,
      metrics,
      columnsStateMap,
    };
    const rest = savedViews.filter((item) => item.name !== name);
    const nextViews = [nextView, ...rest].slice(0, 20);
    setSavedViews(nextViews);
    setSelectedViewId(nextView.id);
    setViewName('');
    message.success(existed ? '已覆盖同名视图' : '视图已保存');
  };

  const handleApplyView = (id: string) => {
    const target = savedViews.find((item) => item.id === id);
    if (!target) return;
    setSelectedViewId(id);
    setQuery(target.query);
    setAppliedQuery(target.query);
    setDimensions(target.dimensions);
    setMetrics(target.metrics);
    setColumnsStateMap(target.columnsStateMap ?? {});
    setCurrent(1);
  };

  const pagination: TablePaginationConfig = {
    current,
    pageSize,
    total,
    showSizeChanger: true,
    onChange: (nextPage, nextPageSize) => {
      setCurrent(nextPage);
      if (nextPageSize && nextPageSize !== pageSize) {
        setPageSize(nextPageSize);
        setCurrent(1);
      }
    },
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title={title}
        extra={
          <Space>
            <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        }
      >
        <Typography.Text type="secondary">筛选条件</Typography.Text>
        <div style={{ marginTop: 8 }}>{renderFilters({ query, setQuery })}</div>

        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
          维度与统计字段
        </Typography.Text>
        <Space wrap>
          <span>维度</span>
          <Select
            mode="multiple"
            value={dimensions}
            style={{ width: 160 }}
            options={dimensionOptions.map((item) => ({ label: item.label, value: item.value }))}
            onChange={(values) => {
              setDimensions(values.length ? values : defaultDimensions);
              setCurrent(1);
            }}
          />
          <span>统计字段</span>
          <Select
            mode="multiple"
            value={metrics}
            style={{ minWidth: 420 }}
            options={metricOptions.map((item) => ({ label: item.label, value: item.value }))}
            onChange={(values) => {
              setMetrics(values);
              setCurrent(1);
            }}
            maxTagCount={4}
          />
        </Space>

        <div style={{ marginTop: 12 }}>
          <Space wrap>
            <Typography.Text type="secondary">查询视图</Typography.Text>
            <Select
              value={selectedViewId}
              style={{ width: 260 }}
              allowClear
              placeholder="选择已保存视图"
              options={savedViews.map((view) => ({ label: view.name, value: view.id }))}
              onChange={(id) => {
                if (!id) {
                  setSelectedViewId(undefined);
                  return;
                }
                handleApplyView(id);
              }}
            />
            <Input
              value={viewName}
              style={{ width: 220 }}
              placeholder="输入视图名称"
              onChange={(e) => setViewName(e.target.value)}
            />
            <Button icon={<SaveOutlined />} onClick={handleSaveView}>
              保存视图
            </Button>
            <Typography.Text type="secondary">视图保存内容：筛选条件 + 维度 + 统计字段 + 列顺序/固定</Typography.Text>
          </Space>
        </div>
      </Card>

      <Card title="表格展示">
        <ProTable<T>
          rowKey={rowKey as any}
          columns={tableColumns}
          dataSource={data}
          loading={loading}
          search={false}
          toolBarRender={false}
          options={{ reload: false, density: false, fullScreen: false, setting: { draggable: true } }}
          columnsState={{
            value: columnsStateMap,
            onChange: (map) => setColumnsStateMap((map || {}) as ColumnStateMap),
          }}
          pagination={pagination}
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                {visibleOrderedColumns.map((col, idx) => {
                  if (idx === 0) {
                    return (
                      <Table.Summary.Cell index={idx} key={`curr-${col.key}`}>
                        当前页合计
                      </Table.Summary.Cell>
                    );
                  }
                  if (col.kind !== 'metric') {
                    return (
                      <Table.Summary.Cell index={idx} key={`curr-${col.key}`}>
                        -
                      </Table.Summary.Cell>
                    );
                  }
                  const metric = metricMap[col.value];
                  const raw = currentTotals[col.value] ?? 0;
                  const content = metric?.formatter ? metric.formatter(raw) : raw.toLocaleString();
                  return (
                    <Table.Summary.Cell index={idx} key={`curr-${col.key}`}>
                      {content}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
              <Table.Summary.Row>
                {visibleOrderedColumns.map((col, idx) => {
                  if (idx === 0) {
                    return (
                      <Table.Summary.Cell index={idx} key={`grand-${col.key}`}>
                        总数据合计
                      </Table.Summary.Cell>
                    );
                  }
                  if (col.kind !== 'metric') {
                    return (
                      <Table.Summary.Cell index={idx} key={`grand-${col.key}`}>
                        -
                      </Table.Summary.Cell>
                    );
                  }
                  const metric = metricMap[col.value];
                  const raw = grandTotals[col.value] ?? 0;
                  const content = metric?.formatter ? metric.formatter(raw) : raw.toLocaleString();
                  return (
                    <Table.Summary.Cell index={idx} key={`grand-${col.key}`}>
                      {content}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </Space>
  );
}

export default UniversalReportTable;
