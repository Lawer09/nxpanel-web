import { request } from '@umijs/max';

export async function fetchAsn(
  params: API.AsnFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageData<API.AsnItem>>>('/asn/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getAsnDetail(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AsnItem>>('/asn/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function saveAsn(
  body: API.AsnSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/asn/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteAsn(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/asn/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getAsnStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.AsnStats>>('/asn/stats', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getAsnProviders(
  params: { asn_id: number; current?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AsnProvidersData>>('/asn/getProviders', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function bindAsnProviders(
  body: { asn_id: number; provider_ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchActionResult>>('/asn/bindProviders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function unbindAsnProviders(
  body: { asn_id: number; provider_ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchActionResult>>('/asn/unbindProviders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function asnBatchImport(
  body: { items: any[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{
    created: Array<{ id: number; asn: string }>;
    updated: Array<{ id: number; asn: string }>;
    failed: Array<{ asn: string; reason: string }>;
    summary: {
      total: number;
      created_count: number;
      updated_count: number;
      failed_count: number;
    };
  }>>('/asn/batchImport', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
