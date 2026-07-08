import { request } from '@umijs/max';

export type AutomationRuleCondition = {
  metricType?: string;
  operatorType?: string;
  thresholdValue?: number;
  sortOrder?: number;
};

export type AutomationRulePayload = {
  id?: string | number;
  name?: string;
  description?: string;
  status?: number;
  targetType?: string;
  ownershipLevel?: string;
  scopeLevel?: string;
  scopeRefs?: string[];
  metricType?: string;
  operatorType?: string;
  thresholdValue?: number;
  conditions?: AutomationRuleCondition[];
  actionType?: string;
  windowType?: string;
  observeStartDate?: string;
  observeEndDate?: string;
  retryTimes?: number;
  feishuNotificationEnabled?: boolean;
  feishuWebhook?: string;
};

export type EvaluateAutomationRuleRequest = {
  evaluateDate?: string;
  dryRun?: boolean;
};

export type EvaluateAutomationMatchedItem = {
  objectId?: string;
  reason?: string;
  metrics?: Record<string, any>;
  dryRun?: boolean;
  action?: string;
  retryTimes?: number;
  currentRetryCount?: number;
  remainingRetryCount?: number;
  willExecuteAction?: boolean;
};

export type EvaluateAutomationRuleResponse = {
  ruleId?: string | number;
  evaluateDate?: string;
  dryRun?: boolean;
  matchedCount?: number;
  message?: string;
  matched?: EvaluateAutomationMatchedItem[];
};

export async function getAutomationRulePage(params: any) {
  return request<AdsConsole.Result<AdsConsole.PageResult<any>>>('/ads-api/automation/rule/page', {
    method: 'GET',
    params,
  });
}

export async function getAutomationRuleDetail(id: string) {
  return request<AdsConsole.Result<any>>(`/ads-api/automation/rule/${id}`, {
    method: 'GET',
  });
}

export async function addAutomationRule(body: AutomationRulePayload) {
  return request<AdsConsole.Result<null>>('/ads-api/automation/rule', {
    method: 'POST',
    data: body,
  });
}

export async function updateAutomationRule(body: AutomationRulePayload) {
  return request<AdsConsole.Result<null>>('/ads-api/automation/rule', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteAutomationRule(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/automation/rule/${id}`, {
    method: 'DELETE',
  });
}

export async function updateAutomationRuleStatus(id: string, status: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/automation/rule/${id}/status`, {
    method: 'POST',
    data: { status },
  });
}

export async function evaluateAutomationRule(id: string, body?: EvaluateAutomationRuleRequest) {
  return request<AdsConsole.Result<EvaluateAutomationRuleResponse>>(`/ads-api/automation/rule/${id}/evaluate`, {
    method: 'POST',
    data: body || { dryRun: true },
  });
}

export async function getAutomationScopeLevels() {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>('/ads-api/automation/options/scope-levels', {
    method: 'GET',
  });
}

export async function getAutomationOwnershipLevels() {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>('/ads-api/automation/options/ownership-levels', {
    method: 'GET',
  });
}

export async function getAutomationScopeRefs(params: { scopeLevel: string }) {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>('/ads-api/automation/options/scope-refs', {
    method: 'GET',
    params,
  });
}

export async function getAutomationTargetTypes() {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>('/ads-api/automation/options/target-types', {
    method: 'GET',
  });
}

export async function testFeishuWebhook(body: { webhook: string }) {
  return request<AdsConsole.Result<string>>('/ads-api/automation/rule/feishu/test', {
    method: 'POST',
    data: body,
  });
}

