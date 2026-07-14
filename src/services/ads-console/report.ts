import { request } from '@umijs/max';

const FB_REPORT_API_PREFIX = '/ads-api/fb/report';
const PLATFORM_REPORT_API_PREFIX = '/ads-api/v2/report';

function buildQuery(params: Record<string, unknown>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          query.append(key, String(item));
        }
      });
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

export async function getOverallReportPage(
  params: AdsConsole.RptOverallDayPageQuery,
) {
  const query = buildQuery(params as unknown as Record<string, unknown>);
  const prefix =
    params.platform && params.platform !== 'facebook'
      ? PLATFORM_REPORT_API_PREFIX
      : FB_REPORT_API_PREFIX;
  const url = query ? `${prefix}/day/overall?${query}` : `${prefix}/day/overall`;

  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.RptOverallDayVO>>>(
    url,
    {
      method: 'GET',
    },
  );
}

export async function getOverallHourReportPage(
  params: AdsConsole.RptOverallHourPageQuery,
) {
  const query = buildQuery(params as unknown as Record<string, unknown>);
  const prefix =
    params.platform && params.platform !== 'facebook'
      ? PLATFORM_REPORT_API_PREFIX
      : FB_REPORT_API_PREFIX;
  const url = query ? `${prefix}/hour/overall?${query}` : `${prefix}/hour/overall`;

  return request<
    AdsConsole.Result<AdsConsole.PageResult<AdsConsole.RptOverallHourVO>>
  >(url, {
    method: 'GET',
  });
}

export async function getEventReportPage(
  params: AdsConsole.RptEventDayPageQuery,
) {
  const query = buildQuery(params as unknown as Record<string, unknown>);
  const url = query
    ? `/ads-api/fb/report/day/event?${query}`
    : '/ads-api/fb/report/day/event';

  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.RptEventDayVO>>>(
    url,
    {
      method: 'GET',
    },
  );
}
