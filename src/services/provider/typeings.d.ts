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
    driver?: string;
    api_credentials?: Record<string, any>;
    supported_operations?: string[];
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
    driver?: string;
    has_driver?: boolean;
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
    driver?: string;
    api_credentials?: Record<string, any>;
    supported_operations?: string[];
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

  // ── 云端实例 ──────────────────────────────────────────────────────────────────

  interface ProviderInstanceTag {
    key: string;
    value?: string;
  }

  interface ProviderInstanceFetchParams {
    provider_id: number;
    instanceIds?: string[];
    zoneId?: string;
    status?: string;
    name?: string;
    ipv4Address?: string;
    ipv6Address?: string;
    tagKeys?: string[];
    tags?: ProviderInstanceTag[];
    pageSize?: number;
    page?: number;
  }

  interface ProviderInstance {
    instance_id: string;
    name?: string;
    status?: string;
    zone_id?: string;
    instance_type?: string;
    cpu?: number;
    memory?: number;
    public_ips?: string[];
    private_ips?: string[];
    image_id?: string;
    image_name?: string;
    create_time?: string;
    expired_time?: string | null;
    resource_group_id?: string;
  }

  interface ProviderInstancesResult {
    provider_id: number;
    provider_name?: string;
    driver?: string;
    total: number;
    page: number;
    pageSize: number;
    data: ProviderInstance[];
  }

  // ── 云端 EIP ──────────────────────────────────────────────────────────────────

  interface ProviderEipTag {
    key: string;
    value?: string;
  }

  interface ProviderEipFetchParams {
    provider_id: number;
    eipIds?: string[];
    regionId?: string;
    name?: string;
    status?: string;
    isDefault?: boolean;
    privateIpAddress?: string;
    ipAddress?: string;
    ipAddresses?: string[];
    instanceId?: string;
    associatedId?: string;
    cidrIds?: string[];
    resourceGroupId?: string;
    tagKeys?: string[];
    tags?: ProviderEipTag[];
    internetChargeType?: string;
    pageSize?: number;
    page?: number;
  }

  interface ProviderEipMetadata {
    bandwidth?: number;
    internetChargeType?: string;
    [key: string]: any;
  }

  interface ProviderEipItem {
    eip_id: string;
    ip_address: string;
    status?: string;
    instance_id?: string;
    zone_id?: string;
    create_time?: string;
    metadata?: ProviderEipMetadata;
    _raw?: any;
  }

  interface ProviderEipResult {
    provider_id: number;
    provider_name?: string;
    driver?: string;
    total: number;
    pageNum: number;
    pageSize: number;
    data: ProviderEipItem[];
  }
}