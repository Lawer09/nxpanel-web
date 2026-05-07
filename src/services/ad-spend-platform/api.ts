import { request } from '@umijs/max';

// ── 投放平台账号 ───────────────────────────────────────────────────────────────

export async function getAdSpendAccounts(params?: API.AdSpendAccountQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdSpendAccountItem>>>(
    '/v3/ad-spend-platform/accounts',
    { method: 'GET', params },
  );
}

export async function getAdSpendAccountDetail(id: number) {
  return request<API.ApiResponse<API.AdSpendAccountDetail>>(
    `/v3/ad-spend-platform/accounts/${id}`,
    { method: 'GET' },
  );
}

export async function createAdSpendAccount(data: API.AdSpendAccountCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/ad-spend-platform/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateAdSpendAccount(id: number, data: API.AdSpendAccountUpdateParams) {
  return request<API.ApiResponse<boolean>>(`/v3/ad-spend-platform/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleAdSpendAccountStatus(id: number, enabled: number) {
  return request<API.ApiResponse<boolean>>(`/v3/ad-spend-platform/accounts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { enabled },
  });
}

export async function testAdSpendAccount(id: number) {
  return request<API.ApiResponse<API.AdSpendAccountTestResult>>(
    `/v3/ad-spend-platform/accounts/${id}/test`,
    { method: 'POST' },
  );
}

// ── 投放同步 ─────────────────────────────────────────────────────────────────

export async function triggerAdSpendSync(data: API.AdSpendSyncParams) {
  return request<API.ApiResponse<{ jobId: number }>>('/v3/ad-spend-platform/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function getAdSpendSyncJobs(params?: API.AdSpendSyncJobQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdSpendSyncJobItem>>>(
    '/v3/ad-spend-platform/sync-jobs',
    { method: 'GET', params },
  );
}

export async function getAdSpendSyncJobDetail(id: number) {
  return request<API.ApiResponse<API.AdSpendSyncJobDetail>>(
    `/v3/ad-spend-platform/sync-jobs/${id}`,
    { method: 'GET' },
  );
}

// ── 投放报表 ─────────────────────────────────────────────────────────────────

export async function getAdSpendDaily(params: API.AdSpendDailyQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdSpendDailyItem>>>(
    '/v3/ad-spend-platform/reports/daily',
    {
      method: 'GET',
      params,
      paramsSerializer: (query) => {
        const searchParams = new URLSearchParams();
        const appendArray = (key: string, values?: Array<string | number>) => {
          if (!Array.isArray(values)) return;
          values.forEach((v) => {
            if (v !== undefined && v !== null && `${v}` !== '') {
              searchParams.append(key, `${v}`);
            }
          });
        };

        if (query.dateFrom) searchParams.append('dateFrom', `${query.dateFrom}`);
        if (query.dateTo) searchParams.append('dateTo', `${query.dateTo}`);
        if (query.page !== undefined) searchParams.append('page', `${query.page}`);
        if (query.pageSize !== undefined) searchParams.append('pageSize', `${query.pageSize}`);

        appendArray('groupBy[]', query.groupBy);
        appendArray('filters.platformCodes[]', query.filters?.platformCodes);
        appendArray('filters.accountIds[]', query.filters?.accountIds);
        appendArray('filters.projectCodes[]', query.filters?.projectCodes);
        appendArray('filters.countries[]', query.filters?.countries);

        return searchParams.toString();
      },
    },
  );
}

export async function getAdSpendSummary(params: API.AdSpendSummaryQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdSpendSummaryItem[]>>>(
    '/v3/ad-spend-platform/reports/summary',
    { method: 'GET', params },
  );
}

export async function getAdSpendTrend(params: API.AdSpendTrendQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdSpendTrendItem[]>>>(
    '/v3/ad-spend-platform/reports/trend',
    { method: 'GET', params },
  );
}

export async function getAdSpendProjectCodes(params?: {
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<API.ApiResponse<API.AdSpendProjectCodeItem[]>>(
    '/v3/ad-spend-platform/project-codes',
    { method: 'GET', params },
  );
}
