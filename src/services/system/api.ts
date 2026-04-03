import { request } from '@umijs/max';

// ── 认证 ─────────────────────────────────────────────────────────────────────

export async function register(
  body: {
    email: string;
    password: string;
    invite_code?: string;
    email_code?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: { token: string; auth_data: string; is_admin: boolean; secure_path?: string } | null;
    error: null;
  }>('/api/v1/passport/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function login(
  body: { email: string; password: string },
  options?: { [key: string]: any },
) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: { token: string; auth_data: string; is_admin: boolean; secure_path?: string } | null;
    error: null;
  }>('/api/v1/passport/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function getCurrentUser(options?: { [key: string]: any }) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: { email: string; is_admin: boolean; token: string } | null;
    error: null;
  }>('/api/v1/passport/auth/me', {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function logout(options?: { [key: string]: any }) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: null;
    error: null;
  }>('/api/v1/passport/auth/logout', {
    method: 'POST',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

// ── 系统 ─────────────────────────────────────────────────────────────────────

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
  params?: { page?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<
    API.ApiResponse<{
      data: API.HorizonFailedJob[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >('/system/getHorizonFailedJobs', {
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
  return request<
    API.ApiResponse<{
      data: API.AuditLogItem[];
      total: number;
      page: number;
      pageSize: number;
    }>
  >('/system/getAuditLog', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
