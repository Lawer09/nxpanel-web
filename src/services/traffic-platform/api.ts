import { request } from '@umijs/max';

// ── 平台 ──────────────────────────────────────────────────────────────────────

export async function getTrafficPlatforms(params?: API.TrafficPlatformQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficPlatformItem>>>(
    '/v3/traffic-platform/platforms',
    { method: 'GET', params },
  );
}

export async function createTrafficPlatform(data: API.TrafficPlatformCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/traffic-platform/platforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateTrafficPlatform(id: number, data: API.TrafficPlatformUpdateParams) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/platforms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleTrafficPlatformStatus(id: number, enabled: number) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/platforms/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { enabled },
  });
}

// ── 平台账号 ──────────────────────────────────────────────────────────────────

export async function getTrafficAccounts(params?: API.TrafficAccountQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficAccountItem>>>(
    '/v3/traffic-platform/accounts',
    { method: 'GET', params },
  );
}

export async function getTrafficAccountDetail(id: number) {
  return request<API.ApiResponse<API.TrafficAccountDetail>>(
    `/v3/traffic-platform/accounts/${id}`,
    { method: 'GET' },
  );
}

export async function createTrafficAccount(data: API.TrafficAccountCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/traffic-platform/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateTrafficAccount(id: number, data: API.TrafficAccountUpdateParams) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleTrafficAccountStatus(id: number, enabled: number) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/accounts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { enabled },
  });
}

export async function testTrafficAccount(id: number) {
  return request<API.ApiResponse<API.TrafficAccountTestResult>>(
    `/v3/traffic-platform/accounts/${id}/test`,
    { method: 'POST' },
  );
}

// ── 流量查询 ──────────────────────────────────────────────────────────────────

export async function getTrafficHourly(params: API.TrafficHourlyQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficHourlyItem>>>(
    '/v3/traffic-platform/usages/hourly',
    { method: 'GET', params },
  );
}

export async function getTrafficDaily(params: API.TrafficDailyQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficDailyItem>>>(
    '/v3/traffic-platform/usages/daily',
    { method: 'GET', params },
  );
}

export async function getTrafficMonthly(params: API.TrafficMonthlyQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficMonthlyItem>>>(
    '/v3/traffic-platform/usages/monthly',
    { method: 'GET', params },
  );
}

export async function getTrafficTrend(params: API.TrafficTrendQuery) {
  return request<API.ApiResponse<API.TrafficTrendItem[]>>(
    '/v3/traffic-platform/usages/trend',
    { method: 'GET', params },
  );
}

export async function getTrafficRanking(params: API.TrafficRankingQuery) {
  return request<API.ApiResponse<API.TrafficRankingItem[]>>(
    '/v3/traffic-platform/usages/ranking',
    { method: 'GET', params },
  );
}

// ── 同步 ──────────────────────────────────────────────────────────────────────

export async function triggerTrafficSync(data: API.TrafficSyncParams) {
  return request<API.ApiResponse<{ jobId: number }>>('/v3/traffic-platform/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function getTrafficSyncJobs(params?: API.TrafficSyncJobQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficSyncJobItem>>>(
    '/v3/traffic-platform/sync-jobs',
    { method: 'GET', params },
  );
}

export async function getTrafficSyncJobDetail(id: number) {
  return request<API.ApiResponse<API.TrafficSyncJobDetail>>(
    `/v3/traffic-platform/sync-jobs/${id}`,
    { method: 'GET' },
  );
}
