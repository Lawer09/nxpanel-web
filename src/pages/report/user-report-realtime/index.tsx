import { PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Drawer, Input, InputNumber, Select, Space, Switch, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getUserReportCount, getUserReportDaily, getUserReportRealtime } from '@/services/performance/api';

const { RangePicker } = DatePicker;
const MAX_ROWS = 1000;
const MAX_PREVIEW_LEN = 120;

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

const formatTimeSlot = (record: API.UserReportCountItem) =>
  `${record.date} ${String(record.hour).padStart(2, '0')}:${String(record.minute).padStart(2, '0')}`;

const RealtimeUserReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'daily' | 'count'>('realtime');

  const [appIdFilter, setAppIdFilter] = useState<string | undefined>();
  const [appIdInput, setAppIdInput] = useState('');
  const [allRows, setAllRows] = useState<API.UserReportRealtimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [pausedByScroll, setPausedByScroll] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<API.UserReportRealtimeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const fetchLockRef = useRef(false);
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);
  const pausedByScrollRef = useRef(false);

  const dailyActionRef = useRef<ActionType | null>(null);
  const countActionRef = useRef<ActionType | null>(null);

  const [dailyUserId, setDailyUserId] = useState<number | undefined>();
  const [dailyDateRange, setDailyDateRange] = useState<[string, string] | undefined>();

  const [countUserId, setCountUserId] = useState<number | undefined>();
  const [countPlatform, setCountPlatform] = useState<string | undefined>();
  const [countAppId, setCountAppId] = useState<string | undefined>();
  const today = dayjs().format('YYYY-MM-DD');
  const [countDateRange, setCountDateRange] = useState<[string, string] | undefined>([today, today]);
  const [countOrderBy, setCountOrderBy] = useState<string | undefined>();
  const [countOrderDir, setCountOrderDir] = useState<string | undefined>();

  const realtimeData = useMemo(() => {
    const normalized = appIdFilter?.trim();
    if (!normalized) return allRows;
    return allRows.filter((item) => String(item.metadata?.app_id ?? '') === normalized);
  }, [allRows, appIdFilter]);

  const pullLatest = async () => {
    if (fetchLockRef.current) return;
    fetchLockRef.current = true;
    setLoading(true);
    try {
      const res = await getUserReportRealtime({ page: 1, pageSize: 200 });
      const payload = (res as any)?.data ?? res;
      const incoming = (payload?.data || []) as API.UserReportRealtimeItem[];
      if (!Array.isArray(incoming)) return;
      setAllRows((prev) => {
        const dedup = new Map<string, API.UserReportRealtimeItem>();
        [...prev, ...incoming].forEach((row) => {
          const key = `${row.user_id}_${row.created_at}_${row.ip}`;
          dedup.set(key, row);
        });
        const merged = Array.from(dedup.values()).sort((a, b) =>
          String(a.created_at || '').localeCompare(String(b.created_at || '')),
        );
        return merged.slice(-MAX_ROWS);
      });
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab !== 'realtime') return;
    pullLatest();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'realtime') return;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!autoRefresh) return;
    timerRef.current = window.setInterval(() => {
      if (pausedByScrollRef.current) return;
      pullLatest();
    }, 3000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, activeTab]);

  useEffect(() => {
    if (activeTab !== 'realtime') return;
    if (!autoRefresh || pausedByScrollRef.current) return;
    const el = scrollBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [allRows.length, autoRefresh, activeTab]);

  const handleScroll = () => {
    const atBottom = isAtBottom(scrollBoxRef.current);
    pausedByScrollRef.current = !atBottom;
    setPausedByScroll(!atBottom);
    if (atBottom && autoRefresh) {
      pullLatest();
    }
  };

  const dailyColumns: ProColumns<API.UserReportDailyItem>[] = [
    { title: '日期', dataIndex: 'date', width: 120, search: false },
    { title: '用户ID', dataIndex: 'userId', width: 100, search: false },
    {
      title: '总上报次数',
      dataIndex: 'totalReports',
      width: 120,
      search: false,
      sorter: (a, b) => a.totalReports - b.totalReports,
      render: (_, record) => {
        const count = record.totalReports;
        if (count >= 500) return <Tag color="error">{count}</Tag>;
        if (count >= 200) return <Tag color="warning">{count}</Tag>;
        return <Tag color="default">{count}</Tag>;
      },
    },
    { title: '最大节点数', dataIndex: 'maxNodes', width: 110, search: false, sorter: (a, b) => a.maxNodes - b.maxNodes },
    { title: '平台', dataIndex: 'platform', width: 130, search: false, render: (_, record) => (record.platform ? <Tag>{record.platform}</Tag> : '-') },
    { title: 'App 包名', dataIndex: 'appId', width: 200, search: false, ellipsis: true, render: (_, record) => record.appId || '-' },
    { title: 'App 版本', dataIndex: 'appVersion', width: 110, search: false, render: (_, record) => record.appVersion || '-' },
  ];

  const countColumns: ProColumns<API.UserReportCountItem>[] = [
    { title: '时间窗口', key: 'time_slot', width: 160, search: false, render: (_, record) => <Typography.Text>{formatTimeSlot(record)}</Typography.Text> },
    { title: '用户ID', dataIndex: 'userId', width: 100, search: false },
    {
      title: '上报次数',
      dataIndex: 'reportCount',
      width: 110,
      search: false,
      sorter: (a, b) => a.reportCount - b.reportCount,
      render: (_, record) => {
        const count = record.reportCount;
        if (count >= 100) return <Tag color="error">{count}</Tag>;
        if (count >= 50) return <Tag color="warning">{count}</Tag>;
        return <Tag color="default">{count}</Tag>;
      },
    },
    { title: '涉及节点数', dataIndex: 'nodeCount', width: 110, search: false, sorter: (a, b) => a.nodeCount - b.nodeCount },
    { title: '平台', dataIndex: 'platform', width: 130, search: false, render: (_, record) => (record.platform ? <Tag>{record.platform}</Tag> : '-') },
    { title: 'App 包名', dataIndex: 'appId', width: 200, search: false, ellipsis: true, render: (_, record) => record.appId || '-' },
    { title: 'App 版本', dataIndex: 'appVersion', width: 110, search: false, render: (_, record) => record.appVersion || '-' },
  ];

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'realtime' | 'daily' | 'count')}
        items={[
          {
            key: 'realtime',
            label: '实时数据',
            children: (
              <Card>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Input
                    placeholder="按 metadata.app_id 过滤"
                    value={appIdInput}
                    onChange={(e) => setAppIdInput(e.target.value)}
                    onPressEnter={() => setAppIdFilter(appIdInput.trim() || undefined)}
                    style={{ width: 260 }}
                  />
                  <Button onClick={() => setAppIdFilter(appIdInput.trim() || undefined)}>应用过滤</Button>
                  <Button onClick={() => { setAppIdInput(''); setAppIdFilter(undefined); }}>清空过滤</Button>
                  <Button icon={<ReloadOutlined />} onClick={pullLatest} loading={loading}>手动刷新</Button>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                    checkedChildren={<PlayCircleOutlined />}
                    unCheckedChildren={<PauseCircleOutlined />}
                  />
                  <Tag color={autoRefresh ? 'processing' : 'default'}>{autoRefresh ? '自动刷新: 开' : '自动刷新: 关'}</Tag>
                  {pausedByScroll ? <Tag color="warning">未在底部，已暂停自动刷新</Tag> : null}
                  <Typography.Text type="secondary">显示 {realtimeData.length} / 缓存 {allRows.length} 条</Typography.Text>
                </Space>

                <div
                  ref={scrollBoxRef}
                  onWheel={handleScroll}
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
                  {realtimeData.map((row, idx) => {
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
              </Card>
            ),
          },
          {
            key: 'daily',
            label: '日汇总',
            children: (
              <ProTable<API.UserReportDailyItem>
                headerTitle="用户上报次数汇总（按天）"
                actionRef={dailyActionRef}
                rowKey={(record) => `${record.date}_${record.userId}`}
                search={false}
                toolbar={{
                  filter: (
                    <Space wrap>
                      <InputNumber
                        placeholder="用户ID"
                        value={dailyUserId}
                        onChange={(v) => {
                          setDailyUserId(v ?? undefined);
                          dailyActionRef.current?.reload();
                        }}
                        style={{ width: 120 }}
                        min={1}
                      />
                      <RangePicker
                        value={dailyDateRange ? [dayjs(dailyDateRange[0]), dayjs(dailyDateRange[1])] : undefined}
                        onChange={(dates) => {
                          if (dates && dates[0] && dates[1]) {
                            setDailyDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                          } else {
                            setDailyDateRange(undefined);
                          }
                          dailyActionRef.current?.reload();
                        }}
                      />
                    </Space>
                  ),
                }}
                request={async (params) => {
                  const res = await getUserReportDaily({
                    userId: dailyUserId,
                    dateFrom: dailyDateRange?.[0],
                    dateTo: dailyDateRange?.[1],
                    page: params.current,
                    pageSize: params.pageSize,
                  });
                  const payload = (res as any)?.data ?? res;
                  return { data: payload?.data || [], total: payload?.total || 0, success: true };
                }}
                columns={dailyColumns}
                pagination={{ defaultPageSize: 50, showSizeChanger: true }}
              />
            ),
          },
          {
            key: 'count',
            label: '上报统计',
            children: (
              <ProTable<API.UserReportCountItem>
                headerTitle="用户上报次数统计（5分钟粒度）"
                actionRef={countActionRef}
                rowKey="id"
                search={false}
                toolbar={{
                  filter: (
                    <Space wrap>
                      <InputNumber
                        placeholder="用户ID"
                        value={countUserId}
                        onChange={(v) => {
                          setCountUserId(v ?? undefined);
                          countActionRef.current?.reload();
                        }}
                        style={{ width: 120 }}
                        min={1}
                      />
                      <Input
                        placeholder="平台 (如 Android 11)"
                        value={countPlatform}
                        onChange={(e) => setCountPlatform(e.target.value || undefined)}
                        onPressEnter={() => countActionRef.current?.reload()}
                        style={{ width: 180 }}
                      />
                      <Input
                        placeholder="App 包名"
                        value={countAppId}
                        onChange={(e) => setCountAppId(e.target.value || undefined)}
                        onPressEnter={() => countActionRef.current?.reload()}
                        style={{ width: 200 }}
                      />
                      <Select
                        placeholder="排序字段"
                        value={countOrderBy}
                        onChange={(v) => {
                          setCountOrderBy(v);
                          countActionRef.current?.reload();
                        }}
                        allowClear
                        style={{ width: 140 }}
                        options={[{ label: '日期', value: 'date' }, { label: '上报次数', value: 'reportCount' }, { label: '用户ID', value: 'userId' }]}
                      />
                      <Select
                        placeholder="排序方向"
                        value={countOrderDir}
                        onChange={(v) => {
                          setCountOrderDir(v);
                          countActionRef.current?.reload();
                        }}
                        allowClear
                        style={{ width: 120 }}
                        options={[{ label: '降序', value: 'desc' }, { label: '升序', value: 'asc' }]}
                      />
                      <RangePicker
                        value={countDateRange ? [dayjs(countDateRange[0]), dayjs(countDateRange[1])] : undefined}
                        onChange={(dates) => {
                          if (dates && dates[0] && dates[1]) {
                            setCountDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                          } else {
                            setCountDateRange(undefined);
                          }
                          countActionRef.current?.reload();
                        }}
                      />
                    </Space>
                  ),
                }}
                request={async (params) => {
                  const res = await getUserReportCount({
                    userId: countUserId,
                    platform: countPlatform,
                    appId: countAppId,
                    dateFrom: countDateRange?.[0],
                    dateTo: countDateRange?.[1],
                    orderBy: countOrderBy as API.UserReportCountParams['orderBy'],
                    orderDir: countOrderDir as API.UserReportCountParams['orderDir'],
                    page: params.current,
                    pageSize: params.pageSize,
                  });
                  const payload = (res as any)?.data ?? res;
                  return { data: payload?.data || [], total: payload?.total || 0, success: true };
                }}
                columns={countColumns}
                pagination={{ defaultPageSize: 50, showSizeChanger: true }}
              />
            ),
          },
        ]}
      />

      <Drawer title="上报详情" width={760} open={detailOpen} onClose={() => setDetailOpen(false)} destroyOnHidden>
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
    </PageContainer>
  );
};

export default RealtimeUserReportPage;
