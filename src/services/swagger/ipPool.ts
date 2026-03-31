import { request } from '@umijs/max';

export async function fetchIpPool(
  params: API.IpPoolFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageData<API.IpPoolItem>>>('/ip-pool/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getIpPoolDetail(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.IpPoolItem>>('/ip-pool/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function saveIpPool(
  body: API.IpPoolSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/ip-pool/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteIpPool(
  body: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/ip-pool/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function enableIpPool(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/ip-pool/enable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function disableIpPool(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/ip-pool/disable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function resetIpPoolScore(
  body: { id: number; score: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/ip-pool/reset-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getIpPoolStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.IpPoolStats>>('/ip-pool/stats', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getIpInfo(
  params: { ip: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.IpInfoData>>('/ip-pool/get-ipinfo', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function ipPoolBatchImport(
  body: { items: any[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{
    created: Array<{ id: number; ip: string }>;
    updated: Array<{ id: number; ip: string }>;
    failed: Array<{ ip: string; reason: string }>;
    summary: {
      total: number;
      created_count: number;
      updated_count: number;
      failed_count: number;
    };
  }>>('/ip-pool/batchImport', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
