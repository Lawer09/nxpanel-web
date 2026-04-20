import { request } from '@umijs/max';

// ── 前端公开接口 ─────────────────────────────────────────────────────────────

export async function getVersionList(
  params?: { page?: number; page_size?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.VersionItem>>>(
    '/api/v3/guest/version/list',
    { method: 'GET', params, ...(options || {}) },
  );
}

export async function getLatestVersion(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.VersionItem>>('/api/v3/guest/version/latest', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getVersionDetailPublic(
  params: { version: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.VersionItem>>('/api/v3/version/detail', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// ── 管理端接口 ───────────────────────────────────────────────────────────────

export async function fetchVersions(
  params?: { page?: number; page_size?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.VersionItem>>>('/v3/version/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function saveVersion(
  data: API.VersionSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.VersionItem>>('/v3/version/save', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function updateVersion(
  data: API.VersionUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.VersionItem>>('/v3/version/update', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function dropVersion(
  data: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<null>>('/v3/version/drop', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function getVersionDetail(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.VersionItem>>('/v3/version/detail', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function publishVersion(
  data: { id: number; is_published: boolean },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<null>>('/v3/version/publish', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}
