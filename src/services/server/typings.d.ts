declare namespace API {
  // ── 协议类型 ─────────────────────────────────────────────────────────────────

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

  // ── 节点负载 & 运行指标 ────────────────────────────────────────────────────

  interface ServerNodeDiskInfo {
    total: number;
    used: number;
  }

  interface ServerNodeMemInfo {
    total: number;
    used: number;
  }

  interface ServerNodeSwapInfo {
    total: number;
    used: number;
  }

  interface ServerNodeLoadStatus {
    cpu: number;
    disk: ServerNodeDiskInfo;
    mem: ServerNodeMemInfo;
    swap: ServerNodeSwapInfo;
    kernel_status?: any;
    updated_at: number;
  }

  interface ServerNodeMetrics {
    uptime: number;
    goroutines: number;
    active_connections?: number;
    tcp_connections?: number;
    total_users: number;
    active_users: number;
    total_connections?: number;
    inbound_speed: number;
    outbound_speed: number;
    cpu_per_core: number[];
    load: number[];
    kernel_status?: any;
    updated_at: number;
  }

  interface ServerNodeOnlineConnHistory {
    updated_at: number;
    active_connections: number;
    tcp_connections: number;
  }

  interface ServerNodeHistoryItem {
    server_id: number;
    server_name: string;
    server_type: string;
    load_status_history: ServerNodeLoadStatus[];
    metrics_history: ServerNodeMetrics[];
    online_conn_history: ServerNodeOnlineConnHistory[];
  }

  interface ServerNodeHistoryPageData {
    data: ServerNodeHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
  }

  // ── 节点 ─────────────────────────────────────────────────────────────────────

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
    online_limit?: number | null;
    machine_id?: number | null;
    protocol_settings?: Record<string, any>;
    last_check_at?: number | null;
    last_push_at?: number | null;
    online?: number;
    is_online?: number;
    available_status?: number;
    load_status?: ServerNodeLoadStatus | null;
    metrics?: ServerNodeMetrics | null;
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
    online_limit?: number | null;
    machine_id?: number | null;
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

  // ── 权限组 ───────────────────────────────────────────────────────────────────

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

  // ── 路由 ─────────────────────────────────────────────────────────────────────

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

  // ── 端口测试 & 在线用户 ───────────────────────────────────────────────────────

  interface PortTestResult {
    host: string;
    port: number;
    reachable: boolean;
    latency_ms: number;
    message: string;
    errno?: number;
  }

  interface ServerOnlineUser {
    user_id: number;
    email: string;
    ip_count: number;
    ips: string[];
    last_update_at: string;
  }

  interface ServerOnlineUsersResult {
    server_id: number;
    server_name: string;
    node_key: string;
    online_count: number;
    users: ServerOnlineUser[];
  }

  // ── 切换域名 ───────────────────────────────────────────────────────────────

  interface SwitchServerDomainParams {
    server_id: number;
    domain: string;
    subdomain?: string;
  }

  interface SwitchServerDomainResult {
    server_id: number;
    machine_id: number;
    resolved_ip: string;
    fqdn: string;
    result: Record<string, any>;
  }

  interface BatchBindDomainItem {
    id: number;
    domain: string;
    subdomain?: string;
  }

  interface BatchBindDomainParams {
    bindings: BatchBindDomainItem[];
  }

  interface BatchBindDomainSuccessItem {
    index: number;
    server_id: number;
    machine_id: number;
    domain: string;
    subdomain: string;
    unique: boolean;
    resolved_ip: string;
    fqdn: string;
    updated_host: string;
    success: boolean;
  }

  interface BatchBindDomainErrorItem {
    index: number;
    server_id: number;
    domain: string;
    subdomain: string;
    error: string;
  }

  interface BatchBindDomainResult {
    results: BatchBindDomainSuccessItem[];
    errors: BatchBindDomainErrorItem[];
  }

  // ── 部署（节点侧） ────────────────────────────────────────────────────────────

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

  // ── 节点模板 ─────────────────────────────────────────────────────────────────

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

  // ── 部署模板 ─────────────────────────────────────────────────────────────────

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
}
