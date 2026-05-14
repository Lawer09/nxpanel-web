export interface FirebaseAnalyticsFilter {
  start_time?: string;
  end_time?: string;
  time_field?: 'received_at' | 'event_time';
  app_id?: string;
  platform?: string;
  app_version?: string;
  user_country?: string;
  user_region?: string;
  network_type?: string;
  isp?: string;
  asn?: string;
  event_name?: string;
  [key: string]: any;
}

export interface KpiItem {
  value: number;
  change?: number;
}

export interface DashboardSummaryResponse {
  total_events: number;
  active_devices: number;
  app_open_count: number;
  vpn_session_count: number;
  vpn_success_rate: number;
  probe_success_rate: number;
  api_error_count: number;
  duplicate_event_count: number;
  avg_receive_delay_ms: number;
  compare: {
    total_events_rate: number;
    active_devices_rate: number;
    app_open_rate: number;
    vpn_success_rate_diff: number;
    probe_success_rate_diff: number;
    api_error_rate: number;
  };
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterOptionsResponse {
  apps: FilterOption[];
  platforms: FilterOption[];
  versions: FilterOption[];
  countries: FilterOption[];
  network_types: FilterOption[];
  isps: FilterOption[];
  asns: FilterOption[];
  event_names: FilterOption[];
}

export interface DashboardSummaryResponse {
  total_events: KpiItem;
  active_devices: KpiItem;
  app_open_count: KpiItem;
  vpn_success_rate: KpiItem;
  probe_success_rate: KpiItem;
  api_error_count: KpiItem;
}

export interface EventTrendItem {
  time: string;
  total: number;
  app_open: number;
  vpn_session: number;
  vpn_probe: number;
  server_api_error: number;
}

export interface VpnQualityTrendItem {
  time: string;
  session_count: number;
  success_count: number;
  fail_count: number;
  success_rate: number;
  avg_connect_ms: number;
  p95_connect_ms: number;
  avg_duration_ms: number;
  retry_count: number;
}

export interface RegionQualityItem {
  user_country: string;
  user_region: string;
  event_count: number;
  active_devices: number;
  vpn_session_count: number;
  vpn_success_rate: number;
  api_error_count: number;
  avg_connect_ms: number;
}

export interface ErrorTopItem {
  rank: number;
  error_stage: string;
  error_code: string;
  count: number;
  ratio: number;
  affected_devices: number;
}

export interface NodeQualityRankItem {
  rank: number;
  node_id: string;
  node_name: string;
  node_country: string;
  node_region: string;
  protocol: string;
  session_count: number;
  success_count: number;
  success_rate: number;
  avg_connect_ms: number;
  p95_connect_ms: number;
  avg_duration_ms: number;
  total_bytes: number;
  top_error_code: string;
}

export interface AppOpenSummaryResponse {
  open_count: KpiItem;
  active_devices: KpiItem;
  avg_launch_ms: KpiItem;
  p95_launch_ms: KpiItem;
  cold_start_ratio: KpiItem;
  main_channel: string;
}

export interface AppOpenTrendItem {
  timestamp: string;
  open_count: number;
  active_devices: number;
  avg_launch_ms: number;
}

export interface OpenTypeDistributionItem {
  type: string;
  count: number;
  ratio: number;
}

export interface VersionRankItem {
  version: string;
  open_count: number;
  active_devices: number;
  avg_launch_ms: number;
  p95_launch_ms: number;
  cold_start_ratio: number;
}

export interface VpnSessionSummaryResponse {
  connect_count: KpiItem;
  success_rate: KpiItem;
  avg_duration: KpiItem;
  p95_duration: KpiItem;
  avg_usage_duration: KpiItem;
  total_traffic: KpiItem;
  fail_count: KpiItem;
  retry_rate: KpiItem;
}

export interface DistributionItem {
  stage: string;
  count: number;
}

export interface ConnectTypeAnalysisItem {
  type: string;
  connect_count: number;
  success_rate: number;
  avg_duration: number;
  retry_rate: number;
}

export interface ProtocolQualityItem {
  protocol: string;
  connect_count: number;
  success_rate: number;
  avg_duration: number;
  avg_usage_duration: number;
  main_error: string;
}

export interface VpnProbeSummaryResponse {
  probe_count: KpiItem;
  result_count: KpiItem;
  avg_success_rate: KpiItem;
  avg_latency: KpiItem;
  p95_latency: KpiItem;
  avg_batch_duration: KpiItem;
  fail_node_count: KpiItem;
}

export interface VpnProbeTrendItem {
  timestamp: string;
  probe_count: number;
  success_rate: number;
  avg_latency: number;
  avg_batch_duration: number;
}

export interface ProbeTriggerDistributionItem {
  trigger: string;
  count: number;
}

export interface ProbeTypeDistributionItem {
  type: string;
  count: number;
}

export interface ProbeNodeRankItem {
  node_id: string;
  node_name: string;
  country: string;
  protocol: string;
  probe_count: number;
  success_rate: number;
  avg_latency: number;
  p95_latency: number;
  avg_tcp_connect: number;
  avg_tls_handshake: number;
  avg_proxy_handshake: number;
  main_error: string;
}

export interface ApiErrorSummaryResponse {
  error_count: KpiItem;
  active_devices: KpiItem;
  status_5xx_count: KpiItem;
  status_4xx_count: KpiItem;
  timeout_count: KpiItem;
  biz_error_count: KpiItem;
  avg_duration: KpiItem;
  retry_count: KpiItem;
}

export interface ApiErrorTrendItem {
  timestamp: string;
  error_count: number;
  active_devices: number;
  avg_duration: number;
}

export interface HttpStatusDistributionItem {
  status: number;
  count: number;
}

export interface ApiRankItem {
  domain: string;
  path: string;
  method: string;
  error_count: number;
  main_status: number;
  main_error_code: string;
  avg_duration: number;
  device_count: number;
}
