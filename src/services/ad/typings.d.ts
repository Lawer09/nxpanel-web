declare namespace API {
  // ── 广告账号 ────────────────────────────────────────────────────────────────

  interface AdAccount {
    id: number;
    sourcePlatform: string;
    accountName: string;
    accountLabel: string;
    authType: string;
    credentialsJson: Record<string, any>;
    status: string;
    tags: string[];
    assignedServerId: string;
    backupServerId: string;
    isolationGroup: string;
    reportingTimezone: string;
    currencyCode: string;
    createdAt: string;
    updatedAt: string;
  }

  interface AdAccountUpsertRequest {
    sourcePlatform: string;
    accountName: string;
    accountLabel?: string;
    authType: string;
    credentialsJson: Record<string, any>;
    status: string;
    tags?: string[];
    assignedServerId?: string;
    backupServerId?: string;
    isolationGroup?: string;
  }


  interface AdAccountQuery {
    sourcePlatform?: string;
    status?: string;
    assignedServerId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  interface BatchAssignServerRequest {
    accountIds: number[];
    assignedServerId: string;
    backupServerId?: string;
    isolationGroup?: string;
  }

  // ── 项目映射 ────────────────────────────────────────────────────────────────

  interface ProjectMapping {
    id: number;
    projectId: number;
    sourcePlatform: string;
    accountId: number;
    providerAppId: string;
    status: string;
    account?: {
      id: number;
      accountName: string;
      sourcePlatform: string;
    };
    createdAt: string;
    updatedAt: string;
  }

  interface ProjectMappingQuery {
    projectId?: number;
    sourcePlatform?: string;
    accountId?: number;
    status?: 'enabled' | 'disabled';
    page?: number;
    pageSize?: number;
  }

  interface ProjectMappingUpsertRequest {
    projectId: number;
    sourcePlatform: string;
    accountId: number;
    providerAppId: string;
    status: string;
  }

  // ── 同步服务器 ──────────────────────────────────────────────────────────────

  interface SyncServer {
    serverId: string;
    serverName: string;
    hostIp: string;
    status: string;
    secretKey: string;
    lastHeartbeatAt: string;
    tags: string[];
  }

  interface SyncServerCreateRequest {
    serverId: string;
    serverName: string;
    hostIp?: string;
    secretKey?: string;
    tags?: string[];
  }

  interface TestSyncResult {
    url: string;
    httpStatus: number;
    body: any;
  }

  // ── 同步状态 & 日志 ────────────────────────────────────────────────────────

  interface SyncState {
    id: number;
    syncScope: string;
    accountId: number;
    status: string;
    lastSuccessAt: string;
    lastErrorMessage: string;
  }

  interface SyncLog {
    id: number;
    serverId: string;
    scope: string;
    status: string;
    rowCount: number;
    startedAt: string;
    endedAt: string;
    errorMessage: string;
  }

  interface SyncLogQuery {
    serverId?: string;
    status?: string;
    scope?: string;
    startedFrom?: string;
    startedTo?: string;
    page?: number;
    pageSize?: number;
  }

  interface SyncStateQuery {
    serverId?: string;
    scope?: string;
    accountId?: number;
    page?: number;
    pageSize?: number;
  }

  interface SyncTriggerRequest {
    scope: string;
    accountIds?: number[];
    assignedServerId?: string;
  }

  // ── 广告收益报表 ────────────────────────────────────────────────────────────

  interface AdRevenueQuery {
    dateFrom?: string;
    dateTo?: string;
    sourcePlatform?: string;
    accountId?: number;
    projectId?: number;
    providerAppId?: string;
    providerAdUnitId?: string;
    countryCode?: string;
    devicePlatform?: string;
    adFormat?: string;
    reportType?: string;
    orderBy?: string;
    orderDir?: string;
    page?: number;
    pageSize?: number;
  }

  interface AdRevenueItem {
    reportDate: string;
    sourcePlatform: string;
    accountId: number;
    providerAppId: string;
    providerAdUnitId: string;
    countryCode: string;
    devicePlatform: string;
    adFormat: string;
    reportType: string;
    adSourceCode: string;
    adRequests: number;
    matchedRequests: number;
    impressions: number;
    clicks: number;
    estimatedEarnings: number;
    ecpm: number;
    ctr: number;
    matchRate: number;
    showRate: number;
  }

  type AdRevenueGroupBy =
    | 'reportDate'
    | 'sourcePlatform'
    | 'accountId'
    | 'providerAppId'
    | 'providerAdUnitId'
    | 'countryCode'
    | 'devicePlatform'
    | 'adFormat'
    | 'reportType'
    | 'adSourceCode';

  interface AdRevenueAggregateRequest extends AdRevenueQuery {
    groupBy: AdRevenueGroupBy[];
  }

  interface AdRevenueTrendQuery extends AdRevenueQuery {
    compareDateFrom?: string;
    compareDateTo?: string;
  }

  interface AdRevenueTrendResponse {
    current: AdRevenueItem[];
    compare?: AdRevenueItem[];
  }

  interface AdRevenueSummary {
    adRequests: number;
    impressions: number;
    clicks: number;
    estimatedEarnings: number;
    ecpm: number;
    ctr: number;
    matchRate: number;
    accountCount: number;
    appCount: number;
    dayCount: number;
  }

  interface AdRevenueTopRankRequest extends AdRevenueQuery {
    rankBy: 'app' | 'adUnit' | 'country' | 'account' | 'platform';
    metric?: string;
    limit?: number;
  }

  // ── APP 列表 ──────────────────────────────────────────────────────────────

  interface AdRevenueAppQuery {
    sourcePlatform?: string;
    accountId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  interface AdRevenueAppItem {
    id: number;
    sourcePlatform: string;
    accountId: number;
    accountName: string | null;
    accountLabel: string | null;
    providerAppId: string;
    providerAppName: string;
    devicePlatform: string;
    appStoreId: string;
    appApprovalState: string;
    createdAt: string;
    updatedAt: string;
  }
}
