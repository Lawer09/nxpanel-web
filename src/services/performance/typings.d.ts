 // ── 性能 ─────────────────────────────────────────────────────────────────────
declare namespace API {
    
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

  // ── 聚合性能数据 (5分钟粒度) ──────────────────────────────────────────────

  interface AggregatedPerformanceParams {
    node_id?: number;
    date_from?: string;
    date_to?: string;
    client_country?: string;
    platform?: string;
    page?: number;
    page_size?: number;
  }

  interface AggregatedPerformanceItem {
    id: number;
    date: string;
    hour: number;
    minute: number;
    node_id: number;
    client_country?: string;
    client_city?: string;
    platform?: string;
    client_isp?: string;
    avg_success_rate: number;
    avg_delay: number;
    total_count: number;
  }

  // ── 用户上报次数 (5分钟粒度) ──────────────────────────────────────────────

  interface UserReportCountParams {
    user_id?: number;
    date_from?: string;
    date_to?: string;
    platform?: string;
    app_id?: string;
    order_by?: 'report_count' | 'date' | 'user_id';
    order_dir?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
  }

  interface UserReportCountItem {
    id: number;
    date: string;
    hour: number;
    minute: number;
    user_id: number;
    report_count: number;
    node_count: number;
    platform?: string;
    app_id?: string;
    app_version?: string;
  }

  // ── 用户上报次数汇总 (按天) ───────────────────────────────────────────────

  interface UserReportDailyParams {
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }

  interface UserReportDailyItem {
    date: string;
    user_id: number;
    total_reports: number;
    max_nodes: number;
    platform?: string;
    app_id?: string;
    app_version?: string;
  }

  // ── 分布查询公共参数 ──────────────────────────────────────────────────────

  interface DistributionParams {
    date_from?: string;
    date_to?: string;
    app_id?: string;
    node_id?: number;
  }

  interface VersionDistributionItem {
    app_id?: string;
    app_version?: string;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
    percentage: number;
  }

  interface PlatformDistributionItem {
    platform?: string;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
    percentage: number;
  }

  interface CountryDistributionItem {
    client_country?: string;
    client_isp?: string;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
    percentage: number;
  }

  // ── 失败节点聚合 ──────────────────────────────────────────────────────────

  interface FailedNodesParams {
    max_success_rate?: number;
    group_by?: 'country' | 'isp' | 'node' | 'time';
    date_from?: string;
    date_to?: string;
    node_id?: number;
    client_country?: string;
    client_isp?: string;
    app_id?: string;
  }

  interface FailedNodesByCountryItem {
    client_country: string;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
  }

  interface FailedNodesByIspItem {
    client_country: string;
    client_isp: string;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
  }

  interface FailedNodesByNodeItem {
    node_id: number;
    client_country: string;
    client_isp: string;
    total_reports: number;
    avg_success_rate: number;
    avg_delay: number;
    first_seen: string;
    last_seen: string;
  }

  interface FailedNodesByTimeItem {
    date: string;
    hour: number;
    total_reports: number;
    node_count: number;
    avg_success_rate: number;
    avg_delay: number;
  }

  type FailedNodesItem =
    | FailedNodesByCountryItem
    | FailedNodesByIspItem
    | FailedNodesByNodeItem
    | FailedNodesByTimeItem;
}
