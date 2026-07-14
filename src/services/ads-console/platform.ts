import { request } from '@umijs/max';

const PLATFORM_API_PREFIX = '/ads-api/v2/platform';

export async function getPlatformAccountPage(params: {
  current?: number;
  size?: number;
  platform?: string;
  name?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdPlatformAccount>>>(`${PLATFORM_API_PREFIX}/account/page`, {
    method: 'GET',
    params,
  });
}

export async function addPlatformAccount(body: Partial<AdsConsole.AdPlatformAccount>) {
  return request<AdsConsole.Result<null>>(`${PLATFORM_API_PREFIX}/account`, {
    method: 'POST',
    data: body,
  });
}

export async function updatePlatformAccount(body: Partial<AdsConsole.AdPlatformAccount>) {
  return request<AdsConsole.Result<null>>(`${PLATFORM_API_PREFIX}/account`, {
    method: 'PUT',
    data: body,
  });
}

export async function deletePlatformAccount(id: string) {
  return request<AdsConsole.Result<null>>(`${PLATFORM_API_PREFIX}/account/${id}`, {
    method: 'DELETE',
  });
}

export async function validatePlatformAccount(id: string) {
  return request<AdsConsole.Result<null>>(`${PLATFORM_API_PREFIX}/account/${id}/validate`, {
    method: 'POST',
  });
}

export async function syncPlatformAccount(
  id: string,
  body: { startDate: string; endDate: string; syncMode?: string; granularity?: string },
) {
  return request<AdsConsole.Result<null>>(`${PLATFORM_API_PREFIX}/account/${id}/sync`, {
    method: 'POST',
    data: body,
  });
}

export async function createMintegralObject(
  id: string,
  body: { type: string; payload: Record<string, unknown> },
) {
  return request<AdsConsole.Result<unknown>>(`${PLATFORM_API_PREFIX}/account/${id}/mintegral/create`, {
    method: 'POST',
    data: body,
  });
}

export async function getPlatformObjectPage(params: {
  current?: number;
  size?: number;
  platform?: string;
  platformAccountId?: string;
  accountId?: string;
  objectType?: string;
  objectId?: string;
  name?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdPlatformObject>>>(`${PLATFORM_API_PREFIX}/object/page`, {
    method: 'GET',
    params,
  });
}

export async function getPlatformObjectOptions(params: {
  platform?: string;
  platformAccountId?: string;
  accountId?: string;
  objectType?: string;
  objectId?: string;
  name?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>(`${PLATFORM_API_PREFIX}/object/options`, {
    method: 'GET',
    params,
  });
}

export async function getPlatformSyncHistoryPage(params: {
  current?: number;
  size?: number;
  platform?: string;
  platformAccountId?: string;
  objectType?: string;
  objectId?: string;
  syncStatus?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdPlatformSyncHistory>>>(`${PLATFORM_API_PREFIX}/sync-history/page`, {
    method: 'GET',
    params,
  });
}

