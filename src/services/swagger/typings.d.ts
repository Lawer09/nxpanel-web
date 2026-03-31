declare namespace API {

  // 基础响应
  interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
  }

  interface PageData<T> {
    page: number;
    pageSize: number;
    total: number;
    data: T[];
  }

  // 认证响应
  interface AuthResponse {
    token: string;
    auth_data: string; // "Bearer xxxxxxx"
    is_admin: boolean;
    secure_path?: string;
  }

  // 当前用户
  interface CurrentUser {
    email?: string;
    name?: string;
    avatar?: string;
    access?: 'admin' | 'user';
    is_admin?: boolean;
  }

interface Machine {  
    id?: number;  
    name: string;  
    hostname: string;  
    ip_address: string;  
    port: number;  
    username: string;  
    password?: string;  
    private_key?: string;  
    status?: 'online' | 'offline' | 'error';  // 移除 'maintenance'  
    os_type?: string;  
    cpu_cores?: string;  
    memory?: string;  
    disk?: string;  
    gpu_info?: string;  
    bandwidth?: number;  
    provider?: number;      // 改为 number（供应商ID）  
    price?: number;  
    pay_mode?: number;      // 改为 number（付费模式）  
    tags?: string;  
    description?: string;  
    is_active?: boolean;    // 改为 boolean  
    last_check_at?: string;  
    created_at?: string;  
    updated_at?: string;  
}

  type ServerProtocolType =
    | 'hysteria'
    | 'vless'
    | 'trojan'
    | 'vmess'
    | 'tuic'
    | 'shadowsocks'
    | 'anytls'
    | 'socks'
    | 'naive'
    | 'http'
    | 'mieru';

  interface ServerNodeGroupLite {
    id: number;
    name: string;
  }

  interface ServerNodeSortItem {
    id: number;
    order: number;
  }

  interface ServerNodeRateTimeRange {
    start: string;
    end: string;
    rate: number;
  }

  interface ServerNode {
    id: number;
    name: string;
    type: ServerProtocolType | string;
    host: string;
    port: string | number;
    server_port: number;
    group_ids?: number[];
    route_ids?: number[];
    tags?: string[];
    show?: boolean;
    rate: number;
    rate_time_enable?: boolean;
    rate_time_ranges?: ServerNodeRateTimeRange[];
    parent_id?: number | null;
    sort?: number;
    code?: string | null;
    protocol_settings?: Record<string, any>;
    last_check_at?: number | null;
    last_push_at?: number | null;
    online?: number;
    is_online?: number;
    available_status?: number;
    load_status?: Record<string, any> | null;
    groups?: ServerNodeGroupLite[];
    parent?: ServerNode | null;
  }

  interface ServerNodeSaveParams {
    id?: number;
    type: ServerProtocolType | string;
    name: string;
    host: string;
    port: string;
    server_port: number;
    rate: number;
    group_ids?: number[];
    route_ids?: number[];
    parent_id?: number;
    code?: string;
    tags?: string[];
    excludes?: string[];
    ips?: string[];
    show?: boolean;
    rate_time_enable?: boolean;
    rate_time_ranges?: ServerNodeRateTimeRange[];
    protocol_settings?: Record<string, any>;
  }

  interface ServerNodeUpdateParams {
    id: number;
    show?: number;
  }

  interface ServerGroup {
    id: number;
    name: string;
    users_count?: number;
    server_count?: number;
  }

  interface ServerGroupSaveParams {
    id?: number;
    name: string;
  }

  interface ServerRoute {
    id: number;
    remarks: string;
    match: string[];
    action: 'block' | 'dns';
    action_value?: string | null;
  }

  interface ServerRouteSaveParams {
    id?: number;
    remarks: string;
    match: string[];
    action: 'block' | 'dns';
    action_value?: string;
  }

  type IpPoolStatus = 'active' | 'cooldown';

  interface IpPoolItem {
    id: number;
    ip: string;
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

  // ==================== Performance ====================

  interface PerformanceFetchParams {
    node_id?: number;
    user_id?: number;
    platform?: 'ios' | 'android' | 'windows' | 'macos' | 'linux';
    client_country?: string;
    start_at?: number;
    end_at?: number;
    page?: number;
    page_size?: number;
  }

  interface PerformanceRecord {
    id: number;
    user_id: number;
    node_id: number;
    delay: number;
    success_rate: number;
    client_ip?: string;
    client_country?: string;
    client_city?: string;
    client_isp?: string;
    platform?: string;
    app_version?: string;
    created_at: number;
    user?: { id: number; email: string };
  }

  interface PerformanceNodeStatItem {
    node_id: number;
    report_count: number;
    avg_delay: number;
    min_delay: number;
    max_delay: number;
    avg_success_rate: number;
    unique_users: number;
  }

  interface PerformanceNodeStatsData {
    period_days: number;
    data: PerformanceNodeStatItem[];
  }

  interface PerformanceTrendItem {
    time_slot: string;
    avg_delay: number;
    min_delay: number;
    max_delay: number;
    avg_success_rate: number;
    report_count: number;
  }

  interface PerformanceTrendData {
    node_id: number;
    period_days: number;
    granularity: string;
    data: PerformanceTrendItem[];
  }

  interface PerformanceGeoItem {
    client_country: string;
    report_count: number;
    unique_users: number;
    avg_delay: number;
    avg_success_rate: number;
  }

  interface PerformanceGeoData {
    period_days: number;
    data: PerformanceGeoItem[];
  }

  interface PerformancePlatformItem {
    platform: string;
    report_count: number;
    unique_users: number;
    avg_delay: number;
    avg_success_rate: number;
  }

  interface PerformancePlatformData {
    period_days: number;
    data: PerformancePlatformItem[];
  }

}
