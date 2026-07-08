import { request } from '@umijs/max';

export async function getAccountManage(params: {
  current?: number;
  size?: number;
  accountId?: string;
  name?: string;
  accountStatus?: number;
  agencyIds?: string[];
  teamIds?: string[];
  groupIds?: string[];
}) {
  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountManage>>
  >('/ads-api/fb/account/manage', {
    method: 'GET',
    params,
  });
}

export async function getAccountPage(params: {
  current?: number;
  size?: number;
  accountId?: string;
  name?: string;
  accountStatus?: number;
}) {
  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountManage>>
  >('/ads-api/fb/account/page', {
    method: 'GET',
    params,
  });
}

export async function getAccountsByBm(params: {
  current?: number;
  size?: number;
  bmRecordId: string;
  accountId?: string;
  name?: string;
}) {
  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountManage>>
  >('/ads-api/fb/account/by-bm', {
    method: 'GET',
    params,
  });
}

export async function getAccountsByToken(params: {
  current?: number;
  size?: number;
  tokenId: string;
  accountId?: string;
  name?: string;
}) {
  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountManage>>
  >('/ads-api/fb/account/by-token', {
    method: 'GET',
    params,
  });
}

export async function getAccountInsights(params: {
  current?: number;
  size?: number;
  accountId?: string;
  name?: string;
  accountStatus?: number;
  groupId?: string;
  userId?: string;
  syncStatus?: number;
  syncMsg?: string;
  agencyIds?: string[];
  teamIds?: string[];
  roasMin?: number;
  roasMax?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: string;
}) {
  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountInsight>>
  >('/ads-api/fb/account/page', {
    method: 'GET',
    params,
  });
}

export async function deleteAccount(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/account/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAccountStatus(id: string, accountStatus: number) {
  return request<AdsConsole.Result<null>>(
    `/ads-api/fb/account/${id}/status`,
    {
      method: 'PUT',
      params: { accountStatus },
    },
  );
}

export async function assignAccountAgency(id: string, agencyId?: string) {
  return request<AdsConsole.Result<null>>(
    `/ads-api/fb/account/${id}/agency`,
    {
      method: 'PUT',
      params: { agencyId },
    },
  );
}

export async function assignAccountOwner(id: string, userId?: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/account/${id}/owner`, {
    method: 'PUT',
    params: { userId },
  });
}

export async function assignAccountGroup(id: string, groupId?: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/account/${id}/group`, {
    method: 'PUT',
    params: { groupId },
  });
}

export async function batchAssignAccounts(body: {
  ids: string[];
  agencyId?: string;
  clearAgency?: boolean;
  userId?: string;
  clearUser?: boolean;
  groupId?: string;
  clearGroup?: boolean;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/account/batch-assign', {
    method: 'PUT',
    data: body,
  });
}

export async function exportAccountInsights(params: {
  accountId?: string;
  name?: string;
  accountStatus?: number;
  groupId?: string;
  userId?: string;
  syncStatus?: number;
  syncMsg?: string;
  agencyIds?: string[];
  teamIds?: string[];
  roasMin?: number;
  roasMax?: number;
  startDate?: string;
  endDate?: string;
}) {
  return `/ads-api/fb/account/export?${new URLSearchParams(
    Object.entries(params)
      .filter(
        ([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0),
      )
      .flatMap(([k, v]) =>
        Array.isArray(v)
          ? v.map((item) => [k, String(item)])
          : [[k, String(v)]],
      ),
  ).toString()}`;
}

export async function syncAllAccounts(
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/account/sync', {
    method: 'POST',
    params: { startDate, endDate, syncMode },
  });
}

export async function syncAccountById(
  id: string,
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/account/sync/${id}`, {
    method: 'POST',
    params: { startDate, endDate, syncMode },
  });
}
