import { request } from '@umijs/max';

export async function fetchPerformance(
  params: API.PerformanceFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageData<API.PerformanceRecord>>>('/performance/fetch', {
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
