import { clearDevAdminSession, getDevAdminSession, setDevAdminSession } from './session';
import { devAdminRequest } from './request';
import {
  createIamMenu,
  deleteIamMenu,
  listCurrentIamMenus,
  listIamMenus,
  listIamPermissions,
  updateIamMenu,
} from '@/services/iam/api';

export async function loginDevAdmin(body: API.DevAdminLoginParams) {
  const response = await devAdminRequest<API.DevAdminLoginData>('/v4/iam/auth/login', {
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
      await devAdminRequest<{ ok: boolean }>('/v4/iam/auth/logout', {
        method: 'POST',
        body: { refresh_token: session.refreshToken },
      });
    }
  } finally {
    clearDevAdminSession();
  }
}

export async function getCurrentDevAdmin() {
  return devAdminRequest<API.DevAdminUser>('/v4/iam/auth/me');
}

export async function listAdminMenus() {
  return listIamMenus() as Promise<API.DevAdminApiResponse<{ items: API.DevAdminMenu[] }>>;
}

export async function listCurrentAdminMenus() {
  return listCurrentIamMenus() as Promise<
    API.DevAdminApiResponse<{ items: API.DevAdminMenu[] }>
  >;
}

export async function createAdminMenu(body: API.DevAdminMenuCreateParams) {
  return createIamMenu(body);
}

export async function updateAdminMenu(body: API.DevAdminMenuUpdateParams) {
  return updateIamMenu(body);
}

export async function deleteAdminMenu(id: number) {
  return deleteIamMenu(id);
}

export async function listAdminPermissions(params?: {
  group_name?: string;
  resource?: string;
  action?: string;
}) {
  return listIamPermissions(params) as Promise<
    API.DevAdminApiResponse<{ items: API.DevAdminPermission[] }>
  >;
}
