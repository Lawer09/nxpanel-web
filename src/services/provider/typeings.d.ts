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
    providerId: number;
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
    nic_id?: string;
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
    providerId: number;
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
    eipId: string;
    ipAddress: string | string[];
    status?: string;
    instanceId?: string;
    zoneId?: string;
    createTime?: string;
    metadata?: ProviderEipMetadata;
    _raw?: any;
  }

  interface ProviderEipResult {
    providerId: number;
    providerName?: string;
    driver?: string;
    total: number;
    page: number;
    pageSize: number;
    data: ProviderEipItem[];
  }

  // ── 云端可用区 ───────────────────────────────────────────────────────────────

  interface ProviderZonesFetchParams {
    provider_id?: number;
    providerId?: number;
    zoneIds?: string[];
  }

  interface ProviderZoneItem {
    zoneId: string;
    zoneName?: string;
    regionId?: string;
    supportSecurityGroup?: boolean;
    _raw?: any;
  }

  interface ProviderZonesResult {
    requestId?: string;
    data: ProviderZoneItem[];
    providerId?: number;
    providerName?: string;
    driver?: string;
  }

  // ── 云端子网 ────────────────────────────────────────────────────────────────

  interface ProviderSubnetsFetchParams {
    provider_id?: number;
    providerId?: number;
    subnetIds?: string[];
    name?: string;
    cidrBlock?: string;
    regionId?: string;
    pageSize?: number;
    pageNum?: number;
    vpcIds?: string[];
    dhcpOptionsSetId?: string;
  }

  interface ProviderSubnetItem {
    name?: string;
    subnetId: string;
    cidrBlock?: string;
    vpcId?: string;
    vpcName?: string;
    _raw?: any;
  }

  interface ProviderSubnetsResult {
    requestId?: string;
    total?: number;
    page?: number;
    pageSize?: number;
    data: ProviderSubnetItem[];
    provider_id?: number;
    providerId?: number;
    provider_name?: string;
    providerName?: string;
    driver?: string;
  }

  // ── 云端实例规格 ─────────────────────────────────────────────────────────────

  interface ProviderInstanceTypesFetchParams {
    provider_id?: number;
    providerId?: number;
    zoneId?: string;
    instanceType?: string;
  }

  interface ProviderInstanceTypeItem {
    instanceType: string;
    cpuCount?: number;
    memory?: number;
    _raw?: any;
  }

  interface ProviderInstanceTypesResult {
    requestId?: string;
    data: ProviderInstanceTypeItem[];
    provider_id?: number;
    providerId?: number;
    provider_name?: string;
    providerName?: string;
    driver?: string;
  }

  // ── 云端 SSH 密钥 ─────────────────────────────────────────────────────────────

  interface ProviderSshKeyFetchParams {
    provider_id?: number;
    providerId?: number;
    keyIds?: string[];
    keyName?: string;
    pageSize?: number;
    page?: number;
  }

  interface ProviderSshKeyItem {
    key_id: string;
    key_name: string;
    key_description?: string;
    public_key?: string;
    fingerprint?: string;
    create_time?: string;
    _raw?: any;
  }

  interface ProviderSshKeyResult {
    provider_id?: number;
    providerId?: number;
    provider_name?: string;
    providerName?: string;
    driver?: string;
    total: number;
    page: number;
    pageSize: number;
    data: ProviderSshKeyItem[];
  }

  // ── 云端创建实例 ─────────────────────────────────────────────────────────────

  interface ProviderCreateInstanceParams {
    providerId: number;
    zoneId: string;
    instanceType: string;
    subnetId: string;
    sshKeyId: number;
    name?: string;
    instanceCount?: number;
  }

  interface ProviderCreateInstanceResult {
    providerId: number;
    instanceIds: string[];
    orderSn?: string;
  }

  // ── 云端绑定 EIP ────────────────────────────────────────────────────────────

  interface ProviderBindEipItem {
    nicId: string;
    elasticIpId: string;
    privateIpAddress: string;
  }

  type ProviderBindEipsResult = Array<{
    success: boolean;
    nic_id?: string;
    eip_id?: string;
    [key: string]: any;
  }>;

  interface ProviderBindEipsParams {
    providerId: number;
    bindings: ProviderBindEipItem[];
  }
}