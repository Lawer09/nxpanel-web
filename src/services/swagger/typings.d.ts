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
    status?: 'online' | 'offline' | 'error' | 'maintenance';
    os_type?: string;
    cpu_cores?: string;
    memory?: string;
    disk?: string;
    gpu_info?: string;
    bandwidth?: number;
    provider?: string;
    price?: number;
    pay_mode?: 'hourly' | 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'once';
    tags?: string;
    description?: string;
    is_active?: 0 | 1;
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
  
}
