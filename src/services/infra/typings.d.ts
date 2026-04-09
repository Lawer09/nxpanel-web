declare namespace API {
  // ── ASN ──────────────────────────────────────────────────────────────────────

  interface AsnItem {
    id: number;
    asn: string;
    name: string;
    description?: string;
    country?: string;
    type?: string;
    is_datacenter?: boolean;
    reliability?: number;
    reputation?: number;
    providers?: ProviderItem[];
    metadata?: Record<string, any>;
    created_at?: number;
    updated_at?: number;
  }

  interface AsnFetchParams {
    current: number;
    pageSize: number;
    search?: string;
    country?: string;
    type?: string;
    is_datacenter?: boolean;
    min_reliability?: number;
  }

  interface AsnSaveParams {
    id?: number;
    asn?: string;
    name?: string;
    description?: string;
    country?: string;
    type?: string;
    is_datacenter?: boolean;
    reliability?: number;
    reputation?: number;
    metadata?: Record<string, any>;
  }

  interface AsnStatsCountryItem {
    country: string;
    count: number;
  }

  interface AsnStatsTypeItem {
    type: string;
    count: number;
  }

  interface AsnStats {
    total?: number;
    datacenter_count?: number;
    high_reliability_count?: number;
    avg_reliability?: number;
    avg_reputation?: number;
    by_country?: AsnStatsCountryItem[];
    by_type?: AsnStatsTypeItem[];
    [key: string]: any;
  }

  interface AsnProvidersData {
    asn_id: number;
    asn?: string;
    asn_name?: string;
    data: ProviderItem[];
    total: number;
    page: number;
  }

  interface BatchActionResult {
    message?: string;
    count?: number;
  }

 

  // ── IP 池 ────────────────────────────────────────────────────────────────────

  type IpPoolStatus = 'active' | 'cooldown';

  interface IpPoolItem {
    id: number;
    ip: string;
    machine_id?: number | null;
    provider_id?: number | null;
    provider_ip_id?: string | null;
    ip_type?: 'elastic' | 'public';
    hostname?: string;
    city?: string;
    region?: string;
    country?: string;
    loc?: string;
    org?: string;
    postal?: string;
    timezone?: string;
    readme_url?: string;
    score?: number;
    load?: number;
    max_load?: number;
    success_rate?: number;
    status?: IpPoolStatus;
    risk_level?: number;
    total_requests?: number;
    successful_requests?: number;
    last_used_at?: number;
    created_at?: number;
    updated_at?: number;
  }

  interface IpPoolFetchParams {
    current: number;
    pageSize: number;
    search_ip?: string;
    country?: string;
    status?: IpPoolStatus;
    risk_level?: 'high' | 'medium' | 'low';
    min_success_rate?: number;
    sort_by?: 'created_at' | 'score' | 'load';
    sort_order?: 'asc' | 'desc';
  }

  interface IpPoolSaveParams {
    id?: number;
    ip?: string;
    machine_id?: number | null;
    provider_id?: number | null;
    provider_ip_id?: string | null;
    ip_type?: 'elastic' | 'public';
    metadata?: Record<string, any>;
    hostname?: string;
    city?: string;
    region?: string;
    country?: string;
    loc?: string;
    org?: string;
    postal?: string;
    timezone?: string;
    readme_url?: string;
    score?: number;
    max_load?: number;
    status?: IpPoolStatus;
    risk_level?: number;
  }

  interface IpInfoData {
    ip: string;
    hostname?: string;
    city?: string;
    region?: string;
    country?: string;
    loc?: string;
    org?: string;
    postal?: string;
    timezone?: string;
    readme?: string;
  }

  interface IpPoolStatsCountryItem {
    country: string;
    count: number;
  }

  interface IpPoolStats {
    total: number;
    active: number;
    cooldown: number;
    avg_score: number;
    avg_success_rate: number;
    high_risk_count: number;
    by_country: IpPoolStatsCountryItem[];
  }

}
