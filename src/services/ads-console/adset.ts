import {request} from '@umijs/max';

export async function getAdsetInsights(params: {
  current?: number;
  size?: number;
  adsetId?: string;
  campaignId?: string;
  campaignIds?: string[];
  accountId?: string;
  name?: string;
  selectedAccountIds?: string[];
  groupId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: string;
  roasMin?: number;
  roasMax?: number;
}) {
  const normalizedParams = {
    ...params,
    campaignIds: params.campaignIds?.length ? params.campaignIds.join(",") : undefined,
    selectedAccountIds: params.selectedAccountIds ? params.selectedAccountIds.join(",") : undefined,
  };
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountInsight>>>('/ads-api/fb/adset/page', {
    method: 'GET',
    params: normalizedParams,
  });
}

export async function getAdsetPage(params: {
  current?: number;
  size?: number;
  campaignId?: number;
  accountId?: number;
  name?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAdset>>>('/ads-api/fb/adset/page', {
    method: 'GET',
    params,
  });
}

export async function createAdset(body: Partial<AdsConsole.AdsAdset>) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/adset', {
    method: 'POST',
    data: body,
  });
}

export async function updateAdset(body: Partial<AdsConsole.AdsAdset> & { id: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/adset', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteAdset(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/adset/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAdsetRemoteStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/adset/${id}/status`, {
    method: 'POST',
    data: { status },
  });
}

export async function updateAdsetRemoteBudget(
  id: string,
  body: {
    budgetMode: 'CBO' | 'ABO';
    budgetType: 'daily' | 'lifetime';
    budgetAmount: number;
    bidStrategy?: string;
    isBudgetScheduleEnabled?: boolean;
    pacingType?: string[];
  },
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/adset/${id}/budget`, {
    method: 'POST',
    data: body,
  });
}

export async function syncAllAdsets(
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/adset/sync', {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

export async function syncAdsetById(
  id: string,
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/adset/sync/${id}`, {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

