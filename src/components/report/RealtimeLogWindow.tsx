import { PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, InputNumber, Space, Switch, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ESTIMATED_ROW_HEIGHT = 20;

const isAtBottom = (el: HTMLDivElement | null, threshold = 8) => {
  if (!el) return true;
  return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
};

const isAtTop = (el: HTMLDivElement | null, threshold = 8) => {
  if (!el) return true;
  return el.scrollTop <= threshold;
};

export type RealtimeLogFetchResult<T> = {
  rows: T[];
  total: number;
  page?: number;
  pageSize?: number;
};

type RealtimeLogWindowProps<T> = {
  fetchData: (args: { page: number; pageSize: number }) => Promise<RealtimeLogFetchResult<T> | null | undefined>;
  formatLine: (row: T) => string;
  rowKey?: (row: T, index: number) => string;
  extraToolbar?: React.ReactNode;
  summaryText?: React.ReactNode;
  canFetch?: boolean;
  onFetchBlocked?: () => void;
  emptyText?: string;
  detailTitle?: string;
  queryKey?: string | number | boolean;
  initialPageSize?: number;
  autoRefreshInterval?: number;
};

function RealtimeLogWindow<T>(props: RealtimeLogWindowProps<T>) {
  const {
    fetchData,
    formatLine,
    rowKey,
    extraToolbar,
    summaryText,
    canFetch = true,
    onFetchBlocked,
    emptyText = '-',
    detailTitle = '上报详情',
    queryKey,
    initialPageSize = 50,
    autoRefreshInterval = 3000,
  } = props;

  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [pausedByScroll, setPausedByScroll] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [total, setTotal] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const fetchLockRef = useRef(false);
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);
  const pausedByScrollRef = useRef(false);
  const upwardScrolledRowsRef = useRef(0);

  const maxPage = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  const doFetch = useCallback(async () => {
    if (!canFetch || fetchLockRef.current) return;
    fetchLockRef.current = true;
    setLoading(true);
    try {
      const result = await fetchData({ page: currentPage, pageSize });
      if (!result) return;

      const nextRows = Array.isArray(result.rows) ? result.rows : [];
      const nextTotal = Number(result.total ?? nextRows.length);
      const nextPage = Number(result.page ?? currentPage) || currentPage;
      const nextPageSize = Number(result.pageSize ?? pageSize) || pageSize;

      setRows(nextRows);
      setTotal(Number.isFinite(nextTotal) ? nextTotal : 0);

      if (nextPage !== currentPage) {
        setCurrentPage(Math.max(1, nextPage));
      }
      if (nextPageSize !== pageSize) {
        setPageSize(Math.min(200, Math.max(1, nextPageSize)));
      }
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
    }
  }, [canFetch, currentPage, fetchData, pageSize]);

  useEffect(() => {
    if (!canFetch) {
      setRows([]);
      setTotal(0);
      return;
    }
    doFetch();
  }, [canFetch, doFetch]);

  useEffect(() => {
    setCurrentPage(1);
    upwardScrolledRowsRef.current = 0;
  }, [queryKey]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!autoRefresh || !canFetch) return;
    timerRef.current = window.setInterval(() => {
      if (pausedByScrollRef.current) return;
      doFetch();
    }, autoRefreshInterval);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, autoRefreshInterval, canFetch, doFetch]);

  useEffect(() => {
    if (!autoRefresh || pausedByScrollRef.current) return;
    const el = scrollBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [rows, autoRefresh]);

  const handleScroll = () => {
    const atBottom = isAtBottom(scrollBoxRef.current);
    pausedByScrollRef.current = !atBottom;
    setPausedByScroll(!atBottom);
    if (!isAtTop(scrollBoxRef.current)) {
      upwardScrolledRowsRef.current = 0;
    }
  };

  const getScrolledRows = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaMode === 1) return Math.abs(event.deltaY);
    if (event.deltaMode === 2) return Math.abs(event.deltaY) * pageSize;
    return Math.abs(event.deltaY) / ESTIMATED_ROW_HEIGHT;
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const el = scrollBoxRef.current;
    if (!el) return;

    if (event.deltaY < 0) {
      if (isAtTop(el)) {
        upwardScrolledRowsRef.current += getScrolledRows(event);
        if (upwardScrolledRowsRef.current >= pageSize && currentPage < maxPage) {
          upwardScrolledRowsRef.current = 0;
          setCurrentPage((prev) => Math.min(maxPage, prev + 1));
          pausedByScrollRef.current = true;
          setPausedByScroll(true);
        }
      }
      return;
    }

    upwardScrolledRowsRef.current = 0;
    if (event.deltaY > 0 && isAtBottom(el) && currentPage > 1) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  return (
    <Card>
      <Space wrap style={{ marginBottom: 12 }}>
        {extraToolbar}
        <InputNumber
          min={1}
          max={200}
          value={pageSize}
          onChange={(value) => {
            const next = Math.min(200, Math.max(1, Number(value ?? initialPageSize)));
            setPageSize(next);
            setCurrentPage(1);
          }}
          addonBefore="页大小"
          style={{ width: 160 }}
        />
        <Button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1}>
          更新页
        </Button>
        <Button onClick={() => setCurrentPage((prev) => Math.min(maxPage, prev + 1))} disabled={currentPage >= maxPage}>
          历史页
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            if (!canFetch) {
              onFetchBlocked?.();
              return;
            }
            doFetch();
          }}
          loading={loading}
        >
          手动刷新
        </Button>
        <Switch
          checked={autoRefresh}
          onChange={setAutoRefresh}
          checkedChildren={<PlayCircleOutlined />}
          unCheckedChildren={<PauseCircleOutlined />}
          disabled={!canFetch}
        />
        <Tag color={autoRefresh ? 'processing' : 'default'}>{autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}</Tag>
        {pausedByScroll ? <Tag color="warning">已离开底部，自动刷新暂停</Tag> : null}
        {summaryText ? <Typography.Text type="secondary">{summaryText}</Typography.Text> : null}
        <Typography.Text type="secondary">
          当前页 {currentPage} / {maxPage}，页大小 {pageSize}，本页 {rows.length} 条，总计 {total} 条
        </Typography.Text>
      </Space>

      <div
        ref={scrollBoxRef}
        onWheel={handleWheel}
        onScroll={handleScroll}
        style={{
          height: '68vh',
          overflowY: 'auto',
          background: '#0f172a',
          color: '#e2e8f0',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #1e293b',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {!canFetch ? <Typography.Text type="secondary">{emptyText}</Typography.Text> : null}
        {canFetch
          ? rows.map((row, idx) => {
              const line = formatLine(row);
              const key = rowKey ? rowKey(row, idx) : `${idx}_${line.slice(0, 24)}`;
              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedRow(row);
                    setDetailOpen(true);
                  }}
                  style={{
                    cursor: 'pointer',
                    whiteSpace: 'pre-wrap',
                    borderBottom: '1px dashed #1e293b',
                    padding: '2px 0',
                  }}
                  title="点击查看完整详情"
                >
                  {line}
                </div>
              );
            })
          : null}
      </div>

      <Drawer title={detailTitle} width={760} open={detailOpen} onClose={() => setDetailOpen(false)} destroyOnHidden>
        <pre
          style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
          }}
        >
          {selectedRow ? JSON.stringify(selectedRow, null, 2) : '-'}
        </pre>
      </Drawer>
    </Card>
  );
}

export default RealtimeLogWindow;
