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
  const normalized = adStatus?.trim();
  if (['在投', '放量中'].includes(normalized || '')) return 'green';
  if (['待投放', '测试中', '审核中', '控量中'].includes(normalized || '')) return 'processing';
  if (['暂停', '停投'].includes(normalized || '')) return 'orange';
  if (['已下架', '被拒'].includes(normalized || '')) return 'red';
  if (normalized === '未上线') return 'default';
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

const LIMIT_MATCH_RATE_THRESHOLD = 70;

const getIsLimitTagMeta = (isLimited: unknown, recentRows: RecentHourlyAdMatchRateItem[]) => {
  if (isLimited === true || isLimited === 'true' || isLimited === 1 || isLimited === '1') {
    return { label: '限流', color: 'red' as const };
  }

  const hasRecentLimit = recentRows.some((item) => item.adMatchRate < LIMIT_MATCH_RATE_THRESHOLD);
  if (hasRecentLimit) {
    return { label: '限流', color: 'gold' as const };
  }

  return { label: '限流', color: 'green' as const };
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

export type RecentHourlyAdMatchRateItem = {
  reportDate: string;
  hour: number;
  hourStart?: string;
  adRequests: number | null;
  adMatchedRequests: number | null;
  adMatchRate: number;
};

export const parseRecentHourlyAdMatchRates = (value: unknown): RecentHourlyAdMatchRateItem[] => {
  if (!Array.isArray(value)) return [];

  const normalized: Array<RecentHourlyAdMatchRateItem | null> = value.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const reportDate = typeof record.reportDate === 'string' ? record.reportDate.trim() : '';
    const hour = toSafeNumber(record.hour);
    const adMatchRate = toSafeNumber(record.adMatchRate);
    if (!reportDate || hour === null || adMatchRate === null) return null;

    return {
      reportDate,
      hour: Math.max(0, Math.min(23, Math.floor(hour))),
      hourStart: typeof record.hourStart === 'string' ? record.hourStart.trim() : undefined,
      adRequests: toSafeNumber(record.adRequests),
      adMatchedRequests: toSafeNumber(record.adMatchedRequests),
      adMatchRate,
    };
  });

  return normalized
    .filter((item): item is RecentHourlyAdMatchRateItem => item !== null)
    .sort((a, b) => {
      const aKey = `${a.reportDate} ${String(a.hour).padStart(2, '0')}`;
      const bKey = `${b.reportDate} ${String(b.hour).padStart(2, '0')}`;
      return aKey.localeCompare(bKey);
    });
};

const getRecentHourlyAdMatchRateLabel = (item: RecentHourlyAdMatchRateItem) => {
  return `${item.reportDate.slice(5)} ${String(item.hour).padStart(2, '0')}:00`;
};

