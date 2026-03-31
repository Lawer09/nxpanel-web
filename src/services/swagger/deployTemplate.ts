import { request } from '@umijs/max';

const BASE = '/deploy-template';

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
    `${BASE}/fetch`,
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getDeployTemplateDetail(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployTemplate>>(`${BASE}/detail`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function saveDeployTemplate(
  body: API.DeployTemplateSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.DeployTemplate>>(`${BASE}/save`, {
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
  return request<API.ApiResponse<API.DeployTemplate>>(`${BASE}/update`, {
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
  return request<API.ApiResponse<boolean>>(`${BASE}/delete`, {
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
  return request<API.ApiResponse<boolean>>(`${BASE}/setDefault`, {
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
  return request<API.ApiResponse<Record<string, any>>>(`${BASE}/preview`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
