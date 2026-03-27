declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module 'mockjs';
declare module 'react-fittext';

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

declare namespace API {
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

  // 基础响应
  interface Response<T> {
    code: number;
    msg: string;
    data: T;
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
}
