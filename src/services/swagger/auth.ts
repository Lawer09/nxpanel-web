// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/**
 * 用户注册
 * POST /api/v1/passport/auth/register
 */
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
    data: {
      token: string;
      auth_data: string;
      is_admin: boolean;
      secure_path?: string;
    } | null;
    error: null;
  }>('/api/v1/passport/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    // 关键：不使用全局错误处理，让错误通过
    skipErrorHandler: true,
    ...(options || {}),
  });
}

/**
 * 用户登录
 * POST /api/v1/passport/auth/login
 */
export async function login(
  body: {
    email: string;
    password: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: {
      token: string;
      auth_data: string;
      is_admin: boolean;
      secure_path?: string;
    } | null;
    error: null;
  }>('/api/v1/passport/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    // 关键：不使用全局错误处理，让错误通过
    skipErrorHandler: true,
    ...(options || {}),
  });
}

/**
 * 获取当前用户信息
 * GET /api/v1/passport/auth/me
 */
export async function getCurrentUser(options?: { [key: string]: any }) {
  return request<{
    status: 'success' | 'fail';
    message: string;
    data: {
      email: string;
      is_admin: boolean;
      token: string;
    } | null;
    error: null;
  }>('/api/v1/passport/auth/me', {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

/**
 * 用户登出
 * POST /api/v1/passport/auth/logout
 */
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
