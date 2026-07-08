import {
  getAccountOptions,
  getAdOptions,
  getAdsetOptions,
  getCampaignOptions,
} from "@/services/ads-console/adsOptions";
import {
  getAgencyOptions,
  getGroupOptions,
} from "@/services/ads-console/orgOptions";
import { getOverallHourReportPage } from "@/services/ads-console/report";
import {
  type ActionType,
  type ProColumns,
  ProTable,
} from "@ant-design/pro-components";
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Row,
  Segmented,
  Select,
  Space,
  Typography,
} from "antd";
import type { SortOrder } from "antd/es/table/interface";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ReportType = AdsConsole.HourReportObjectName;
type FilterKey = "objectId" | "accountId" | "campaignId" | "groupId" | "agencyId" | "hour";
type VisibleDimension = "date" | "hour" | "objectId" | "groupId" | "agencyId";
type MetricKey =
  | "spend"
  | "impressions"
  | "clicks"
  | "ctr"
  | "cpm"
  | "cpc"
  | "roas";
type BackendDimension = "date" | "hour" | "object_id" | "group_id" | "agency_id";

const METRIC_ORDER: MetricKey[] = [
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpm",
  "cpc",
  "roas",
];

const sortMetrics = (values: MetricKey[]) =>
  [...values].sort((a, b) => METRIC_ORDER.indexOf(a) - METRIC_ORDER.indexOf(b));

type ReportSchema = {
  filters: FilterKey[];
  dimensions: VisibleDimension[];
  metrics: MetricKey[];
  defaultDimensions: VisibleDimension[];
  defaultMetrics: MetricKey[];
  defaultSort: string;
};

type QueryState = {
  startDate?: string;
  endDate?: string;
  objectId?: string;
  accountId?: string;
  campaignId?: string;
  groupId?: string;
  agencyId?: string;
  hour?: string;
};

type ReportSearchParams = QueryState & {
  current?: number;
  pageSize?: number;
  __requestSeq?: number;
  __reportType?: ReportType;
  __dims?: string;
  __metrics?: string;
};

const REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "账户 Account", value: "account" },
  { label: "活动 Campaign", value: "campaign" },
  { label: "广告组 Adset", value: "adset" },
  { label: "广告 Ad", value: "ad" },
];

const OBJECT_ID_LABEL_MAP: Record<ReportType, string> = {
  account: "账户ID",
  campaign: "活动ID",
  adset: "广告组ID",
  ad: "广告ID",
};

const FILTER_OPTIONS: Record<FilterKey, { label: string; placeholder: string }> = {
  objectId: { label: "对象ID", placeholder: "请选择对象ID" },
  accountId: { label: "账户ID", placeholder: "请选择账户ID" },
  campaignId: { label: "活动ID", placeholder: "请选择活动ID" },
  groupId: { label: "项目组", placeholder: "请选择项目组" },
  agencyId: { label: "代理商", placeholder: "请选择代理商" },
  hour: { label: "小时", placeholder: "请选择小时" },
};

const DIMENSION_OPTIONS: Record<VisibleDimension, { label: string; backend: BackendDimension }> = {
  date: { label: "日期", backend: "date" },
  hour: { label: "小时", backend: "hour" },
  objectId: { label: "对象ID", backend: "object_id" },
  groupId: { label: "项目组", backend: "group_id" },
  agencyId: { label: "代理商", backend: "agency_id" },
};

const METRIC_OPTIONS: Record<MetricKey, { label: string }> = {
  spend: { label: "Spend" },
  impressions: { label: "Impressions" },
  clicks: { label: "Clicks" },
  ctr: { label: "CTR" },
  cpm: { label: "CPM" },
  cpc: { label: "CPC" },
  roas: { label: "ROAS" },
};

