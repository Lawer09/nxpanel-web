import { request } from '@umijs/max';
import type * as Types from './types';

// Projects
export async function getProjects(params?: Types.ProjectFetchRequest) {
  return request<API.ApiResponse<API.PageResult<Types.ProjectItem>>>('/v3/projects/', {
    method: 'GET',
    params,
  });
}

export async function getProjectDetail(id: number) {
  return request<API.ApiResponse<Types.ProjectItem>>(`/v3/projects/detail`, {
    method: 'GET',
    params: { id },
  });
}

export async function createProject(data: Types.ProjectStoreRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/create', {
    method: 'POST',
    data,
  });
}

export async function updateProject(data: Types.ProjectUpdateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/update', {
    method: 'POST',
    data,
  });
}

export async function updateProjectStatus(data: Types.ProjectStatusUpdateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/update-status', {
    method: 'POST',
    data,
  });
}

// Traffic Accounts
export async function getTrafficAccounts(projectId: number) {
  return request<API.ApiResponse<{ data: Types.ProjectTrafficAccount[] }>>('/v3/projects/traffic-accounts', {
    method: 'GET',
    params: { project_id: projectId },
  });
}

export async function createTrafficAccount(data: Types.ProjectTrafficAccountStoreRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/traffic-accounts/create', {
    method: 'POST',
    data,
  });
}

export async function updateTrafficAccount(data: Types.ProjectTrafficAccountUpdateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/traffic-accounts/update', {
    method: 'POST',
    data,
  });
}

export async function deleteTrafficAccount(data: Types.ProjectResourceIdRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/traffic-accounts/delete', {
    method: 'POST',
    data,
  });
}

// Ad Accounts
export async function getAdAccounts(projectId: number) {
  return request<API.ApiResponse<{ data: Types.ProjectAdAccount[] }>>('/v3/projects/ad-accounts', {
    method: 'GET',
    params: { project_id: projectId },
  });
}

export async function createAdAccount(data: Types.ProjectAdAccountStoreRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/ad-accounts/create', {
    method: 'POST',
    data,
  });
}

export async function updateAdAccount(data: Types.ProjectAdAccountUpdateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/ad-accounts/update', {
    method: 'POST',
    data,
  });
}

export async function deleteAdAccount(data: Types.ProjectResourceIdRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/ad-accounts/delete', {
    method: 'POST',
    data,
  });
}

// User Apps
export async function getUserApps(projectId: number) {
  return request<API.ApiResponse<{ data: Types.ProjectUserApp[] }>>('/v3/projects/user-apps', {
    method: 'GET',
    params: { project_id: projectId },
  });
}

export async function createUserApp(data: Types.ProjectUserAppStoreRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/user-apps/create', {
    method: 'POST',
    data,
  });
}

export async function updateUserApp(data: Types.ProjectUserAppUpdateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/user-apps/update', {
    method: 'POST',
    data,
  });
}

export async function deleteUserApp(data: Types.ProjectResourceIdRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/user-apps/delete', {
    method: 'POST',
    data,
  });
}

// Aggregation
export async function aggregateSync(data: Types.AggregateRequest) {
  return request<API.ApiResponse<any>>('/v3/projects/aggregate', {
    method: 'POST',
    data,
  });
}

export async function aggregateAsync(data: Types.AggregateRequest) {
  // Returns accepted etc directly or wrapped? Based on doc: returns the JSON
  return request<{ accepted: boolean; triggerId: string; startDate: string; endDate: string; status: string }>('/v3/projects/aggregate-async', {
    method: 'POST',
    data,
  });
}
