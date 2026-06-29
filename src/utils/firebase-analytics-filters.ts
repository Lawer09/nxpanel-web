import type { URLSearchParamsInit } from 'react-router-dom';
import dayjs from 'dayjs';
import type {
  FirebaseAnalyticsFilter,
  FirebaseAnalyticsFilterFormValues,
  FirebaseTimeField,
} from '@/services/firebase-analytics/types';

const DEFAULT_TIME_FIELD: FirebaseTimeField = 'received_at';

export const getDefaultFirebaseTimeRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [
  dayjs().subtract(24, 'hour'),
  dayjs(),
];

export const getInitialFirebaseFilters = (
  searchParams: URLSearchParams,
): FirebaseAnalyticsFilterFormValues => {
  const filters: FirebaseAnalyticsFilterFormValues = {};

  searchParams.forEach((value, key) => {
    if (value) {
      filters[key] = value;
    }
  });

  if (filters.start_time && filters.end_time) {
    filters.timeRange = [dayjs(filters.start_time), dayjs(filters.end_time)];
  } else {
    filters.timeRange = getDefaultFirebaseTimeRange();
  }

  if (!filters.time_field) {
    filters.time_field = DEFAULT_TIME_FIELD;
  }

  return filters;
};

export const buildFirebaseApiParams = (
  currentFilters: FirebaseAnalyticsFilterFormValues,
): FirebaseAnalyticsFilter => {
  const { timeRange, ...rest } = currentFilters;
  const params: FirebaseAnalyticsFilter = { ...rest };

  if (timeRange && timeRange.length === 2) {
    params.start_time = dayjs(timeRange[0]).format('YYYY-MM-DD HH:mm:ss');
    params.end_time = dayjs(timeRange[1]).format('YYYY-MM-DD HH:mm:ss');
  }

  if (!params.time_field) {
    params.time_field = DEFAULT_TIME_FIELD;
  }

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      delete params[key];
    }
  });

  return params;
};

export const buildFirebaseSearchParams = (
  currentFilters: FirebaseAnalyticsFilterFormValues,
): URLSearchParamsInit => {
  const params = buildFirebaseApiParams(currentFilters);
  const nextSearchParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nextSearchParams[key] = String(value);
    }
  });

  return nextSearchParams;
};

export const buildFirebaseFiltersFromApiParams = (
  params: FirebaseAnalyticsFilter,
): FirebaseAnalyticsFilterFormValues => {
  const filters: FirebaseAnalyticsFilterFormValues = { ...params };

  if (params.start_time && params.end_time) {
    filters.timeRange = [dayjs(params.start_time), dayjs(params.end_time)];
  }

  if (!filters.time_field) {
    filters.time_field = DEFAULT_TIME_FIELD;
  }

  return filters;
};

export const pickFirebaseApiParams = (
  params: URLSearchParams | Record<string, string | undefined>,
): FirebaseAnalyticsFilter => {
  const source =
    params instanceof URLSearchParams ? Object.fromEntries(params.entries()) : params;

  const picked: FirebaseAnalyticsFilter = {};
  const allowedKeys = [
    'start_time',
    'end_time',
    'time_field',
    'app_id',
    'platform',
    'app_version',
    'user_country',
    'user_region',
    'network_type',
    'isp',
    'asn',
    'event_name',
  ];

  allowedKeys.forEach((key) => {
    const value = source[key];
    if (value) {
      picked[key] = value;
    }
  });

  if (!picked.time_field) {
    picked.time_field = DEFAULT_TIME_FIELD;
  }

  return picked;
};

export const buildFirebasePathSearch = (
  pathname: string,
  filters: FirebaseAnalyticsFilterFormValues | FirebaseAnalyticsFilter,
  extraParams?: Record<string, string | number | undefined>,
) => {
  const baseParams =
    'timeRange' in filters
      ? buildFirebaseSearchParams(filters as FirebaseAnalyticsFilterFormValues)
      : buildFirebaseSearchParams(buildFirebaseFiltersFromApiParams(filters as FirebaseAnalyticsFilter));

  const searchParams = new URLSearchParams(baseParams as Record<string, string>);

  Object.entries(extraParams || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
};