export const renderRecentHourlyAdMatchRateChart = (
  rows: RecentHourlyAdMatchRateItem[],
  options?: {
    width?: number;
    height?: number;
    emptyText?: string;
  },
) => {
  const width = options?.width ?? 176;
  const height = options?.height ?? 72;
  const referenceValue = LIMIT_MATCH_RATE_THRESHOLD;

  if (!rows.length) {
    return (
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>最近12小时广告匹配率</span>
          <span>--</span>
        </div>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="最近12小时广告匹配率趋势图"
        >
          <line x1={28} y1={36} x2={168} y2={36} stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" />
          <text x={2} y={40} fontSize="10" fill="#6b7280">
            70%
          </text>
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="11" fill="#9ca3af">
            {options?.emptyText ?? '暂无最近12小时数据'}
          </text>
        </svg>
      </Space>
    );
  }

  const paddingTop = 8;
  const paddingRight = 8;
  const paddingBottom = 14;
  const paddingLeft = 28;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const values = rows.map((item) => item.adMatchRate);
  const minValue = Math.max(0, Math.min(referenceValue, ...values) - 5);
  const maxValue = Math.min(100, Math.max(referenceValue, ...values) + 5);
  const valueRange = Math.max(1, maxValue - minValue);
  const getX = (index: number) =>
    rows.length === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (chartWidth * index) / (rows.length - 1);
  const getY = (value: number) => paddingTop + ((maxValue - value) / valueRange) * chartHeight;
  const linePath = rows
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${getX(index).toFixed(2)} ${getY(item.adMatchRate).toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${getX(rows.length - 1).toFixed(2)} ${(paddingTop + chartHeight).toFixed(
    2,
  )} L ${getX(0).toFixed(2)} ${(paddingTop + chartHeight).toFixed(2)} Z`;
  const referenceY = getY(referenceValue);
  const latest = rows[rows.length - 1];

  return (
    <Space direction="vertical" size={6} style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>最近12小时广告匹配率</span>
        <span>{fmtPercent(latest.adMatchRate)}</span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="最近12小时广告匹配率趋势图">
        <line
          x1={paddingLeft}
          y1={referenceY}
          x2={paddingLeft + chartWidth}
          y2={referenceY}
          stroke="#f97316"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text x={2} y={referenceY + 4} fontSize="10" fill="#6b7280">
          70%
        </text>
        <path d={areaPath} fill="rgba(37, 99, 235, 0.12)" />
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {rows.map((item, index) => {
          const x = getX(index);
          const y = getY(item.adMatchRate);
          return (
            <g key={`${item.reportDate}-${item.hour}`}>
              <circle cx={x} cy={y} r={2} fill="#2563eb" />
              {index === 0 || index === rows.length - 1 ? (
                <text
                  x={x}
                  y={height - 2}
                  textAnchor={index === 0 ? 'start' : 'end'}
                  fontSize="10"
                  fill="#6b7280"
                >
                  {String(item.hour).padStart(2, '0')}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>最新：{getRecentHourlyAdMatchRateLabel(latest)}</div>
        <div>当前请求：{latest.adRequests !== null ? fmtInt(latest.adRequests) : '--'}</div>
        <div>当前匹配：{latest.adMatchedRequests !== null ? fmtInt(latest.adMatchedRequests) : '--'}</div>
      </div>
    </Space>
  );
};

const renderRevenueValue = (adRevenue: unknown, record?: Record<string, unknown>) => {
  const revenueText = fmtCurrency(adRevenue);
  if (revenueText === '--') return revenueText;

  const diffValue = record?.adRevenueDiff;
  const diffText = fmtCurrency(diffValue);
  if (diffText === '--') return revenueText;

  return (
    <Tooltip title={`广告收入差值：${diffText}`}>
      <span>{revenueText}</span>
    </Tooltip>
  );
};

type TopRevenueCountryItem = {
  country: string;
  adRevenue: unknown;
  ratio: unknown;
};

type AdSpendPlatformCompositionItem = {
  platform: string;
  adSpendCost: unknown;
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

const parseAdSpendPlatformComposition = (value: unknown): AdSpendPlatformCompositionItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const platform = typeof record.platform === 'string' ? record.platform.trim() : '';
      if (!platform) return null;
      return {
        platform,
        adSpendCost: record.adSpendCost,
        ratio: record.ratio,
      };
    })
    .filter((item): item is AdSpendPlatformCompositionItem => Boolean(item));
};

const fmtRatioDecimalPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

const fmtDayOverDay = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return null;
  const sign = next > 0 ? '+' : '';
  return `${sign}${(next * 100).toFixed(2)}%`;
};

const renderDayOverDay = (record: Record<string, unknown> | undefined, field: string) => {
  const value = toSafeNumber(record?.[field]);
  const text = fmtDayOverDay(value);
  if (!text) return null;
  const color = value === null || value === 0 ? '#6b7280' : value > 0 ? '#16a34a' : '#dc2626';

  return (
    <span style={{ color, fontSize: 12, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
      ({text})
    </span>
  );
};

const renderMetricWithDayOverDay = (
  mainText: React.ReactNode,
  record: Record<string, unknown> | undefined,
  dayOverDayField: string,
  extra?: React.ReactNode,
) => {
  const dayOverDay = renderDayOverDay(record, dayOverDayField);
  if (!dayOverDay && !extra) return mainText;

  return (
    <Space direction="vertical" size={2}>
      <span>
        {mainText}
        {dayOverDay ? <span style={{ marginLeft: 4 }}>{dayOverDay}</span> : null}
      </span>
      {extra}
    </Space>
  );
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
  const revenueText = renderRevenueValue(adRevenue, record);
  const topRevenueCountries = renderTopRevenueCountries(record);

  return renderMetricWithDayOverDay(revenueText, record, 'adRevenueDayOverDay', topRevenueCountries);
};

const renderAdSpendValue = (adSpendCost: unknown, record?: Record<string, unknown>) => {
  const spendText = fmtCurrency(adSpendCost);
  if (spendText === '--') return spendText;

  const composition = parseAdSpendPlatformComposition(record?.adSpendPlatformComposition);
  if (!composition.length) return spendText;

  return (
    <Tooltip
      title={
        <Space direction="vertical" size={4}>
          {composition.map((item) => (
            <div
              key={`${item.platform}-${String(item.adSpendCost)}-${String(item.ratio)}`}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, minWidth: 240 }}
            >
              <span>{item.platform}</span>
              <span>{fmtCurrency(item.adSpendCost)}</span>
              <span>{fmtRatioDecimalPercent(item.ratio)}</span>
            </div>
          ))}
        </Space>
      }
    >
      <span>{spendText}</span>
    </Tooltip>
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
    tooltip: '广告收入（悬浮数值查看广告收入差值）',
    column: {
      title: '广告收入',
      tooltip: '广告收入（悬浮数值查看广告收入差值）',
      dataIndex: 'adRevenue',
      width: 190,
      render: (value: unknown, record: API.ProjectReportItem) => renderRevenueWithMeta(value, record),
    },
    formatter: (value: number, record?: Record<string, unknown>) =>
      renderMetricWithDayOverDay(renderRevenueValue(value, record), record, 'adRevenueDayOverDay'),
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
    tooltip: '投放支出环比 = (当前投放支出 - 昨日投放支出) / 昨日投放支出',
    column: {
      title: '投放支出',
      tooltip: '投放支出环比 = (当前投放支出 - 昨日投放支出) / 昨日投放支出',
      dataIndex: 'adSpendCost',
      width: 130,
      render: (value: unknown, record: API.ProjectReportItem) =>
        renderMetricWithDayOverDay(renderAdSpendValue(value, record), record, 'adSpendCostDayOverDay'),
    },
    formatter: (value: number, record?: Record<string, unknown>) =>
      renderMetricWithDayOverDay(renderAdSpendValue(value, record), record, 'adSpendCostDayOverDay'),
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
    tooltip: '利润环比 = (当前利润 - 昨日利润) / 昨日利润',
    column: {
      title: '利润',
      tooltip: '利润环比 = (当前利润 - 昨日利润) / 昨日利润',
      dataIndex: 'profit',
      width: 120,
      render: (value: unknown, record: API.ProjectReportItem) =>
        renderMetricWithDayOverDay(fmtCurrency(value), record, 'profitDayOverDay'),
    },
    formatter: (value: number, record?: Record<string, unknown>) =>
      renderMetricWithDayOverDay(fmtCurrency(value), record, 'profitDayOverDay'),
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
    <div>广告收入（悬浮数值查看广告收入差值）</div>
    <div>占比条为国家收益占比，US默认蓝色展示</div>
    <div>环比 = (当前广告收入 - 昨日广告收入) / 昨日广告收入</div>
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
  onLimitTagClick?: (projectCode: string, record: API.ProjectReportItem) => void,
) => {
  const codeText = projectCode ? String(projectCode) : '--';
  const recentHourlyAdMatchRates = parseRecentHourlyAdMatchRates(record.recentHourlyAdMatchRates);
  const isLimitTagMeta = getIsLimitTagMeta(record.isLimited, recentHourlyAdMatchRates);
  const hourlyStatusMessages = getHourlyStatusMessages(record.hourly_status);
  const recentHourlyAdMatchRateChart = renderRecentHourlyAdMatchRateChart(recentHourlyAdMatchRates);
  const limitTooltipContent = <Space direction="vertical" size={6}>{recentHourlyAdMatchRateChart}</Space>;

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
      <Tooltip title={limitTooltipContent}>
        <Tag
          color={isLimitTagMeta.color}
          style={{ marginInlineEnd: 0, cursor: onLimitTagClick && projectCode ? 'pointer' : 'default' }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!projectCode || !onLimitTagClick) return;
            onLimitTagClick(String(projectCode), record);
          }}
        >
          {isLimitTagMeta.label}
        </Tag>
      </Tooltip>
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
  onLimitTagClick,
  includeHour = false,
}: {
  onJump?: (projectCode: string, record: API.ProjectReportItem) => void;
  onLimitTagClick?: (projectCode: string, record: API.ProjectReportItem) => void;
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
        render: (value: unknown, record: API.ProjectReportItem) =>
          renderProjectCodeWithMeta(value, record, onJump, onLimitTagClick),
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
      label: '部门',
      value: DEPARTMENT_DISPLAY_DIMENSION,
      disabledTooltip: '需先选择项目编码',
      isDisabled: (dimensions: string[]) => !dimensions.includes('projectCode'),
      column: {
        title: '部门',
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
