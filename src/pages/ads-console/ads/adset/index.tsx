import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import AdsConsoleMoneyText from "@/components/AdsConsoleMoneyText";
import { renderAdsMetricsSummary } from "@/components/AdsConsoleMetricsSummary";
import AdsConsoleSyncHistoryChart from "@/components/AdsConsoleSyncHistoryChart";
import CreativeManagePage from "@/pages/ads-console/ads/creative";
import {
  createAdset,
  deleteAdset,
  getAdsetInsights,
  syncAdsetById,
  syncAllAdsets,
  updateAdset,
  updateAdsetRemoteStatus,
} from "@/services/ads-console/adset";
import { getCountryInsights, getEventInsights } from "@/services/ads-console/insights";
import {
  getAccountOptions,
  getAdsetOptions,
  getCampaignOptions,
} from "@/services/ads-console/adsOptions";
import { getProjectOptions } from "@/services/ads-console/orgOptions";
import {
  DownloadOutlined,
  ExclamationCircleFilled,
  PictureOutlined,
  PlusOutlined,
  SyncOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProTable,
} from "@ant-design/pro-components";
import { useModel, useSearchParams } from "@umijs/max";
import { hasAdsConsolePermission } from "@/utils/adsConsoleAccess";
import {
  App,
  Badge,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";

type InsightEvent = {
  actionType: string;
  actionCount: string;
  costPerAction: number;
};

const BID_STRATEGY_LABEL_MAP: Record<string, string> = {
  LOWEST_COST_WITHOUT_CAP: "最低成本（无上限）",
  LOWEST_COST_WITH_BID_CAP: "最低成本（有出价上限）",
  COST_CAP: "成本上限",
  LOWEST_COST_WITH_MIN_ROAS: "最低 ROAS",
  LOWEST_COST: "最低成本",
  TARGET_COST: "目标成本",
  BID_CAP: "出价上限",
};

type InsightRow = {
  id: string;
  accountId: string;
  campaignId: string;
  adsetId: string;
  name?: string;
  status: string;
  effectiveStatus?: string;
  syncStatus: number;
  syncTime: string;
  syncMsg?: string;
  date: string;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  spend: number;
  cpc: number;
  cpm: number;
  frequency: number;
  roas?: number;
  currency?: string;
  events?: InsightEvent[];
  targetEvent?: string;
  targetEventCount?: number;
  targetEventCost?: number;
  targetCountry?: string;
  targetCountrySpend?: number;
  dateRange?: string;
  remark?: string;
  creativeCount?: number;
  budgetMode?: "ABO" | "CBO" | "NONE";
  budgetValue?: string;
  budgetValueType?: "daily" | "lifetime";
  budgetSource?: "adset" | "campaign";
  budgetRemaining?: string;
  bidStrategy?: string;
};

function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode) return "🌐";
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  const [first, second] = code.split("");
  return String.fromCodePoint(
    127397 + first.charCodeAt(0),
    127397 + second.charCodeAt(0)
  );
}

function toCSV(rows: InsightRow[]): string {
  const headers = [
    "日期",
    "账户ID",
    "活动ID",
    "状态",
    "曝光量",
    "点击量",
    "覆盖人数",
    "点击率(%)",
    "消耗",
    "CPC",
    "CPM",
    "频次",
    "ROAS",
  ];
  const body = rows.map((r) => [
    r.date,
    r.accountId,
    r.campaignId,
    r.status === "ACTIVE" ? "正常" : "暂停",
    r.impressions,
    r.clicks,
    r.reach,
    r.ctr.toFixed(2),
    r.spend.toFixed(2),
    r.cpc.toFixed(2),
    r.cpm.toFixed(2),
    r.frequency.toFixed(2),
    Number(r.roas || 0).toFixed(2),
  ]);
  return [headers, ...body].map((l) => l.join(",")).join("\n");
}

function parseMoney(raw?: string): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function toMajorMoney(minor?: number): number | undefined {
  if (minor == null) return undefined;
  return minor / 100;
}

function budgetProgressColor(percent: number): string {
  if (percent < 20) return "#ff4d4f";
  if (percent >= 80) return "#52c41a";
  return "#faad14";
}

function renderBudgetCell(record: InsightRow) {
  if (!record.budgetMode || record.budgetMode === "NONE") {
    return <span style={{ color: "#8c8c8c" }}>未设置</span>;
  }
  const sourceText = record.budgetMode === "ABO" ? "ABO" : "CBO";
  const bidText = record.bidStrategy ? (BID_STRATEGY_LABEL_MAP[record.bidStrategy] || record.bidStrategy) : "-";
  if (record.budgetMode === "CBO") {
    return <span style={{ fontSize: 12, color: "#8c8c8c" }}>CBO · {bidText}</span>;
  }
  const typeText = record.budgetValueType === "lifetime" ? "总预算" : "日预算";
  const amountMinor = parseMoney(record.budgetValue);
  const remainingMinor = parseMoney(record.budgetRemaining);
  const amount = toMajorMoney(amountMinor);
  const remaining = toMajorMoney(remainingMinor);
  const remainingPercent =
    amountMinor != null && remainingMinor != null && amountMinor > 0
      ? Math.max(0, Math.min(100, (remainingMinor / amountMinor) * 100))
      : undefined;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "#8c8c8c", lineHeight: 1.3 }}>
        {sourceText} · {bidText} · {typeText} ·{" "}
        {amount == null ? "-" : <AdsConsoleMoneyText value={amount} currency={record.currency} />}
      </span>
      {remainingPercent != null ? (
        <Tooltip
          title={
            remaining == null ? "剩余预算：-" : (
              <span>
                剩余预算：<AdsConsoleMoneyText value={remaining} currency={record.currency} />
              </span>
            )
          }
        >
          <Progress
            percent={Number(remainingPercent.toFixed(2))}
            strokeColor={budgetProgressColor(remainingPercent)}
            size="small"
            showInfo={false}
          />
        </Tooltip>
      ) : null}
    </div>
  );
}

