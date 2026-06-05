import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { FunnelPlotOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SortOrder } from 'antd/es/table/interface';
import ViewManager from './ViewManager';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
  visibleFilterDimensions: string[];
  metrics: string[];
  sorter?: ReportSorter;
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
  summary?: Record<string, unknown>;
}

interface ReportSorter {
  field?: string;
  columnKey?: string;
  order?: SortOrder;
}

interface UniversalReportTableProps<T extends AnyRecord, Q extends AnyRecord> {
  storageKey: string;
  title: string;
  rowKey: string | ((record: T) => React.Key);
  defaultQuery: Q;
  defaultDimensions: string[];
  defaultMetrics: string[];
  dimensionOptions: DimensionOption<T>[];
  metricOptions: MetricOption<T>[];
  defaultPageSize?: number;
  normalizeDimensionValue?: (value: string) => string;
  normalizeMetricValue?: (value: string) => string;
  hideSummaryRows?: boolean;
  showCurrentSummary?: boolean;
  showGrandSummary?: boolean;
  enableServerSort?: boolean;
  /**
   * 应用已保存视图时，对 query 做一次变换（例如按 dateRangePreset 重算动态日期）。
   * 返回变换后的 query，不传则直接使用原始 query。
   */
  transformViewQuery?: (query: Q) => Q;
  renderFilters: (args: {
    query: Q;
    setQuery: React.Dispatch<React.SetStateAction<Q>>;
    dimensions: string[];
    visibleFilterDimensions: string[];
  }) => React.ReactNode;
  fetchData: (args: {
    query: Q;
    page: number;
    pageSize: number;
    dimensions: string[];
    sorter?: ReportSorter;
  }) => Promise<ReportFetchResult<T>>;
  fetchGrandTotals?: (args: { query: Q; dimensions: string[]; sorter?: ReportSorter }) => Promise<Record<string, unknown>>;
}

function normalizeDimensionValues(
  rawValues: string[],
  validValues: Set<string>,
  fallbackValues: string[],
  normalizeValue?: (value: string) => string,
) {
  const uniq: string[] = [];
  const pushIfValid = (value: string) => {
    const normalized = normalizeValue ? normalizeValue(value) : value;
    if (!validValues.has(normalized) || uniq.includes(normalized)) return;
    uniq.push(normalized);
  };

  rawValues.forEach((item) => pushIfValid(item));
  if (uniq.length) return uniq;
  fallbackValues.forEach((item) => pushIfValid(item));
  return uniq;
}

function normalizeMetricValues(
  rawValues: string[],
  validValues: Set<string>,
  fallbackValues: string[],
  normalizeValue?: (value: string) => string,
) {
  const uniq: string[] = [];
  const pushIfValid = (value: string) => {
    const normalized = normalizeValue ? normalizeValue(value) : value;
    if (!validValues.has(normalized) || uniq.includes(normalized)) return;
    uniq.push(normalized);
  };

  rawValues.forEach((value) => {
    pushIfValid(value);
  });
  if (uniq.length) return uniq;
  fallbackValues.forEach((value) => {
    pushIfValid(value);
  });
  return uniq;
}

