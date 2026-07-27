import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { App, Card, Table, Typography } from 'antd';
import type { SortOrder } from 'antd/es/table/interface';
import React, { useEffect, useMemo, useState } from 'react';
import { queryAppConnectionReport } from '@/services/firebase-analytics/api';
import type {
  FirebaseAppConnectionReportItem,
  FirebaseAppConnectionReportOrderBy,
} from '@/services/firebase-analytics/types';
import { CARD_STYLE } from '../constants';

const { Text } = Typography;

type AppConnectionReportSectionProps = {
  projectCode: string;
  dateRange: [string, string];
  appVersions?: string[];
};

type SorterState = {
  field?: FirebaseAppConnectionReportOrderBy;
  order?: SortOrder;
};

type ColumnSummaryMeta = {
  key: string;
  kind: 'dimension' | 'metric';
  align?: 'left' | 'right' | 'center';
  formatter?: (value: unknown, record?: FirebaseAppConnectionReportItem | null) => React.ReactNode;
};

const normalizeStringList = (values?: string[]) => {
  if (!Array.isArray(values) || !values.length) return undefined;
  const normalized = values.map((item) => `${item}`.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const formatNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--';
  return Math.round(toNumber(value)).toLocaleString();
};

const formatPing = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--';
  return Math.round(toNumber(value)).toLocaleString();
};

const formatRate = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '--';
  return `${(toNumber(value) * 100).toFixed(2)}%`;
};

const renderText = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : value;
  return text ? String(text) : '--';
};

const toRequestOrder = (order?: SortOrder): 'asc' | 'desc' | undefined => {
  if (order === 'ascend') return 'asc';
  if (order === 'descend') return 'desc';
  return undefined;
};

const normalizeSorter = (input: any): SorterState | undefined => {
  const source = Array.isArray(input)
    ? [...input].reverse().find((item) => item?.order)
    : input;
  if (!source?.order) return undefined;

  const field = source.field || source.columnKey;
  if (!field) return undefined;

  return {
    field: String(field) as FirebaseAppConnectionReportOrderBy,
    order: source.order as SortOrder,
  };
};

const buildRowKey = (record: FirebaseAppConnectionReportItem) => {
  const parts = [record.date, record.appVersion].filter((item) => Boolean(item));
  return parts.length ? parts.join('|') : '__all__';
};

