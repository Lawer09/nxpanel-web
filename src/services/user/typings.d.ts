declare namespace API {
  // ── 用户 ─────────────────────────────────────────────────────────────────────

  interface UserFilter {
    id: string;
    value: string | number | (string | number)[];
  }

  interface UserSort {
    id: string;
    desc: boolean;
  }

  interface UserPlanLite {
    id: number;
    name: string;
  }

  interface UserInviteLite {
    id: number;
    email: string;
  }

  interface UserGroupLite {
    id: number;
    name: string;
  }

  interface UserItem {
    id: number;
    email: string;
    token?: string;
    uuid?: string;
    invite_user_id?: number | null;
    plan_id?: number | null;
    group_id?: number | null;
    transfer_enable?: number | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    u?: number;
    d?: number;
    total_used?: number;
    banned?: boolean | number;
    is_admin?: boolean | number;
    is_staff?: boolean | number;
    balance?: number;
    commission_balance?: number;
    commission_rate?: number | null;
    commission_type?: number;
    discount?: number | null;
    expired_at?: number | null;
    last_login_at?: number | null;
    remarks?: string | null;
    subscribe_url?: string;
    created_at?: number;
    updated_at?: number;
    plan?: UserPlanLite;
    invite_user?: UserInviteLite;
    group?: UserGroupLite;
  }

  interface UserFetchParams {
    current?: number;
    pageSize?: number;
    filter?: UserFilter[];
    sort?: UserSort[];
  }

  interface UserUpdateParams {
    id: number;
    email?: string;
    password?: string;
    transfer_enable?: number | null;
    expired_at?: number | null;
    banned?: boolean | number;
    plan_id?: number | null;
    commission_rate?: number | null;
    discount?: number | null;
    is_admin?: boolean | number;
    is_staff?: boolean | number;
    u?: number;
    d?: number;
    balance?: number;
    commission_type?: number;
    commission_balance?: number;
    remarks?: string | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    invite_user_email?: string;
  }

  interface UserGenerateParams {
    email_suffix: string;
    email_prefix?: string;
    generate_count?: number;
    password?: string;
    plan_id?: number;
    expired_at?: number;
    download_csv?: boolean;
  }

  interface UserSendMailParams {
    subject: string;
    content: string;
    filter?: UserFilter[];
    sort?: UserSort[];
    sort_type?: string;
  }

  // ── 套餐 ─────────────────────────────────────────────────────────────────────

  type PlanResetTrafficMethod = 0 | 1 | 2 | 3 | 4 | null;

  interface PlanPrices {
    weekly?: number | null;
    monthly?: number | null;
    quarterly?: number | null;
    half_yearly?: number | null;
    yearly?: number | null;
    two_yearly?: number | null;
    three_yearly?: number | null;
    onetime?: number | null;
    reset_traffic?: number | null;
  }

  interface PlanGroupLite {
    id: number;
    name: string;
  }

  interface PlanItem {
    id: number;
    name: string;
    group_id?: number | null;
    transfer_enable: number;
    speed_limit?: number | null;
    device_limit?: number | null;
    capacity_limit?: number | null;
    show: boolean;
    renew: boolean;
    sell: boolean;
    sort: number;
    content?: string | null;
    reset_traffic_method?: PlanResetTrafficMethod;
    prices?: PlanPrices | null;
    tags?: string[] | null;
    group?: PlanGroupLite | null;
    users_count?: number;
    active_users_count?: number;
    created_at: number;
    updated_at: number;
  }

  interface PlanSaveParams {
    id?: number;
    name: string;
    transfer_enable: number;
    group_id?: number | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    capacity_limit?: number | null;
    content?: string | null;
    reset_traffic_method?: PlanResetTrafficMethod;
    prices?: PlanPrices | null;
    tags?: string[] | null;
    force_update?: boolean;
  }

  interface PlanUpdateParams {
    id: number;
    show?: boolean;
    renew?: boolean;
    sell?: boolean;
  }

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
