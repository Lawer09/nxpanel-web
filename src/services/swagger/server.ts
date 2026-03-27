import { request } from '@umijs/max';

export async function getServerNodes(options?: { [key: string]: any }) {
  return request<{ data: API.ServerNode[] }>('/server/manage/getNodes', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function saveServerNode(
  body: API.ServerNodeSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateServerNode(
  body: API.ServerNodeUpdateParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerNode(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/manage/drop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function copyServerNode(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerNode }>('/server/manage/copy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function sortServerNodes(
  body: API.ServerNodeSortItem[],
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/manage/sort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function fetchServerGroups(options?: { [key: string]: any }) {
  return request<{ data: API.ServerGroup[] }>('/server/group/fetch', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function saveServerGroup(
  body: API.ServerGroupSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerGroup }>('/server/group/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerGroup(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/group/drop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function fetchServerRoutes(options?: { [key: string]: any }) {
  return request<{ data: API.ServerRoute[] }>('/server/route/fetch', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function saveServerRoute(
  body: API.ServerRouteSaveParams,
  options?: { [key: string]: any },
) {
  return request<{ data: API.ServerRoute }>('/server/route/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function dropServerRoute(
  body: { id: number },
  options?: { [key: string]: any },
) {
  return request<{ data: null }>('/server/route/drop', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
