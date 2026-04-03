import { request } from '@umijs/max';

// ── 套餐 ─────────────────────────────────────────────────────────────────────

export async function fetchPlans(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.PlanItem[]>>('/v3/plan/fetch', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function savePlan(body: API.PlanSaveParams, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/plan/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updatePlan(body: API.PlanUpdateParams, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/plan/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dropPlan(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/plan/drop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function sortPlans(body: { ids: number[] }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/plan/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}