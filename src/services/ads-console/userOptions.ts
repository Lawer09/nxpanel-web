import { request } from '@umijs/max';

export async function getUserOptions() {
  return request<
    AdsConsole.Result<Array<{ label: string; value: string }>>
  >('/ads-api/sys/options/users', {
    method: 'GET',
  });
}
