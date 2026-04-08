declare namespace API {
  // 触发类型
  type TriggerType = 'register' | 'order_paid';

  // 发放对象
  type TargetType = 'inviter' | 'invitee' | 'both';

  // 订单类型
  type OrderType = 1 | 2 | 3; // 1新购 2续费 3升级

  // 礼品卡模板
  interface GiftCardTemplate {
    id: number;
    name: string;
    type: number;
    description?: string;
    icon?: string;
    theme_color?: string;
    status?: boolean;
    rewards?: {
      balance?: number;
      transfer_enable?: number;
    };
  }

  // 邀请礼品卡规则
  interface InviteGiftCardRule {
    id: number;
    name: string;
    trigger_type: TriggerType;
    template_id: number;
    target: TargetType;
    auto_redeem: boolean;
    min_order_amount?: number;
    order_type?: OrderType | null;
    max_issue_per_user?: number;
    expires_hours?: number | null;
    status: boolean;
    sort?: number;
    description?: string;
    created_at: number;
    updated_at: number;
    template?: GiftCardTemplate;
    statistics?: {
      total_issued: number;
      auto_redeemed_count: number;
      unique_recipients: number;
      unique_triggers: number;
    };
  }

  // 规则保存参数
  interface InviteGiftCardRuleSaveParams {
    id?: number;
    name: string;
    trigger_type: TriggerType;
    template_id: number;
    target: TargetType;
    auto_redeem: boolean;
    min_order_amount?: number;
    order_type?: OrderType | null;
    max_issue_per_user?: number;
    expires_hours?: number | null;
    status?: boolean;
    sort?: number;
    description?: string;
  }

  // 规则列表查询参数
  interface InviteGiftCardRuleListParams {
    current?: number;
    pageSize?: number;
    trigger_type?: TriggerType;
    status?: boolean;
    search?: string;
  }

  // 发放日志
  interface InviteGiftCardLog {
    id: number;
    rule_id: number;
    trigger_type: TriggerType;
    trigger_user_id: number;
    recipient_user_id: number;
    code_id: number;
    order_id?: number | null;
    auto_redeemed: boolean;
    metadata?: {
      template_name?: string;
      rule_name?: string;
      order_amount?: number | null;
    };
    created_at: number;
    rule?: {
      id: number;
      name: string;
      trigger_type: TriggerType;
    };
    trigger_user?: {
      id: number;
      email: string;
    };
    recipient_user?: {
      id: number;
      email: string;
    };
    code?: {
      id: number;
      code: string;
      status: number;
      used_at?: number;
    };
    order?: {
      id: number;
      trade_no: string;
      total_amount: number;
    } | null;
  }

  // 日志查询参数
  interface InviteGiftCardLogListParams {
    current?: number;
    pageSize?: number;
    rule_id?: number;
    trigger_type?: TriggerType;
    recipient_user_id?: number;
    auto_redeemed?: boolean;
    date_range?: [string, string];
  }

  // 统计数据
  interface InviteGiftCardStatistics {
    total_rules: number;
    active_rules: number;
    total_issued: number;
    auto_redeemed_count: number;
    pending_count: number;
    by_trigger_type: {
      register: number;
      order_paid: number;
    };
    recent_days: Array<{
      date: string;
      count: number;
    }>;
    top_rules: Array<{
      id: number;
      name: string;
      count: number;
    }>;
  }

  // 批量删除结果
  interface InviteGiftCardBatchDeleteResult {
    deleted: number[];
    failed: Array<{
      id: number;
      name: string;
      reason: string;
    }>;
    deleted_count: number;
    failed_count: number;
  }

  // 配置选项
  interface InviteGiftCardOptions {
    trigger_types: Record<string, string>;
    targets: Record<string, string>;
    order_types: Record<string, string>;
  }
}
