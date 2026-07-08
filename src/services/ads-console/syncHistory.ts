import { request } from '@umijs/max';

export type SyncHistoryRecord = {
  id: string;
  objectType: string;
  objectId: string;
  syncStatus: number; // 0=同步中 1=成功 2=失败
  syncTime: string;
  syncMsg?: string;
};

export async function getSyncHistory(params: {
  objectType: string;
  objectId: string;
  hours?: number;
}) {
  return request<AdsConsole.Result<SyncHistoryRecord[]>>('/ads-api/fb/sync-history', {
    method: 'GET',
    params,
  });
}

