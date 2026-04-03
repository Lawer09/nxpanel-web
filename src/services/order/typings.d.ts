declare namespace API {
 
  // ── 订单 ─────────────────────────────────────────────────────────────────────

  type OrderStatus = 0 | 1 | 2 | 3 | 4;
  type OrderType = 1 | 2 | 3 | 4;

  type OrderPeriod =
    | 'monthly'
    | 'quarterly'
    | 'half_yearly'
    | 'yearly'
    | 'two_yearly'
    | 'three_yearly'
    | 'onetime'
    | 'reset_traffic';

  type OrderAssignPeriod =
    | 'month_price'
    | 'quarter_price'
    | 'half_year_price'
    | 'year_price'
    | 'two_year_price'
    | 'three_year_price'
    | 'onetime_price'
    | 'reset_price';

  interface OrderPlanLite {
    id: number;
    name: string;
  }

  interface OrderItem {
    id: number;
    user_id: number;
    plan_id: number;
    payment_id?: number | null;
    period: OrderPeriod | string;
    trade_no: string;
    total_amount: number;
    handling_amount?: number | null;
    balance_amount?: number | null;
    refund_amount?: number | null;
    surplus_amount?: number | null;
    discount_amount?: number | null;
    type: OrderType;
    status: OrderStatus;
    surplus_order_ids?: number[] | null;
    coupon_id?: number | null;
    invite_user_id?: number | null;
    commission_status?: number | null;
    commission_balance?: number | null;
    commission_rate?: number | null;
    actual_commission_balance?: number | null;
    paid_at?: number | null;
    callback_no?: string | null;
    plan?: OrderPlanLite | null;
    created_at: number;
    updated_at: number;
  }

  interface OrderDetail extends OrderItem {
    user?: UserItem;
    invite_user?: UserInviteLite;
    commission_log?: any;
    surplus_orders?: OrderItem[];
  }

  interface OrderFetchParams {
    current?: number;
    pageSize?: number;
    is_commission?: boolean;
    filter?: UserFilter[];
    sort?: UserSort[];
  }

  interface OrderAssignParams {
    plan_id: number;
    email: string;
    total_amount: number;
    period: OrderAssignPeriod;
  }
}
