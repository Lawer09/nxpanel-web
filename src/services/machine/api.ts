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
  return request<API.ApiResponse<API.PageData<API.Machine>>>('/machine/fetch', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

export async function createMachine(body: API.Machine, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/machine/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateMachine(body: Partial<API.Machine>, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/machine/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function getMachineDetail(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/machine/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function deleteMachine(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.Machine>>('/machine/drop', {
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
  return request<API.ApiResponse<API.Machine>>('/machine/batchDrop', {
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
  return request<API.ApiResponse<{ status: string }>>('/machine/testConnection', {
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
  return request<API.ApiResponse<{ task_id: number; template_id: number }>>('/machine/deployNode', {
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
  return request<API.ApiResponse<API.BatchDeployResult>>('/machine/batchDeploy', {
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
  return request<API.ApiResponse<any>>('/machine/deployStatus', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function clearNode(params: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<{ output: string; exit_code: number }>>('/machine/clearNode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}
