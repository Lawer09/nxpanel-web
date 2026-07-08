import {request} from '@umijs/max';

/** 获取权限树-启用（GET /ads-api/sys/permission/tree） */
export async function getPermissionTree() {
  return request<AdsConsole.Result<AdsConsole.SysPermission[]>>('/ads-api/sys/permission/tree', {
    method: 'GET',
  });
}

/** 获取权限树-所有（GET /ads-api/sys/permission/list） */
export async function getPermissionList() {
  return request<AdsConsole.Result<AdsConsole.SysPermission[]>>('/ads-api/sys/permission/list', {
    method: 'GET',
  });
}

/** 新增权限 */
export async function addPermission(body: {
  parentId?: string;
  name?: string;
  type?: number;
  permissionCode?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/permission', {
    method: 'POST',
    data: body,
  });
}

/** 更新权限（PUT /ads-api/sys/permission，id 在 body 中） */
export async function updatePermission(body: {
  id: number;
  parentId?: number;
  name?: string;
  type?: number;
  permissionCode?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/permission', {
    method: 'PUT',
    data: body,
  });
}

/** 删除权限 */
export async function deletePermission(id: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/permission/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取当前登录用户可见的菜单树（用于动态路由渲染）
 * GET /ads-api/auth/menus
 * 后端根据用户角色过滤，只返回该用户有权限的 type=1 菜单节点
 */
export async function getUserMenuTree() {
  return request<AdsConsole.Result<AdsConsole.SysPermission[]>>('/ads-api/auth/menus', {
    method: 'GET',
  });
}

