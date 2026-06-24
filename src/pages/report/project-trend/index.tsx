import { ArrowLeftOutlined, BarChartOutlined } from '@ant-design/icons';
import { Area, Column, Line } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { history, useSearchParams } from '@umijs/max';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { STANDARD_DATE_PRESET_ITEMS, toRangePickerPresets } from '@/components/report/reportDatePreset';
import { getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';
import { queryProjectReport } from '@/services/report/api';
import {
  buildProjectTrendSearch,
  formatCurrency,
  formatInteger,
  formatTrafficCostWithRatio,
  formatRoiPercent,
  normalizeCountry,
  resolveProjectTrendDateRange,
  toSafeNumber,
} from './utils';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

type TrendQueryState = {
  projectCode: string;
  dateRange: [string, string];
  country?: string;
};

type CountryMetric = 'adRevenue' | 'profit' | 'newUsers';

type KpiItem = {
  key: string;
  title: string;
  value: React.ReactNode;
};

type ParsedProjectRow = {
  reportDate: string;
  country: string;
  adRevenue: number;
  totalCost: number;
  profit: number;
  newUsers: number;
  reportNewUsers: number;
  dauUsers: number;
  adRequests: number;
  adMatchedRequests: number;
  adImpressions: number;
  adClicks: number;
  adMatchRate: number;
  adShowRate: number;
  adCtr: number;
  adSpendCost: number;
  trafficCost: number;
  adEcpm: number;
  arpu: number;
};

type TrendPoint = {
  date: string;
  value: number;
  series: string;
};

const COUNTRY_METRIC_OPTIONS: Array<{ label: string; value: CountryMetric }> = [
  { label: '广告收入', value: 'adRevenue' },
  { label: '利润', value: 'profit' },
  { label: '新增用户', value: 'newUsers' },
];

const DASHBOARD_THEME = {
  colors10: ['#0f766e', '#ea580c', '#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#0891b2', '#b45309'],
};

const LINE_SERIES_COLORS: Record<string, string> = {
  广告收入: '#0f766e',
  总成本: '#ea580c',
  利润: '#2563eb',
  新增用户: '#2563eb',
  上报新增用户: '#7c3aed',
  DAU: '#16a34a',
  广告请求数: '#2563eb',
  广告匹配请求数: '#0f766e',
  广告展示数: '#ea580c',
  广告点击数: '#dc2626',
  广告匹配率: '#0f766e',
  广告展示率: '#2563eb',
  '广告 CTR': '#dc2626',
  '广告 eCPM': '#2563eb',
  ARPU: '#ea580c',
};

const COST_SERIES_COLORS: Record<string, string> = {
  投放成本: '#2563eb',
  流量花费: '#ea580c',
};

const COST_SERIES_COLOR_RANGE = [COST_SERIES_COLORS.投放成本, COST_SERIES_COLORS.流量花费];

const getIsLimitedTagMeta = (isLimited: unknown) => {
  if (isLimited === true || isLimited === 'true' || isLimited === 1 || isLimited === '1') {
    return { label: '限流', color: 'red' as const };
  }
  if (isLimited === false || isLimited === 'false' || isLimited === 0 || isLimited === '0') {
    return { label: '正常', color: 'green' as const };
  }
  return { label: '未知', color: 'default' as const };
};

const CARD_STYLE: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
};

const parseProjectRow = (record: API.ProjectReportItem): ParsedProjectRow => ({
  reportDate: typeof record.reportDate === 'string' ? record.reportDate : '',
  country: typeof record.country === 'string' ? record.country.toUpperCase() : '--',
  adRevenue: toSafeNumber(record.adRevenue) ?? 0,
  totalCost: toSafeNumber(record.totalCost) ?? 0,
  profit: toSafeNumber(record.profit) ?? 0,
  newUsers: toSafeNumber(record.newUsers) ?? 0,
  reportNewUsers: toSafeNumber(record.reportNewUsers) ?? 0,
  dauUsers: toSafeNumber(record.dauUsers) ?? 0,
  adRequests: toSafeNumber(record.adRequests) ?? 0,
  adMatchedRequests: toSafeNumber(record.adMatchedRequests) ?? 0,
  adImpressions: toSafeNumber(record.adImpressions) ?? 0,
  adClicks: toSafeNumber(record.adClicks) ?? 0,
  adMatchRate: toSafeNumber(record.adMatchRate) ?? 0,
  adShowRate: toSafeNumber(record.adShowRate) ?? 0,
  adCtr: toSafeNumber(record.adCtr) ?? 0,
  adSpendCost: toSafeNumber(record.adSpendCost) ?? 0,
  trafficCost: toSafeNumber(record.trafficCost) ?? 0,
  adEcpm: toSafeNumber(record.adEcpm) ?? 0,
  arpu: toSafeNumber(record.arpu) ?? 0,
});

