import { App, Button, Input, InputNumber, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import RealtimeLogWindow, { type RealtimeLogFetchResult } from '@/components/report/RealtimeLogWindow';
import { queryNodeServerRealtime } from '@/services/report/api';

const MAX_PREVIEW_LEN = 120;

const previewText = (value: unknown) => {
  if (value == null) return '-';
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return raw.length > MAX_PREVIEW_LEN ? `${raw.slice(0, MAX_PREVIEW_LEN)}...` : raw;
};

const formatRealtimeLine = (
  record: API.NodeServerRealtimeItem,
) => {
  const ts = String(record.created_at ?? record.report_at ?? record.ts ?? record.timestamp ?? '-');
  const nodeId = String(record.node_id ?? record.nodeId ?? '-');
  const nodeName = String(record.node_name ?? record.nodeName ?? '-');
  const nodeType = String(record.node_type ?? record.nodeType ?? '-');
  return `[${ts}] node_id=${nodeId} node_name=${nodeName} node_type=${nodeType} snapshot=${previewText(record)}`;
};

const NodeReportRealtimeTab: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [nodeIdInput, setNodeIdInput] = useState<number | undefined>();
  const [nodeIdFilter, setNodeIdFilter] = useState<number | undefined>();
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordFilter, setKeywordFilter] = useState<string | undefined>();

  const queryKey = useMemo(
    () => `${nodeIdFilter ?? 'all'}|${keywordFilter ?? 'all'}`,
    [nodeIdFilter, keywordFilter],
  );

  return (
    <RealtimeLogWindow<API.NodeServerRealtimeItem>
      queryKey={queryKey}
      fetchData={async ({ page, pageSize }): Promise<RealtimeLogFetchResult<API.NodeServerRealtimeItem> | null> => {
        const res = await queryNodeServerRealtime({
          page,
          pageSize,
        });

        if (res.code !== 0) {
          messageApi.error(res.msg || '获取节点上报实时数据失败');
          return null;
        }

        const payload = res.data;
        const list = (Array.isArray(payload?.data) ? payload.data : []) as API.NodeServerRealtimeItem[];
        const normalizedKeyword = keywordFilter?.trim().toLowerCase();

        const filteredRows = list.filter((row) => {
          if (nodeIdFilter && Number(row.node_id ?? row.nodeId) !== nodeIdFilter) {
            return false;
          }
          if (normalizedKeyword) {
            const plain = JSON.stringify(row).toLowerCase();
            if (!plain.includes(normalizedKeyword)) {
              return false;
            }
          }
          return true;
        });

        return {
          rows: filteredRows,
          total: Number(payload?.total ?? 0),
          page: Number(payload?.page ?? page),
          pageSize: Number(payload?.pageSize ?? pageSize),
        };
      }}
      formatLine={(row) => formatRealtimeLine(row)}
      rowKey={(row, idx) => `${idx}_${String((row as any).created_at ?? (row as any).report_at ?? (row as any).ts ?? '')}`}
      extraToolbar={(
        <Space wrap>
          <InputNumber
            min={1}
            value={nodeIdInput}
            onChange={(value) => setNodeIdInput(value ?? undefined)}
            addonBefore="节点ID筛选"
            style={{ width: 180 }}
            placeholder="前端筛选"
          />
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="关键字筛选(前端)"
            style={{ width: 220 }}
            onPressEnter={() => setKeywordFilter(keywordInput.trim() || undefined)}
          />
          <Button
            type="primary"
            onClick={() => {
              setNodeIdFilter(nodeIdInput);
              setKeywordFilter(keywordInput.trim() || undefined);
            }}
          >
            应用筛选
          </Button>
          <Button
            onClick={() => {
              setNodeIdInput(undefined);
              setNodeIdFilter(undefined);
              setKeywordInput('');
              setKeywordFilter(undefined);
            }}
          >
            清空筛选
          </Button>
        </Space>
      )}
      summaryText={`前端筛选: 节点ID ${nodeIdFilter ?? '-'} 关键字 ${keywordFilter || '-'}`}
    />
  );
};

export default NodeReportRealtimeTab;
