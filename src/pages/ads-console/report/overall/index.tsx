import {
  getAccountOptions,
  getAdsetOptions,
  getCampaignOptions,
  getTargetCountryOptions,
} from "@/services/ads-console/adsOptions";
import {
  getAgencyOptions,
  getGroupOptions,
} from "@/services/ads-console/orgOptions";
import { getOverallReportPage } from "@/services/ads-console/report";
import { getPlatformAccountPage, getPlatformObjectOptions } from "@/services/ads-console/platform";
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
import type { DragEvent as ReactDragEvent } from "react";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAdsAuthToken } from "@/services/ads-console/authStorage";

type ReportType = AdsConsole.ReportObjectName;
type ReportPlatform = AdsConsole.ReportPlatform;
type FilterKey =
  | "objectId"
  | "platformAccountId"
  | "accountId"
  | "campaignId"
  | "country"
  | "groupId"
  | "agencyId";
type VisibleDimension = "date" | "objectId" | "country" | "groupId" | "agencyId";
type MetricKey =
  | "spend"
  | "impressions"
  | "clicks"
  | "reach"
  | "frequency"
  | "ctr"
  | "cpm"
  | "cpc"
  | "cvr"
  | "roas"
  | "ecpm"
  | "profit"
  | "roi"
  | "cpa"
  | "installs"
  | "cpi"
  | "cr";
type MetricColumn = ProColumns<AdsConsole.RptOverallDayVO> & { metricKey: MetricKey };
type BackendDimension = "date" | "object_id" | "country" | "group_id" | "agency_id";

const METRIC_ORDER: MetricKey[] = [
  "spend",
  "impressions",
  "clicks",
  "installs",
  "reach",
  "frequency",
  "ctr",
  "cpm",
  "cpc",
  "cpi",
  "cvr",
  "cr",
  "cpa",
  "roas",
  "ecpm",
  "profit",
  "roi",
];

const sortMetrics = (values: MetricKey[]) =>
  [...values].sort((a, b) => METRIC_ORDER.indexOf(a) - METRIC_ORDER.indexOf(b));

const mergeMetricOrder = (current: MetricKey[], next: MetricKey[]) => {
  const nextSet = new Set(next);
  const kept = current.filter((metric) => nextSet.has(metric));
  const appended = sortMetrics(next.filter((metric) => !kept.includes(metric)));
  return [...kept, ...appended];
};

