import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAssetMachineCreateCatalog } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';
import {
  buildMachineCreateFieldMap,
  collectMachineCreateCatalogMessages,
  getMachineCreateFieldGroup,
  getMachineCreateFieldOptions,
} from './machineCreateCatalog';

type UseMachineCreateCatalogsParams = {
  open: boolean;
  accountId?: number;
  region?: string;
  zone?: string;
  vpcId?: string;
};

type MachineCreateCatalogPlan = {
  category: API.AssetMachineCreateCatalogCategory;
  params?: API.AssetMachineCreateCatalogQuery;
  requestKey: string;
};

type MachineCreateCatalogState = {
  requestKey?: string;
  data?: API.AssetMachineCreateCatalog;
  loading: boolean;
  refreshing: boolean;
  error?: string;
};

const trimValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const buildRequestKey = (
  accountId: number,
  category: API.AssetMachineCreateCatalogCategory,
  params?: API.AssetMachineCreateCatalogQuery,
) => {
  const query = Object.entries(params || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');

  const base = `account:${accountId}|${category}`;
  return query ? `${base}?${query}` : base;
};

const buildCatalogPlans = ({
  accountId,
  region,
  zone,
  vpcId,
}: Omit<UseMachineCreateCatalogsParams, 'open'>): MachineCreateCatalogPlan[] => {
  if (!accountId) {
    return [];
  }

  const normalizedRegion = trimValue(region);
  const normalizedZone = trimValue(zone);
  const normalizedVpcId = trimValue(vpcId);

  const plans: MachineCreateCatalogPlan[] = [
    {
      category: 'regions',
      requestKey: buildRequestKey(accountId, 'regions'),
    },
    {
      category: 'billing-options',
      requestKey: buildRequestKey(accountId, 'billing-options'),
    },
    {
      category: 'ssh-keys',
      requestKey: buildRequestKey(accountId, 'ssh-keys'),
    },
    {
      category: 'timezones',
      requestKey: buildRequestKey(accountId, 'timezones'),
    },
  ];

  if (normalizedRegion) {
    const regionParams = { region: normalizedRegion };
    plans.push({
      category: 'zones',
      params: regionParams,
      requestKey: buildRequestKey(accountId, 'zones', regionParams),
    });
    plans.push({
      category: 'ip-options',
      params: regionParams,
      requestKey: buildRequestKey(accountId, 'ip-options', regionParams),
    });
  }

  if (normalizedRegion && normalizedZone) {
    const zoneParams = {
      region: normalizedRegion,
      zone: normalizedZone,
    };
    const networkParams = normalizedVpcId
      ? { ...zoneParams, vpc_id: normalizedVpcId }
      : zoneParams;

    plans.push(
      {
        category: 'instance-types',
        params: zoneParams,
        requestKey: buildRequestKey(accountId, 'instance-types', zoneParams),
      },
      {
        category: 'images',
        params: zoneParams,
        requestKey: buildRequestKey(accountId, 'images', zoneParams),
      },
      {
        category: 'storage-options',
        params: zoneParams,
        requestKey: buildRequestKey(accountId, 'storage-options', zoneParams),
      },
      {
        category: 'network-options',
        params: networkParams,
        requestKey: buildRequestKey(accountId, 'network-options', networkParams),
      },
    );
  }

  return plans;
};

export const useMachineCreateCatalogs = ({
  open,
  accountId,
  region,
  zone,
  vpcId,
}: UseMachineCreateCatalogsParams) => {
  const [categoryStateMap, setCategoryStateMap] = useState<
    Partial<Record<API.AssetMachineCreateCatalogCategory, MachineCreateCatalogState>>
  >({});
  const activeRequestKeyRef = useRef<
    Partial<Record<API.AssetMachineCreateCatalogCategory, string>>
  >({});

  const plans = useMemo(
    () => buildCatalogPlans({ accountId, region, zone, vpcId }),
    [accountId, region, zone, vpcId],
  );

  const planMap = useMemo(
    () => {
      const nextMap: Partial<
        Record<API.AssetMachineCreateCatalogCategory, MachineCreateCatalogPlan>
      > = {};

      plans.forEach((item) => {
        nextMap[item.category] = item;
      });

      return nextMap;
    },
    [plans],
  );

  const runPlanRequest = useCallback(
    async (plan: MachineCreateCatalogPlan, refresh = false) => {
      if (!accountId) {
        return;
      }

      setCategoryStateMap((current) => {
        const previous = current[plan.category];
        return {
          ...current,
          [plan.category]: {
            requestKey: plan.requestKey,
            data: previous?.data,
            loading: !previous?.data,
            refreshing: refresh || !!previous?.data,
            error: undefined,
          },
        };
      });

      try {
        const response = await getAssetMachineCreateCatalog(accountId, plan.category, {
          ...plan.params,
          refresh: refresh || undefined,
        });

        if (activeRequestKeyRef.current[plan.category] !== plan.requestKey) {
          return;
        }

        setCategoryStateMap((current) => ({
          ...current,
          [plan.category]: {
            requestKey: plan.requestKey,
            data: response.data,
            loading: false,
            refreshing: false,
            error: undefined,
          },
        }));
      } catch (error: any) {
        if (activeRequestKeyRef.current[plan.category] !== plan.requestKey) {
          return;
        }

        setCategoryStateMap((current) => ({
          ...current,
          [plan.category]: {
            requestKey: plan.requestKey,
            data: current[plan.category]?.data,
            loading: false,
            refreshing: false,
            error: normalizeDevErrorMessage(error),
          },
        }));
      }
    },
    [accountId],
  );

  useEffect(() => {
    if (!open || !accountId) {
      activeRequestKeyRef.current = {};
      setCategoryStateMap({});
      return;
    }

    activeRequestKeyRef.current = Object.fromEntries(
      plans.map((item) => [item.category, item.requestKey]),
    );

    plans.forEach((plan) => {
      const currentState = categoryStateMap[plan.category];
      if (
        currentState?.requestKey === plan.requestKey &&
        (currentState.data ||
          currentState.error ||
          currentState.loading ||
          currentState.refreshing)
      ) {
        return;
      }

      void runPlanRequest(plan, false);
    });
  }, [accountId, categoryStateMap, open, plans, runPlanRequest]);

  const catalogs = useMemo(() => {
    const nextCatalogs: Partial<
      Record<API.AssetMachineCreateCatalogCategory, API.AssetMachineCreateCatalog>
    > = {};

    plans.forEach((plan) => {
      const currentState = categoryStateMap[plan.category];
      if (
        currentState?.requestKey === plan.requestKey &&
        currentState.data
      ) {
        nextCatalogs[plan.category] = currentState.data;
      }
    });

    return nextCatalogs;
  }, [categoryStateMap, plans]);

  const fieldMap = useMemo(() => buildMachineCreateFieldMap(catalogs), [catalogs]);
  const catalogMessages = useMemo(
    () => collectMachineCreateCatalogMessages(catalogs),
    [catalogs],
  );

  const errors = useMemo(
    () =>
      plans
        .map((plan) => {
          const error = categoryStateMap[plan.category]?.error;
          return error ? `${plan.category}: ${error}` : undefined;
        })
        .filter(Boolean) as string[],
    [categoryStateMap, plans],
  );

  const loadingByCategory = useMemo(
    () => {
      const nextMap: Partial<
        Record<API.AssetMachineCreateCatalogCategory, boolean>
      > = {};

      plans.forEach((plan) => {
        nextMap[plan.category] =
          categoryStateMap[plan.category]?.loading || false;
      });

      return nextMap;
    },
    [categoryStateMap, plans],
  );

  const refreshingByCategory = useMemo(
    () => {
      const nextMap: Partial<
        Record<API.AssetMachineCreateCatalogCategory, boolean>
      > = {};

      plans.forEach((plan) => {
        nextMap[plan.category] =
          categoryStateMap[plan.category]?.refreshing || false;
      });

      return nextMap;
    },
    [categoryStateMap, plans],
  );

  const reload = useCallback(async () => {
    await Promise.all(plans.map((plan) => runPlanRequest(plan, true)));
  }, [plans, runPlanRequest]);

  return {
    available: !!accountId,
    plans,
    catalogs,
    fieldMap,
    errors,
    staleMessages: catalogMessages.staleMessages,
    loading: plans.some(
      (plan) => categoryStateMap[plan.category]?.loading === true,
    ),
    refreshing: plans.some(
      (plan) => categoryStateMap[plan.category]?.refreshing === true,
    ),
    loadingByCategory,
    refreshingByCategory,
    getFieldGroup: (field: string) => getMachineCreateFieldGroup(fieldMap, field),
    getFieldOptions: (field: string) =>
      getMachineCreateFieldOptions(fieldMap, field),
    reload,
    getPlan: (category: API.AssetMachineCreateCatalogCategory) => planMap[category],
  };
};

export type MachineCreateCatalogController = ReturnType<
  typeof useMachineCreateCatalogs
>;
