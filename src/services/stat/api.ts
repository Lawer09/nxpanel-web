import { request } from '@umijs/max';

// ── 统计 ─────────────────────────────────────────────────────────────────────

export async function getStatUser(
  params: { user_id: number; pageSize?: number; page?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.StatUserPageData>>('/v3/stat/getStatUser', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getTrafficRank(
  params: { type: 'user' | 'node'; start_time?: number; end_time?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.TrafficRankData>>('/v3/stat/getTrafficRank', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getUserConsumptionRank(
  params: {
    type: 'user_consumption_rank';
    start_time?: number;
    end_time?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserConsumptionRankData>>('/v3/stat/getRanking', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getServerTrafficRank(
  params: {
    type: 'server_traffic_rank';
    start_time?: number;
    end_time?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ServerTrafficRankData>>('/v3/stat/getRanking', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getServerLastRank(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ServerRankData>>('/v3/stat/getServerLastRank', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getServerYesterdayRank(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ServerRankData>>('/v3/stat/getServerYesterdayRank', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getStatServer(
  params: {
    server_id?: number;
    start_time?: number;
    end_time?: number;
    page?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.StatServerPageData>>('/v3/stat/getStatServer', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getStatServerDetail(
  params: {
    server_id?: number;
    start_time?: number;
    end_time?: number;
    granularity?: 'minute' | 'hour' | 'day';
    page?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.StatServerDetailPageData>>('/v3/stat/getStatServerDetail', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getOverride(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.StatOverviewData>>('/v3/stat/getOverride', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.StatOverviewData>>('/v3/stat/getStats', {
    method: 'GET',
    ...(options || {}),
  });
}

// ── App 流量报表 ─────────────────────────────────────────────────────────────

export async function getAppTrafficByAppId(
  params: API.AppTrafficByAppIdParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppTrafficPageData<API.AppTrafficByAppIdItem>>>(
    '/v3/stat/appTraffic/byAppId',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getAppTrafficByVersion(
  params: API.AppTrafficByVersionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppTrafficPageData<API.AppTrafficByVersionItem>>>(
    '/v3/stat/appTraffic/byVersion',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getAppTrafficTrend(
  params: API.AppTrafficTrendParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ list: API.AppTrafficTrendItem[] }>>(
    '/v3/stat/appTraffic/trend',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getAppTrafficSummary(
  params: API.AppTrafficSummaryParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppTrafficSummaryData>>(
    '/v3/stat/appTraffic/summary',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getAppTrafficAggregate(
  data: API.AppTrafficAggregateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppTrafficPageData<API.AppTrafficAggregateItem>>>(
    '/v3/stat/appTraffic/aggregate',
    { method: 'POST', data, ...(options || {}) },
  );
}
