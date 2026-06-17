declare namespace API {
  interface ControlApiResponse<T> {
    code: number;
    message: string;
    data: T;
    request_id?: string;
    timestamp?: number;
    error?: {
      type?: string;
      detail?: string;
    };
  }

  interface ControlAgent {
    id: number;
    agent_id: string;
    machine_id: string;
    status: string;
    snapshot_version?: string;
    pull_interval: number;
    report_interval: number;
    last_seen_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  interface ControlKernelStatus {
    agent_id: string;
    version?: string;
    healthy?: boolean;
    state?: string;
    last_error?: string;
    started_at?: string | null;
    updated_at?: string | null;
    reported_at?: string | null;
  }

  interface ControlRuntimeNodeSummary {
    node_id: number;
    tag: string;
    type: string;
    enabled: boolean;
    startup?: Record<string, unknown> | unknown[] | null;
    metrics?: Record<string, unknown> | unknown[] | null;
    runtime_reported_at?: string | null;
    online_users?: number;
    online_ips?: number;
    online_reported_at?: string | null;
    traffic_upload_bytes?: number;
    traffic_download_bytes?: number;
    traffic_reported_at?: string | null;
  }

  interface ControlAgentRuntime {
    agent: ControlAgent;
    kernel?: ControlKernelStatus | null;
    nodes: ControlRuntimeNodeSummary[];
  }

  type ControlJsonObject = Record<string, unknown>;

  interface ControlConfigJson {
    listen?: {
      bind_ip?: string;
      port?: number;
      tcp_fast_open?: boolean;
      [key: string]: unknown;
    };
    settings?: ControlJsonObject;
    tls?: {
      mode?: string;
      [key: string]: unknown;
    };
    transport?: {
      network?: string;
      settings?: ControlJsonObject;
      [key: string]: unknown;
    };
    multiplex?: {
      enabled?: boolean;
      padding?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface ControlRulesJson {
    protocol?: string[];
    regexp?: string[];
    [key: string]: unknown;
  }

  interface ControlOptionsJson {
    enable_realtime?: boolean;
    speed_limit?: number;
    ip_limit?: number;
    ip_online_min_traffic?: number;
    report_min_traffic?: number;
    [key: string]: unknown;
  }

  type ControlTlsMode = 'none' | 'tls' | 'reality' | string;

  interface ControlTlsCertConfig {
    mode?: string;
    key_type?: string;
    reject_unknown_sni?: boolean;
    domain?: string;
    cert_file?: string;
    key_file?: string;
    provider?: string;
    email?: string;
    dns_env?: ControlJsonObject;
    timeout?: number;
    [key: string]: unknown;
  }

  interface ControlRealityConfig {
    private_key?: string;
    short_id?: string;
    dest?: string;
    server_port?: string;
    max_time_diff?: string;
    client_fingerprint?: string;
    [key: string]: unknown;
  }

  interface ControlTlsConfig {
    mode: ControlTlsMode;
    server_name?: string;
    cert?: ControlTlsCertConfig;
    reality?: ControlRealityConfig;
    [key: string]: unknown;
  }

  interface ControlTransportConfig {
    network: string;
    settings: ControlJsonObject;
    [key: string]: unknown;
  }

  interface ControlMultiplexConfig {
    enabled: boolean;
    padding: boolean;
    brutal?: {
      enabled: boolean;
      up_mbps: number;
      down_mbps: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface ControlLimiterConfig {
    enable_realtime: boolean;
    speed_limit: number;
    ip_limit: number;
    ip_online_min_traffic: number;
    report_min_traffic: number;
    remote_online_ip_count?: ControlJsonObject | null;
    block: {
      protocol: string[];
      regexp: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

  interface ControlNodeSnapshotConfig {
    id?: number;
    tag?: string;
    type: string;
    enabled: boolean;
    client: ControlNodeClientConfig;
    listen: {
      bind_ip?: string;
      port?: number;
      tcp_fast_open?: boolean;
      [key: string]: unknown;
    };
    settings: ControlJsonObject;
    tls: ControlTlsConfig;
    transport: ControlTransportConfig;
    multiplex: ControlMultiplexConfig;
    limiter: ControlLimiterConfig;
    [key: string]: unknown;
  }

  interface ControlNodeClientConfig {
    name?: string;
    node_tag?: string;
    public_host: string;
    public_port?: number;
    [key: string]: unknown;
  }

  interface RegisteredServiceRoute {
    service_name: string;
    ip: string;
    base_url: string;
    route_root_path: string;
  }

  interface RegisteredServiceAuth {
    service_name: string;
    service_token: string;
  }

  interface RegisteredServicesPayload {
    services: RegisteredServiceRoute[];
    routes: RegisteredServiceRoute[];
    service_auth: RegisteredServiceAuth[];
  }

  interface ControlNode extends ControlNodeSnapshotConfig {
    id: number;
    tag: string;
    config_json?: ControlConfigJson;
    rules_json?: ControlRulesJson | null;
    options_json?: ControlOptionsJson | null;
    created_at?: string;
    updated_at?: string;
  }

  interface ControlNodeSummary {
    id: number;
    tag: string;
    type: string;
    enabled: boolean;
    binding_count?: number;
    user_count?: number;
    latest_runtime_agent?: string;
    latest_startup?: Record<string, unknown> | unknown[] | null;
    latest_reported_at?: string | null;
  }

  interface ControlNodeRuntimeAgent {
    agent_id: string;
    machine_id: string;
    agent_status: string;
    last_seen_at?: string | null;
    startup?: Record<string, unknown> | unknown[] | null;
    metrics?: Record<string, unknown> | unknown[] | null;
    runtime_reported_at?: string | null;
    online_users?: number;
    online_ips?: number;
    online_reported_at?: string | null;
    traffic_upload_bytes?: number;
    traffic_download_bytes?: number;
    traffic_reported_at?: string | null;
  }

  interface ControlNodeRuntime {
    node: {
      id: number;
      tag: string;
      type: string;
      enabled: boolean;
      updated_at?: string;
    };
    agents: ControlNodeRuntimeAgent[];
  }

  interface ControlNodeSnapshot {
    id: number;
    tag: string;
    type: string;
    enabled: boolean;
    listen?: ControlJsonObject;
    settings?: ControlJsonObject;
    tls?: ControlJsonObject;
    transport?: ControlJsonObject;
    multiplex?: ControlJsonObject;
    users?: ControlJsonObject[];
    limiter?: ControlJsonObject;
    [key: string]: unknown;
  }

  interface ControlBinding {
    agent_id: string;
    node_id: number;
    status: string;
    deleted_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  interface ControlNodeUser {
    node_id: number;
    user_id: number;
    uuid: string;
    speed_limit?: number;
    ip_limit?: number;
    status: string;
    created_at?: string;
    updated_at?: string;
  }

  interface ControlNodeUserClientConfig {
    node_id: number;
    user_id: number;
    type: string;
    name: string;
    uri: string;
    client: ControlNodeClientConfig;
  }

  interface ControlAgentCreateParams {
    agent_id: string;
    machine_id: string;
    agent_secret?: string;
    status?: string;
    pull_interval?: number;
    report_interval?: number;
  }

  interface ControlAgentUpdateParams {
    machine_id?: string;
    status?: string;
    pull_interval?: number;
    report_interval?: number;
  }

  interface ControlNodeCreateParams extends ControlNodeSnapshotConfig {}

  interface ControlNodeUpdateParams extends ControlNodeSnapshotConfig {}

  interface ControlBindingCreateParams {
    node_id: number;
    status?: string;
  }

  interface ControlBindingUpdateParams {
    status: string;
  }

  interface ControlNodeUserCreateParams {
    user_id: number;
    uuid: string;
    speed_limit?: number;
    ip_limit?: number;
    status?: string;
  }

  interface ControlNodeUserUpdateParams {
    uuid?: string;
    speed_limit?: number;
    ip_limit?: number;
    status?: string;
  }

  interface ControlNodeUserBatchCreateParams {
    users: ControlNodeUserCreateParams[];
  }

  interface ControlNodeUserBatchUpdateItem {
    user_id: number;
    uuid?: string;
    speed_limit?: number;
    ip_limit?: number;
    status?: string;
  }

  interface ControlNodeUserBatchUpdateParams {
    users: ControlNodeUserBatchUpdateItem[];
  }

  interface ControlNodeUserBatchDeleteParams {
    user_ids: number[];
  }
}
