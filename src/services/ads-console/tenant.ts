import { request } from "@umijs/max";

export async function getTenantPage(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysTenant>>>(
    "/ads-api/sys/tenant/page",
    {
      method: "GET",
      params,
    }
  );
}

export async function addTenant(body: {
  name?: string;
  code?: string;
  status?: number;
  expireTime?: string;
  contact?: string;
  contactPhone?: string;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>("/ads-api/sys/tenant", {
    method: "POST",
    data: body,
  });
}

export async function updateTenant(body: {
  id: string;
  name?: string;
  status?: number;
  expireTime?: string;
  contact?: string;
  contactPhone?: string;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>("/ads-api/sys/tenant", {
    method: "PUT",
    data: body,
  });
}

export async function deleteTenant(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/tenant/${id}`, {
    method: "DELETE",
  });
}

