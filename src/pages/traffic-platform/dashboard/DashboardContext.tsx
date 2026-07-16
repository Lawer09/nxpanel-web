import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  getTrafficAccounts,
  getTrafficDaily,
  getTrafficPlatforms,
  getTrafficSyncJobs,
} from '@/services/traffic-platform/api';

export interface DashboardFilters {
  platformCode?: string;
  accountId?: number;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  geo?: string;
  granularity: 'hour' | 'day' | 'month';
}

export interface KpiData {
  platformCount: number;
  accountCount: number;
  totalBalanceGb: number;
  totalTrafficGb: number;
  todayTraffic: number;
  yesterdayTraffic: number;
  todaySyncJob: number;
  yesterdaySyncJob: number;
  failedJob: number;
  yesterdayFailedJob: number;
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;

  platformOptions: { label: string; value: string }[];
  accountOptions: { label: string; value: number }[];

  kpiData: KpiData;
  kpiLoading: boolean;

  reloadKpi: () => void;

  platformModalOpen: boolean;
  setPlatformModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;
  manualSyncOpen: boolean;
  setManualSyncOpen: (open: boolean) => void;

  syncTaskModalOpen: boolean;
  setSyncTaskModalOpen: (open: boolean) => void;
  syncTaskModalFilters: { status?: string };
  setSyncTaskModalFilters: (filters: { status?: string }) => void;

