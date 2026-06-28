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

  type ControlJsonObject = Record<string, unknown>;

  interface ControlConfigJson {
    listen?: ControlJsonObject;
    settings?: ControlJsonObject;
    tls?: ControlJsonObject;
    transport?: ControlJsonObject;
    multiplex?: ControlJsonObject;
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

  interface ControlAgent {
    id: number;
    agent_id: string;
    machine_id: string;
    asset_machine_id?: number;
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
    public_key?: string;
    short_id?: string;
    dest?: string;
    server_port?: string;
    max_time_diff?: string;
    client_fingerprint?: string;
    [key: string]: unknown;
  }

  type ControlTlsMode = 'none' | 'tls' | 'reality' | string;

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
    } | null;
    [key: string]: unknown;
  }

  interface ControlLimiterBlockConfig {
    protocol: string[];
    regexp: string[];
    [key: string]: unknown;
  }

  interface ControlLimiterConfig {
    enable_realtime: boolean;
    speed_limit: number;
    ip_limit: number;
    ip_online_min_traffic: number;
    report_min_traffic: number;
    block: ControlLimiterBlockConfig;
    remote_online_ip_count?: ControlJsonObject | null;
    [key: string]: unknown;
  }

  interface ControlNodeClientConfig {
    name?: string;
    node_tag?: string;
    public_host: string;
    public_port?: number;
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
    multiplex: ControlMultiplexConfig | null;
    limiter: ControlLimiterConfig | null;
    [key: string]: unknown;
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
    client?: Partial<ControlNodeClientConfig> | null;
    binding_count?: number;
    user_count?: number;
    latest_runtime_agent?: string;
    latest_startup?: Record<string, unknown> | unknown[] | null;
    latest_reported_at?: string | null;
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

  interface ControlUserClientConfigsResponse {
    user_id: number;
    configs: ControlNodeUserClientConfig[];
  }

  interface ControlTaskAck {
    task_id: number;
    status?: string;
    task_url?: string;
    [key: string]: unknown;
  }

  interface ControlRuntimeNodeSummary {
    node_id: number;
    client?: Partial<ControlNodeClientConfig> | null;
    tag: string;
    type: string;
    enabled: boolean;
    startup?: Record<string, unknown> | unknown[] | null;
    tls?: Record<string, unknown> | unknown[] | null;
    metrics?: Record<string, unknown> | unknown[] | null;
    runtime_reported_at?: string | null;
    reported_at?: string | null;
    fresh?: boolean;
    stale_seconds?: number;
    source?: string;
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

  interface ControlNodeRuntimeAgent {
    agent_id: string;
    machine_id: string;
    agent_status: string;
    last_seen_at?: string | null;
    startup?: Record<string, unknown> | unknown[] | null;
    tls?: Record<string, unknown> | unknown[] | null;
    metrics?: Record<string, unknown> | unknown[] | null;
    runtime_reported_at?: string | null;
    reported_at?: string | null;
    fresh?: boolean;
    stale_seconds?: number;
    source?: string;
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
      client?: Partial<ControlNodeClientConfig> | null;
      tag: string;
      type: string;
      enabled: boolean;
      updated_at?: string;
    };
    agents: ControlNodeRuntimeAgent[];
  }

  interface ControlRuntimeOverview {
    online_agents: number;
    unhealthy_agents: number;
    unhealthy_nodes: number;
    current_online_users: number;
    current_online_ips: number;
    traffic_upload_24h: number;
    traffic_download_24h: number;
  }

  interface ControlRuntimeSamplePoint {
    reported_at: string;
    cpu?: number;
    mem_used?: number;
    mem_total?: number;
    active_connections?: number;
    total_connections?: number;
    tcp_connections?: number;
    inbound_speed?: number;
    outbound_speed?: number;
    active_users?: number;
  }

  interface ControlRuntimeSampleSeries {
    agent_id: string;
    node_id: number;
    points: ControlRuntimeSamplePoint[];
  }

  interface ControlRuntimeSamplesResponse {
    window: string;
    step: string;
    series: ControlRuntimeSampleSeries[];
  }

  interface ControlTrafficPoint {
    bucket_start: string;
    upload_bytes: number;
    download_bytes: number;
  }

  interface ControlTrafficSeriesResponse {
    start_time: string;
    end_time: string;
    step: string;
    points: ControlTrafficPoint[];
  }

  interface ControlNodeOnlineUserItem {
    user_id: number;
    online_count: number;
  }

  interface ControlNodeOnlineSummary {
    node_id: number;
    agent_id?: string | null;
    online_users: number;
    online_ips: number;
    users?: ControlNodeOnlineUserItem[];
  }

  interface ControlRuntimeEvent {
    id: number;
    agent_id: string;
    node_id?: number | null;
    event_type: string;
    healthy?: boolean;
    state?: string;
    stage?: string;
    last_error?: string;
    payload?: ControlJsonObject | null;
    reported_at?: string | null;
  }

  interface ControlAgentCreateParams {
    agent_id: string;
    machine_id: string;
    status?: string;
    pull_interval?: number;
    report_interval?: number;
  }

  interface ControlAgentDeployParams {
    asset_machine_id: number;
    agent_id?: string;
    binary_url?: string;
    node_service_base_url?: string;
    pull_interval?: number;
    report_interval?: number;
    timeout_seconds?: number;
    force?: boolean;
  }

  interface ControlAgentDeployResponse {
    agent: ControlAgent;
    agent_secret: string;
    machine?: Record<string, unknown> | null;
    deploy_task?: ControlTaskAck | null;
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

  interface ControlAgentRuntimeSamplesParams {
    node_id?: number;
    window?: string;
  }

  interface ControlNodeRuntimeSamplesParams {
    agent_id?: string;
    window?: string;
  }

  interface ControlAgentTrafficParams {
    node_id?: number;
    user_id?: number;
    start_time?: string;
    end_time?: string;
    step?: string;
  }

  interface ControlNodeTrafficParams {
    agent_id?: string;
    user_id?: number;
    start_time?: string;
    end_time?: string;
    step?: string;
  }

  interface ControlNodeOnlineParams {
    agent_id?: string;
    include_users?: boolean;
  }

  interface ControlAgentRuntimeEventsParams {
    event_type?: string;
    limit?: number;
  }

  interface ControlNodeRuntimeEventsParams {
    agent_id?: string;
    event_type?: string;
    limit?: number;
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
}