const AppConnectionReportSection: React.FC<AppConnectionReportSectionProps> = ({
  projectCode,
  dateRange,
  appVersions,
}) => {
  const { message } = App.useApp();
  const [rows, setRows] = useState<FirebaseAppConnectionReportItem[]>([]);
  const [summary, setSummary] = useState<FirebaseAppConnectionReportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sorter, setSorter] = useState<SorterState | undefined>();

  const normalizedVersions = useMemo(() => normalizeStringList(appVersions), [appVersions]);
  const versionFilterKey = normalizedVersions?.join('|') || '';
  const showVersionColumn = Boolean(normalizedVersions?.length);

  useEffect(() => {
    setPage(1);
    setSorter(undefined);
  }, [dateRange, projectCode, versionFilterKey]);

  useEffect(() => {
    let alive = true;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const res = await queryAppConnectionReport({
          dateFrom: dateRange[0],
          dateTo: dateRange[1],
          groupBy: showVersionColumn ? ['date', 'appVersion'] : ['date'],
          filters: {
            projectCodes: [projectCode],
            appVersions: normalizedVersions,
          },
          page,
          pageSize,
          orderBy: sorter?.field,
          orderDirection: toRequestOrder(sorter?.order),
        });

        if (!alive) return;

        const payload = res.data;
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setSummary(payload?.summary ?? null);
        setTotal(Number(payload?.total ?? 0));
      } catch (error: any) {
        if (alive) {
          message.error(error?.message || '获取应用连接明细失败');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void fetchRows();
    return () => {
      alive = false;
    };
  }, [dateRange, message, page, pageSize, projectCode, showVersionColumn, sorter, versionFilterKey]);

  const columnSummaryMeta = useMemo<ColumnSummaryMeta[]>(
    () => [
      { key: 'date', kind: 'dimension' },
      ...(showVersionColumn ? [{ key: 'appVersion', kind: 'dimension' as const }] : []),
      { key: 'avgPingMs', kind: 'metric', align: 'right', formatter: formatPing },
      { key: 'clientConnectCount', kind: 'metric', align: 'right', formatter: formatNumber },
      { key: 'successCount', kind: 'metric', align: 'right', formatter: formatNumber },
      { key: 'successRate', kind: 'metric', align: 'right', formatter: formatRate },
      { key: 'failCount', kind: 'metric', align: 'right', formatter: formatNumber },
      { key: 'failRate', kind: 'metric', align: 'right', formatter: formatRate },
      { key: 'cancelRate', kind: 'metric', align: 'right', formatter: formatRate },
      { key: 'activeUserCount', kind: 'metric', align: 'right', formatter: formatNumber },
    ],
    [showVersionColumn],
  );

  const columns = useMemo<ProColumns<FirebaseAppConnectionReportItem>[]>(
    () => [
      {
        title: '日期',
        dataIndex: 'date',
        width: 120,
        sorter: true,
        render: renderText,
      },
      ...(showVersionColumn
        ? [
            {
              title: '版本',
              dataIndex: 'appVersion',
              width: 130,
              sorter: true,
              render: renderText,
            } as ProColumns<FirebaseAppConnectionReportItem>,
          ]
        : []),
      {
        title: '平均 ping 值',
        dataIndex: 'avgPingMs',
        width: 130,
        align: 'right',
        sorter: true,
        render: formatPing,
      },
      {
        title: '客户端连接数',
        dataIndex: 'clientConnectCount',
        width: 150,
        align: 'right',
        sorter: true,
        render: formatNumber,
      },
      {
        title: '成功次数',
        dataIndex: 'successCount',
        width: 120,
        align: 'right',
        sorter: true,
        render: formatNumber,
      },
      {
        title: '成功率',
        dataIndex: 'successRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: formatRate,
      },
      {
        title: '失败次数',
        dataIndex: 'failCount',
        width: 120,
        align: 'right',
        sorter: true,
        render: formatNumber,
      },
      {
        title: '失败率',
        dataIndex: 'failRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: formatRate,
      },
      {
        title: '取消率',
        dataIndex: 'cancelRate',
        width: 110,
        align: 'right',
        sorter: true,
        render: formatRate,
      },
      {
        title: '活跃用户数',
        dataIndex: 'activeUserCount',
        width: 130,
        align: 'right',
        sorter: true,
        render: formatNumber,
      },
    ],
    [showVersionColumn],
  );

  return (
    <Card
      title="应用连接明细"
      style={CARD_STYLE}
      styles={{ body: { padding: 20 } }}
      extra={
        <Text type="secondary">
          {dateRange[0]} 至 {dateRange[1]}
          {normalizedVersions?.length ? ` / 版本：${normalizedVersions.join('、')}` : ''}
        </Text>
      }
    >
      <ProTable<FirebaseAppConnectionReportItem>
        rowKey={buildRowKey}
        columns={columns}
        dataSource={rows}
        loading={loading}
        search={false}
        options={{ reload: false, density: false, fullScreen: false, setting: false }}
        toolBarRender={() => []}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
        }}
        scroll={{ x: 'max-content' }}
        onChange={(pagination, _filters, nextSorter) => {
          const nextPageSize = Number(pagination.pageSize ?? pageSize);
          if (nextPageSize !== pageSize) {
            setPageSize(nextPageSize);
            setPage(1);
          } else {
            setPage(Number(pagination.current ?? 1));
          }

          const normalizedSorter = normalizeSorter(nextSorter);
          setSorter(normalizedSorter);
        }}
        summary={() =>
          summary ? (
            <Table.Summary>
              <Table.Summary.Row>
                {columnSummaryMeta.map((column, index) => {
                  if (index === 0) {
                    return (
                      <Table.Summary.Cell key={column.key} index={index} align="left">
                        总数据合计
                      </Table.Summary.Cell>
                    );
                  }
                  if (column.kind === 'dimension') {
                    return (
                      <Table.Summary.Cell key={column.key} index={index} align="left">
                        -
                      </Table.Summary.Cell>
                    );
                  }

                  return (
                    <Table.Summary.Cell key={column.key} index={index} align={column.align}>
                      {column.formatter?.(summary[column.key as keyof FirebaseAppConnectionReportItem], summary)}
                    </Table.Summary.Cell>
                  );
                })}
              </Table.Summary.Row>
            </Table.Summary>
          ) : undefined
        }
      />
    </Card>
  );
};

export default AppConnectionReportSection;
