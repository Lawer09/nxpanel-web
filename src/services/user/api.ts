import { request } from '@umijs/max';

// ── 用户 ─────────────────────────────────────────────────────────────────────

export async function fetchUsers(
  params: API.UserFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.UserItem[]; total: number }>>('/v3/user/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function getUserInfoById(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserItem>>('/v3/user/getUserInfoById', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function updateUser(
  body: API.UserUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function generateUser(
  body: API.UserGenerateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<any>>('/v3/user/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dumpUserCSV(
  body: { filter?: API.UserFilter[]; sort?: API.UserSort[] },
  options?: { [key: string]: any },
) {
  return request<Blob>('/v3/user/dumpCSV', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    responseType: 'blob',
    ...(options || {}),
  });
}

export async function sendUserMail(
  body: API.UserSendMailParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/sendMail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function banUsers(
  body: { filter?: API.UserFilter[]; sort_type?: string; sort?: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function resetUserSecret(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/resetSecret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function destroyUser(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/destroy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
