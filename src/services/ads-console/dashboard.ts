import { request } from '@umijs/max';

export type DashboardQueryParams = {
  teamId?: string | number;
  trendStartDate?: string;
  trendEndDate?: string;
  rankStartDate?: string;
  rankEndDate?: string;
};

export async function getDashboard(params?: DashboardQueryParams) {
  return request<AdsConsole.Result<AdsConsole.DashboardData>>(
    '/ads-api/dashboard',
    {
      method: 'GET',
      params,
    },
  );
}
