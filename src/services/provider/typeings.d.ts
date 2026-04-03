declare namespace API {
     // ── 供应商 ───────────────────────────────────────────────────────────────────

  interface ProviderItem {
    id: number;
    name: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    country?: string;
    type?: string;
    asn_id?: number;
    asn?: string | AsnItem;
    reliability?: number;
    reputation?: number;
    speed_level?: number;
    stability?: number;
    is_active?: boolean;
    regions?: any;
    services?: any;
    metadata?: Record<string, any>;
    created_at?: number;
    updated_at?: number;
  }

  interface ProviderFetchParams {
    current: number;
    pageSize: number;
    search?: string;
    country?: string;
    type?: string;
    is_active?: boolean;
    min_reliability?: number;
    asn_id?: number;
  }

  interface ProviderSaveParams {
    id?: number;
    name?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    country?: string;
    type?: string;
    asn_id?: number;
    asn?: string;
    reliability?: number;
    reputation?: number;
    speed_level?: number;
    stability?: number;
    is_active?: boolean;
    regions?: any;
    services?: any;
    metadata?: Record<string, any>;
  }

  interface ProviderStatsCountryItem {
    country: string;
    count: number;
  }

  interface ProviderStatsTypeItem {
    type: string;
    count: number;
  }

  interface ProviderStats {
    total?: number;
    active_count?: number;
    high_reliability_count?: number;
    avg_reliability?: number;
    avg_reputation?: number;
    by_country?: ProviderStatsCountryItem[];
    by_type?: ProviderStatsTypeItem[];
    [key: string]: any;
  }
}