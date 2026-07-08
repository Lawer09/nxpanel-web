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

  interface RegisterMetadata {
    ip?: string;
    app_id?: string;
    app_version?: string;
    brand?: string;
    channel_type?: string;
    click_ts?: number;
    city?: string;
    country?: string;
    install_begin_ts?: number;
    platform?: string;
    package_name?: string;
    raw_referrer?: string;
    timestamp?: string;
    utm_medium?: string;
    utm_source?: string;
  }

  interface UserItem {
    id: number;
    email: string;
    ip?: string | null;
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
    report_traffic?: number | string;
    updated_at?: number;
    plan?: UserPlanLite;
    invite_user?: UserInviteLite;
    group?: UserGroupLite;
    register_metadata?: RegisterMetadata;
    user_type?: 'global' | 'define' | string | null;
    menus?: string[] | null;
  }

  interface UserFetchParams {
    id?: string;
    current?: number;
    pageSize?: number;
    onlyBanned?: boolean;
    createdAtFrom?: string | number;
    createdAtTo?: string | number;
    meta?: Record<string, string | number>;
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
    register_metadata?: RegisterMetadata;
    user_type?: 'global' | 'define' | string;
    menus?: string[];
  }

  interface UserGenerateParams {
    email_suffix: string;
    email_prefix?: string;
    generate_count?: number;
    password?: string;
    plan_id?: number;
    expired_at?: number;
    download_csv?: boolean;
    user_type?: 'global' | 'define' | string;
    menus?: string[];
  }

  interface UserSendMailParams {
    subject: string;
    content: string;
    filter?: UserFilter[];
    sort?: UserSort[];
    sort_type?: string;
  }

  interface BlockedIpUserLite {
    id: number;
    email: string;
  }

  interface UserBlockedIpItem {
    id: number;
    ip: string;
    type?: string | null;
    reason?: string | null;
    metadata?: Record<string, any> | null;
    banned_user_id?: number | null;
    operator_user_id?: number | null;
    banned_user?: BlockedIpUserLite | null;
    operator_user?: BlockedIpUserLite | null;
    created_at?: number;
    updated_at?: number;
  }

  interface UserBlockedIpFetchParams {
    ip?: string;
    bannedUserId?: number;
    operatorUserId?: number;
    current?: number;
    pageSize?: number;
  }

  interface UserBlockedIpBatchDeleteResult {
    deletedCount: number;
    requestedCount: number;
    missingIds?: number[];
  }

  interface UserBlockedIpUpdateTypeParams {
    id: number;
    type: string;
  }

  interface UserBlockedIpBatchBlockParams {
    ips: string[];
    type?: 'normal' | 'dangerous' | string;
    banUsers?: boolean;
    reason?: string;
  }

  interface UserBlockedIpBatchBlockResult {
    requestedCount: number;
    blockedIpCount: number;
    blockedIps: string[];
    bannedUserCount: number;
    bannedUserIds: number[];
  }

  interface UserAllowedIpItem {
    id: number;
    ip: string;
    reason?: string | null;
    metadata?: Record<string, any> | null;
    operator_user_id?: number | null;
    operator_user?: BlockedIpUserLite | null;
    created_at?: number;
    updated_at?: number;
  }

  interface UserAllowedIpFetchParams {
    ip?: string;
    operatorUserId?: number;
    current?: number;
    pageSize?: number;
  }

  interface UserAllowedIpSaveParams {
    ips: string[];
    reason?: string;
  }

  interface UserAllowedIpSaveResult {
    requestedCount: number;
    allowedIpCount: number;
    allowedIps: string[];
  }

  interface UserAllowedIpBatchDeleteResult {
    deletedCount: number;
    requestedCount: number;
    missingIds?: number[];
  }

  interface AidLoginBanRuleWeeklyWindow {
    weekday: number;
    start: string;
    end: string;
  }

  interface AidLoginBanRuleDateWindow {
    date: string;
    start: string;
    end: string;
  }

  interface AidLoginBanRuleUserLite {
    id: number;
    email: string;
  }

  interface AidLoginBanRuleItem {
    id: number;
    name: string;
    enabled: boolean;
    timezone?: string | null;
    cutoffAt?: string | null;
    weeklyWindows?: AidLoginBanRuleWeeklyWindow[];
    dateWindows?: AidLoginBanRuleDateWindow[];
    packageNames?: string[];
    projectCodes?: string[];
    countries?: string[];
    reason?: string | null;
    createdBy?: AidLoginBanRuleUserLite | null;
    updatedBy?: AidLoginBanRuleUserLite | null;
    createdAt?: number;
    updatedAt?: number;
  }

  interface AidLoginBanRuleFetchParams {
    enabled?: boolean;
    packageName?: string;
    country?: string;
    current?: number;
    pageSize?: number;
  }

  interface AidLoginBanRuleSaveParams {
    name: string;
    enabled?: boolean;
    timezone: string;
    cutoffAt?: string | null;
    weeklyWindows?: AidLoginBanRuleWeeklyWindow[];
    dateWindows?: AidLoginBanRuleDateWindow[];
    packageNames?: string[];
    projectCodes?: string[];
    countries?: string[];
    reason?: string;
  }

  interface AidLoginBanRuleUpdateParams {
    id: number;
    name?: string;
    enabled?: boolean;
    timezone?: string;
    cutoffAt?: string | null;
    weeklyWindows?: AidLoginBanRuleWeeklyWindow[];
    dateWindows?: AidLoginBanRuleDateWindow[];
    packageNames?: string[];
    projectCodes?: string[];
    countries?: string[];
    reason?: string;
  }

  interface IpAllowlistRuleUserLite {
    id: number;
    email: string;
  }

  interface IpAllowlistRuleItem {
    id: number;
    name: string;
    enabled: boolean;
    countries?: string[];
    projectCodes?: string[];
    packageNames?: string[];
    reason?: string | null;
    createdBy?: IpAllowlistRuleUserLite | null;
    updatedBy?: IpAllowlistRuleUserLite | null;
    createdAt?: number;
    updatedAt?: number;
  }

  interface IpAllowlistRuleFetchParams {
    enabled?: boolean;
    country?: string;
    projectCode?: string;
    packageName?: string;
    current?: number;
    pageSize?: number;
  }

  interface IpAllowlistRuleSaveParams {
    name: string;
    enabled?: boolean;
    countries?: string[];
    projectCodes?: string[];
    packageNames?: string[];
    reason?: string;
  }

  interface IpAllowlistRuleUpdateParams {
    id: number;
    name?: string;
    enabled?: boolean;
    countries?: string[];
    projectCodes?: string[];
    packageNames?: string[];
    reason?: string;
  }

}
