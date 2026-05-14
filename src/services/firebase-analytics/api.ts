import { request } from '@umijs/max';
import type {
  FirebaseAnalyticsFilter,
  FilterOptionsResponse,
  DashboardSummaryResponse,
  EventTrendItem,
  VpnQualityTrendItem,
  RegionQualityItem,
  ErrorTopItem,
  NodeQualityRankItem,
  AppOpenSummaryResponse,
  AppOpenTrendItem,
  OpenTypeDistributionItem,
  VersionRankItem,
  VpnSessionSummaryResponse,
  DistributionItem,
  ConnectTypeAnalysisItem,
  ProtocolQualityItem,
  VpnProbeSummaryResponse,
  VpnProbeTrendItem,
  ProbeTriggerDistributionItem,
  ProbeTypeDistributionItem,
  ProbeNodeRankItem,
  ApiErrorSummaryResponse,
  ApiErrorTrendItem,
  HttpStatusDistributionItem,
  ApiRankItem,
} from './types';

export type { FirebaseAnalyticsFilter };

/** 获取筛选项 GET /v3/firebase-analytics/filters/options */
export async function getFilterOptions() {
  return request<{ data: FilterOptionsResponse }>('/v3/firebase-analytics/filters/options', {
    method: 'GET',
  });
}

/** 总览 KPI GET /v3/firebase-analytics/dashboard/summary */
export async function getDashboardSummary(params: FirebaseAnalyticsFilter) {
  return request<{ data: DashboardSummaryResponse }>('/v3/firebase-analytics/dashboard/summary', {
    method: 'GET',
    params,
  });
}

/** 事件趋势 GET /v3/firebase-analytics/dashboard/event-trend */
export async function getEventTrend(params: FirebaseAnalyticsFilter & { interval?: string }) {
  return request<{ data: { interval: string; items: EventTrendItem[] } }>('/v3/firebase-analytics/dashboard/event-trend', {
    method: 'GET',
    params,
  });
}

/** VPN 质量趋势 GET /v3/firebase-analytics/vpn-session/quality-trend */
export async function getVpnQualityTrend(params: FirebaseAnalyticsFilter & { interval?: string }) {
  return request<{ data: { interval: string; items: VpnQualityTrendItem[] } }>('/v3/firebase-analytics/vpn-session/quality-trend', {
    method: 'GET',
    params,
  });
}

/** 地区质量 GET /v3/firebase-analytics/dashboard/region-quality */
export async function getRegionQuality(params: FirebaseAnalyticsFilter) {
  return request<{ data: { items: RegionQualityItem[] } }>('/v3/firebase-analytics/dashboard/region-quality', {
    method: 'GET',
    params,
  });
}

/** 错误排行 GET /v3/firebase-analytics/errors/top */
export async function getErrorTop(params: FirebaseAnalyticsFilter & { error_type: string }) {
  return request<{
    data: {
      error_type: string;
      items: ErrorTopItem[];
    };
  }>('/v3/firebase-analytics/errors/top', {
    method: 'GET',
    params,
  });
}

/** 节点排行 GET /v3/firebase-analytics/nodes/quality-rank */
export async function getNodeQualityRank(params: FirebaseAnalyticsFilter & { source?: string }) {
  return request<{ data: { source: string; items: NodeQualityRankItem[] } }>('/v3/firebase-analytics/nodes/quality-rank', {
    method: 'GET',
    params,
  });
}

/** App 打开汇总 GET /v3/firebase-analytics/app-open/summary */
export async function getAppOpenSummary(params: FirebaseAnalyticsFilter) {
  return request<{ data: AppOpenSummaryResponse }>('/v3/firebase-analytics/app-open/summary', {
    method: 'GET',
    params,
  });
}

/** App 打开趋势 GET /v3/firebase-analytics/app-open/trend */
export async function getAppOpenTrend(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: AppOpenTrendItem[] } }>('/v3/firebase-analytics/app-open/trend', {
    method: 'GET',
    params,
  });
}

/** 启动类型占比 GET /v3/firebase-analytics/app-open/open-type-distribution */
export async function getOpenTypeDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: OpenTypeDistributionItem[] } }>('/v3/firebase-analytics/app-open/open-type-distribution', {
    method: 'GET',
    params,
  });
}

/** 版本启动性能排行 GET /v3/firebase-analytics/app-open/version-rank */
export async function getVersionRank(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: VersionRankItem[] } }>('/v3/firebase-analytics/app-open/version-rank', {
    method: 'GET',
    params,
  });
}

