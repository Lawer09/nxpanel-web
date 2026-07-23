import { request } from '@umijs/max';

export async function getProjectPage(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
  teamId?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsProject>>>(
    '/ads-api/org/group',
    {
      method: 'GET',
      params,
    },
  );
}

export async function addProject(body: {
  teamId: string;
  name: string;
  status?: number;
  remark?: string;
  targetEvent?: string | null;
  targetCountry?: string | null;
  revenueEventType?: string | null;
  accountIds?: string[];
  userIds?: string[];
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/group', {
    method: 'POST',
    data: body,
  });
}

export async function updateProject(body: {
  id: string;
  teamId: string;
  name: string;
  status?: number;
  remark?: string;
  targetEvent?: string | null;
  targetCountry?: string | null;
  revenueEventType?: string | null;
  accountIds?: string[] | null;
  userIds?: string[] | null;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/group', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteProject(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/group/${id}`, {
    method: 'DELETE',
  });
}

export async function bindProjectAccounts(id: string, accountIds: string[]) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/group/${id}/accounts`, {
    method: 'POST',
    data: { accountIds },
  });
}

export async function removeProjectAccounts(id: string, accountIds: string[]) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/group/${id}/accounts`, {
    method: 'DELETE',
    data: { accountIds },
  });
}

export async function bindProjectUsers(id: string, userIds: string[]) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/group/${id}/users`, {
    method: 'POST',
    data: { userIds },
  });
}

export async function removeProjectUsers(id: string, userIds: string[]) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/group/${id}/users`, {
    method: 'DELETE',
    data: { userIds },
  });
}

export async function getProjectAccounts(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsProjectAccount[]>>(
    `/ads-api/org/group/${id}/accounts`,
    {
      method: 'GET',
    },
  );
}

export async function getProjectUsers(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsProjectUser[]>>(
    `/ads-api/org/group/${id}/users`,
    {
      method: 'GET',
    },
  );
}
