import CampaignPage from "@/pages/ads-console/ads/campaign";
import AdsetPage from "@/pages/ads-console/ads/adset";
import AdPage from "@/pages/ads-console/ads/ad";
import CreativePage from "@/pages/ads-console/ads/creative";
import { updateCampaignRemoteBudget } from "@/services/ads-console/campaign";
import { updateAdsetRemoteBudget } from "@/services/ads-console/adset";
import { getAccountOptions } from "@/services/ads-console/adsOptions";
import { getProjectOptions, getTeamOptions, getAgencyOptions } from "@/services/ads-console/orgOptions";
import { history, useSearchParams } from "@umijs/max";
import { Card, Form, InputNumber, Modal, Select, Space, Tabs, Typography, message } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";

type BudgetSelectableRow = {
  id: string;
  name?: string;
  campaignId?: string;
  adsetId?: string;
  budgetMode?: "ABO" | "CBO" | "NONE";
  budgetValueType?: "daily" | "lifetime";
  budgetValue?: string;
  currency?: string;
  bidStrategy?: string;
};

const BID_STRATEGY_OPTIONS = [
  { label: "最低成本（无上限）", value: "LOWEST_COST_WITHOUT_CAP" },
  { label: "最低成本（有出价上限）", value: "LOWEST_COST_WITH_BID_CAP" },
  { label: "成本上限", value: "COST_CAP" },
  { label: "最低 ROAS", value: "LOWEST_COST_WITH_MIN_ROAS" },
];

const AdsSummaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "campaign");
  const [budgetForm] = Form.useForm();

  // ---- 筛选状态（单一状态，不拆分 pending/applied） ----
  const [teamId, setTeamId] = useState<string | undefined>(
    searchParams.get("teamId") || undefined,
  );
  const [agencyId, setAgencyId] = useState<string | undefined>(
    searchParams.get("agencyId") || undefined,
  );
  const [groupId, setGroupId] = useState<string | undefined>(
    searchParams.get("groupId") || undefined,
  );
  const [accountIds, setAccountIds] = useState<string[]>(
    searchParams.get("accountIds")
      ? searchParams.get("accountIds")!.split(",").filter(Boolean)
      : [],
  );

  // ---- 下拉选项数据 ----
  const [teamOptions, setTeamOptions] = useState<{ label: string; value: string }[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<{ label: string; value: string }[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ label: string; value: string }[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([]);
  const [accountOptionsLoading, setAccountOptionsLoading] = useState(false);
  const [accountOptionsScopeKey, setAccountOptionsScopeKey] = useState("");

  // ---- 子页面下钻联动选中 ----
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [selectedAdsetIds, setSelectedAdsetIds] = useState<string[]>([]);
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [selectedCampaignRows, setSelectedCampaignRows] = useState<BudgetSelectableRow[]>([]);
  const [selectedAdsetRows, setSelectedAdsetRows] = useState<BudgetSelectableRow[]>([]);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [campaignReloadSignal, setCampaignReloadSignal] = useState(0);
  const [adsetReloadSignal, setAdsetReloadSignal] = useState(0);
  const [budgetModalTab, setBudgetModalTab] = useState<"campaign" | "adset" | null>(null);
  const budgetModeValue = Form.useWatch("budgetMode", budgetForm);

  // 防止账户选项并发请求竞态
  const loadingKeyRef = useRef("");
  const currentScopeKey = `${teamId ?? ""}-${agencyId ?? ""}-${groupId ?? ""}`;

  // 初始化：加载团队选项、代理商选项
  useEffect(() => {
    getTeamOptions().then((res) => {
      setTeamOptions(
        (res?.data ?? []).map((o) => ({ label: o.label, value: String(o.value) })),
      );
    });
    getAgencyOptions().then((res) => {
      setAgencyOptions(
        (res?.data ?? []).map((o) => ({ label: String(o.label), value: String(o.value) })),
      );
    });
  }, []);

  // teamId/groupId 变化 → 加载对应项目组选项
  // 规则：选了团队就只加载该团队下项目组；未选团队时加载全部可见项目组
  useEffect(() => {
    getProjectOptions(teamId ? { teamId } : undefined).then((res) => {
      const options = (res?.data ?? []).map((o) => ({ label: o.label, value: String(o.value) }));
      const hasCurrentGroup = !!groupId && options.some((o) => o.value === String(groupId));
      // 未选团队时，若回显 groupId 不在可见列表，补一个兜底项用于回显
      if (!teamId && groupId && !hasCurrentGroup) {
        setGroupOptions([{ label: String(groupId), value: String(groupId) }, ...options]);
        return;
      }
      // 选了团队但当前 groupId 不属于该团队时，强制清空，避免跨团队联动污染
      if (teamId && groupId && !hasCurrentGroup) {
        setGroupId(undefined);
        setAccountIds([]);
      }
      setGroupOptions(options);
    });
  }, [teamId, groupId]);

  // teamId/agencyId/groupId 变化 → 加载对应账户选项
  // groupId 优先，其次 agencyId，最后 teamId
  useEffect(() => {
    const key = `${teamId ?? ""}-${agencyId ?? ""}-${groupId ?? ""}`;
    loadingKeyRef.current = key;
    setAccountOptionsScopeKey("");
    setAccountOptions([]);
    setAccountOptionsLoading(true);
    getAccountOptions(
      groupId
        ? { groupId }
        : agencyId
          ? { agencyId }
          : teamId
            ? { teamId }
            : undefined,
    )
      .then((res) => {
        if (loadingKeyRef.current !== key) return; // 防竞态
        const opts = (res?.data ?? []).map((o) => ({ label: o.label, value: String(o.value) }));
        setAccountOptions(opts);
        setAccountOptionsScopeKey(key);
        // 仅在有可用选项时再收敛已选账户，避免初始化时被误清空
        if ((teamId || agencyId || groupId) && opts.length > 0) {
          const validSet = new Set(opts.map((o) => o.value));
          setAccountIds((prev) => prev.filter((id) => validSet.has(id)));
        }
      })
      .finally(() => {
        if (loadingKeyRef.current === key) setAccountOptionsLoading(false);
      });
  }, [teamId, agencyId, groupId]);

  /**
   * 传给子页面的有效账户 ID 列表：
   * - 明确选了账户 → 用已选列表
   * - 只选了团队/项目 → 用当前选项范围内全部账户（加载完成后）
   * - 什么都没选 → undefined（查全部可见账户）
   *
   * 关键：此值作为 prop 传给子页面，不触发子页面 key 变化，
   * 因此不会自动刷新——用户需点击 ProTable 的「查询」按钮才触发数据请求。
   */
  const resolvedAccountIds = useMemo<string[] | undefined>(() => {
    if (accountIds.length > 0) return accountIds;
    if (teamId || agencyId || groupId) {
      // 仅使用”当前作用域”加载出的账户，避免使用上一次筛选的旧选项
      if (accountOptionsScopeKey !== currentScopeKey) return [];
      return accountOptions.map((o) => o.value);
    }
    return undefined;
  }, [accountIds, teamId, agencyId, groupId, accountOptions, accountOptionsScopeKey, currentScopeKey]);

  const resolvedAccountKey = useMemo(() => {
    if (resolvedAccountIds === undefined) return "__all__";
    return [...resolvedAccountIds].sort().join(",");
  }, [resolvedAccountIds]);
  const topFilterKey = useMemo(
    () => `${teamId ?? ""}|${agencyId ?? ""}|${groupId ?? ""}|${[...accountIds].sort().join(",")}|${accountOptionsScopeKey}|${resolvedAccountKey}`,
    [teamId, agencyId, groupId, accountIds, accountOptionsScopeKey, resolvedAccountKey],
  );

  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    next.set("tab", activeTab);
    if (teamId) next.set("teamId", teamId);
    else next.delete("teamId");
    if (agencyId) next.set("agencyId", agencyId);
    else next.delete("agencyId");
    if (groupId) next.set("groupId", groupId);
    else next.delete("groupId");
    if (accountIds.length) next.set("accountIds", accountIds.join(","));
    else next.delete("accountIds");
    setSearchParams(next);
  }, [activeTab, teamId, agencyId, groupId, accountIds, setSearchParams]);

  const campaignTabLabel = useMemo(
    () =>
      `Campaign 广告活动${selectedCampaignIds.length ? ` (${selectedCampaignIds.length})` : ""}`,
    [selectedCampaignIds.length],
  );

  const adsetTabLabel = useMemo(
    () => `Adset 广告组${selectedAdsetIds.length ? ` (${selectedAdsetIds.length})` : ""}`,
    [selectedAdsetIds.length],
  );

  const activeBudgetRows = budgetModalTab === "campaign" ? selectedCampaignRows : selectedAdsetRows;
  const singleBudgetTarget = activeBudgetRows.length === 1 ? activeBudgetRows[0] : undefined;

  const openBudgetModalWithRow = (tab: "campaign" | "adset", row: BudgetSelectableRow) => {
    setBudgetModalTab(tab);
    const initialBudgetMode =
      tab === "campaign"
        ? row?.budgetMode === "ABO"
          ? "ABO"
          : "CBO"
        : "ABO";
    if (tab === "adset" && row?.budgetMode === "CBO") {
      message.warning("当前 Campaign 为 CBO，请在 Campaign 维度配置预算");
      return;
    }
    const amount = row?.budgetValue ? Number(row.budgetValue) / 100 : undefined;
    budgetForm.setFieldsValue({
      budgetMode: initialBudgetMode,
      budgetType: row?.budgetValueType ?? "daily",
      budgetAmount: Number.isFinite(amount) ? amount : undefined,
      bidStrategy: row?.bidStrategy,
      pacingType: tab === "adset" ? ["standard"] : undefined,
    });
    if (tab === "campaign") setSelectedCampaignRows([row]);
    if (tab === "adset") setSelectedAdsetRows([row]);
    setBudgetModalOpen(true);
  };

  const openCreateEditor = (
    scope: "campaign" | "adset" | "ad",
    row: BudgetSelectableRow & Record<string, any> & {
      accountId?: string;
      campaignId?: string;
      adsetId?: string;
      adId?: string;
    },
  ) => {
    const params = new URLSearchParams();
    const appendParam = (key: string, value: unknown) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    };

    params.set("mode", "edit");
    params.set("scope", scope);
    params.set("returnTo", `${window.location.pathname}${window.location.search}`);
    appendParam("accountId", row.accountId);
    appendParam("campaignId", row.campaignId);
    appendParam("adsetId", row.adsetId);
    appendParam("adId", row.adId);
    appendParam("creativeId", row.creativeId);
    appendParam("localId", row.id);
    appendParam("name", row.name);
    appendParam("status", row.status);
    appendParam("effectiveStatus", row.effectiveStatus);
    appendParam("budgetMode", row.budgetMode);
    appendParam("budgetValue", row.budgetValue);
    appendParam("budgetValueType", row.budgetValueType);
    appendParam("budgetSource", row.budgetSource);
    appendParam("bidStrategy", row.bidStrategy);
    history.push(`/ads-console/ads/create?${params.toString()}`);
  };

  const handleBudgetSubmit = async () => {
    const values = await budgetForm.validateFields();
    if (!singleBudgetTarget) return;
    setBudgetSubmitting(true);
    try {
      if (budgetModalTab === "campaign") {
        const campaignPayload: {
          budgetMode: "CBO" | "ABO";
          budgetType?: "daily" | "lifetime";
          budgetAmount?: number;
          bidStrategy?: string;
        } = {
          budgetMode: values.budgetMode,
        };
        if (values.budgetMode === "CBO") {
          campaignPayload.budgetType = values.budgetType;
          campaignPayload.budgetAmount = values.budgetAmount;
          campaignPayload.bidStrategy = values.bidStrategy;
        }
        const res = await updateCampaignRemoteBudget(singleBudgetTarget.id, {
          ...campaignPayload,
        });
        if (!res?.success) {
          throw new Error(res?.errorMessage || "预算更新失败");
        }
        setCampaignReloadSignal((v) => v + 1);
      } else if (budgetModalTab === "adset") {
        const res = await updateAdsetRemoteBudget(singleBudgetTarget.id, {
          budgetMode: "ABO",
          budgetType: values.budgetType,
          budgetAmount: values.budgetAmount,
          bidStrategy: values.bidStrategy,
          pacingType: values.pacingType,
        });
        if (!res?.success) {
          throw new Error(res?.errorMessage || "预算更新失败");
        }
        setAdsetReloadSignal((v) => v + 1);
      }
      message.success("预算配置已更新");
      setBudgetModalOpen(false);
    } catch (error: any) {
      message.error(error?.message || "预算配置失败");
    } finally {
      setBudgetSubmitting(false);
    }
  };

  return (
    <Card>
      {/* 三级联动筛选栏（团队/项目组/账户变化后自动刷新当前 tab） */}
      <div
        style={{
          marginBottom: 12,
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Space>
          <Typography.Text>团队</Typography.Text>
          <Select
            allowClear
            style={{ minWidth: 180 }}
            options={teamOptions}
            value={teamId}
            onChange={(v) => {
              setTeamId(v);
              setGroupId(undefined); // 用户主动切换团队才清空
              setAccountIds([]);
            }}
            placeholder="全部团队"
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>

        <Space>
          <Typography.Text>代理商</Typography.Text>
          <Select
            allowClear
            style={{ minWidth: 180 }}
            options={agencyOptions}
            value={agencyId}
            onChange={(v) => {
              setAgencyId(v);
              setGroupId(undefined);
              setAccountIds([]);
            }}
            placeholder="全部代理商"
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>

        <Space>
          <Typography.Text>项目组</Typography.Text>
          <Select
            allowClear
            style={{ minWidth: 180 }}
            options={groupOptions}
            value={groupId}
            onChange={(v) => {
              setGroupId(v);
              setAccountIds([]); // 用户主动切换项目组才清空账户
            }}
            placeholder={teamId ? "该团队下的项目组" : "全部项目组"}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Space>

        <Space>
          <Typography.Text>账户 ID</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            style={{ minWidth: 360 }}
            options={accountOptions}
            value={accountIds}
            loading={accountOptionsLoading}
            onChange={(v: string[]) => setAccountIds(v)}
            placeholder={
              groupId
                ? "该项目组下的账户（默认全部）"
                : agencyId
                  ? "该代理商下的账户（默认全部）"
                  : teamId
                    ? "该团队下的账户（默认全部）"
                    : "全部账户（默认全部）"
            }
            showSearch
            maxTagCount="responsive"
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase()) ||
              String(option?.value ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Space>

      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          const next = new URLSearchParams(window.location.search);
          next.set("tab", key);
          setSearchParams(next);
        }}
        items={[
          {
            key: "campaign",
            label: campaignTabLabel,
            children: (
              <CampaignPage
                key={`campaign-${topFilterKey}`}
                forcedAccountIds={resolvedAccountIds}
                hideAccountFilter
                hideOrgFilters
                reloadSignal={campaignReloadSignal}
                onSelectionChange={(ids) => {
                  setSelectedCampaignIds(ids);
                  setSelectedAdsetIds([]);
                  setSelectedAdIds([]);
                }}
                onSelectedRowsChange={setSelectedCampaignRows}
                onOpenBudgetConfig={(row) => openBudgetModalWithRow("campaign", row)}
                onOpenCreateEditor={openCreateEditor}
              />
            ),
          },
          {
            key: "adset",
            label: adsetTabLabel,
            children: (
              <AdsetPage
                key={`adset-${topFilterKey}-${selectedCampaignIds.join(",")}`}
                forcedAccountIds={resolvedAccountIds}
                forcedCampaignIds={selectedCampaignIds}
                hideAccountFilter
                hideOrgFilters
                reloadSignal={adsetReloadSignal}
                onSelectionChange={(_campaignIds, adsetIds) => {
                  setSelectedAdsetIds(adsetIds);
                  setSelectedAdIds([]);
                }}
                onSelectedRowsChange={setSelectedAdsetRows}
                onOpenBudgetConfig={(row) => openBudgetModalWithRow("adset", row)}
                onOpenCreateEditor={openCreateEditor}
              />
            ),
          },
          {
            key: "ad",
            label: "Ad 广告",
            children: (
              <AdPage
                key={`ad-${topFilterKey}-${selectedCampaignIds.join(",")}-${selectedAdsetIds.join(",")}`}
                forcedAccountIds={resolvedAccountIds}
                forcedCampaignIds={selectedCampaignIds}
                forcedAdsetIds={selectedAdsetIds}
                hideAccountFilter
                hideHierarchyFilters
                onSelectionChange={(adIds) => setSelectedAdIds(adIds)}
                onOpenCreateEditor={openCreateEditor}
              />
            ),
          },
          {
            key: "creative",
            label: "Creative 素材",
            children: (
              <CreativePage
                key={`creative-${topFilterKey}-${selectedCampaignIds.join(",")}-${selectedAdsetIds.join(",")}-${selectedAdIds.join(",")}`}
                forcedAccountIds={resolvedAccountIds}
                forcedCampaignIds={selectedCampaignIds}
                forcedAdsetIds={selectedAdsetIds}
                forcedAdIds={selectedAdIds}
                hideAccountFilter
                hideHierarchyFilters
              />
            ),
          },
        ]}
      />

      <Modal
        title={
          budgetModalTab === "campaign"
            ? `预算配置 · Campaign ${singleBudgetTarget?.campaignId ?? ""}`
            : `预算配置 · Adset ${singleBudgetTarget?.adsetId ?? ""}`
        }
        open={budgetModalOpen}
        onCancel={() => setBudgetModalOpen(false)}
        onOk={handleBudgetSubmit}
        confirmLoading={budgetSubmitting}
        destroyOnClose
      >
        <Form form={budgetForm} layout="vertical">
          {budgetModalTab === "campaign" ? (
            <>
              <Form.Item
                name="budgetMode"
                label="预算模式"
                rules={[{ required: true, message: "请选择预算模式" }]}
              >
                <Select
                  options={[
                    { label: "CBO (Campaign Budget Optimization)", value: "CBO" },
                    { label: "ABO (Adset Budget Optimization)", value: "ABO" },
                  ]}
                />
              </Form.Item>
              {budgetModeValue === "ABO" ? (
                <Typography.Text type="secondary">
                  当前为 ABO：Campaign 层不配置预算，请到其下 Adset 配置预算与竞价策略。
                </Typography.Text>
              ) : null}
              {budgetModeValue === "CBO" ? (
                <>
                  <Form.Item
                    name="budgetType"
                    label="预算类型"
                    rules={[{ required: true, message: "请选择预算类型" }]}
                  >
                    <Select
                      options={[
                        { label: "日预算 (Daily Budget)", value: "daily" },
                        { label: "总预算 (Lifetime Budget)", value: "lifetime" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="budgetAmount"
                    label="预算金额"
                    rules={[{ required: true, message: "请输入预算金额" }]}
                  >
                    <InputNumber
                      min={0.01}
                      precision={2}
                      style={{ width: "100%" }}
                      placeholder="按账户货币填写，例如 100.00"
                    />
                  </Form.Item>
                  <Form.Item name="bidStrategy" label="竞价策略 (Bid Strategy)">
                    <Select
                      allowClear
                      options={BID_STRATEGY_OPTIONS}
                      placeholder="可选，按 Facebook 策略填写"
                    />
                  </Form.Item>
                </>
              ) : null}
            </>
          ) : null}

          {budgetModalTab === "adset" ? (
            <>
              <Form.Item
                name="budgetMode"
                label="预算模式"
                rules={[{ required: true, message: "请选择预算模式" }]}
              >
                <Select
                  disabled
                  options={[
                    { label: "ABO (Adset Budget Optimization)", value: "ABO" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="budgetType"
                label="预算类型"
                rules={[{ required: true, message: "请选择预算类型" }]}
              >
                <Select
                  options={[
                    { label: "日预算 (Daily Budget)", value: "daily" },
                    { label: "总预算 (Lifetime Budget)", value: "lifetime" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="budgetAmount"
                label="预算金额"
                rules={[{ required: true, message: "请输入预算金额" }]}
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="按账户货币填写，例如 100.00"
                />
              </Form.Item>
              <Form.Item name="bidStrategy" label="竞价策略 (Bid Strategy)">
                <Select
                  allowClear
                  options={BID_STRATEGY_OPTIONS}
                  placeholder="可选，按 Facebook 策略填写"
                />
              </Form.Item>
              <Form.Item name="pacingType" label="投放节奏 (Pacing Type)">
                <Select
                  mode="multiple"
                  options={[
                    { label: "Standard", value: "standard" },
                    { label: "No Pacing", value: "no_pacing" },
                  ]}
                  placeholder="尽量模拟 Facebook 可选项"
                />
              </Form.Item>
            </>
          ) : null}

        </Form>
      </Modal>
    </Card>
  );
};

export default AdsSummaryPage;





