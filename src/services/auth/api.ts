import { request } from '@umijs/max';

// ── 认证 ─────────────────────────────────────────────────────────────────────

export type AuthApiResponse<T = API.AuthResponse> = {
  code?: number;
  msg?: string;
  status?: 'success' | 'fail';
  message?: string;
  data: T | null;
  error?: null;
};

export const isAuthApiSuccess = <T,>(
  res?: AuthApiResponse<T>,
): res is AuthApiResponse<T> & { data: T } =>
  !!res?.data && (res.code === 0 || res.status === 'success');

export const getAuthApiMessage = (
  res: AuthApiResponse<any> | undefined,
  fallback: string,
) => res?.msg || res?.message || fallback;

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
    data:
      | {
          token: string;
          auth_data: string;
          is_admin: boolean;
          secure_path?: string;
          user_type?: string;
          menus?: string[];
        }
      | null;
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
  return request<AuthApiResponse>('/api/v3/passport/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function refreshLogin(
  body?: {
    ad_spend_platform_token?: string;
    adSpendPlatformToken?: string;
  },
  options?: { [key: string]: any },
) {
  return request<AuthApiResponse>('/api/v3/passport/auth/refresh', {
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
    data:
      | {
          email: string;
          is_admin: boolean;
          token: string;
          user_type?: string;
          menus?: string[];
        }
      | null;
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
