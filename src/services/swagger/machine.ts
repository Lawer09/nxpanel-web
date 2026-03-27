// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Get machine list GET /machine/fetch */
export async function getMachineList(
  params?: {
    page?: number;
    pageSize?: number;
    name?: string;
    status?: string;
    hostname?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    code: number;
    msg: string;
    data: {
      data: API.Machine[];
      total: number;
      pageSize: number;
      page: number;
    };
  }>('/machine/fetch', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create machine POST /machine/save */
export async function createMachine(body: API.Machine, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
    data: API.Machine;
  }>('/machine/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Update machine POST /machine/update */
export async function updateMachine(body: Partial<API.Machine>, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
    data: API.Machine;
  }>('/machine/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Get machine detail POST /machine/detail */
export async function getMachineDetail(params: { id: number }, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
    data: API.Machine;
  }>('/machine/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** Delete machine POST /machine/drop */
export async function deleteMachine(params: { id: number }, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
  }>('/machine/drop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** Batch delete machines POST /machine/batchDrop */
export async function batchDeleteMachines(params: { ids: number[] }, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
  }>('/machine/batchDrop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** Test connection POST /machine/testConnection */
export async function testMachineConnection(params: { id: number }, options?: { [key: string]: any }) {
  return request<{
    code: number;
    msg: string;
    data?: {
      status: string;
    };
  }>('/machine/testConnection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}