import { request } from '@umijs/max';

export async function getAutomationHistoryPage(params: any) {
  return request<AdsConsole.Result<AdsConsole.PageResult<any>>>('/ads-api/automation/history/page', {
    method: 'GET',
    params,
  });
}

export async function getAutomationHistoryDetail(id: string) {
  return request<AdsConsole.Result<any>>(`/ads-api/automation/history/${id}`, {
    method: 'GET',
  });
}

