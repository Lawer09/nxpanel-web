declare namespace API {
  interface ReportPageResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    [key: string]: any;
  }

  interface NodeMainReportFilters {
    nodeIds?: number[];
    appIds?: string[];
    appVersions?: string[];
    platforms?: string[];
    clientCountries?: string[];
    clientIsps?: string[];
    nodeProtocols?: string[];
    includeExternal?: boolean;
  }

  interface NodeMainReportQuery {
    dateFrom?: string;
    dateTo?: string;
    groupBy: string[];
    filters?: NodeMainReportFilters;
    fillUnknown?: boolean;
    page?: number;
    pageSize?: number;
  }

  type NodeMainReportItem = Record<string, any>;

  type NodeSubTableType =
    | 'performance'
    | 'probe'
    | 'traffic'
    | 'server_detail'
    | 'main_aggregated';

  interface NodeSubtableFilters {
    nodeIds?: number[];
    appIds?: string[];
    appVersions?: string[];
    platforms?: string[];
    clientCountries?: string[];
    clientIsps?: string[];
    statuses?: string[];
    probeStages?: string[];
    errorCodes?: string[];
    includeExternal?: boolean;
  }

  interface NodeSubtableQuery {
    subTable: NodeSubTableType;
    date: string;
    hour?: number;
    minute?: number;
    groupBy?: string[];
    filters?: NodeSubtableFilters;
    page?: number;
    pageSize?: number;
  }

  type NodeSubtableItem = Record<string, any>;

  interface UserReportCommonQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    page?: number;
    pageSize?: number;
  }

  interface UserReportSummaryQuery extends UserReportCommonQuery {
    groupBy?: string[];
    filters?: {
      userIds?: number[];
      appIds?: string[];
      appVersions?: string[];
      countries?: string[];
    };
  }

  interface UserReportNodeSummaryQuery extends UserReportCommonQuery {
    groupBy?: string[];
    filters?: {
      nodeIds?: number[];
      nodeHosts?: string[];
      probeStages?: string[];
      nodeTypes?: string[];
    };
  }

  interface UserReportTrafficQuery extends UserReportCommonQuery {
    groupBy?: string[];
    filters?: {
      userIds?: number[];
      appIds?: string[];
      appVersions?: string[];
      countries?: string[];
    };
  }

  interface UserReportNodeFailQuery extends UserReportCommonQuery {
    groupBy?: string[];
    filters?: {
      nodeIds?: number[];
      nodeHosts?: string[];
      probeStages?: string[];
      errorCodes?: string[];
    };
  }

  type UserReportRow = Record<string, any>;
}
