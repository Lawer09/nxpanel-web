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
}
