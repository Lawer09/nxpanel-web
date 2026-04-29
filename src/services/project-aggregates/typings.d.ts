declare namespace API {
  type ProjectAggregatesDailyGroupField = 'reportDate' | 'projectCode' | 'adCountry';

  interface ProjectAggregatesAggregateRequest {
    startDate: string;
    endDate: string;
  }

  interface ProjectAggregatesAggregateResult {
    success: boolean;
    startDate: string;
    endDate: string;
    exitCode: number;
    output: string;
  }

  interface ProjectAggregatesAggregateAsyncResult {
    accepted: boolean;
    triggerId: string;
    startDate: string;
    endDate: string;
    status: 'queued' | string;
  }

  interface ProjectAggregatesDailyQuery {
    startDate: string;
    endDate: string;
    projectCode?: string;
    adCountry?: string;
    groupBy?: ProjectAggregatesDailyGroupField[];
    groupby?: ProjectAggregatesDailyGroupField[];
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  }

  interface ProjectAggregatesSummaryQuery {
    startDate: string;
    endDate: string;
    projectCode?: string;
    adCountry?: string;
    groupBy?: 'project' | 'country' | 'date';
  }

  interface ProjectAggregatesTrendQuery {
    startDate: string;
    endDate: string;
    projectCode?: string;
    adCountry?: string;
    dimension?: 'day' | 'month';
  }

  interface ProjectAggregatesDailyItem {
    id?: number;
    reportDate: string;
    projectCode: string;
    adCountry: string;
    reportNewUsers: number;
    dauUsers: number;
    registerNewUsers: number;
    revenue: string;
    adRequests: number;
    matchedRequests: number;
    impressions: number;
    clicks: number;
    ecpm: string;
    ctr: string;
    matchRate: string;
    showRate: string;
    adSpendCost: string;
    trafficUsageGb: string;
    trafficCost: string;
    grossProfit: string;
    roi: string;
    cpi: string;
    fbEcpm: string;
    updatedAt: string;
  }

  interface ProjectAggregatesSummaryItem {
    reportDate?: string;
    projectCode?: string;
    adCountry?: string;
    reportNewUsers: number;
    dauUsers: number;
    registerNewUsers: number;
    revenue: string;
    adRequests: number;
    matchedRequests: number;
    impressions: number;
    clicks: number;
    ecpm: string;
    ctr: string;
    matchRate: string;
    showRate: string;
    adSpendCost: string;
    trafficUsageGb: string;
    trafficCost: string;
    grossProfit: string;
    roi: string;
    cpi: string;
    fbEcpm: string;
  }

  interface ProjectAggregatesTrendItem {
    time: string;
    reportNewUsers: number;
    dauUsers: number;
    registerNewUsers: number;
    revenue: string;
    adSpendCost: string;
    trafficUsageGb: string;
    trafficCost: string;
    grossProfit: string;
    roi: string;
    cpi: string;
  }
}
