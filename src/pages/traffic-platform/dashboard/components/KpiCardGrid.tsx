import React from 'react';
import { Skeleton } from 'antd';
import {
  AlertOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useDashboard } from '../DashboardContext';

const formatTrafficCapacity = (gb: number) => {
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(2)} T`;
  }
  return `${gb.toFixed(2)} GB`;
};

const formatTrafficDelta = (current: number, previous: number) => {
  const delta = current - previous;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} GB`;
};

const KpiCardGrid: React.FC = () => {
  const {
    kpiData,
    kpiLoading,
    setPlatformModalOpen,
    setAccountModalOpen,
    setActiveTab,
    setSyncTaskModalOpen,
    setSyncTaskModalFilters,
  } = useDashboard();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}
    >
      <KpiCard
        title="平台数量"
        value={kpiData.platformCount}
        actionText="查看平台 >"
        icon={<AppstoreOutlined style={{ fontSize: '24px', color: '#2563EB' }} />}
        iconBg="rgba(37, 99, 235, 0.1)"
        loading={kpiLoading}
        onClick={() => setPlatformModalOpen(true)}
      />
      <KpiCard
        title="账号数量"
        value={kpiData.accountCount}
        subtitle={`剩余总流量 ${formatTrafficCapacity(kpiData.totalBalanceGb)}`}
        actionText="查看账号 >"
        icon={<UserOutlined style={{ fontSize: '24px', color: '#10B981' }} />}
        iconBg="rgba(16, 185, 129, 0.1)"
        loading={kpiLoading}
        onClick={() => setAccountModalOpen(true)}
      />
      <KpiCard
        title="今日流量"
        value={`${kpiData.todayTraffic.toFixed(2)} GB`}
        subtitle={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>总消耗 {formatTrafficCapacity(kpiData.totalTrafficGb)}</div>
            <div>较昨日 {formatTrafficDelta(kpiData.todayTraffic, kpiData.yesterdayTraffic)}</div>
          </div>
        }
        actionText="查看明细 >"
        icon={<LineChartOutlined style={{ fontSize: '24px', color: '#7C3AED' }} />}
        iconBg="rgba(124, 58, 237, 0.1)"
        loading={kpiLoading}
        onClick={() => setActiveTab('daily')}
      />
      <KpiCard
        title="今日同步任务"
        value={kpiData.todaySyncJob}
        subtitle={`较昨日 ${
          kpiData.todaySyncJob >= kpiData.yesterdaySyncJob ? '+' : ''
        }${kpiData.todaySyncJob - kpiData.yesterdaySyncJob}`}
        actionText="查看任务 >"
        icon={<SyncOutlined style={{ fontSize: '24px', color: '#06B6D4' }} />}
        iconBg="rgba(6, 182, 212, 0.1)"
        loading={kpiLoading}
        onClick={() => {
          setSyncTaskModalFilters({});
          setSyncTaskModalOpen(true);
        }}
      />
      <KpiCard
        title="失败任务"
        value={kpiData.failedJob}
        subtitle={`较昨日 ${
          kpiData.failedJob >= kpiData.yesterdayFailedJob ? '+' : ''
        }${kpiData.failedJob - kpiData.yesterdayFailedJob}`}
        actionText="处理失败 >"
        icon={<AlertOutlined style={{ fontSize: '24px', color: '#EF4444' }} />}
        iconBg="rgba(239, 68, 68, 0.1)"
        loading={kpiLoading}
        onClick={() => {
          setSyncTaskModalFilters({ status: 'failed' });
          setSyncTaskModalOpen(true);
        }}
      />
    </div>
  );
};

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  actionText: string;
  icon: React.ReactNode;
  iconBg: string;
  loading: boolean;
  onClick: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  actionText,
  icon,
  iconBg,
  loading,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
        cursor: 'pointer',
        minHeight: '148px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.04)';
      }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{value}</div>
          </div>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>
            {subtitle || '\u00A0'}
          </div>
          <div style={{ fontSize: '13px', color: '#2563EB', whiteSpace: 'nowrap' }}>{actionText}</div>
        </div>
      </Skeleton>
    </div>
  );
};

export default KpiCardGrid;
