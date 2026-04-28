import { request } from '@umijs/max';

export async function triggerProjectAggregates(data: API.ProjectAggregatesAggregateRequest) {
  return request<API.ApiResponse<API.ProjectAggregatesAggregateResult>>(
    '/v3/project-aggregates/aggregate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function triggerProjectAggregatesAsync(data: API.ProjectAggregatesAggregateRequest) {
  return request<API.ApiResponse<API.ProjectAggregatesAggregateAsyncResult>>(
    '/v3/project-aggregates/aggregate-async',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function getProjectAggregatesDaily(params: API.ProjectAggregatesDailyQuery) {
  return request<API.ApiResponse<{ list: API.ProjectAggregatesDailyItem[]; total: number; page: number; pageSize: number }>>(
    '/v3/project-aggregates/daily',
    { method: 'GET', params },
  );
}

export async function getProjectAggregatesSummary(params: API.ProjectAggregatesSummaryQuery) {
  return request<API.ApiResponse<API.ProjectAggregatesSummaryItem[]>>(
    '/v3/project-aggregates/summary',
    { method: 'GET', params },
  );
}

export async function getProjectAggregatesTrend(params: API.ProjectAggregatesTrendQuery) {
  return request<API.ApiResponse<API.ProjectAggregatesTrendItem[]>>(
    '/v3/project-aggregates/trend',
    { method: 'GET', params },
  );
}
