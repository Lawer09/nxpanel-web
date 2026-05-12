declare namespace API {
  type ProjectAggregatesDailyGroupField = 'reportDate' | 'projectCode' | 'country';

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
    country?: string;
    groupBy?: ProjectAggregatesDailyGroupField[];
    page?: number;
    pageSize?: number;
    orderBy?:
      | 'reportDate'
      | 'projectCode'
      | 'country'
      | 'adRevenue'
      | 'adSpendCost'
      | 'trafficCost'
      | 'profit'
      | 'roi'
      | 'adSpendCpi'
      | 'totalCost'
      | 'updatedAt';
    orderDir?: 'asc' | 'desc';
  }

  interface ProjectAggregatesSummaryQuery {
    startDate: string;
    endDate: string;
    projectCode?: string;
    country?: string;
    groupBy?: 'project' | 'country' | 'date';
  }

  interface ProjectAggregatesTrendQuery {
    startDate: string;
    endDate: string;
    projectCode?: string;
    country?: string;
    dimension?: 'day' | 'month';
  }

  interface ProjectAggregatesDailyItem {
    id?: number;
    reportDate: string;
    projectCode: string;
    country: string;
    dauUsers: number;
    newUsers: number;
    reportNewUsers: number;
    adRevenue: string;
    adRequests: number;
    adMatchedRequests: number;
    adImpressions: number;
    adClicks: number;
    adEcpm: string;
    adCtr: string;
    adMatchRate: string;
    adShowRate: string;
    adSpendCost: string;
    adSpendCpi: string;
    adSpendCpc: string;
    adSpendCpm: string;
    trafficUsageMb: string;
    trafficCost: string;
    totalCost: string | null;
    profit: string;
    roi: string;
    updatedAt: string;
  }

  interface ProjectAggregatesSummaryItem {
    reportDate?: string;
    projectCode?: string;
    country?: string;
    dauUsers: number;
    newUsers: number;
    reportNewUsers: number;
    adRevenue: string;
    adRequests: number;
    adMatchedRequests: number;
    adImpressions: number;
    adClicks: number;
    adEcpm: string;
    adCtr: string;
    adMatchRate: string;
    adShowRate: string;
    adSpendCost: string;
    adSpendCpi: string;
    adSpendCpc: string;
    adSpendCpm: string;
    trafficUsageMb: string;
    trafficCost: string;
    totalCost: string | null;
    profit: string;
    roi: string;
  }

  interface ProjectAggregatesTrendItem {
    time: string;
    dauUsers: number;
    newUsers: number;
    reportNewUsers: number;
    adRevenue: string;
    adSpendCost: string;
    trafficUsageMb: string;
    trafficCost: string;
    totalCost: string | null;
    profit: string;
    roi: string;
    adSpendCpi: string;
  }
}
