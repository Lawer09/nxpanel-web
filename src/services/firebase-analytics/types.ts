import type { Dayjs } from 'dayjs';

export interface FirebaseAnalyticsFilter {
  start_time?: string;
  end_time?: string;
  time_field?: FirebaseTimeField;
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

export type FirebaseTimeField = 'received_at' | 'event_time';

export interface FirebaseAnalyticsFilterFormValues
  extends Omit<FirebaseAnalyticsFilter, 'start_time' | 'end_time'> {
  timeRange?: [Dayjs, Dayjs];
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
  projectCode?: string | null;
  projectName?: string | null;
  ownerName?: string | null;
  department?: string | null;
  adStatus?: string | null;
  remark?: string | null;
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
  protocols: FilterOption[];
  node_countries: FilterOption[];
  node_regions: FilterOption[];
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

export interface ProbeNodeStatsItem {
  node_id: string;
  node_name: string;
  node_country: string;
  node_region: string;
  protocol: string;
  test_count: number;
  success_count: number;
  fail_count: number;
  success_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  avg_tcp_connect_ms: number;
  avg_tls_hk_ms: number;
  avg_proxy_hk_ms: number;
  top_error_code: string;
  last_received_at: string;
}

export type NodeDiagnosisStatus =
  | 'connect_gap'
  | 'probe_only'
  | 'dual_risk'
  | 'session_risk'
  | 'probe_risk'
  | 'session_only'
  | 'healthy';

export type NodeSampleScope = 'all' | 'probe_only' | 'session_only' | 'dual';

export interface NodeStatusListParams extends FirebaseAnalyticsFilter {
  node_id?: string;
  node_name?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
  diagnosis_status?: NodeDiagnosisStatus;
  sample_scope?: NodeSampleScope;
  page?: number;
  page_size?: number;
  sort_by?:
    | 'diagnosis_priority'
    | 'rate_gap'
    | 'probe_success_rate'
    | 'session_success_rate'
    | 'probe_test_count'
    | 'session_count'
    | 'p95_latency_ms'
    | 'p95_connect_ms'
    | 'last_probe_received_at'
    | 'last_session_received_at';
  order?: 'asc' | 'desc';
}

export interface NodeStatusListItem {
  node_id: string;
  node_name: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
  diagnosis_status: NodeDiagnosisStatus;
  diagnosis_priority: number;
  sample_scope: NodeSampleScope;
  rate_gap?: number;
  session_count: number;
  session_success_count: number;
  session_fail_count: number;
  session_success_rate?: number;
  avg_connect_ms?: number;
  p95_connect_ms?: number;
  avg_duration_ms?: number;
  retry_session_count?: number;
  total_bytes?: number;
  session_top_error_code?: string;
  last_session_received_at?: string;
  probe_test_count: number;
  probe_success_count: number;
  probe_fail_count: number;
  probe_success_rate?: number;
  avg_latency_ms?: number;
  p95_latency_ms?: number;
  avg_tcp_connect_ms?: number;
  avg_tls_hk_ms?: number;
  avg_proxy_hk_ms?: number;
  probe_top_error_code?: string;
  last_probe_received_at?: string;
}

export interface NodeStatusListResponse {
  page: number;
  page_size: number;
  total: number;
  items: NodeStatusListItem[];
}

export interface NodeConnectionSummaryParams extends FirebaseAnalyticsFilter {
  node_id?: string;
  node_name?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
}

export interface NodeConnectionSummaryResponse {
  session_count: number;
  success_count: number;
  fail_count: number;
  success_rate?: number;
  active_devices?: number;
  avg_connect_ms?: number;
  p95_connect_ms?: number;
  avg_duration_ms?: number;
  retry_session_count?: number;
  retry_rate?: number;
  total_upload_bytes?: number;
  total_download_bytes?: number;
  total_bytes?: number;
  top_error_code?: string;
  last_received_at?: string;
}

export interface NodeConnectionErrorDistributionItem {
  error_stage?: string;
  error_code?: string;
  count: number;
  ratio?: number;
  affected_devices?: number;
}

export interface NodeConnectionResultParams extends NodeConnectionSummaryParams {
  success?: boolean | string | number;
  error_stage?: string;
  error_code?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'received_at' | 'event_time_ms' | 'connect_ms' | 'duration_ms' | 'retry_count' | 'id';
  order?: 'asc' | 'desc';
}

export interface NodeConnectionResultItem {
  id: number;
  event_id: string;
  received_at?: string;
  event_time_ms?: number;
  app_id?: string;
  platform?: string;
  app_version?: string;
  device_id?: string;
  user_id?: string;
  user_country?: string;
  user_region?: string;
  network_type?: string;
  isp?: string;
  asn?: string;
  session_id?: string;
  node_id?: string;
  node_name?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
  connect_type?: string;
  success?: boolean | number;
  connect_ms?: number;
  duration_ms?: number;
  retry_count?: number;
  error_stage?: string;
  error_code?: string;
  error_message?: string;
}

export interface NodeConnectionResultsResponse {
  page: number;
  page_size: number;
  total: number;
  items: NodeConnectionResultItem[];
}

export interface ProbeResultItem {
  id: number;
  event_id: string;
  received_at?: string;
  event_time_ms?: number;
  app_id?: string;
  platform?: string;
  app_version?: string;
  device_id?: string;
  user_id?: string;
  user_country?: string;
  user_region?: string;
  network_type?: string;
  isp?: string;
  asn?: string;
  probe_id?: string;
  probe_type?: string;
  probe_trigger?: string;
  result_index?: number;
  node_id?: string;
  node_name?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
  success?: boolean | number;
  latency_ms?: number;
  tcp_connect_ms?: number;
  tls_hk_ms?: number;
  proxy_hk_ms?: number;
  error_code?: string;
  error_message?: string;
  timeout_ms?: number;
}

export interface ProbeResultsResponse {
  page: number;
  page_size: number;
  total: number;
  items: ProbeResultItem[];
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

export type FirebaseAppConnectionReportOrderBy =
  | 'appId'
  | 'date'
  | 'platform'
  | 'appVersion'
  | 'avgPingMs'
  | 'clientConnectCount'
  | 'successCount'
  | 'successRate'
  | 'failCount'
  | 'failRate'
  | 'cancelRate'
  | 'activeUserCount';

export interface FirebaseAppConnectionReportQueryParams {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: Array<'date' | 'appId' | 'platform' | 'appVersion'>;
  filters?: {
    appIds?: string[];
    platforms?: string[];
    appVersions?: string[];
  };
  page?: number;
  pageSize?: number;
  orderBy?: FirebaseAppConnectionReportOrderBy;
  orderDirection?: 'asc' | 'desc';
}

export interface FirebaseAppConnectionReportItem {
  appId?: string;
  date?: string | null;
  platform?: string;
  appVersion?: string;
  projectCode?: string | null;
  projectName?: string | null;
  projectOwnerName?: string | null;
  projectDepartment?: string | null;
  projectAdStatus?: string | null;
  projectRemark?: string | null;
  avgPingMs?: number | null;
  clientConnectCount: number;
  successCount: number;
  successRate: number;
  failCount: number;
  failRate: number;
  cancelCount?: number;
  cancelRate: number;
  activeUserCount: number;
}

export interface FirebaseAppConnectionReportResponse {
  data: FirebaseAppConnectionReportItem[];
  summary: FirebaseAppConnectionReportItem;
  total: number;
  page: number;
  pageSize: number;
  dateFrom: string;
  dateTo: string;
}

export interface FirebaseAppConnectionSyncResponse {
  success: boolean;
  exitCode: number;
  dateFrom: string;
  dateTo: string;
  message: string;
}
