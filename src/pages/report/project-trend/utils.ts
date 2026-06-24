import dayjs from 'dayjs';

export const PROJECT_TREND_DASHBOARD_PATH = '/report/project-trend';

export const DEFAULT_PROJECT_TREND_RANGE_DAYS = 30;

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
  country?: string;
  from?: 'report-project' | 'project-table';
}) => {
  const search = new URLSearchParams();
  search.set('projectCode', params.projectCode);
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  if (params.adStatus) search.set('adStatus', params.adStatus);
  if (params.country) search.set('country', params.country);
  if (params.from) search.set('from', params.from);
  return search.toString();
};

export const resolveProjectTrendDateRange = (dateFrom?: string | null, dateTo?: string | null): [string, string] => {
  const end = dateTo && dayjs(dateTo).isValid() ? dayjs(dateTo) : dayjs();
  const start =
    dateFrom && dayjs(dateFrom).isValid()
      ? dayjs(dateFrom)
      : end.subtract(DEFAULT_PROJECT_TREND_RANGE_DAYS - 1, 'day');
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
