declare namespace API {
  // ── 流量平台 ────────────────────────────────────────────────────────────────

  interface TrafficPlatformItem {
    id: number;
    code: string;
    name: string;
    baseUrl: string;
    supportsHourly: number;
    enabled: number;
    remark: string;
    createdAt: string;
    updatedAt: string;
  }

  interface TrafficPlatformQuery {
    enabled?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficPlatformCreateParams {
    code: string;
    name: string;
    baseUrl: string;
    supportsHourly?: number;
    enabled?: number;
    remark?: string;
  }

  interface TrafficPlatformUpdateParams {
    name?: string;
    baseUrl?: string;
    supportsHourly?: number;
    enabled?: number;
    remark?: string;
  }

  // ── 流量平台账号 ──────────────────────────────────────────────────────────────

  interface TrafficAccountItem {
    id: number;
    platformId: number;
    platformCode: string;
    platformName: string;
    accountName: string;
    externalAccountId: string;
    timezone: string;
    enabled: number;
    lastSyncAt: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
  }

  interface TrafficAccountDetail extends TrafficAccountItem {
    credentialMasked: Record<string, any>;
  }

  interface TrafficAccountQuery {
    platformCode?: string;
    enabled?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficAccountCreateParams {
    platformCode: string;
    accountName: string;
    externalAccountId: string;
    credential: Record<string, any>;
    timezone?: string;
    enabled?: number;
    remark?: string;
  }

  interface TrafficAccountUpdateParams {
    accountName?: string;
    externalAccountId?: string;
    credential?: Record<string, any>;
    timezone?: string;
    enabled?: number;
    remark?: string;
  }

  interface TrafficAccountTestOverview {
    balance: number;
    todayUse?: number;
    monthUse?: number;
    today_use?: number;
    month_use?: number;
  }

  interface TrafficAccountTestResult {
    balance?: number;
    todayUse?: number;
    monthUse?: number;
    overview?: TrafficAccountTestOverview;
    debug?: {
      overview?: TrafficAccountTestOverview;
      [key: string]: any;
    };
    [key: string]: any;
  }

  // ── 流量查询 ────────────────────────────────────────────────────────────────

  interface TrafficHourlyQuery {
    platformCode?: string;
    accountId?: number;
    externalUid?: string;
    geo?: string;
    startTime: string;
    endTime: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficHourlyItem {
    statHour: string;
    statDate: string;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    externalUid: string;
    externalUsername: string;
    geo: string;
    region: string;
    trafficBytes: number;
    trafficMb: string;
    trafficGb: string;
    statMethod: string;
    isEstimated: number;
  }

  interface TrafficDailyQuery {
    platformCode?: string;
    accountId?: number;
    externalUid?: string;
    geo?: string;
    startDate: string;
    endDate: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficDailyItem {
    statDate: string;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    externalUid: string;
    externalUsername: string;
    geo: string;
    region: string;
    trafficBytes: number;
    trafficMb: string;
    trafficGb: string;
  }

  interface TrafficMonthlyQuery {
    platformCode?: string;
    accountId?: number;
    externalUid?: string;
    startMonth: string;
    endMonth: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficMonthlyItem {
    statMonth: string;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    externalUid: string;
    externalUsername: string;
    trafficBytes: number;
    trafficMb: string;
    trafficGb: string;
  }

  interface TrafficTrendQuery {
    platformCode?: string;
    accountId?: number;
    externalUid?: string;
    startTime: string;
    endTime: string;
    dimension: 'hour' | 'day' | 'month';
  }

  interface TrafficTrendItem {
    time: string;
    trafficBytes: number;
    trafficMb: string;
    trafficGb: string;
  }

  interface TrafficRankingQuery {
    platformCode?: string;
    accountId?: number;
    startDate: string;
    endDate: string;
    rankBy: 'account' | 'externalUid' | 'geo';
    limit?: number;
  }

  interface TrafficRankingItem {
    rank: number;
    key: string;
    name: string;
    trafficBytes: number;
    trafficMb: string;
    trafficGb: string;
  }

  // ── 同步任务 ────────────────────────────────────────────────────────────────

  interface TrafficSyncParams {
    accountId: number;
    platformCode: string;
    startDate: string;
    endDate: string;
  }

  interface TrafficSyncJobQuery {
    platformCode?: string;
    accountId?: number;
    status?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }

  interface TrafficSyncJobItem {
    id: number;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    syncType: string;
    syncMode: string;
    startTime: string;
    endTime: string;
    status: string;
    errorMessage: string;
    createdAt: string;
    updatedAt: string;
  }

  interface TrafficSyncJobDetail extends TrafficSyncJobItem {
    requestParams: Record<string, any>;
    responseSummary: Record<string, any>;
  }
}