const reorderMetrics = (metrics: MetricKey[], from: MetricKey, to: MetricKey) => {
  const fromIndex = metrics.indexOf(from);
  const toIndex = metrics.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return metrics;
  }
  const next = [...metrics];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const createMetricColumn = (metric: MetricKey): MetricColumn => {
  const base = {
    metricKey: metric,
    key: metric,
  } as const;

  switch (metric) {
    case "spend":
      return {
        ...base,
        title: "Spend",
        dataIndex: "spend",
        width: 120,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "impressions":
      return {
        ...base,
        title: "Impressions",
        dataIndex: "impressions",
        width: 120,
        sorter: true,
        render: (value) => formatNumber(value as number),
      };
    case "clicks":
      return {
        ...base,
        title: "Clicks",
        dataIndex: "clicks",
        width: 100,
        sorter: true,
        render: (value) => formatNumber(value as number),
      };
    case "installs":
      return {
        ...base,
        title: "Installs",
        dataIndex: "installs",
        width: 120,
        sorter: true,
        render: (value) => formatNumber(value as number),
      };
    case "reach":
      return {
        ...base,
        title: "Reach",
        dataIndex: "reach",
        width: 120,
        sorter: true,
        render: (value) => formatNumber(value as number),
      };
    case "frequency":
      return {
        ...base,
        title: "Frequency",
        dataIndex: "frequency",
        width: 130,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      };
    case "ctr":
      return {
        ...base,
        title: "CTR",
        dataIndex: "ctr",
        width: 100,
        sorter: true,
        render: (value) => `${Number(value || 0).toFixed(2)}%`,
      };
    case "cpm":
      return {
        ...base,
        title: "CPM",
        dataIndex: "cpm",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      };
    case "cpc":
      return {
        ...base,
        title: "CPC",
        dataIndex: "cpc",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "cpi":
      return {
        ...base,
        title: "CPI",
        dataIndex: "cpi",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "cvr":
      return {
        ...base,
        title: "CVR",
        dataIndex: "cvr",
        width: 100,
        sorter: true,
        render: (value) => `${Number(value || 0).toFixed(2)}%`,
      };
    case "cr":
      return {
        ...base,
        title: "CR",
        dataIndex: "cr",
        width: 100,
        sorter: true,
        render: (value) => `${Number(value || 0).toFixed(3)}`,
      };
    case "cpa":
      return {
        ...base,
        title: "CPA",
        dataIndex: "cpa",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "roas":
      return {
        ...base,
        title: "ROAS",
        dataIndex: "roas",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(2),
      };
    case "ecpm":
      return {
        ...base,
        title: "eCPM",
        dataIndex: "ecpm",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "profit":
      return {
        ...base,
        title: "Profit",
        dataIndex: "profit",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
    case "roi":
      return {
        ...base,
        title: "ROI",
        dataIndex: "roi",
        width: 100,
        sorter: true,
        render: (value) => Number(value || 0).toFixed(3),
      };
  }
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
  platform?: ReportPlatform;
  platformAccountId?: string;
  startDate?: string;
  endDate?: string;
  objectId?: string;
  accountId?: string;
  campaignId?: string;
  countries?: string[];
  country?: string;
  groupId?: string;
  agencyId?: string;
  objectIds?: string[];
  accountIds?: string[];
  campaignIds?: string[];
  groupIds?: string[];
  agencyIds?: string[];
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

const MINTEGRAL_REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "Campaign", value: "campaign" },
  { label: "Offer", value: "offer" },
];

const KWAI_REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "Campaign", value: "campaign" },
  { label: "Ad Set", value: "adset" },
  { label: "Ad", value: "ad" },
];

const GOOGLE_ADS_REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "Campaign", value: "campaign" },
  { label: "Ad Group", value: "ad_group" },
  { label: "Ad", value: "ad" },
];

const OBJECT_ID_LABEL_MAP: Record<ReportType, string> = {
  account: "账户ID",
  campaign: "活动ID",
  adset: "广告组ID",
  ad_group: "Ad Group ID",
  ad: "广告ID",
  offer: "Offer ID",
};

const FILTER_OPTIONS: Record<FilterKey, { label: string; placeholder: string }> = {
  objectId: { label: "对象ID", placeholder: "请选择对象ID" },
  platformAccountId: { label: "平台账户", placeholder: "请选择平台账户" },
  accountId: { label: "账户ID", placeholder: "请选择账户ID" },
  campaignId: { label: "活动ID", placeholder: "请选择活动ID" },
  country: { label: "国家", placeholder: "请选择国家" },
  groupId: { label: "项目组", placeholder: "请选择项目组" },
  agencyId: { label: "代理商", placeholder: "请选择代理商" },
};

const DIMENSION_OPTIONS: Record<VisibleDimension, { label: string; backend: BackendDimension }> = {
  date: { label: "日期", backend: "date" },
  objectId: { label: "对象ID", backend: "object_id" },
  country: { label: "国家", backend: "country" },
  groupId: { label: "项目组", backend: "group_id" },
  agencyId: { label: "代理商", backend: "agency_id" },
};

const METRIC_OPTIONS: Record<MetricKey, { label: string }> = {
  spend: { label: "Spend" },
  impressions: { label: "Impressions" },
  clicks: { label: "Clicks" },
  installs: { label: "Installs" },
  reach: { label: "Reach" },
  frequency: { label: "Frequency" },
  ctr: { label: "CTR" },
  cpm: { label: "CPM" },
  cpc: { label: "CPC" },
  cpi: { label: "CPI" },
  cvr: { label: "CVR" },
  cr: { label: "CR" },
  cpa: { label: "CPA" },
  roas: { label: "ROAS" },
  ecpm: { label: "eCPM" },
  profit: { label: "Profit" },
  roi: { label: "ROI" },
};

const REPORT_SCHEMAS: Record<ReportType, ReportSchema> = {
  account: {
    filters: ["objectId", "country", "groupId", "agencyId"],
    dimensions: ["date", "objectId", "country", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "date",
  },
  campaign: {
    filters: ["accountId", "objectId", "country", "groupId", "agencyId"],
    dimensions: ["date", "objectId", "country", "groupId", "agencyId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "date",
  },
  adset: {
    filters: ["accountId", "campaignId", "objectId", "country", "groupId"],
    dimensions: ["date", "objectId", "country", "groupId"],
    metrics: METRIC_ORDER,
    defaultDimensions: ["date"],
    defaultMetrics: [...METRIC_ORDER],
    defaultSort: "date",
  },
  ad: {
    filters: ["platformAccountId", "objectId", "country"],
    dimensions: ["date", "objectId", "country"],
    metrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultDimensions: ["date"],
    defaultMetrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultSort: "date",
  },
  ad_group: {
    filters: ["platformAccountId", "objectId"],
    dimensions: ["date", "objectId"],
    metrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultDimensions: ["date"],
    defaultMetrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultSort: "date",
  },
  offer: {
    filters: ["platformAccountId", "objectId", "country"],
    dimensions: ["date", "objectId", "country"],
    metrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultDimensions: ["date"],
    defaultMetrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"],
    defaultSort: "date",
  },
};

const getReportSchema = (platform: ReportPlatform, type: ReportType) => {
  if (platform === "mintegral" || platform === "kwai") {
    return {
      ...REPORT_SCHEMAS[type],
      filters: ["platformAccountId", "objectId", "country", "groupId"] as FilterKey[],
      dimensions: ["date", "objectId", "country", "groupId"] as VisibleDimension[],
      metrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"] as MetricKey[],
      defaultDimensions: ["date"] as VisibleDimension[],
      defaultMetrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"] as MetricKey[],
      defaultSort: "date",
    };
  }
  if (platform === "google_ads") {
    return {
      ...REPORT_SCHEMAS[type],
      filters: ["platformAccountId", "objectId", "groupId"] as FilterKey[],
      dimensions: ["date", "objectId", "groupId"] as VisibleDimension[],
      metrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"] as MetricKey[],
      defaultDimensions: ["date"] as VisibleDimension[],
      defaultMetrics: ["spend", "impressions", "clicks", "ctr", "cpm", "cpc"] as MetricKey[],
      defaultSort: "date",
    };
  }
  return REPORT_SCHEMAS[type];
};

const platformReportTypeOptions = (value: ReportPlatform) => {
  if (value === "mintegral") return MINTEGRAL_REPORT_TYPE_OPTIONS;
  if (value === "kwai") return KWAI_REPORT_TYPE_OPTIONS;
  if (value === "google_ads") return GOOGLE_ADS_REPORT_TYPE_OPTIONS;
  return REPORT_TYPE_OPTIONS;
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
    .map<AdsConsole.SelectOption | null>((item) => {
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
    .map<AdsConsole.SelectOption | null>((item) => {
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

const ReportPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>(undefined);

  const [platform, setPlatform] = useState<ReportPlatform>("facebook");
  const [reportType, setReportType] = useState<ReportType>("account");
  const selectedPlatformAccountId = Form.useWatch("platformAccountId", form);
  const objectIdLabel = OBJECT_ID_LABEL_MAP[reportType];
  const schema = getReportSchema(platform, reportType);

  const [selectedDimensions, setSelectedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(schema.defaultMetrics);
  const [appliedDimensions, setAppliedDimensions] = useState<VisibleDimension[]>(
    schema.defaultDimensions
  );
  const [appliedMetrics, setAppliedMetrics] = useState<MetricKey[]>(schema.defaultMetrics);
  const [queryState, setQueryState] = useState<QueryState>({
    platform: "facebook",
    startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
  });

  const [idOptions, setIdOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [platformAccountOptions, setPlatformAccountOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [accountOptions, setAccountOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [objectNameMap, setObjectNameMap] = useState<Record<string, string>>({});
  const [groupOptions, setGroupOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [agencyOptions, setAgencyOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [exporting, setExporting] = useState(false);
  const [draggingMetric, setDraggingMetric] = useState<MetricKey | null>(null);
  const [dragOverMetric, setDragOverMetric] = useState<MetricKey | null>(null);

  const groupNameMap = useMemo(() => toOptionLabelMap(groupOptions), [groupOptions]);
  const agencyNameMap = useMemo(() => toOptionLabelMap(agencyOptions), [agencyOptions]);

  useEffect(() => {
    form.setFieldsValue({
      dateRange: [dayjs().subtract(6, "day"), dayjs()],
    });
  }, [form]);

  useEffect(() => {
    const loadCommonOptions = async () => {
      const groupRes = await getGroupOptions();
      setGroupOptions(
        (groupRes?.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        }))
      );

      if (platform !== "facebook") {
        setAgencyOptions([]);
        const accountRes = await getPlatformAccountPage({
          platform,
          status: 1,
          current: 1,
          size: 1000,
        });
        setPlatformAccountOptions(
          (accountRes?.data?.records || []).map((item) => ({
            label: item.accountId ? `${item.name} (${item.accountId})` : item.name,
            value: String(item.id),
          }))
        );
        return;
      }
      setPlatformAccountOptions([]);
      const agencyRes = await getAgencyOptions();
      setAgencyOptions(
        (agencyRes?.data || []).map((item) => ({
          label: String(item.label ?? item.value),
          value: String(item.value),
        }))
      );
    };

    loadCommonOptions();
  }, [platform]);

  useEffect(() => {
    const loadTypeOptions = async () => {
      let rawIdOptions: AdsConsole.SelectOption[] = [];
      if (platform !== "facebook") {
        const objectRes = await getPlatformObjectOptions({
          platform,
          platformAccountId: normalizeSelectValue(selectedPlatformAccountId),
          objectType: reportType,
        });
        rawIdOptions = toSelectOptions(objectRes?.data as unknown[]);
        setAccountOptions([]);
        setCampaignOptions([]);
        setCountryOptions([]);
      } else if (reportType === "account") {
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

      if (platform === "facebook") {
        const [accountRes, campaignRes, countryRes] = await Promise.all([
          getAccountOptions(),
          getCampaignOptions(),
          getTargetCountryOptions({ objectType: reportType }),
        ]);
        setAccountOptions(toObjectIdOptions(toSelectOptions(accountRes?.data as unknown[])));
        setCampaignOptions(toObjectIdOptions(toSelectOptions(campaignRes?.data as unknown[])));
        setCountryOptions(countryRes?.data || []);
      }
    };

    loadTypeOptions();
  }, [platform, reportType, selectedPlatformAccountId]);

  const columns = useMemo<ProColumns<AdsConsole.RptOverallDayVO>[]>(() => {
    const dimensionColumns: ProColumns<AdsConsole.RptOverallDayVO>[] = [];

    if (appliedDimensions.includes("date")) {
      dimensionColumns.push({
        title: "日期",
        dataIndex: "date",
        width: 120,
        fixed: "left",
        sorter: true,
      });
    }

    if (appliedDimensions.includes("objectId")) {
      dimensionColumns.push({
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
      dimensionColumns.push({
        title: "国家",
        dataIndex: "country",
        width: 120,
        render: (_, record) => normalizeSelectValue(record.country) || "-",
      });
    }

    if (appliedDimensions.includes("groupId")) {
      dimensionColumns.push({
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
      dimensionColumns.push({
        title: "代理商",
        dataIndex: "agencyName",
        width: 180,
        render: (_, record) => {
          const agencyId = normalizeSelectValue(record.agencyId);
          return (agencyId && agencyNameMap[agencyId]) || "-";
        },
      });
    }

    const metricColumns = appliedMetrics.map((metric) => {
      const column = createMetricColumn(metric);
      return {
        ...column,
        onHeaderCell: () => ({
          draggable: true,
          onDragStart: (event: ReactDragEvent<HTMLTableCellElement>) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", metric);
            setDraggingMetric(metric);
          },
          onDragOver: (event: ReactDragEvent<HTMLTableCellElement>) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (dragOverMetric !== metric) {
              setDragOverMetric(metric);
            }
          },
          onDrop: (event: ReactDragEvent<HTMLTableCellElement>) => {
            event.preventDefault();
            const source = event.dataTransfer.getData("text/plain") as MetricKey;
            if (!source || source === metric) {
              setDraggingMetric(null);
              setDragOverMetric(null);
              return;
            }
            const nextMetrics = reorderMetrics(appliedMetrics, source, metric);
            setAppliedMetrics(nextMetrics);
            setSelectedMetrics(nextMetrics);
            setDraggingMetric(null);
            setDragOverMetric(null);
          },
          onDragEnd: () => {
            setDraggingMetric(null);
            setDragOverMetric(null);
          },
          style: {
            cursor: "grab",
            backgroundColor:
              dragOverMetric === metric && draggingMetric && draggingMetric !== metric
                ? "#f0f7ff"
                : undefined,
          },
        }),
      } satisfies ProColumns<AdsConsole.RptOverallDayVO>;
    });

    return [...dimensionColumns, ...metricColumns];
  }, [
    agencyNameMap,
    appliedDimensions,
    appliedMetrics,
    dragOverMetric,
    draggingMetric,
    groupNameMap,
    objectIdLabel,
    objectNameMap,
  ]);

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
      platform,
      platformAccountId: values.platformAccountId as string | undefined,
      startDate: normalizeDateValue(dateRange?.[0]),
      endDate: normalizeDateValue(dateRange?.[1]),
      objectIds: values.objectId as string[] | undefined,
      countries: values.country as string[] | undefined,
      accountIds: platform === "facebook" ? values.accountId as string[] | undefined : undefined,
      campaignIds: platform === "facebook" ? values.campaignId as string[] | undefined : undefined,
      groupIds: values.groupId as string[] | undefined,
      agencyIds: platform === "facebook" ? values.agencyId as string[] | undefined : undefined,
    };

    setAppliedDimensions(selectedDimensions);
    setAppliedMetrics(selectedMetrics);
    setQueryState(nextQuery);
    actionRef.current?.reloadAndRest?.();
  };

  const resetConfig = () => {
    const nextSchema = getReportSchema(platform, reportType);
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(nextSchema.defaultMetrics);
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(nextSchema.defaultMetrics);
    form.setFieldsValue({
      dateRange: [dayjs().subtract(6, "day"), dayjs()],
      platformAccountId: undefined,
      objectId: undefined,
      accountId: undefined,
      campaignId: undefined,
      country: undefined,
      groupId: undefined,
      agencyId: undefined,
    });
    setQueryState({
      platform,
      platformAccountId: undefined,
      startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
    });
    actionRef.current?.reloadAndRest?.();
  };

  const handleExport = async () => {
    if (platform !== "facebook") {
      message.warning("非 Facebook 平台暂未开放 Excel 导出");
      return;
    }
    const values = form.getFieldsValue();
    const dateRange = values.dateRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
    const params = new URLSearchParams();

    params.set("objectName", reportType);
    const startDate = normalizeDateValue(dateRange?.[0]);
    const endDate = normalizeDateValue(dateRange?.[1]);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (values.objectId && Array.isArray(values.objectId)) {
      (values.objectId as string[]).forEach((v: string) => {
        params.append("objectIds", v);
      });
    }
    if (values.accountId && Array.isArray(values.accountId)) {
      (values.accountId as string[]).forEach((v: string) => {
        params.append("accountIds", v);
      });
    }
    if (values.campaignId && Array.isArray(values.campaignId)) {
      (values.campaignId as string[]).forEach((v: string) => {
        params.append("campaignIds", v);
      });
    }
    if (values.country && Array.isArray(values.country)) {
      (values.country as string[]).forEach((c: string) => {
        params.append("countries", c);
      });
    }
    if (values.groupId && Array.isArray(values.groupId)) {
      (values.groupId as string[]).forEach((v: string) => {
        params.append("groupIds", v);
      });
    }
    if (values.agencyId && Array.isArray(values.agencyId)) {
      (values.agencyId as string[]).forEach((v: string) => {
        params.append("agencyIds", v);
      });
    }
    appliedDimensions.forEach((d) => {
      params.append("dims", DIMENSION_OPTIONS[d].backend);
    });
    appliedMetrics.forEach((m) => {
      params.append("metrics", m);
    });

    setExporting(true);
    const url = `/ads-api/fb/report/day/overall/export?${params.toString()}`;
    const token = getAdsAuthToken();
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `overall_report_${dayjs().format("YYYY-MM-DD")}.xlsx`;
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

  const handleReportTypeChange = (nextType: ReportType) => {
    const nextSchema = getReportSchema(platform, nextType);
    const current = form.getFieldsValue();
    const pruned: Record<string, unknown> = {
      dateRange: current.dateRange,
    };

    // objectId 的语义随类型变化，不直接保留；
    // 规则1：当前类型的 objectId 迁移到下一个类型对应的过滤字段
    //   account  的 objectId（accountId 值）  → 下一个类型的 accountId
    //   campaign 的 objectId（campaignId 值） → 下一个类型的 campaignId
    const OBJECT_ID_CARRY_OVER: Partial<Record<ReportType, FilterKey>> = {
      account: "accountId",
      campaign: "campaignId",
    };
    const carryOverTarget = OBJECT_ID_CARRY_OVER[reportType];
    if (carryOverTarget && current.objectId && nextSchema.filters.includes(carryOverTarget)) {
      pruned[carryOverTarget] = current.objectId;
    }

    // 规则2：从 campaign/adset 切换到 account 类型时，
    // 把当前的 accountId 迁移到 account 类型的 objectId（account 类型用 objectId 筛账户）
    if (nextType === "account" && current.accountId) {
      pruned.objectId = current.accountId;
    }

    nextSchema.filters.forEach((key) => {
      if (key === "objectId") return; // objectId 始终清空，语义已变
      if (pruned[key] !== undefined) return; // 已被 carry-over 赋值，不覆盖
      pruned[key] = current[key];
    });

    form.setFieldsValue({
      objectId: undefined,
      platformAccountId: undefined,
      accountId: undefined,
      campaignId: undefined,
      country: undefined,
      groupId: undefined,
      agencyId: undefined,
      ...pruned,
    });

    setQueryState((prev) => ({
      ...prev,
      platform,
      platformAccountId: pruned.platformAccountId as string | undefined,
      objectIds: pruned.objectId as string[] | undefined,
      accountIds: platform === "facebook" ? pruned.accountId as string[] | undefined : undefined,
      campaignIds: platform === "facebook" ? pruned.campaignId as string[] | undefined : undefined,
      countries: pruned.country as string[] | undefined,
      groupIds: pruned.groupId as string[] | undefined,
      agencyIds: platform === "facebook" ? pruned.agencyId as string[] | undefined : undefined,
    }));

    setReportType(nextType);
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(nextSchema.defaultMetrics);
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(nextSchema.defaultMetrics);

    setTimeout(() => actionRef.current?.reloadAndRest?.(), 0);
  };

  const handlePlatformChange = (nextPlatform: ReportPlatform) => {
    const nextType = platformReportTypeOptions(nextPlatform)[0].value;
    const nextSchema = getReportSchema(nextPlatform, nextType);
    const dateRange = form.getFieldValue("dateRange");

    setPlatform(nextPlatform);
    setReportType(nextType);
    setSelectedDimensions(nextSchema.defaultDimensions);
    setSelectedMetrics(nextSchema.defaultMetrics);
    setAppliedDimensions(nextSchema.defaultDimensions);
    setAppliedMetrics(nextSchema.defaultMetrics);
    form.setFieldsValue({
      dateRange,
      objectId: undefined,
      platformAccountId: undefined,
      accountId: undefined,
      campaignId: undefined,
      country: undefined,
      groupId: undefined,
      agencyId: undefined,
    });
    setQueryState({
      platform: nextPlatform,
      platformAccountId: undefined,
      startDate: normalizeDateValue(dateRange?.[0]) || dayjs().subtract(6, "day").format("YYYY-MM-DD"),
      endDate: normalizeDateValue(dateRange?.[1]) || dayjs().format("YYYY-MM-DD"),
    });
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
    platformAccountId: platformAccountOptions,
    accountId: accountOptions,
    campaignId: campaignOptions,
    country: countryOptions,
    groupId: groupOptions,
    agencyId: agencyOptions,
  };

  const reportTypeOptions = platformReportTypeOptions(platform);
  const reportTypeTabItems = reportTypeOptions.map((item) => ({
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
                平台
              </Typography.Text>
              <Segmented
                value={platform}
                options={[
                  { label: "Facebook", value: "facebook" },
                  { label: "Mintegral", value: "mintegral" },
                  { label: "Kwai", value: "kwai" },
                  { label: "Google Ads", value: "google_ads" },
                ]}
                onChange={(value) => handlePlatformChange(value as ReportPlatform)}
              />
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
              <Button loading={exporting} disabled={platform !== "facebook"} onClick={handleExport}>
                {exporting ? "导出中..." : "导出 Excel"}
              </Button>
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
                      mode={key === "platformAccountId" ? undefined : "multiple"}
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
                setSelectedMetrics((current) => mergeMetricOrder(current, value));
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
        <ProTable<AdsConsole.RptOverallDayVO, ReportSearchParams>
          rowKey={(record) =>
            [
              record.id,
              record.objectId,
              record.date,
              record.country,
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
          params={queryState}
          request={async (params, sort) => {
            const activeSortKey = Object.keys(sort || {}).find((key) => sort[key] != null);
            const defaultSort = appliedDimensions.includes("date")
              ? "date"
              : appliedDimensions[0];
            const sortField = activeSortKey || defaultSort;
            const sortValue = activeSortKey ? (sort[activeSortKey] as SortOrder | undefined) : undefined;
            const sortOrder =
              sortValue === "ascend" ? "asc" : sortValue === "descend" ? "desc" : "desc";

            const res = await getOverallReportPage({
              platform,
              objectName: reportType,
              current: params.current,
              size: params.pageSize,
              startDate: params.startDate,
              endDate: params.endDate,
              platformAccountId: params.platformAccountId,
              objectIds: params.objectIds,
              accountIds: params.accountIds,
              campaignIds: params.campaignIds,
              countries: params.countries,
              groupIds: params.groupIds,
              agencyIds: params.agencyIds,
              dims: appliedDimensions.map((d) => DIMENSION_OPTIONS[d].backend),
              metrics: appliedMetrics,
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

export default ReportPage;

