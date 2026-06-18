import { devAdminRequest } from '@/services/dev-admin/request';

const IAM_PREFIX = '/v4/iam';

const toQueryParams = (params?: Record<string, any>) =>
  params as Record<string, unknown> | undefined;

export async function listIamUsers(params?: { page?: number; page_size?: number }) {
  return devAdminRequest<API.IamPageResult<API.IamUser>>(`${IAM_PREFIX}/users`, {
    params: toQueryParams(params),
  });
}

export async function getIamUser(userId: number) {
  return devAdminRequest<API.IamUser>(`${IAM_PREFIX}/users/${userId}`);
}

export async function createIamUser(body: API.IamUserCreateParams) {
  return devAdminRequest<{ id: number }>(`${IAM_PREFIX}/users/create`, {
    method: 'POST',
    body,
  });
}

export async function updateIamUser(body: API.IamUserUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/users/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteIamUser(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/users/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function resetIamUserPassword(id: number, newPassword: string) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/users/reset-password`, {
    method: 'POST',
    body: { id, new_password: newPassword },
  });
}

export async function assignIamUserRoles(body: API.IamUserAssignRolesParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/users/assign-roles`, {
    method: 'POST',
    body,
  });
}

export async function listIamRoles() {
  return devAdminRequest<{ items: API.IamRole[] }>(`${IAM_PREFIX}/roles`);
}

export async function getIamRole(roleId: number) {
  return devAdminRequest<API.IamRole>(`${IAM_PREFIX}/roles/${roleId}`);
}

export async function createIamRole(body: API.IamRoleCreateParams) {
  return devAdminRequest<{ id: number }>(`${IAM_PREFIX}/roles/create`, {
    method: 'POST',
    body,
  });
}

export async function updateIamRole(body: API.IamRoleUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/roles/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteIamRole(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/roles/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function listIamRolePermissions(roleId: number) {
  return devAdminRequest<{ items: API.IamPermission[] }>(
    `${IAM_PREFIX}/roles/${roleId}/permissions`,
  );
}

export async function assignIamRolePermissions(body: API.IamRoleAssignPermissionsParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/roles/assign-permissions`, {
    method: 'POST',
    body,
  });
}

export async function listIamPermissions(params?: {
  group_name?: string;
  resource?: string;
  action?: string;
}) {
  return devAdminRequest<{ items: API.IamPermission[] }>(`${IAM_PREFIX}/permissions`, {
    params: toQueryParams(params),
  });
}

export async function listIamMenus() {
  return devAdminRequest<{ items: API.IamMenu[] }>(`${IAM_PREFIX}/menus`);
}

export async function listCurrentIamMenus() {
  return devAdminRequest<{ items: API.IamMenu[] }>(`${IAM_PREFIX}/menus/current`);
}

export async function createIamMenu(body: API.IamMenuCreateParams) {
  return devAdminRequest<{ id: number }>(`${IAM_PREFIX}/menus/create`, {
    method: 'POST',
    body,
  });
}

export async function updateIamMenu(body: API.IamMenuUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/menus/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteIamMenu(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/menus/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function listIamClients(params?: { page?: number; page_size?: number }) {
  return devAdminRequest<API.IamPageResult<API.IamClient>>(`${IAM_PREFIX}/clients`, {
    params: toQueryParams(params),
  });
}

export async function getIamClient(clientId: string) {
  return devAdminRequest<API.IamClient>(
    `${IAM_PREFIX}/clients/${encodeURIComponent(clientId)}`,
  );
}

export async function createIamClient(body: API.IamClientCreateParams) {
  return devAdminRequest<API.IamClientSecretResult>(`${IAM_PREFIX}/clients/create`, {
    method: 'POST',
    body,
  });
}

export async function updateIamClient(body: API.IamClientUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/clients/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteIamClient(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/clients/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function resetIamClientSecret(id: number) {
  return devAdminRequest<API.IamClientSecretResult>(`${IAM_PREFIX}/clients/reset-secret`, {
    method: 'POST',
    body: { id },
  });
}

export async function assignIamClientRoles(body: API.IamClientAssignRolesParams) {
  return devAdminRequest<{ ok: boolean }>(`${IAM_PREFIX}/clients/assign-roles`, {
    method: 'POST',
    body,
  });
}

export async function listIamAuditLogs(params?: { page?: number; page_size?: number }) {
  return devAdminRequest<API.IamPageResult<API.IamAuditLog>>(`${IAM_PREFIX}/audit-logs`, {
    params: toQueryParams(params),
  });
}
