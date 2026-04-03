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

}
