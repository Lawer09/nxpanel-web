
import { request } from '@umijs/max';

export async function fetchPerformance(
  params: API.PerformanceFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.PerformanceRecord>>>('/performance/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformanceNodeStats(
  params: { days?: number; nodeId?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceNodeStatsData>>('/performance/nodeStats', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformanceTrend(
  params: { nodeId: number; days?: number; granularity?: 'hour' | 'day' },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceTrendData>>('/performance/trend', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformanceGeoDistribution(
  params: { days?: number; nodeId?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceGeoData>>('/performance/geoDistribution', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformancePlatformStats(
  params: { days?: number; nodeId?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformancePlatformData>>('/performance/platformStats', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// ── 聚合性能数据 (5分钟粒度) ──────────────────────────────────────────────

export async function getAggregatedPerformance(
  params: API.AggregatedPerformanceParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.AggregatedPerformanceItem>>>(
    '/v3/performance/aggregated',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 用户上报次数 (5分钟粒度) ──────────────────────────────────────────────

export async function getUserReportCount(
  params: API.UserReportCountParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.UserReportCountItem>>>(
    '/v3/performance/userReportCount',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 用户上报次数汇总 (按天) ───────────────────────────────────────────────

export async function getUserReportDaily(
  params: API.UserReportDailyParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.UserReportDailyItem>>>(
    '/v3/performance/userReportDaily',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 用户留存分析 ─────────────────────────────────────────────────────────────

export async function getRetention(
  params: API.RetentionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.RetentionData>>(
    '/v3/performance/retention',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 活跃用户趋势 ─────────────────────────────────────────────────────────────

export async function getActiveUsers(
  params: API.ActiveUsersParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ActiveUsersTrendData>>(
    '/v3/performance/activeUsers',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 活跃用户概览 ─────────────────────────────────────────────────────────────

export async function getActiveUsersSummary(
  params: API.ActiveUsersSummaryParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ActiveUsersSummaryData>>(
    '/v3/performance/activeUsersSummary',
    { method: 'GET', params, ...(options || {}) },
  );
}