const buildTrendSeries = (
  rows: ParsedProjectRow[],
  fields: Array<{ key: keyof ParsedProjectRow; label: string }>,
): TrendPoint[] =>
  rows.flatMap((item) =>
    fields.map((field) => ({
      date: item.reportDate,
      value: Number(item[field.key] ?? 0),
      series: field.label,
    })),
  );

const buildProjectTrendQuery = (
  query: TrendQueryState,
  groupBy: API.ProjectReportDimension[],
  extra?: { country?: string; orderBy?: string; orderDirection?: 'asc' | 'desc' },
): API.ProjectReportQuery => {
  const filters: API.ProjectReportQuery['filters'] = {
    projectCodes: [query.projectCode],
  };

  const targetCountry = extra?.country || query.country;
  if (targetCountry) {
    filters.countries = [targetCountry];
  }

  return {
    dateFrom: query.dateRange[0],
    dateTo: query.dateRange[1],
    groupBy,
    filters,
    page: 1,
    pageSize: 400,
    orderBy: extra?.orderBy,
    orderDirection: extra?.orderDirection,
  };
};

const ProjectTrendDashboardPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceFrom = searchParams.get('from');
  const initialProjectCode = searchParams.get('projectCode')?.trim() || '';
  const [initialDateFrom, initialDateTo] = resolveProjectTrendDateRange(
    searchParams.get('dateFrom'),
    searchParams.get('dateTo'),
  );
  const initialCountry = normalizeCountry(searchParams.get('country'));

  const [query, setQuery] = useState<TrendQueryState>({
    projectCode: initialProjectCode,
    dateRange: [initialDateFrom, initialDateTo],
    country: initialCountry,
  });
  const [projectOptions, setProjectOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [projectMeta, setProjectMeta] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [trendRows, setTrendRows] = useState<ParsedProjectRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [countryRows, setCountryRows] = useState<Array<Record<string, unknown>>>([]);
  const [countryTrendRows, setCountryTrendRows] = useState<ParsedProjectRow[]>([]);
  const [countryMetric, setCountryMetric] = useState<CountryMetric>('adRevenue');
  const isLimitedTagMeta = getIsLimitedTagMeta(projectMeta?.isLimited);

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
    if (!query.projectCode) return;
    const run = async () => {
      const res = await getProjects({ keyword: query.projectCode, page: 1, pageSize: 20 });
      if (res.code !== 0) return;
      const matched = (res.data?.data ?? []).find((item) => item.projectCode === query.projectCode) ?? null;
      setProjectMeta(matched);
    };
    void run();
  }, [query.projectCode]);

  useEffect(() => {
    if (!query.projectCode) return;
    setSearchParams(
      buildProjectTrendSearch({
        projectCode: query.projectCode,
        dateFrom: query.dateRange[0],
        dateTo: query.dateRange[1],
        country: query.country,
        from:
          sourceFrom === 'project-table' || sourceFrom === 'report-project'
            ? (sourceFrom as 'project-table' | 'report-project')
            : undefined,
      }),
    );
  }, [query, setSearchParams, sourceFrom]);

  useEffect(() => {
    if (!query.projectCode) return;
    let alive = true;
    const run = async () => {
      setLoading(true);
      try {
        const [trendRes, countryRes, countryTrendRes] = await Promise.all([
          queryProjectReport(
            buildProjectTrendQuery(query, ['reportDate'], {
              orderBy: 'reportDate',
              orderDirection: 'asc',
            }),
          ),
          queryProjectReport(
            buildProjectTrendQuery(query, ['country'], {
              orderBy: countryMetric,
              orderDirection: 'desc',
            }),
          ),
          query.country
            ? queryProjectReport(
                buildProjectTrendQuery(query, ['reportDate', 'country'], {
                  country: query.country,
                  orderBy: 'reportDate',
                  orderDirection: 'asc',
                }),
              )
            : Promise.resolve(null),
        ]);

        if (!alive) return;

        if (trendRes.code !== 0) {
          message.error(trendRes.msg || '获取项目趋势数据失败');
          setTrendRows([]);
          setSummary({});
        } else {
          setTrendRows((trendRes.data?.data ?? []).map(parseProjectRow));
          setSummary((trendRes.data?.summary as Record<string, unknown>) ?? {});
        }

        if (countryRes.code !== 0) {
          message.error(countryRes.msg || '获取国家排行失败');
          setCountryRows([]);
        } else {
          setCountryRows((countryRes.data?.data ?? []) as Array<Record<string, unknown>>);
        }

        if (countryTrendRes) {
          if (countryTrendRes.code !== 0) {
            message.error(countryTrendRes.msg || '获取国家趋势失败');
            setCountryTrendRows([]);
          } else {
            const rows = (countryTrendRes.data?.data ?? []) as API.ProjectReportItem[];
            setCountryTrendRows(rows.map(parseProjectRow).filter((item) => item.country === query.country));
          }
        } else {
          setCountryTrendRows([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [query, countryMetric, message]);

  const kpiItems = useMemo<KpiItem[]>(() => {
    const latestRow = trendRows[trendRows.length - 1];
    const latestDau = latestRow?.dauUsers ?? 0;
    const avgDau =
      trendRows.length > 0 ? trendRows.reduce((sum, item) => sum + item.dauUsers, 0) / trendRows.length : 0;

    return [
      { key: 'adRevenue', title: '广告收入', value: formatCurrency(summary.adRevenue) },
      { key: 'totalCost', title: '总成本', value: formatCurrency(summary.totalCost) },
      { key: 'profit', title: '利润', value: formatCurrency(summary.profit) },
      { key: 'roi', title: 'ROI', value: formatRoiPercent(summary.roi) },
      { key: 'newUsers', title: '新增用户', value: formatInteger(summary.newUsers) },
      { key: 'dauUsers', title: '最新 / 平均 DAU', value: `${formatInteger(latestDau)} / ${formatInteger(avgDau)}` },
    ];
  }, [summary, trendRows]);
  const getAdStatusColor = (adStatus?: string | null) => {
    if (adStatus === '在投') return 'green';
    if (adStatus === '暂停') return 'orange';
    if (adStatus === '未上线') return 'default';
    return 'blue';
  };
  const revenueTrendData = useMemo(
    () =>
      buildTrendSeries(trendRows, [
        { key: 'adRevenue', label: '广告收入' },
        { key: 'totalCost', label: '总成本' },
        { key: 'profit', label: '利润' },
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

  const countryRankingData = useMemo(
    () =>
      countryRows
        .map((item) => ({
          country: typeof item.country === 'string' ? item.country.toUpperCase() : '--',
          value: toSafeNumber(item[countryMetric]) ?? 0,
        }))
        .filter((item) => item.country !== '--' && item.value > 0),
    [countryRows, countryMetric],
  );

  const countryRevenueTrendData = useMemo(
    () =>
      buildTrendSeries(countryTrendRows, [
        { key: 'adRevenue', label: '广告收入' },
        { key: 'totalCost', label: '总成本' },
        { key: 'profit', label: '利润' },
      ]),
    [countryTrendRows],
  );

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
        <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <Space align="center" wrap size={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {query.projectCode || '未选择项目'}
                </Title>
                {projectMeta?.adStatus ? <Tag color={getAdStatusColor(projectMeta.adStatus)}>投放-{projectMeta.adStatus}</Tag> : null}
                {/* {projectMeta ? <Tag color={isLimitedTagMeta.color}>{isLimitedTagMeta.label}</Tag> : null} */}
                {projectMeta?.status ? <Tag>{projectMeta.status}</Tag> : null}
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {projectMeta?.projectName || '项目趋势分析'} {projectMeta?.packageName ? `| ${projectMeta.packageName}` : ''}
                </Text>
              </div>
            </div>

            <Space wrap>
              <Select
                showSearch
                placeholder="选择项目代号"
                style={{ width: 260 }}
                value={query.projectCode || undefined}
                options={projectOptions}
                optionFilterProp="label"
                onChange={(value) => setQuery((prev) => ({ ...prev, projectCode: value }))}
              />
              <RangePicker
                value={[dayjs(query.dateRange[0]), dayjs(query.dateRange[1])]}
                presets={DATE_PRESETS}
                onChange={(dates) => {
                  const [start, end] = dates ?? [];
                  if (!start || !end) return;
                  setQuery((prev) => ({
                    ...prev,
                    dateRange: [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')],
                  }));
                }}
              />
              <Select
                allowClear
                showSearch
                placeholder="国家下钻"
                style={{ width: 140 }}
                value={query.country}
                options={countryRankingData.map((item) => ({ label: item.country, value: item.country }))}
                onChange={(value) => setQuery((prev) => ({ ...prev, country: normalizeCountry(value) }))}
              />
            </Space>
          </div>
        </Card>

        {!query.projectCode ? (
          <Card style={CARD_STYLE}>
            <Empty description="请选择项目代号后查看趋势分析" />
          </Card>
        ) : (
          <Spin spinning={loading}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {kpiItems.map((item) => (
                  <Card key={item.key} style={CARD_STYLE} styles={{ body: { padding: 18 } }}>
                    <Statistic title={item.title} value={item.value as any} />
                  </Card>
                ))}
              </div>

              <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                <Title level={5} style={{ marginTop: 0 }}>收益趋势</Title>
                {revenueTrendData.length ? (
                  <Line
                    {...lineConfigBase}
                    data={revenueTrendData}
                    axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                    tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                  />
                ) : (
                  <Empty description="暂无收益趋势数据" />
                )}
              </Card>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <Title level={5} style={{ marginTop: 0 }}>用户趋势</Title>
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
                    ) : (
                      <Empty description="暂无用户趋势数据" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <Title level={5} style={{ marginTop: 0 }}>广告漏斗量级趋势</Title>
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
                    ) : (
                      <Empty description="暂无广告漏斗数据" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <Title level={5} style={{ marginTop: 0 }}>广告效率趋势</Title>
                    {efficiencyTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={efficiencyTrendData}
                        axis={{ y: { labelFormatter: (value: number) => `${Number(value).toFixed(2)}%` } }}
                        tooltip={{
                          items: [{ field: 'value', valueFormatter: (value: number) => `${Number(value).toFixed(2)}%` }],
                        }}
                      />
                    ) : (
                      <Empty description="暂无广告效率数据" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>成本结构趋势</Title>
                      <Text type="secondary">当前流量花费: {formatTrafficCostWithRatio(summary.trafficCost, summary)}</Text>
                    </div>
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
                    ) : (
                      <Empty description="暂无成本结构数据" />
                    )}
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <Title level={5} style={{ marginTop: 0 }}>变现质量趋势</Title>
                    {monetizationTrendData.length ? (
                      <Line
                        {...lineConfigBase}
                        data={monetizationTrendData}
                        axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                        tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                      />
                    ) : (
                      <Empty description="暂无变现质量数据" />
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={12}>
                  <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>国家贡献排行</Title>
                      <Segmented
                        value={countryMetric}
                        options={COUNTRY_METRIC_OPTIONS}
                        onChange={(value) => setCountryMetric(value as CountryMetric)}
                      />
                    </div>
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
                        onReady={(plot: any) => {
                          plot.on('element:click', (event: any) => {
                            const country = event?.data?.data?.country;
                            if (!country) return;
                            setQuery((prev) => ({ ...prev, country }));
                          });
                        }}
                      />
                    ) : (
                      <Empty description="暂无国家排行数据" />
                    )}
                  </Card>
                </Col>
              </Row>

              {query.country ? (
                <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {query.country} 国家收益趋势
                    </Title>
                    <Button
                      type="link"
                      icon={<BarChartOutlined />}
                      onClick={() => setQuery((prev) => ({ ...prev, country: undefined }))}
                    >
                      清除国家下钻
                    </Button>
                  </div>
                  {countryRevenueTrendData.length ? (
                    <Line
                      {...lineConfigBase}
                      data={countryRevenueTrendData}
                      axis={{ y: { labelFormatter: (value: number) => formatCurrency(value) } }}
                      tooltip={{ items: [{ field: 'value', valueFormatter: (value: number) => formatCurrency(value) }] }}
                    />
                  ) : (
                    <Empty description="当前国家暂无趋势数据" />
                  )}
                </Card>
              ) : null}
            </Space>
          </Spin>
        )}
      </Space>
    </PageContainer>
  );
};

export default ProjectTrendDashboardPage;
