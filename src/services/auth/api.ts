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
