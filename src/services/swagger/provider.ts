import { request } from '@umijs/max';

export async function fetchProvider(
  params: API.ProviderFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageData<API.ProviderItem>>>('/provider/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getProviderDetail(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ProviderItem>>('/provider/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function saveProvider(
  body: API.ProviderSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/provider/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteProvider(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/provider/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateProviderStatus(
  body: { ids: number[]; is_active: boolean },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/provider/updateStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getProviderStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ProviderStats>>('/provider/stats', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function updateProviderAsn(
  body: { provider_ids: number[]; asn_id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchActionResult>>('/provider/updateAsn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getUnboundProviders(
  params: { current?: number; pageSize?: number; search?: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageData<API.ProviderItem>>>('/provider/getUnboundProviders', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getProvidersByAsn(
  params: { asn_id: number; current?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AsnProvidersData>>('/provider/getByAsn', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function providerBatchImport(
  body: { items: any[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{
    created: Array<{ id: number; name: string }>;
    updated: Array<{ id: number; name: string }>;
    failed: Array<{ name: string; reason: string }>;
    summary: {
      total: number;
      created_count: number;
      updated_count: number;
      failed_count: number;
    };
  }>>('/provider/batchImport', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
