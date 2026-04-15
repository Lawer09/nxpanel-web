import { request } from '@umijs/max';

// ── SSH 密钥 ────────────────────────────────────────────────────────────────

export async function fetchSshKeys(
  params: API.SshKeyFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.SshKeyItem>>>('/v3/ssh-key/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getSshKeyDetail(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.SshKeyItem>>('/v3/ssh-key/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function saveSshKey(
  body: API.SshKeySaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.SshKeyItem>>('/v3/ssh-key/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateSshKey(
  body: API.SshKeyUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.SshKeyItem>>('/v3/ssh-key/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dropSshKey(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/ssh-key/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchDropSshKeys(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/ssh-key/batchDrop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchImportSshKeys(
  body: { items: API.SshKeySaveParams[] },
  options?: { [key: string]: any },
) {
  return request<
    API.ApiResponse<{
      created: Array<{ id: number; name: string }>;
      failed: Array<{ index: number; reason: string }>;
      summary: { total: number; created_count: number; failed_count: number };
    }>
  >('/v3/ssh-key/batchImport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
