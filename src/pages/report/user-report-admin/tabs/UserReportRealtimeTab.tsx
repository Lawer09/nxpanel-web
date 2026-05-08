import { PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Input, InputNumber, Space, Switch, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getUserReportRealtime } from '@/services/performance/api';

const MAX_PREVIEW_LEN = 120;
const ESTIMATED_ROW_HEIGHT = 20;

const previewText = (value: unknown) => {
  if (value == null) return '-';
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return raw.length > MAX_PREVIEW_LEN ? `${raw.slice(0, MAX_PREVIEW_LEN)}...` : raw;
};

const extractUserDefaultTypes = (value: unknown) => {
  if (!Array.isArray(value)) return '-';
  const types = value
    .map((item) => {
      if (item && typeof item === 'object' && 'type' in (item as Record<string, unknown>)) {
        return String((item as Record<string, unknown>).type ?? '').trim();
      }
      return '';
    })
    .filter(Boolean);
  if (!types.length) return '-';
  return previewText(types.join(','));
};

const isAtBottom = (el: HTMLDivElement | null, threshold = 8) => {
  if (!el) return true;
  return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
};

const isAtTop = (el: HTMLDivElement | null, threshold = 8) => {
  if (!el) return true;
  return el.scrollTop <= threshold;
};

const formatRealtimeLine = (record: API.UserReportRealtimeItem) => {
  const appId = String(record.metadata?.app_id ?? '-');
  const userId = String(record.user_id ?? '-');
  const ip = record.ip || '-';
  const ts = record.created_at || '-';
  const reportCount = Array.isArray(record.reports) ? record.reports.length : undefined;
  const userDefaultPreview = extractUserDefaultTypes(record.user_default);
  const reportsPreview = previewText(record.reports);
  return `[${ts}] app_id=${appId} user_id=${userId} ip=${ip}${reportCount !== undefined ? ` reports=${reportCount}` : ''} user_default_types=${userDefaultPreview} reports_data=${reportsPreview}`;
};

const UserReportRealtimeTab: React.FC = () => {
  const [appIdFilter, setAppIdFilter] = useState<string | undefined>();
  const [appIdInput, setAppIdInput] = useState('');
  const [rows, setRows] = useState<API.UserReportRealtimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [pausedByScroll, setPausedByScroll] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<API.UserReportRealtimeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
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

  const fetchWindow = useCallback(async () => {
    if (fetchLockRef.current) return;
    fetchLockRef.current = true;
    setLoading(true);
    try {
      const res = await getUserReportRealtime({
        page: currentPage,
        pageSize,
        appId: appIdFilter,
      });
      const payload = (res as any)?.data ?? res;
      const incoming = Array.isArray(payload?.data) ? payload.data : [];
      const nextTotal = Number(payload?.total ?? incoming.length);
      const nextPage = Number(payload?.page ?? currentPage) || currentPage;
      const nextPageSize = Number(payload?.pageSize ?? pageSize) || pageSize;

      setRows(incoming as API.UserReportRealtimeItem[]);
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
  }, [appIdFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchWindow();
  }, [fetchWindow]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!autoRefresh) return;
    timerRef.current = window.setInterval(() => {
      if (pausedByScrollRef.current) return;
      fetchWindow();
    }, 3000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, fetchWindow]);

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
    if (event.deltaMode === 1) {
      return Math.abs(event.deltaY);
    }
    if (event.deltaMode === 2) {
      return Math.abs(event.deltaY) * pageSize;
    }
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
        <Input
          placeholder="按 metadata.app_id 过滤"
          value={appIdInput}
          onChange={(e) => setAppIdInput(e.target.value)}
          onPressEnter={() => {
            setCurrentPage(1);
            setAppIdFilter(appIdInput.trim() || undefined);
          }}
          style={{ width: 260 }}
        />
        <Button
          onClick={() => {
            setCurrentPage(1);
            setAppIdFilter(appIdInput.trim() || undefined);
          }}
        >
          应用过滤
        </Button>
        <Button
          onClick={() => {
            setAppIdInput('');
            setCurrentPage(1);
            setAppIdFilter(undefined);
          }}
        >
          清空过滤
        </Button>
        <InputNumber
          min={1}
          max={200}
          value={pageSize}
          onChange={(value) => {
            const next = Math.min(200, Math.max(1, Number(value ?? 50)));
            setPageSize(next);
            setCurrentPage(1);
          }}
          addonBefore="页大小"
          style={{ width: 160 }}
        />
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage <= 1}
        >
          更新页
        </Button>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(maxPage, prev + 1))}
          disabled={currentPage >= maxPage}
        >
          历史页
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchWindow} loading={loading}>
          手动刷新
        </Button>
        <Switch
          checked={autoRefresh}
          onChange={setAutoRefresh}
          checkedChildren={<PlayCircleOutlined />}
          unCheckedChildren={<PauseCircleOutlined />}
        />
        <Tag color={autoRefresh ? 'processing' : 'default'}>{autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}</Tag>
        {pausedByScroll ? <Tag color="warning">已离开底部，自动刷新暂停</Tag> : null}
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
        {rows.map((row, idx) => {
          const line = formatRealtimeLine(row);
          const key = `${row.user_id}_${row.created_at}_${row.ip}_${idx}`;
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
        })}
      </div>

      <Drawer title="上报详情" width={760} open={detailOpen} onClose={() => setDetailOpen(false)} destroyOnClose>
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
};

export default UserReportRealtimeTab;
