import { request } from '@umijs/max';

/** 用户每日流量明细（分页） */
export async function getStatUser(
  params: { user_id: number; pageSize?: number; page?: number },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.StatUserPageData>>('/v3/stat/getStatUser', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 用户或节点流量 Top10 + 环比 */
export async function getTrafficRank(
  params: {
    type: 'user' | 'node';
    start_time?: number;
    end_time?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.TrafficRankData>>('/v3/stat/getTrafficRank', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 用户消耗排行 Top20 */
export async function getUserConsumptionRank(
  params: {
    type: 'user_consumption_rank';
    start_time?: number;
    end_time?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.UserConsumptionRankData>>('/v3/stat/getRanking', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 节点流量排行 Top20 */
export async function getServerTrafficRank(
  params: {
    type: 'server_traffic_rank';
    start_time?: number;
    end_time?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.ServerTrafficRankData>>('/v3/stat/getRanking', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 全量节点实时流量排行 */
export async function getServerLastRank(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ServerRankData>>('/v3/stat/getServerLastRank', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 昨日节点流量排行 */
export async function getServerYesterdayRank(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.ServerRankData>>('/v3/stat/getServerYesterdayRank', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 节点流量详情（分页） */
export async function getStatServer(
  params: {
    server_id?: number;
    start_time?: number;
    end_time?: number;
    page?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.StatServerPageData>>('/v3/stat/getStatServer', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 流量汇总概览 */
export async function getOverride(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.StatOverviewData>>('/v3/stat/getOverride', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 运营概览（包含更多字段） */
export async function getStats(options?: { [key: string]: any }) {
  return request<API.ApiResponse<API.StatOverviewData>>('/v3/stat/getStats', {
    method: 'GET',
    ...(options || {}),
  });
}
