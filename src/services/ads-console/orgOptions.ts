import { request } from '@umijs/max';

export async function getGroupOptions(params?: { teamId?: string | number }) {
  return request<AdsConsole.Result<AdsConsole.SelectOptionVO[]>>(
    '/ads-api/org/options/groups',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getTeamOptions() {
  return request<AdsConsole.Result<AdsConsole.SelectOptionVO[]>>(
    '/ads-api/org/options/teams',
    {
      method: 'GET',
    },
  );
}

export async function getAgencyOptions() {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>(
    '/ads-api/org/options/agencies',
    {
      method: 'GET',
    },
  );
}

export async function getProjectOptions(params?: { teamId?: string | number }) {
  return getGroupOptions(params);
}