function safeNumber(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function renderSummaryValue(raw: unknown, formatter?: MetricFormatter) {
  if (formatter) return formatter(safeNumber(raw));
  if (raw === null || raw === undefined || raw === '') return '--';
  if (typeof raw === 'number') return raw.toLocaleString();
  return String(raw);
}

function normalizePageSize(value: unknown, fallback: number) {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function toSnakeCase(value: string) {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function getDataIndexValue(record: AnyRecord, dataIndex: unknown) {
  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce<any>((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key as keyof typeof acc];
    }, record);
  }
  if (typeof dataIndex === 'string' || typeof dataIndex === 'number') {
    return record[dataIndex as keyof AnyRecord];
  }
  return undefined;
}

function getColumnSortField(column: ProColumns<any>, fallbackKey: string) {
  const dataIndex = (column as any).dataIndex;
  if (Array.isArray(dataIndex)) {
    return dataIndex.map((item) => String(item)).join('.');
  }
  if (typeof dataIndex === 'string' || typeof dataIndex === 'number') {
    return String(dataIndex);
  }
  return fallbackKey;
}

function normalizeSortKey(value?: string) {
  if (!value) return undefined;
  return value.replace(/^(d:|m:)/, '');
}

function normalizeSorter(input: any): ReportSorter | undefined {
  const source = Array.isArray(input)
    ? [...input].reverse().find((item) => item?.order)
    : input;
  if (!source || !source.order) return undefined;
  const order = source.order as SortOrder;
  if (order !== 'ascend' && order !== 'descend') return undefined;
  const normalizedField = normalizeSortKey(source.field ? String(source.field) : undefined);
  const normalizedColumnKey = normalizeSortKey(source.columnKey ? String(source.columnKey) : undefined);
  return {
    field: normalizedField || normalizedColumnKey,
    columnKey: normalizedColumnKey || normalizedField,
    order,
  };
}

function isSameSorter(a?: ReportSorter, b?: ReportSorter) {
  return a?.field === b?.field && a?.columnKey === b?.columnKey && a?.order === b?.order;
}

function readLocalState<Q extends AnyRecord>(storageKey: string, fallback: Q, defaultDimensions: string[], defaultPageSize: number) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        query: fallback,
        dimensions: defaultDimensions,
        visibleFilterDimensions: [],
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
      visibleFilterDimensions?: string[];
      metrics?: string[];
      pageSize?: number;
      savedViews?: SavedView<Q>[];
      columnsStateMap?: ColumnStateMap;
    };
    const dimensions = Array.isArray(parsed.dimensions)
      ? parsed.dimensions
      : parsed.dimension
        ? [parsed.dimension]
        : defaultDimensions;
    const sanitizeSavedView = (item: any): SavedView<Q> | null => {
      if (!item || typeof item !== 'object') return null;
      return {
        id: String(item.id ?? Date.now()),
        name: String(item.name ?? '未命名视图'),
        query: (item.query ?? fallback) as Q,
        dimensions: Array.isArray(item.dimensions) ? item.dimensions : defaultDimensions,
        visibleFilterDimensions: Array.isArray(item.visibleFilterDimensions)
          ? item.visibleFilterDimensions
          : [],
        metrics: Array.isArray(item.metrics) ? item.metrics : [],
        sorter: normalizeSorter(item.sorter),
        columnsStateMap:
          item.columnsStateMap && typeof item.columnsStateMap === 'object'
            ? item.columnsStateMap
            : {},
      };
    };
    const visibleFilterDimensions = Array.isArray(parsed.visibleFilterDimensions)
      ? parsed.visibleFilterDimensions
      : [];
    const metrics = Array.isArray(parsed.metrics) ? parsed.metrics : [];
    const savedViews = Array.isArray(parsed.savedViews)
      ? parsed.savedViews.map((item) => sanitizeSavedView(item)).filter(Boolean) as SavedView<Q>[]
      : [];
    const pageSize = normalizePageSize(parsed.pageSize, defaultPageSize);
    return {
      query: parsed.query ?? fallback,
      dimensions,
      visibleFilterDimensions,
      metrics,
      pageSize,
      savedViews,
      columnsStateMap: parsed.columnsStateMap ?? {},
    };
  } catch {
    return {
      query: fallback,
      dimensions: defaultDimensions,
      visibleFilterDimensions: [],
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
  visibleFilterDimensions: string[],
  metrics: string[],
  pageSize: number,
  savedViews: SavedView<Q>[],
  columnsStateMap: ColumnStateMap,
) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      query,
      dimensions,
      visibleFilterDimensions,
      metrics,
      pageSize,
      savedViews,
      columnsStateMap,
    }),
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
    normalizeDimensionValue,
    normalizeMetricValue,
    hideSummaryRows = false,
    showCurrentSummary = false,
    showGrandSummary = false,
    enableServerSort = false,
    renderFilters,
    fetchData,
    fetchGrandTotals,
    transformViewQuery,
  } = props;

  const persisted = readLocalState(storageKey, defaultQuery, defaultDimensions, defaultPageSize);
  const validDimensionValues = useMemo(() => new Set(dimensionOptions.map((item) => item.value)), [dimensionOptions]);
  const validMetricValues = useMemo(() => new Set(metricOptions.map((item) => item.value)), [metricOptions]);

  const normalizeDimensions = useCallback(
    (rawValues: string[]) =>
      normalizeDimensionValues(rawValues, validDimensionValues, defaultDimensions, normalizeDimensionValue),
    [validDimensionValues, defaultDimensions, normalizeDimensionValue],
  );

  const normalizeMetrics = useCallback(
    (rawValues: string[]) =>
      normalizeMetricValues(rawValues, validMetricValues, defaultMetrics, normalizeMetricValue),
    [validMetricValues, defaultMetrics, normalizeMetricValue],
  );

  const initialDimensions = normalizeDimensions(persisted.dimensions.length ? persisted.dimensions : defaultDimensions);
  const initialVisibleFilterDimensions = normalizeDimensions(
    persisted.visibleFilterDimensions?.length ? persisted.visibleFilterDimensions : dimensionOptions.map((item) => item.value),
  );
  const initialMetrics = persisted.metrics.length
    ? normalizeMetrics(persisted.metrics)
    : normalizeMetrics(defaultMetrics);

  const [query, setQuery] = useState<Q>(persisted.query);
  const [appliedQuery, setAppliedQuery] = useState<Q>(persisted.query);
  const [dimensions, setDimensions] = useState<string[]>(initialDimensions.length ? initialDimensions : defaultDimensions);
  const [appliedDimensions, setAppliedDimensions] = useState<string[]>(
    initialDimensions.length ? initialDimensions : defaultDimensions,
  );
  const [visibleFilterDimensions, setVisibleFilterDimensions] = useState<string[]>(
    initialVisibleFilterDimensions.length
      ? initialVisibleFilterDimensions
      : normalizeDimensions(dimensionOptions.map((item) => item.value)),
  );
  const [metrics, setMetrics] = useState<string[]>(
    initialMetrics.length ? initialMetrics : normalizeMetrics(defaultMetrics),
  );
  const [savedViews, setSavedViews] = useState<SavedView<Q>[]>(
    Array.isArray(persisted.savedViews) ? persisted.savedViews : [],
  );
  const [columnsStateMap, setColumnsStateMap] = useState<ColumnStateMap>(persisted.columnsStateMap ?? {});
  const [selectedViewId, setSelectedViewId] = useState<string>();
  const [saveViewName, setSaveViewName] = useState('');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameModalName, setRenameModalName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(persisted.pageSize);
  const [total, setTotal] = useState(0);
  const [grandTotals, setGrandTotals] = useState<Record<string, unknown>>({});
  const [reloadToken, setReloadToken] = useState(0);
  const [sorter, setSorter] = useState<ReportSorter | undefined>(undefined);

  useEffect(() => {
    writeLocalState(
      storageKey,
      query,
      dimensions,
      visibleFilterDimensions,
      metrics,
      pageSize,
      savedViews,
      columnsStateMap,
    );
  }, [storageKey, query, dimensions, visibleFilterDimensions, metrics, pageSize, savedViews, columnsStateMap]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchData({
          query: appliedQuery,
          page: current,
          pageSize: normalizePageSize(pageSize, defaultPageSize),
          dimensions: appliedDimensions,
          sorter: enableServerSort ? sorter : undefined,
        });
        if (!alive) return;
        setData(result.list || []);
        setTotal(result.total || 0);
        if (showGrandSummary) {
          setGrandTotals(result.summary || {});
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [enableServerSort, fetchData, appliedQuery, current, pageSize, appliedDimensions, sorter, reloadToken, defaultPageSize, showGrandSummary]);

  useEffect(() => {
    if (!enableServerSort && sorter) {
      setSorter(undefined);
    }
  }, [enableServerSort, sorter]);

  useEffect(() => {
    if (!showGrandSummary || !fetchGrandTotals) return;
    let alive = true;
    const run = async () => {
      const totals = await fetchGrandTotals({
        query: appliedQuery,
        dimensions: appliedDimensions,
        sorter: enableServerSort ? sorter : undefined,
      });
      if (alive) {
        setGrandTotals(totals || {});
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [showGrandSummary, fetchGrandTotals, appliedQuery, appliedDimensions, sorter, reloadToken, enableServerSort]);

  const dimColumns = useMemo<ActiveColumn<T>[]>(
    () =>
      appliedDimensions
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
    [appliedDimensions, dimensionOptions],
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

  // 只由列结构（哪些列、列的 key/dataIndex）决定，不含 sortOrder，
  // 避免 sorter 变化时 ProTable key 变化导致整体重新挂载
  const tableStructureKey = useMemo(
    () =>
      JSON.stringify(
        activeColumns.map((item) => {
          const col = item.column as any;
          const fallbackKey = String(col.key ?? item.id);
          const sortField = getColumnSortField(col, fallbackKey);
          const key = sortField || fallbackKey;
          return { key, sortField: String(col.dataIndex ?? key) };
        }),
      ),
    [activeColumns],
  );

  const resolveBaseRowKey = useCallback(
    (record: T) => {
      const dimensionValues = dimColumns
        .map((item) => {
          const columnDataIndex = (item.column as any).dataIndex;
          const fromDataIndex = getDataIndexValue(record, columnDataIndex);
          if (fromDataIndex !== undefined && fromDataIndex !== null && fromDataIndex !== '') {
            return String(fromDataIndex);
          }
          const fromDimension = record[item.value as keyof T];
          if (fromDimension !== undefined && fromDimension !== null && fromDimension !== '') {
            return String(fromDimension);
          }
          const fromSnakeDimension = record[toSnakeCase(item.value) as keyof T];
          if (fromSnakeDimension !== undefined && fromSnakeDimension !== null && fromSnakeDimension !== '') {
            return String(fromSnakeDimension);
          }
          return '';
        })
        .filter(Boolean);

      if (dimensionValues.length) {
        return dimensionValues.join('|');
      }

      if (typeof rowKey === 'function') {
        const key = rowKey(record);
        if (key !== undefined && key !== null && key !== '') {
          return String(key);
        }
      } else {
        const key = record[rowKey as keyof T];
        if (key !== undefined && key !== null && key !== '') {
          return String(key);
        }
      }

      return 'row-fallback';
    },
    [dimColumns, rowKey],
  );

  const rowKeyMap = useMemo(() => {
    const map = new WeakMap<T, string>();
    const duplicatedCountMap = new Map<string, number>();

    data.forEach((record) => {
      const baseKey = resolveBaseRowKey(record);
      const currentCount = duplicatedCountMap.get(baseKey) ?? 0;
      duplicatedCountMap.set(baseKey, currentCount + 1);
      const uniqueKey = currentCount === 0 ? baseKey : `${baseKey}__${currentCount + 1}`;
      map.set(record, uniqueKey);
    });

    return map;
  }, [data, resolveBaseRowKey]);

  const resolvedRowKey = useCallback((record: T) => rowKeyMap.get(record) || resolveBaseRowKey(record), [rowKeyMap, resolveBaseRowKey]);

  const tableColumns = useMemo<ProColumns<T>[]>(
    () =>
      activeColumns.map((item, index) => {
        const fallbackKey = String((item.column as any).key ?? item.id);
        const originalColumn = item.column as ProColumns<T>;
        const sortField = getColumnSortField(originalColumn, fallbackKey);
        const key = sortField || `${fallbackKey}-${index}`;
        const normalizedKey = normalizeSortKey(key);
        const normalizedSortField = normalizeSortKey(sortField);
        const normalizedSorterField = normalizeSortKey(sorter?.field);
        const normalizedSorterColumnKey = normalizeSortKey(sorter?.columnKey);
        const isCurrentSortColumn =
          normalizedSorterColumnKey === normalizedKey ||
          normalizedSorterColumnKey === normalizedSortField ||
          normalizedSorterField === normalizedSortField ||
          normalizedSorterField === normalizedKey;
        return {
          ...originalColumn,
          key,
          sorter: enableServerSort ? originalColumn.sorter ?? true : undefined,
          sortOrder: enableServerSort && isCurrentSortColumn ? sorter?.order : undefined,
        };
      }),
    [activeColumns, enableServerSort, sorter],
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
    return summaryMetrics.reduce<Record<string, unknown>>((acc, item) => {
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
    setAppliedDimensions(dimensions);
  };

  const handleReset = () => {
    setQuery(defaultQuery);
    setAppliedQuery(defaultQuery);
    const nextDefaultDimensions = normalizeDimensions(defaultDimensions);
    setDimensions(nextDefaultDimensions.length ? nextDefaultDimensions : defaultDimensions);
    setAppliedDimensions(nextDefaultDimensions.length ? nextDefaultDimensions : defaultDimensions);
    setVisibleFilterDimensions(normalizeDimensions(dimensionOptions.map((item) => item.value)));
    setMetrics(normalizeMetrics(defaultMetrics));
    setSorter(undefined);
    setColumnsStateMap({});
    setCurrent(1);
    setPageSize(defaultPageSize);
  };

  const handleSaveView = () => {
    const name = saveViewName.trim() || savedViews.find((v) => v.id === selectedViewId)?.name || '';
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
      visibleFilterDimensions,
      metrics,
      sorter,
      columnsStateMap,
    };
    const rest = savedViews.filter((item) => item.name !== name);
    const nextViews = [nextView, ...rest].slice(0, 20);
    setSavedViews(nextViews);
    setSelectedViewId(nextView.id);
    setSaveViewName('');
    setIsAdding(false);
    message.success(existed ? '已覆盖同名视图' : '视图已保存');
  };

  const handleApplyView = (id: string) => {
    const target = savedViews.find((item) => item.id === id);
    if (!target) return;
    setSelectedViewId(id);
    const resolvedQuery = transformViewQuery ? transformViewQuery(target.query) : target.query;
    setQuery(resolvedQuery);
    setAppliedQuery(resolvedQuery);
    const nextDimensions = normalizeDimensions(target.dimensions);
    const nextVisibleFilterDimensions = target.visibleFilterDimensions?.length
      ? normalizeDimensions(target.visibleFilterDimensions)
      : normalizeDimensions(dimensionOptions.map((item) => item.value));
    const nextMetrics = normalizeMetrics(target.metrics);
    setDimensions(nextDimensions.length ? nextDimensions : defaultDimensions);
    setAppliedDimensions(nextDimensions.length ? nextDimensions : defaultDimensions);
    setVisibleFilterDimensions(
      nextVisibleFilterDimensions.length
        ? nextVisibleFilterDimensions
        : normalizeDimensions(dimensionOptions.map((item) => item.value)),
    );
    setMetrics(nextMetrics.length ? nextMetrics : normalizeMetrics(defaultMetrics));
    if (target.sorter?.order) {
      const restoredField = target.sorter.field || target.sorter.columnKey;
      setSorter({
        field: restoredField,
        columnKey: restoredField,
        order: target.sorter.order,
      });
    } else {
      setSorter(undefined);
    }
    setColumnsStateMap(target.columnsStateMap ?? {});
    setCurrent(1);
  };

  const handleRenameView = () => {
    if (!selectedViewId) return;
    const name = renameModalName.trim();
    if (!name) {
      message.warning('请输入视图名称');
      return;
    }
    const duplicated = savedViews.some((item) => item.name === name && item.id !== selectedViewId);
    if (duplicated) {
      message.warning('视图名称已存在');
      return;
    }
    const nextViews = savedViews.map((item) =>
      item.id === selectedViewId ? { ...item, name } : item,
    );
    setSavedViews(nextViews);
    setRenameModalOpen(false);
    message.success('视图已重命名');
  };

  const handleDeleteView = () => {
    if (!selectedViewId) {
      message.warning('请先选择要删除的视图');
      return;
    }
    const nextViews = savedViews.filter((item) => item.id !== selectedViewId);
    setSavedViews(nextViews);
    setSelectedViewId(undefined);
    message.success('视图已删除');
  };

  const pagination: TablePaginationConfig = {
    current,
    pageSize: normalizePageSize(pageSize, defaultPageSize),
    total,
    showSizeChanger: true,
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space wrap>
            <Typography.Text type="secondary">维度</Typography.Text>
            {dimensionOptions.map((item) => {
              const dimSelected = dimensions.includes(item.value);
              const filterVisible = visibleFilterDimensions.includes(item.value);
              return (
              <span key={item.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <Tag.CheckableTag
                  checked={dimSelected}
                  style={{ marginInlineEnd: 0 }}
                  onChange={(checked) => {
                    const next = checked ? [...dimensions, item.value] : dimensions.filter((v) => v !== item.value);
                    const normalized = next.length ? Array.from(new Set(next)) : defaultDimensions;
                    setDimensions(normalized);
                  }}
                >
                  {item.label}
                </Tag.CheckableTag>
                <Tag.CheckableTag
                  checked={filterVisible}
                  style={{
                    marginInlineEnd: 0,
                    color: filterVisible ? '#ffffff' : 'rgba(0,0,0,0.65)',
                    background: filterVisible ? '#fa8c16' : 'transparent',
                    border: 'none',
                  }}
                  onChange={(checked) => {
                    if (checked) {
                      setVisibleFilterDimensions((prev) => Array.from(new Set([...prev, item.value])));
                      return;
                    }
                    setVisibleFilterDimensions((prev) => prev.filter((value) => value !== item.value));
                  }}
                >
                  <Tooltip title="筛选">
                    <FunnelPlotOutlined />
                  </Tooltip>
                </Tag.CheckableTag>
              </span>
            );})}
          </Space>
          <Space wrap>
            <Typography.Text type="secondary">统计字段</Typography.Text>
            {metricOptions.map((item) => (
              <Tag.CheckableTag
                key={item.value}
                checked={metrics.includes(item.value)}
                onChange={(checked) => {
                  const next = checked ? [...metrics, item.value] : metrics.filter((v) => v !== item.value);
                  const normalizedMetrics = normalizeMetrics(Array.from(new Set(next)));
                  setMetrics(normalizedMetrics.length ? normalizedMetrics : normalizeMetrics(defaultMetrics));
                  setCurrent(1);
                }}
              >
                {item.label}
              </Tag.CheckableTag>
            ))}
          </Space>
        </Space>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #f0f0f0', lineHeight: '28px' }}>
          <div style={{ marginTop: 4 }}>
            {renderFilters({ query, setQuery, dimensions, visibleFilterDimensions })}
          </div>
        </div>

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Space wrap>
              <ViewManager
                views={savedViews.map(({ id, name }) => ({ id, name }))}
                selectedId={selectedViewId}
                saveInputValue={saveViewName}
                renameModalOpen={renameModalOpen}
                renameInputValue={renameModalName}
                isAdding={isAdding}
                onStartAdd={() => setIsAdding(true)}
                onCancelAdd={() => { setIsAdding(false); setSaveViewName(''); }}
                onSelect={(id) => {
                  if (!id) {
                    setSelectedViewId(undefined);
                    return;
                  }
                  setIsAdding(false);
                  setSaveViewName('');
                  handleApplyView(id);
                }}
                onSave={handleSaveView}
                onSaveInputChange={setSaveViewName}
                onOpenRename={() => {
                  const target = savedViews.find((v) => v.id === selectedViewId);
                  setRenameModalName(target?.name || '');
                  setRenameModalOpen(true);
                }}
                onRenameInputChange={setRenameModalName}
                onRenameConfirm={handleRenameView}
                onRenameCancel={() => setRenameModalOpen(false)}
                onDelete={handleDeleteView}
              />
            </Space>

            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                查询
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <Card>
        <ProTable<T>
          rowKey={resolvedRowKey as any}
          columns={tableColumns}
          dataSource={data}
          loading={loading}
          search={false}
          toolBarRender={() => []}
          options={{
            reload: () => {
              setAppliedDimensions(dimensions);
              setReloadToken((value) => value + 1);
            },
            density: false,
            fullScreen: false,
            setting: { draggable: true },
          }}
          columnsState={{
            value: columnsStateMap,
            onChange: (map) => setColumnsStateMap((map || {}) as ColumnStateMap),
          }}
          pagination={pagination}
          scroll={{ x: 'max-content' }}
          onChange={(nextPagination, _filters, nextSorter) => {
            const nextPageSize = normalizePageSize(nextPagination?.pageSize, defaultPageSize);
            const pageSizeChanged = nextPageSize !== pageSize;

            if (pageSizeChanged) {
              setPageSize(nextPageSize);
              setCurrent(1);
            }

            if (enableServerSort) {
              const normalizedSorter = normalizeSorter(nextSorter);
              if (!isSameSorter(sorter, normalizedSorter)) {
                setSorter(normalizedSorter);
                setCurrent(1);
                return;
              }
            }

            const nextPage = nextPagination?.current ?? 1;
            if (!pageSizeChanged && nextPage !== current) {
              setCurrent(nextPage);
            }
          }}
          key={tableStructureKey}
          summary={hideSummaryRows || (!showCurrentSummary && !showGrandSummary) ? undefined : () => (
            <Table.Summary>
              {showCurrentSummary ? (
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
                    const content = renderSummaryValue(raw, metric?.formatter);
                    return (
                      <Table.Summary.Cell index={idx} key={`curr-${col.key}`}>
                        {content}
                      </Table.Summary.Cell>
                    );
                  })}
                </Table.Summary.Row>
              ) : null}
              {showGrandSummary ? (
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
                    const content = renderSummaryValue(raw, metric?.formatter);
                    return (
                      <Table.Summary.Cell index={idx} key={`grand-${col.key}`}>
                        {content}
                      </Table.Summary.Cell>
                    );
                  })}
                </Table.Summary.Row>
              ) : null}
            </Table.Summary>
          )}
        />
      </Card>
    </Space>
  );
}

export default UniversalReportTable;
