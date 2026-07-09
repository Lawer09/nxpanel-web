import { request } from '@umijs/max';

// ── 平台 ──────────────────────────────────────────────────────────────────────

export async function getTrafficPlatforms(params?: API.TrafficPlatformQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficPlatformItem>>>(
    '/v3/traffic-platform/platforms',
    { method: 'GET', params },
  );
}

export async function createTrafficPlatform(data: API.TrafficPlatformCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/traffic-platform/platforms/create', {
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
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/platforms/${id}/update-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { enabled },
  });
}

// ── 平台账号 ──────────────────────────────────────────────────────────────────

export async function getTrafficAccounts(params?: API.TrafficAccountQuery) {
  return request<API.ApiResponse<API.PageResult<API.TrafficAccountItem>>>(
    '/v3/traffic-platform/accounts',
    {
      method: 'GET',
      params,
      paramsSerializer: (query) => {
        const searchParams = new URLSearchParams();
        const appendArray = (key: string, values?: Array<string | number>) => {
          if (!Array.isArray(values)) return;
          values.forEach((value) => {
            if (value !== undefined && value !== null && `${value}` !== '') {
              searchParams.append(key, `${value}`);
            }
          });
        };

        if (query.platformCode) searchParams.append('platformCode', `${query.platformCode}`);
        if (query.enabled !== undefined) searchParams.append('enabled', `${query.enabled}`);
        if (query.keyword) searchParams.append('keyword', `${query.keyword}`);
        if (query.page !== undefined) searchParams.append('page', `${query.page}`);
        if (query.pageSize !== undefined) searchParams.append('pageSize', `${query.pageSize}`);
        appendArray('tags[]', query.tags);

        return searchParams.toString();
      },
    },
  );
}

export async function getTrafficAccountDetail(id: number) {
  return request<API.ApiResponse<API.TrafficAccountDetail>>(
    `/v3/traffic-platform/accounts/detail`,
    { method: 'GET', params: { id } },
  );
}

export async function createTrafficAccount(data: API.TrafficAccountCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/traffic-platform/accounts/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateTrafficAccount(id: number, data: API.TrafficAccountUpdateParams) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/accounts/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data:{ id, ...data },
  });
}

export async function toggleTrafficAccountStatus(id: number, enabled: number) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/accounts/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { id, enabled },
  });
}

export async function updateTrafficAccountTags(data: API.TrafficAccountUpdateTagsParams) {
  return request<API.ApiResponse<boolean>>(`/v3/traffic-platform/accounts/update-tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function batchUpdateTrafficAccountTags(data: API.TrafficAccountBatchUpdateTagsParams) {
  return request<API.ApiResponse<API.TrafficAccountBatchResult>>(
    `/v3/traffic-platform/accounts/batch-update-tags`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function batchDisableTrafficAccounts(data: API.TrafficAccountBatchDisableParams) {
  return request<API.ApiResponse<API.TrafficAccountBatchResult>>(
    `/v3/traffic-platform/accounts/batch-disable`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function testTrafficAccount(id: number) {
  return request<API.ApiResponse<API.TrafficAccountTestResult>>(
    `/v3/traffic-platform/accounts/test`,
    { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { id }
    },
  );
}

export async function createTrafficAllocation(data: API.TrafficAllocationCreateParams) {
  return request<API.ApiResponse<API.TrafficAllocationCreateResult>>(
    '/v3/traffic-platform/traffic-allocations/create',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
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
    `/v3/traffic-platform/sync-jobs/detail`,
    { method: 'GET', params: { id } },
  );
}
