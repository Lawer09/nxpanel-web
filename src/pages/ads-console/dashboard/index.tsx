import { Line } from '@ant-design/charts';
import {
  AppstoreOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  LineChartOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Grid,
  message,
  Row,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { getDashboard } from '@/services/ads-console/dashboard';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const cardStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid #e8ecf2',
  boxShadow: '0 1px 3px rgba(18, 31, 53, 0.05)',
};

const palette = {
  ink: '#172033',
  muted: '#697386',
  line: '#e8ecf2',
  surface: '#f6f8fb',
  blue: '#2563eb',
  green: '#0f9f6e',
  amber: '#d97706',
  red: '#dc2626',
  cyan: '#0891b2',
  violet: '#6d5bd0',
};

const toNumber = (value?: number | null) => Number(value || 0);

const formatCompact = (value?: number | null) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toNumber(value));

const formatInteger = (value?: number | null) =>
  toNumber(value).toLocaleString();

const formatMoney = (value?: number | null, currency = 'USD') =>
  `${currency === 'USD' ? '$' : `${currency} `}${toNumber(value).toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    },
  )}`;

const formatRatio = (value?: number | null) => toNumber(value).toFixed(2);

const trendText = (value?: number | null) => {
  const n = toNumber(value);
  if (n === 0) return '0.0%';
  return `${n > 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;
};

type RangePreset = 'WEEK' | 'MONTH' | 'CUSTOM';

const rangeOptions: { label: string; value: RangePreset }[] = [
  { label: '最近一周', value: 'WEEK' },
  { label: '最近一个月', value: 'MONTH' },
  { label: '自定义', value: 'CUSTOM' },
];

type DateRangeState = {
  preset: RangePreset;
  startDate: string;
  endDate: string;
};

const createPresetRange = (preset: Exclude<RangePreset, 'CUSTOM'>) => {
  const today = dayjs();
  if (preset === 'WEEK') {
    return {
      preset,
      startDate: today.subtract(6, 'day').format('YYYY-MM-DD'),
      endDate: today.format('YYYY-MM-DD'),
    };
  }
  return {
    preset,
    startDate: today.subtract(29, 'day').format('YYYY-MM-DD'),
    endDate: today.format('YYYY-MM-DD'),
  };
};

const RangeSegmented: React.FC<{
  value: DateRangeState;
  onChange: (value: DateRangeState) => void;
}> = ({ value, onChange }) => {
  const dateValue: [Dayjs, Dayjs] = [
    dayjs(value.startDate),
    dayjs(value.endDate),
  ];

  return (
    <Space size={8} wrap>
      <Segmented
        size="small"
        value={value.preset}
        options={rangeOptions}
        onChange={(next) => {
          const preset = next as RangePreset;
          if (preset === 'CUSTOM') {
            onChange({ ...value, preset });
            return;
          }
          onChange(createPresetRange(preset));
        }}
        style={{
          padding: 3,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 8,
        }}
      />
      {value.preset === 'CUSTOM' ? (
        <RangePicker
          size="small"
          allowClear={false}
          value={dateValue}
          onChange={(dates) => {
            if (!dates?.[0] || !dates?.[1]) return;
            onChange({
              preset: 'CUSTOM',
              startDate: dates[0].format('YYYY-MM-DD'),
              endDate: dates[1].format('YYYY-MM-DD'),
            });
          }}
          style={{ width: 230 }}
        />
      ) : null}
    </Space>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  growth?: number;
}> = ({ title, value, sub, icon, color, growth }) => {
  const up = toNumber(growth) >= 0;
  return (
    <Card bordered={false} style={cardStyle} bodyStyle={{ padding: 18 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
      >
        <div style={{ minWidth: 0 }}>
          <Text style={{ color: palette.muted, fontSize: 12 }}>{title}</Text>
          <div
            style={{
              marginTop: 8,
              color: palette.ink,
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {value}
          </div>
          <div style={{ marginTop: 8, minHeight: 20 }}>
            {growth !== undefined ? (
              <Space size={4}>
                {up ? (
                  <ArrowUpOutlined style={{ color: palette.green }} />
                ) : (
                  <ArrowDownOutlined style={{ color: palette.red }} />
                )}
                <Text
                  style={{
                    color: up ? palette.green : palette.red,
                    fontSize: 12,
                  }}
                >
                  {trendText(growth)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  较昨日
                </Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {sub}
              </Text>
            )}
          </div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            background: `${color}14`,
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  extra?: React.ReactNode;
}> = ({ icon, title, extra }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}
  >
    <Space size={8}>
      <span style={{ color: palette.blue }}>{icon}</span>
      <Text strong>{title}</Text>
    </Space>
    {extra}
  </div>
);

const DashboardPage: React.FC = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [pageLoading, setPageLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [rankLoading, setRankLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [trendRange, setTrendRange] = useState<DateRangeState>(() =>
    createPresetRange('MONTH'),
  );
  const [rankRange, setRankRange] = useState<DateRangeState>(() =>
    createPresetRange('MONTH'),
  );
  const [data, setData] = useState<AdsConsole.DashboardData | null>(null);

  useEffect(() => {
    setPageLoading(true);
    getDashboard({
      ...(selectedTeam === 'ALL' ? {} : { teamId: selectedTeam }),
      trendStartDate: trendRange.startDate,
      trendEndDate: trendRange.endDate,
      rankStartDate: rankRange.startDate,
      rankEndDate: rankRange.endDate,
    })
      .then((res) => {
        if (res?.success) {
          setData(res.data);
          if (
            selectedTeam === 'ALL' &&
            !res.data.superAdmin &&
            res.data.selectedTeamId
          ) {
            setSelectedTeam(String(res.data.selectedTeamId));
          }
        } else {
          message.error(res?.errorMessage || '首页数据加载失败');
        }
      })
      .finally(() => setPageLoading(false));
  }, [selectedTeam]);

  useEffect(() => {
    if (!data) return;
    setTrendLoading(true);
    getDashboard({
      ...(selectedTeam === 'ALL' ? {} : { teamId: selectedTeam }),
      trendStartDate: trendRange.startDate,
      trendEndDate: trendRange.endDate,
      rankStartDate: rankRange.startDate,
      rankEndDate: rankRange.endDate,
    })
      .then((res) => {
        if (res?.success) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  trends: res.data.trends,
                }
              : res.data,
          );
        } else {
          message.error(res?.errorMessage || '趋势数据加载失败');
        }
      })
      .finally(() => setTrendLoading(false));
  }, [trendRange]);

  useEffect(() => {
    if (!data) return;
    setRankLoading(true);
    getDashboard({
      ...(selectedTeam === 'ALL' ? {} : { teamId: selectedTeam }),
      trendStartDate: trendRange.startDate,
      trendEndDate: trendRange.endDate,
      rankStartDate: rankRange.startDate,
      rankEndDate: rankRange.endDate,
    })
      .then((res) => {
        if (res?.success) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  startDate: res.data.startDate,
                  endDate: res.data.endDate,
                  periodStats: res.data.periodStats,
                  groupSummaries: res.data.groupSummaries,
                  userSummaries: res.data.userSummaries,
                }
              : res.data,
          );
        } else {
          message.error(res?.errorMessage || '排名数据加载失败');
        }
      })
      .finally(() => setRankLoading(false));
  }, [rankRange]);

  const teamOptions = useMemo(() => {
    const options = (data?.teams || []).map((team) => ({
      label: team.name,
      value: String(team.id),
    }));
    return data?.superAdmin
      ? [{ label: '全部', value: 'ALL' }, ...options]
      : options;
  }, [data]);
  const segmentedValue = teamOptions.some((item) => item.value === selectedTeam)
    ? selectedTeam
    : teamOptions[0]?.value || selectedTeam;
  const showTeamSwitcher = data?.superAdmin || teamOptions.length > 0;

  const stats = data?.todayStats;
  const overview = data?.overview;
  const trendChartData = useMemo(
    () =>
      (data?.trends || []).map((item) => ({
        date: item.date,
        value: toNumber(item.spend),
      })),
    [data?.trends],
  );

  const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    const colors = [palette.amber, palette.cyan, palette.violet];
    const color = colors[rank - 1] || '#94a3b8';
    return (
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}18`,
          color,
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {rank}
      </span>
    );
  };

  const groupColumns: ColumnsType<AdsConsole.DashboardGroupSummary> = [
    {
      title: '排名',
      width: 64,
      render: (_, __, index) => <RankBadge rank={index + 1} />,
    },
    {
      title: '项目组',
      dataIndex: 'groupName',
      ellipsis: true,
      render: (_, record) => (
        <div style={{ minWidth: 0 }}>
          <Tooltip title={record.groupName}>
            <Text strong ellipsis style={{ maxWidth: 220 }}>
              {record.groupName || '-'}
            </Text>
          </Tooltip>
          <div style={{ color: palette.muted, fontSize: 12 }}>
            {record.teamName || '未分配团队'} · {record.accountCount || 0}{' '}
            个账户
          </div>
        </div>
      ),
    },
    {
      title: '消耗',
      dataIndex: 'spend',
      width: 130,
      sorter: (a, b) => toNumber(a.spend) - toNumber(b.spend),
      render: (v) => <Text strong>{formatMoney(v as number)}</Text>,
    },
    {
      title: 'ROAS',
      dataIndex: 'roas',
      width: 90,
      render: (v) => (
        <Tag color={toNumber(v as number) >= 1 ? 'green' : 'blue'}>
          {formatRatio(v as number)}
        </Tag>
      ),
    },
  ];

  const userColumns: ColumnsType<AdsConsole.DashboardUserSummary> = [
    {
      title: '排名',
      width: 64,
      render: (_, __, index) => <RankBadge rank={index + 1} />,
    },
    {
      title: '投手',
      dataIndex: 'nickname',
      ellipsis: true,
      render: (_, record) => (
        <div style={{ minWidth: 0 }}>
          <Space size={8}>
            <UserOutlined style={{ color: palette.blue }} />
            <Tooltip title={record.nickname || record.username}>
              <Text strong ellipsis style={{ maxWidth: 180 }}>
                {record.nickname || record.username || '-'}
              </Text>
            </Tooltip>
          </Space>
          <div style={{ color: palette.muted, fontSize: 12 }}>
            {record.teamName || '未分配团队'} · {record.accountCount || 0}{' '}
            个账户
          </div>
        </div>
      ),
    },
    {
      title: '消耗',
      dataIndex: 'spend',
      width: 130,
      sorter: (a, b) => toNumber(a.spend) - toNumber(b.spend),
      render: (v) => <Text strong>{formatMoney(v as number)}</Text>,
    },
    {
      title: 'ROAS',
      dataIndex: 'roas',
      width: 90,
      render: (v) => (
        <Tag color={toNumber(v as number) >= 1 ? 'green' : 'blue'}>
          {formatRatio(v as number)}
        </Tag>
      ),
    },
  ];

  const trendConfig = {
    data: trendChartData,
    xField: 'date',
    yField: 'value',
    height: isMobile ? 260 : 360,
    autoFit: true,
    axis: {
      x: {
        title: false,
        labelFormatter: (v: string) => dayjs(v).format('MM-DD'),
      },
      y: { title: false, labelFormatter: (v: number) => formatCompact(v) },
    },
    tooltip: {
      title: (d: any) => dayjs(d.date).format('YYYY-MM-DD'),
      items: [
        {
          field: 'value',
          name: '消耗',
          valueFormatter: (v: number) => formatMoney(v),
        },
      ],
    },
    style: {
      stroke: palette.blue,
    },
    point: { sizeField: 2 },
    line: { style: { lineWidth: 2 } },
  } as any;

  return (
    <Spin spinning={pageLoading} tip="正在加载团队数据...">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            background: '#fff',
            border: `1px solid ${palette.line}`,
            borderRadius: 8,
            padding: isMobile ? 14 : 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 14,
            flexDirection: isMobile ? 'column' : 'row',
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: palette.ink }}>
              投放经营首页
            </Title>
            <Text type="secondary">
              数据范围：{data?.selectedTeamName || '加载中'} ·{' '}
              {data?.today || dayjs().format('YYYY-MM-DD')}
            </Text>
          </div>
          {showTeamSwitcher ? (
            <Segmented
              value={segmentedValue}
              options={
                teamOptions.length
                  ? teamOptions
                  : [
                      {
                        label: '暂无团队',
                        value: selectedTeam,
                        disabled: true,
                      },
                    ]
              }
              onChange={(value) => setSelectedTeam(String(value))}
              style={{
                maxWidth: '100%',
                padding: 4,
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 8,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            />
          ) : null}
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="今日消耗"
              value={formatMoney(stats?.spend)}
              icon={<DollarOutlined />}
              color={palette.blue}
              growth={stats?.spendGrowth}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="今日曝光"
              value={formatCompact(stats?.impressions)}
              icon={<EyeOutlined />}
              color={palette.violet}
              growth={stats?.impressionsGrowth}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="今日点击"
              value={formatCompact(stats?.clicks)}
              icon={<LineChartOutlined />}
              color={palette.cyan}
              growth={stats?.clicksGrowth}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <MetricCard
              title="今日 ROAS"
              value={formatRatio(stats?.roas)}
              icon={<RiseOutlined />}
              color={palette.green}
              growth={stats?.roasGrowth}
            />
          </Col>
        </Row>

        <Card
          bordered={false}
          style={cardStyle}
          title={<SectionTitle icon={<BankOutlined />} title="系统资源概览" />}
          bodyStyle={{ padding: isMobile ? 12 : 14 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, minmax(0, 1fr))'
                : 'repeat(7, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {[
              {
                label: '团队',
                value: overview?.teamCount,
                icon: <TeamOutlined />,
                color: palette.blue,
              },
              {
                label: '代理商',
                value: overview?.agencyCount,
                icon: <BankOutlined />,
                color: palette.violet,
              },
              {
                label: '项目组',
                value: overview?.groupCount,
                icon: <AppstoreOutlined />,
                color: palette.cyan,
              },
              {
                label: '广告账户',
                value: overview?.accountCount,
                icon: <WalletOutlined />,
                color: palette.green,
              },
              {
                label: '活动',
                value: overview?.campaignCount,
                icon: <BarChartOutlined />,
                color: palette.amber,
              },
              {
                label: '广告组',
                value: overview?.adsetCount,
                icon: <LineChartOutlined />,
                color: '#64748b',
              },
              {
                label: '广告',
                value: overview?.adCount,
                icon: <SafetyCertificateOutlined />,
                color: '#475569',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 52,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: palette.surface,
                  border: `1px solid ${palette.line}`,
                }}
              >
                <span style={{ color: item.color, fontSize: 17 }}>
                  {item.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: palette.ink,
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1.15,
                    }}
                  >
                    {formatInteger(item.value)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.label}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          bordered={false}
          style={cardStyle}
          title={
            <SectionTitle
              icon={<BarChartOutlined />}
              title="消耗趋势图"
              extra={
                <Space size={8} wrap>
                  <CalendarOutlined style={{ color: palette.muted }} />
                  <RangeSegmented value={trendRange} onChange={setTrendRange} />
                </Space>
              }
            />
          }
        >
          <Spin spinning={trendLoading} tip="正在加载趋势数据...">
            {data?.trends?.length ? (
              <Line {...trendConfig} />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无趋势数据"
              />
            )}
          </Spin>
        </Card>

        <Row gutter={[12, 12]}>
          <Col xs={24} xl={12}>
            <Card
              bordered={false}
              style={cardStyle}
              title={
                <SectionTitle
                  icon={<AppstoreOutlined />}
                  title="项目组消耗排名"
                  extra={
                    <RangeSegmented value={rankRange} onChange={setRankRange} />
                  }
                />
              }
            >
              <Spin spinning={rankLoading} tip="正在加载排名数据...">
                <Table
                  rowKey="groupId"
                  dataSource={data?.groupSummaries || []}
                  columns={groupColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 560 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无项目组数据"
                      />
                    ),
                  }}
                />
              </Spin>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              bordered={false}
              style={cardStyle}
              title={
                <SectionTitle
                  icon={<UserOutlined />}
                  title="投手消耗排名"
                  extra={
                    <RangeSegmented value={rankRange} onChange={setRankRange} />
                  }
                />
              }
            >
              <Spin spinning={rankLoading} tip="正在加载排名数据...">
                <Table
                  rowKey="userId"
                  dataSource={data?.userSummaries || []}
                  columns={userColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 540 }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无投手数据"
                      />
                    ),
                  }}
                />
              </Spin>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default DashboardPage;
