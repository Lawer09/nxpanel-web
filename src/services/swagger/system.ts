import { request } from '@umijs/max';



export async function getSystemStatus(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.SystemStatusResponse>>('/system/getSystemStatus', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getQueueStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.QueueStatsResponse>>('/system/getQueueStats', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getQueueWorkload(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.QueueWorkloadItem[]>>('/system/getQueueWorkload', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getQueueMasters(options?: { [key: string]: any }) {
  return request<API.ApiResponse<any>>('/system/getQueueMasters', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function getHorizonFailedJobs(
  params?: {
    page?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{
    data: API.HorizonFailedJob[];
    total: number;
    page: number;
    pageSize: number;
  }>>('/system/getHorizonFailedJobs', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function getAuditLog(
  params?: {
    current?: number;
    page_size?: number;
    action?: string;
    admin_id?: number;
    keyword?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{
    data: API.AuditLogItem[];
    total: number;
    page: number;
    pageSize: number;
  }>>('/system/getAuditLog', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