type AdsetInsightPageProps = {
  forcedAccountId?: string;
  forcedAccountIds?: string[];
  forcedCampaignIds?: string[];
  hideAccountFilter?: boolean;
  hideOrgFilters?: boolean;
  onSelectionChange?: (campaignIds: string[], adsetIds: string[]) => void;
  onSelectedRowsChange?: (rows: InsightRow[]) => void;
  reloadSignal?: number;
  onOpenBudgetConfig?: (row: InsightRow) => void;
  onOpenCreateEditor?: (scope: "adset", row: InsightRow) => void;
};

const AdsetInsightPage: React.FC<AdsetInsightPageProps> = ({
  forcedAccountId,
  forcedAccountIds,
  forcedCampaignIds,
  hideAccountFilter,
  hideOrgFilters,
  onSelectionChange,
  onSelectedRowsChange,
  reloadSignal,
  onOpenBudgetConfig,
  onOpenCreateEditor,
}) => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
  const hasPermission = (code: string) => hasAdsConsolePermission(currentUser, code);
  const [searchParams] = useSearchParams();
  const initCampaignId = searchParams.get("campaignId") || undefined;
  const hasForcedAccountScope = forcedAccountIds !== undefined;
  const hasForcedCampaignScope = forcedCampaignIds !== undefined;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<InsightRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<InsightRow | null>(null);
  const [editModalKey, setEditModalKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<InsightRow[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<
    null | InsightRow | InsightRow[]
  >(null);
  const [syncDateRange, setSyncDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs]
  >([dayjs().subtract(6, "day"), dayjs()]);
  const [syncMode, setSyncMode] = useState<"ENTITY" | "INSIGHTS" | "FULL">("INSIGHTS");
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [accountIdOptions, setAccountIdOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [campaignIdOptions, setCampaignIdOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [adsetIdOptions, setAdsetIdOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [projectOptions, setProjectOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [cpaModalOpen, setCpaModalOpen] = useState(false);
  const [cpaRecord, setCpaRecord] = useState<InsightRow | null>(null);
  const [cpaDateRange, setCpaDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);
  const [eventInsights, setEventInsights] = useState<
    AdsConsole.AdsAccountEventInsight[]
  >([]);
  const [eventInsightsLoading, setEventInsightsLoading] = useState(false);
  const [eventSearchKeyword, setEventSearchKeyword] = useState("");
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countryRecord, setCountryRecord] = useState<InsightRow | null>(null);
  const [countryDateRange, setCountryDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs]
  >([dayjs().subtract(6, "day"), dayjs()]);
  const [countryInsights, setCountryInsights] = useState<
    AdsConsole.AdsAccountCountryInsight[]
  >([]);
  const [countryInsightsLoading, setCountryInsightsLoading] = useState(false);
  const [countrySearchKeyword, setCountrySearchKeyword] = useState("");
  const [creativeModalOpen, setCreativeModalOpen] = useState(false);
  const [creativeModalRecord, setCreativeModalRecord] = useState<InsightRow | null>(null);
  const [syncChartOpen, setSyncChartOpen] = useState(false);
  const [syncChartRecord, setSyncChartRecord] = useState<InsightRow | null>(null);
  const [switchLoadingIds, setSwitchLoadingIds] = useState<Set<string>>(new Set());
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, 'day'), dayjs()]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterAccountId, setFilterAccountId] = useState<string | undefined>(forcedAccountId);
  const [filterName, setFilterName] = useState<string | undefined>(undefined);
  const [filterCampaignId, setFilterCampaignId] = useState<string | undefined>(initCampaignId);
  const [filterAdsetId, setFilterAdsetId] = useState<string | undefined>(undefined);
  const [filterGroupId, setFilterGroupId] = useState<string | undefined>(undefined);
  const [filterRoasMin, setFilterRoasMin] = useState<number | undefined>(undefined);
  const [filterRoasMax, setFilterRoasMax] = useState<number | undefined>(undefined);
  const [queryParams, setQueryParams] = useState<Record<string, any>>({
    startDate: dayjs().subtract(6, 'day').format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    status: undefined,
    accountId: forcedAccountId,
    name: undefined,
    campaignId: initCampaignId,
    adsetId: undefined,
    groupId: undefined,
    roasMin: undefined,
    roasMax: undefined,
  });
  const [tableData, setTableData] = useState<InsightRow[]>([]);

  const filteredEventInsights = useMemo(
    () =>
      eventInsights.filter((item) =>
        String(item.actionType ?? "")
          .toLowerCase()
          .includes(eventSearchKeyword.trim().toLowerCase())
      ),
    [eventInsights, eventSearchKeyword]
  );

  const filteredCountryInsights = useMemo(
    () =>
      countryInsights.filter((item) =>
        String(item.country ?? "")
          .toLowerCase()
          .includes(countrySearchKeyword.trim().toLowerCase())
      ),
    [countryInsights, countrySearchKeyword]
  );

  useEffect(() => {
    getAccountOptions().then((res) => {
      setAccountIdOptions(
        (res?.data ?? []).map((o) => ({ label: String(o.label ?? o.value), value: String(o.value) }))
      );
    });
    getCampaignOptions().then((res) => {
      setCampaignIdOptions(
        (res?.data ?? []).map((o) => ({
          label: String(o.label ?? o.value),
          value: String(o.value),
        }))
      );
    });
    getAdsetOptions().then((res) => {
      setAdsetIdOptions(
        (res?.data ?? []).map((o) => ({
          label: String(o.label ?? o.value),
          value: String(o.value),
        }))
      );
    });
    getProjectOptions().then((res) => {
      setProjectOptions(
        (res?.data ?? []).map((o) => ({
          label: o.label,
          value: String(o.value),
        }))
      );
    });
  }, []);

  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange([], []);
  }, [forcedAccountId]);

  useEffect(() => {
    onSelectedRowsChange?.(selectedRows);
  }, [selectedRows, onSelectedRowsChange]);

  useEffect(() => {
    if (reloadSignal == null) return;
    actionRef.current?.reload();
  }, [reloadSignal]);

  const handleStatusChange = async (record: InsightRow, checked: boolean) => {
    setSwitchLoadingIds((prev) => new Set([...prev, record.id]));
    const hideLoading = message.loading("开关状态更新中，请稍候...", 0);
    try {
      const res = await updateAdsetRemoteStatus(record.id, checked ? "ACTIVE" : "PAUSED");
      hideLoading();
      if (res?.success) {
        message.success("状态更新成功，可继续操作");
        actionRef.current?.reload();
      } else {
        message.error(res?.errorMessage || "状态更新失败");
      }
    } finally {
      setSwitchLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteAdset(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleBatchStatusChange = async (status: "ACTIVE" | "PAUSED") => {
    if (!selectedRows.length) {
      message.warning("请先选择数据");
      return;
    }
    if (batchActionLoading) return;
    const opText = status === "ACTIVE" ? "开启" : "关停";
    setBatchActionLoading(true);
    message.loading({ content: `正在批量${opText}...`, key: "adset-batch-status", duration: 0 });
    try {
      let successCount = 0;
      for (const row of selectedRows) {
        const res = await updateAdsetRemoteStatus(row.id, status);
        if (res?.success) successCount += 1;
      }
      const failureCount = selectedRows.length - successCount;
      if (failureCount === 0) {
        message.success({ content: `批量${opText}成功，共 ${successCount} 条`, key: "adset-batch-status" });
      } else if (successCount > 0) {
        message.warning({ content: `批量操作完成：成功 ${successCount} 条，失败 ${failureCount} 条`, key: "adset-batch-status" });
      } else {
        message.error({ content: "批量操作失败", key: "adset-batch-status" });
      }
      setSelectedRowKeys([]);
      setSelectedRows([]);
      actionRef.current?.reload();
    } catch (_e) {
      message.error({ content: `批量${opText}失败，请稍后重试`, key: "adset-batch-status" });
    } finally {
      setBatchActionLoading(false);
    }
  };

  const _handleSyncAll = () => {
    setSyncTarget(null);
    setSyncDateRange([dayjs().subtract(6, "day"), dayjs()]);
    setSyncMode("INSIGHTS");
    setSyncModalOpen(true);
  };

  const handleSyncOne = (record: InsightRow) => {
    setSyncTarget(record);
    setSyncDateRange([dayjs().subtract(6, "day"), dayjs()]);
    setSyncMode("INSIGHTS");
    setSyncModalOpen(true);
  };

  const handleBatchSync = () => {
    if (!selectedRows.length) return;
    setSyncTarget([...selectedRows]);
    setSyncDateRange([dayjs().subtract(6, "day"), dayjs()]);
    setSyncMode("INSIGHTS");
    setSyncModalOpen(true);
  };

  const handleSyncConfirm = async () => {
    if (batchActionLoading) return;
    const isEntityOnly = syncMode === "ENTITY";
    const startDate = isEntityOnly ? dayjs().format("YYYY-MM-DD") : syncDateRange[0].format("YYYY-MM-DD");
    const endDate = isEntityOnly ? dayjs().format("YYYY-MM-DD") : syncDateRange[1].format("YYYY-MM-DD");
    setBatchActionLoading(true);
    setSyncModalOpen(false);
    message.info("同步已提交，正在后台处理中...");
    const targetIds: string[] =
      syncTarget === null
        ? []
        : Array.isArray(syncTarget)
        ? syncTarget.map((r) => r.id)
        : [(syncTarget as InsightRow).id];
    if (targetIds.length)
      setSyncingIds((prev) => new Set([...prev, ...targetIds]));
    if (syncTarget === null) setSyncingAll(true);
    let hasError = false;
    try {
      if (syncTarget === null) {
        await syncAllAdsets(startDate, endDate, syncMode);
      } else if (Array.isArray(syncTarget)) {
        for (const row of syncTarget as InsightRow[]) {
          await syncAdsetById(row.id, startDate, endDate, syncMode);
        }
      } else {
        await syncAdsetById((syncTarget as InsightRow).id, startDate, endDate, syncMode);
      }
    } catch (_e) {
      hasError = true;
      message.error("同步请求失败，请稍后重试");
    } finally {
      setSyncingAll(false);
      if (targetIds.length) {
        setSyncingIds((prev) => {
          const n = new Set(prev);
          targetIds.forEach((id) => {
            n.delete(id);
          });
          return n;
        });
      }
      if (!hasError) {
        message.success("同步完成，数据已更新");
      }
      actionRef.current?.reload();
      setBatchActionLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await getAdsetInsights({
      size: 10000,
      sortField: "spend",
      sortOrder: "desc",
    });
    const data = (res?.data?.records ?? []) as unknown as InsightRow[];
    if (!data.length) {
      message.warning("暂无数据可导出");
      return;
    }
    const csv = `\ufeff${toCSV(data)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adset_insights_${dayjs().format("YYYYMMDD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ProColumns<InsightRow>[] = [
    {
      title: "日期范围",
      dataIndex: "dateRange",
      valueType: "dateRange",
      hideInTable: true,
      initialValue: [dayjs().subtract(6, "day"), dayjs()],
      order: 100,
      fieldProps: {
        presets: [
          { label: "今天", value: [dayjs(), dayjs()] },
          {
            label: "昨天",
            value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")],
          },
          { label: "最近3天", value: [dayjs().subtract(2, "day"), dayjs()] },
          { label: "最近一周", value: [dayjs().subtract(6, "day"), dayjs()] },
          {
            label: "本周",
            value: [dayjs().startOf("week"), dayjs().endOf("week")],
          },
          {
            label: "最近一个月",
            value: [dayjs().subtract(29, "day"), dayjs()],
          },
          {
            label: "本月",
            value: [dayjs().startOf("month"), dayjs().endOf("month")],
          },
          {
            label: "最近三个月",
            value: [dayjs().subtract(89, "day"), dayjs()],
          },
        ],
        allowClear: true,
        placeholder: ["开始日期", "结束日期"],
      },
      search: {
        transform: (v) => ({
          startDate: v?.[0]
            ? typeof v[0] === "string"
              ? v[0]
              : (v[0] as any).format?.("YYYY-MM-DD")
            : undefined,
          endDate: v?.[1]
            ? typeof v[1] === "string"
              ? v[1]
              : (v[1] as any).format?.("YYYY-MM-DD")
            : undefined,
        }),
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: "left",
      valueType: "select",
      order: -1,
      valueEnum: {
        ACTIVE: { text: "正常", status: "Success" },
        PAUSED: { text: "暂停", status: "Error" },
      },
      render: (_, record) => (
        <Tooltip title={switchLoadingIds.has(record.id) ? "开关操作中，请稍候..." : undefined}>
          <Switch
            checked={record.status === "ACTIVE"}
            checkedChildren="开"
            unCheckedChildren="关"
            loading={switchLoadingIds.has(record.id)}
            disabled={switchLoadingIds.has(record.id)}
            onChange={(c) => handleStatusChange(record, c)}
          />
        </Tooltip>
      ),
    },
    {
      title: "账户ID",
      dataIndex: "accountId",
      width: 150,
      ellipsis: true,
      hideInTable: true,
      hideInSearch: !!hideAccountFilter,
      initialValue: forcedAccountId,
      valueType: "select",
      fieldProps: {
        options: accountIdOptions,
        showSearch: true,
        allowClear: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: "活动ID",
      dataIndex: "campaignId",
      width: 150,
      ellipsis: true,
      hideInTable: true,
      hideInSearch: true,
      valueType: "select",
      fieldProps: {
        options: campaignIdOptions,
        showSearch: true,
        allowClear: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
      },
      initialValue: initCampaignId,
      order: 98,
    },
    {
      title: "广告组ID",
      dataIndex: "adsetId",
      width: 300,
      ellipsis: true,
      fixed: "left",
      order: 97,
      valueType: "select",
      fieldProps: {
        options: adsetIdOptions,
        showSearch: true,
        allowClear: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
      },
      render: (_, record) => {
        const nameText = record.name?.trim();
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <a
                style={{ fontFamily: "monospace", fontSize: 12 }}
                onClick={() => {
                  setDetailRecord(record);
                  setDetailOpen(true);
                }}
              >
                {record.adsetId}
              </a>
              <Typography.Text copyable={{ text: record.adsetId }} style={{ fontSize: 12, lineHeight: 1, color: "#8c8c8c" }} />
            </div>
            <Tooltip title={nameText || "-"}>
              <span
                style={{
                  color: "#8c8c8c",
                  fontSize: 12,
                  lineHeight: "18px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {nameText || "-"}
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "预算",
      dataIndex: "budgetValue",
      width: 270,
      hideInSearch: true,
      render: (_, record) => {
        const content = renderBudgetCell(record);
        if (!onOpenBudgetConfig) {
          return content;
        }
        return (
          <div
            onClick={() => onOpenBudgetConfig(record)}
            style={{ cursor: "pointer" }}
          >
            {content}
          </div>
        );
      },
    },
    {
      title: "投放状态",
      dataIndex: "effectiveStatus",
      width: 120,
      hideInSearch: true,
      valueEnum: {
        ACTIVE: { text: "投放中", status: "Success" },
        PAUSED: { text: "已暂停", status: "Default" },
        CAMPAIGN_PAUSED: { text: "活动暂停", status: "Warning" },
      },
      render: (_, record) => {
        const status = record.effectiveStatus;
        if (!status) return "-";
        const map: Record<string, { text: string; color: string }> = {
          ACTIVE: { text: "投放中", color: "green" },
          PAUSED: { text: "已暂停", color: "default" },
          CAMPAIGN_PAUSED: { text: "活动暂停", color: "orange" },
        };
        const info = map[status] ?? { text: status, color: "default" };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "素材",
      dataIndex: "creativeCount",
      width: 70,
      hideInSearch: true,
      align: "center",
      render: (_, record) => {
        const count = record.creativeCount ?? 0;
        return (
          <a
            onClick={() => {
              setCreativeModalRecord(record);
              setCreativeModalOpen(true);
            }}
          >
            <Badge
              count={count}
              showZero
              style={{
                backgroundColor: count > 0 ? "#1677ff" : "#8c8c8c",
                fontSize: 10,
                height: 16,
                lineHeight: "16px",
                minWidth: 16,
                padding: "0 4px",
              }}
              overflowCount={999}
            >
              <PictureOutlined style={{ fontSize: 16, color: count > 0 ? "#1677ff" : "#8c8c8c" }} />
            </Badge>
          </a>
        );
      },
    },
    {
      title: "项目组",
      dataIndex: "groupId",
      width: 160,
      ellipsis: true,
      order: 96,
      hideInTable: true,
      hideInSearch: !!hideOrgFilters,
      valueType: "select",
      fieldProps: {
        options: projectOptions,
        showSearch: true,
        allowClear: true,
        placeholder: "按项目组筛选",
        filterOption: (input: string, option: any) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: "同步状态",
      dataIndex: "syncStatus",
      width: 150,
      hideInSearch: true,
      render: (_, record) => {
        const syncTimeText = record.syncTime
          ? dayjs(record.syncTime).format("YYYY-MM-DD HH:mm:ss")
          : "-";
        const openChart = () => { setSyncChartRecord(record); setSyncChartOpen(true); };
        if (syncingAll || syncingIds.has(record.id))
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Badge status="processing" text="同步中" />
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                {syncTimeText}
              </span>
            </div>
          );
        const map: Record<
          number,
          { s: "processing" | "success" | "error"; t: string }
        > = {
          0: { s: "processing", t: "同步中" },
          1: { s: "success", t: "成功" },
          2: { s: "error", t: "失败" },
        };
        const v = map[record.syncStatus as number];
        if (!v) return (
          <span style={{ cursor: "pointer", color: "#8c8c8c" }} onClick={openChart}>-</span>
        );
        if (record.syncStatus === 2 && record.syncMsg) {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }} onClick={openChart}>
              <Tooltip title={record.syncMsg}>
                <span
                  style={{
                    color: "#ff4d4f",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    width: "fit-content",
                  }}
                >
                  <ExclamationCircleFilled style={{ fontSize: 12 }} />
                  <span style={{ borderBottom: "1px dashed #ff4d4f" }}>
                    失败
                  </span>
                </span>
              </Tooltip>
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                {syncTimeText}
              </span>
            </div>
          );
        }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }} onClick={openChart}>
            <Badge status={v.s} text={v.t} />
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>
              {syncTimeText}
            </span>
          </div>
        );
      },
    },
    {
      title: "目标事件",
      dataIndex: "targetEventCost",
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
              style={{
                color: "#8c8c8c",
                cursor: "pointer",
                borderBottom: "1px dashed #8c8c8c",
                userSelect: "none",
              }}
              onClick={() => {
                setCpaRecord(record);
                setCpaDateRange([dayjs().subtract(6, "day"), dayjs()]);
                setCpaModalOpen(true);
                setEventInsights([]);
              }}
            >
              暂未设置
            </span>
          );
        }

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              cursor: "pointer",
              padding: "4px 0",
              width: "100%",
            }}
            onClick={() => {
              setCpaRecord(record);
              setCpaDateRange([dayjs().subtract(6, "day"), dayjs()]);
              setCpaModalOpen(true);
              setEventInsights([]);
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 2,
              }}
            >
              {hasCost && (
                <span style={{ fontSize: 13, color: "#1677ff" }}>
                  <span
                    style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}
                  >
                    CPA
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    <AdsConsoleMoneyText
                      value={record.targetEventCost}
                      currency={record.currency}
                      decimal={2}
                    />
                  </span>
                </span>
              )}
              {hasCount && (
                <span style={{ fontSize: 13, color: "#595959" }}>
                  <span
                    style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}
                  >
                    数量
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {(record.targetEventCount as number).toLocaleString()}
                  </span>
                </span>
              )}
            </div>

            {hasTarget && (
              <Tooltip title={record.targetEvent}>
                <div
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#f1f1f4",
                    color: "#2f54eb",
                    fontSize: 12,
                    lineHeight: "18px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {record.targetEvent}
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "目标国家",
      dataIndex: "targetCountrySpend",
      width: 140,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        const hasCountry = record.targetCountry != null;
        const hasSpend = record.targetCountrySpend != null;

        if (record.targetCountry == null) {
          return (
            <span
              style={{
                color: "#8c8c8c",
                cursor: "pointer",
                borderBottom: "1px dashed #8c8c8c",
                userSelect: "none",
              }}
              onClick={() => {
                setCountryRecord(record);
                setCountryDateRange([dayjs().subtract(6, "day"), dayjs()]);
                setCountryModalOpen(true);
                setCountryInsights([]);
              }}
            >
              暂未设置
            </span>
          );
        }

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              cursor: "pointer",
              padding: "4px 0",
              width: "100%",
            }}
            onClick={() => {
              setCountryRecord(record);
              setCountryDateRange([dayjs().subtract(6, "day"), dayjs()]);
              setCountryModalOpen(true);
              setCountryInsights([]);
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 2,
              }}
            >
              {hasSpend && (
                <span style={{ fontSize: 13, color: "#1677ff" }}>
                  <span
                    style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}
                  >
                    消耗
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    <AdsConsoleMoneyText
                      value={record.targetCountrySpend}
                      currency={record.currency}
                      decimal={2}
                    />
                  </span>
                </span>
              )}
            </div>
            {hasCountry && (
              <Tooltip title={record.targetCountry}>
                <div
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "#f1f1f4",
                    color: "#2f54eb",
                    fontSize: 12,
                    lineHeight: "18px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      marginRight: 6,
                      fontSize: 14,
                      verticalAlign: "middle",
                    }}
                  >
                    {getCountryFlagEmoji(record.targetCountry)}
                  </span>
                  <span>{record.targetCountry}</span>
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Spend",
      dataIndex: "spend",
      width: 120,
      hideInSearch: true,
      sorter: true,
      align: "right",
      defaultSortOrder: "descend",
      render: (_, record) => (
        <AdsConsoleMoneyText value={record.spend} currency={record.currency} />
      ),
    },
    {
      title: "Impressions",
      dataIndex: "impressions",
      width: 120,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => (v as number)?.toLocaleString() ?? "-",
    },
    {
      title: "Clicks",
      dataIndex: "clicks",
      width: 100,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => (v as number)?.toLocaleString() ?? "-",
    },
    {
      title: "Reach",
      dataIndex: "reach",
      width: 110,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => (v as number)?.toLocaleString() ?? "-",
    },
    {
      title: "CTR",
      dataIndex: "ctr",
      width: 90,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => `${(v as number)?.toFixed(2)}%`,
    },
    {
      title: "CPC",
      dataIndex: "cpc",
      width: 90,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (_, record) => (
        <AdsConsoleMoneyText value={record.cpc} currency={record.currency} />
      ),
    },
    {
      title: "CPM",
      dataIndex: "cpm",
      width: 90,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (_, record) => (
        <AdsConsoleMoneyText value={record.cpm} currency={record.currency} />
      ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      width: 120,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => (v as number)?.toFixed(2),
    },
    {
      title: "ROAS",
      dataIndex: "roas",
      width: 90,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (v) => Number(v || 0).toFixed(2),
    },
    {
      title: "ROAS ≥",
      dataIndex: "roasMin",
      hideInTable: true,
      valueType: "digit",
      fieldProps: { placeholder: "最小值", min: 0, step: 0.01, style: { width: "100%" } },
    },
    {
      title: "ROAS ≤",
      dataIndex: "roasMax",
      hideInTable: true,
      valueType: "digit",
      fieldProps: { placeholder: "最大值", min: 0, step: 0.01, style: { width: "100%" } },
    },
    {
      title: "操作",
      valueType: "option",
      width: 190,
      fixed: "right",
      render: (_, record) => (
        <Space size={8}>
          {onOpenCreateEditor ? (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onOpenCreateEditor("adset", record)}
            >
              编辑
            </Button>
          ) : null}
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleSyncOne(record)}
          >
            立即同步
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<InsightRow>
        rowKey={(r) => `${r.id}`}
        actionRef={actionRef}
        columns={columns}
        options={{ density: false, reload: true, setting: true }}
        sortDirections={["descend", "ascend"]}
        search={false}
        params={queryParams}
        rowSelection={{
          selectedRowKeys,
          onChange: (_keys, rows) => {
            setSelectedRowKeys(_keys);
            setSelectedRows(rows);
            const selectedAdsetIdList = rows.map((r) => String(r.adsetId));
            const selectedCampaignIdList = Array.from(
              new Set(rows.map((r) => String(r.campaignId)).filter(Boolean))
            );
            onSelectionChange?.(selectedCampaignIdList, selectedAdsetIdList);
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
            <AdsConsoleAuthButton size="small" code="ads:adset:sync" icon={<SyncOutlined />} onClick={handleBatchSync} loading={batchActionLoading}>
              {batchActionLoading ? "操作中..." : "批量同步"}
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton size="small" code="ads:adset:edit" onClick={() => handleBatchStatusChange("ACTIVE")} loading={batchActionLoading}>
              批量开启
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton size="small" code="ads:adset:edit" onClick={() => handleBatchStatusChange("PAUSED")} loading={batchActionLoading}>
              批量关停
            </AdsConsoleAuthButton>
          </Space>
        )}
        request={async (params, sort) => {
          const {
            current,
            pageSize,
            status,
            accountId,
            name,
            campaignId,
            adsetId,
            groupId,
            startDate,
            endDate,
            roasMin,
            roasMax,
          } = params as any;
          const selectedDateRangeText =
            startDate && endDate ? `${startDate} ~ ${endDate}` : "-";
          const activeSortKey = Object.keys(sort).find((k) => sort[k] != null);
          const sortFieldMap: Record<string, string> = {
            targetEventCost: "target_event_cost",
            targetCountrySpend: "target_country_spend",
          };
          const sortField = activeSortKey ? sortFieldMap[activeSortKey] ?? activeSortKey : "spend";
          const sortOrder =
            sort[activeSortKey as string] === "ascend" ? "asc" : "desc";
          const res = await getAdsetInsights({
            current,
            size: pageSize,
            accountId: hasForcedAccountScope ? undefined : (forcedAccountId || accountId),
            selectedAccountIds: hasForcedAccountScope ? forcedAccountIds : undefined,
            name,
            campaignId: hasForcedCampaignScope ? undefined : campaignId,
            campaignIds: hasForcedCampaignScope ? forcedCampaignIds : undefined,
            adsetId,
            groupId,
            startDate,
            endDate,
            sortField,
            sortOrder,
            status,
            roasMin,
            roasMax,
          });
          const data = ((res?.data?.records ?? []) as unknown as InsightRow[]).map(
            (item) => ({
              ...item,
              dateRange: selectedDateRangeText,
            })
          );
          setTableData(data);
          return {
            data,
            total: res?.data?.total ?? 0,
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
                { label: "今天", value: [dayjs(), dayjs()] },
                { label: "昨天", value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
                { label: "最近3天", value: [dayjs().subtract(2, 'day'), dayjs()] },
                { label: "最近一周", value: [dayjs().subtract(6, 'day'), dayjs()] },
                { label: "最近一个月", value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: "最近三个月", value: [dayjs().subtract(89, 'day'), dayjs()] },
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
                options={accountIdOptions}
                filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            );
          }
          items.push(
            <Select
              key="campaignId"
              value={filterCampaignId}
              onChange={setFilterCampaignId}
              allowClear
              showSearch
              placeholder="活动ID"
              style={{ width: 160 }}
              options={campaignIdOptions}
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
              options={adsetIdOptions}
              filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />,
            <Input
              key="name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value || undefined)}
              allowClear
              placeholder="请输入广告组名称"
              style={{ width: 200 }}
            />,
          );
          if (!hideOrgFilters) {
            items.push(
              <Select
                key="groupId"
                value={filterGroupId}
                onChange={setFilterGroupId}
                allowClear
                showSearch
                placeholder="项目组"
                style={{ width: 160 }}
                options={projectOptions}
                filterOption={(input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            );
          }
          if (selectedRows.length > 0) {
            // batch actions handled by tableAlertOptionRender
          }
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
              key="query"
              type="primary"
              onClick={() => setQueryParams({
                startDate: filterDateRange[0].format("YYYY-MM-DD"),
                endDate: filterDateRange[1].format("YYYY-MM-DD"),
                status: filterStatus,
                accountId: filterAccountId,
                name: filterName,
                campaignId: filterCampaignId,
                adsetId: filterAdsetId,
                groupId: filterGroupId,
                roasMin: filterRoasMin,
                roasMax: filterRoasMax,
              })}
            >
              查询
            </Button>,
          );
          return items;
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1600, y: "45vh" }}
        size="small"
        cardProps={{ bodyStyle: { overflow: "visible" } }}
      />

      <Modal
        title="广告组数据详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="账户ID" span={2}>
              {detailRecord.accountId}
            </Descriptions.Item>
            <Descriptions.Item label="活动ID" span={2}>
              {detailRecord.campaignId}
            </Descriptions.Item>
            <Descriptions.Item label="日期">
              {detailRecord.date}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {detailRecord.status === "ACTIVE" ? "正常" : "暂停"}
            </Descriptions.Item>
            <Descriptions.Item label="曝光量">
              {detailRecord.impressions.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="点击量">
              {detailRecord.clicks.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="覆盖人数">
              {detailRecord.reach.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="点击率">
              {detailRecord.ctr.toFixed(2)}%
            </Descriptions.Item>
            <Descriptions.Item label="消耗">
              <AdsConsoleMoneyText
                value={detailRecord.spend}
                currency={detailRecord.currency}
              />
            </Descriptions.Item>
            <Descriptions.Item label="CPC">
              <AdsConsoleMoneyText
                value={detailRecord.cpc}
                currency={detailRecord.currency}
              />
            </Descriptions.Item>
            <Descriptions.Item label="CPM">
              <AdsConsoleMoneyText
                value={detailRecord.cpm}
                currency={detailRecord.currency}
              />
            </Descriptions.Item>
            <Descriptions.Item label="频次">
              {detailRecord.frequency.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="ROAS">
              {Number(detailRecord.roas || 0).toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <ModalForm
        key={editModalKey}
        title={editRecord ? "编辑广告组" : "新建广告组"}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setEditRecord(null);
          }
        }}
        initialValues={{ ...editRecord }}
        layout="vertical"
        onFinish={async (values) => {
          const res = editRecord
            ? await updateAdset({ id: editRecord.id, ...values })
            : await createAdset(values);
          if (res?.success) {
            message.success(editRecord ? "修改成功" : "创建成功");
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || "操作失败");
          return false;
        }}
        width={760}
      >
        <Row gutter={16}>
          <Col span={12}>
            <ProFormText
              name="name"
              label="广告组名称"
              rules={[{ required: !editRecord, message: "请输入广告组名称" }]}
              placeholder="请输入广告组名称"
            />
          </Col>
          <Col span={12}>
            <ProFormText
              name="accountId"
              label="账户ID"
              placeholder="Facebook广告账户ID"
            />
          </Col>
          <Col span={12}>
            <ProFormText
              name="campaignId"
              label="活动ID"
              placeholder="所属活动ID"
            />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="bidStrategy"
              label="出价策略"
              options={[
                { label: "最低费用", value: "LOWEST_COST" },
                { label: "目标费用", value: "TARGET_COST" },
                { label: "费用上限", value: "COST_CAP" },
              ]}
            />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="status"
              label="状态"
              options={[
                { label: "正常", value: 1 },
                { label: "暂停", value: 0 },
              ]}
            />
          </Col>
          <Col span={12} />


          <Col span={24}>
            <ProFormText
              name="remark"
              label="备注"
              placeholder="请输入备注信息"
            />
          </Col>
        </Row>
      </ModalForm>

      <Modal
        title={
          syncTarget === null
            ? "全量同步"
            : Array.isArray(syncTarget)
            ? `批量同步（已选 ${syncTarget.length} 条）`
            : "立即同步"
        }
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        onOk={handleSyncConfirm}
        okText="开始同步"
        cancelText="取消"
        width={440}
      >
        <div style={{ padding: "16px 0 8px" }}>
          <div style={{ marginBottom: 12, color: "#666" }}>
            请选择同步方式：
          </div>
          <Radio.Group
            value={syncMode}
            onChange={(e) => setSyncMode(e.target.value)}
            style={{ marginBottom: 12 }}
            options={[
              { label: "同步实体信息", value: "ENTITY" },
              { label: "同步成效数据", value: "INSIGHTS" },
              { label: "全同步", value: "FULL" },
            ]}
          />
          {syncMode !== "ENTITY" ? (
            <>
              <div style={{ marginBottom: 12, color: "#666" }}>
                请选择需要同步的数据日期范围：
              </div>
              <DatePicker.RangePicker
                value={syncDateRange}
                onChange={(v) => {
                  if (v?.[0] && v[1]) setSyncDateRange([v[0], v[1]]);
                }}
                presets={[
                  { label: "今天", value: [dayjs(), dayjs()] },
                  {
                    label: "昨天",
                    value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")],
                  },
                  {
                    label: "最近3天",
                    value: [dayjs().subtract(2, "day"), dayjs()],
                  },
                  {
                    label: "最近一周",
                    value: [dayjs().subtract(6, "day"), dayjs()],
                  },
                  {
                    label: "最近一个月",
                    value: [dayjs().subtract(29, "day"), dayjs()],
                  },
                  {
                    label: "最近三个月",
                    value: [dayjs().subtract(89, "day"), dayjs()],
                  },
                ]}
                style={{ width: "100%" }}
              />
            </>
          ) : null}
        </div>
      </Modal>
      <Modal
        title={
          <span>
            CPA 事件详情
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                fontWeight: 400,
                color: "#8c8c8c",
              }}
            >
              广告组 {cpaRecord?.adsetId}
            </span>
          </span>
        }
        open={cpaModalOpen}
        onCancel={() => {
          setCpaModalOpen(false);
          setCpaRecord(null);
          setEventInsights([]);
          setEventSearchKeyword("");
        }}
        footer={null}
        width={700}
        afterOpenChange={(open) => {
          if (open && cpaRecord) {
            setEventInsightsLoading(true);
            getEventInsights({
              objectId: cpaRecord.adsetId,
              objectType: "adset",
              startDate: cpaDateRange[0].format("YYYY-MM-DD"),
              endDate: cpaDateRange[1].format("YYYY-MM-DD"),
            })
              .then((res) => {
                const sorted = [...(res?.data ?? [])].sort(
                  (a, b) => Number(b.costPerAction) - Number(a.costPerAction)
                );
                setEventInsights(sorted);
              })
              .finally(() => setEventInsightsLoading(false));
          }
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#666", fontSize: 13 }}>日期范围：</span>
          <DatePicker.RangePicker
            size="small"
            value={cpaDateRange}
            onChange={(v) => {
              if (v?.[0] && v[1] && cpaRecord) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCpaDateRange(range);
                setEventInsightsLoading(true);
                getEventInsights({
                  objectId: cpaRecord.adsetId,
                  objectType: "adset",
                  startDate: v[0].format("YYYY-MM-DD"),
                  endDate: v[1].format("YYYY-MM-DD"),
                })
                  .then((res) => {
                    const sorted = [...(res?.data ?? [])].sort(
                      (a, b) =>
                        Number(b.costPerAction) - Number(a.costPerAction)
                    );
                    setEventInsights(sorted);
                  })
                  .finally(() => setEventInsightsLoading(false));
              }
            }}
            allowClear={false}
          />
        </div>
        <Input.Search
          allowClear
          value={eventSearchKeyword}
          onChange={(e) => setEventSearchKeyword(e.target.value)}
          placeholder="搜索事件类型"
          style={{ marginBottom: 8 }}
        />
        <Spin spinning={eventInsightsLoading}>
          <Table
            size="small"
            dataSource={filteredEventInsights}
            rowKey="actionType"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total) => `共 ${total} 条`,
            }}
            style={{ marginTop: 8 }}
            locale={{ emptyText: "暂无事件数据" }}
            columns={[
              {
                title: "事件类型",
                dataIndex: "actionType",
                key: "actionType",
                render: (v: string) => (
                  <Tag style={{ fontFamily: "monospace" }}>{v}</Tag>
                ),
              },
              {
                title: "数量",
                dataIndex: "actionCount",
                key: "actionCount",
                align: "right",
                render: (v: string) => Number(v).toLocaleString(),
              },
              {
                title: "单次成本",
                dataIndex: "costPerAction",
                key: "costPerAction",
                align: "right",
                render: (v: number) => (
                  <span style={{ fontWeight: 500 }}>
                    <AdsConsoleMoneyText
                      value={v}
                      currency={cpaRecord?.currency}
                      decimal={4}
                    />
                  </span>
                ),
              },
            ]}
          />
        </Spin>
      </Modal>

      <Modal
        title={
          <span>
            国家数据详情
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                fontWeight: 400,
                color: "#8c8c8c",
              }}
            >
              广告组 {countryRecord?.adsetId}
            </span>
          </span>
        }
        open={countryModalOpen}
        onCancel={() => {
          setCountryModalOpen(false);
          setCountryRecord(null);
          setCountryInsights([]);
          setCountrySearchKeyword("");
        }}
        footer={null}
        width={680}
        afterOpenChange={(open) => {
          if (open && countryRecord) {
            setCountryInsightsLoading(true);
            getCountryInsights({
              objectId: countryRecord.adsetId,
              objectType: "adset",
              startDate: countryDateRange[0].format("YYYY-MM-DD"),
              endDate: countryDateRange[1].format("YYYY-MM-DD"),
            })
              .then((res) => {
                const sorted = [...(res?.data ?? [])].sort(
                  (a, b) => Number(b.spend) - Number(a.spend)
                );
                setCountryInsights(sorted);
              })
              .finally(() => setCountryInsightsLoading(false));
          }
        }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#666", fontSize: 13 }}>日期范围：</span>
          <DatePicker.RangePicker
            size="small"
            value={countryDateRange}
            onChange={(v) => {
              if (v?.[0] && v[1] && countryRecord) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCountryDateRange(range);
                setCountryInsightsLoading(true);
                getCountryInsights({
                  objectId: countryRecord.adsetId,
                  objectType: "adset",
                  startDate: v[0].format("YYYY-MM-DD"),
                  endDate: v[1].format("YYYY-MM-DD"),
                })
                  .then((res) => {
                    const sorted = [...(res?.data ?? [])].sort(
                      (a, b) => Number(b.spend) - Number(a.spend)
                    );
                    setCountryInsights(sorted);
                  })
                  .finally(() => setCountryInsightsLoading(false));
              }
            }}
            allowClear={false}
          />
        </div>
        <Input.Search
          allowClear
          value={countrySearchKeyword}
          onChange={(e) => setCountrySearchKeyword(e.target.value)}
          placeholder="搜索国家/地区代码"
          style={{ marginBottom: 8 }}
        />
        <Spin spinning={countryInsightsLoading}>
          <Table
            size="small"
            dataSource={filteredCountryInsights}
            rowKey="country"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total) => `共 ${total} 条`,
            }}
            style={{ marginTop: 4 }}
            locale={{ emptyText: "暂无国家数据" }}
            columns={[
              {
                title: "国家/地区",
                dataIndex: "country",
                key: "country",
                render: (v: string) => (
                  <Tag style={{ fontFamily: "monospace" }}>
                    <span style={{ marginRight: 6 }}>
                      {getCountryFlagEmoji(v)}
                    </span>
                    <span>{v}</span>
                  </Tag>
                ),
              },
              {
                title: "消耗",
                dataIndex: "spend",
                key: "spend",
                align: "right",
                defaultSortOrder: "descend",
                sorter: (a, b) => Number(a.spend) - Number(b.spend),
                render: (v: number) => (
                  <span style={{ fontWeight: 500 }}>
                    <AdsConsoleMoneyText
                      value={v}
                      currency={countryRecord?.currency}
                      decimal={4}
                    />
                  </span>
                ),
              },
            ]}
          />
        </Spin>
      </Modal>

      <Modal
        title={
          <span>
            广告素材
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: "#8c8c8c" }}>
              广告组 {creativeModalRecord?.adsetId}
            </span>
          </span>
        }
        open={creativeModalOpen}
        onCancel={() => {
          setCreativeModalOpen(false);
          setCreativeModalRecord(null);
        }}
        footer={null}
        width="90vw"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {creativeModalRecord && (
          <CreativeManagePage
            key={`creative-modal-${creativeModalRecord.adsetId}`}
            forcedAccountId={creativeModalRecord.accountId}
            forcedAdsetIds={[creativeModalRecord.adsetId]}
            hideAccountFilter
            hideHierarchyFilters
          />
        )}
      </Modal>

      <AdsConsoleSyncHistoryChart
        open={syncChartOpen}
        onClose={() => { setSyncChartOpen(false); setSyncChartRecord(null); }}
        objectType="adset"
        objectId={syncChartRecord?.accountId ?? ""}
        title={`同步历史 · 广告组 ${syncChartRecord?.accountId ?? ""}`}
      />
    </>
  );
};

export default AdsetInsightPage;





