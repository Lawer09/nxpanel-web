declare namespace API {
  // ── 投放平台账号 ─────────────────────────────────────────────────────────────

  interface AdSpendAccountItem {
    id: number;
    platformCode: string;
    accountName: string;
    baseUrl: string;
    username: string;
    enabled: number;
    lastSyncAt: string;
    remark: string;
    createdAt: string;
    updatedAt: string;
  }

  interface AdSpendAccountDetail {
    id: number;
    platformCode: string;
    accountName: string;
    baseUrl: string;
    username: string;
    passwordMasked: string;
    enabled: number;
    lastSyncAt: string;
    remark: string;
  }

  interface AdSpendAccountQuery {
    platformCode?: string;
    enabled?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }

  interface AdSpendAccountCreateParams {
    platformCode: string;
    accountName: string;
    baseUrl: string;
    username: string;
    password: string;
    enabled?: number;
    remark?: string;
  }

  interface AdSpendAccountUpdateParams {
    accountName?: string;
    baseUrl?: string;
    username?: string;
    password?: string;
    enabled?: number;
    remark?: string;
  }

  interface AdSpendAccountTestResult {
    loginSuccess: boolean;
  }

  // ── 投放同步任务 ─────────────────────────────────────────────────────────────

  interface AdSpendSyncParams {
    accountId: number;
    startDate: string;
    endDate: string;
  }

  interface AdSpendSyncJobQuery {
    accountId?: number;
    platformCode?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }

  interface AdSpendSyncJobItem {
    id: number;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    startDate: string;
    endDate: string;
    status: string;
    totalRecords: number;
    successRecords: number;
    errorMessage: string;
    createdAt: string;
    updatedAt: string;
  }

  interface AdSpendSyncJobDetail extends AdSpendSyncJobItem {
    requestParams: Record<string, any>;
  }

  // ── 投放日报 ────────────────────────────────────────────────────────────────

  interface AdSpendDailyQuery {
    platformCode?: string;
    accountId?: number;
    projectCode?: string;
    country?: string;
    startDate: string;
    endDate: string;
    page?: number;
    pageSize?: number;
  }

  interface AdSpendDailyItem {
    id: number;
    reportDate: string;
    platformAccountId: number;
    platformCode: string;
    accountName: string;
    projectCode: string;
    country: string;
    impressions: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpm: string;
    cpc: string;
    updatedAt: string;
  }

  interface AdSpendSummaryQuery {
    platformCode?: string;
    accountId?: number;
    projectCode?: string;
    country?: string;
    startDate: string;
    endDate: string;
    groupBy?: 'project' | 'account' | 'country' | 'date';
  }

  interface AdSpendSummaryItem {
    projectCode?: string;
    accountName?: string;
    country?: string;
    reportDate?: string;
    impressions: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpm: string;
    cpc: string;
  }

  interface AdSpendTrendQuery {
    platformCode?: string;
    accountId?: number;
    projectCode?: string;
    country?: string;
    startDate: string;
    endDate: string;
    dimension?: 'day' | 'month';
  }

  interface AdSpendTrendItem {
    time: string;
    impressions: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpm: string;
    cpc: string;
  }

  interface AdSpendProjectCodeItem {
    projectCode: string;
  }
}
