import dayjs, { type Dayjs } from 'dayjs';

export const PROJECT_TREND_DASHBOARD_PATH = '/report/project-trend';

export const DEFAULT_PROJECT_TREND_RANGE_DAYS = 7;
export const DEFAULT_PROJECT_TREND_HOURLY_RANGE_DAYS = 1;

export const toSafeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
};

export const formatInteger = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return Math.round(next).toLocaleString();
};

export const formatDecimal = (value: unknown, digits = 2) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return next.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatCurrency = (value: unknown) => formatDecimal(value, 2);

export const formatPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${next.toFixed(2)}%`;
};

export const formatRoiPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

export const formatTraffic = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  if (next >= 1024) return `${(next / 1024).toFixed(2)} GB`;
  return `${next.toFixed(2)} MB`;
};

export const getTrafficCostRatioPercent = (record?: Record<string, unknown>) => {
  const explicitRatio = toSafeNumber(record?.trafficCostRatio);
  if (explicitRatio !== null) return explicitRatio * 100;

  const trafficCost = toSafeNumber(record?.trafficCost);
  const totalCost = toSafeNumber(record?.totalCost);
  if (trafficCost === null || totalCost === null || totalCost === 0) return null;
  return (trafficCost / totalCost) * 100;
};

export const formatTrafficCostWithRatio = (trafficCost: unknown, record?: Record<string, unknown>) => {
  const costText = formatCurrency(trafficCost);
  if (costText === '--') return costText;

  const ratio = getTrafficCostRatioPercent(record);
  if (ratio === null) return costText;
  return `${costText} (${formatPercent(ratio)})`;
};

export const buildProjectTrendSearch = (params: {
  projectCode: string;
  dateFrom?: string;
  dateTo?: string;
  adStatus?: string;
  granularity?: 'day' | 'hour';
  hourFrom?: number;
  hourTo?: number;
  from?: 'report-project' | 'project-table';
}) => {
  const search = new URLSearchParams();
  search.set('projectCode', params.projectCode);
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  if (params.adStatus) search.set('adStatus', params.adStatus);
  if (params.granularity) search.set('granularity', params.granularity);
  if (typeof params.hourFrom === 'number') search.set('hourFrom', String(params.hourFrom));
  if (typeof params.hourTo === 'number') search.set('hourTo', String(params.hourTo));
  if (params.from) search.set('from', params.from);
  return search.toString();
};

export const resolveProjectTrendDateRange = (dateFrom?: string | null, dateTo?: string | null): [string, string] => {
  const hasDateFrom = Boolean(dateFrom && dayjs(dateFrom).isValid());
  const hasDateTo = Boolean(dateTo && dayjs(dateTo).isValid());

  if (hasDateFrom && hasDateTo) {
    const normalizedDateFrom = dayjs(dateFrom);
    const normalizedDateTo = dayjs(dateTo);
    return [normalizedDateFrom.format('YYYY-MM-DD'), normalizedDateTo.format('YYYY-MM-DD')];
  }

  if (hasDateFrom) {
    const normalizedDate = dayjs(dateFrom);
    const formattedDate = normalizedDate.format('YYYY-MM-DD');
    return [formattedDate, formattedDate];
  }

  if (hasDateTo) {
    const normalizedDate = dayjs(dateTo);
    const formattedDate = normalizedDate.format('YYYY-MM-DD');
    return [formattedDate, formattedDate];
  }

  const end = dayjs();
  const start = end.subtract(DEFAULT_PROJECT_TREND_RANGE_DAYS - 1, 'day');
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
};

export const normalizeCountry = (value?: string | null) => {
  const next = value?.trim().toUpperCase();
  return next || undefined;
};

export const normalizeAdStatus = (value?: string | null) => {
  const next = value?.trim();
  return next || undefined;
};

export const normalizeProjectTrendGranularity = (value?: string | null): 'day' | 'hour' =>
  value === 'hour' ? 'hour' : 'day';

export const getDefaultProjectTrendHourlyDateRange = (): [string, string] => {
  const today = dayjs().format('YYYY-MM-DD');
  return [today, today];
};

export const getDefaultProjectTrendHourlyDateTimeRange = (): [Dayjs, Dayjs] => {
  const today = dayjs();
  return [today.startOf('day'), today.endOf('day')];
};

export const formatProjectTrendHourLabel = (reportDate?: string, hour?: number | null) => {
  if (!reportDate) return '';
  const normalizedHour = typeof hour === 'number' && Number.isFinite(hour) ? hour : 0;
  return dayjs(reportDate).hour(normalizedHour).minute(0).second(0).format('MM-DD HH:00');
};

export const normalizeHourRangeValue = (value?: string | null) => {
  if (value === null || value === undefined || value === '') return undefined;
  const next = Number(value);
  if (!Number.isFinite(next)) return undefined;
  const hour = Math.floor(next);
  if (hour < 0 || hour > 23) return undefined;
  return hour;
};

export const buildProjectTrendHourDateTimeRangeValue = (
  dateRange: [string, string],
  hourFrom?: number,
  hourTo?: number,
): [Dayjs, Dayjs] => {
  const start = dayjs(dateRange[0])
    .hour(typeof hourFrom === 'number' ? hourFrom : 0)
    .minute(0)
    .second(0);
  const end = dayjs(dateRange[1])
    .hour(typeof hourTo === 'number' ? hourTo : 23)
    .minute(59)
    .second(59);
  return [start, end];
};

export const parseProjectTrendHourDateTimeRange = (
  range?: [Dayjs, Dayjs] | null,
): { dateRange: [string, string]; hourFrom?: number; hourTo?: number } | null => {
  const [start, end] = range ?? [];
  if (!start || !end) return null;
  return {
    dateRange: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')],
    hourFrom: start.hour(),
    hourTo: end.hour(),
  };
};
