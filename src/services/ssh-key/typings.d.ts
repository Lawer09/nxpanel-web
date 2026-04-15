declare namespace API {
  // ── SSH 密钥 ──────────────────────────────────────────────────────────────

  interface SshKeyProvider {
    id: number;
    name: string;
  }

  interface SshKeyItem {
    id: number;
    name: string;
    tags?: string;
    provider_id?: number | null;
    provider_key_id?: string | null;
    public_key?: string | null;
    note?: string | null;
    created_at?: string | number;
    updated_at?: string | number;
    provider?: SshKeyProvider;
  }

  interface SshKeyFetchParams {
    page?: number;
    pageSize?: number;
    name?: string;
    tags?: string;
    providerId?: number;
  }

  interface SshKeySaveParams {
    name: string;
    tags?: string;
    provider_id?: number | null;
    provider_key_id?: string;
    public_key?: string;
    secret_key: string;
    note?: string;
  }

  interface SshKeyUpdateParams {
    id: number;
    name?: string;
    tags?: string;
    provider_id?: number | null;
    provider_key_id?: string;
    public_key?: string;
    secret_key?: string;
    note?: string;
  }
}
