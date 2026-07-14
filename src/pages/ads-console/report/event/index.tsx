import {
  getAccountOptions,
  getAdsetOptions,
  getCampaignOptions,
  getTargetCountryOptions,
  getTargetEventOptions,
} from "@/services/ads-console/adsOptions";
import { getGroupOptions } from "@/services/ads-console/orgOptions";
import { getEventReportPage } from "@/services/ads-console/report";
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
import React, { useEffect, useRef, useState } from "react";

type ReportType = Extract<AdsConsole.ReportObjectName, "account" | "campaign" | "adset">;
type FilterKey = "objectId" | "accountId" | "campaignId" | "country" | "groupId" | "actionType";
type VisibleDimension = "date" | "objectId" | "country" | "groupId" | "actionType";
type MetricKey = "actionCount" | "cpa";
type BackendDimension = "date" | "object_id" | "country" | "group_id" | "action_type";
type SortField =
  | "date"
  | "object_id"
  | "country"
  | "group_id"
  | "action_type"
  | "action_count"
  | "cpa";

const SORT_FIELD_MAP: Record<string, SortField> = {
  date: "date",
  objectId: "object_id",
  country: "country",
  groupId: "group_id",
  actionType: "action_type",
  actionCount: "action_count",
  cpa: "cpa",
};

