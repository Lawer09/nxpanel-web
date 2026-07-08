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

export async function fetchBlockedIps(
  params: API.UserBlockedIpFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.UserBlockedIpItem[]; total: number }>>(
    '/v3/user/blockedIp/fetch',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: params,
      ...(options || {}),
    },
  );
}

export async function deleteBlockedIp(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/blockedIp/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchDeleteBlockedIps(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserBlockedIpBatchDeleteResult>>(
    '/v3/user/blockedIp/batchDelete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  );
}

export async function updateBlockedIpType(
  body: API.UserBlockedIpUpdateTypeParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserBlockedIpItem>>('/v3/user/blockedIp/updateType', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchBlockBlockedIps(
  body: API.UserBlockedIpBatchBlockParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserBlockedIpBatchBlockResult>>('/v3/user/blockedIp/batchBlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function fetchAllowedIps(
  params: API.UserAllowedIpFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.UserAllowedIpItem[]; total: number }>>(
    '/v3/user/allowedIp/fetch',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: params,
      ...(options || {}),
    },
  );
}

export async function saveAllowedIps(
  body: API.UserAllowedIpSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserAllowedIpSaveResult>>('/v3/user/allowedIp/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function deleteAllowedIp(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/allowedIp/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchDeleteAllowedIps(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserAllowedIpBatchDeleteResult>>(
    '/v3/user/allowedIp/batchDelete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: body,
      ...(options || {}),
    },
  );
}

export async function fetchAidLoginBanRules(
  params: API.AidLoginBanRuleFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.AidLoginBanRuleItem[]; total: number }>>(
    '/v3/user/aidLoginBanRule/fetch',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: params,
      ...(options || {}),
    },
  );
}

export async function saveAidLoginBanRule(
  body: API.AidLoginBanRuleSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/aidLoginBanRule/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateAidLoginBanRule(
  body: API.AidLoginBanRuleUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/aidLoginBanRule/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function deleteAidLoginBanRule(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/aidLoginBanRule/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function fetchIpAllowlistRules(
  params: API.IpAllowlistRuleFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.IpAllowlistRuleItem[]; total: number }>>(
    '/v3/user/ipAllowlistRule/fetch',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: params,
      ...(options || {}),
    },
  );
}

export async function saveIpAllowlistRule(
  body: API.IpAllowlistRuleSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/ipAllowlistRule/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateIpAllowlistRule(
  body: API.IpAllowlistRuleUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/ipAllowlistRule/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function deleteIpAllowlistRule(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/ipAllowlistRule/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
