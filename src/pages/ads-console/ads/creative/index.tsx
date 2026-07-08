import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import AdsConsoleMoneyText from '@/components/AdsConsoleMoneyText';
import { renderAdsMetricsSummary } from '@/components/AdsConsoleMetricsSummary';
import {
  createCreative,
  deleteCreative,
  getCreativePage,
  syncAllCreatives,
  syncCreativeById,
  updateCreative,
} from '@/services/ads-console/creative';
import { getCountryInsights, getEventInsights } from '@/services/ads-console/insights';
import { getAccountOptions, getCampaignOptions, getAdsetOptions, getCreativeOptions } from '@/services/ads-console/adsOptions';
import { ExclamationCircleFilled, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  type ActionType,
  DrawerForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Badge, Button, DatePicker, Input, InputNumber, Modal, Popconfirm, Select, Space, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CREATIVE_TYPE_MAP: Record<number, { text: string; color: string }> = {
  1: { text: '图片', color: 'blue' },
  2: { text: '视频', color: 'purple' },
  3: { text: '轮播', color: 'cyan' },
  4: { text: '全屏', color: 'magenta' },
};

const STATUS_ENUM = {
  ACTIVE: { text: '正常', status: 'Success' as const },
  PAUSED: { text: '暂停', status: 'Default' as const },
};

function isCreativeActiveStatus(status?: string): boolean {
  const value = String(status ?? '').toUpperCase();
  return value === '1' || value === 'ACTIVE';
}

function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode) return '🌐';
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  const [first, second] = code.split('');
  return String.fromCodePoint(127397 + first.charCodeAt(0), 127397 + second.charCodeAt(0));
}

function parseMediaUrls(mediaUrls?: string): string[] {
  if (!mediaUrls) return [];
  try {
    const parsed = JSON.parse(mediaUrls);
    if (Array.isArray(parsed)) {
      return parsed.filter((v) => typeof v === 'string' && v.trim());
    }
  } catch (_e) {
    // ignore
  }
  return mediaUrls
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const pure = url.split('?')[0]?.toLowerCase() || '';
  return ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv'].some((ext) => pure.endsWith(ext));
}

function resolvePreviewMedia(record: AdsConsole.AdsCreative): { type: 'image' | 'video'; url: string } | undefined {
  const medias = parseMediaUrls(record.mediaUrls);
  const imageCandidate = record.imageUrl || medias.find((u) => !isVideoUrl(u)) || record.thumbnailUrl;
  if (imageCandidate) {
    return { type: 'image', url: imageCandidate };
  }
  const videoCandidate = record.videoUrl || medias.find((u) => isVideoUrl(u));
  if (videoCandidate) {
    return { type: 'video', url: videoCandidate };
  }
  return undefined;
}

function resolveCta(record: AdsConsole.AdsCreative): string | undefined {
  return record.callToAction || record.cta;
}

function resolveCtaBadgeStyle(cta?: string) {
  const value = (cta || '').trim().toUpperCase();
  if (!value) {
    return {
      background: '#f5f5f5',
      border: '1px solid #d9d9d9',
      color: '#595959',
    };
  }
  if (['SHOP_NOW', 'BUY_NOW', 'ORDER_NOW', 'GET_OFFER'].includes(value)) {
    return {
      background: '#fff1f0',
      border: '1px solid #ffccc7',
      color: '#cf1322',
    };
  }
  if (['LEARN_MORE', 'SEE_MORE', 'READ_MORE'].includes(value)) {
    return {
      background: '#e6f4ff',
      border: '1px solid #91caff',
      color: '#0958d9',
    };
  }
  if (['SIGN_UP', 'APPLY_NOW', 'SUBSCRIBE'].includes(value)) {
    return {
      background: '#f9f0ff',
      border: '1px solid #d3adf7',
      color: '#531dab',
    };
  }
  if (['CONTACT_US', 'SEND_MESSAGE', 'CALL_NOW'].includes(value)) {
    return {
      background: '#fffbe6',
      border: '1px solid #ffe58f',
      color: '#ad6800',
    };
  }
  return {
    background: '#f0f5ff',
    border: '1px solid #adc6ff',
    color: '#1d39c4',
  };
}

function toCSV(rows: AdsConsole.AdsCreative[]): string {
  const headers = [
    '账户ID',
    '活动ID',
    '广告组ID',
    '素材ID',
    '状态',
    'Spend',
    'Impressions',
    'Clicks',
    'Reach',
    'CTR(%)',
    'CPC',
    'CPM',
    'Frequency',
    'ROAS',
  ];
  const body = rows.map((r) => [
    r.accountId || '',
    r.campaignId || '',
    r.adsetId || '',
    r.creativeId || '',
    isCreativeActiveStatus(r.status) ? '正常' : '暂停',
    Number(r.spend || 0).toFixed(2),
    Number(r.impressions || 0),
    Number(r.clicks || 0),
    Number(r.reach || 0),
    Number(r.ctr || 0).toFixed(2),
    Number(r.cpc || 0).toFixed(2),
    Number(r.cpm || 0).toFixed(2),
    Number(r.frequency || 0).toFixed(2),
    Number(r.roas || 0).toFixed(2),
  ]);
  return [headers, ...body].map((line) => line.join(',')).join('\n');
}

type CreativeManagePageProps = {
  forcedAccountId?: string;
  forcedAccountIds?: string[];
  forcedCampaignIds?: string[];
  forcedAdsetIds?: string[];
  forcedAdIds?: string[];
  hideAccountFilter?: boolean;
  hideHierarchyFilters?: boolean;
};

