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
}
