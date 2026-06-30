import type { ParsedProjectRow, TrendGranularity, TrendPoint, TrendQueryState } from './types';
import { formatProjectTrendHourLabel, toSafeNumber } from './utils';

export const parseProjectRow = (
  record: API.ProjectReportItem,
  granularity: TrendGranularity,
): ParsedProjectRow => {
  const reportDate = typeof record.reportDate === 'string' ? record.reportDate : '';
  const hourValue = toSafeNumber(record.hour);
  const hour = hourValue === null ? undefined : Number(hourValue);

  return {
    reportDate,
    hour,
    timeLabel: granularity === 'hour' ? formatProjectTrendHourLabel(reportDate, hour) : reportDate,
    country: typeof record.country === 'string' ? record.country.toUpperCase() : '--',
    adRevenue: toSafeNumber(record.adRevenue) ?? 0,
    adRevenueNow: toSafeNumber(record.adRevenueNow) ?? 0,
    adRevenueDiff: toSafeNumber(record.adRevenueDiff) ?? 0,
    totalCost: toSafeNumber(record.totalCost) ?? 0,
    profit: toSafeNumber(record.profit) ?? 0,
    newUsers: toSafeNumber(record.newUsers) ?? 0,
    reportNewUsers: toSafeNumber(record.reportNewUsers) ?? 0,
    dauUsers: toSafeNumber(record.dauUsers) ?? 0,
    adRequests: toSafeNumber(record.adRequests) ?? 0,
    adMatchedRequests: toSafeNumber(record.adMatchedRequests) ?? 0,
    adImpressions: toSafeNumber(record.adImpressions) ?? 0,
    adClicks: toSafeNumber(record.adClicks) ?? 0,
    adMatchRate: toSafeNumber(record.adMatchRate) ?? 0,
    adShowRate: toSafeNumber(record.adShowRate) ?? 0,
    adCtr: toSafeNumber(record.adCtr) ?? 0,
    adSpendCost: toSafeNumber(record.adSpendCost) ?? 0,
    trafficCost: toSafeNumber(record.trafficCost) ?? 0,
    trafficCostRatio: toSafeNumber(record.trafficCostRatio) ?? undefined,
    adEcpm: toSafeNumber(record.adEcpm) ?? 0,
    arpu: toSafeNumber(record.arpu) ?? 0,
    roi: toSafeNumber(record.roi) ?? undefined,
  };
};

export const buildTrendSeries = (
  rows: ParsedProjectRow[],
  fields: Array<{ key: keyof ParsedProjectRow; label: string }>,
): TrendPoint[] =>
  rows.flatMap((item) =>
    fields.map((field) => ({
      date: item.timeLabel,
      value: Number(item[field.key] ?? 0),
      series: field.label,
    })),
  );

export const buildProjectDailyTrendQuery = (
  query: TrendQueryState,
  groupBy: API.ProjectReportDimension[],
  extra?: { orderBy?: string; orderDirection?: 'asc' | 'desc' },
): API.ProjectReportQuery => ({
  dateFrom: query.dateRange[0],
  dateTo: query.dateRange[1],
  groupBy: Array.from(new Set<API.ProjectReportDimension>(['projectCode', ...groupBy])),
  filters: {
    projectCodes: [query.projectCode],
  },
  page: 1,
  pageSize: 400,
  orderBy: extra?.orderBy,
  orderDirection: extra?.orderDirection,
});

export const buildProjectHourlyTrendQuery = (
  query: TrendQueryState,
  groupBy: API.ProjectHourlyReportDimension[],
  extra?: { orderBy?: string; orderDirection?: 'asc' | 'desc' },
): API.ProjectHourlyReportQuery => ({
  dateFrom: query.dateRange[0],
  dateTo: query.dateRange[1],
  hourFrom: query.hourFrom,
  hourTo: query.hourTo,
  groupBy: Array.from(new Set<API.ProjectHourlyReportDimension>(['projectCode', ...groupBy])),
  filters: {
    projectCodes: [query.projectCode],
  },
  page: 1,
  pageSize: 400,
  orderBy: extra?.orderBy,
  orderDirection: extra?.orderDirection,
});