  syncErrorData: API.TrafficSyncJobItem | null;
  setSyncErrorData: (data: API.TrafficSyncJobItem | null) => void;

  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return ctx;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: [dayjs().subtract(6, 'day'), dayjs()],
    granularity: 'day',
  });

  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  const [kpiData, setKpiData] = useState<KpiData>({
    platformCount: 0,
    accountCount: 0,
    totalBalanceGb: 0,
    totalTrafficGb: 0,
    todayTraffic: 0,
    yesterdayTraffic: 0,
    todaySyncJob: 0,
    yesterdaySyncJob: 0,
    failedJob: 0,
    yesterdayFailedJob: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiQueryVer, setKpiQueryVer] = useState(0);

  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [manualSyncOpen, setManualSyncOpen] = useState(false);
  const [syncTaskModalOpen, setSyncTaskModalOpen] = useState(false);
  const [syncTaskModalFilters, setSyncTaskModalFilters] = useState<{ status?: string }>({});
  const [syncErrorData, setSyncErrorData] = useState<API.TrafficSyncJobItem | null>(null);

  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const platRes = await getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 });
        const plats = (platRes.data?.data || platRes.data || []) as API.TrafficPlatformItem[];
        setPlatformOptions(plats.map((p) => ({ label: p.name, value: p.code })));

        const accRes = await getTrafficAccounts({
          enabled: 1,
          platformCode: filters.platformCode,
          page: 1,
          pageSize: 200,
        });
        const accs = (accRes.data?.data || accRes.data || []) as API.TrafficAccountItem[];
        setAccountOptions(
          accs.map((a) => ({ label: `${a.accountName} (${a.platformCode})`, value: a.id })),
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchOptions();
  }, [filters.platformCode]);

  useEffect(() => {
    const fetchKpi = async () => {
      setKpiLoading(true);
      try {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        const [rangeStart, rangeEnd] = filters.dateRange;

        const toGb = (val: any) => {
          if (val?.trafficGb) return Number(val.trafficGb);
          if (val?.trafficMb) return Number(val.trafficMb) / 1024;
          if (val?.trafficBytes !== undefined) return Number(val.trafficBytes) / 1024 / 1024 / 1024;
          return 0;
        };

        const normalizePagePayload = <T,>(res: any) => {
          const payload = res?.data ?? res;
          const candidates = [
            payload,
            payload?.data,
            payload?.rows,
            payload?.list,
            payload?.items,
            payload?.data?.data,
            payload?.data?.rows,
            payload?.data?.list,
            payload?.data?.items,
          ];
          const items = (candidates.find(Array.isArray) || []) as T[];
          const pageInfo = [payload, payload?.data].find(
            (item) =>
              item &&
              typeof item === 'object' &&
              !Array.isArray(item) &&
              (item.total !== undefined || item.totalCount !== undefined || item.count !== undefined),
          ) as any;
          const total = Number(
            pageInfo?.total ?? pageInfo?.totalCount ?? pageInfo?.count ?? 0,
          );

          return { items, total };
        };

        const sumDailyTraffic = async (params: Omit<API.TrafficDailyQuery, 'page' | 'pageSize'>) => {
          const pageSize = 200;
          let page = 1;
          let sum = 0;

          while (true) {
            const res = await getTrafficDaily({
              ...params,
              page,
              pageSize,
            });
            const { items, total } = normalizePagePayload<API.TrafficDailyItem>(res);
            sum += items.reduce((acc: number, item: any) => acc + toGb(item), 0);

            if ((total > 0 && page * pageSize >= total) || items.length < pageSize) {
              break;
            }
            page += 1;
          }

          return sum;
        };

        const [platRes, accRes, accountBalanceRes, todayGb, yesterdayGb, totalTrafficGb, syncTodayTotalRes, syncTodayFailedRes, syncYesterdayTotalRes, syncYesterdayFailedRes] =
          await Promise.all([
            getTrafficPlatforms({
              enabled: 1,
              page: 1,
              pageSize: 1,
              keyword: filters.platformCode,
            }),
            getTrafficAccounts({
              enabled: 1,
              platformCode: filters.platformCode,
              page: 1,
              pageSize: 1,
            }),
            getTrafficAccounts({
              enabled: 1,
              platformCode: filters.platformCode,
              page: 1,
              pageSize: 200,
            }),
            sumDailyTraffic({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              geo: filters.geo || undefined,
              startDate: todayStr,
              endDate: todayStr,
            }),
            sumDailyTraffic({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              geo: filters.geo || undefined,
              startDate: yesterdayStr,
              endDate: yesterdayStr,
            }),
            sumDailyTraffic({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              geo: filters.geo || undefined,
              startDate: rangeStart.format('YYYY-MM-DD'),
              endDate: rangeEnd.format('YYYY-MM-DD'),
            }),
            getTrafficSyncJobs({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              startTime: `${todayStr} 00:00:00`,
              endTime: `${todayStr} 23:59:59`,
              page: 1,
              pageSize: 1,
            }),
            getTrafficSyncJobs({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              status: 'failed',
              startTime: `${todayStr} 00:00:00`,
              endTime: `${todayStr} 23:59:59`,
              page: 1,
              pageSize: 1,
            }),
            getTrafficSyncJobs({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              startTime: `${yesterdayStr} 00:00:00`,
              endTime: `${yesterdayStr} 23:59:59`,
              page: 1,
              pageSize: 1,
            }),
            getTrafficSyncJobs({
              platformCode: filters.platformCode,
              accountId: filters.accountId,
              status: 'failed',
              startTime: `${yesterdayStr} 00:00:00`,
              endTime: `${yesterdayStr} 23:59:59`,
              page: 1,
              pageSize: 1,
            }),
          ]);

        const { items: balanceItems } = normalizePagePayload<API.TrafficAccountItem>(accountBalanceRes);
        const balanceAccounts = balanceItems.filter(
          (item) => !filters.accountId || item.id === filters.accountId,
        );
        const totalBalanceGb = balanceAccounts.reduce(
          (sum, item) => sum + Number(item.balance || 0) / 1024,
          0,
        );

        setKpiData({
          platformCount: platRes?.data.total || 0,
          accountCount: accRes?.data.total || 0,
          totalBalanceGb,
          totalTrafficGb,
          todayTraffic: todayGb,
          yesterdayTraffic: yesterdayGb,
          todaySyncJob: syncTodayTotalRes?.data.total || 0,
          yesterdaySyncJob: syncYesterdayTotalRes?.data.total || 0,
          failedJob: syncTodayFailedRes?.data.total || 0,
          yesterdayFailedJob: syncYesterdayFailedRes?.data.total || 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setKpiLoading(false);
      }
    };

    fetchKpi();
  }, [kpiQueryVer]);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      platformOptions,
      accountOptions,
      kpiData,
      kpiLoading,
      reloadKpi: () => setKpiQueryVer((v) => v + 1),
      platformModalOpen,
      setPlatformModalOpen,
      accountModalOpen,
      setAccountModalOpen,
      manualSyncOpen,
      setManualSyncOpen,
      syncTaskModalOpen,
      setSyncTaskModalOpen,
      syncTaskModalFilters,
      setSyncTaskModalFilters,
      syncErrorData,
      setSyncErrorData,
      activeTab,
      setActiveTab,
    }),
    [
      filters,
      platformOptions,
      accountOptions,
      kpiData,
      kpiLoading,
      platformModalOpen,
      accountModalOpen,
      manualSyncOpen,
      syncTaskModalOpen,
      syncTaskModalFilters,
      syncErrorData,
      activeTab,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
