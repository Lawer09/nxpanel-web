declare namespace API {
  // ── 广告账号 ────────────────────────────────────────────────────────────────

  interface AdAccount {
    id: number;
    source_platform: string;
    account_name: string;
    account_label: string;
    auth_type: string;
    status: string;
    tags: string[];
    assigned_server_id: string;
    backup_server_id: string;
    isolation_group: string;
    reporting_timezone: string;
    currency_code: string;
    created_at: string;
    updated_at: string;
  }

  interface AdAccountUpsertRequest {
    source_platform: string;
    account_name: string;
    account_label?: string;
    auth_type: string;
    credentials_json: Record<string, any>;
    status: string;
    tags?: string[];
    assigned_server_id?: string;
    backup_server_id?: string;
    isolation_group?: string;
  }

  interface AdAccountPagedResponse {
    page: number;
    size: number;
    total: number;
    items: AdAccount[];
  }

  interface AdAccountQuery {
    source_platform?: string;
    status?: string;
    assigned_server_id?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }

  interface BatchAssignServerRequest {
    account_ids: number[];
    assigned_server_id: string;
    backup_server_id?: string;
    isolation_group?: string;
  }

  // ── 项目映射 ────────────────────────────────────────────────────────────────

  interface ProjectMapping {
    id: number;
    project_id: number;
    source_platform: string;
    account_id: number;
    provider_app_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

  interface ProjectMappingUpsertRequest {
    project_id: number;
    source_platform: string;
    account_id: number;
    provider_app_id: string;
    status: string;
  }

  // ── 同步服务器 ──────────────────────────────────────────────────────────────

  interface SyncServer {
    server_id: string;
    server_name: string;
    host_ip: string;
    status: string;
    last_heartbeat_at: string;
    tags: string[];
  }

  interface SyncServerCreateRequest {
    server_id: string;
    server_name: string;
    host_ip?: string;
    tags?: string[];
  }

  // ── 同步状态 & 日志 ────────────────────────────────────────────────────────

  interface SyncState {
    id: number;
    scope: string;
    account_id: number;
    status: string;
    last_success_at: string;
    last_error_message: string;
  }

  interface SyncLog {
    id: number;
    server_id: string;
    scope: string;
    status: string;
    row_count: number;
    started_at: string;
    ended_at: string;
    error_message: string;
  }

  interface SyncLogQuery {
    server_id?: string;
    status?: string;
    scope?: string;
    started_from?: string;
    started_to?: string;
  }

  interface SyncTriggerRequest {
    scope: string;
    account_ids?: number[];
    assigned_server_id?: string;
  }

  // ── 广告收益报表 ────────────────────────────────────────────────────────────

  interface AdRevenueQuery {
    date_from?: string;
    date_to?: string;
    source_platform?: string;
    account_id?: number;
    project_id?: number;
    provider_app_id?: string;
    provider_ad_unit_id?: string;
    country_code?: string;
    device_platform?: string;
    ad_format?: string;
    report_type?: string;
    order_by?: string;
    order_dir?: string;
    page?: number;
    size?: number;
  }

  interface AdRevenueItem {
    report_date: string;
    source_platform: string;
    account_id: number;
    provider_app_id: string;
    provider_ad_unit_id: string;
    country_code: string;
    device_platform: string;
    ad_format: string;
    report_type: string;
    ad_source_code: string;
    ad_requests: number;
    matched_requests: number;
    impressions: number;
    clicks: number;
    estimated_earnings: number;
    ecpm: number;
    ctr: number;
    match_rate: number;
    show_rate: number;
  }

  interface AdRevenuePagedResponse {
    page: number;
    size: number;
    total: number;
    items: AdRevenueItem[];
  }

  type AdRevenueGroupBy =
    | 'report_date'
    | 'source_platform'
    | 'account_id'
    | 'provider_app_id'
    | 'provider_ad_unit_id'
    | 'country_code'
    | 'device_platform'
    | 'ad_format'
    | 'report_type'
    | 'ad_source_code';

  interface AdRevenueAggregateRequest extends AdRevenueQuery {
    group_by: AdRevenueGroupBy[];
  }

  interface AdRevenueTrendQuery extends AdRevenueQuery {
    compare_date_from?: string;
    compare_date_to?: string;
  }

  interface AdRevenueTrendResponse {
    current: AdRevenueItem[];
    compare?: AdRevenueItem[];
  }

  interface AdRevenueSummary {
    ad_requests: number;
    impressions: number;
    clicks: number;
    estimated_earnings: number;
    ecpm: number;
    ctr: number;
    match_rate: number;
    account_count: number;
    app_count: number;
    day_count: number;
  }

  interface AdRevenueTopRankRequest extends AdRevenueQuery {
    rank_by: 'app' | 'ad_unit' | 'country' | 'account' | 'platform';
    metric?: string;
    limit?: number;
  }
}
