import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudServerOutlined,
  DollarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { getStats, getServerLastRank, getServerYesterdayRank } from '@/services/stat/api';
import {
  getRetention,
  getActiveUsers,
  getActiveUsersSummary,
} from '@/services/performance/api';

const { Text } = Typography;

/** 格式化字节为可读流量 */
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/** 增长率标签 */
const GrowthTag: React.FC<{ value?: number }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  if (value > 0)
    return (
      <Tag icon={<ArrowUpOutlined />} color="success">
        {value.toFixed(1)}%
      </Tag>
    );
  if (value < 0)
    return (
      <Tag icon={<ArrowDownOutlined />} color="error">
        {Math.abs(value).toFixed(1)}%
      </Tag>
    );
  return <Tag color="default">0%</Tag>;
};

const DashboardPage: React.FC = () => {
  const { data: statsRes, loading: statsLoading } = useRequest(getStats);
  const { data: lastRankRes, loading: lastLoading } = useRequest(getServerLastRank);
  const { data: yesterdayRankRes, loading: yesterdayLoading } = useRequest(getServerYesterdayRank);

  // ── 留存 & 活跃用户 ──────────────────────────────────────────────────────
  const [appId, setAppId] = useState<string | undefined>();
  const [retentionRange, setRetentionRange] = useState<[string, string]>([
    dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [activeGranularity, setActiveGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [activeRange, setActiveRange] = useState<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const { data: summaryRes, loading: summaryLoading } = useRequest(getActiveUsersSummary, {
    defaultParams: [{ appId }],
    refreshDeps: [appId],
  });
  const summary = ((summaryRes as any)?.data ?? summaryRes) as API.ActiveUsersSummaryData | undefined;

  const { data: retentionRes, loading: retentionLoading } = useRequest(
    () => getRetention({ dateFrom: retentionRange[0], dateTo: retentionRange[1], appId }),
    { refreshDeps: [retentionRange, appId] },
  );
  const retentionData: API.RetentionCohortItem[] =
    ((retentionRes as any)?.data?.data ?? (retentionRes as any)?.data) || [];

  const { data: activeRes, loading: activeLoading } = useRequest(
    () =>
      getActiveUsers({
        dateFrom: activeRange[0],
        dateTo: activeRange[1],
        granularity: activeGranularity,
        appId,
      }),
    { refreshDeps: [activeRange, activeGranularity, appId] },
  );
  const activeData: API.ActiveUsersTrendItem[] =
    ((activeRes as any)?.data?.data ?? (activeRes as any)?.data) || [];

  const stats = (statsRes as any)?.data ?? statsRes as API.StatOverviewData | undefined;
  const lastRank: API.ServerRankItem[] = (lastRankRes as any)?.data?.list ?? (lastRankRes as any)?.list ?? [];
  const yesterdayRank: API.ServerRankItem[] = (yesterdayRankRes as any)?.data?.list ?? (yesterdayRankRes as any)?.list ?? [];

  const serverColumns = [
    {
      title: '节点名称',
      dataIndex: 'server_name',
      key: 'server_name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'server_type',
      key: 'server_type',
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '上传',
      dataIndex: 'u',
      key: 'u',
      width: 120,
      render: (v: number) => formatBytes(v),
      sorter: (a: API.ServerRankItem, b: API.ServerRankItem) => a.u - b.u,
    },
    {
      title: '下载',
      dataIndex: 'd',
      key: 'd',
      width: 120,
      render: (v: number) => formatBytes(v),
      sorter: (a: API.ServerRankItem, b: API.ServerRankItem) => a.d - b.d,
    },
    {
      title: '总流量',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      render: (v: number) => <Text strong>{formatBytes(v)}</Text>,
      sorter: (a: API.ServerRankItem, b: API.ServerRankItem) => a.total - b.total,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <PageContainer
      extra={
        <Space>
          <Select
            value={appId}
            onChange={setAppId}
            style={{ width: 260 }}
            allowClear
            placeholder="选择包名"
            options={[
              { label: 'com.rocket.space.vpn', value: 'com.rocket.space.vpn' },
              { label: 'com.rocket.hsjd.vpn.jsw', value: 'com.rocket.hsjd.vpn.jsw' },
              { label: 'com.geektreeone.ddmo.GeekStreeNOOne', value: 'com.geektreeone.ddmo.GeekStreeNOOne' },
            ]}
          />
        </Space>
      }
    >
      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="在线节点"
              value={stats?.onlineNodes ?? '--'}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="在线用户"
              value={stats?.onlineUsers ?? '--'}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            {stats?.onlineDevices !== undefined && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                设备数：{stats.onlineDevices}
              </Text>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="今日收入"
              value={stats?.todayIncome !== undefined ? (stats.todayIncome / 100).toFixed(2) : '--'}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
            <GrowthTag value={stats?.dayIncomeGrowth} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="本月收入"
              value={
                stats?.currentMonthIncome !== undefined
                  ? (stats.currentMonthIncome / 100).toFixed(2)
                  : '--'
              }
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#722ed1' }}
            />
            <GrowthTag value={stats?.monthIncomeGrowth} />
          </Card>
        </Col>
      </Row>

      {/* 流量统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card title="今日流量" loading={statsLoading} size="small">
            <Statistic
              title="上传"
              value={formatBytes(stats?.todayTraffic?.upload ?? 0)}
              prefix={<ThunderboltOutlined />}
            />
            <Statistic
              title="下载"
              value={formatBytes(stats?.todayTraffic?.download ?? 0)}
              style={{ marginTop: 8 }}
            />
            <Statistic
              title="总计"
              value={formatBytes(stats?.todayTraffic?.total ?? 0)}
              valueStyle={{ color: '#1890ff' }}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="本月流量" loading={statsLoading} size="small">
            <Statistic
              title="上传"
              value={formatBytes(stats?.monthTraffic?.upload ?? 0)}
              prefix={<ThunderboltOutlined />}
            />
            <Statistic
              title="下载"
              value={formatBytes(stats?.monthTraffic?.download ?? 0)}
              style={{ marginTop: 8 }}
            />
            <Statistic
              title="总计"
              value={formatBytes(stats?.monthTraffic?.total ?? 0)}
              valueStyle={{ color: '#52c41a' }}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card title="用户概览" loading={statsLoading} size="small">
            <Statistic title="总用户数" value={stats?.totalUsers ?? '--'} />
            <Statistic
              title="活跃用户"
              value={stats?.activeUsers ?? '--'}
              style={{ marginTop: 8 }}
            />
            <Statistic
              title="本月新增"
              value={stats?.currentMonthNewUsers ?? '--'}
              valueStyle={{ color: '#52c41a' }}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 待处理事项 */}
      {(stats?.ticketPendingTotal || stats?.commissionPendingTotal) ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {stats?.ticketPendingTotal ? (
            <Col xs={24} sm={12}>
              <Card size="small" style={{ borderLeft: '4px solid #faad14' }}>
                <Statistic
                  title="待处理工单"
                  value={stats.ticketPendingTotal}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          ) : null}
          {stats?.commissionPendingTotal ? (
            <Col xs={24} sm={12}>
              <Card size="small" style={{ borderLeft: '4px solid #1890ff' }}>
                <Statistic
                  title="待处理佣金"
                  value={stats.commissionPendingTotal}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          ) : null}
        </Row>
      ) : null}

      {/* 节点流量排行 */}
      <Row gutter={16} hidden>
        <Col xs={24} lg={12}>
          <Card title="实时节点流量排行" loading={lastLoading} style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey="server_id"
              columns={serverColumns}
              dataSource={lastRank}
              pagination={{ pageSize: 10 }}
              bordered
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="昨日节点流量排行" loading={yesterdayLoading} style={{ marginBottom: 16 }}>
            <Table
              size="small"
              rowKey="server_id"
              columns={serverColumns}
              dataSource={yesterdayRank}
              pagination={{ pageSize: 10 }}
              bordered
            />
          </Card>
        </Col>
      </Row>

      {/* ── 活跃用户概览 ─────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading} size="small">
            <Statistic
              title="DAU（日活）"
              value={summary?.dau?.count ?? '--'}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <GrowthTag value={summary?.dau?.change} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading} size="small">
            <Statistic
              title="WAU（周活）"
              value={summary?.wau?.count ?? '--'}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <GrowthTag value={summary?.wau?.change} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={summaryLoading} size="small">
            <Statistic
              title="MAU（月活）"
              value={summary?.mau?.count ?? '--'}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <GrowthTag value={summary?.mau?.change} />
          </Card>
        </Col>
      </Row>

      {/* ── 留存矩阵 ─────────────────────────────────────────────────── */}
      <Card
        title="用户留存分析"
        loading={retentionLoading}
        style={{ marginBottom: 16 }}
        extra={
          <DatePicker.RangePicker
            value={[dayjs(retentionRange[0]), dayjs(retentionRange[1])]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setRetentionRange([
                  dates[0].format('YYYY-MM-DD'),
                  dates[1].format('YYYY-MM-DD'),
                ]);
              }
            }}
            allowClear={false}
          />
        }
      >
        <Table<API.RetentionCohortItem>
          size="small"
          rowKey="date"
          dataSource={retentionData}
          pagination={false}
          scroll={{ x: 900 }}
          bordered
          columns={[
            { title: '日期', dataIndex: 'date', width: 110, fixed: 'left' },
            { title: '活跃用户', dataIndex: 'activeUsers', width: 90 },
            ...([1, 3, 7, 14, 30] as const).map((d) => ({
              title: `Day+${d}`,
              key: `day_${d}`,
              width: 120,
              render: (_: any, record: API.RetentionCohortItem) => {
                const r = record.retention?.[`day_${d}` as keyof typeof record.retention];
                if (!r) return <Text type="secondary">-</Text>;
                const color =
                  r.rate >= 50 ? '#52c41a' : r.rate >= 20 ? '#faad14' : '#ff4d4f';
                return (
                  <Tooltip title={`${r.count} 人`}>
                    <Tag color={color}>{r.rate.toFixed(1)}%</Tag>
                  </Tooltip>
                );
              },
            })),
          ]}
        />
      </Card>

      {/* ── 活跃用户趋势 ─────────────────────────────────────────────── */}
      <Card
        title="活跃用户趋势"
        loading={activeLoading}
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Select
              value={activeGranularity}
              onChange={setActiveGranularity}
              style={{ width: 100 }}
              options={[
                { label: '按天', value: 'day' },
                { label: '按周', value: 'week' },
                { label: '按月', value: 'month' },
              ]}
            />
            <DatePicker.RangePicker
              value={[dayjs(activeRange[0]), dayjs(activeRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setActiveRange([
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD'),
                  ]);
                }
              }}
              allowClear={false}
            />
          </Space>
        }
      >
        <Table<API.ActiveUsersTrendItem>
          size="small"
          rowKey="period"
          dataSource={activeData}
          pagination={false}
          scroll={{ x: 600 }}
          bordered
          columns={[
            {
              title: '周期',
              dataIndex: 'period',
              width: 120,
              render: (_, record) =>
                record.periodStart && record.periodEnd && record.periodStart !== record.periodEnd
                  ? `${record.periodStart} ~ ${record.periodEnd}`
                  : record.period,
            },
            {
              title: '活跃用户',
              dataIndex: 'activeUsers',
              width: 120,
              sorter: (a, b) => a.activeUsers - b.activeUsers,
              render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
            },
            {
              title: '总上报次数',
              dataIndex: 'totalReports',
              width: 130,
              sorter: (a, b) => a.totalReports - b.totalReports,
              render: (v: number) => v.toLocaleString(),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default DashboardPage;
