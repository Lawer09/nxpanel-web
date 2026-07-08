declare namespace API {
  interface AutomationRuleCondition {
    metric: string;
    operator: string;
    value: any;
  }

  interface AutomationRuleModelItem {
    model: string;
    name: string;
    module: string;
    default?: boolean;
  }

  interface AutomationRuleModelsResponse {
    module: string;
    models: AutomationRuleModelItem[];
  }

  interface AutomationRuleAction {
    type: string;
    template?: string;
    recoverTemplate?: string;
    subject?: string;
    recoverSubject?: string;
    toAdmin?: boolean | number;
    recipients?: string[];
    webhookUrl?: string;
    headers?: Record<string, any>;
    timeoutSeconds?: number;
    signing?: {
      enabled?: number;
      secret?: string;
      timestampHeader?: string;
      signatureHeader?: string;
    };
    sourceAccountId?: number;
    amountGb?: number;
    params?: Record<string, any>;
  }

  interface AutomationRuleItem {
    id: number;
    module: string;
    name: string;
    description?: string;
    targetType: string;
    targetScope?: Record<string, any>;
    targetScopeJson?: Record<string, any>;
    conditionLogic: 'all' | 'any';
    conditions?: AutomationRuleCondition[];
    actions?: AutomationRuleAction[];
    conditionsJson?: AutomationRuleCondition[];
    actionsJson?: AutomationRuleAction[];
    cooldownSeconds: number;
    recoveryEnabled: number;
    enabled: number;
    lastExecutionStatus?: string;
    updatedAt?: string;
    createdAt?: string;
  }

  interface AutomationRuleExecutionItem {
    status: 'triggered' | 'recovered' | 'skipped' | 'failed' | string;
    rule_id?: number;
    ruleId?: number;
    rule_name?: string;
    ruleName?: string;
    target_type?: string;
    targetType?: string;
    target_id?: string;
    targetId?: string;
    target_name?: string;
    targetName?: string;
    metrics_snapshot?: Record<string, any>;
    metricsSnapshot?: Record<string, any>;
    matched_conditions?: any[];
    matchedConditions?: any[];
    actions_snapshot?: any[];
    actionsSnapshot?: any[];
    action_results?: any[];
    actionResults?: any[];
    error_message?: string;
    errorMessage?: string;
    executed_at?: string;
    executedAt?: string;
  }

  interface AutomationRuleListQuery {
    module: string;
    keyword?: string;
    enabled?: number;
    targetType?: string;
    page?: number;
    pageSize?: number;
  }

  interface AutomationRuleDetailQuery {
    id: number;
    module: string;
  }

  interface AutomationRuleUpsertBody {
    module: string;
    id?: number;
    name: string;
    description?: string;
    targetType: string;
    targetScope: Record<string, any>;
    conditionLogic: 'all' | 'any';
    conditions: AutomationRuleCondition[];
    actions: AutomationRuleAction[];
    cooldownSeconds: number;
    recoveryEnabled: number;
    enabled: number;
  }

  interface AutomationRuleStatusBody {
    module: string;
    id: number;
    enabled: number;
  }

  interface AutomationRuleRunBody {
    module: string;
    ruleId?: number;
    targetIds?: string[];
    dryRun?: number;
  }

  interface AutomationRuleModelsQuery {
    module: string;
  }

  interface AutomationRuleExecutionsQuery {
    module: string;
    ruleId?: number;
    targetId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }
}
