import { request } from '@umijs/max';

// ── 用户 ─────────────────────────────────────────────────────────────────────

export async function fetchUsers(
  params: API.UserFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.UserItem[]; total: number }>>('/v3/user/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function getUserInfoById(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserItem>>('/v3/user/getUserInfoById', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function updateUser(
  body: API.UserUpdateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function generateUser(
  body: API.UserGenerateParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<any>>('/v3/user/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function dumpUserCSV(
  body: { filter?: API.UserFilter[]; sort?: API.UserSort[] },
  options?: { [key: string]: any },
) {
  return request<Blob>('/v3/user/dumpCSV', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    responseType: 'blob',
    ...(options || {}),
  });
}

export async function sendUserMail(
  body: API.UserSendMailParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/sendMail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function banUsers(
  body: { filter?: API.UserFilter[]; sort_type?: string; sort?: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/user/ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function resetUserSecret(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/resetSecret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function destroyUser(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<boolean>>('/v3/user/destroy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

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

// ── 订单 ─────────────────────────────────────────────────────────────────────

export async function fetchOrders(
  params: API.OrderFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<{ data: API.OrderItem[]; total: number }>>('/v3/order/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function getOrderDetail(body: { id: number }, options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.OrderDetail>>('/v3/order/detail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function payOrder(
  body: { trade_no: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/order/paid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function cancelOrder(
  body: { trade_no: string },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/order/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function updateOrder(
  body: { trade_no: string; commission_status?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/order/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function assignOrder(
  body: API.OrderAssignParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<string>>('/v3/order/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
