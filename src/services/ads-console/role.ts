import {request} from '@umijs/max';

/** 角色分页 */
export async function getRolePage(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysRole>>>('/ads-api/sys/role/page', {
    method: 'GET',
    params,
  });
}

/** 获取全部角色（下拉用，GET /ads-api/sys/role/all） */
export async function getRoleAll() {
  return request<AdsConsole.Result<AdsConsole.SysRole[]>>('/ads-api/sys/role/all', {
    method: 'GET',
  });
}

/** 兼容旧调用 */
export const getRoleList = getRoleAll;

/** 新增角色 */
export async function addRole(body: {
  name: string;
  code: string;
  status?: number;
  sort?: number;
  remark?: string;
  permissionIds?: string[];
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/role', {
    method: 'POST',
    data: body,
  });
}

/** 更新角色（PUT /ads-api/sys/role，id 在 body 中） */
export async function updateRole(body: {
  id: number;
  name?: string;
  code?: string;
  status?: number;
  sort?: number;
  remark?: string;
  permissionIds?: string[];
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/role', {
    method: 'PUT',
    data: body,
  });
}

/** 删除角色 */
export async function deleteRole(id: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/role/${id}`, {
    method: 'DELETE',
  });
}

/** 获取角色已有权限 ID 列表 */
export async function getRolePermissions(roleId: number) {
  return request<AdsConsole.Result<string[]>>(`/ads-api/sys/role/${roleId}/permissions`, {
    method: 'GET',
  });
}

/** 分配权限（通过 updateRole 接口，将 permissionIds 放入 body） */
export async function assignPermissions(roleId: number, permissionIds: string[]) {
  return updateRole({id: roleId, permissionIds});
}

