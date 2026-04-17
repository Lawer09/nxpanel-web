import { request } from '@umijs/max';

// ── 工单 ─────────────────────────────────────────────────────────────────────

export async function fetchTickets(
  params: API.TicketFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.TicketFetchResult>>('/v3/ticket/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: params,
    ...(options || {}),
  });
}

export async function getTicketDetail(
  params: { id: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.TicketDetail>>('/v3/ticket/fetch', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

export async function replyTicket(
  body: API.TicketReplyParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/ticket/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

export async function closeTicket(
  body: API.TicketCloseParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<boolean>>('/v3/ticket/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}
