
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
  params: { days?: number; node_id?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceNodeStatsData>>('/performance/nodeStats', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformanceTrend(
  params: { node_id: number; days?: number; granularity?: 'hour' | 'day' },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceTrendData>>('/performance/trend', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformanceGeoDistribution(
  params: { days?: number; node_id?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PerformanceGeoData>>('/performance/geoDistribution', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getPerformancePlatformStats(
  params: { days?: number; node_id?: number },
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

// ── 版本分布 ─────────────────────────────────────────────────────────────────

export async function getVersionDistribution(
  params: API.DistributionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.VersionDistributionItem[]>>(
    '/performance/versionDistribution',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 平台分布 ─────────────────────────────────────────────────────────────────

export async function getPlatformDistribution(
  params: API.DistributionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PlatformDistributionItem[]>>(
    '/performance/platformDistribution',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 国家/ISP 分布 ────────────────────────────────────────────────────────────

export async function getCountryDistribution(
  params: API.DistributionParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.CountryDistributionItem[]>>(
    '/performance/countryDistribution',
    { method: 'GET', params, ...(options || {}) },
  );
}

// ── 失败节点聚合 ─────────────────────────────────────────────────────────────

export async function getFailedNodes(
  params: API.FailedNodesParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.FailedNodesItem[]>>(
    '/v3/performance/failedNodes',
    { method: 'GET', params, ...(options || {}) },
  );
}
