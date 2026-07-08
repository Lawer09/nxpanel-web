import {request} from '@umijs/max';

/** 获取用户分页（GET /ads-api/sys/user/page） */
export async function getUserPage(params: {
  current?: number;
  size?: number;
  username?: string;
  teamId?: string;
  realName?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysUser>>>('/ads-api/sys/user/page', {
    method: 'GET',
    params,
  });
}

/** 新增用户 */
export async function addUser(body: {
  username: string;
  password: string;
  teamId?: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  remark?: string;
  roleIds?: string[];
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/user', {
    method: 'POST',
    data: body,
  });
}

/** 更新用户（PUT /ads-api/sys/user，id 在 body 中） */
export async function updateUser(body: {
  id: string;
  teamId?: string;
  realName?: string;
  email?: string;
  phone?: string;
  status?: number;
  remark?: string;
  roleIds?: string[];
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/user', {
    method: 'PUT',
    data: body,
  });
}

/** 删除用户 */
export async function deleteUser(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/user/${id}`, {
    method: 'DELETE',
  });
}

/** 重置密码（PUT /ads-api/sys/user/{id}/password?password=xxx） */
export async function resetPassword(id: string, password: string = 'Admin@123') {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/user/${id}/password`, {
    method: 'PUT',
    params: {password},
  });
}

/** 获取用户已绑定的角色ID列表 */
export async function getUserRoleIds(id: string) {
  return request<AdsConsole.Result<string[]>>(`/ads-api/sys/user/${id}/roles`, {
    method: 'GET',
  });
}

/** 获取用户下拉选项（GET /ads-api/sys/user/options） */
export async function getUserOptions() {
  return request<AdsConsole.Result<{ label: string; value: string }[]>>('/ads-api/sys/options/users', {
    method: 'GET',
  });
}

