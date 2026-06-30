import { ArrowLeftOutlined } from '@ant-design/icons';
import { Area, Column, Line } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import { App, Button, Card, Col, Empty, Row, Segmented, Space, Spin, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { history, useSearchParams } from '@umijs/max';
import React, { useEffect, useMemo, useState } from 'react';
import { getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';
import { queryProjectHourlyReport, queryProjectReport } from '@/services/report/api';
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
  formatTrafficCostWithRatio,
  formatRoiPercent,
  getDefaultProjectTrendHourlyDateTimeRange,
  parseProjectTrendHourDateTimeRange,
  normalizeHourRangeValue,
  normalizeProjectTrendGranularity,
  resolveProjectTrendDateRange,
  toSafeNumber,
} from './utils';

const { Text } = Typography;

const getAdStatusColor = (adStatus?: string | null) => {
  if (adStatus === '在投') return 'green';
  if (adStatus === '暂停') return 'orange';
  if (adStatus === '未上线') return 'default';
  return 'blue';
};

const buildInitialTrendQuery = (searchParams: URLSearchParams): TrendQueryState => {
  const projectCode = searchParams.get('projectCode')?.trim() || '';
  const [dateFrom, dateTo] = resolveProjectTrendDateRange(searchParams.get('dateFrom'), searchParams.get('dateTo'));
  const granularity = normalizeProjectTrendGranularity(searchParams.get('granularity'));

  if (granularity === 'hour') {
    const hourFrom = normalizeHourRangeValue(searchParams.get('hourFrom'));
    const hourTo = normalizeHourRangeValue(searchParams.get('hourTo'));
    return {
      projectCode,
      dateRange: [dateFrom, dateTo],
      granularity,
      hourFrom,
      hourTo,
    };
  }

  return {
    projectCode,
    dateRange: [dateFrom, dateTo],
    granularity,
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
  const [lastDailyDateRange, setLastDailyDateRange] = useState<[string, string]>(
    initialQuery.granularity === 'day' ? initialQuery.dateRange : resolveProjectTrendDateRange(null, null),
  );
  const [projectOptions, setProjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [projectMeta, setProjectMeta] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendRows, setTrendRows] = useState<ParsedProjectRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [countryRows, setCountryRows] = useState<Array<Record<string, unknown>>>([]);
  const [countryMetric, setCountryMetric] = useState<CountryMetric>('adRevenue');

  useEffect(() => {
    setDraftQuery(initialQuery);
    setAppliedQuery(initialQuery);
    if (initialQuery.granularity === 'day') {
      setLastDailyDateRange(initialQuery.dateRange);
    }
  }, [initialQuery]);

  useEffect(() => {
    const run = async () => {
      const res = await getProjects({ page: 1, pageSize: 200 });
      if (res.code !== 0) return;
      const rows = res.data?.data ?? [];
      setProjectOptions(
        rows
          .filter((item) => item.projectCode)
          .map((item) => ({
            label: `${item.projectName || item.projectCode} (${item.projectCode})`,
            value: item.projectCode,
          })),
      );
    };
    void run();
  }, []);

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
      if (draftQuery.granularity === 'day') {
        setLastDailyDateRange(draftQuery.dateRange);
      }
      const hourlyRange = parseProjectTrendHourDateTimeRange(getDefaultProjectTrendHourlyDateTimeRange());
      if (!hourlyRange) return;
      setDraftQuery((prev) => ({
        ...prev,
        granularity: 'hour',
        ...hourlyRange,
      }));
      return;
    }

    setDraftQuery((prev) => ({
      ...prev,
      granularity: 'day',
      dateRange: lastDailyDateRange,
      hourFrom: undefined,
      hourTo: undefined,
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
    const adRevenueHelperText = `${formatCurrency(adRevenueNowValue)}（${formatCurrency(adRevenueDiffValue)}）`;
    const adRevenueBaseNumber = toSafeNumber(adRevenueBaseValue);
    const adRevenueNowNumber = toSafeNumber(adRevenueNowValue);
    const adRevenueRatioText =
      adRevenueBaseNumber && adRevenueNowNumber !== null
        ? `${((adRevenueNowNumber / adRevenueBaseNumber) * 100).toFixed(1)}%`
        : '--';

    return [
      {
        key: 'adRevenue',
        title: '广告收入',
        value: formatCurrency(adRevenueBaseValue),
        customValue: (
          <span style={{ position: 'relative', display: 'inline-block', paddingRight: 34 }}>
            <span>{formatCurrency(adRevenueBaseValue)}</span>
            <Text
              type="secondary"
              style={{ position: 'absolute', right: 0, top: -10, fontSize: 12, lineHeight: 1 }}
            >
              {adRevenueRatioText}
            </Text>
          </span>
        ),
        extra: (
          <Tooltip title="最新收入（广告收益差值）">
            <Text type="secondary" style={{ fontSize: 12, display: 'inline-block', marginTop: 8 }}>
              {adRevenueHelperText}
            </Text>
          </Tooltip>
        ),
      },
      { key: 'totalCost', title: '总成本', value: formatCurrency(summary.totalCost) },
      { key: 'profit', title: '利润', value: formatCurrency(summary.profit) },
      { key: 'roi', title: 'ROI', value: formatRoiPercent(summary.roi) },
      { key: 'newUsers', title: '新增用户', value: formatInteger(summary.newUsers) },
      { key: 'dauUsers', title: '最新 / 平均 DAU', value: `${formatInteger(latestDau)} / ${formatInteger(avgDau)}` },
    ];
  }, [summary, trendRows]);

  const revenueTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adRevenue', label: '广告收入' },
        { key: 'totalCost', label: '总成本' },
        { key: 'profit', label: '利润' },
      ]),
    [trendRows],
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
          onProjectCodeChange={(value) => setDraftQuery((prev) => ({ ...prev, projectCode: value }))}
          onDateRangeChange={(nextDateRange) => {
            setLastDailyDateRange(nextDateRange);
            setDraftQuery((prev) => ({
              ...prev,
              dateRange: nextDateRange,
            }));
          }}
          onGranularityChange={handleGranularityChange}
          onHourDateTimeRangeChange={({ dateRange, hourFrom, hourTo }) =>
            setDraftQuery((prev) => ({
              ...prev,
              dateRange,
              hourFrom,
              hourTo,
            }))
          }
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

              <TrendChartCard title="收益趋势" hasData={revenueTrendData.length > 0} emptyText="暂无收益趋势数据">
                {revenueTrendData.length ? (
                  <Line
                    {...lineConfigBase}
                    data={revenueTrendData}
                    axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                    tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                  />
                ) : null}
              </TrendChartCard>

              <TrendChartCard
                title="广告收益对比趋势"
                hasData={adRevenueComparisonTrendData.length > 0}
                emptyText="暂无广告收益对比数据"
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
