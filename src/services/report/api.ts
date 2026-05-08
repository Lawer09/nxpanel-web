import { request } from '@umijs/max';

export async function queryNodeMainReport(data: API.NodeMainReportQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.NodeMainReportItem>>>(
    '/v3/report/node/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryNodeSubtable(data: API.NodeSubtableQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.NodeSubtableItem>>>(
    '/v3/report/node/subtable/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryNodeServerRealtime(data: API.NodeServerRealtimeQuery) {
  return request<API.ApiResponse<API.NodeServerRealtimeResult>>(
    '/v3/report/nodeServer/realtime',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryNodeServerReportNode(data: API.NodeServerReportNodeQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.NodeServerReportNodeItem>>>(
    '/v3/report/nodeServerReport/node/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryNodeServerReportUser(data: API.NodeServerReportUserQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.NodeServerReportUserItem>>>(
    '/v3/report/nodeServerReport/user/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryUserReportSummary(data: API.UserReportSummaryQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.UserReportRow>>>(
    '/v3/report/userReport/summary/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryUserReportNodeSummary(data: API.UserReportNodeSummaryQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.UserReportRow>>>(
    '/v3/report/userReport/nodeSummary/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryUserReportTraffic(data: API.UserReportTrafficQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.UserReportRow>>>(
    '/v3/report/userReport/traffic/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryUserReportNodeFail(data: API.UserReportNodeFailQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.UserReportRow>>>(
    '/v3/report/userReport/nodeFail/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryProjectReport(data: API.ProjectReportQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.ProjectReportItem>>>(
    '/v3/report/project/query',
    {
      method: 'POST',
      data,
    },
  );
}
