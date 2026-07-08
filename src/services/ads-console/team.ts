import { request } from '@umijs/max';

export async function getTeamPage(params: {
  current?: number;
  size?: number;
  name?: string;
  ownerUserId?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.OrgTeam>>>(
    '/ads-api/org/team',
    {
      method: 'GET',
      params,
    },
  );
}

export async function addTeam(body: {
  name: string;
  ownerUserId?: string;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/team', {
    method: 'POST',
    data: body,
  });
}

export async function updateTeam(body: {
  id: string;
  name?: string;
  ownerUserId?: string;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/team', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteTeam(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/team/${id}`, {
    method: 'DELETE',
  });
}

export async function getTeamUsers(id: string) {
  return request<AdsConsole.Result<AdsConsole.SysUser[]>>(
    `/ads-api/org/team/${id}/users`,
    {
      method: 'GET',
    },
  );
}

export async function getTeamAgencies(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsAgency[]>>(
    `/ads-api/org/team/${id}/agencies`,
    {
      method: 'GET',
    },
  );
}

export async function bindTeamUsers(id: string, userIds: string[]) {
  return request<AdsConsole.Result<number>>(`/ads-api/org/team/${id}/users`, {
    method: 'POST',
    data: { userIds },
  });
}

export async function bindTeamAgencies(id: string, agencyIds: string[]) {
  return request<AdsConsole.Result<number>>(
    `/ads-api/org/team/${id}/agencies`,
    {
      method: 'POST',
      data: { agencyIds },
    },
  );
}

export async function unbindTeamAgencies(id: string, agencyIds: string[]) {
  return request<AdsConsole.Result<number>>(
    `/ads-api/org/team/${id}/agencies`,
    {
      method: 'DELETE',
      data: { agencyIds },
    },
  );
}

export async function unbindTeamUsers(id: string, userIds: string[]) {
  return request<AdsConsole.Result<number>>(`/ads-api/org/team/${id}/users`, {
    method: 'DELETE',
    data: { userIds },
  });
}

export async function getTeamGroups(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsProject[]>>(
    `/ads-api/org/team/${id}/groups`,
    {
      method: 'GET',
    },
  );
}

export async function bindTeamGroups(id: string, groupIds: string[]) {
  return request<AdsConsole.Result<number>>(`/ads-api/org/team/${id}/groups`, {
    method: 'POST',
    data: { groupIds },
  });
}

export async function unbindTeamGroups(id: string, groupIds: string[]) {
  return request<AdsConsole.Result<number>>(`/ads-api/org/team/${id}/groups`, {
    method: 'DELETE',
    data: { groupIds },
  });
}
