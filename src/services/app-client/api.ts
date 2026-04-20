import { request } from '@umijs/max';

/** 应用列表（分页） */
export async function fetchAppClients(
  params: API.AppClientFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.AppClientItem>>>('/v3/app-client/fetch', {
    method: 'GET',
    params: {
      page: params.current,
      page_size: params.pageSize,
    },
    ...(options || {}),
  });
}

/** 应用详情 */
export async function getAppClientDetail(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppClientItem>>('/v3/app-client/detail', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 创建应用 */
export async function saveAppClient(
  data: API.AppClientSaveParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppClientItem>>('/v3/app-client/save', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 更新应用 */
export async function updateAppClient(
  data: API.AppClientUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppClientItem>>('/v3/app-client/update', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 删除应用 */
export async function dropAppClient(
  data: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<any>>('/v3/app-client/drop', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

/** 重置 Token 和 Secret */
export async function resetAppClientSecret(
  data: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.AppClientItem>>('/v3/app-client/resetSecret', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}
