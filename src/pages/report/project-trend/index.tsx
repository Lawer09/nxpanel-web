import { ArrowLeftOutlined } from '@ant-design/icons';
import { Area, Column, Line } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Col, Empty, Row, Segmented, Space, Spin, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { history, useSearchParams } from '@umijs/max';
import React, { useEffect, useMemo, useState } from 'react';
import { getProjectCodes, getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';
import { queryAppConnectionReport } from '@/services/firebase-analytics/api';
import type { FirebaseAppConnectionReportItem } from '@/services/firebase-analytics/types';
import {
  queryProjectAdValueDailyComposition,
  queryProjectHourlyReport,
  queryProjectReport,
  queryProjectRetention,
} from '@/services/report/api';
import AppConnectionReportSection from './components/AppConnectionReportSection';
import AppConnectionStatusSummary from './components/AppConnectionStatusSummary';
import ProjectRetentionCard from './components/ProjectRetentionCard';
import TrendChartCard from './components/TrendChartCard';
import TrendDashboardHeader from './components/TrendDashboardHeader';
import TrendKpiGrid from './components/TrendKpiGrid';
import {
  AD_REVENUE_COMPARE_COLOR_RANGE,
  CARD_STYLE,
  COST_SERIES_COLOR_RANGE,
  COUNTRY_METRIC_OPTIONS,
  DASHBOARD_THEME,
  LINE_SERIES_COLORS,
  PROJECT_RETENTION_DAYS,
} from './constants';
import {
  buildProjectDailyTrendQuery,
  buildProjectHourlyTrendQuery,
  buildTrendSeries,
  parseProjectRow,
} from './data';
import type { CountryMetric, CountryRankingItem, KpiItem, ParsedProjectRow, TrendGranularity, TrendQueryState } from './types';
import {
  buildProjectTrendSearch,
  formatCurrency,
  formatInteger,
  getDefaultProjectTrendHourlyDateRange,
  getDefaultProjectRetentionDateRange,
  formatTrafficCostWithRatio,
  formatRoiPercent,
  getDefaultProjectTrendHourlyDateTimeRange,
  normalizeHourRangeValue,
  normalizeProjectTrendGranularity,
  parseProjectTrendHourDateTimeRange,
  resolveProjectTrendDateRange,
  toSafeNumber,
} from './utils';

const { Text } = Typography;

const normalizeStringList = (values?: string[] | null) => {
  if (!Array.isArray(values) || !values.length) return undefined;
  const normalized = values.map((item) => `${item}`.trim()).filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : undefined;
};

const parseSearchList = (value?: string | null) => {
  if (!value) return undefined;
  return normalizeStringList(value.split(','));
};

const getAdStatusColor = (adStatus?: string | null) => {
  const normalized = adStatus?.trim();
  if (['在投', '放量中'].includes(normalized || '')) return 'green';
  if (['待投放', '测试中', '审核中', '控量中'].includes(normalized || '')) return 'processing';
  if (['暂停', '停投'].includes(normalized || '')) return 'orange';
  if (['已下架', '被拒'].includes(normalized || '')) return 'red';
  if (normalized === '未上线') return 'default';
  return 'blue';
};

const CompactMetricLine: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({
  label,
  value,
  color = 'rgba(0, 0, 0, 0.88)',
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
    <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
    <span
      style={{
        color,
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1.2,
        minWidth: 0,
        overflow: 'hidden',
        textAlign: 'right',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  </div>
);

const formatRatioPercent = (value: unknown) => {
  const next = toSafeNumber(value);
  if (next === null) return '--';
  return `${(next * 100).toFixed(2)}%`;
};

const buildInitialTrendQuery = (searchParams: URLSearchParams): TrendQueryState => {
  const projectCode = searchParams.get('projectCode')?.trim() || '';
  const granularity = normalizeProjectTrendGranularity(searchParams.get('granularity'));
  const appVersions = parseSearchList(searchParams.get('appVersions'));
  const hasInitialDate =
    Boolean(searchParams.get('dateFrom') && dayjs(searchParams.get('dateFrom')).isValid()) ||
    Boolean(searchParams.get('dateTo') && dayjs(searchParams.get('dateTo')).isValid());
  const [dateFrom, dateTo] =
    granularity === 'hour' && !hasInitialDate
      ? getDefaultProjectTrendHourlyDateRange()
      : resolveProjectTrendDateRange(searchParams.get('dateFrom'), searchParams.get('dateTo'));

  if (granularity === 'hour') {
    const hourFrom = normalizeHourRangeValue(searchParams.get('hourFrom'));
    const hourTo = normalizeHourRangeValue(searchParams.get('hourTo'));
    return {
      projectCode,
      dateRange: [dateFrom, dateTo],
      granularity,
      appVersions,
      hourFrom,
      hourTo,
    };
  }

  return {
    projectCode,
    dateRange: [dateFrom, dateTo],
    granularity,
    appVersions,
    hourFrom: undefined,
    hourTo: undefined,
  };
};

const ProjectTrendDashboardPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceFrom = searchParams.get('from');
  const initialQuery = useMemo(() => buildInitialTrendQuery(searchParams), [searchParams]);

  const [draftQuery, setDraftQuery] = useState<TrendQueryState>(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState<TrendQueryState>(initialQuery);
  const [projectOptions, setProjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [appVersionOptions, setAppVersionOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [projectMeta, setProjectMeta] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendRows, setTrendRows] = useState<ParsedProjectRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [countryRows, setCountryRows] = useState<Array<Record<string, unknown>>>([]);
  const [countryMetric, setCountryMetric] = useState<CountryMetric>('adRevenue');
  const [retentionRange, setRetentionRange] = useState<[string, string]>(getDefaultProjectRetentionDateRange);
  const [retentionRows, setRetentionRows] = useState<API.ProjectRetentionCohortItem[]>([]);
  const [retentionDays, setRetentionDays] = useState<number[]>(PROJECT_RETENTION_DAYS);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [adValueCompositionRows, setAdValueCompositionRows] = useState<API.ProjectAdValueDailyCompositionItem[]>([]);
  const [adValueCompositionSummary, setAdValueCompositionSummary] =
    useState<API.ProjectAdValueDailyCompositionSummary | null>(null);
  const [adValueCompositionLoading, setAdValueCompositionLoading] = useState(false);
  const [connectionSummary, setConnectionSummary] = useState<FirebaseAppConnectionReportItem | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [showAdRevenueDiffTrend, setShowAdRevenueDiffTrend] = useState(false);
  const connectionStatusDate = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    setDraftQuery(initialQuery);
    setAppliedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const run = async () => {
      const res = await getProjectCodes();
      if (res.code !== 0) return;
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const normalizedRows: Array<{ projectCode?: string | null; projectName?: string | null }> = rows.map((item) =>
        typeof item === 'string'
          ? { projectCode: item, projectName: undefined }
          : { projectCode: item?.projectCode, projectName: item?.projectName },
      );
      const nextOptions = normalizedRows
        .filter((item): item is { projectCode: string; projectName?: string | null } => Boolean(item.projectCode))
        .map((item) => ({
          label: `${item.projectName || item.projectCode} (${item.projectCode})`,
          value: item.projectCode,
        }));
      setProjectOptions(nextOptions);
    };
    void run();
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!draftQuery.projectCode) {
        setAppVersionOptions([]);
        return;
      }

      try {
        const res = await queryAppConnectionReport({
          dateFrom: draftQuery.dateRange[0],
          dateTo: draftQuery.dateRange[1],
          groupBy: ['appVersion'],
          filters: {
            projectCodes: [draftQuery.projectCode],
          },
          page: 1,
          pageSize: 200,
          orderBy: 'appVersion',
          orderDirection: 'asc',
        });
        if (!alive) return;

        const versions = Array.isArray(res.data?.data) ? res.data.data : [];
        const nextOptions = versions
          .map((item) => ({
            label: `${item.appVersion || ''}`,
            value: `${item.appVersion || ''}`,
          }))
          .filter((item) => item.value.trim())
          .filter((item, index, list) => list.findIndex((candidate) => candidate.value === item.value) === index);
        setAppVersionOptions(nextOptions);
      } catch {
        if (alive) setAppVersionOptions([]);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [draftQuery.dateRange, draftQuery.projectCode]);

  useEffect(() => {
    if (!appliedQuery.projectCode) {
      setProjectMeta(null);
      return;
    }

    const run = async () => {
      const res = await getProjects({ keyword: appliedQuery.projectCode, page: 1, pageSize: 20 });
      if (res.code !== 0) return;
      const matched = (res.data?.data ?? []).find((item) => item.projectCode === appliedQuery.projectCode) ?? null;
      setProjectMeta(matched);
    };

    void run();
  }, [appliedQuery.projectCode]);

  useEffect(() => {
    if (!appliedQuery.projectCode) return;
    setSearchParams(
      buildProjectTrendSearch({
        projectCode: appliedQuery.projectCode,
        dateFrom: appliedQuery.dateRange[0],
        dateTo: appliedQuery.dateRange[1],
        granularity: appliedQuery.granularity,
        appVersions: normalizeStringList(appliedQuery.appVersions),
        hourFrom: appliedQuery.granularity === 'hour' ? appliedQuery.hourFrom : undefined,
        hourTo: appliedQuery.granularity === 'hour' ? appliedQuery.hourTo : undefined,
        from:
          sourceFrom === 'project-table' || sourceFrom === 'report-project'
            ? (sourceFrom as 'project-table' | 'report-project')
            : undefined,
      }),
    );
  }, [appliedQuery, setSearchParams, sourceFrom]);

  useEffect(() => {
    if (!appliedQuery.projectCode) return;
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const trendRes =
          appliedQuery.granularity === 'hour'
            ? await queryProjectHourlyReport(
                buildProjectHourlyTrendQuery(appliedQuery, ['reportDate', 'hour'], {
                  orderBy: 'reportDate',
                  orderDirection: 'asc',
                }),
              )
            : await queryProjectReport(
                buildProjectDailyTrendQuery(appliedQuery, ['reportDate'], {
                  orderBy: 'reportDate',
                  orderDirection: 'asc',
                }),
              );

        if (!alive) return;

        if (trendRes.code !== 0) {
          message.error(trendRes.msg || '获取项目趋势数据失败');
          setTrendRows([]);
          setSummary({});
        } else {
          const parsedRows = (trendRes.data?.data ?? [])
            .map((item) => parseProjectRow(item as API.ProjectReportItem, appliedQuery.granularity))
            .sort((a, b) => {
              if (a.reportDate !== b.reportDate) {
                return a.reportDate.localeCompare(b.reportDate);
              }
              return (a.hour ?? 0) - (b.hour ?? 0);
            });
          setTrendRows(parsedRows);
          setSummary((trendRes.data?.summary as Record<string, unknown>) ?? {});
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [appliedQuery, message]);

  useEffect(() => {
    if (!appliedQuery.projectCode || appliedQuery.granularity !== 'day') {
      setAdValueCompositionRows([]);
      setAdValueCompositionSummary(null);
      setAdValueCompositionLoading(false);
      return;
    }

    let alive = true;
    const run = async () => {
      setAdValueCompositionLoading(true);
      try {
        const res = await queryProjectAdValueDailyComposition({
          projectCode: appliedQuery.projectCode,
          dateFrom: appliedQuery.dateRange[0],
          dateTo: appliedQuery.dateRange[1],
        });

        if (!alive) return;

        if (res.code !== 0) {
          message.error(res.msg || '获取广告价值构成失败');
          setAdValueCompositionRows([]);
          setAdValueCompositionSummary(null);
          return;
        }

        setAdValueCompositionRows(res.data?.data ?? []);
        setAdValueCompositionSummary(res.data?.summary ?? null);
      } catch (error: any) {
        if (alive) {
          message.error(error?.message || '获取广告价值构成失败');
          setAdValueCompositionRows([]);
          setAdValueCompositionSummary(null);
        }
      } finally {
        if (alive) setAdValueCompositionLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [appliedQuery.dateRange, appliedQuery.granularity, appliedQuery.projectCode, message]);

  useEffect(() => {
    if (!appliedQuery.projectCode) {
      setConnectionSummary(null);
      return;
    }

    let alive = true;
    const run = async () => {
      setConnectionLoading(true);
      try {
        const res = await queryAppConnectionReport({
          dateFrom: connectionStatusDate,
          dateTo: connectionStatusDate,
          groupBy: ['date'],
          filters: {
            projectCodes: [appliedQuery.projectCode],
            appVersions: normalizeStringList(appliedQuery.appVersions),
          },
          page: 1,
          pageSize: 1,
        });

        if (!alive) return;
        setConnectionSummary(res.data?.summary ?? null);
      } catch (error: any) {
        if (alive) {
          message.error(error?.message || '获取今日应用连接状态失败');
          setConnectionSummary(null);
        }
      } finally {
        if (alive) setConnectionLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [appliedQuery.appVersions, appliedQuery.projectCode, connectionStatusDate, message]);

  useEffect(() => {
    if (!appliedQuery.projectCode) {
      setRetentionRows([]);
      return;
    }
    let alive = true;

    const run = async () => {
      setRetentionLoading(true);
      try {
        const retentionRes = await queryProjectRetention({
          projectCode: appliedQuery.projectCode,
          dateFrom: retentionRange[0],
          dateTo: retentionRange[1],
        });

        if (!alive) return;

        if (retentionRes.code !== 0) {
          message.error(retentionRes.msg || '获取项目留存数据失败');
          setRetentionRows([]);
          return;
        }

        setRetentionRows(retentionRes.data?.data ?? []);
        setRetentionDays(retentionRes.data?.retentionDays?.length ? retentionRes.data.retentionDays : PROJECT_RETENTION_DAYS);
      } catch (error: any) {
        if (alive) {
          message.error(error?.message || '获取项目留存数据失败');
          setRetentionRows([]);
        }
      } finally {
        if (alive) setRetentionLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [appliedQuery.projectCode, retentionRange, message]);

  useEffect(() => {
    if (!appliedQuery.projectCode) return;
    let alive = true;

    const run = async () => {
      const countryRes =
        appliedQuery.granularity === 'hour'
          ? await queryProjectHourlyReport(
              buildProjectHourlyTrendQuery(appliedQuery, ['country'], {
                orderBy: 'adRevenue',
                orderDirection: 'desc',
              }),
            )
          : await queryProjectReport(
              buildProjectDailyTrendQuery(appliedQuery, ['country'], {
                orderBy: 'adRevenue',
                orderDirection: 'desc',
              }),
            );

      if (!alive) return;

      if (countryRes.code !== 0) {
        message.error(countryRes.msg || '获取国家排行失败');
        setCountryRows([]);
      } else {
        setCountryRows((countryRes.data?.data ?? []) as Array<Record<string, unknown>>);
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [appliedQuery, message]);

  const handleSearch = () => {
    if (!draftQuery.projectCode) {
      message.warning('请先选择项目代号');
      return;
    }

    if (draftQuery.granularity === 'hour') {
      const start = dayjs(draftQuery.dateRange[0]).hour(draftQuery.hourFrom ?? 0).minute(0).second(0);
      const end = dayjs(draftQuery.dateRange[1]).hour(draftQuery.hourTo ?? 23).minute(0).second(0);

      if (start.isAfter(end)) {
        message.warning('小时范围不能晚于结束时间');
        return;
      }
    }

    setAppliedQuery(draftQuery);
  };

  const handleGranularityChange = (value: TrendGranularity) => {
    if (value === draftQuery.granularity) return;

    if (value === 'hour') {
      const hourlyRange = parseProjectTrendHourDateTimeRange(getDefaultProjectTrendHourlyDateTimeRange());
      if (!hourlyRange) return;
      const nextQuery: TrendQueryState = {
        ...draftQuery,
        granularity: 'hour',
        ...hourlyRange,
      };
      setDraftQuery(nextQuery);
      setAppliedQuery(nextQuery);
      return;
    }

    const nextQuery: TrendQueryState = {
      ...draftQuery,
      granularity: 'day',
      dateRange: resolveProjectTrendDateRange(null, null),
      hourFrom: undefined,
      hourTo: undefined,
    };
    setDraftQuery(nextQuery);
    setAppliedQuery(nextQuery);
  };

  const handleDailyDateRangeChange = (nextDateRange: [string, string]) => {
    setDraftQuery((prev) => ({
      ...prev,
      dateRange: nextDateRange,
    }));
  };

  const handleHourlyDateTimeRangeChange = (value: {
    dateRange: [string, string];
    hourFrom?: number;
    hourTo?: number;
  }) => {
    setDraftQuery((prev) => ({
      ...prev,
      dateRange: value.dateRange,
      hourFrom: value.hourFrom,
      hourTo: value.hourTo,
    }));
  };

  const kpiItems = useMemo<KpiItem[]>(() => {
    const latestRow = trendRows[trendRows.length - 1];
    const latestDau = latestRow?.dauUsers ?? 0;
    const avgDau =
      trendRows.length > 0 ? trendRows.reduce((sum, item) => sum + item.dauUsers, 0) / trendRows.length : 0;
    const aggregatedAdRevenueNow = trendRows.reduce((sum, item) => sum + item.adRevenueNow, 0);
    const aggregatedAdRevenueDiff = trendRows.reduce((sum, item) => sum + item.adRevenueDiff, 0);
    const adRevenueBaseValue = summary.adRevenue ?? trendRows.reduce((sum, item) => sum + item.adRevenue, 0);
    const adRevenueNowValue = summary.adRevenueNow ?? aggregatedAdRevenueNow;
    const adRevenueDiffValue = summary.adRevenueDiff ?? aggregatedAdRevenueDiff;
    const adRevenueBaseNumber = toSafeNumber(adRevenueBaseValue);
    const adRevenueNowNumber = toSafeNumber(adRevenueNowValue);
    const adRevenueRatioText =
      adRevenueBaseNumber && adRevenueNowNumber !== null
        ? `${((adRevenueNowNumber / adRevenueBaseNumber) * 100).toFixed(1)}%`
        : '--';
    const profitNumber = toSafeNumber(summary.profit);
    const unknownAdValue = toSafeNumber(adValueCompositionSummary?.unknownValueUsd) ?? 0;

    return [
      {
        key: 'adRevenue',
        title: '广告收入',
        value: '',
        customValue: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', fontSize: 12 }}>
            <CompactMetricLine
              label="广告收入"
              value={
                <>
                  <span>{formatCurrency(adRevenueBaseValue)}</span>
                  {appliedQuery.granularity === 'day' ? (
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                      最新 {formatCurrency(adRevenueNowValue)}
                    </Text>
                  ) : null}
                </>
              }
              color="#111827"
            />
            <Tooltip title="最新收入 / 广告收入">
              <div>
                <CompactMetricLine
                  label="收益差值"
                  value={
                    <>
                      <span>{formatCurrency(adRevenueDiffValue)}</span>
                      {appliedQuery.granularity === 'day' ? (
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                          {adRevenueRatioText}
                        </Text>
                      ) : null}
                    </>
                  }
                  color="#6b7280"
                />
              </div>
            </Tooltip>
            {appliedQuery.granularity === 'day' ? (
              <Spin spinning={adValueCompositionLoading} size="small">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CompactMetricLine
                    label="广告价值"
                    value={
                      <>
                        <span>{formatCurrency(adValueCompositionSummary?.totalValueUsd)}</span>
                        {unknownAdValue > 0 ? (
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                            未知 {formatCurrency(adValueCompositionSummary?.unknownValueUsd)}
                          </Text>
                        ) : null}
                      </>
                    }
                    color="#0f766e"
                  />
                  <CompactMetricLine
                    label="本日/留存"
                    value={
                      <>
                        <span>{formatCurrency(adValueCompositionSummary?.newUserValueUsd)}</span>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                          {formatRatioPercent(adValueCompositionSummary?.newUserRatio)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, marginInline: 4 }}>
                          /
                        </Text>
                        <span style={{ color: '#ea580c' }}>{formatCurrency(adValueCompositionSummary?.retainedUserValueUsd)}</span>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                          {formatRatioPercent(adValueCompositionSummary?.retainedUserRatio)}
                        </Text>
                      </>
                    }
                    color="#2563eb"
                  />
                </div>
              </Spin>
            ) : (
              <>
                <CompactMetricLine label="最新收入" value={formatCurrency(adRevenueNowValue)} color="#7c3aed" />
                <CompactMetricLine label="收入占比" value={adRevenueRatioText} color="#0f766e" />
              </>
            )}
          </div>
        ),
      },
      {
        key: 'costProfitRoi',
        title: '成本 / 利润 / ROI',
        value: '',
        customValue: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', fontSize: 12 }}>
            <CompactMetricLine label="总成本" value={formatCurrency(summary.totalCost)} color="#ea580c" />
            <CompactMetricLine
              label="利润"
              value={formatCurrency(summary.profit)}
              color={profitNumber !== null && profitNumber < 0 ? '#dc2626' : '#2563eb'}
            />
            <CompactMetricLine label="ROI" value={formatRoiPercent(summary.roi)} color="#0f766e" />
          </div>
        ),
      },
      {
        key: 'userOverview',
        title: '用户概览',
        value: '',
        customValue: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', fontSize: 12 }}>
            <CompactMetricLine label="新增用户" value={formatInteger(summary.newUsers)} color="#111827" />
            <CompactMetricLine label="最新 DAU" value={formatInteger(latestDau)} color="#2563eb" />
            <CompactMetricLine label="平均 DAU" value={formatInteger(avgDau)} color="#16a34a" />
          </div>
        ),
      },
      {
        key: 'appConnectionStatus',
        title: '今日应用连接状态',
        value: '',
        customValue: (
          <AppConnectionStatusSummary
            loading={connectionLoading}
            summary={connectionSummary}
          />
        ),
      },
    ];
  }, [
    adValueCompositionLoading,
    adValueCompositionSummary,
    appliedQuery.granularity,
    connectionLoading,
    connectionSummary,
    summary,
    trendRows,
  ]);

  const revenueTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adRevenue', label: '广告收入' },
        { key: 'totalCost', label: '总成本' },
        { key: 'profit', label: '利润' },
      ]),
    [trendRows],
  );

  const adValueCompositionTrendData = useMemo(
    () =>
      adValueCompositionRows.flatMap((item) => [
        {
          date: item.date,
          value: toSafeNumber(item.totalValueUsd) ?? 0,
          series: '广告总价值',
        },
        {
          date: item.date,
          value: toSafeNumber(item.newUserValueUsd) ?? 0,
          series: '本日用户价值',
        },
        {
          date: item.date,
          value: toSafeNumber(item.retainedUserValueUsd) ?? 0,
          series: '留存用户价值',
        },
      ]),
    [adValueCompositionRows],
  );

  const adRevenueComparisonTrendData = useMemo(
    () =>
      trendRows.flatMap((item) => [
        {
          date: item.timeLabel,
          value: item.adRevenueNow,
          series: '最新广告收益',
        },
        {
          date: item.timeLabel,
          value: Math.abs(item.adRevenueDiff),
          series: '广告收益差值',
        },
      ]),
    [trendRows],
  );

  const userTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'newUsers', label: '新增用户' },
        { key: 'reportNewUsers', label: '上报新增用户' },
        { key: 'dauUsers', label: 'DAU' },
      ]),
    [trendRows],
  );

  const funnelTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adRequests', label: '广告请求数' },
        { key: 'adMatchedRequests', label: '广告匹配请求数' },
        { key: 'adImpressions', label: '广告展示数' },
        { key: 'adClicks', label: '广告点击数' },
      ]),
    [trendRows],
  );

  const efficiencyTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adMatchRate', label: '广告匹配率' },
        { key: 'adShowRate', label: '广告展示率' },
        { key: 'adCtr', label: '广告 CTR' },
      ]),
    [trendRows],
  );

  const costStructureData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adSpendCost', label: '投放成本' },
        { key: 'trafficCost', label: '流量花费' },
      ]),
    [trendRows],
  );

  const monetizationTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adEcpm', label: '广告 eCPM' },
        { key: 'arpu', label: 'ARPU' },
      ]),
    [trendRows],
  );

  const countryRankingData = useMemo<CountryRankingItem[]>(() => {
    const rows = countryRows
      .map((item) => ({
        country: typeof item.country === 'string' ? item.country.toUpperCase() : '--',
        value: toSafeNumber(item[countryMetric]) ?? 0,
      }))
      .filter((item) => item.country !== '--' && item.value > 0);

    const total = rows.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return [];

    const majorRows: CountryRankingItem[] = [];
    let otherValue = 0;

    rows.forEach((item) => {
      if (item.value / total < 0.001) {
        otherValue += item.value;
        return;
      }
      majorRows.push(item);
    });

    const mergedRows = otherValue > 0 ? [...majorRows, { country: '其他', value: otherValue, isMerged: true }] : majorRows;
    return mergedRows.sort((a, b) => b.value - a.value);
  }, [countryRows, countryMetric]);

  const lineConfigBase = {
    xField: 'date',
    yField: 'value',
    seriesField: 'series',
    colorField: 'series',
    color: ({ series }: { series: string }) => LINE_SERIES_COLORS[series] || '#2563eb',
    smooth: true,
    lineStyle: {
      lineWidth: 3,
    },
    height: 300,
    legend: { position: 'top-right' as const },
    theme: DASHBOARD_THEME,
  };

  const handleBack = () => {
    if (sourceFrom === 'project-table') {
      history.push('/project-table');
      return;
    }
    history.push('/report/project');
  };

  return (
    <PageContainer
      header={{ title: '项目趋势 Dashboard', onBack: handleBack }}
      extra={[
        <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回
        </Button>,
      ]}
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <TrendDashboardHeader
          query={draftQuery}
          projectName={projectMeta?.projectName}
          packageName={projectMeta?.packageName}
          projectStatus={projectMeta?.status}
          adStatus={projectMeta?.adStatus}
          adStatusColor={getAdStatusColor(projectMeta?.adStatus)}
          projectOptions={projectOptions}
          appVersionOptions={appVersionOptions}
          onProjectCodeChange={(value) => setDraftQuery((prev) => ({ ...prev, projectCode: value, appVersions: undefined }))}
          onAppVersionsChange={(value) => setDraftQuery((prev) => ({ ...prev, appVersions: value }))}
          onDateRangeChange={handleDailyDateRangeChange}
          onGranularityChange={handleGranularityChange}
          onHourDateTimeRangeChange={handleHourlyDateTimeRangeChange}
          onSearch={handleSearch}
          searchLoading={loading}
        />

        {!appliedQuery.projectCode ? (
          <Card style={CARD_STYLE}>
            <Empty description="请选择项目代号后查看趋势分析" />
          </Card>
        ) : (
          <Spin spinning={loading}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <TrendKpiGrid items={kpiItems} />

              <ProjectRetentionCard
                data={retentionRows}
                loading={retentionLoading}
                range={retentionRange}
                retentionDays={retentionDays}
                onRangeChange={setRetentionRange}
              />

              <TrendChartCard
                title="收益趋势"
                hasData={revenueTrendData.length > 0}
                emptyText="暂无收益趋势数据"
                collapsible
                extra={
                  appliedQuery.granularity === 'day' ? (
                    <Button size="small" onClick={() => setShowAdRevenueDiffTrend((prev) => !prev)}>
                      {showAdRevenueDiffTrend ? '收起广告收益差值趋势' : '展开广告收益差值趋势'}
                    </Button>
                  ) : null
                }
              >
                {revenueTrendData.length ? (
                  <Line
                    {...lineConfigBase}
                    data={revenueTrendData}
                    axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                    tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                  />
                ) : null}
              </TrendChartCard>

              {appliedQuery.granularity === 'day' ? (
                <>
                  <Spin spinning={adValueCompositionLoading}>
                    <TrendChartCard
                      title="广告价值构成趋势"
                      hasData={adValueCompositionRows.length > 0}
                      emptyText="暂无广告价值构成数据"
                      collapsible
                    >
                      <Line
                        {...lineConfigBase}
                        data={adValueCompositionTrendData}
                        axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                        tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                      />
                    </TrendChartCard>
                  </Spin>

                  {showAdRevenueDiffTrend ? (
                    <TrendChartCard
                      title="广告收益差值趋势"
                      hasData={adRevenueComparisonTrendData.length > 0}
                      emptyText="暂无广告收益差值数据"
                    >
                      {adRevenueComparisonTrendData.length ? (
                        <Area
                          data={adRevenueComparisonTrendData}
                          xField="date"
                          yField="value"
                          seriesField="series"
                          colorField="series"
                          scale={{ color: { range: AD_REVENUE_COMPARE_COLOR_RANGE } }}
                          stack
                          height={300}
                          theme={DASHBOARD_THEME}
                          legend={{ position: 'top-right' }}
                          axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                          tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                        />
                      ) : null}
                    </TrendChartCard>
                  ) : null}

                  <AppConnectionReportSection
                    key={`${appliedQuery.projectCode}-${appliedQuery.dateRange[0]}-${appliedQuery.dateRange[1]}-${(appliedQuery.appVersions || []).join('.')}`}
                    projectCode={appliedQuery.projectCode}
                    dateRange={appliedQuery.dateRange}
                    appVersions={appliedQuery.appVersions}
                  />
                </>
              ) : null}

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <TrendChartCard title="用户趋势" hasData={userTrendData.length > 0} emptyText="暂无用户趋势数据">
                    {userTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={userTrendData}
                        axis={{ y: { labelFormatter: (value: number) => Math.round(Number(value)).toLocaleString() } }}
                        tooltip={{
                          items: [
                            {
                              field: 'value',
                              valueFormatter: (value: number) => Math.round(Number(value)).toLocaleString(),
                            },
                          ],
                        }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
                <Col xs={24} xl={12}>
                  <TrendChartCard title="广告漏斗量级趋势" hasData={funnelTrendData.length > 0} emptyText="暂无广告漏斗数据">
                    {funnelTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={funnelTrendData}
                        axis={{ y: { labelFormatter: (value: number) => Math.round(Number(value)).toLocaleString() } }}
                        tooltip={{
                          items: [
                            {
                              field: 'value',
                              valueFormatter: (value: number) => Math.round(Number(value)).toLocaleString(),
                            },
                          ],
                        }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
                <Col xs={24} xl={12}>
                  <TrendChartCard title="广告效率趋势" hasData={efficiencyTrendData.length > 0} emptyText="暂无广告效率数据">
                    {efficiencyTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={efficiencyTrendData}
                        axis={{ y: { labelFormatter: (value: number) => `${Number(value).toFixed(2)}%` } }}
                        tooltip={{
                          items: [{ field: 'value', valueFormatter: (value: number) => `${Number(value).toFixed(2)}%` }],
                        }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
                <Col xs={24} xl={12}>
                  <TrendChartCard
                    title="成本结构趋势"
                    hasData={costStructureData.length > 0}
                    emptyText="暂无成本结构数据"
                    extra={<Text type="secondary">当前流量花费: {formatTrafficCostWithRatio(summary.trafficCost, summary)}</Text>}
                  >
                    {costStructureData.length ? (
                      <Area
                        data={costStructureData}
                        xField="date"
                        yField="value"
                        seriesField="series"
                        colorField="series"
                        scale={{ color: { range: COST_SERIES_COLOR_RANGE } }}
                        stack
                        height={300}
                        theme={DASHBOARD_THEME}
                        legend={{ position: 'top-right' }}
                        axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                        tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <TrendChartCard title="变现质量趋势" hasData={monetizationTrendData.length > 0} emptyText="暂无变现质量数据">
                    {monetizationTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={monetizationTrendData}
                        axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                        tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
                <Col xs={24} xl={12}>
                  <TrendChartCard
                    title="国家贡献排行"
                    hasData={countryRankingData.length > 0}
                    emptyText="暂无国家排行数据"
                    extra={
                      <Segmented
                        value={countryMetric}
                        options={COUNTRY_METRIC_OPTIONS}
                        onChange={(value) => setCountryMetric(value as CountryMetric)}
                      />
                    }
                  >
                    {countryRankingData.length ? (
                      <Column
                        data={countryRankingData}
                        xField="country"
                        yField="value"
                        color="#2563eb"
                        height={300}
                        axis={{
                          y: {
                            labelFormatter: (value: number) =>
                              countryMetric === 'newUsers' ? formatInteger(value) : formatCurrency(value),
                          },
                        }}
                        tooltip={{
                          items: [
                            {
                              field: 'value',
                              valueFormatter: (value: number) =>
                                countryMetric === 'newUsers' ? formatInteger(value) : formatCurrency(value),
                            },
                          ],
                        }}
                      />
                    ) : null}
                  </TrendChartCard>
                </Col>
              </Row>
            </Space>
          </Spin>
        )}
      </Space>
    </PageContainer>
  );
};

export default ProjectTrendDashboardPage;
