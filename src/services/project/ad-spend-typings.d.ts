declare namespace API {
  // ── 项目投放 ────────────────────────────────────────────────────────────────

  interface ProjectAdSpendSummaryQuery {
    startDate: string;
    endDate: string;
    country?: string;
    accountId?: number;
  }

  interface ProjectAdSpendTrendQuery {
    startDate: string;
    endDate: string;
    dimension?: 'day' | 'month';
    country?: string;
    accountId?: number;
  }

  interface ProjectAdSpendDailyQuery {
    startDate: string;
    endDate: string;
    country?: string;
    accountId?: number;
    page?: number;
    pageSize?: number;
  }

  interface ProjectAdSpendSummaryItem {
    projectCode: string;
    impressions: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpm: string;
    cpc: string;
  }

  interface ProjectAdSpendTrendItem {
    time: string;
    impressions: number;
    clicks: number;
    spend: string;
    ctr: string;
    cpm: string;
    cpc: string;
  }

  interface ProjectAdSpendDailyItem {
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
  }
}