const REPORT_SCHEMAS: Record<ReportType, ReportSchema> = {
  account: {
    filters: ["objectId", "groupId", "agencyId", "hour"],
    dimensions: ["date", "hour", "objectId", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date", "hour"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "hour",
  },
  campaign: {
    filters: ["accountId", "objectId", "groupId", "agencyId", "hour"],
    dimensions: ["date", "hour", "objectId", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date", "hour"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "hour",
  },
  adset: {
    filters: ["accountId", "campaignId", "objectId", "groupId", "agencyId", "hour"],
    dimensions: ["date", "hour", "objectId", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date", "hour"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "hour",
  },
  ad: {
    filters: ["accountId", "campaignId", "objectId", "groupId", "agencyId", "hour"],
    dimensions: ["date", "hour", "objectId", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date", "hour"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "hour",
  },
};

const HOUR_OPTIONS: AdsConsole.SelectOption[] = Array.from({ length: 24 }).map((_, hour) => ({
  label: `${String(hour).padStart(2, "0")}:00`,
  value: String(hour),
}));

const normalizeDateValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value.format("YYYY-MM-DD");
  if (typeof value === "string") return value;
  return undefined;
};

const normalizeSelectValue = (value: unknown): string | undefined => {
  if (!value && value !== 0) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null && "value" in value) {
    return String((value as { value: string | number }).value);
  }
  return undefined;
};

const toSelectOptions = (items: unknown[] | undefined): AdsConsole.SelectOption[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item): AdsConsole.SelectOption | null => {
      if (typeof item === "string" || typeof item === "number") {
        const value = String(item);
        return { label: value, value };
      }
      if (item && typeof item === "object") {
        const value = normalizeSelectValue((item as { value?: unknown }).value ?? item);
        const label = normalizeSelectValue((item as { label?: unknown }).label) ?? value;
        if (value) return { label: label || value, value };
      }
      return null;
    })
    .filter((item): item is AdsConsole.SelectOption => !!item);
};

const toObjectIdOptions = (options: AdsConsole.SelectOption[] | undefined): AdsConsole.SelectOption[] => {
  if (!Array.isArray(options)) return [];
  return options
    .map((item): AdsConsole.SelectOption | null => {
      const value = normalizeSelectValue(item.value);
      if (!value) return null;
      const rawLabel = normalizeSelectValue(item.label) || value;
      const label = rawLabel.includes(value) ? rawLabel : `${value} ${rawLabel}`;
      return { label, value };
    })
    .filter((item): item is AdsConsole.SelectOption => !!item);
};

const toOptionLabelMap = (options: AdsConsole.SelectOption[] | undefined): Record<string, string> => {
  if (!Array.isArray(options)) return {};
  return options.reduce<Record<string, string>>((acc, item) => {
    const value = normalizeSelectValue(item.value);
    const label = normalizeSelectValue(item.label);
    if (!value || !label) return acc;
    acc[value] = label;
    return acc;
  }, {});
};

const formatNumber = (value?: number) => (value ?? 0).toLocaleString();
const defaultDateRange = () => [dayjs(), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs];
const defaultDateQuery = () => ({
  startDate: dayjs().format("YYYY-MM-DD"),
  endDate: dayjs().format("YYYY-MM-DD"),
});
const resolveDefaultSortField = (dims: VisibleDimension[]) => {
  if (dims.includes("hour")) return "hour";
  if (dims.includes("date")) return "date";
  if (dims.includes("objectId")) return "objectId";
  if (dims.includes("groupId")) return "groupId";
  if (dims.includes("agencyId")) return "agencyId";
  return "date";
};

const OverallHourReportPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(undefined);

  const [reportType, setReportType] = useState<ReportType>("account");
  const objectIdLabel = OBJECT_ID_LABEL_MAP[reportType];
  const schema = REPORT_SCHEMAS[reportType];

  const [selectedDimensions, setSelectedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(sortMetrics(schema.defaultMetrics));
  const [appliedDimensions, setAppliedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [appliedMetrics, setAppliedMetrics] = useState<MetricKey[]>(sortMetrics(schema.defaultMetrics));
  const [queryState, setQueryState] = useState<QueryState>(defaultDateQuery);
  const [requestSeq, setRequestSeq] = useState(0);

  const [idOptions, setIdOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [objectNameMap, setObjectNameMap] = useState<Record<string, string>>({});
  const [groupOptions, setGroupOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<AdsConsole.SelectOption[]>([]);

  const groupNameMap = useMemo(() => toOptionLabelMap(groupOptions), [groupOptions]);
  const agencyNameMap = useMemo(() => toOptionLabelMap(agencyOptions), [agencyOptions]);
  const tableParams = useMemo<ReportSearchParams>(() => ({
    ...queryState,
    __requestSeq: requestSeq,
    __reportType: reportType,
    __dims: appliedDimensions.join(","),
    __metrics: appliedMetrics.join(","),
  }), [appliedDimensions, appliedMetrics, queryState, reportType, requestSeq]);

  useEffect(() => {
    form.setFieldsValue({
      dateRange: defaultDateRange(),
    });
  }, [form]);

  useEffect(() => {
    const loadCommonOptions = async () => {
      const [groupRes, agencyRes] = await Promise.all([
        getGroupOptions(),
        getAgencyOptions(),
      ]);
      setGroupOptions(
        (groupRes?.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        }))
      );
      setAgencyOptions(
        (agencyRes?.data || []).map((item) => ({
          label: String(item.label ?? item.value),
          value: String(item.value),
        }))
      );
    };

    loadCommonOptions();
  }, []);

  useEffect(() => {
    const loadTypeOptions = async () => {
      let rawIdOptions: AdsConsole.SelectOption[] = [];
      if (reportType === "account") {
        const accountRes = await getAccountOptions();
        rawIdOptions = toSelectOptions(accountRes?.data as unknown[]);
      } else if (reportType === "campaign") {
        const campaignRes = await getCampaignOptions();
        rawIdOptions = toSelectOptions(campaignRes?.data as unknown[]);
      } else if (reportType === "adset") {
        const adsetRes = await getAdsetOptions();
        rawIdOptions = toSelectOptions(adsetRes?.data as unknown[]);
      } else {
        const adRes = await getAdOptions();
        rawIdOptions = toSelectOptions(adRes?.data as unknown[]);
      }
      setIdOptions(toObjectIdOptions(rawIdOptions));
      setObjectNameMap(toOptionLabelMap(rawIdOptions));

      const [accountRes, campaignRes] = await Promise.all([
        getAccountOptions(),
        getCampaignOptions(),
      ]);
      setAccountOptions(toObjectIdOptions(toSelectOptions(accountRes?.data as unknown[])));
      setCampaignOptions(toObjectIdOptions(toSelectOptions(campaignRes?.data as unknown[])));
    };

    loadTypeOptions();
  }, [reportType]);

  const columns = useMemo<ProColumns<AdsConsole.RptOverallHourVO>[]>(() => {
    const cols: ProColumns<AdsConsole.RptOverallHourVO>[] = [];

    if (appliedDimensions.includes("date")) {
      cols.push({
        title: "日期",
        dataIndex: "date",
        width: 120,
        fixed: "left",
        sorter: true,
      });
    }

    if (appliedDimensions.includes("hour")) {
      cols.push({
        title: "小时",
        dataIndex: "hour",
        width: 90,
        sorter: true,
        render: (_, record) => {
          const hour = normalizeSelectValue(record.hour);
          if (hour == null) return "-";
          return `${hour.padStart(2, "0")}:00`;
        },
      });
    }

    if (appliedDimensions.includes("objectId")) {
      cols.push({
        title: objectIdLabel,
        dataIndex: "objectId",
        width: 240,
        ellipsis: true,
        render: (_, record) => {
          const objectId = normalizeSelectValue(record.objectId);
          if (!objectId) return "-";
          return objectNameMap[objectId] || objectId;
        },
      });
    }

    if (appliedDimensions.includes("groupId")) {
      cols.push({
        title: "项目组",
        dataIndex: "groupName",
        width: 180,
        render: (_, record) => {
          const groupId = normalizeSelectValue(record.groupId);
          return (groupId && groupNameMap[groupId]) || "-";
        },
      });
    }

    if (appliedDimensions.includes("agencyId")) {
      cols.push({
        title: "代理商",
        dataIndex: "agencyName",
        width: 180,
        render: (_, record) => {
          const agencyId = normalizeSelectValue(record.agencyId);
          return (agencyId && agencyNameMap[agencyId]) || "-";
        },
      });
    }

    if (appliedMetrics.includes("spend")) {
      cols.push({
        title: "Spend",
        dataIndex: "spend",
        width: 120,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      });
    }

    if (appliedMetrics.includes("impressions")) {
      cols.push({
        title: "Impressions",
        dataIndex: "impressions",
        width: 120,
        sorter: true,
        render: (value) => formatNumber(value as number),
      });
    }

    if (appliedMetrics.includes("clicks")) {
      cols.push({
        title: "Clicks",
        dataIndex: "clicks",
        width: 100,
        sorter: true,
        render: (value) => formatNumber(value as number),
      });
    }

    if (appliedMetrics.includes("ctr")) {
      cols.push({
        title: "CTR",
        dataIndex: "ctr",
        width: 100,
        sorter: true,
        render: (value) => `${Number(value || 0).toFixed(2)}%`,
      });
    }

    if (appliedMetrics.includes("cpm")) {
      cols.push({
        title: "CPM",
        dataIndex: "cpm",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      });
    }

    if (appliedMetrics.includes("cpc")) {
      cols.push({
        title: "CPC",
        dataIndex: "cpc",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(4),
      });
    }

    if (appliedMetrics.includes("roas")) {
      cols.push({
        title: "ROAS",
        dataIndex: "roas",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      });
    }

    return cols;
  }, [appliedDimensions, appliedMetrics, agencyNameMap, groupNameMap, objectIdLabel, objectNameMap]);

  const applyQuery = async () => {
    const values = await form.validateFields();
    const dateRange = values.dateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;

    if (!selectedDimensions.length) {
      message.warning("至少保留一个维度");
      return;
    }
    if (!selectedMetrics.length) {
      message.warning("至少保留一个指标");
      return;
    }

    const nextQuery: QueryState = {
      startDate: normalizeDateValue(dateRange?.[0]),
      endDate: normalizeDateValue(dateRange?.[1]),
      objectId: normalizeSelectValue(values.objectId),
      accountId: normalizeSelectValue(values.accountId),
      campaignId: normalizeSelectValue(values.campaignId),
      groupId: normalizeSelectValue(values.groupId),
      agencyId: normalizeSelectValue(values.agencyId),
      hour: normalizeSelectValue(values.hour),
    };

    setAppliedDimensions(selectedDimensions);
    setAppliedMetrics(selectedMetrics);
    setQueryState(nextQuery);
    setRequestSeq((prev) => prev + 1);
  };

  const resetConfig = () => {
    const nextSchema = REPORT_SCHEMAS[reportType];
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(sortMetrics(nextSchema.defaultMetrics));
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(sortMetrics(nextSchema.defaultMetrics));
    form.setFieldsValue({
      dateRange: defaultDateRange(),
      objectId: undefined,
      accountId: undefined,
      campaignId: undefined,
      groupId: undefined,
      agencyId: undefined,
      hour: undefined,
    });
    setQueryState(defaultDateQuery());
    setRequestSeq((prev) => prev + 1);
  };

  const handleReportTypeChange = (nextType: ReportType) => {
    const nextSchema = REPORT_SCHEMAS[nextType];
    const current = form.getFieldsValue();
    const pruned: Record<string, unknown> = {
      dateRange: current.dateRange,
      hour: current.hour,
      groupId: current.groupId,
      agencyId: current.agencyId,
    };

    const OBJECT_ID_CARRY_OVER: Partial<Record<ReportType, FilterKey>> = {
      account: "accountId",
      campaign: "campaignId",
    };
    const carryOverTarget = OBJECT_ID_CARRY_OVER[reportType];
    if (carryOverTarget && current.objectId && nextSchema.filters.includes(carryOverTarget)) {
      pruned[carryOverTarget] = current.objectId;
    }

    if (nextType === "account" && current.accountId) {
      pruned.objectId = current.accountId;
    }

    nextSchema.filters.forEach((key) => {
      if (key === "objectId") return;
      if (pruned[key] !== undefined) return;
      pruned[key] = current[key];
    });

    form.setFieldsValue({
      objectId: undefined,
      accountId: undefined,
      campaignId: undefined,
      groupId: undefined,
      agencyId: undefined,
      hour: undefined,
      ...pruned,
    });

    setQueryState((prev) => ({
      ...prev,
      objectId: normalizeSelectValue(pruned.objectId as string | undefined),
      accountId: normalizeSelectValue(pruned.accountId as string | undefined),
      campaignId: normalizeSelectValue(pruned.campaignId as string | undefined),
      groupId: normalizeSelectValue(pruned.groupId as string | undefined),
      agencyId: normalizeSelectValue(pruned.agencyId as string | undefined),
      hour: normalizeSelectValue(pruned.hour as string | undefined),
    }));

    setReportType(nextType);
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(sortMetrics(nextSchema.defaultMetrics));
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(sortMetrics(nextSchema.defaultMetrics));
    setRequestSeq((prev) => prev + 1);
  };

  const dimensionSelectOptions = schema.dimensions.map((key) => ({
    label: key === "objectId" ? objectIdLabel : DIMENSION_OPTIONS[key].label,
    value: key,
  }));
  const metricSelectOptions = schema.metrics.map((key) => ({
    label: METRIC_OPTIONS[key].label,
    value: key,
  }));

  const filterOptionsMap: Record<FilterKey, AdsConsole.SelectOption[]> = {
    objectId: idOptions,
    accountId: accountOptions,
    campaignId: campaignOptions,
    groupId: groupOptions,
    agencyId: agencyOptions,
    hour: HOUR_OPTIONS,
  };

  const reportTypeTabItems = REPORT_TYPE_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Card
        bordered={false}
        bodyStyle={{ padding: 14 }}
        style={{
          borderRadius: 12,
          boxShadow: "0 3px 12px rgba(15,23,42,0.03)",
        }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Space size={10} align="center" wrap>
              <Typography.Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                报表类型
              </Typography.Text>
              <Segmented
                value={reportType}
                options={reportTypeTabItems}
                onChange={(value) => handleReportTypeChange(value as ReportType)}
              />
            </Space>
            <Space>
              <Button type="primary" onClick={applyQuery}>
                查询
              </Button>
              <Button onClick={resetConfig}>重置</Button>
            </Space>
          </div>

          <Divider style={{ margin: "0 0 2px", borderColor: "#eef2f7" }} />

          <Typography.Text
            strong
            style={{
              display: "block",
              fontSize: 12,
              color: "#64748b",
              letterSpacing: 0.2,
            }}
          >
            筛选条件
          </Typography.Text>

          <Form form={form} layout="vertical">
            <Row gutter={10}>
              <Col xs={24} sm={24} md={12} lg={8} xl={6}>
                <Form.Item name="dateRange">
                  <DatePicker.RangePicker
                    allowClear={false}
                    style={{ width: "100%" }}
                    presets={[
                      { label: "今天", value: [dayjs(), dayjs()] },
                      {
                        label: "昨天",
                        value: [dayjs().subtract(1, "day"), dayjs().subtract(1, "day")],
                      },
                      { label: "最近3天", value: [dayjs().subtract(2, "day"), dayjs()] },
                      { label: "最近一周", value: [dayjs().subtract(6, "day"), dayjs()] },
                      { label: "最近一个月", value: [dayjs().subtract(29, "day"), dayjs()] },
                    ]}
                  />
                </Form.Item>
              </Col>

              {schema.filters.map((key) => (
                <Col key={key} xs={24} sm={12} md={8} lg={6} xl={4}>
                  <Form.Item name={key}>
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder={
                        key === "objectId"
                          ? `请选择${objectIdLabel}`
                          : FILTER_OPTIONS[key].placeholder
                      }
                      options={filterOptionsMap[key]}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Form>

          <Divider style={{ margin: "0", borderColor: "#f1f5f9" }} />

          <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 12 }}>
            <Typography.Text strong style={{ color: "#334155", whiteSpace: "nowrap", minWidth: 40 }}>
              维度
            </Typography.Text>
            <Select
              mode="multiple"
              value={selectedDimensions}
              options={dimensionSelectOptions}
              allowClear={false}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(value: VisibleDimension[]) => {
                if (!value.length) {
                  message.warning("至少保留一个维度");
                  return;
                }
                setSelectedDimensions(value);
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 12 }}>
            <Typography.Text strong style={{ color: "#334155", whiteSpace: "nowrap", minWidth: 40 }}>
              指标
            </Typography.Text>
            <Select
              mode="multiple"
              value={selectedMetrics}
              options={metricSelectOptions}
              allowClear={false}
              style={{ flex: 1, minWidth: 0 }}
              onChange={(value: MetricKey[]) => {
                if (!value.length) {
                  message.warning("至少保留一个指标");
                  return;
                }
                setSelectedMetrics(sortMetrics(value));
              }}
            />
          </div>
        </Space>
      </Card>

      <Card
        bordered={false}
        bodyStyle={{ padding: "10px 14px 14px" }}
        style={{ borderRadius: 12, boxShadow: "0 3px 12px rgba(15,23,42,0.02)" }}
      >
        <ProTable<AdsConsole.RptOverallHourVO, ReportSearchParams>
          rowKey={(record) =>
            [
              record.objectId,
              record.date,
              record.hour,
              record.groupId,
              record.agencyId,
            ]
              .map((item) => normalizeSelectValue(item) || "")
              .join("_")
          }
          actionRef={actionRef}
          columns={columns}
          search={false}
          options={false}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1400, y: "52vh" }}
          size="small"
          params={tableParams}
          request={async (params, sort) => {
            const requestReportType = (params.__reportType as ReportType | undefined) ?? reportType;
            const requestDimensions = String(params.__dims || "")
              .split(",")
              .filter(Boolean) as VisibleDimension[];
            const requestMetrics = String(params.__metrics || "")
              .split(",")
              .filter(Boolean) as MetricKey[];
            const defaultSortField = resolveDefaultSortField(requestDimensions);
            const activeSortKey = Object.keys(sort || {}).find((key) => sort[key] != null);
            const sortField = activeSortKey || defaultSortField;
            const sortValue = activeSortKey ? (sort[activeSortKey] as SortOrder | undefined) : undefined;
            const sortOrder =
              sortValue === "ascend" ? "asc" : sortValue === "descend" ? "desc" : "desc";

            const res = await getOverallHourReportPage({
              objectName: requestReportType,
              current: params.current,
              size: params.pageSize,
              startDate: params.startDate,
              endDate: params.endDate,
              objectId: normalizeSelectValue(params.objectId),
              accountId: normalizeSelectValue(params.accountId),
              campaignId: normalizeSelectValue(params.campaignId),
              groupId: normalizeSelectValue(params.groupId),
              agencyId: normalizeSelectValue(params.agencyId),
              hour: params.hour ? Number(params.hour) : undefined,
              dims: requestDimensions.map((d) => DIMENSION_OPTIONS[d].backend),
              metrics: requestMetrics,
              sortField,
              sortOrder,
            });

            return {
              data: res?.data?.records || [],
              total: res?.data?.total || 0,
              success: !!res?.success,
            };
          }}
        />
      </Card>
    </Space>
  );
};

export default OverallHourReportPage;


