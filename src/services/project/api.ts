import { request } from '@umijs/max';

// ── 项目 ──────────────────────────────────────────────────────────────────────

export async function getProjects(params?: API.ProjectQuery) {
  return request<API.ApiResponse<API.PageResult<API.ProjectItem>>>(
    '/v3/projects',
    { method: 'GET', params },
  );
}

export async function getProjectDetail(id: number) {
  return request<API.ApiResponse<API.ProjectItem>>(
    `/v3/projects/${id}`,
    { method: 'GET' },
  );
}

export async function createProject(data: API.ProjectCreateParams) {
  return request<API.ApiResponse<{ id: number }>>('/v3/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateProject(id: number, data: API.ProjectUpdateParams) {
  return request<API.ApiResponse<boolean>>(`/v3/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateProjectStatus(id: number, status: string) {
  return request<API.ApiResponse<boolean>>(`/v3/projects/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { status },
  });
}

// ── 项目关联流量账号 ──────────────────────────────────────────────────────────────

export async function getProjectTrafficAccounts(
  projectId: number,
  params?: API.ProjectTrafficAccountQuery,
) {
  return request<API.ApiResponse<{ data: API.ProjectTrafficAccountItem[] }>>(
    `/v3/projects/${projectId}/traffic-accounts`,
    { method: 'GET', params },
  );
}

export async function createProjectTrafficAccount(
  projectId: number,
  data: API.ProjectTrafficAccountCreateParams,
) {
  return request<API.ApiResponse<{ id: number }>>(
    `/v3/projects/${projectId}/traffic-accounts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function updateProjectTrafficAccount(
  projectId: number,
  relationId: number,
  data: API.ProjectTrafficAccountUpdateParams,
) {
  return request<API.ApiResponse<boolean>>(
    `/v3/projects/${projectId}/traffic-accounts/${relationId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function deleteProjectTrafficAccount(projectId: number, relationId: number) {
  return request<API.ApiResponse<boolean>>(
    `/v3/projects/${projectId}/traffic-accounts/${relationId}`,
    { method: 'DELETE' },
  );
}

// ── 项目关联广告账号 ──────────────────────────────────────────────────────────────

export async function getProjectAdAccounts(
  projectId: number,
  params?: API.ProjectAdAccountQuery,
) {
  return request<API.ApiResponse<{ data: API.ProjectAdAccountItem[] }>>(
    `/v3/projects/${projectId}/ad-accounts`,
    { method: 'GET', params },
  );
}

export async function createProjectAdAccount(
  projectId: number,
  data: API.ProjectAdAccountCreateParams,
) {
  return request<API.ApiResponse<{ id: number }>>(
    `/v3/projects/${projectId}/ad-accounts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function updateProjectAdAccount(
  projectId: number,
  relationId: number,
  data: API.ProjectAdAccountUpdateParams,
) {
  return request<API.ApiResponse<boolean>>(
    `/v3/projects/${projectId}/ad-accounts/${relationId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      data,
    },
  );
}

export async function deleteProjectAdAccount(projectId: number, relationId: number) {
  return request<API.ApiResponse<boolean>>(
    `/v3/projects/${projectId}/ad-accounts/${relationId}`,
    { method: 'DELETE' },
  );
}

// ── 项目投放 ────────────────────────────────────────────────────────────────

export async function getProjectAdSpendSummary(
  projectCode: string,
  params: API.ProjectAdSpendSummaryQuery,
) {
  return request<API.ApiResponse<API.ProjectAdSpendSummaryItem>>(
    `/v3/projects/${projectCode}/ad-spend-summary`,
    { method: 'GET', params },
  );
}

export async function getProjectAdSpendTrend(
  projectCode: string,
  params: API.ProjectAdSpendTrendQuery,
) {
  return request<API.ApiResponse<API.ProjectAdSpendTrendItem[]>>(
    `/v3/projects/${projectCode}/ad-spend-trend`,
    { method: 'GET', params },
  );
}

export async function getProjectAdSpendDaily(
  projectCode: string,
  params: API.ProjectAdSpendDailyQuery,
) {
  return request<API.ApiResponse<API.PageResult<API.ProjectAdSpendDailyItem>>>(
    `/v3/projects/${projectCode}/ad-spend-daily`,
    { method: 'GET', params },
  );
}
