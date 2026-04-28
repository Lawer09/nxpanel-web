import { ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';

type AnyRecord = Record<string, any>;

type MetricFormatter = (value: number) => React.ReactNode;

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
      };
    }
    const parsed = JSON.parse(raw) as {
      query?: Q;
      dimension?: string;
      dimensions?: string[];
      metrics?: string[];
      pageSize?: number;
      savedViews?: SavedView<Q>[];
    };
    const dimensions =
      parsed.dimensions ??
      (parsed.dimension ? [parsed.dimension] : defaultDimensions);
    return {
      query: parsed.query ?? fallback,
      dimensions,
      metrics: parsed.metrics ?? [],
      pageSize: parsed.pageSize ?? defaultPageSize,
      savedViews: parsed.savedViews ?? [],
    };
  } catch {
    return {
      query: fallback,
      dimensions: defaultDimensions,
      metrics: [],
      pageSize: defaultPageSize,
      savedViews: [],
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
) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ query, dimensions, metrics, pageSize, savedViews }),
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
  const [selectedViewId, setSelectedViewId] = useState<string>();
  const [viewName, setViewName] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(persisted.pageSize);
  const [total, setTotal] = useState(0);
  const [grandTotals, setGrandTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    writeLocalState(storageKey, query, dimensions, metrics, pageSize, savedViews);
  }, [storageKey, query, dimensions, metrics, pageSize, savedViews]);

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

  const dimColumns = useMemo(
    () =>
      dimensions
        .map((value) => dimensionOptions.find((item) => item.value === value)?.column)
        .filter(Boolean) as ColumnsType<T>,
    [dimensions, dimensionOptions],
  );

  const tableColumns = useMemo(
    () => {
      const selectedMetricColumns = metricOptions
        .filter((item) => metrics.includes(item.value))
        .map((item) => item.column);
      return [...dimColumns, ...selectedMetricColumns];
    },
    [dimColumns, metricOptions, metrics],
  );

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
    () => summaryMetrics.reduce<Record<string, SummaryMetric>>((acc, item) => {
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
    setCurrent(1);
    setPageSize(defaultPageSize);
  };

  const handleSaveView = () => {
    const name = viewName.trim();
    if (!name) {
      message.warning('请输入视图名称');
      return;
    }
    const nextView: SavedView<Q> = {
      id: `${Date.now()}`,
      name,
      query,
      dimensions,
      metrics,
    };
    const nextViews = [nextView, ...savedViews].slice(0, 20);
    setSavedViews(nextViews);
    setSelectedViewId(nextView.id);
    setViewName('');
    message.success('视图已保存');
  };

  const handleApplyView = (id: string) => {
    const target = savedViews.find((item) => item.id === id);
    if (!target) return;
    setSelectedViewId(id);
    setQuery(target.query);
    setAppliedQuery(target.query);
    setDimensions(target.dimensions);
    setMetrics(target.metrics);
    setCurrent(1);
  };

  const dimensionCount = Math.max(1, dimColumns.length);
  const metricTableColumns = tableColumns.slice(dimColumns.length);

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
      <Card title={`${title} - 1. 筛选条件`}>
        {renderFilters({ query, setQuery })}
      </Card>

      <Card
        title="2. 维度与统计字段"
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
            <Typography.Text type="secondary">视图保存内容：筛选条件 + 维度 + 统计字段</Typography.Text>
          </Space>
        </div>
      </Card>

      <Card title="3. 表格展示">
        <Table<T>
          rowKey={rowKey as any}
          columns={tableColumns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={dimensionCount}>当前页合计</Table.Summary.Cell>
                {metricTableColumns.map((col, idx) => {
                  const key = typeof col.dataIndex === 'string' ? col.dataIndex : '';
                  const metric = metricMap[key];
                  const raw = currentTotals[key];
                  const content = metric
                    ? metric.formatter
                      ? metric.formatter(raw)
                      : raw.toLocaleString()
                    : '-';
                  return (
                    <Table.Summary.Cell index={idx + 1} key={`curr-${String(col.key || key || idx)}`}>
                      {content}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={dimensionCount}>总数据合计</Table.Summary.Cell>
                {metricTableColumns.map((col, idx) => {
                  const key = typeof col.dataIndex === 'string' ? col.dataIndex : '';
                  const metric = metricMap[key];
                  const raw = grandTotals[key] ?? 0;
                  const content = metric
                    ? metric.formatter
                      ? metric.formatter(raw)
                      : raw.toLocaleString()
                    : '-';
                  return (
                    <Table.Summary.Cell index={idx + 1} key={`grand-${String(col.key || key || idx)}`}>
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
