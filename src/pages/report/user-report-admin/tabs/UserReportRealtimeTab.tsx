import { Button, Input, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import RealtimeLogWindow, { type RealtimeLogFetchResult } from '@/components/report/RealtimeLogWindow';
import { getUserReportRealtime } from '@/services/performance/api';

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
  const queryKey = useMemo(() => appIdFilter || '__all__', [appIdFilter]);

  return (
    <RealtimeLogWindow<API.UserReportRealtimeItem>
      queryKey={queryKey}
      fetchData={async ({ page, pageSize }): Promise<RealtimeLogFetchResult<API.UserReportRealtimeItem>> => {
        const res = await getUserReportRealtime({
          page,
          pageSize,
          appId: appIdFilter,
        });
        const payload = (res as any)?.data ?? res;
        return {
          rows: (Array.isArray(payload?.data) ? payload.data : []) as API.UserReportRealtimeItem[],
          total: Number(payload?.total ?? 0),
          page: Number(payload?.page ?? page),
          pageSize: Number(payload?.pageSize ?? pageSize),
        };
      }}
      formatLine={formatRealtimeLine}
      rowKey={(row, idx) => `${row.user_id}_${row.created_at}_${row.ip}_${idx}`}
      extraToolbar={(
        <Space wrap>
          <Input
            placeholder="按 metadata.app_id 过滤"
            value={appIdInput}
            onChange={(e) => setAppIdInput(e.target.value)}
            onPressEnter={() => {
              setAppIdFilter(appIdInput.trim() || undefined);
            }}
            style={{ width: 260 }}
          />
          <Button
            onClick={() => {
              setAppIdFilter(appIdInput.trim() || undefined);
            }}
          >
            应用过滤
          </Button>
          <Button
            onClick={() => {
              setAppIdInput('');
              setAppIdFilter(undefined);
            }}
          >
            清空过滤
          </Button>
        </Space>
      )}
      summaryText="实时窗口模式"
    />
  );
};

export default UserReportRealtimeTab;
