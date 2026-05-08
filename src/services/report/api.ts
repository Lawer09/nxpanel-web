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
