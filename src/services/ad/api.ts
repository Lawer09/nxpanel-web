import { request } from '@umijs/max';

// ── 广告账号 ──────────────────────────────────────────────────────────────────

export async function getAdAccounts(params?: API.AdAccountQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdAccount>>>('/v3/ad-accounts', {
    method: 'GET',
    params,
  });
}

export async function createAdAccount(data: API.AdAccountUpsertRequest) {
  return request<API.ApiResponse<API.AdAccount>>('/v3/ad-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateAdAccount(id: number, data: API.AdAccountUpsertRequest) {
  return request<API.ApiResponse<API.AdAccount>>(`/v3/ad-accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleAdAccountStatus(id: number, status: string) {
  return request<API.ApiResponse<boolean>>(`/v3/ad-accounts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { status },
  });
}

export async function testAdAccountCredential(id: number) {
  return request<API.ApiResponse<boolean>>(`/v3/ad-accounts/${id}/test-credential`, {
    method: 'POST',
  });
}

// ── 批量分配 ──────────────────────────────────────────────────────────────────

export async function batchAssignServer(data: API.BatchAssignServerRequest) {
  return request<API.ApiResponse<boolean>>('/v3/ad-accounts/batch-assign-server', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

// ── 项目映射 ──────────────────────────────────────────────────────────────────

export async function getProjectMappings(params?: API.ProjectMappingQuery) {
  return request<API.ApiResponse<API.PageResult<API.ProjectMapping>>>('/v3/project-app-mappings', {
    method: 'GET',
    params,
  });
}

export async function createProjectMapping(data: API.ProjectMappingUpsertRequest) {
  return request<API.ApiResponse<API.ProjectMapping>>('/v3/project-app-mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateProjectMapping(id: number, data: API.ProjectMappingUpsertRequest) {
  return request<API.ApiResponse<API.ProjectMapping>>(`/v3/project-app-mappings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleProjectMappingStatus(id: number, status: string) {
  return request<API.ApiResponse<boolean>>(`/v3/project-app-mappings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { status },
  });
}

// ── 同步服务器 ────────────────────────────────────────────────────────────────

export async function getSyncServers() {
  return request<API.ApiResponse<API.PageResult<API.SyncServer>>>('/v3/sync-servers', {
    method: 'GET',
  });
}

export async function createSyncServer(data: API.SyncServerCreateRequest) {
  return request<API.ApiResponse<API.SyncServer>>('/v3/sync-servers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateSyncServer(serverId: string, data: API.SyncServerCreateRequest) {
  return request<API.ApiResponse<API.SyncServer>>(`/v3/sync-servers/${serverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function toggleSyncServerStatus(serverId: string, status: string) {
  return request<API.ApiResponse<boolean>>(`/v3/sync-servers/${serverId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { status },
  });
}

export async function testSyncServer(serverId: string) {
  return request<API.ApiResponse<API.TestSyncResult>>(`/v3/sync-servers/${serverId}/test-sync`, {
    method: 'POST',
  });
}

// ── 同步监控 ──────────────────────────────────────────────────────────────────

export async function getSyncStates(params?: API.SyncStateQuery) {
  return request<API.ApiResponse<API.PageResult<API.SyncState>>>('/v3/sync-states', {
    method: 'GET',
    params,
  });
}

export async function getSyncLogs(params?: API.SyncLogQuery) {
  return request<API.ApiResponse<API.PageResult<API.SyncLog>>>('/v3/sync-logs', {
    method: 'GET',
    params,
  });
}

export async function triggerSyncJob(data: API.SyncTriggerRequest) {
  return request<API.ApiResponse<boolean>>('/v3/sync-jobs/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

// ── 广告收益报表 ──────────────────────────────────────────────────────────────

export async function getAdRevenueFetch(params?: API.AdRevenueQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdRevenueItem>>>('/v3/ad-revenue/fetch', {
    method: 'GET',
    params,
  });
}

export async function postAdRevenueAggregate(data: API.AdRevenueAggregateRequest) {
  return request<API.ApiResponse<API.PageResult<API.AdRevenueItem>>>('/v3/ad-revenue/aggregate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function getAdRevenueTrend(params?: API.AdRevenueTrendQuery) {
  return request<API.ApiResponse<API.AdRevenueTrendResponse>>('/v3/ad-revenue/trend', {
    method: 'GET',
    params,
  });
}

export async function getAdRevenueSummary(params?: API.AdRevenueQuery) {
  return request<API.ApiResponse<API.AdRevenueSummary>>('/v3/ad-revenue/summary', {
    method: 'GET',
    params,
  });
}

export async function postAdRevenueTopRank(data: API.AdRevenueTopRankRequest) {
  return request<API.ApiResponse<API.PageResult<API.AdRevenueItem>>>('/v3/ad-revenue/top-rank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function getAdRevenueApps(params?: API.AdRevenueAppQuery) {
  return request<API.ApiResponse<API.PageResult<API.AdRevenueAppItem>>>('/v3/ad-revenue/apps', {
    method: 'GET',
    params,
  });
}
