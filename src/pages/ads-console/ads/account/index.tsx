import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import AdsConsoleMoneyText from "@/components/AdsConsoleMoneyText";
import { renderAdsMetricsSummary } from "@/components/AdsConsoleMetricsSummary";
import AdsConsoleSyncHistoryChart from "@/components/AdsConsoleSyncHistoryChart";
import { assignAccountGroup, assignAccountOwner, deleteAccount, exportAccountInsights, getAccountInsights, syncAccountById, syncAllAccounts, updateAccountStatus } from "@/services/ads-console/account";
import { getCountryInsights, getEventInsights } from "@/services/ads-console/insights";
import { getAccountOptions } from "@/services/ads-console/adsOptions";
import { getGroupOptions } from "@/services/ads-console/orgOptions";
import { getUserOptions } from "@/services/ads-console/userOptions";
import { getAdsAuthToken } from "@/services/ads-console/authStorage";
import { DownloadOutlined, ExclamationCircleFilled, SyncOutlined } from "@ant-design/icons";
import { type ActionType, ModalForm, type ProColumns, ProFormSelect, ProFormText, ProTable } from "@ant-design/pro-components";
import { history, useModel } from "@umijs/max";
import { hasAdsConsolePermission } from "@/utils/adsConsoleAccess";
import { App, Badge, Button, Col, DatePicker, Descriptions, Input, InputNumber, Modal, Popconfirm, Progress, Radio, Row, Select, Space, Spin, Switch, Table, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";

type InsightEvent = {
  actionType: string;
  actionCount: string;
  costPerAction: number;
};

type InsightRow = {
  id: string;
  accountId: string;
  accountStatus?: number;
  name?: string;
  groupId?: string;
  token?: string;
  syncStatus?: number;
  syncTime?: string;
  userId?: string;
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
  balance?: number;
  spendCap?: number;
  amountSpent?: number;
  availableCap?: number;
  events?: InsightEvent[];
  syncMsg?: string;
  targetEvent?: string;
  targetEventCount?: number;
  targetEventCost?: number;
  targetCountry?: string;
  targetCountrySpend?: number;
  dateRange?: string;
};

function getCountryFlagEmoji(countryCode?: string): string {
  if (!countryCode) return "🌐";
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  const [first, second] = code.split("");
  return String.fromCodePoint(127397 + first.charCodeAt(0), 127397 + second.charCodeAt(0));
}

function spendProgressColor(percent: number): string {
  if (percent < 20) return "#ff4d4f";
  if (percent >= 80) return "#52c41a";
  return "#faad14";
}


const AccountInsightPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
  const hasPermission = (code: string) => hasAdsConsolePermission(currentUser, code);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, _setDetailRecord] = useState<InsightRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<InsightRow | null>(null);
  const [editModalKey, setEditModalKey] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<InsightRow[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<null | InsightRow | InsightRow[]>(null);
  const [syncDateRange, setSyncDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, "day"), dayjs()]);
  const [syncMode, setSyncMode] = useState<"ENTITY" | "INSIGHTS" | "FULL">("INSIGHTS");
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [accountIdOptions, setAccountIdOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ label: string; value: string }[]>([]);
  const [editUserOptions, setEditUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [editGroupOptions, setEditGroupOptions] = useState<{ label: string; value: string }[]>([]);
  const [cpaModalOpen, setCpaModalOpen] = useState(false);
  const [cpaRecord, setCpaRecord] = useState<InsightRow | null>(null);
  const [cpaDateRange, setCpaDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, "day"), dayjs()]);
  const [eventInsights, setEventInsights] = useState<AdsConsole.AdsAccountEventInsight[]>([]);
  const [eventInsightsLoading, setEventInsightsLoading] = useState(false);
  const [eventSearchKeyword, setEventSearchKeyword] = useState("");
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countryRecord, setCountryRecord] = useState<InsightRow | null>(null);
  const [countryDateRange, setCountryDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(6, "day"), dayjs()]);
  const [countryInsights, setCountryInsights] = useState<AdsConsole.AdsAccountCountryInsight[]>([]);
  const [countryInsightsLoading, setCountryInsightsLoading] = useState(false);
  const [countrySearchKeyword, setCountrySearchKeyword] = useState("");
  const [editModalLoadingOptions, setEditModalLoadingOptions] = useState(false);
  const [syncChartOpen, setSyncChartOpen] = useState(false);
  const [syncChartRecord, setSyncChartRecord] = useState<InsightRow | null>(null);
  const [switchLoadingIds, setSwitchLoadingIds] = useState<Set<string>>(new Set());
  const [tableData, setTableData] = useState<InsightRow[]>([]);
  const lastQueryRef = useRef<Record<string, any>>({});
  const [exporting, setExporting] = useState(false);

  const loadEditModalOptions = async () => {
    setEditModalLoadingOptions(true);
    try {
      const [userRes, groupRes] = await Promise.all([getUserOptions(), getGroupOptions()]);
      setUserOptions(userRes?.data ?? []);
      setEditUserOptions(userRes?.data ?? []);
      const groupMapped = (groupRes?.data ?? []).map((o) => ({
        label: o.label,
        value: String(o.value),
      }));
      setGroupOptions(groupMapped);
      setEditGroupOptions(groupMapped);
    } finally {
      setEditModalLoadingOptions(false);
    }
  };

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

  const groupNameMap = useMemo(() => new Map(groupOptions.map((option) => [String(option.value), option.label])), [groupOptions]);

  const userNameMap = useMemo(() => new Map(userOptions.map((option) => [String(option.value), option.label])), [userOptions]);

  const getMappedName = (optionsMap: Map<string, string>, ...rawValues: Array<string | undefined>) => {
    const value = rawValues.find((item) => item != null && item !== "");
    if (!value) return "-";
    return optionsMap.get(String(value)) || String(value);
  };

  const dateRangePresets = [
    { label: "今天", value: [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "昨天", value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "最近3天", value: [dayjs().subtract(2, "day"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "最近一周", value: [dayjs().subtract(6, "day"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "本周", value: [dayjs().startOf("week"), dayjs().endOf("week")] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "最近一个月", value: [dayjs().subtract(29, "day"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "本月", value: [dayjs().startOf("month"), dayjs().endOf("month")] as [dayjs.Dayjs, dayjs.Dayjs] },
    { label: "最近三个月", value: [dayjs().subtract(89, "day"), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
  ];

  useEffect(() => {
    getAccountOptions().then((res) => {
      setAccountIdOptions(res.data || []);
    });
    getGroupOptions().then((res) => {
      setGroupOptions(
        (res?.data ?? []).map((o) => ({
          label: o.label,
          value: String(o.value),
        }))
      );
    });
    getUserOptions().then((res) => {
      setUserOptions(res?.data ?? []);
    });
  }, []);

  const handleStatusChange = async (record: InsightRow, checked: boolean) => {
    setSwitchLoadingIds((prev) => new Set([...prev, record.id]));
    const hideLoading = message.loading("开关状态更新中，请稍候...", 0);
    try {
      const res = await updateAccountStatus(record.id, checked ? 1 : 2);
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
    const res = await deleteAccount(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = lastQueryRef.current;
      const params = new URLSearchParams();
      params.set("current", "1");
      params.set("size", "100000");
      if (q.startDate) params.set("startDate", q.startDate);
      if (q.endDate) params.set("endDate", q.endDate);
      if (q.accountId) params.set("accountId", q.accountId);
      if (q.name) params.set("name", q.name);
      if (q.accountStatus != null) params.set("accountStatus", q.accountStatus);
      if (q.groupId) params.set("groupId", q.groupId);
      if (q.userId) params.set("userId", q.userId);
      if (q.syncStatus != null) params.set("syncStatus", q.syncStatus);
      if (q.syncMsg) params.set("syncMsg", q.syncMsg);
      if (q.roasMin != null) params.set("roasMin", q.roasMin);
      if (q.roasMax != null) params.set("roasMax", q.roasMax);
      const token = getAdsAuthToken();
      const url = `/ads-api/fb/account/export?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `广告账户_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      message.success("导出成功");
    } catch {
      message.error("导出失败");
    } finally {
      setExporting(false);
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
    // 立即关闭弹窗
    setSyncModalOpen(false);
    message.info("同步已提交，正在后台处理中...");
    // 记录正在同步的 ID（前端乐观更新）
    const targetIds: string[] = syncTarget === null ? [] : Array.isArray(syncTarget) ? syncTarget.map((r) => r.id) : [(syncTarget as InsightRow).id];
    if (targetIds.length) {
      setSyncingIds((prev) => new Set([...prev, ...targetIds]));
    }
    // 全量同步时标记所有行为同步中
    if (syncTarget === null) {
      setSyncingAll(true);
    }
    // 异步执行同步，完成后自动刷新
    let hasError = false;
    try {
      if (syncTarget === null) {
        await syncAllAccounts(startDate, endDate, syncMode);
      } else if (Array.isArray(syncTarget)) {
        for (const row of syncTarget as InsightRow[]) {
          await syncAccountById(row.id, startDate, endDate, syncMode);
        }
      } else {
        await syncAccountById((syncTarget as InsightRow).id, startDate, endDate, syncMode);
      }
    } catch (_e) {
      hasError = true;
      message.error("同步请求失败，请稍后重试");
    } finally {
      setSyncingAll(false);
      if (targetIds.length) {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          for (const id of targetIds) {
            next.delete(id);
          }
          return next;
        });
      }
      if (!hasError) {
        message.success("同步完成，数据已更新");
      }
      actionRef.current?.reload();
      setBatchActionLoading(false);
    }
  };

  const columns: ProColumns<InsightRow>[] = [
    {
      title: "日期",
      dataIndex: "dateRange",
      hideInTable: true,
      initialValue: [dayjs().subtract(6, "day"), dayjs()],
      renderFormItem: () => (
        <DatePicker.RangePicker
          presets={dateRangePresets}
          allowClear={false}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "accountStatus",
      width: 90,
      fixed: "left",
      valueEnum: {
        1: { text: "启用" },
        2: { text: "停用" },
      },
      renderFormItem: () => (
        <Select
          placeholder="请选择状态"
          allowClear
          options={[
            { label: "启用", value: 1 },
            { label: "停用", value: 2 },
          ]}
        />
      ),
      render: (_, record) => (
        <Tooltip title={switchLoadingIds.has(record.id) ? "开关操作中，请稍候..." : undefined}>
          <Switch
            checked={record.accountStatus === 1}
            checkedChildren="开"
            unCheckedChildren="关"
            loading={switchLoadingIds.has(record.id)}
            disabled={switchLoadingIds.has(record.id)}
            onChange={(checked) => handleStatusChange(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: "账户",
      dataIndex: "accountId",
      width: 400,
      ellipsis: true,
      fixed: "left",
      renderFormItem: () => (
        <Select
          placeholder="请选择账户"
          allowClear
          showSearch
          options={accountIdOptions}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        />
      ),
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              onClick={() => {
                const teamId = (record as any).teamId ?? (record as any).team_id ?? "";
                const groupId = (record as any).groupId ?? (record as any).group_id ?? "";
                const params = new URLSearchParams({ tab: "campaign" });
                if (teamId) params.set("teamId", String(teamId));
                if (groupId) params.set("groupId", String(groupId));
                if (record.accountId) params.set("accountIds", String(record.accountId));
                history.push(`/ads-console/ads/summary?${params.toString()}`);
              }}
              style={{ fontWeight: 500, fontFamily: "monospace", fontSize: 12 }}
            >
              {record.accountId}
            </a>
            <Typography.Text copyable={{ text: record.accountId }} style={{ fontSize: 12, lineHeight: 1, color: "#8c8c8c" }} />
            <span
              style={{
                padding: "1px 8px",
                borderRadius: 10,
                background: "#eef4ff",
                border: "1px solid #d6e4ff",
                color: "#1f3a8a",
                fontSize: 12,
                lineHeight: "18px",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={getMappedName(groupNameMap, (record as any).groupId, (record as any).group_id)}
            >
              {getMappedName(groupNameMap, (record as any).groupId, (record as any).group_id)}
            </span>
            <span
              style={{
                padding: "1px 8px",
                borderRadius: 10,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
                color: "#374151",
                fontSize: 12,
                lineHeight: "18px",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={getMappedName(userNameMap, (record as any).userId, (record as any).user_id)}
            >
              {getMappedName(userNameMap, (record as any).userId, (record as any).user_id)}
            </span>
          </div>
          <span
            style={{
              color: "#8c8c8c",
              fontSize: 12,
              lineHeight: "18px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={record.name || "-"}
          >
            名称：{record.name || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "账户名称",
      dataIndex: "name",
      hideInTable: true,
    },
    {
      title: "项目组",
      dataIndex: "groupId",
      hideInTable: true,
      renderFormItem: () => (
        <Select
          placeholder="请选择项目组"
          allowClear
          showSearch
          options={groupOptions}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        />
      ),
    },
    {
      title: "投手",
      dataIndex: "userId",
      hideInTable: true,
      renderFormItem: () => (
        <Select
          placeholder="请选择投手"
          allowClear
          showSearch
          options={userOptions}
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        />
      ),
    },
    {
      title: "ROAS最小值",
      dataIndex: "roasMin",
      hideInTable: true,
      renderFormItem: () => <InputNumber placeholder="ROAS ≥" min={0} step={0.1} style={{ width: "100%" }} />,
    },
    {
      title: "ROAS最大值",
      dataIndex: "roasMax",
      hideInTable: true,
      renderFormItem: () => <InputNumber placeholder="ROAS ≤" min={0} step={0.1} style={{ width: "100%" }} />,
    },
    {
      title: "可用额度",
      dataIndex: "balance",
      width: 260,
      hideInSearch: true,
      align: "left",
      render: (_, record) => {
        const spendCap = record.spendCap == null ? null : Number(record.spendCap);
        const amountSpent = record.amountSpent == null ? 0 : Number(record.amountSpent);
        const availableCap =
          record.availableCap == null
            ? Math.max((spendCap ?? 0) - amountSpent, 0)
            : Number(record.availableCap);
        if (spendCap == null) return "-";
        const isUnlimited = spendCap === 0;
        const percentRaw = isUnlimited ? 0 : (availableCap / spendCap) * 100;
        const percent = Math.max(0, Math.min(100, Number.isFinite(percentRaw) ? percentRaw : 0));
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#8c8c8c", lineHeight: 1.3 }}>
              额度上限：{isUnlimited ? "不限额" : <AdsConsoleMoneyText value={record.spendCap} currency={record.currency} />}
            </span>
            {isUnlimited ? (
              <span style={{ color: "#8c8c8c", fontSize: 12, lineHeight: 1.3 }}>-</span>
            ) : (
              <Tooltip
                title={
                  <span>
                    可用额度：<AdsConsoleMoneyText value={availableCap} currency={record.currency} />
                  </span>
                }
              >
                <Progress
                  percent={Number(percent.toFixed(2))}
                  strokeColor={spendProgressColor(percent)}
                  size="small"
                  showInfo={false}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "同步状态",
      dataIndex: "syncStatus",
      width: 170,
      valueEnum: {
        0: { text: "同步中" },
        1: { text: "同步成功" },
        2: { text: "同步失败" },
      },
      renderFormItem: () => (
        <Select
          placeholder="请选择同步状态"
          allowClear
          options={[
            { label: "同步中", value: 0 },
            { label: "同步成功", value: 1 },
            { label: "同步失败", value: 2 },
          ]}
        />
      ),
      render: (_, record) => {
        const syncTimeText = record.syncTime ? dayjs(record.syncTime).format("YYYY-MM-DD HH:mm:ss") : "暂无";

        const openChart = () => {
          setSyncChartRecord(record);
          setSyncChartOpen(true);
        };

        if (syncingAll || syncingIds.has(record.id)) {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Badge status="processing" text="同步中" />
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>{syncTimeText}</span>
            </div>
          );
        }
        const map: Record<number, { s: "processing" | "success" | "error"; t: string }> = {
          0: { s: "processing", t: "同步中" },
          1: { s: "success", t: "成功" },
          2: { s: "error", t: "失败" },
        };
        const v = map[record.syncStatus as number];
        if (!v) return (
          <span style={{ cursor: "pointer", color: "#8c8c8c" }} onClick={openChart}>-</span>
        );
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }} onClick={openChart}>
            <Badge status={v.s} text={v.t} />
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>{syncTimeText}</span>
          </div>
        );
      },
    },
    {
      title: "同步信息关键词",
      dataIndex: "syncMsgKeyword",
      hideInTable: true,
      renderFormItem: () => <Input placeholder="同步信息模糊搜索" allowClear />,
    },
    {
      title: "同步信息",
      dataIndex: "syncMsg",
      width: 260,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => {
        if (syncingAll || syncingIds.has(record.id) || record.syncStatus === 0) {
          return <Typography.Text type="secondary">同步中</Typography.Text>;
        }
        if (record.syncStatus === 1) {
          return <Tag color="success">同步成功</Tag>;
        }
        if (record.syncStatus === 2) {
          const messageText = record.syncMsg || "同步失败";
          return (
            <Tooltip title={messageText}>
              <span style={{ color: "#ff4d4f", display: "inline-flex", alignItems: "center", gap: 4, maxWidth: "100%" }}>
                <ExclamationCircleFilled style={{ fontSize: 12, flex: "none" }} />
                <Typography.Text type="danger" ellipsis style={{ maxWidth: 220 }}>
                  {messageText}
                </Typography.Text>
              </span>
            </Tooltip>
          );
        }
        return "-";
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
                  <span style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}>CPA</span>
                  <span style={{ fontWeight: 600 }}>
                    <AdsConsoleMoneyText value={record.targetEventCost} currency={record.currency} decimal={2} />
                  </span>
                </span>
              )}
              {hasCount && (
                <span style={{ fontSize: 13, color: "#595959" }}>
                  <span style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}>数量</span>
                  <span style={{ fontWeight: 500 }}>{(record.targetEventCount as number).toLocaleString()}</span>
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
                  <span style={{ color: "#8c8c8c", marginRight: 4, fontSize: 12 }}>消耗</span>
                  <span style={{ fontWeight: 600 }}>
                    <AdsConsoleMoneyText value={record.targetCountrySpend} currency={record.currency} decimal={2} />
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
      render: (_, record) => <AdsConsoleMoneyText value={record.spend} currency={record.currency} />,
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
      render: (_, record) => <AdsConsoleMoneyText value={record.cpc} currency={record.currency} />,
    },
    {
      title: "CPM",
      dataIndex: "cpm",
      width: 90,
      hideInSearch: true,
      sorter: true,
      align: "right",
      render: (_, record) => <AdsConsoleMoneyText value={record.cpm} currency={record.currency} />,
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
      title: "操作",
      valueType: "option",
      width: 120,
      fixed: "right",
      render: (_, record) => {
        return [
          <Button key="sync" type="link" size="small" icon={<SyncOutlined />} onClick={() => handleSyncOne(record)}>
            立即同步
          </Button>,
        ].filter(Boolean);
      },
    },
  ];

  return (
    <>
      <ProTable<InsightRow>
        rowKey={(r) => `${r.accountId}`}
        actionRef={actionRef}
        columns={columns}
        options={{ density: false, reload: true, setting: true }}
        sortDirections={["descend", "ascend"]}
        search={{
          labelWidth: "auto",
          defaultCollapsed: false,
        }}
        request={async (params, sort) => {
          const { current, pageSize, accountId, name, accountStatus, groupId, userId, syncStatus, syncMsgKeyword, roasMin, roasMax, dateRange } = params as any;
          const startDate = dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : dayjs().subtract(6, "day").format("YYYY-MM-DD");
          const endDate = dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
          const selectedDateRangeText = startDate && endDate ? `${startDate} ~ ${endDate}` : "-";
          const activeSortKey = Object.keys(sort).find((k) => sort[k] != null);
          const sortFieldMap: Record<string, string> = {
            targetEventCost: "target_event_cost",
            targetCountrySpend: "target_country_spend",
          };
          const sortField = activeSortKey ? sortFieldMap[activeSortKey] ?? activeSortKey : "spend";
          const sortOrder = sort[activeSortKey as string] === "ascend" ? "asc" : "desc";
          lastQueryRef.current = { accountId, name, accountStatus, groupId, userId, syncStatus, syncMsg: syncMsgKeyword, roasMin, roasMax, startDate, endDate };
          const res = await getAccountInsights({
            current,
            size: pageSize,
            accountId,
            name,
            accountStatus,
            groupId,
            userId,
            syncStatus,
            syncMsg: syncMsgKeyword,
            roasMin,
            roasMax,
            startDate,
            endDate,
            sortField,
            sortOrder,
          });
          const data = ((res?.data?.records ?? []) as unknown as InsightRow[]).map((item) => ({
            ...item,
            dateRange: selectedDateRangeText,
          }));
          setTableData(data);
          return {
            data,
            total: res?.data?.total ?? 0,
            success: res?.success ?? false,
          };
        }}
        summary={() =>
          renderAdsMetricsSummary({
            columns: columns.map((column) => ({
              dataIndex: column.dataIndex,
              hideInTable: column.hideInTable,
              align: column.align === "left" || column.align === "right" || column.align === "center" ? column.align : undefined,
              fixed: column.fixed,
            })),
            rows: tableData,
            hasSelectionColumn: true,
          })
        }
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
            <span>
              已选 <strong>{keys.length}</strong> 条
            </span>
            <Button size="small" onClick={onCleanSelected}>
              取消选择
            </Button>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <AdsConsoleAuthButton
              size="small"
              code="ads:account:sync"
              icon={<SyncOutlined />}
              onClick={handleBatchSync}
              disabled={!selectedRows.length || batchActionLoading}
              loading={batchActionLoading}
            >
              {batchActionLoading ? "操作中..." : "批量同步"}
            </AdsConsoleAuthButton>
          </Space>
        )}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1400, y: "65vh" }}
        size="small"
        cardProps={{ bodyStyle: { overflow: "visible" } }}
        toolBarRender={() => [
          <Button key="export" icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
            {exporting ? "导出中..." : "导出 Excel"}
          </Button>,
        ]}
      />

      <Modal title="账户数据详情" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640}>
        {detailRecord && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="账户ID" span={2}>
              {detailRecord.accountId}
            </Descriptions.Item>
            <Descriptions.Item label="Token">{detailRecord.token}</Descriptions.Item>
            <Descriptions.Item label="曝光量">{detailRecord.impressions.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="点击量">{detailRecord.clicks.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="覆盖人数">{detailRecord.reach.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="点击率">{detailRecord.ctr.toFixed(2)}%</Descriptions.Item>
            <Descriptions.Item label="消耗">
              <AdsConsoleMoneyText value={detailRecord.spend} currency={detailRecord.currency} />
            </Descriptions.Item>
            <Descriptions.Item label="CPC">
              <AdsConsoleMoneyText value={detailRecord.cpc} currency={detailRecord.currency} />
            </Descriptions.Item>
            <Descriptions.Item label="CPM">
              <AdsConsoleMoneyText value={detailRecord.cpm} currency={detailRecord.currency} />
            </Descriptions.Item>
            <Descriptions.Item label="频次">{detailRecord.frequency.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="ROAS">{Number(detailRecord.roas || 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="目标事件">
              {detailRecord.targetEvent ? (
                <Tag color="geekblue" style={{ fontFamily: "monospace" }}>
                  {detailRecord.targetEvent}
                </Tag>
              ) : (
                <span style={{ color: "#8c8c8c" }}>暂未设置目标事件</span>
              )}
            </Descriptions.Item>
            {detailRecord.targetEventCount != null && <Descriptions.Item label="目标事件次数">{(detailRecord.targetEventCount as number).toLocaleString()}</Descriptions.Item>}
            {detailRecord.targetEventCost != null && (
              <Descriptions.Item label="目标事件成本 (CPA)">
                <AdsConsoleMoneyText value={detailRecord.targetEventCost} currency={detailRecord.currency} decimal={4} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <ModalForm
        key={editModalKey}
        title="编辑账户"
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setEditRecord(null);
            setEditModalLoadingOptions(false);
            setEditUserOptions([]);
            setEditGroupOptions([]);
          }
        }}
        initialValues={{ ...editRecord }}
        onFinish={async (values) => {
          if (!editRecord) return false;
          try {
            const tasks: Promise<any>[] = [];
            if (values.userId !== editRecord.userId) {
              tasks.push(assignAccountOwner(editRecord.id, values.userId));
            }
            if (values.groupId !== editRecord.groupId) {
              tasks.push(assignAccountGroup(editRecord.id, values.groupId));
            }
            if (!tasks.length) {
              message.success("修改成功");
              return true;
            }
            const results = await Promise.all(tasks);
            const failed = results.find((r) => !r?.success);
            if (failed) {
              message.error(failed.errorMessage || "操作失败");
              return false;
            }
            message.success("修改成功");
            actionRef.current?.reload();
            return true;
          } catch {
            message.error("操作失败");
            return false;
          }
        }}
        width={760}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={12}>
            <ProFormText name="accountId" label="Facebook账户ID" disabled={!!editRecord} rules={[{ required: true, message: "请输入账户ID" }]} placeholder="Facebook广告账户ID" />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="userId"
              label="投手"
              rules={[{ required: true, message: "请选择投手" }]}
              options={editUserOptions}
              fieldProps={{
                showSearch: true,
                loading: editModalLoadingOptions,
                allowClear: false,
                filterOption: (input: string, option: any) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
              }}
              placeholder="请选择投手"
            />
          </Col>
          <Col span={12}>
            <ProFormSelect
              name="groupId"
              label="项目组"
              rules={[{ required: true, message: "请选择项目组" }]}
              options={editGroupOptions}
              fieldProps={{
                showSearch: true,
                loading: editModalLoadingOptions,
                allowClear: false,
                filterOption: (input: string, option: any) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
              }}
              placeholder="请选择项目组"
            />
          </Col>
        </Row>
      </ModalForm>

      <Modal
        title={syncTarget === null ? "全量同步" : Array.isArray(syncTarget) ? `批量同步（已选 ${syncTarget.length} 条）` : "立即同步"}
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        onOk={handleSyncConfirm}
        okText="开始同步"
        cancelText="取消"
        width={440}
      >
        <div style={{ padding: "16px 0 8px" }}>
          <div style={{ marginBottom: 12, color: "#666" }}>请选择同步方式：</div>
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
              <div style={{ marginBottom: 12, color: "#666" }}>请选择需要同步的数据日期范围：</div>
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
            事件数据详情
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                fontWeight: 400,
                color: "#8c8c8c",
              }}
            >
              账户 {cpaRecord?.accountId}
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
        width={720}
        afterOpenChange={(open) => {
          if (open && cpaRecord) {
            setEventInsightsLoading(true);
            getEventInsights({
              objectId: cpaRecord.accountId,
              objectType: "account",
              startDate: cpaDateRange[0].format("YYYY-MM-DD"),
              endDate: cpaDateRange[1].format("YYYY-MM-DD"),
            })
              .then((res) => {
                const sorted = [...(res?.data ?? [])].sort((a, b) => Number(b.costPerAction) - Number(a.costPerAction));
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
              if (v?.[0] && v[1]) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCpaDateRange(range);
                if (cpaRecord) {
                  setEventInsightsLoading(true);
                  getEventInsights({
                    objectId: cpaRecord.accountId,
                    objectType: "account",
                    startDate: v[0].format("YYYY-MM-DD"),
                    endDate: v[1].format("YYYY-MM-DD"),
                  })
                    .then((res) => {
                      const sorted = [...(res?.data ?? [])].sort((a, b) => Number(b.costPerAction) - Number(a.costPerAction));
                      setEventInsights(sorted);
                    })
                    .finally(() => setEventInsightsLoading(false));
                }
              }
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
            ]}
            allowClear={false}
          />
        </div>
        <Input.Search allowClear value={eventSearchKeyword} onChange={(e) => setEventSearchKeyword(e.target.value)} placeholder="搜索事件类型" style={{ marginBottom: 8 }} />
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
            style={{ marginTop: 4 }}
            locale={{ emptyText: "暂无事件数据" }}
            columns={[
              {
                title: "事件类型",
                dataIndex: "actionType",
                key: "actionType",
                render: (v: string) => <Tag style={{ fontFamily: "monospace" }}>{v}</Tag>,
              },
              {
                title: "数量",
                dataIndex: "actionCount",
                key: "actionCount",
                align: "right",
                render: (v: number) => Number(v).toLocaleString(),
              },
              {
                title: "单次成本 (CPA)",
                dataIndex: "costPerAction",
                key: "costPerAction",
                align: "right",
                defaultSortOrder: "descend",
                sorter: (a, b) => Number(a.costPerAction) - Number(b.costPerAction),
                render: (v: number) => (
                  <span style={{ fontWeight: 500 }}>
                    <AdsConsoleMoneyText value={v} currency={cpaRecord?.currency} decimal={4} />
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
              账户 {countryRecord?.accountId}
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
              objectId: countryRecord.accountId,
              objectType: "account",
              startDate: countryDateRange[0].format("YYYY-MM-DD"),
              endDate: countryDateRange[1].format("YYYY-MM-DD"),
            })
              .then((res) => {
                const sorted = [...(res?.data ?? [])].sort((a, b) => Number(b.spend) - Number(a.spend));
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
              if (v?.[0] && v[1]) {
                const range: [dayjs.Dayjs, dayjs.Dayjs] = [v[0], v[1]];
                setCountryDateRange(range);
                if (countryRecord) {
                  setCountryInsightsLoading(true);
                  getCountryInsights({
                    objectId: countryRecord.accountId,
                    objectType: "account",
                    startDate: v[0].format("YYYY-MM-DD"),
                    endDate: v[1].format("YYYY-MM-DD"),
                  })
                    .then((res) => {
                      const sorted = [...(res?.data ?? [])].sort((a, b) => Number(b.spend) - Number(a.spend));
                      setCountryInsights(sorted);
                    })
                    .finally(() => setCountryInsightsLoading(false));
                }
              }
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
            ]}
            allowClear={false}
          />
        </div>
        <Input.Search allowClear value={countrySearchKeyword} onChange={(e) => setCountrySearchKeyword(e.target.value)} placeholder="搜索国家/地区代码" style={{ marginBottom: 8 }} />
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
                    <span style={{ marginRight: 6 }}>{getCountryFlagEmoji(v)}</span>
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
                    <AdsConsoleMoneyText value={v} currency={countryRecord?.currency} decimal={4} />
                  </span>
                ),
              },
            ]}
          />
        </Spin>
      </Modal>

      <AdsConsoleSyncHistoryChart
        open={syncChartOpen}
        onClose={() => { setSyncChartOpen(false); setSyncChartRecord(null); }}
        objectType="account"
        objectId={syncChartRecord?.accountId ?? ""}
        title={`同步历史 · 账户 ${syncChartRecord?.accountId ?? ""}`}
      />
    </>
  );
};

export default AccountInsightPage;






