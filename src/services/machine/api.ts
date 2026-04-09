import { request } from '@umijs/max';

export async function getMachineList(
  params?: {
    page?: number;
    pageSize?: number;
    name?: string;
    status?: string;
    hostname?: string;
    tags?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.Machine>>>('/v3/machine/fetch', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

export async function createMachine(body: API.Machine, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/v3/machine/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateMachine(body: Partial<API.Machine>, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/v3/machine/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function getMachineDetail(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/v3/machine/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function deleteMachine(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/v3/machine/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function batchDeleteMachines(
  params: { ids: number[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.Machine>>('/v3/machine/batchDrop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function testMachineConnection(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ status: string }>>('/v3/machine/testConnection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function deployNode(
  params: { id: number; template_id?: number; deploy_config?: Record<string, any> },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ task_id: number; template_id: number }>>('/v3/machine/deployNode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function batchDeploy(
  params: {
    machine_ids: number[];
    template_id?: number;
    deploy_config?: Record<string, any>;
    machine_configs?: Record<string, Record<string, any>>;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchDeployResult>>('/v3/machine/batchDeploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function deployStatus(
  params: { task_id?: number; batch_id?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<any>>('/v3/machine/deployStatus', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function clearNode(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<{ output: string; exit_code: number }>>('/v3/machine/clearNode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function switchMachineIp(
  body: {
    machine_id: number;
    ip_id: number;
    set_as_primary?: boolean;
    set_as_egress?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.SwitchMachineIpResult>>('/v3/machine/switchIp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function batchImportMachines(
  body: { items: Partial<API.Machine>[] },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.BatchImportMachinesResult>>('/v3/machine/batchImport', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
