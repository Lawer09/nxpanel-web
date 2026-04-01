import { request } from '@umijs/max';

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

export async function getOrderDetail(
  body: { id: number },
  options?: { [key: string]: any },
) {
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
