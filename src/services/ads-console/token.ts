import { request } from '@umijs/max';

/** Token 分页查询 */
export async function getTokenPage(params: { current?: number; size?: number; status?: number }) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.FbToken>>>('/ads-api/fb/token', {
    method: 'GET',
    params,
  });
}

/** 新增 Token */
export async function addToken(body: { token: string; appId?: string; appSecret?: string; status?: number; remark?: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/token', {
    method: 'POST',
    data: body,
  });
}

/** 更新 Token */
export async function updateToken(body: { id: string; token?: string; appId?: string; appSecret?: string; status?: number; remark?: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/token', {
    method: 'PUT',
    data: body,
  });
}

export async function inspectToken(id: string) {
  return request<AdsConsole.Result<any>>(`/ads-api/fb/token/${id}/inspect`, {
    method: 'POST',
  });
}

export async function exchangeLongLivedToken(id: string) {
  return request<AdsConsole.Result<any>>(`/ads-api/fb/token/${id}/exchange-long-lived`, {
    method: 'POST',
  });
}

/** 删除 Token */
export async function deleteToken(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/token/${id}`, {
    method: 'DELETE',
  });
}

/** 手动触发同步，异步执行，通过 getTokenPage lastSyncStatus 追踪结果 */
export async function triggerTokenSync(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/token/${id}/sync`, {
    method: 'POST',
  });
}

