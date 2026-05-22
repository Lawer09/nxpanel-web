import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Modal, Select, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import NodeHistoryTab from '@/pages/server/components/NodeHistoryTab';
import SettingsPanel from '@/components/SettingsPanel';
import ActiveUserAlertSettings from './components/ActiveUserAlertSettings';
import NodeScheduleSettings from './components/NodeScheduleSettings';
import StatsOverviewCards from './components/StatsOverviewCards';
import TrafficCards from './components/TrafficCards';
import PendingItems from './components/PendingItems';
import ActiveUsersSummaryCards from './components/ActiveUsersSummaryCards';
import UserTrendCard from './components/UserTrendCard';
import RetentionCard from './components/RetentionCard';
import { getStats } from '@/services/stat/api';
import { getProjects } from '@/services/project/api';
import type * as ProjectTypes from '@/services/project/types';
import { queryProjectReport } from '@/services/report/api';
import {
  getRetention,
  getActiveUsers,
  getActiveUsersSummary,
  getUserHourlyStats,
} from '@/services/performance/api';
import { getEnumAppIds } from '@/services/enum/api';

type IncomeMetrics = {
  income: number;
  revenue: number;
  expense: number;
};

const EMPTY_INCOME_METRICS: IncomeMetrics = {
  income: 0,
  revenue: 0,
  expense: 0,
};

const safeNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const aggregateProjectRows = (rows: API.ProjectReportItem[]): IncomeMetrics => {
  const totals = rows.reduce(
    (acc, row: any) => {
      const revenue = safeNum(row?.adRevenue);
      const expense = safeNum(row?.totalCost) || safeNum(row?.adSpendCost) + safeNum(row?.trafficCost);
      return { revenue: acc.revenue + revenue, expense: acc.expense + expense };
    },
    { revenue: 0, expense: 0 },
  );
  return { revenue: totals.revenue, expense: totals.expense, income: totals.revenue - totals.expense };
};