const CreativeManagePage: React.FC<CreativeManagePageProps> = ({
  forcedAccountId,
  forcedAccountIds,
  forcedCampaignIds,
  forcedAdsetIds,
  forcedAdIds,
  hideAccountFilter,
  hideHierarchyFilters,
}) => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();
  const hasForcedAccountScope = forcedAccountIds !== undefined;
  const hasForcedCampaignScope = forcedCampaignIds !== undefined;
  const hasForcedAdsetScope = forcedAdsetIds !== undefined;
  const hasForcedAdScope = forcedAdIds !== undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdsConsole.AdsCreative | null>(null);
  const [previewRecord, setPreviewRecord] = useState<AdsConsole.AdsCreative | null>(null);

  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<{ label: string; value: string }[]>([]);
  const [adsetOptions, setAdsetOptions] = useState<{ label: string; value: string }[]>([]);
  const [creativeOptions, setCreativeOptions] = useState<{ label: string; value: string }[]>([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<AdsConsole.AdsCreative[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<null | AdsConsole.AdsCreative | AdsConsole.AdsCreative[]>(null);
  const [syncDateRange, setSyncDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ]);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [newTodayCount, setNewTodayCount] = useState<number | null>(null);
  const [filterByNewToday, setFilterByNewToday] = useState(false);

  // 事件详情弹窗
  const [cpaModalOpen, setCpaModalOpen] = useState(false);
  const [cpaRecord, setCpaRecord] = useState<AdsConsole.AdsCreative | null>(null);
  const [cpaDateRange, setCpaDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [eventInsights, setEventInsights] = useState<AdsConsole.AdsAccountEventInsight[]>([]);
  const [eventInsightsLoading, setEventInsightsLoading] = useState(false);
  const [eventSearchKeyword, setEventSearchKeyword] = useState('');

  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterAccountId, setFilterAccountId] = useState<string | undefined>(forcedAccountId);
  const [filterCampaignId, setFilterCampaignId] = useState<string | undefined>(undefined);
  const [filterAdsetId, setFilterAdsetId] = useState<string | undefined>(undefined);
  const [filterCreativeId, setFilterCreativeId] = useState<string | undefined>(undefined);
  const [filterRoasMin, setFilterRoasMin] = useState<number | undefined>(undefined);
  const [filterRoasMax, setFilterRoasMax] = useState<number | undefined>(undefined);
  const [queryParams, setQueryParams] = useState<Record<string, any>>({
    _filterByNewToday: false,
    startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    status: undefined,
    accountId: forcedAccountId,
    campaignId: undefined,
    adsetId: undefined,
    creativeId: undefined,
    roasMin: undefined,
    roasMax: undefined,
  });
  const [tableData, setTableData] = useState<AdsConsole.AdsCreative[]>([]);

  // 国家详情弹窗
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countryRecord, setCountryRecord] = useState<AdsConsole.AdsCreative | null>(null);
  const [countryDateRange, setCountryDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [countryInsights, setCountryInsights] = useState<AdsConsole.AdsAccountCountryInsight[]>([]);
  const [countryInsightsLoading, setCountryInsightsLoading] = useState(false);
  const [countrySearchKeyword, setCountrySearchKeyword] = useState('');

  const filteredEventInsights = useMemo(
    () => eventInsights.filter((item) => String(item.actionType ?? '').toLowerCase().includes(eventSearchKeyword.trim().toLowerCase())),
    [eventInsights, eventSearchKeyword],
  );

  const filteredCountryInsights = useMemo(
    () => countryInsights.filter((item) => String(item.country ?? '').toLowerCase().includes(countrySearchKeyword.trim().toLowerCase())),
    [countryInsights, countrySearchKeyword],
  );

  useEffect(() => {
    getAccountOptions().then((res) => {
      setAccountOptions((res?.data ?? []).map((o) => ({ label: String(o.label ?? o.value), value: String(o.value) })));
    });
    getCampaignOptions().then((res) => {
      setCampaignOptions((res?.data ?? []).map((o) => ({ label: String(o.label ?? o.value), value: String(o.value) })));
    });
    getAdsetOptions().then((res) => {
      setAdsetOptions((res?.data ?? []).map((o) => ({ label: String(o.label ?? o.value), value: String(o.value) })));
    });
    getCreativeOptions().then((res) => {
      setCreativeOptions((res?.data ?? []).map((o) => ({ label: String(o.label ?? o.value), value: String(o.value) })));
    });
  }, []);

  const fetchNewTodayCount = useCallback(async () => {
    setNewTodayCount(null);
    const today = dayjs().format('YYYY-MM-DD');
    const res = await getCreativePage({
      current: 1,
      pageSize: 1,
      accountId: hasForcedAccountScope ? undefined : forcedAccountId,
      selectedAccountIds: hasForcedAccountScope ? forcedAccountIds : undefined,
      campaignIds: hasForcedCampaignScope ? forcedCampaignIds : undefined,
      adsetIds: hasForcedAdsetScope ? forcedAdsetIds : undefined,
      adIds: hasForcedAdScope ? forcedAdIds : undefined,
      createdDate: today,
    });
    setNewTodayCount(Number(res?.data?.total ?? 0));
  }, [forcedAccountId, forcedAccountIds, forcedCampaignIds, forcedAdsetIds, forcedAdIds, hasForcedAccountScope, hasForcedCampaignScope, hasForcedAdsetScope, hasForcedAdScope]);

  useEffect(() => {
    fetchNewTodayCount();
  }, [fetchNewTodayCount]);

  const handleDelete = async (id: number | string) => {
    const res = await deleteCreative(id);
    if (res?.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const handleBatchStatusChange = async (status: 'ACTIVE' | 'PAUSED') => {
    if (!selectedRows.length) {
      message.warning('请先选择数据');
      return;
    }
    if (batchActionLoading) return;
    const opText = status === 'ACTIVE' ? '开启' : '关停';
    setBatchActionLoading(true);
    message.loading({ content: `正在批量${opText}...`, key: 'creative-batch-status', duration: 0 });
    try {
      let successCount = 0;
      for (const row of selectedRows) {
        const res = await updateCreative({ id: row.id, status } as any);
        if (res?.success) successCount += 1;
      }
      const failureCount = selectedRows.length - successCount;
      if (failureCount === 0) {
        message.success({ content: `批量${opText}成功，共 ${successCount} 条`, key: 'creative-batch-status' });
      } else if (successCount > 0) {
        message.warning({ content: `批量操作完成：成功 ${successCount} 条，失败 ${failureCount} 条`, key: 'creative-batch-status' });
      } else {
        message.error({ content: '批量操作失败', key: 'creative-batch-status' });
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch (_e) {
      message.error({ content: `批量${opText}失败，请稍后重试`, key: 'creative-batch-status' });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const handleSyncOne = (record: AdsConsole.AdsCreative) => {
    setSyncTarget(record);
    setSyncDateRange([dayjs().subtract(6, 'day'), dayjs()]);
    setSyncModalOpen(true);
  };

  const handleBatchSync = () => {
    if (!selectedRows.length) return;
    setSyncTarget([...selectedRows]);
    setSyncDateRange([dayjs().subtract(6, 'day'), dayjs()]);
    setSyncModalOpen(true);
  };

  const handleSyncAll = () => {
    setSyncTarget(null);
    setSyncDateRange([dayjs().subtract(6, 'day'), dayjs()]);
    setSyncModalOpen(true);
  };

  const handleSyncConfirm = async () => {
    if (batchActionLoading) return;
    const startDate = syncDateRange[0].format('YYYY-MM-DD');
    const endDate = syncDateRange[1].format('YYYY-MM-DD');
    setBatchActionLoading(true);
    setSyncModalOpen(false);
    message.info('同步已提交，正在后台处理中...');

    const targetIds: string[] =
      syncTarget === null
        ? []
        : Array.isArray(syncTarget)
        ? syncTarget.map((r) => String(r.id))
        : [String((syncTarget as AdsConsole.AdsCreative).id)];

    if (targetIds.length) {
      setSyncingIds((prev) => new Set([...prev, ...targetIds]));
    }
    if (syncTarget === null) {
      setSyncingAll(true);
    }

    let hasError = false;
    try {
      if (syncTarget === null) {
        await syncAllCreatives(startDate, endDate);
      } else if (Array.isArray(syncTarget)) {
        for (const row of syncTarget) {
          await syncCreativeById(row.id, startDate, endDate);
        }
      } else {
        await syncCreativeById((syncTarget as AdsConsole.AdsCreative).id, startDate, endDate);
      }
    } catch (_e) {
      hasError = true;
      message.error('同步请求失败，请稍后重试');
    } finally {
      setSyncingAll(false);
      if (targetIds.length) {
        setSyncingIds((prev) => {
          const n = new Set(prev);
          targetIds.forEach((id) => n.delete(id));
          return n;
        });
      }
      if (!hasError) {
        message.success('同步完成，数据已更新');
      }
      actionRef.current?.reload();
      setBatchActionLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await getCreativePage({
      current: 1,
      pageSize: 10000,
      sortField: 'spend',
      sortOrder: 'desc',
    } as any);
    const data = (Array.isArray(res?.data?.records) ? (res.data?.records ?? []) : []) as AdsConsole.AdsCreative[];
    if (!data.length) {
      message.warning('暂无数据可导出');
      return;
    }
    const csv = `﻿${toCSV(data)}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `creative_insights_${dayjs().format('YYYYMMDD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ProColumns<AdsConsole.AdsCreative>[] = useMemo(
    () => [
      {
        title: '日期范围',
        dataIndex: 'dateRange',
        valueType: 'dateRange',
        hideInTable: true,
        initialValue: [dayjs().subtract(6, 'day'), dayjs()],
        order: 100,
        search: {
          transform: (v) => ({
            startDate: v?.[0] ? (typeof v[0] === 'string' ? v[0] : (v[0] as any).format?.('YYYY-MM-DD')) : undefined,
            endDate: v?.[1] ? (typeof v[1] === 'string' ? v[1] : (v[1] as any).format?.('YYYY-MM-DD')) : undefined,
          }),
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 90,
        fixed: 'left',
        valueType: 'select',
        order: -1,
        valueEnum: STATUS_ENUM,
        render: (_, record) => (
          <Tag color={isCreativeActiveStatus(record.status) ? 'success' : 'default'}>
            {isCreativeActiveStatus(record.status) ? '正常' : '暂停'}
          </Tag>
        ),
      },
      {
        title: '预览图',
        dataIndex: 'thumbnailUrl',
        width: 96,
        hideInSearch: true,
        render: (_, record) => {
          const media = resolvePreviewMedia(record);
          if (!media) return '-';
          if (media.type === 'video') {
            return (
              <a onClick={() => setPreviewRecord(record)}>
                <Tag color="purple">视频</Tag>
              </a>
            );
          }
          return (
            <a onClick={() => setPreviewRecord(record)}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  background: '#fafafa',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img src={media.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </a>
          );
        },
      },
      {
        title: '账户ID',
        dataIndex: 'accountId',
        width: 180,
        ellipsis: true,
        valueType: 'select',
        hideInTable: true,
        hideInSearch: !!hideAccountFilter,
        initialValue: forcedAccountId,
        order: 99,
        fieldProps: {
          options: accountOptions,
          showSearch: true,
          allowClear: true,
        },
      },
      {
        title: '活动ID',
        dataIndex: 'campaignId',
        width: 180,
        ellipsis: true,
        valueType: 'select',
        hideInTable: true,
        hideInSearch: !!hideHierarchyFilters,
        order: 98,
        fieldProps: {
          options: campaignOptions,
          showSearch: true,
          allowClear: true,
        },
      },
      {
        title: '广告组ID',
        dataIndex: 'adsetId',
        width: 180,
        ellipsis: true,
        valueType: 'select',
        hideInTable: true,
        hideInSearch: !!hideHierarchyFilters,
        order: 97,
        fieldProps: {
          options: adsetOptions,
          showSearch: true,
          allowClear: true,
        },
      },
      {
        title: '素材ID',
        dataIndex: 'creativeId',
        width: 340,
        ellipsis: true,
        fixed: 'left',
        valueType: 'select',
        order: 96,
        fieldProps: {
          options: creativeOptions,
          showSearch: true,
          allowClear: true,
          filterOption: (input: string, option: any) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
        },
        render: (_, record) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <a
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                onClick={() => setPreviewRecord(record)}
              >
                {record.creativeId || '-'}
              </a>
              {record.creativeId && (
                <Typography.Text copyable={{ text: record.creativeId }} style={{ fontSize: 12, lineHeight: 1, color: '#8c8c8c' }} />
              )}
              <span
                style={{
                  padding: '1px 8px',
                  borderRadius: 10,
                  ...resolveCtaBadgeStyle(resolveCta(record)),
                  fontSize: 12,
                  lineHeight: '18px',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={resolveCta(record) || '-'}
              >
                {resolveCta(record) || '-'}
              </span>
            </div>
            <span
              style={{
                color: '#8c8c8c',
                fontSize: 12,
                lineHeight: '18px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={record.title || '-'}
            >
              标题：{record.title || '-'}
            </span>
          </div>
        ),
      },

      {
        title: '目标事件',
        dataIndex: 'targetEventCost',
        width: 200,
        hideInSearch: true,
        sorter: true,
        render: (_, record) => {
          const hasTarget = record.targetEvent;
          const hasCount = record.targetEventCount != null;
          const hasCost = record.targetEventCost != null;

          if (!hasTarget) {
            return (
              <span
                style={{ color: '#8c8c8c', cursor: 'pointer', borderBottom: '1px dashed #8c8c8c', userSelect: 'none' }}
                onClick={() => { setCpaRecord(record); setCpaDateRange([dayjs().subtract(6, 'day'), dayjs()]); setCpaModalOpen(true); setEventInsights([]); }}
              >
                暂未设置
              </span>
            );
          }

          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', padding: '4px 0', width: '100%' }}
              onClick={() => { setCpaRecord(record); setCpaDateRange([dayjs().subtract(6, 'day'), dayjs()]); setCpaModalOpen(true); setEventInsights([]); }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, paddingLeft: 2 }}>
                {hasCost && (
                  <span style={{ fontSize: 13, color: '#1677ff' }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4, fontSize: 12 }}>CPA</span>
                    <span style={{ fontWeight: 600 }}><AdsConsoleMoneyText value={record.targetEventCost} currency={record.currency} decimal={2} /></span>
                  </span>
                )}
                {hasCount && (
                  <span style={{ fontSize: 13, color: '#595959' }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4, fontSize: 12 }}>数量</span>
                    <span style={{ fontWeight: 500 }}>{(record.targetEventCount as number).toLocaleString()}</span>
                  </span>
                )}
              </div>
              <Tooltip title={record.targetEvent}>
                <div style={{ display: 'block', maxWidth: '100%', padding: '3px 8px', borderRadius: 6, background: '#f1f1f4', color: '#2f54eb', fontSize: 12, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {record.targetEvent}
                </div>
              </Tooltip>
            </div>
          );
        },
      },
      {
        title: '目标国家',
        dataIndex: 'targetCountrySpend',
        width: 140,
        hideInSearch: true,
        sorter: true,
        render: (_, record) => {
          const hasCountry = record.targetCountry != null;
          const hasSpend = record.targetCountrySpend != null;

          if (!hasCountry) {
            return (
              <span
                style={{ color: '#8c8c8c', cursor: 'pointer', borderBottom: '1px dashed #8c8c8c', userSelect: 'none' }}
                onClick={() => { setCountryRecord(record); setCountryDateRange([dayjs().subtract(6, 'day'), dayjs()]); setCountryModalOpen(true); setCountryInsights([]); }}
              >
                暂未设置
              </span>
            );
          }

          return (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', padding: '4px 0', width: '100%' }}
              onClick={() => { setCountryRecord(record); setCountryDateRange([dayjs().subtract(6, 'day'), dayjs()]); setCountryModalOpen(true); setCountryInsights([]); }}
            >
              {hasSpend && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, paddingLeft: 2 }}>
                  <span style={{ fontSize: 13, color: '#1677ff' }}>
                    <span style={{ color: '#8c8c8c', marginRight: 4, fontSize: 12 }}>消耗</span>
                    <span style={{ fontWeight: 600 }}><AdsConsoleMoneyText value={record.targetCountrySpend} currency={record.currency} decimal={2} /></span>
                  </span>
                </div>
              )}
              {hasCountry && (
                <Tooltip title={record.targetCountry}>
                  <div style={{ display: 'block', maxWidth: '100%', padding: '3px 8px', borderRadius: 6, background: '#f1f1f4', color: '#2f54eb', fontSize: 12, lineHeight: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ marginRight: 6, fontSize: 14, verticalAlign: 'middle' }}>{getCountryFlagEmoji(record.targetCountry)}</span>
                    <span>{record.targetCountry}</span>
                  </div>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        title: 'Spend',
        dataIndex: 'spend',
        width: 120,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        defaultSortOrder: 'descend',
        render: (_, record) => <AdsConsoleMoneyText value={record.spend} currency={record.currency} />,
      },
      {
        title: 'Impressions',
        dataIndex: 'impressions',
        width: 120,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => (v as number)?.toLocaleString() ?? '-',
      },
      {
        title: 'Clicks',
        dataIndex: 'clicks',
        width: 100,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => (v as number)?.toLocaleString() ?? '-',
      },
      {
        title: 'Reach',
        dataIndex: 'reach',
        width: 100,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => (v as number)?.toLocaleString() ?? '-',
      },
      {
        title: 'CTR',
        dataIndex: 'ctr',
        width: 90,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => `${Number(v || 0).toFixed(2)}%`,
      },
      {
        title: 'CPC',
        dataIndex: 'cpc',
        width: 90,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (_, record) => <AdsConsoleMoneyText value={record.cpc} currency={record.currency} />,
      },
      {
        title: 'CPM',
        dataIndex: 'cpm',
        width: 90,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (_, record) => <AdsConsoleMoneyText value={record.cpm} currency={record.currency} />,
      },
      {
        title: 'Frequency',
        dataIndex: 'frequency',
        width: 120,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => Number(v || 0).toFixed(2),
      },
      {
        title: 'ROAS',
        dataIndex: 'roas',
        width: 90,
        hideInSearch: true,
        sorter: true,
        align: 'right',
        render: (v) => Number(v || 0).toFixed(2),
      },
      {
        title: 'ROAS ≥',
        dataIndex: 'roasMin',
        hideInTable: true,
        valueType: 'digit',
        fieldProps: { placeholder: '最小值', min: 0, step: 0.01, style: { width: '100%' } },
      },
      {
        title: 'ROAS ≤',
        dataIndex: 'roasMax',
        hideInTable: true,
        valueType: 'digit',
        fieldProps: { placeholder: '最大值', min: 0, step: 0.01, style: { width: '100%' } },
      },
      {
        title: '操作',
        valueType: 'option',
        width: 200,
        fixed: 'right',
        render: (_, record) => (
          <Space size={8}>
            <AdsConsoleAuthButton
              code="ads:creative:edit"
              type="link"
              size="small"
              onClick={() => {
                setEditRecord(record);
                setDrawerOpen(true);
              }}
            >
              编辑
            </AdsConsoleAuthButton>
            <Popconfirm title="确认删除该创意？" onConfirm={() => handleDelete(record.id)}>
              <AdsConsoleAuthButton code="ads:creative:delete" type="link" size="small" danger>
                删除
              </AdsConsoleAuthButton>
            </Popconfirm>
            <Button type="link" size="small" onClick={() => handleSyncOne(record)}>
              立即同步
            </Button>
          </Space>
        ),
      },
    ],
    [accountOptions, campaignOptions, adsetOptions, creativeOptions, syncingAll, syncingIds, cpaModalOpen, countryModalOpen]
  );

  return (
    <>
      <ProTable<AdsConsole.AdsCreative>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        options={{ density: false, reload: true, setting: true }}
        sortDirections={['descend', 'ascend']}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
          preserveSelectedRowKeys: true,
        }}
        tableAlertRender={({ selectedRowKeys: keys, onCleanSelected }) => (
          <Space>
            <span>已选 <strong>{keys.length}</strong> 条</span>
            <Button size="small" onClick={onCleanSelected}>取消选择</Button>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <AdsConsoleAuthButton size="small" code="ads:creative:sync" icon={<SyncOutlined />} onClick={handleBatchSync} loading={batchActionLoading}>
              {batchActionLoading ? '操作中...' : '批量同步'}
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton size="small" code="ads:creative:edit" onClick={() => handleBatchStatusChange('ACTIVE')} loading={batchActionLoading}>
              批量开启
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton size="small" code="ads:creative:edit" onClick={() => handleBatchStatusChange('PAUSED')} loading={batchActionLoading}>
              批量关停
            </AdsConsoleAuthButton>
          </Space>
        )}
        params={queryParams}
        request={async (params, sort) => {
          const selectedDateRangeText =
            params.startDate && params.endDate ? `${params.startDate} ~ ${params.endDate}` : '-';
          const activeSortKey = Object.keys(sort).find((k) => sort[k] != null);
          const sortFieldMap: Record<string, string> = {
            targetEventCost: 'target_event_cost',
            targetCountrySpend: 'target_country_spend',
          };
          const sortField = activeSortKey ? sortFieldMap[activeSortKey] ?? activeSortKey : 'spend';
          const sortOrder = sort[activeSortKey as string] === 'ascend' ? 'asc' : 'desc';
          const res = await getCreativePage({
            current: params.current,
            pageSize: params.pageSize,
            accountId: hasForcedAccountScope ? undefined : (forcedAccountId || (params.accountId as string)),
            selectedAccountIds: hasForcedAccountScope ? forcedAccountIds : undefined,
            campaignId: hasForcedCampaignScope ? undefined : (params.campaignId as string),
            campaignIds: hasForcedCampaignScope ? forcedCampaignIds : undefined,
            adsetId: hasForcedAdsetScope ? undefined : (params.adsetId as string),
            adsetIds: hasForcedAdsetScope ? forcedAdsetIds : undefined,
            adId: hasForcedAdScope ? undefined : (params.adId as string),
            adIds: hasForcedAdScope ? forcedAdIds : undefined,
            creativeId: params.creativeId as string,
            name: params.name as string,
            status: params.status as string,
            syncStatus: params.syncStatus as number,
            startDate: params.startDate as string,
            endDate: params.endDate as string,
            sortField,
            sortOrder,
            createdDate: filterByNewToday ? dayjs().format('YYYY-MM-DD') : undefined,
            roasMin: params.roasMin as number,
            roasMax: params.roasMax as number,
          });
          const data = (Array.isArray(res?.data?.records) ? (res.data?.records ?? []) : []).map((item: AdsConsole.AdsCreative) => ({
            ...item,
            dateRange: selectedDateRangeText,
          }));
          setTableData(data);
          return {
            data,
            total: Number(res?.data?.total ?? 0),
            success: res?.success ?? false,
          };
        }}
        summary={() => renderAdsMetricsSummary({ columns, rows: tableData, hasSelectionColumn: true })}
        toolBarRender={() => {
          const items: React.ReactNode[] = [
            <DatePicker.RangePicker
              key="date"
              value={filterDateRange}
              onChange={(v) => { if (v?.[0] && v[1]) setFilterDateRange([v[0], v[1]]); }}
              presets={[
                { label: '今天', value: [dayjs(), dayjs()] },
                { label: '昨天', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
                { label: '最近3天', value: [dayjs().subtract(2, 'day'), dayjs()] },
                { label: '最近一周', value: [dayjs().subtract(6, 'day'), dayjs()] },
                { label: '最近一个月', value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: '最近三个月', value: [dayjs().subtract(89, 'day'), dayjs()] },
              ]}
              allowClear={false}
              style={{ width: 260 }}
            />,
          ];
          if (!hideAccountFilter) {
            items.push(
              <Select
                key="accountId"
                value={filterAccountId}
                onChange={setFilterAccountId}
                allowClear
                showSearch
                placeholder="账户ID"
                style={{ width: 160 }}
                options={accountOptions}
                filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            );
          }
          if (!hideHierarchyFilters) {
            items.push(
              <Select
                key="campaignId"
                value={filterCampaignId}
                onChange={setFilterCampaignId}
                allowClear
                showSearch
                placeholder="活动ID"
                style={{ width: 160 }}
                options={campaignOptions}
                filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />,
              <Select
                key="adsetId"
                value={filterAdsetId}
                onChange={setFilterAdsetId}
                allowClear
                showSearch
                placeholder="广告组ID"
                style={{ width: 160 }}
                options={adsetOptions}
                filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            );
          }
          items.push(
            <Select
              key="creativeId"
              value={filterCreativeId}
              onChange={setFilterCreativeId}
              allowClear
              showSearch
              placeholder="素材ID"
              style={{ width: 160 }}
              options={creativeOptions}
              filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />,
          );
          items.push(
            <InputNumber
              key="roasMin"
              value={filterRoasMin}
              onChange={(v) => setFilterRoasMin(v ?? undefined)}
              placeholder="ROAS ≥"
              style={{ width: 100 }}
              min={0}
              step={0.1}
            />,
            <InputNumber
              key="roasMax"
              value={filterRoasMax}
              onChange={(v) => setFilterRoasMax(v ?? undefined)}
              placeholder="ROAS ≤"
              style={{ width: 100 }}
              min={0}
              step={0.1}
            />,
            <Button
              key="new-today"
              type={filterByNewToday ? 'primary' : 'default'}
              onClick={() => setFilterByNewToday((v) => !v)}
            >
              今日新增
              {newTodayCount !== null && (
                <Badge
                  count={newTodayCount}
                  showZero
                  style={{
                    marginLeft: 6,
                    backgroundColor: filterByNewToday ? '#fff' : (newTodayCount > 0 ? '#1677ff' : '#8c8c8c'),
                    color: filterByNewToday ? '#1677ff' : '#fff',
                    boxShadow: 'none',
                    fontSize: 11,
                  }}
                  overflowCount={999}
                />
              )}
            </Button>,
            <Button
              key="query"
              type="primary"
              onClick={() => setQueryParams({
                _filterByNewToday: filterByNewToday,
                startDate: filterDateRange[0].format('YYYY-MM-DD'),
                endDate: filterDateRange[1].format('YYYY-MM-DD'),
                status: filterStatus,
                accountId: filterAccountId,
                campaignId: filterCampaignId,
                adsetId: filterAdsetId,
                creativeId: filterCreativeId,
                roasMin: filterRoasMin,
                roasMax: filterRoasMax,
              })}
            >
              查询
            </Button>
          );
          return items;
        }}
        search={false}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1600, y: '45vh' }}
        size="small"
        cardProps={{ bodyStyle: { overflow: 'visible' } }}
      />

      <DrawerForm
        title={editRecord ? '编辑创意' : '新建创意'}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={
          editRecord
            ? {
                ...editRecord,
                cta: editRecord.callToAction || editRecord.cta,
              }
            : { creativeType: 1, status: 'PAUSED' }
        }
        onFinish={async (values) => {
          const payload = {
            ...values,
            callToAction: values.callToAction || values.cta,
            cta: values.callToAction || values.cta,
            creativeType: values.creativeType,
          } as any;
          const res = editRecord
            ? await updateCreative({ id: editRecord.id, ...payload })
            : await createCreative(payload);
          if (res?.success) {
            message.success(editRecord ? '修改成功' : '创建成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        drawerProps={{ width: 560 }}
      >
        <ProFormText name="name" label="创意名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="creativeType"
          label="创意类型"
          options={[
            { label: '图片广告', value: 1 },
            { label: '视频广告', value: 2 },
            { label: '轮播广告', value: 3 },
            { label: '全屏广告', value: 4 },
          ]}
          initialValue={1}
        />
        <ProFormText name="title" label="广告标题" />
        <ProFormTextArea name="body" label="广告文案" fieldProps={{ rows: 3 }} />
        <ProFormText name="thumbnailUrl" label="缩略图URL" />
        <ProFormText name="imageUrl" label="图片URL" />
        <ProFormText name="videoUrl" label="视频URL" />
        <ProFormText name="mediaUrls" label="素材URL列表" placeholder="JSON 数组或逗号分隔" />
        <ProFormText name="landingUrl" label="落地页URL" />
        <ProFormText name="linkUrl" label="链接URL" />
        <ProFormText name="callToAction" label="行动号召" />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '正常', value: 'ACTIVE' },
            { label: '暂停', value: 'PAUSED' },
          ]}
          initialValue="PAUSED"
        />
      </DrawerForm>

      <Modal title="创意预览" open={!!previewRecord} onCancel={() => setPreviewRecord(null)} footer={null} width={900}>
        {previewRecord && (
          <div
            style={{
              border: '1px solid #e8e8e8',
              borderRadius: 10,
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 1fr) minmax(320px, 360px)',
              minHeight: 520,
            }}
          >
            <div
              style={{
                background: '#fafafa',
                borderRight: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}
            >
              {(() => {
                const media = resolvePreviewMedia(previewRecord);
                if (!media) {
                  return (
                    <div
                      style={{
                        width: '100%',
                        height: 420,
                        borderRadius: 8,
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                      }}
                    >
                      暂无媒体
                    </div>
                  );
                }
                if (media.type === 'video') {
                  return (
                    <video src={media.url} controls style={{ width: '100%', maxHeight: 480, borderRadius: 8, background: '#000' }}>
                      <track kind="captions" />
                    </video>
                  );
                }
                return (
                  <img
                    src={media.url}
                    alt=""
                    style={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 8, background: '#fff' }}
                  />
                );
              })()}
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.4 }}>{previewRecord.title || previewRecord.name || '-'}</div>

              {previewRecord.body && (
                <div
                  style={{
                    fontSize: 14,
                    color: '#595959',
                    lineHeight: 1.7,
                    maxHeight: 160,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {previewRecord.body}
                </div>
              )}

              {(previewRecord.landingUrl || previewRecord.linkUrl) && (
                <div
                  style={{
                    display: 'inline-flex',
                    width: 'fit-content',
                    background: '#1677ff',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 18px',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {resolveCta(previewRecord) || '了解详情'}
                </div>
              )}

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, display: 'grid', rowGap: 8, fontSize: 13 }}>
                {previewRecord.adId && (
                  <div>
                    <span style={{ color: '#8c8c8c', marginRight: 8 }}>Ad ID</span>
                    <span style={{ color: '#262626' }}>{previewRecord.adId}</span>
                  </div>
                )}

                {previewRecord.landingUrl && (
                  <div style={{ display: 'grid', rowGap: 2 }}>
                    <span style={{ color: '#8c8c8c' }}>落地页</span>
                    <a
                      href={previewRecord.landingUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {previewRecord.landingUrl}
                    </a>
                  </div>
                )}

                {previewRecord.linkUrl && (
                  <div style={{ display: 'grid', rowGap: 2 }}>
                    <span style={{ color: '#8c8c8c' }}>链接</span>
                    <a
                      href={previewRecord.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {previewRecord.linkUrl}
                    </a>
                  </div>
                )}

                {previewRecord.imageUrl && !resolvePreviewMedia(previewRecord)?.url?.includes(previewRecord.imageUrl) && (
                  <div style={{ display: 'grid', rowGap: 2 }}>
                    <span style={{ color: '#8c8c8c' }}>图片 URL</span>
                    <a
                      href={previewRecord.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {previewRecord.imageUrl}
                    </a>
                  </div>
                )}

                {previewRecord.videoUrl && !resolvePreviewMedia(previewRecord)?.url?.includes(previewRecord.videoUrl) && (
                  <div style={{ display: 'grid', rowGap: 2 }}>
                    <span style={{ color: '#8c8c8c' }}>视频 URL</span>
                    <a
                      href={previewRecord.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {previewRecord.videoUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          syncTarget === null
            ? '全量同步'
            : Array.isArray(syncTarget)
            ? `批量同步（已选 ${syncTarget.length} 条）`
            : '立即同步'
        }
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        onOk={handleSyncConfirm}
        okText="开始同步"
        cancelText="取消"
        width={440}
      >
        <div style={{ padding: '16px 0 8px' }}>
          <div style={{ marginBottom: 12, color: '#666' }}>请选择需要同步的数据日期范围：</div>
          <DatePicker.RangePicker
            value={syncDateRange}
            onChange={(v) => {
              if (v?.[0] && v[1]) setSyncDateRange([v[0], v[1]]);
            }}
            presets={[
              { label: '今天', value: [dayjs(), dayjs()] },
              { label: '昨天', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
              { label: '最近3天', value: [dayjs().subtract(2, 'day'), dayjs()] },
              { label: '最近一周', value: [dayjs().subtract(6, 'day'), dayjs()] },
              { label: '最近一个月', value: [dayjs().subtract(29, 'day'), dayjs()] },
              { label: '最近三个月', value: [dayjs().subtract(89, 'day'), dayjs()] },
            ]}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>
      <Modal
        title={<span>事件数据详情<span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: '#8c8c8c' }}>素材 {cpaRecord?.creativeId}</span></span>}
        open={cpaModalOpen}
        onCancel={() => { setCpaModalOpen(false); setCpaRecord(null); setEventInsights([]); setEventSearchKeyword(''); }}
        footer={null}
        width={720}
        afterOpenChange={(open) => {
          if (open && cpaRecord?.creativeId) {
            setEventInsightsLoading(true);
            getEventInsights({ objectId: cpaRecord.creativeId, objectType: 'creative', startDate: cpaDateRange[0].format('YYYY-MM-DD'), endDate: cpaDateRange[1].format('YYYY-MM-DD') })
              .then((res) => setEventInsights([...(res?.data ?? [])].sort((a, b) => Number(b.costPerAction) - Number(a.costPerAction))))
              .finally(() => setEventInsightsLoading(false));
          }
        }}
      >
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 13 }}>日期范围：</span>
          <DatePicker.RangePicker
            size="small"
            value={cpaDateRange}
            allowClear={false}
            onChange={(v) => {
              if (v?.[0] && v[1] && cpaRecord?.creativeId) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCpaDateRange(range);
                setEventInsightsLoading(true);
                getEventInsights({ objectId: cpaRecord.creativeId, objectType: 'creative', startDate: v[0].format('YYYY-MM-DD'), endDate: v[1].format('YYYY-MM-DD') })
                  .then((res) => setEventInsights([...(res?.data ?? [])].sort((a, b) => Number(b.costPerAction) - Number(a.costPerAction))))
                  .finally(() => setEventInsightsLoading(false));
              }
            }}
          />
        </div>
        <Input.Search allowClear value={eventSearchKeyword} onChange={(e) => setEventSearchKeyword(e.target.value)} placeholder="搜索事件类型" style={{ marginBottom: 8 }} />
        <Spin spinning={eventInsightsLoading}>
          <Table
            size="small"
            dataSource={filteredEventInsights}
            rowKey="actionType"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
            locale={{ emptyText: '暂无事件数据' }}
            columns={[
              { title: '事件类型', dataIndex: 'actionType', render: (v: string) => <Tag style={{ fontFamily: 'monospace' }}>{v}</Tag> },
              { title: '数量', dataIndex: 'actionCount', align: 'right', render: (v: number) => Number(v).toLocaleString() },
              {
                title: '单次成本 (CPA)', dataIndex: 'costPerAction', align: 'right', defaultSortOrder: 'descend',
                sorter: (a, b) => Number(a.costPerAction) - Number(b.costPerAction),
                render: (v: number) => <span style={{ fontWeight: 500 }}><AdsConsoleMoneyText value={v} currency={cpaRecord?.currency} decimal={4} /></span>,
              },
            ]}
          />
        </Spin>
      </Modal>

      <Modal
        title={<span>国家数据详情<span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: '#8c8c8c' }}>素材 {countryRecord?.creativeId}</span></span>}
        open={countryModalOpen}
        onCancel={() => { setCountryModalOpen(false); setCountryRecord(null); setCountryInsights([]); setCountrySearchKeyword(''); }}
        footer={null}
        width={680}
        afterOpenChange={(open) => {
          if (open && countryRecord?.creativeId) {
            setCountryInsightsLoading(true);
            getCountryInsights({ objectId: countryRecord.creativeId, objectType: 'creative', startDate: countryDateRange[0].format('YYYY-MM-DD'), endDate: countryDateRange[1].format('YYYY-MM-DD') })
              .then((res) => setCountryInsights([...(res?.data ?? [])].sort((a, b) => Number(b.spend) - Number(a.spend))))
              .finally(() => setCountryInsightsLoading(false));
          }
        }}
      >
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 13 }}>日期范围：</span>
          <DatePicker.RangePicker
            size="small"
            value={countryDateRange}
            allowClear={false}
            onChange={(v) => {
              if (v?.[0] && v[1] && countryRecord?.creativeId) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCountryDateRange(range);
                setCountryInsightsLoading(true);
                getCountryInsights({ objectId: countryRecord.creativeId, objectType: 'creative', startDate: v[0].format('YYYY-MM-DD'), endDate: v[1].format('YYYY-MM-DD') })
                  .then((res) => setCountryInsights([...(res?.data ?? [])].sort((a, b) => Number(b.spend) - Number(a.spend))))
                  .finally(() => setCountryInsightsLoading(false));
              }
            }}
          />
        </div>
        <Input.Search allowClear value={countrySearchKeyword} onChange={(e) => setCountrySearchKeyword(e.target.value)} placeholder="搜索国家/地区代码" style={{ marginBottom: 8 }} />
        <Spin spinning={countryInsightsLoading}>
          <Table
            size="small"
            dataSource={filteredCountryInsights}
            rowKey="country"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
            locale={{ emptyText: '暂无国家数据' }}
            columns={[
              {
                title: '国家/地区', dataIndex: 'country',
                render: (v: string) => <Tag style={{ fontFamily: 'monospace' }}><span style={{ marginRight: 6 }}>{getCountryFlagEmoji(v)}</span><span>{v}</span></Tag>,
              },
              {
                title: '消耗', dataIndex: 'spend', align: 'right', defaultSortOrder: 'descend',
                sorter: (a, b) => Number(a.spend) - Number(b.spend),
                render: (v: number) => <span style={{ fontWeight: 500 }}><AdsConsoleMoneyText value={v} currency={countryRecord?.currency} decimal={4} /></span>,
              },
            ]}
          />
        </Spin>
      </Modal>
    </>
  );
};

export default CreativeManagePage;




