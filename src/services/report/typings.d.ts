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

  interface NodeServerRealtimeQuery {
    page?: number;
    pageSize?: number;
  }

  type NodeServerRealtimeItem = Record<string, any>;

  interface NodeServerRealtimeResult {
    data: NodeServerRealtimeItem[];
    total: number;
    page: number;
    pageSize: number;
  }

  interface NodeServerReportNodeQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    groupBy?: Array<'date' | 'hour' | 'node_id' | 'node_type' | 'node_host' | 'node_public_ip'>;
    filters?: {
      nodeIds?: number[];
      nodeTypes?: string[];
      nodeHosts?: string[];
      nodePublicIps?: string[];
    };
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  interface NodeServerReportNodeItem {
    date?: string;
    hour?: number;
    nodeId?: number;
    nodeType?: string;
    nodeHost?: string;
    nodePublicIp?: string;
    trafficUpload?: number;
    trafficDownload?: number;
    avgCpuUsage?: number;
    avgMemUsage?: number;
    maxCpuUsage?: number;
    maxMemUsage?: number;
    avgDiskUsage?: number;
    avgInboundSpeed?: number;
    avgOutboundSpeed?: number;
    maxInboundSpeed?: number;
    maxOutboundSpeed?: number;
    avgTcpConnections?: number;
    maxTcpConnections?: number;
    avgAliveUsers?: number;
    maxAliveUsers?: number;
    computeCount?: number;
  }

  interface NodeServerReportUserQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    groupBy?: Array<'date' | 'hour' | 'node_id' | 'user_id' | 'app_id' | 'app_version' | 'country'>;
    filters?: {
      nodeIds?: number[];
      userIds?: number[];
      appIds?: string[];
      appVersions?: string[];
      countries?: string[];
    };
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  interface NodeServerReportUserItem {
    date?: string;
    hour?: number;
    nodeId?: number;
    userId?: number;
    appId?: string;
    appVersion?: string;
    country?: string;
    trafficUpload?: number;
    trafficDownload?: number;
    computeCount?: number;
  }

  interface NodeReportHourlyQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    groupBy?: Array<'date' | 'hour' | 'node_id' | 'node_type' | 'node_host' | 'node_public_ip' | 'probe_stage'>;
    filters?: {
      nodeIds?: number[];
      nodeTypes?: string[];
      nodeHosts?: string[];
      nodePublicIps?: string[];
      probeStages?: string[];
    };
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  interface NodeReportHourlyItem {
    date?: string;
    hour?: number;
    nodeId?: number;
    nodeType?: string;
    nodeHost?: string;
    nodePublicIp?: string;
    probeStage?: string;
    trafficUpload?: number;
    trafficDownload?: number;
    avgCpuUsage?: number;
    avgMemUsage?: number;
    maxCpuUsage?: number;
    maxMemUsage?: number;
    avgDiskUsage?: number;
    avgInboundSpeed?: number;
    avgOutboundSpeed?: number;
    maxInboundSpeed?: number;
    maxOutboundSpeed?: number;
    avgTcpConnections?: number;
    maxTcpConnections?: number;
    avgAliveUsers?: number;
    maxAliveUsers?: number;
    avgDelay?: number;
    trafficUsage?: number;
    trafficUseTime?: number;
    successCount?: number;
    failCount?: number;
    successRate?: number;
    reportCountNode?: number;
    reportCountUser?: number;
  }

  interface UserReportHourlyQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    groupBy?: Array<'date' | 'hour' | 'user_id' | 'app_id' | 'app_version' | 'country'>;
    filters?: {
      userIds?: number[];
      appIds?: string[];
      appVersions?: string[];
      countries?: string[];
    };
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  interface UserReportHourlyItem {
    date?: string;
    hour?: number;
    userId?: number;
    appId?: string;
    appVersion?: string;
    country?: string;
    trafficUsage?: number;
    trafficUseTime?: number;
    trafficUpload?: number;
    trafficDownload?: number;
    reportCountUser?: number;
    reportCountNode?: number;
  }

  interface UserReportCommonQuery {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
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

  type ProjectReportDimension = 'reportDate' | 'projectCode' | 'country';

  interface ProjectReportQuery {
    dateFrom?: string;
    dateTo?: string;
    groupBy?: ProjectReportDimension[];
    filters?: {
      projectCodes?: string[];
      countries?: string[];
    };
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }

  type ProjectReportItem = Record<string, any>;

  type UserReportRow = Record<string, any>;
}
