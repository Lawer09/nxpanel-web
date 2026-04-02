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

  // ── Deploy ─────────────────────────────────────────────────────────────────

  type DeployTaskStatus = 'pending' | 'running' | 'success' | 'failed';

  interface DeployTask {
    id?: number;
    task_id?: number;
    server_id: number;
    batch_id?: number | null;
    status: DeployTaskStatus;
    output?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    server?: { id: number; name: string; type: string; host: string };
  }

  interface DeployResultSingle {
    id: number;
    server_id: number;
    batch_id: number | null;
    status: DeployTaskStatus;
    output?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    server?: { id: number; name: string; type: string; host: string };
  }

  interface DeployResultBatch {
    summary: {
      total: number;
      pending: number;
      running: number;
      success: number;
      failed: number;
    };
    tasks: DeployTask[];
  }

  interface ServerGroup {
    id: number;
    name: string;
    users_count?: number;
    server_count?: number;
  }

  interface PortTestResult {
    host: string;
    port: number;
    reachable: boolean;
    latency_ms: number;
    message: string;
    errno?: number;
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

  // ==================== User ====================

  interface UserFilter {
    id: string;
    value: string | number | (string | number)[];
  }

  interface UserSort {
    id: string;
    desc: boolean;
  }

  interface UserPlanLite {
    id: number;
    name: string;
  }

  interface UserInviteLite {
    id: number;
    email: string;
  }

  interface UserGroupLite {
    id: number;
    name: string;
  }

  interface UserItem {
    id: number;
    email: string;
    token?: string;
    uuid?: string;
    invite_user_id?: number | null;
    plan_id?: number | null;
    group_id?: number | null;
    transfer_enable?: number | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    u?: number;
    d?: number;
    total_used?: number;
    banned?: boolean | number;
    is_admin?: boolean | number;
    is_staff?: boolean | number;
    balance?: number;
    commission_balance?: number;
    commission_rate?: number | null;
    commission_type?: number;
    discount?: number | null;
    expired_at?: number | null;
    last_login_at?: number | null;
    remarks?: string | null;
    subscribe_url?: string;
    created_at?: number;
    updated_at?: number;
    plan?: UserPlanLite;
    invite_user?: UserInviteLite;
    group?: UserGroupLite;
  }

  interface UserFetchParams {
    current?: number;
    pageSize?: number;
    filter?: UserFilter[];
    sort?: UserSort[];
  }

  interface UserUpdateParams {
    id: number;
    email?: string;
    password?: string;
    transfer_enable?: number | null;
    expired_at?: number | null;
    banned?: boolean | number;
    plan_id?: number | null;
    commission_rate?: number | null;
    discount?: number | null;
    is_admin?: boolean | number;
    is_staff?: boolean | number;
    u?: number;
    d?: number;
    balance?: number;
    commission_type?: number;
    commission_balance?: number;
    remarks?: string | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    invite_user_email?: string;
  }

  interface UserGenerateParams {
    email_suffix: string;
    email_prefix?: string;
    generate_count?: number;
    password?: string;
    plan_id?: number;
    expired_at?: number;
    download_csv?: boolean;
  }

  interface UserSendMailParams {
    subject: string;
    content: string;
    filter?: UserFilter[];
    sort?: UserSort[];
    sort_type?: string;
  }

  // ==================== Plan ====================

  type PlanResetTrafficMethod = 0 | 1 | 2 | 3 | 4 | null;

  interface PlanPrices {
    weekly?: number | null;
    monthly?: number | null;
    quarterly?: number | null;
    half_yearly?: number | null;
    yearly?: number | null;
    two_yearly?: number | null;
    three_yearly?: number | null;
    onetime?: number | null;
    reset_traffic?: number | null;
  }

  interface PlanGroupLite {
    id: number;
    name: string;
  }

  interface PlanItem {
    id: number;
    name: string;
    group_id?: number | null;
    transfer_enable: number;
    speed_limit?: number | null;
    device_limit?: number | null;
    capacity_limit?: number | null;
    show: boolean;
    renew: boolean;
    sell: boolean;
    sort: number;
    content?: string | null;
    reset_traffic_method?: PlanResetTrafficMethod;
    prices?: PlanPrices | null;
    tags?: string[] | null;
    group?: PlanGroupLite | null;
    users_count?: number;
    active_users_count?: number;
    created_at: number;
    updated_at: number;
  }

  interface PlanSaveParams {
    id?: number;
    name: string;
    transfer_enable: number;
    group_id?: number | null;
    speed_limit?: number | null;
    device_limit?: number | null;
    capacity_limit?: number | null;
    content?: string | null;
    reset_traffic_method?: PlanResetTrafficMethod;
    prices?: PlanPrices | null;
    tags?: string[] | null;
    force_update?: boolean;
  }

  interface PlanUpdateParams {
    id: number;
    show?: boolean;
    renew?: boolean;
    sell?: boolean;
  }

  // ==================== Order ====================

  type OrderStatus = 0 | 1 | 2 | 3 | 4;
  type OrderType = 1 | 2 | 3 | 4;

  type OrderPeriod =
    | 'monthly'
    | 'quarterly'
    | 'half_yearly'
    | 'yearly'
    | 'two_yearly'
    | 'three_yearly'
    | 'onetime'
    | 'reset_traffic';

  type OrderAssignPeriod =
    | 'month_price'
    | 'quarter_price'
    | 'half_year_price'
    | 'year_price'
    | 'two_year_price'
    | 'three_year_price'
    | 'onetime_price'
    | 'reset_price';

  interface OrderPlanLite {
    id: number;
    name: string;
  }

  interface OrderItem {
    id: number;
    user_id: number;
    plan_id: number;
    payment_id?: number | null;
    period: OrderPeriod | string;
    trade_no: string;
    total_amount: number;
    handling_amount?: number | null;
    balance_amount?: number | null;
    refund_amount?: number | null;
    surplus_amount?: number | null;
    discount_amount?: number | null;
    type: OrderType;
    status: OrderStatus;
    surplus_order_ids?: number[] | null;
    coupon_id?: number | null;
    invite_user_id?: number | null;
    commission_status?: number | null;
    commission_balance?: number | null;
    commission_rate?: number | null;
    actual_commission_balance?: number | null;
    paid_at?: number | null;
    callback_no?: string | null;
    plan?: OrderPlanLite | null;
    created_at: number;
    updated_at: number;
  }

  interface OrderDetail extends OrderItem {
    user?: UserItem;
    invite_user?: UserInviteLite;
    commission_log?: any;
    surplus_orders?: OrderItem[];
  }

  interface OrderFetchParams {
    current?: number;
    pageSize?: number;
    is_commission?: boolean;
    filter?: UserFilter[];
    sort?: UserSort[];
  }

  interface OrderAssignParams {
    plan_id: number;
    email: string;
    total_amount: number;
    period: OrderAssignPeriod;
  }

  // ==================== Server Template ====================

  interface ServerTemplate {
    id: number;
    name: string;
    type: ServerProtocolType | string;
    description?: string | null;
    is_default: boolean;
    host?: string | null;
    port?: string | number | null;
    server_port?: number | null;
    rate?: number | null;
    show?: boolean | null;
    code?: string | null;
    spectific_key?: string | null;
    group_ids?: number[] | null;
    route_ids?: number[] | null;
    tags?: string[] | null;
    excludes?: string[] | null;
    ips?: string[] | null;
    parent_id?: number | null;
    rate_time_enable?: boolean | null;
    rate_time_ranges?: ServerNodeRateTimeRange[] | null;
    custom_outbounds?: any[] | null;
    custom_routes?: any[] | null;
    cert_config?: any[] | null;
    generation_options?: ServerTemplateGenerationOptions | null;
    protocol_settings?: Record<string, any> | null;
    created_at?: number;
    updated_at?: number;
  }

  interface ServerTemplateGenerationOptions {
    port_random?: boolean;
    server_port_random?: boolean;
    port_same?: boolean;
    port_min?: number;
    port_max?: number;
    reality_key_random?: boolean;
    reality_shortid_random?: boolean;
  }

  interface ServerTemplateSaveParams {
    name: string;
    type: ServerProtocolType | string;
    description?: string;
    is_default?: boolean;
    host?: string;
    port?: string | number;
    server_port?: number;
    rate?: number;
    show?: boolean;
    code?: string;
    spectific_key?: string;
    group_ids?: number[];
    route_ids?: number[];
    tags?: string[];
    excludes?: string[];
    ips?: string[];
    parent_id?: number;
    rate_time_enable?: boolean;
    rate_time_ranges?: ServerNodeRateTimeRange[];
    custom_outbounds?: any[];
    custom_routes?: any[];
    cert_config?: any[];
    generation_options?: ServerTemplateGenerationOptions;
    protocol_settings?: Record<string, any>;
  }

  interface ServerTemplateFetchParams {
    page?: number;
    page_size?: number;
    name?: string;
    type?: string;
    is_default?: boolean;
  }

  interface ServerTemplatePageData {
    data: ServerTemplate[];
    total: number;
    pageSize: number;
    page: number;
  }

  // ==================== Deploy Template ====================

  type DeployNodeType =
    | 'vless'
    | 'vmess'
    | 'trojan'
    | 'shadowsocks'
    | 'hysteria'
    | 'hysteria2'
    | 'tuic'
    | 'anytls';

  interface DeployTemplate {
    id: number;
    name: string;
    node_type: DeployNodeType | string;
    description?: string | null;
    core_type?: number | null;   // 1=xray 2=sing-box 3=mihomo
    tls?: number | null;          // 0=none 1=tls 2=xtls
    cert_mode?: string | null;    // none/http/dns/self
    cert_domain?: string | null;
    network?: string | null;
    network_settings?: Record<string, any> | null;
    group_ids?: number[] | null;
    route_ids?: number[] | null;
    is_default: boolean;
    extra?: Record<string, any> | null;
    created_at: number;
    updated_at: number;
  }

  interface DeployTemplateSaveParams {
    name: string;
    node_type: DeployNodeType | string;
    description?: string;
    core_type?: number | null;
    tls?: number | null;
    cert_mode?: string;
    cert_domain?: string;
    network?: string;
    network_settings?: Record<string, any>;
    group_ids?: number[];
    route_ids?: number[];
    is_default?: boolean;
    extra?: Record<string, any>;
  }

  // ==================== Deploy Task ====================

  type DeployTaskStatus = 'pending' | 'running' | 'success' | 'failed';

  interface DeployTaskItem {
    task_id: number;
    machine_id: number;
    status: DeployTaskStatus;
  }

  interface BatchDeployResult {
    batch_id: number;
    task_count: number;
    tasks: DeployTaskItem[];
  }

  interface DeployTaskDetail {
    id: number;
    batch_id?: number | null;
    machine_id: number;
    server_id?: number | null;
    status: DeployTaskStatus;
    output?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    machine?: { id: number; name: string; ip_address: string } | null;
    server?: { id: number; name: string } | null;
  }

  interface BatchDeployStatus {
    summary: {
      total: number;
      pending: number;
      running: number;
      success: number;
      failed: number;
    };
    tasks: DeployTaskDetail[];
  }

  // ==================== DNS ====================

  interface DnsDomain {
    id: number;
    domain: string;
    enabled: boolean;
    provider: string;
    last_synced_at?: string | null;
  }

  interface DnsDomainRecord {
    id: number;
    subdomain: string;
    fqdn: string;
    ipv4: string;
    enabled: boolean;
  }

  interface DnsDomainDetail extends DnsDomain {
    records: DnsDomainRecord[];
  }

  interface DnsRecord {
    id: number;
    domain: string;
    subdomain: string;
    fqdn: string;
    enabled: boolean;
  }

  interface DnsResolveParams {
    ipv4: string;
    subdomain: string;
    domain: string;
    unique: boolean;
  }

  interface DnsResolveResult {
    action: 'created' | 'unchanged' | 'replace';
    ipv4: string;
    subdomain: string;
    domain: string;
    fqdn: string;
    unique: boolean;
    removed_records?: string[];
  }

  interface DnsRecordsByIpResult {
    ipv4: string;
    records: DnsRecord[];
  }

  interface DnsUnbindParams {
    ipv4: string;
    fqdn: string;
  }

  interface DnsUnbindResult {
    ipv4: string;
    fqdn: string;
    action: string;
  }

  interface DnsSyncResult {
    total_remote: number;
    inserted: number;
    updated: number;
  }

  interface DnsResponse<T> {
    code: number;
    msg: string;
    data: T | null;
  }


  type SystemStatusResponse = {
    schedule: boolean;
    horizon: boolean;
    schedule_last_runtime: number | null;
  };

  type QueueStatsResponse = {
    failedJobs: number;
    jobsPerMinute: number;
    pausedMasters: number;
    periods: {
      failedJobs: number;
      recentJobs: number;
    };
    processes: number;
    queueWithMaxRuntime: string;
    queueWithMaxThroughput: string;
    recentJobs: number;
    status: boolean;
    wait: Record<string, number>;
  };

  type QueueWorkloadItem = {
    name: string;
    length: number;
    wait: number;
    processes: number;
  };

  type HorizonFailedJob = {
    id: string;
    connection: string;
    queue: string;
    name: string;
    failed_at: string;
    exception: string;
  };

  type AuditLogItem = {
    id: number;
    admin_id: number;
    action: string;
    uri: string;
    request_data: string;
    ip: string;
    created_at: number;
    admin: {
      id: number;
      email: string;
    };
  };

  // ==================== Stat ====================

  interface StatUserRecord {
    user_id: number;
    u: number;
    d: number;
    record_at: number;
  }

  interface StatUserPageData {
    data: StatUserRecord[];
    total: number;
    page: number;
    pageSize: number;
  }

  interface TrafficRankItem {
    id: string;
    name: string;
    value: number;
    previousValue: number;
    change: number;
    timestamp: string;
  }

  interface TrafficRankData {
    timestamp: string;
    list: TrafficRankItem[];
  }

  interface UserConsumptionRankItem {
    user_id: number;
    email: string;
    u: number;
    d: number;
    total: number;
  }

  interface UserConsumptionRankData {
    list: UserConsumptionRankItem[];
  }

  interface ServerRankItem {
    server_name: string;
    server_id: number;
    server_type: string;
    u: number;
    d: number;
    total: number;
  }

  interface StatServerItem {
    id: number;
    server_id: number;
    server_name: string;
    server_type: string;
    u: number;
    d: number;
    total: number;
    record_at?: number;
  }

  interface StatServerDetailItem {
    server_id: number;
    server_name: string;
    server_type: string;
    u: number;
    d: number;
    total: number;
    record_at: number;
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
  }

  interface StatServerDetailPageData {
    total: number;
    data: StatServerDetailItem[];
  }

  interface StatServerPageData {
    total: number;
    data: StatServerItem[];
  }

  interface ServerRankData {
    list: ServerRankItem[];
  }

  interface ServerTrafficRankItem {
    server_id: number;
    server_type: string;
    u: number;
    d: number;
    total: number;
  }

  interface ServerTrafficRankData {
    list: ServerTrafficRankItem[];
  }

  interface StatTrafficStat {
    upload: number;
    download: number;
    total: number;
  }

  interface StatOverviewData {
    onlineNodes?: number;
    onlineUsers?: number;
    onlineDevices?: number;
    todayTraffic?: StatTrafficStat;
    monthTraffic?: StatTrafficStat;
    totalTraffic?: StatTrafficStat;
    todayIncome?: number;
    dayIncomeGrowth?: number;
    currentMonthIncome?: number;
    monthIncomeGrowth?: number;
    currentMonthNewUsers?: number;
    totalUsers?: number;
    activeUsers?: number;
    ticketPendingTotal?: number;
    commissionPendingTotal?: number;
  }
}
