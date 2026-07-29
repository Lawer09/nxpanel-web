import { request } from '@umijs/max';

export async function getUserPreferences(
  params?: { keys?: string[] },
  options?: { [key: string]: any },
) {
  const searchParams = new URLSearchParams();
  params?.keys?.forEach((key) => {
    searchParams.append('keys[]', key);
  });

  const queryString = searchParams.toString();

  return request<API.ApiResponse<API.UserPreferenceItem[]>>(
    `/api/v3/user/preferences${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

export async function saveUserPreferences(
  body: { items: API.UserPreferenceSaveItem[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserPreferenceItem[]>>('/api/v3/user/preferences/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
