import { request } from '@umijs/max';

export async function getAgencyPage(params: {
  current?: number;
  size?: number;
  name?: string;
  teamId?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.AdsAgency>>>(
    '/ads-api/org/agency',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getAgencyDetail(id: string) {
  return request<AdsConsole.Result<AdsConsole.AdsAgency>>(
    `/ads-api/org/agency/${id}`,
    {
      method: 'GET',
    },
  );
}

export async function addAgency(body: {
  name: string;
  teamId?: string;
  contact?: string;
  email?: string;
  remark?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/agency', {
    method: 'POST',
    data: body,
  });
}

export async function updateAgency(body: {
  id: string;
  name: string;
  teamId?: string;
  contact?: string;
  email?: string;
  remark?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/org/agency', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteAgency(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/org/agency/${id}`, {
    method: 'DELETE',
  });
}
