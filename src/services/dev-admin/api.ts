import { clearDevAdminSession, getDevAdminSession, setDevAdminSession } from './session';
import { devAdminRequest } from './request';

export async function loginDevAdmin(body: API.DevAdminLoginParams) {
  const response = await devAdminRequest<API.DevAdminLoginData>('/v4/admin/auth/login', {
    method: 'POST',
    body,
    auth: false,
  });
  setDevAdminSession(response.data);
  return response;
}

export async function logoutDevAdmin() {
  const session = getDevAdminSession();
  try {
    if (session?.refreshToken) {
      await devAdminRequest<{ ok: boolean }>('/v4/admin/auth/logout', {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
      });
    }
  } finally {
    clearDevAdminSession();
  }
}

export async function getCurrentDevAdmin() {
  return devAdminRequest<API.DevAdminUser>('/v4/admin/auth/me');
}

export async function listAdminMenus() {
  return devAdminRequest<{ items: API.DevAdminMenu[] }>('/v4/admin/menus');
}

export async function listCurrentAdminMenus() {
  return devAdminRequest<{ items: API.DevAdminMenu[] }>('/v4/admin/menus/current');
}

export async function createAdminMenu(body: API.DevAdminMenuCreateParams) {
  return devAdminRequest<{ id: number }>('/v4/admin/menus/create', {
    method: 'POST',
    body,
  });
}

export async function updateAdminMenu(body: API.DevAdminMenuUpdateParams) {
  return devAdminRequest<{ ok: boolean }>('/v4/admin/menus/update', {
    method: 'POST',
    body,
  });
}

export async function deleteAdminMenu(id: number) {
  return devAdminRequest<{ ok: boolean }>('/v4/admin/menus/delete', {
    method: 'POST',
    body: { id },
  });
}

export async function listAdminPermissions(params?: {
  group_name?: string;
  resource?: string;
  action?: string;
}) {
  return devAdminRequest<{ items: API.DevAdminPermission[] }>('/v4/admin/permissions', {
    params,
  });
}