const DashboardPage: React.FC = () => {
  const { data: statsRes, loading: statsLoading } = useRequest(getStats);
  const { data: appIdEnumRes, loading: appIdEnumLoading } = useRequest(() => getEnumAppIds());
  const { data: projectListRes } = useRequest(() => getProjects({ page: 1, pageSize: 200 }));

  // ── 留存 & 活跃用户 ──────────────────────────────────────────────────────
  const [appId, setAppId] = useState<string | undefined>();
  const [retentionRange, setRetentionRange] = useState<[string, string]>([
    dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsActiveKey, setSettingsActiveKey] = useState<string>('activeUserAlert');
  const [activeGranularity, setActiveGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [activeRange, setActiveRange] = useState<[string, string]>([
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [todayIncomeMetrics, setTodayIncomeMetrics] = useState<IncomeMetrics>(EMPTY_INCOME_METRICS);
  const [monthIncomeMetrics, setMonthIncomeMetrics] = useState<IncomeMetrics>(EMPTY_INCOME_METRICS);
  const [incomeLoading, setIncomeLoading] = useState(false);

  const { data: summaryRes, loading: summaryLoading } = useRequest(
    () => getActiveUsersSummary({ appId }),
    { refreshDeps: [appId] },
  );
  
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

  const { data: hourlyRes, loading: hourlyLoading } = useRequest(
    () => getUserHourlyStats({ appId }),
    { refreshDeps: [appId], pollingInterval: 60 * 60 * 1000 },
  );
  const hourlyData: API.UserHourlyStatItem[] =
    ((hourlyRes as any)?.data?.data ?? (hourlyRes as any)?.data) || [];

  const stats = (statsRes as any)?.data ?? statsRes as API.StatOverviewData | undefined;
  const projectList: ProjectTypes.ProjectItem[] = Array.isArray((projectListRes as any)?.data)
    ? (projectListRes as any).data
    : Array.isArray(projectListRes)
      ? (projectListRes as ProjectTypes.ProjectItem[])
      : [];
  const appIdProjectCodeMap = useMemo(() => {
    const map = new Map<string, string[]>();
    projectList.forEach((project: ProjectTypes.ProjectItem) => {
      const projectCode = String(project.projectCode || '').trim();
      if (!projectCode) return;
      (project.userApps ?? []).forEach((item: ProjectTypes.ProjectUserApp) => {
        const currentAppId = String(item?.appId || '').trim();
        if (!currentAppId) return;
        const current = map.get(currentAppId) ?? [];
        if (!current.includes(projectCode)) {
          current.push(projectCode);
        }
        map.set(currentAppId, current);
      });
    });
    return map;
  }, [projectList]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIncomeLoading(true);
      const today = dayjs().format('YYYY-MM-DD');
      const dateFrom = dayjs().startOf('month').format('YYYY-MM-DD');
      const dateTo = dayjs().format('YYYY-MM-DD');

      let projectCodes: string[] | undefined;
      if (appId) {
        projectCodes = appIdProjectCodeMap.get(appId) ?? [];
      }

      const todayPayload: API.ProjectReportQuery = {
        dateFrom: today,
        dateTo: today,
        groupBy: ['reportDate'],
        filters: { projectCodes },
        page: 1,
        pageSize: 100,
      };
      const monthPayload: API.ProjectReportQuery = {
        dateFrom,
        dateTo,
        groupBy: ['reportDate'],
        filters: { projectCodes },
        page: 1,
        pageSize: 100,
      };

      const [todayRes, monthRes] = await Promise.all([
        queryProjectReport(todayPayload),
        queryProjectReport(monthPayload),
      ]);

      const resolveMetrics = (
        res: API.ApiResponse<API.ReportPageResult<API.ProjectReportItem>>,
      ) => {
        if (res.code !== 0) return EMPTY_INCOME_METRICS;
        const rows = res.data?.data ?? [];
        return aggregateProjectRows(rows);
      };

      const nextToday = resolveMetrics(todayRes);
      const nextMonth = resolveMetrics(monthRes);

      if (cancelled) return;

      setTodayIncomeMetrics(nextToday);
      setMonthIncomeMetrics(nextMonth);
      setIncomeLoading(false);
    };

    run().catch((error) => {
      if (!cancelled) {
        setTodayIncomeMetrics(EMPTY_INCOME_METRICS);
        setMonthIncomeMetrics(EMPTY_INCOME_METRICS);
        setIncomeLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [appId, appIdProjectCodeMap]);

  const appIdOptions = useMemo(() => {
    const raw = (appIdEnumRes as any)?.data ?? appIdEnumRes;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const value = String(item?.appId || item?.value || '').trim();
        if (!value) return null;
        const projectCodes = appIdProjectCodeMap.get(value) ?? [];
        const prefix = projectCodes.length ? `[${projectCodes.join(',')}] ` : '';
        return { label: `${prefix}${value}`, value };
      })
      .filter((item): item is { label: string; value: string } => Boolean(item));
  }, [appIdEnumRes, appIdProjectCodeMap]);

  return (
    <PageContainer
      extra={
        <Space>
          <Select
            value={appId}
            onChange={setAppId}
            style={{ width: 260 }}
            allowClear
            loading={appIdEnumLoading}
            placeholder="选择包名"
            options={appIdOptions}
          />
        </Space>
      }
    >
      <StatsOverviewCards
        stats={stats}
        todayIncomeMetrics={todayIncomeMetrics}
        monthIncomeMetrics={monthIncomeMetrics}
        loading={incomeLoading}
      />
      <TrafficCards stats={stats} loading={statsLoading} />
      <PendingItems stats={stats} />

      {/* ── 活跃用户概览 ─────────────────────────────────────────────── */}
      <ActiveUsersSummaryCards summary={summary} loading={summaryLoading} />

      {/* ── 用户趋势 ─────────────────────────────────────────────────── */}
      <UserTrendCard
        hourlyData={hourlyData}
        hourlyLoading={hourlyLoading}
        activeData={activeData}
        activeLoading={activeLoading}
        activeGranularity={activeGranularity}
        onGranularityChange={setActiveGranularity}
        activeRange={activeRange}
        onRangeChange={setActiveRange}
        onOpenSettings={() => {
          setSettingsActiveKey('activeUserAlert');
          setSettingsOpen(true);
        }}
      />

      {/* ── 留存矩阵 ─────────────────────────────────────────────────── */}
      <RetentionCard
        data={retentionData}
        loading={retentionLoading}
        range={retentionRange}
        onRangeChange={setRetentionRange}
      />

      {/* ── 节点状态 ─────────────────────────────────────────────────── */}
      <NodeHistoryTab
        active
        onOpenSettings={() => {
          setSettingsActiveKey('nodeSchedule');
          setSettingsOpen(true);
        }}
      />

      {/* ── 配置面板 ─────────────────────────────────────────────────── */}
      <Modal
        title="配置中心"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <SettingsPanel
          activeKey={settingsActiveKey}
          items={[
            {
              key: 'activeUserAlert',
              label: '活跃用户预警',
              content: <ActiveUserAlertSettings />,
            },
            {
              key: 'nodeSchedule',
              label: '节点调度',
              content: <NodeScheduleSettings />,
            },
          ]}
        />
      </Modal>

    </PageContainer>
  );
};

export default DashboardPage;
