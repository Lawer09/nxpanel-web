import {request} from '@umijs/max';

export async function getCreativePage(params: {
  current?: number;
  size?: number;
  pageSize?: number;
  accountId?: string;
  selectedAccountIds?: string[];
  campaignId?: string;
  campaignIds?: string[];
  adsetId?: string;
  adsetIds?: string[];
  adId?: string;
  adIds?: string[];
  creativeId?: string;
  name?: string;
  status?: string;
  syncStatus?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: string;
  createdDate?: string;
  roasMin?: number;
  roasMax?: number;
}) {
  const normalizedParams = {
    ...params,
    size: params.size ?? params.pageSize,
    campaignIds: params.campaignIds?.length ? params.campaignIds.join(",") : undefined,
    adsetIds: params.adsetIds?.length ? params.adsetIds.join(",") : undefined,
    adIds: params.adIds?.length ? params.adIds.join(",") : undefined,
    selectedAccountIds: params.selectedAccountIds ? params.selectedAccountIds.join(",") : undefined,
  };
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsCreative>>>('/ads-api/fb/creative/page', {
    method: 'GET',
    params: normalizedParams,
  });
}

export async function createCreative(body: Partial<AdsConsole.AdsCreative>) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/creative', {
    method: 'POST',
    data: body,
  });
}

export async function updateCreative(body: Partial<AdsConsole.AdsCreative> & { id: number | string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/creative', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteCreative(id: number | string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/creative/${id}`, {
    method: 'DELETE',
  });
}

export async function syncAllCreatives(startDate: string, endDate: string) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/creative/sync', {
    method: 'POST',
    params: {startDate, endDate},
  });
}

export async function syncCreativeById(id: number | string, startDate: string, endDate: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/creative/sync/${id}`, {
    method: 'POST',
    params: {startDate, endDate},
  });
}

