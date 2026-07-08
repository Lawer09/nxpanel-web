import {request} from '@umijs/max';

export async function getCampaignInsights(params: {
  current?: number;
  size?: number;
  campaignId?: string;
  accountId?: string;
  name?: string;
  selectedAccountIds?: string[];
  groupId?: string;
  teamId?: string;
  effectiveStatus?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: string;
  roasMin?: number;
  roasMax?: number;
}) {
  const normalizedParams = {
    ...params,
    selectedAccountIds: params.selectedAccountIds
      ? params.selectedAccountIds.join(',')
      : undefined,
  };
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAccountInsight>>>('/ads-api/fb/campaign/page', {
    method: 'GET',
    params: normalizedParams,
  });
}

export async function getCampaignPage(params: {
  current?: number;
  size?: number;
  accountId?: string;
  name?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsCampaign>>>('/ads-api/fb/campaign/page', {
    method: 'GET',
    params,
  });
}

export async function getCampaignDetail(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsCampaign>>(`/ads-api/fb/campaign/${id}`, {
    method: 'GET',
  });
}

export async function createCampaign(body: Partial<AdsConsole.AdsCampaign>) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/campaign', {
    method: 'POST',
    data: body,
  });
}

export async function updateCampaign(body: Partial<AdsConsole.AdsCampaign> & { id: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/campaign', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteCampaign(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/campaign/${id}`, {
    method: 'DELETE',
  });
}

export async function updateCampaignRemoteStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/campaign/${id}/status`, {
    method: 'POST',
    data: { status },
  });
}

export async function updateCampaignRemoteBudget(
  id: string,
  body: {
    budgetMode: 'CBO' | 'ABO';
    budgetType?: 'daily' | 'lifetime';
    budgetAmount?: number;
    bidStrategy?: string;
    spendCap?: number;
    isBudgetScheduleEnabled?: boolean;
    budgetRebalanceFlag?: boolean;
  },
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/campaign/${id}/budget`, {
    method: 'POST',
    data: body,
  });
}

export async function syncAllCampaigns(
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/campaign/sync', {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

export async function syncCampaignById(
  id: string,
  startDate: string,
  endDate: string,
  syncMode: 'ENTITY' | 'INSIGHTS' | 'FULL' = 'INSIGHTS',
) {
  return request<AdsConsole.Result<null>>(`/ads-api/fb/campaign/sync/${id}`, {
    method: 'POST',
    params: {startDate, endDate, syncMode},
  });
}