const toBackendSortField = (field?: string): SortField => {
  if (!field) return "action_count";
  const mapped = SORT_FIELD_MAP[field];
  if (mapped) return mapped;
  return field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`) as SortField;
};

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
  country?: string;
  groupId?: string;
  actionType?: string;
};

type ReportSearchParams = QueryState & {
  current?: number;
  pageSize?: number;
};

const REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "账户 Account", value: "account" },
  { label: "活动 Campaign", value: "campaign" },
  { label: "广告组 Adset", value: "adset" },
];

const OBJECT_ID_LABEL_MAP: Record<ReportType, string> = {
  account: "账户ID",
  campaign: "活动ID",
  adset: "广告组ID",
};

const FILTER_OPTIONS: Record<FilterKey, { label: string; placeholder: string }> = {
  objectId: { label: "对象ID", placeholder: "请选择对象ID" },
  accountId: { label: "账户ID", placeholder: "请选择账户ID" },
  campaignId: { label: "活动ID", placeholder: "请选择活动ID" },
  country: { label: "国家", placeholder: "请选择国家" },
  groupId: { label: "项目组", placeholder: "请选择项目组" },
  actionType: { label: "事件", placeholder: "请选择事件" },
};

const DIMENSION_OPTIONS: Record<VisibleDimension, { label: string; backend: BackendDimension }> = {
  date: { label: "日期", backend: "date" },
  objectId: { label: "对象ID", backend: "object_id" },
  country: { label: "国家", backend: "country" },
  groupId: { label: "项目组", backend: "group_id" },
  actionType: { label: "事件", backend: "action_type" },
};

const METRIC_OPTIONS: Record<MetricKey, { label: string; backend: AdsConsole.ReportMetric }> = {
  actionCount: { label: "事件数量", backend: "action_count" },
  cpa: { label: "CPA", backend: "cpa" },
};

const REPORT_SCHEMAS: Record<ReportType, ReportSchema> = {
  account: {
    filters: ["objectId", "country", "groupId", "actionType"],
    dimensions: ["date", "objectId", "country", "groupId", "actionType"],
    metrics: ["actionCount", "cpa"],
    defaultDimensions: ["date"],
    defaultMetrics: ["actionCount", "cpa"],
    defaultSort: "date",
  },
  campaign: {
    filters: ["objectId", "accountId", "country", "groupId", "actionType"],
    dimensions: ["date", "objectId", "country", "groupId", "actionType"],
    metrics: ["actionCount", "cpa"],
    defaultDimensions: ["date"],
    defaultMetrics: ["actionCount", "cpa"],
    defaultSort: "date",
  },
  adset: {
    filters: ["objectId", "accountId", "campaignId", "country", "groupId", "actionType"],
    dimensions: ["date", "objectId", "country", "groupId", "actionType"],
    metrics: ["actionCount", "cpa"],
    defaultDimensions: ["date"],
    defaultMetrics: ["actionCount", "cpa"],
    defaultSort: "date",
  },
};

const normalizeDateValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value.format("YYYY-MM-DD");
  if (typeof value === "string") return value;
  return undefined;
};

const normalizeSelectValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
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

const EventReportPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(undefined);

  const [reportType, setReportType] = useState<ReportType>("account");
  const objectIdLabel = OBJECT_ID_LABEL_MAP[reportType];
  const schema = REPORT_SCHEMAS[reportType];

  const [selectedDimensions, setSelectedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(schema.defaultMetrics);
  const [appliedDimensions, setAppliedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [appliedMetrics, setAppliedMetrics] = useState<MetricKey[]>(schema.defaultMetrics);
  const [queryState, setQueryState] = useState<QueryState>({
    startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
  });

  const [idOptions, setIdOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [objectNameMap, setObjectNameMap] = useState<Record<string, string>>({});
  const [groupOptions, setGroupOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [actionTypeOptions, setActionTypeOptions] = useState<AdsConsole.SelectOption[]>([]);

  const groupNameMap = toOptionLabelMap(groupOptions);

  useEffect(() => {
    form.setFieldsValue({ dateRange: [dayjs().subtract(6, "day"), dayjs()] });
  }, [form]);

  useEffect(() => {
    getGroupOptions().then((res) => {
      setGroupOptions(
        (res?.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        }))
      );
    });
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
      } else {
        const adsetRes = await getAdsetOptions();
        rawIdOptions = toSelectOptions(adsetRes?.data as unknown[]);
      }
      setIdOptions(toObjectIdOptions(rawIdOptions));
      setObjectNameMap(toOptionLabelMap(rawIdOptions));

      const [countryRes, eventRes, accountRes, campaignRes] = await Promise.all([
        getTargetCountryOptions({ objectType: reportType }),
        getTargetEventOptions({ objectType: reportType }),
        getAccountOptions(),
        getCampaignOptions(),
      ]);
      setCountryOptions(countryRes?.data || []);
      setActionTypeOptions(eventRes?.data || []);
      setAccountOptions(toObjectIdOptions(toSelectOptions(accountRes?.data as unknown[])));
      setCampaignOptions(toObjectIdOptions(toSelectOptions(campaignRes?.data as unknown[])));
    };

    loadTypeOptions();
  }, [reportType]);

  const columns = React.useMemo<ProColumns<AdsConsole.RptEventDayVO>[]>(() => {
    const cols: ProColumns<AdsConsole.RptEventDayVO>[] = [];

    if (appliedDimensions.includes("date")) {
      cols.push({
        title: "日期",
        dataIndex: "date",
        width: 120,
        fixed: "left",
        sorter: true,
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

    if (appliedDimensions.includes("country")) {
      cols.push({
        title: "国家",
        dataIndex: "country",
        width: 120,
        render: (_, record) => normalizeSelectValue(record.country) || "-",
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

    if (appliedDimensions.includes("actionType")) {
      cols.push({
        title: "事件",
        dataIndex: "actionType",
        width: 200,
        render: (_, record) => normalizeSelectValue(record.actionType) || "-",
      });
    }

    if (appliedMetrics.includes("actionCount")) {
      cols.push({
        title: "事件数量",
        dataIndex: "actionCount",
        width: 140,
        sorter: true,
        render: (value) => Number(value || 0).toLocaleString(),
      });
    }

    if (appliedMetrics.includes("cpa")) {
      cols.push({
        title: "CPA",
        dataIndex: "cpa",
        width: 120,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(4),
      });
    }

    return cols;
  }, [appliedDimensions, appliedMetrics, groupNameMap, objectIdLabel, objectNameMap]);

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
      country: normalizeSelectValue(values.country),
      groupId: normalizeSelectValue(values.groupId),
      actionType: normalizeSelectValue(values.actionType),
    };

    setAppliedDimensions(selectedDimensions);
    setAppliedMetrics(selectedMetrics);
    setQueryState(nextQuery);
    actionRef.current?.reloadAndRest?.();
  };

  const resetConfig = () => {
    const nextSchema = REPORT_SCHEMAS[reportType];
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(nextSchema.defaultMetrics);
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(nextSchema.defaultMetrics);
    form.setFieldsValue({
      dateRange: [dayjs().subtract(6, "day"), dayjs()],
      objectId: undefined,
      accountId: undefined,
      campaignId: undefined,
      country: undefined,
      groupId: undefined,
      actionType: undefined,
    });
    setQueryState({
      startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
    });
    actionRef.current?.reloadAndRest?.();
  };

  const handleReportTypeChange = (nextType: ReportType) => {
    const nextSchema = REPORT_SCHEMAS[nextType];
    const current = form.getFieldsValue();
    const pruned: Record<string, unknown> = { dateRange: current.dateRange };
    nextSchema.filters.forEach((key) => {
      pruned[key] = current[key];
    });

    form.setFieldsValue({
      objectId: undefined,
      accountId: undefined,
      campaignId: undefined,
      country: undefined,
      groupId: undefined,
      actionType: undefined,
      ...pruned,
    });

    setQueryState((prev) => ({
      ...prev,
      objectId: normalizeSelectValue(pruned.objectId),
      accountId: normalizeSelectValue(pruned.accountId),
      campaignId: normalizeSelectValue(pruned.campaignId),
      country: normalizeSelectValue(pruned.country),
      groupId: normalizeSelectValue(pruned.groupId),
      actionType: normalizeSelectValue(pruned.actionType),
    }));

    setReportType(nextType);
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(nextSchema.defaultMetrics);
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(nextSchema.defaultMetrics);

    setTimeout(() => actionRef.current?.reloadAndRest?.(), 0);
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
    country: countryOptions,
    groupId: groupOptions,
    actionType: actionTypeOptions,
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
                setSelectedMetrics(value);
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
        <ProTable<AdsConsole.RptEventDayVO, ReportSearchParams>
          rowKey={(record) =>
            [
              record.id,
              record.objectId,
              record.date,
              record.country,
              record.groupId,
              record.actionType,
            ]
              .map((item) => normalizeSelectValue(item) || "")
              .join("_")
          }
          actionRef={actionRef}
          columns={columns}
          search={false}
          options={false}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1320, y: "52vh" }}
          size="small"
          params={queryState}
          request={async (params, sort) => {
            const activeSortKey = Object.keys(sort || {}).find((key) => sort[key] != null);
            const sortField = toBackendSortField(activeSortKey || schema.defaultSort);
            const sortValue = activeSortKey ? (sort[activeSortKey] as SortOrder | undefined) : undefined;
            const sortOrder =
              sortValue === "ascend" ? "asc" : sortValue === "descend" ? "desc" : "desc";

            const res = await getEventReportPage({
              objectName: reportType,
              current: params.current,
              size: params.pageSize,
              startDate: params.startDate,
              endDate: params.endDate,
              objectId: normalizeSelectValue(params.objectId),
              accountId: normalizeSelectValue(params.accountId),
              campaignId: normalizeSelectValue(params.campaignId),
              country: normalizeSelectValue(params.country),
              groupId: normalizeSelectValue(params.groupId),
              actionType: normalizeSelectValue(params.actionType),
              dims: appliedDimensions.map((d) => DIMENSION_OPTIONS[d].backend),
              metrics: appliedMetrics.map((m) => METRIC_OPTIONS[m].backend),
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

export default EventReportPage;


