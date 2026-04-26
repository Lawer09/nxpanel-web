import { request } from '@umijs/max';

// ── 节点管理 ─────────────────────────────────────────────────────────────────

export async function getServerNodes(params?: { page?: number; pageSize?: number } & Record<string, any>) {
  return request<API.ApiResponse<API.PageResult<API.ServerNode>>>('/v3/server/manage/getNodes', {
    method: 'GET',
    params,
  });
}

export async function saveServerNode(
  body: API.ServerNodeSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateServerNode(
  body: API.ServerNodeUpdateParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerNode(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/manage/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function copyServerNode(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function sortServerNodes(
  body: API.ServerNodeSortItem[],
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/manage/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function restartServerNode(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/manage/restart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function deployServerNode(
  body: { server_id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ task_id: number; server_id: number; status: API.DeployTaskStatus }>>(
    '/server/manage/deploy',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) },
  );
}

export async function batchDeployServerNodes(
  body: { server_ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ batch_id: number; task_count: number; tasks: API.DeployTask[] }>>(
    '/server/manage/batchServerDeploy',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) },
  );
}

export async function getDeployResult(
  params: { task_id?: number; batch_id?: number; server_id?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployResultSingle | API.DeployResultBatch>>(
    '/server/manage/deployResult',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function testServerPort(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PortTestResult>>('/v3/server/manage/testPort', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getServerOnlineUsers(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ServerOnlineUsersResult>>('/v3/server/manage/onlineUsers', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getServerHistory(
  params?: { id?: number; page?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ServerNodeHistoryPageData>>('/v3/server/manage/history', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function switchServerDomain(
  body: API.SwitchServerDomainParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.SwitchServerDomainResult>>(
    '/v3/server/manage/switchDomain',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  );
}

export async function batchBindDomain(
  body: API.BatchBindDomainParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchBindDomainResult>>(
    '/v3/server/manage/batchBindDomain',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  );
}

// ── 权限组 ───────────────────────────────────────────────────────────────────

export async function fetchServerGroups(options?: { [key: string]: any }) {
  return request<{ data: API.ServerGroup[] }>('/server/group/fetch', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function saveServerGroup(
  body: API.ServerGroupSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerGroup }>('/server/group/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerGroup(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/group/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

// ── 路由 ─────────────────────────────────────────────────────────────────────

export async function fetchServerRoutes(options?: { [key: string]: any }) {
  return request<{ data: API.ServerRoute[] }>('/server/route/fetch', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function saveServerRoute(
  body: API.ServerRouteSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerRoute }>('/server/route/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerRoute(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/route/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

// ── 节点模板 ─────────────────────────────────────────────────────────────────

export async function fetchServerTemplates(params: API.ServerTemplateFetchParams) {
  return request<API.ApiResponse<API.ServerTemplatePageData>>('/server/template/fetch', {
    method: 'GET',
    params,
  });
}

export async function getServerTemplateDetail(params: { id: number }) {
  return request<API.ApiResponse<API.ServerTemplate>>('/server/template/detail', {
    method: 'GET',
    params,
  });
}

export async function saveServerTemplate(body: API.ServerTemplateSaveParams) {
  return request<API.ApiResponse<API.ServerTemplate>>('/server/template/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function updateServerTemplate(
  body: Partial<API.ServerTemplateSaveParams> & { id: number },
) {
  return request<API.ApiResponse<API.ServerTemplate>>('/server/template/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function deleteServerTemplate(body: { id: number }) {
  return request<API.ApiResponse<null>>('/server/template/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function setDefaultServerTemplate(body: { id: number }) {
  return request<API.ApiResponse<null>>('/server/template/setDefault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function saveServerTemplateFromNode(body: {
  server_id: number;
  name: string;
  description?: string;
}) {
  return request<API.ApiResponse<API.ServerTemplate>>('/server/template/saveFromNode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}

export async function previewServerTemplate(params: { id: number }) {
  return request<API.ApiResponse<Record<string, any>>>('/server/template/preview', {
    method: 'GET',
    params,
  });
}

// ── 部署模板 ─────────────────────────────────────────────────────────────────

const DEPLOY_TEMPLATE_BASE = '/deploy-template';

export async function fetchDeployTemplates(
  params?: {
    page?: number;
    page_size?: number;
    name?: string;
    node_type?: string;
    is_default?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.DeployTemplate[]; total: number; pageSize: number; page: number }>>(
    `${DEPLOY_TEMPLATE_BASE}/fetch`,
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getDeployTemplateDetail(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployTemplate>>(`${DEPLOY_TEMPLATE_BASE}/detail`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function saveDeployTemplate(
  body: API.DeployTemplateSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployTemplate>>(`${DEPLOY_TEMPLATE_BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateDeployTemplate(
  body: Partial<API.DeployTemplateSaveParams> & { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployTemplate>>(`${DEPLOY_TEMPLATE_BASE}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function deleteDeployTemplate(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>(`${DEPLOY_TEMPLATE_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function setDefaultDeployTemplate(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>(`${DEPLOY_TEMPLATE_BASE}/setDefault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function previewDeployTemplate(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<Record<string, any>>>(`${DEPLOY_TEMPLATE_BASE}/preview`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
