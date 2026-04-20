// ── 版本管理 ─────────────────────────────────────────────────────────────────
declare namespace API {
  interface VersionItem {
    id: number;
    version: string;
    title: string;
    description?: string;
    features?: string[];
    improvements?: string[];
    bugfixes?: string[];
    release_date: string;
    is_published: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }

  interface VersionSaveParams {
    version: string;
    title: string;
    description?: string;
    features?: string[];
    improvements?: string[];
    bugfixes?: string[];
    release_date: string;
    is_published?: boolean;
    sort_order?: number;
  }

  interface VersionUpdateParams extends Partial<VersionSaveParams> {
    id: number;
  }
}
