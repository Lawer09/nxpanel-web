import { request } from '@umijs/max';

function parseContentDispositionFilename(contentDisposition?: string | null) {
  if (!contentDisposition) return undefined;

  const utf8Filename = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8Filename) {
    try {
      return decodeURIComponent(utf8Filename);
    } catch {
      return utf8Filename;
    }
  }

  const fallbackFilename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1];
  return fallbackFilename || undefined;
}

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

export async function queryNodeReportHourly(data: API.NodeReportHourlyQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.NodeReportHourlyItem>>>(
    '/v3/report/nodeReport/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryUserReportHourly(data: API.UserReportHourlyQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.UserReportHourlyItem>>>(
    '/v3/report/userReport/query',
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

export async function queryProjectHourlyReport(data: API.ProjectHourlyReportQuery) {
  return request<API.ApiResponse<API.ReportPageResult<API.ProjectReportItem>>>(
    '/v3/report/project/hourly/query',
    {
      method: 'POST',
      data,
    },
  );
}

export async function queryProjectHourlyAdMatchRate(data: API.ProjectHourlyAdMatchRateQuery) {
  return request<API.ApiResponse<API.ProjectHourlyAdMatchRateResult>>(
    '/v3/report/project/hourly/ad-match-rate',
    {
      method: 'POST',
      data,
    },
  );
}

export async function exportProjectReport(data: API.ProjectReportQuery) {
  const result = await request<Blob>('/v3/report/project/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    responseType: 'blob',
    getResponse: true,
  } as any) as Blob | { data?: Blob; response?: Response };

  if (result instanceof Blob) {
    return { blob: result };
  }

  const contentDisposition = result.response?.headers?.get('content-disposition')
    || result.response?.headers?.get('Content-Disposition');

  return {
    blob: result.data || new Blob([]),
    filename: parseContentDispositionFilename(contentDisposition),
  };
}
