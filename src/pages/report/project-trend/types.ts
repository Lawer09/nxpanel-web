import type { ReactNode } from 'react';

export type TrendGranularity = 'day' | 'hour';
export type CountryMetric = 'adRevenue' | 'profit' | 'newUsers';

export type TrendQueryState = {
  projectCode: string;
  dateRange: [string, string];
  granularity: TrendGranularity;
  hourFrom?: number;
  hourTo?: number;
};

export type KpiItem = {
  key: string;
  title: string;
  value: ReactNode;
  customValue?: ReactNode;
  extra?: ReactNode;
};

export type ParsedProjectRow = {
  reportDate: string;
  hour?: number;
  timeLabel: string;
  country: string;
  adRevenue: number;
  adRevenueNow: number;
  adRevenueDiff: number;
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
  trafficCostRatio?: number;
  adEcpm: number;
  arpu: number;
  roi?: number;
};

export type TrendPoint = {
  date: string;
  value: number;
  series: string;
};

export type CountryRankingItem = {
  country: string;
  value: number;
  isMerged?: boolean;
};
