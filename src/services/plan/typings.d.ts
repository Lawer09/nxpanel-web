declare namespace API {
  

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
}
