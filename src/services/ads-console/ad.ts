import {request} from '@umijs/max';

export async function getAdInsights(params: {
  current?: number;
  size?: number;
  pageSize?: number;
  adId?: string;
  adsetId?: string;
  adsetIds?: string[];
  campaignId?: string;
  campaignIds?: string[];
  accountId?: string;
  name?: string;
  selectedAccountIds?: string[];
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
    size: params.size ?? params.pageSize,
    campaignIds: params.campaignIds?.length ? params.campaignIds.join(",") : undefined,
    adsetIds: params.adsetIds?.length ? params.adsetIds.join(",") : undefined,
    selectedAccountIds: params.selectedAccountIds ? params.selectedAccountIds.join(",") : undefined,
  };
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountInsight>>>('/ads-api/fb/ad/page', {
    method: 'GET',
    params: normalizedParams,
  });
}

export async function getAdPage(params: {
  current?: number;
  size?: number;
  adsetId?: string;
  campaignId?: string;
  accountId?: string;
  name?: string;
  status?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAd>>>('/ads-api/fb/ad/page', {
    method: 'GET',
    params,
  });
}

export async function createAd(body: Partial<AdsConsole.AdsAd>) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/ad', {
    method: 'POST',
    data: body,
  });
}

export async function updateAd(body: Partial<AdsConsole.AdsAd> & { id: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/ad', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteAd(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/ad/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAdRemoteStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/ad/${id}/status`, {
    method: 'POST',
    data: { status },
  });
}

export async function syncAllAds(
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/ad/sync', {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

export async function syncAdById(
  id: string,
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/ad/sync/${id}`, {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

