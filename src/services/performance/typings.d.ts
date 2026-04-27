 // ── 性能 ─────────────────────────────────────────────────────────────────────
declare namespace API {
    
  interface PerformanceFetchParams {
    nodeId?: number;
    userId?: number;
    platform?: 'ios' | 'android' | 'windows' | 'macos' | 'linux';
    clientCountry?: string;
    startAt?: number;
    endAt?: number;
    page?: number;
    pageSize?: number;
  }

  interface PerformanceRecord {
    id: number;
    userId: number;
    nodeId: number;
    delay: number;
    successRate: number;
    client_ip?: string;
    clientCountry?: string;
    clientCity?: string;
    clientIsp?: string;
    platform?: string;
    appVersion?: string;
    createdAt: number;
    user?: { id: number; email: string };
  }

  interface PerformanceNodeStatItem {
    nodeId: number;
    reportCount: number;
    avgDelay: number;
    minDelay: number;
    maxDelay: number;
    avgSuccessRate: number;
    uniqueUsers: number;
  }

  interface PerformanceNodeStatsData {
    periodDays: number;
    data: PerformanceNodeStatItem[];
  }

  interface PerformanceTrendItem {
    timeSlot: string;
    avgDelay: number;
    minDelay: number;
    maxDelay: number;
    avgSuccessRate: number;
    reportCount: number;
  }

  interface PerformanceTrendData {
    nodeId: number;
    periodDays: number;
    granularity: string;
    data: PerformanceTrendItem[];
  }

  interface PerformanceGeoItem {
    clientCountry: string;
    reportCount: number;
    uniqueUsers: number;
    avgDelay: number;
    avgSuccessRate: number;
  }

  interface PerformanceGeoData {
    periodDays: number;
    data: PerformanceGeoItem[];
  }

  interface PerformancePlatformItem {
    platform: string;
    reportCount: number;
    uniqueUsers: number;
    avgDelay: number;
    avgSuccessRate: number;
  }

  interface PerformancePlatformData {
    periodDays: number;
    data: PerformancePlatformItem[];
  }

  // ── 聚合性能数据 (5分钟粒度) ──────────────────────────────────────────────

  type AggregatedGroupBy = 'node' | 'country' | 'isp' | 'platform' | 'appVersion' | 'date' | 'hour';

  interface AggregatedPerformanceParams {
    groupBy?: AggregatedGroupBy;
    nodeId?: number;
    dateFrom?: string;
    dateTo?: string;
    clientCountry?: string;
    clientIsp?: string;
    platform?: string;
    appId?: string;
    appVersion?: string;
    page?: number;
    pageSize?: number;
  }

  interface AggregatedPerformanceItem {
    id?: number;
    date?: string;
    hour?: number;
    minute?: number;
    nodeId?: number;
    nodeName?: string;
    nodeType?: string;
    clientCountry?: string;
    clientCity?: string;
    clientIsp?: string;
    platform?: string;
    appId?: string;
    appVersion?: string;
    avgSuccessRate: number;
    avgDelay: number;
    totalCount: number;
    nodeCount?: number;
    recordCount?: number;
  }

  // ── 用户上报次数 (5分钟粒度) ──────────────────────────────────────────────

  interface UserReportCountParams {
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    platform?: string;
    appId?: string;
    orderBy?: 'reportCount' | 'date' | 'userId';
    orderDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }

  interface UserReportCountItem {
    id: number;
    date: string;
    hour: number;
    minute: number;
    userId: number;
    reportCount: number;
    nodeCount: number;
    platform?: string;
    appId?: string;
    appVersion?: string;
  }

  // ── 用户上报次数汇总 (按天) ───────────────────────────────────────────────

  interface UserReportDailyParams {
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }

  interface UserReportDailyItem {
    date: string;
    userId: number;
    totalReports: number;
    maxNodes: number;
    platform?: string;
    appId?: string;
    appVersion?: string;
  }

  // ── 用户上报实时数据 ─────────────────────────────────────────────────────

  interface UserReportRealtimeParams {
    appId?: string;
    page?: number;
    pageSize?: number;
  }

  interface UserReportRealtimeItem {
    user_id: number;
    ip: string;
    created_at: string;
    metadata?: Record<string, any>;
    user_default?: Record<string, any>;
    reports?: Record<string, any>;
  }

  // ── 分布查询公共参数 ──────────────────────────────────────────────────────

  interface DistributionParams {
    dateFrom?: string;
    dateTo?: string;
    appId?: string;
    nodeId?: number;
  }

  interface VersionDistributionItem {
    appId?: string;
    appVersion?: string;
    totalReports: number;
    nodeCount: number;
    avgSuccessRate: number;
    avgDelay: number;
    percentage: number;
  }

  interface PlatformDistributionItem {
    platform?: string;
    totalReports: number;
    nodeCount: number;
    avgSuccessRate: number;
    avgDelay: number;
    percentage: number;
  }

  interface CountryDistributionItem {
    clientCountry?: string;
    clientIsp?: string;
    totalReports: number;
    nodeCount: number;
    avgSuccessRate: number;
    avgDelay: number;
    percentage: number;
  }

  // ── 用户留存分析 ──────────────────────────────────────────────────────────

  interface RetentionParams {
    dateFrom?: string;
    dateTo?: string;
    appId?: string;
    platform?: string;
  }

  interface RetentionDayData {
    count: number;
    rate: number;
  }

  interface RetentionCohortItem {
    date: string;
    activeUsers: number;
    retention: {
      day1: RetentionDayData | null;
      day3: RetentionDayData | null;
      day7: RetentionDayData | null;
      day14: RetentionDayData | null;
      day30: RetentionDayData | null;
    };
  }

  interface RetentionData {
    data: RetentionCohortItem[];
    dateFrom: string;
    dateTo: string;
    retentionDays: number[];
  }

  // ── 活跃用户趋势 ──────────────────────────────────────────────────────────

  interface ActiveUsersParams {
    dateFrom?: string;
    dateTo?: string;
    appId?: string;
    platform?: string;
    granularity?: 'day' | 'week' | 'month';
  }

  interface ActiveUsersTrendItem {
    period: string;
    periodStart?: string;
    periodEnd?: string;
    activeUsers: number;
    newUsers: number;
    totalReports: number;
  }

  interface ActiveUsersTrendData {
    data: ActiveUsersTrendItem[];
    granularity: string;
  }

  // ── 活跃用户概览 ──────────────────────────────────────────────────────────

  interface ActiveUsersSummaryParams {
    appId?: string;
    platform?: string;
  }

  interface ActiveUsersMetric {
    count: number;
    yesterday?: number;
    lastWeek?: number;
    lastMonth?: number;
    change: number;
  }

  interface ActiveUsersSummaryData {
    dau: ActiveUsersMetric;
    wau: ActiveUsersMetric;
    mau: ActiveUsersMetric;
  }

  interface UserHourlyStatItem {
    time: string;
    newUsers: number;
    activeUsers: number;
  }

  interface UserHourlyStatsData {
    data: UserHourlyStatItem[];
    start: string;
    end: string;
  }
}
