import { request } from '@umijs/max';

const BASE_URL = '/invite-gift-card';

// 获取规则列表
export async function fetchInviteGiftCardRules(params: API.InviteGiftCardRuleListParams) {
  return request<API.ApiResponse<API.PageResult<API.InviteGiftCardRule>>>(`${BASE_URL}/rules`, {
    method: 'POST',
    data: params,
  });
}

// 获取规则详情
export async function getInviteGiftCardRuleDetail(params: { id: number }) {
  return request<API.ApiResponse<API.InviteGiftCardRule>>(`${BASE_URL}/detail-rule`, {
    method: 'POST',
    data: params,
  });
}

// 创建/编辑规则
export async function saveInviteGiftCardRule(params: API.InviteGiftCardRuleSaveParams) {
  return request<API.ApiResponse<API.InviteGiftCardRule>>(`${BASE_URL}/save-rule`, {
    method: 'POST',
    data: params,
  });
}

// 启用/禁用规则
export async function toggleInviteGiftCardRule(params: { id: number }) {
  return request<API.ApiResponse<{ id: number; status: boolean }>>(`${BASE_URL}/toggle-rule`, {
    method: 'POST',
    data: params,
  });
}

// 删除规则
export async function deleteInviteGiftCardRule(params: { id: number }) {
  return request<API.ApiResponse<boolean>>(`${BASE_URL}/delete-rule`, {
    method: 'POST',
    data: params,
  });
}

// 批量删除规则
export async function batchDeleteInviteGiftCardRules(params: { ids: number[] }) {
  return request<API.ApiResponse<API.InviteGiftCardBatchDeleteResult>>(
    `${BASE_URL}/batch-delete-rules`,
    {
      method: 'POST',
      data: params,
    },
  );
}

// 获取发放日志
export async function fetchInviteGiftCardLogs(params: API.InviteGiftCardLogListParams) {
  return request<API.ApiResponse<API.PageResult<API.InviteGiftCardLog>>>(`${BASE_URL}/logs`, {
    method: 'POST',
    data: params,
  });
}

// 获取统计数据
export async function getInviteGiftCardStatistics() {
  return request<API.ApiResponse<API.InviteGiftCardStatistics>>(`${BASE_URL}/statistics`, {
    method: 'GET',
  });
}

// 获取可用礼品卡模板
export async function getGiftCardTemplates() {
  return request<API.ApiResponse<API.GiftCardTemplate[]>>(`${BASE_URL}/templates`, {
    method: 'GET',
  });
}

// 获取配置选项
export async function getInviteGiftCardOptions() {
  return request<API.ApiResponse<API.InviteGiftCardOptions>>(`${BASE_URL}/options`, {
    method: 'GET',
  });
}
