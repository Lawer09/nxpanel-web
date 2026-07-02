import type { SortOrder } from 'antd/es/table/interface';
import { Space, Tag, Tooltip } from 'antd';
import React from 'react';

export const COMMON_COUNTRY_OPTIONS = [
  'US',
  'JP',
  'KR',
  'SG',
  'HK',
  'TW',
  'GB',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'SE',
  'CA',
  'AU',
  'NZ',
  'IN',
  'ID',
  'TH',
  'VN',
  'MY',
  'PH',
  'BR',
  'MX',
  'TR',
  'AE',
  'SA',
  'ZA',
  'RU',
];

export const APP_PLATFORM_DISPLAY_DIMENSION = 'appPlatformDisplay';
export const AD_STATUS_DISPLAY_DIMENSION = 'adStatusDisplay';
export const DEPARTMENT_DISPLAY_DIMENSION = 'departmentDisplay';

const toSafeNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

export const fmtInt = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return Math.round(next).toLocaleString();
};

export const fmtCurrency = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return next.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtFixed2 = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return next.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtTraffic = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  if (next >= 1024) return `${(next / 1024).toFixed(2)} GB`;
  return `${next.toFixed(2)} MB`;
};

export const fmtPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${next.toFixed(2)}%`;
};

const getTrafficCostRatio = (record?: Record<string, unknown>) => {
  const explicitRatio = toSafeNumber(record?.trafficCostRatio);
  if (explicitRatio !== null) return explicitRatio * 100;

  const trafficCost = toSafeNumber(record?.trafficCost);
  const totalCost = toSafeNumber(record?.totalCost);
  if (trafficCost === null || totalCost === null || totalCost === 0) return null;
  return (trafficCost / totalCost) * 100;
};

export const fmtTrafficCostWithRatio = (trafficCost: unknown, record?: Record<string, unknown>) => {
  const costText = fmtCurrency(trafficCost);
  if (costText === '--') return costText;

  const ratio = getTrafficCostRatio(record);
  if (ratio === null) return costText;
  return `${costText} (${fmtPercent(ratio)})`;
};

export const fmtRoiPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

export const fmtCountry = (country?: string | null) => {
  if (!country) return '--';
  return country.toUpperCase();
};

export const fmtReportHour = (hour: unknown) => {
  const next = toSafeNumber(hour);
  if (next === null) return '--';
  return `${String(Math.max(0, Math.min(23, Math.floor(next)))).padStart(2, '0')}:00`;
};

export const getAdStatusLabel = (adStatus?: string | null) => {
  const normalized = adStatus?.trim();
  if (!normalized) return undefined;
  return normalized;
};

export const getAdStatusColor = (adStatus?: string | null) => {
  if (adStatus === '在投') return 'green';
  if (adStatus === '暂停') return 'orange';
  if (adStatus === '未上线') return 'default';
  return 'blue';
};

export const getAppPlatformLabel = (appPlatform?: string | null) => {
  const normalized = appPlatform?.trim().toUpperCase();
  if (!normalized) return undefined;
  if (normalized === 'IOS') return 'iOS';
  if (normalized === 'ANDROID') return 'Android';
  return normalized;
};

export const getAppPlatformColor = (appPlatform?: string | null) => {
  const normalized = appPlatform?.trim().toUpperCase();
  if (normalized === 'IOS') return 'purple';
  if (normalized === 'ANDROID') return 'cyan';
  return 'blue';
};

const getIsLimitTagMeta = (isLimited: unknown) => {
  if (isLimited === true || isLimited === 'true' || isLimited === 1 || isLimited === '1') {
    return { label: '限流', color: 'red' as const };
  }
  return null;
};

const getHourlyStatusMessages = (hourlyStatus: unknown) => {
  const status = Number(hourlyStatus);
  if (!Number.isFinite(status) || status <= 0) return [];

  const messages: string[] = [];
  if ((status & 1) === 1) {
    messages.push('无小时请求');
  }
  if ((status & 2) === 2) {
    messages.push('无小时用户新增');
  }
  return messages;
};

const fmtRevenueWithDiff = (adRevenue: unknown, record?: Record<string, unknown>) => {
  const revenueText = fmtCurrency(adRevenue);
  if (revenueText === '--') return revenueText;

  const diffValue = record?.adRevenueDiff;
  const diffText = fmtCurrency(diffValue);
  if (diffText === '--') return revenueText;

  return `${revenueText} (${diffText})`;
};

type TopRevenueCountryItem = {
  country: string;
  adRevenue: unknown;
  ratio: unknown;
};

const parseTopRevenueCountries = (value: unknown): TopRevenueCountryItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const country = typeof record.country === 'string' ? record.country.trim().toUpperCase() : '';
      if (!country) return null;
      return {
        country,
        adRevenue: record.adRevenue,
        ratio: record.ratio,
      };
    })
    .filter((item): item is TopRevenueCountryItem => Boolean(item));
};

const fmtRatioDecimalPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

const renderTopRevenueCountries = (record?: Record<string, unknown>) => {
  const countries = parseTopRevenueCountries(record?.topRevenueCountries);
  if (!countries.length) return null;

  const topCountries = countries.slice(0, 3);
  const topRatioTotal = topCountries.reduce((sum, item) => sum + (toSafeNumber(item.ratio) ?? 0), 0);
  const remainingRatio = Math.max(0, 1 - topRatioTotal);
  const nonUsSegmentColors = ['#14b8a6', '#f59e0b', '#8b5cf6'];

  return (
    <Tooltip
      title={
        <Space direction="vertical" size={4}>
          {countries.map((item) => (
            <div
              key={`${item.country}-${String(item.adRevenue)}-${String(item.ratio)}`}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minWidth: 180 }}
            >
              <span>{item.country}</span>
              <span>{fmtRatioDecimalPercent(item.ratio)}</span>
            </div>
          ))}
          {remainingRatio > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minWidth: 180 }}>
              <span>其他</span>
              <span>{fmtRatioDecimalPercent(remainingRatio)}</span>
            </div>
          ) : null}
        </Space>
      }
    >
      <div style={{ width: '100%', minWidth: 120 }}>
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {topCountries.map((item, index) => {
            const ratio = Math.max(0, Math.min(100, (toSafeNumber(item.ratio) ?? 0) * 100));
            if (ratio <= 0) return null;
            const nonUsIndex = topCountries.slice(0, index).filter((countryItem) => countryItem.country !== 'US').length;
            const color =
              item.country === 'US' ? '#2563eb' : nonUsSegmentColors[nonUsIndex % nonUsSegmentColors.length];
            return (
              <div
                key={`${item.country}-${String(item.ratio)}`}
                style={{
                  width: `${ratio}%`,
                  height: '100%',
                  background: color,
                }}
              />
            );
          })}
          {remainingRatio > 0 ? (
            <div
              style={{
                width: `${Math.max(0, Math.min(100, remainingRatio * 100))}%`,
                height: '100%',
                background: '#d1d5db',
              }}
            />
          ) : null}
        </div>
      </div>
    </Tooltip>
  );
};

const renderRevenueWithMeta = (adRevenue: unknown, record?: Record<string, unknown>) => {
  const revenueText = fmtRevenueWithDiff(adRevenue, record);
  const topRevenueCountries = renderTopRevenueCountries(record);

  if (!topRevenueCountries) {
    return revenueText;
  }

  return (
    <Space direction="vertical" size={2}>
      <span>{revenueText}</span>
      {topRevenueCountries}
    </Space>
  );
};

const renderTotalCostBreakdown = (record?: Record<string, unknown>) => {
  const adSpendCost = Math.max(0, toSafeNumber(record?.adSpendCost) ?? 0);
  const trafficCost = Math.max(0, toSafeNumber(record?.trafficCost) ?? 0);
  const totalCost = Math.max(0, toSafeNumber(record?.totalCost) ?? adSpendCost + trafficCost);

  if (totalCost <= 0) return null;

  const adSpendPercent = (adSpendCost / totalCost) * 100;
  const trafficPercent = (trafficCost / totalCost) * 100;

  return (
    <Tooltip
      title={
        <Space direction="vertical" size={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minWidth: 180 }}>
            <span>投放支出</span>
            <span>{fmtPercent(adSpendPercent)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minWidth: 180 }}>
            <span>流量支出</span>
            <span>{fmtPercent(trafficPercent)}</span>
          </div>
        </Space>
      }
    >
      <div style={{ width: '100%', minWidth: 120 }}>
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {adSpendPercent > 0 ? (
            <div
              style={{
                width: `${Math.max(0, Math.min(100, adSpendPercent))}%`,
                height: '100%',
                background: '#c08497',
              }}
            />
          ) : null}
          {trafficPercent > 0 ? (
            <div
              style={{
                width: `${Math.max(0, Math.min(100, trafficPercent))}%`,
                height: '100%',
                background: '#7dd3c7',
              }}
            />
          ) : null}
        </div>
      </div>
    </Tooltip>
  );
};

const renderTotalCostWithMeta = (totalCost: unknown, record?: Record<string, unknown>) => {
  const totalCostText = fmtCurrency(totalCost);
  const breakdown = renderTotalCostBreakdown(record);

  if (!breakdown) {
    return totalCostText;
  }

  return (
    <Space direction="vertical" size={2}>
      <span>{totalCostText}</span>
      {breakdown}
    </Space>
  );
};

export const PROJECT_REPORT_METRIC_OPTIONS = [
  {
    label: '新增用户',
    value: 'newUsers',
    column: { title: '新增用户', dataIndex: 'newUsers', width: 110 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '上报新增用户',
    value: 'reportNewUsers',
    column: { title: '上报新增用户', dataIndex: 'reportNewUsers', width: 120 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '日活用户',
    value: 'dauUsers',
    column: { title: '日活用户', dataIndex: 'dauUsers', width: 110 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '广告收入',
    value: 'adRevenue',
    tooltip: '广告收入（最新广告收入差值）',
    column: {
      title: '广告收入',
      tooltip: '广告收入（最新广告收入差值）',
      dataIndex: 'adRevenue',
      width: 190,
      render: (value: unknown, record: API.ProjectReportItem) => renderRevenueWithMeta(value, record),
    },
    formatter: (value: number, record?: Record<string, unknown>) => fmtRevenueWithDiff(value, record),
  },
  {
    label: '广告请求数',
    value: 'adRequests',
    column: { title: '广告请求数', dataIndex: 'adRequests', width: 120 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '广告匹配请求数',
    value: 'adMatchedRequests',
    column: { title: '广告匹配请求数', dataIndex: 'adMatchedRequests', width: 140 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '广告展示数',
    value: 'adImpressions',
    column: { title: '广告展示数', dataIndex: 'adImpressions', width: 120 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '人均展示',
    value: 'impressionsPerUser',
    column: { title: '人均展示', dataIndex: 'impressionsPerUser', width: 110, render: fmtFixed2 },
    formatter: (value: unknown) => fmtFixed2(value),
  },
  {
    label: '广告点击数',
    value: 'adClicks',
    column: { title: '广告点击数', dataIndex: 'adClicks', width: 120 },
    formatter: (value: number) => fmtInt(value),
  },
  {
    label: '广告 eCPM',
    value: 'adEcpm',
    column: { title: '广告 eCPM', dataIndex: 'adEcpm', width: 110, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: 'ARPU',
    value: 'arpu',
    column: { title: 'ARPU', dataIndex: 'arpu', width: 110, render: fmtCurrency },
    formatter: (value: unknown) => fmtCurrency(value),
  },
  {
    label: '广告 CTR',
    value: 'adCtr',
    column: { title: '广告 CTR', dataIndex: 'adCtr', width: 100, render: fmtPercent },
    formatter: (value: number) => fmtPercent(value),
  },
  {
    label: '广告匹配率',
    value: 'adMatchRate',
    column: { title: '广告匹配率', dataIndex: 'adMatchRate', width: 110, render: fmtPercent },
    formatter: (value: number) => fmtPercent(value),
  },
  {
    label: '广告展示率',
    value: 'adShowRate',
    column: { title: '广告展示率', dataIndex: 'adShowRate', width: 110, render: fmtPercent },
    formatter: (value: number) => fmtPercent(value),
  },
  {
    label: '投放支出',
    value: 'adSpendCost',
    column: { title: '投放支出', dataIndex: 'adSpendCost', width: 110, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: '投放 CPI',
    value: 'adSpendCpi',
    column: { title: '投放 CPI', dataIndex: 'adSpendCpi', width: 100, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: '投放 CPC',
    value: 'adSpendCpc',
    column: { title: '投放 CPC', dataIndex: 'adSpendCpc', width: 100, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: '投放 CPM',
    value: 'adSpendCpm',
    column: { title: '投放 CPM', dataIndex: 'adSpendCpm', width: 100, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: '总支出',
    value: 'totalCost',
    tooltip: '总支出（投放支出 / 流量支出）',
    column: {
      title: '总支出',
      tooltip: '总支出（投放支出 / 流量支出）',
      dataIndex: 'totalCost',
      width: 160,
      render: (value: unknown, record: API.ProjectReportItem) => renderTotalCostWithMeta(value, record),
    },
    formatter: (value: unknown) => fmtCurrency(value),
  },
  {
    label: '流量使用量',
    value: 'trafficUsageMb',
    column: { title: '流量使用量', dataIndex: 'trafficUsageMb', width: 130, render: fmtTraffic },
    formatter: (value: number) => fmtTraffic(value),
  },
  {
    label: '流量费用',
    value: 'trafficCost',
    tooltip: '流量费用（流量花费占比）',
    column: {
      title: '流量费用',
      tooltip: '流量费用（流量花费占比）',
      dataIndex: 'trafficCost',
      width: 150,
      render: (value: unknown, record: API.ProjectReportItem) => fmtTrafficCostWithRatio(value, record),
    },
    formatter: (value: number, record?: Record<string, unknown>) => fmtTrafficCostWithRatio(value, record),
  },
  {
    label: '利润',
    value: 'profit',
    column: { title: '利润', dataIndex: 'profit', width: 100, render: fmtCurrency },
    formatter: (value: number) => fmtCurrency(value),
  },
  {
    label: 'ROI',
    value: 'roi',
    column: { title: 'ROI', dataIndex: 'roi', width: 100, render: fmtRoiPercent },
    formatter: (value: number) => fmtRoiPercent(value),
  },
  {
    label: '更新时间',
    value: 'updatedAt',
    column: {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      render: (value: unknown) => (value ? String(value) : '--'),
    },
    formatter: (value: number) => String(value),
  },
];

const adRevenueMetricOption = PROJECT_REPORT_METRIC_OPTIONS.find(
  (item) => item.value === 'adRevenue',
) as
  | {
      tooltip?: React.ReactNode;
      column?: Record<string, unknown>;
    }
  | undefined;
const adRevenueTooltipContent = (
  <div>
    <div>广告收入（最新广告收入差值）</div>
    <div>占比条为国家收益占比，US默认蓝色展示</div>
  </div>
);

if (adRevenueMetricOption) {
  adRevenueMetricOption.tooltip = adRevenueTooltipContent;
  if (adRevenueMetricOption.column && typeof adRevenueMetricOption.column === 'object') {
    adRevenueMetricOption.column.tooltip = adRevenueTooltipContent;
  }
}

export const renderProjectCodeWithMeta = (
  projectCode: unknown,
  record: API.ProjectReportItem,
  onJump?: (projectCode: string, record: API.ProjectReportItem) => void,
) => {
  const codeText = projectCode ? String(projectCode) : '--';
  const isLimitTagMeta = getIsLimitTagMeta(record.isLimited);
  const hourlyStatusMessages = getHourlyStatusMessages(record.hourly_status);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
      {projectCode && onJump ? (
        <a
          onClick={(event) => {
            event.preventDefault();
            onJump(String(projectCode), record);
          }}
          style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {codeText}
        </a>
      ) : (
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{codeText}</span>
      )}
      {isLimitTagMeta ? (
        <Tag color={isLimitTagMeta.color} style={{ marginInlineEnd: 0 }}>
          {isLimitTagMeta.label}
        </Tag>
      ) : null}
      {hourlyStatusMessages.length ? (
        <Tooltip title={hourlyStatusMessages.join('、')}>
          <Tag color="orange" style={{ marginInlineEnd: 0 }}>
            异常
          </Tag>
        </Tooltip>
      ) : null}
    </span>
  );
};

export const createProjectDimensionOptions = ({
  onJump,
  includeHour = false,
}: {
  onJump?: (projectCode: string, record: API.ProjectReportItem) => void;
  includeHour?: boolean;
}) => {
  const baseDimensions = [
    {
      label: '日期',
      value: 'reportDate',
      column: { title: '日期', dataIndex: 'reportDate', width: 120 },
    },
    ...(includeHour
      ? [
          {
            label: '小时',
            value: 'hour',
            column: { title: '小时', dataIndex: 'hour', width: 90, render: (value: unknown) => fmtReportHour(value) },
          },
        ]
      : []),
    {
      label: '项目编码',
      value: 'projectCode',
      column: {
        title: '项目编码',
        dataIndex: 'projectCode',
        width: 180,
        render: (value: unknown, record: API.ProjectReportItem) => renderProjectCodeWithMeta(value, record, onJump),
      },
    },
    {
      label: '国家',
      value: 'country',
      column: { title: '国家', dataIndex: 'country', width: 100, render: (value: string) => fmtCountry(value) },
    },
    {
      label: '应用平台',
      value: APP_PLATFORM_DISPLAY_DIMENSION,
      disabledTooltip: '需先选择项目编码',
      isDisabled: (dimensions: string[]) => !dimensions.includes('projectCode'),
      column: {
        title: '应用平台',
        key: APP_PLATFORM_DISPLAY_DIMENSION,
        width: 110,
        render: (_: unknown, record: API.ProjectReportItem) => {
          const label = getAppPlatformLabel(typeof record.appPlatform === 'string' ? record.appPlatform : undefined);
          if (!label) return '--';
          return (
            <Tag color={getAppPlatformColor(record.appPlatform)} style={{ marginInlineEnd: 0 }}>
              {label}
            </Tag>
          );
        },
      },
    },
    {
      label: '投放状态',
      value: AD_STATUS_DISPLAY_DIMENSION,
      disabledTooltip: '需先选择项目编码',
      isDisabled: (dimensions: string[]) => !dimensions.includes('projectCode'),
      column: {
        title: '投放状态',
        key: AD_STATUS_DISPLAY_DIMENSION,
        width: 130,
        render: (_: unknown, record: API.ProjectReportItem) => {
          const adStatus = typeof record.adStatus === 'string' ? record.adStatus : undefined;
          const label = getAdStatusLabel(adStatus);
          if (!label) return '--';
          return (
            <Tag color={getAdStatusColor(adStatus)} style={{ marginInlineEnd: 0 }}>
              {label}
            </Tag>
          );
        },
      },
    },
    {
      label: '閮ㄩ棬',
      value: DEPARTMENT_DISPLAY_DIMENSION,
      disabledTooltip: '闇€鍏堥€夋嫨椤圭洰缂栫爜',
      isDisabled: (dimensions: string[]) => !dimensions.includes('projectCode'),
      column: {
        title: '閮ㄩ棬',
        key: DEPARTMENT_DISPLAY_DIMENSION,
        width: 140,
        render: (_: unknown, record: API.ProjectReportItem) => {
          const department = typeof record.department === 'string' ? record.department.trim() : '';
          return department || '--';
        },
      },
    },
  ];

  return baseDimensions;
};

export const toOrderDirection = (order?: SortOrder) => {
  if (order === 'ascend') return 'asc' as const;
  if (order === 'descend') return 'desc' as const;
  return undefined;
};

export const normalizeCountries = (countries?: string[]) => {
  if (!Array.isArray(countries) || !countries.length) return undefined;
  const normalized = countries.map((item) => item.trim().toUpperCase()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

export const normalizeProjectCodes = (projectCodes?: string[]) => {
  if (!Array.isArray(projectCodes) || !projectCodes.length) return undefined;
  const normalized = projectCodes.map((item) => item.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

export const normalizeAdStatuses = (adStatuses?: string[]) => {
  if (!Array.isArray(adStatuses) || !adStatuses.length) return undefined;
  const normalized = adStatuses.map((item) => item.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

export const normalizeAppPlatforms = (appPlatforms?: string[]) => {
  if (!Array.isArray(appPlatforms) || !appPlatforms.length) return undefined;
  const normalized = appPlatforms.map((item) => `${item}`.trim().toUpperCase()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

export const normalizeDepartments = (departments?: string[]) => {
  if (!Array.isArray(departments) || !departments.length) return undefined;
  const normalized = departments.map((item) => `${item}`.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};
