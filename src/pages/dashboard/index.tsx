import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Modal, Select, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
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
import {
  getRetention,
  getActiveUsers,
  getActiveUsersSummary,
  getUserHourlyStats,
} from '@/services/performance/api';

const DashboardPage: React.FC = () => {
  const { data: statsRes, loading: statsLoading } = useRequest(getStats);

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
              { label: 'com.jkcl.zwx.vpn', value: 'com.jkcl.zwx.vpn' },
              { label: 'com.geektreeone.ddmo.GeekStreeNOOne', value: 'com.geektreeone.ddmo.GeekStreeNOOne' },
            ]}
          />
        </Space>
      }
    >
      <StatsOverviewCards stats={stats} loading={statsLoading} />
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
