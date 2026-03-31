import { request } from '@umijs/max';

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
