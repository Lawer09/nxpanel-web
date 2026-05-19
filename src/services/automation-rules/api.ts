import { request } from '@umijs/max';

export async function getAutomationRules(params: API.AutomationRuleListQuery) {
  return request<API.ApiResponse<any>>('/v3/automation-rules', {
    method: 'GET',
    params,
  });
}

export async function getAutomationRuleDetail(params: API.AutomationRuleDetailQuery) {
  return request<API.ApiResponse<API.AutomationRuleItem>>('/v3/automation-rules/detail', {
    method: 'GET',
    params,
  });
}

export async function getAutomationRuleModels(params: API.AutomationRuleModelsQuery) {
  return request<API.ApiResponse<API.AutomationRuleModelsResponse>>('/v3/automation-rules/models', {
    method: 'GET',
    params,
  });
}

export async function createAutomationRule(data: API.AutomationRuleUpsertBody) {
  return request<API.ApiResponse<{ id: number }>>('/v3/automation-rules/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateAutomationRule(data: API.AutomationRuleUpsertBody) {
  return request<API.ApiResponse<boolean>>('/v3/automation-rules/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function updateAutomationRuleStatus(data: API.AutomationRuleStatusBody) {
  return request<API.ApiResponse<boolean>>('/v3/automation-rules/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function runAutomationRule(data: API.AutomationRuleRunBody) {
  return request<API.ApiResponse<any>>('/v3/automation-rules/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function getAutomationRuleExecutions(params: API.AutomationRuleExecutionsQuery) {
  const res = await request<API.ApiResponse<any>>('/v3/automation-rules/executions', {
    method: 'GET',
    params,
  });

  if (
    Number((res as any)?.code) === 422
    && typeof params.module === 'string'
    && params.module.includes('_')
    && String((res as any)?.msg || '').includes('不支持的自动化模块')
  ) {
    return request<API.ApiResponse<any>>('/v3/automation-rules/executions', {
      method: 'GET',
      params: {
        ...params,
        module: params.module.replace(/_/g, '-'),
      },
    });
  }

  return res;
}
