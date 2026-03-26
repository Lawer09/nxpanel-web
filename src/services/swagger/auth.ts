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
    code: number;
    msg: string;
    data: {
      token: string;
      auth_data: string; // "Bearer xxxxxxx"
      is_admin: boolean;
    };
  }>('/api/v1/passport/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    skipErrorHandler: false,
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
    code: number;
    msg: string;
    data: {
      token: string;
      auth_data: string; // "Bearer xxxxxxx"
      is_admin: boolean;
    };
  }>('/api/v1/passport/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    skipErrorHandler: false,
    ...(options || {}),
  });
}

/**
 * 获取当前用户信息
 * GET /api/v1/passport/auth/me
 */
export async function getCurrentUser(options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
    data: {
      email: string;
      is_admin: boolean;
      token: string;
    };
  }>('/api/v1/passport/auth/me', {
    method: 'GET',
    ...(options || {}),
  });
}

/**
 * 用户登出
 * POST /api/v1/passport/auth/logout
 */
export async function logout(options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
  }>('/api/v1/passport/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}