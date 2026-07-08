import {request} from '@umijs/max';

export async function getLogPage(params: {
  current?: number;
  size?: number;
  module?: string;
  operatorName?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysOperationLog>>>('/ads-api/sys/log/page', {
    method: 'GET',
    params,
  });
}

export async function getLogFilterOptions() {
  return request<AdsConsole.Result<{ operators: AdsConsole.SelectOption[]; modules: AdsConsole.SelectOption[] }>>(
    '/ads-api/sys/log/filter-options',
    {
      method: 'GET',
    },
  );
}

export async function cleanLog() {
  return request<AdsConsole.Result<null>>('/ads-api/sys/log/clean', {
    method: 'DELETE',
  });
}