/** VPN 连接汇总 GET /v3/firebase-analytics/vpn-session/summary */
export async function getVpnSessionSummary(params: FirebaseAnalyticsFilter) {
  return request<{ data: VpnSessionSummaryResponse }>('/v3/firebase-analytics/vpn-session/summary', {
    method: 'GET',
    params,
  });
}

/** 失败阶段分布 GET /v3/firebase-analytics/vpn-session/fail-stage-distribution */
export async function getFailStageDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: DistributionItem[] } }>('/v3/firebase-analytics/vpn-session/fail-stage-distribution', {
    method: 'GET',
    params,
  });
}

/** 错误阶段分布 GET /v3/firebase-analytics/vpn-session/error-stage-distribution */
export async function getErrorStageDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: DistributionItem[] } }>('/v3/firebase-analytics/vpn-session/error-stage-distribution', {
    method: 'GET',
    params,
  });
}

/** 连接方式分析 GET /v3/firebase-analytics/vpn-session/connect-type-analysis */
export async function getConnectTypeAnalysis(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ConnectTypeAnalysisItem[] } }>('/v3/firebase-analytics/vpn-session/connect-type-analysis', {
    method: 'GET',
    params,
  });
}

/** 协议质量对比 GET /v3/firebase-analytics/vpn-session/protocol-quality */
export async function getProtocolQuality(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ProtocolQualityItem[] } }>('/v3/firebase-analytics/vpn-session/protocol-quality', {
    method: 'GET',
    params,
  });
}

/** 节点测速汇总 GET /v3/firebase-analytics/vpn-probe/summary */
export async function getVpnProbeSummary(params: FirebaseAnalyticsFilter) {
  return request<{ data: VpnProbeSummaryResponse }>('/v3/firebase-analytics/vpn-probe/summary', {
    method: 'GET',
    params,
  });
}

/** 测速趋势 GET /v3/firebase-analytics/vpn-probe/trend */
export async function getVpnProbeTrend(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: VpnProbeTrendItem[] } }>('/v3/firebase-analytics/vpn-probe/trend', {
    method: 'GET',
    params,
  });
}

/** 触发场景分布 GET /v3/firebase-analytics/vpn-probe/trigger-distribution */
export async function getProbeTriggerDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ProbeTriggerDistributionItem[] } }>('/v3/firebase-analytics/vpn-probe/trigger-distribution', {
    method: 'GET',
    params,
  });
}

/** 测速类型分布 GET /v3/firebase-analytics/vpn-probe/type-distribution */
export async function getProbeTypeDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ProbeTypeDistributionItem[] } }>('/v3/firebase-analytics/vpn-probe/type-distribution', {
    method: 'GET',
    params,
  });
}

/** 节点测速排行 GET /v3/firebase-analytics/vpn-probe/node-rank */
export async function getProbeNodeRank(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ProbeNodeRankItem[] } }>('/v3/firebase-analytics/vpn-probe/node-rank', {
    method: 'GET',
    params,
  });
}

/** API 错误汇总 GET /v3/firebase-analytics/server-api-error/summary */
export async function getApiErrorSummary(params: FirebaseAnalyticsFilter) {
  return request<{ data: ApiErrorSummaryResponse }>('/v3/firebase-analytics/server-api-error/summary', {
    method: 'GET',
    params,
  });
}

/** API 错误趋势 GET /v3/firebase-analytics/server-api-error/trend */
export async function getApiErrorTrend(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ApiErrorTrendItem[] } }>('/v3/firebase-analytics/server-api-error/trend', {
    method: 'GET',
    params,
  });
}

/** HTTP 状态码分布 GET /v3/firebase-analytics/server-api-error/http-status-distribution */
export async function getHttpStatusDistribution(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: HttpStatusDistributionItem[] } }>('/v3/firebase-analytics/server-api-error/http-status-distribution', {
    method: 'GET',
    params,
  });
}

/** API 路径错误排行 GET /v3/firebase-analytics/server-api-error/api-rank */
export async function getApiRank(params: FirebaseAnalyticsFilter) {
  return request<{ data: { list: ApiRankItem[] } }>('/v3/firebase-analytics/server-api-error/api-rank', {
    method: 'GET',
    params,
  });
}

/** 事件列表 GET /v3/firebase-analytics/events */
export async function getEvents(params: FirebaseAnalyticsFilter & { current?: number; pageSize?: number }) {
  return request<{
    data: {
      list: any[];
      total: number;
    };
  }>('/v3/firebase-analytics/events', {
    method: 'GET',
    params,
  });
}

/** 事件详情 GET /v3/firebase-analytics/events/{event_id} */
export async function getEventDetail(eventId: string) {
  return request<{
    data: any;
  }>(`/v3/firebase-analytics/events/${eventId}`, {
    method: 'GET',
  });
}
