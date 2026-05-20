import { request } from '@umijs/max';

export async function getEnumAppIds(params?: { keyword?: string }) {
  return request<API.ApiResponse<API.EnumAppIdOption[]>>('/v3/enum/app-ids', {
    method: 'GET',
    params,
  });
}
