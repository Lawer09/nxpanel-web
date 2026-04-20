declare namespace API {
  // ── 应用管理 ───────────────────────────────────────────────────────────────

  interface AppClientItem {
    id: number;
    name: string;
    app_id: string;
    app_token: string;
    app_secret?: string; // 仅 save / resetSecret 时返回
    description?: string;
    is_enabled: boolean;
    created_at?: string;
    updated_at?: string;
  }

  interface AppClientSaveParams {
    name: string;
    app_id: string;
    description?: string;
  }

  interface AppClientUpdateParams {
    id: number;
    name?: string;
    app_id?: string;
    description?: string;
    is_enabled?: boolean;
  }

  interface AppClientFetchParams {
    current?: number;
    pageSize?: number;
  }
}
