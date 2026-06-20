import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAssetMachineCreateCatalog } from '@/services/asset-service/api';
import type { MachineCreateCatalogField } from '../../types';
import { normalizeDevErrorMessage } from '../../utils';
import {
  buildMachineCreateFieldMap,
  collectMachineCreateCatalogMessages,
  type MachineCreateCatalogFieldGroup,
  type MachineCreateCatalogOption,
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

type MachineCreateCatalogDependency = 'account_id' | 'region' | 'zone';

type MachineCreateCatalogFieldState = {
  category: API.AssetMachineCreateCatalogCategory;
  group?: MachineCreateCatalogFieldGroup;
  options: MachineCreateCatalogOption[];
  disabled: boolean;
  loading: boolean;
  error?: string;
  placeholder: string;
  emptyText: string;
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

const FIELD_CATEGORY_MAP: Record<
  MachineCreateCatalogField,
  API.AssetMachineCreateCatalogCategory
> = {
  region: 'regions',
  zone: 'zones',
  instance_type: 'instance-types',
  'billing.type': 'billing-options',
  'billing.period_unit': 'billing-options',
  'billing.internet_charge_type': 'billing-options',
  image_id: 'images',
  'storage.system_disk.category': 'storage-options',
  'storage.data_disks.category': 'storage-options',
  'network.vpc_id': 'network-options',
  'network.subnet_id': 'network-options',
  'network.security_group_id': 'network-options',
  'ip_assignment.mode': 'ip-options',
  'ip_assignment.ip_ids': 'ip-options',
  'ssh_key.provider_key_id': 'ssh-keys',
  time_zone: 'timezones',
};

const FIELD_DEPENDENCIES: Record<
  MachineCreateCatalogField,
  MachineCreateCatalogDependency[]
> = {
  region: ['account_id'],
  zone: ['account_id', 'region'],
  instance_type: ['account_id', 'region', 'zone'],
  'billing.type': ['account_id'],
  'billing.period_unit': ['account_id'],
  'billing.internet_charge_type': ['account_id'],
  image_id: ['account_id', 'region', 'zone'],
  'storage.system_disk.category': ['account_id', 'region', 'zone'],
  'storage.data_disks.category': ['account_id', 'region', 'zone'],
  'network.vpc_id': ['account_id', 'region', 'zone'],
  'network.subnet_id': ['account_id', 'region', 'zone'],
  'network.security_group_id': ['account_id', 'region', 'zone'],
  'ip_assignment.mode': ['account_id', 'region'],
  'ip_assignment.ip_ids': ['account_id', 'region'],
  'ssh_key.provider_key_id': ['account_id'],
  time_zone: ['account_id'],
};

const FIELD_PLACEHOLDER_MAP: Record<MachineCreateCatalogField, string> = {
  region: 'Select region',
  zone: 'Select zone',
  instance_type: 'Select instance type',
  'billing.type': 'Select billing type',
  'billing.period_unit': 'Select unit',
  'billing.internet_charge_type': 'Select internet charge type',
  image_id: 'Select image',
  'storage.system_disk.category': 'Select system disk category',
  'storage.data_disks.category': 'Select data disk category',
  'network.vpc_id': 'Select VPC',
  'network.subnet_id': 'Select subnet',
  'network.security_group_id': 'Select security group',
  'ip_assignment.mode': 'Select IP assignment mode',
  'ip_assignment.ip_ids': 'Select IPs',
  'ssh_key.provider_key_id': 'Select provider SSH key',
  time_zone: 'Select time zone',
};

const getDependencyMessage = (
  field: MachineCreateCatalogField,
  accountReady: boolean,
  regionReady: boolean,
  zoneReady: boolean,
) => {
  const dependencies = FIELD_DEPENDENCIES[field];

  for (const dependency of dependencies) {
    if (dependency === 'account_id' && !accountReady) {
      return 'Select provider account first.';
    }
    if (dependency === 'region' && !regionReady) {
      return 'Select region first.';
    }
    if (dependency === 'zone' && !zoneReady) {
      return 'Select zone first.';
    }
  }

  return undefined;
};

const getFieldEmptyText = (
  field: MachineCreateCatalogField,
  region?: string,
  zone?: string,
  vpcId?: string,
) => {
  switch (field) {
    case 'region':
      return 'No region candidates were returned for the current provider account.';
    case 'zone':
      return region
        ? `No zone candidates were returned for region ${region}.`
        : 'No zone candidates were returned for the current selection.';
    case 'instance_type':
      return region && zone
        ? `No instance type candidates were returned for ${region} / ${zone}.`
        : 'No instance type candidates were returned for the current selection.';
    case 'image_id':
      return zone
        ? `No image candidates were returned for zone ${zone}.`
        : 'No image candidates were returned for the current selection.';
    case 'billing.type':
    case 'billing.period_unit':
    case 'billing.internet_charge_type':
      return 'No billing candidates were returned for the current provider account.';
    case 'storage.system_disk.category':
    case 'storage.data_disks.category':
      return zone
        ? `No storage candidates were returned for zone ${zone}.`
        : 'No storage candidates were returned for the current selection.';
    case 'network.vpc_id':
      return zone
        ? `No VPC candidates were returned for zone ${zone}.`
        : 'No VPC candidates were returned for the current selection.';
    case 'network.subnet_id':
      if (vpcId) {
        return `No subnet candidates were returned for VPC ${vpcId} in the current zone.`;
      }
      return zone
        ? `No subnet candidates were returned for zone ${zone}.`
        : 'No subnet candidates were returned for the current selection.';
    case 'network.security_group_id':
      return zone
        ? `No security group candidates were returned for zone ${zone}.`
        : 'No security group candidates were returned for the current selection.';
    case 'ip_assignment.mode':
      return region
        ? `No IP assignment modes were returned for region ${region}.`
        : 'No IP assignment mode candidates were returned for the current selection.';
    case 'ip_assignment.ip_ids':
      return region
        ? `No selectable IP candidates were returned for region ${region}.`
        : 'No selectable IP candidates were returned for the current selection.';
    case 'ssh_key.provider_key_id':
      return 'No provider SSH key candidates were returned for the current provider account.';
    case 'time_zone':
      return 'No time zone candidates were returned for the current provider account.';
    default:
      return 'No candidate values were returned for the current selection.';
  }
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

  const normalizedRegion = trimValue(region);
  const normalizedZone = trimValue(zone);
  const normalizedVpcId = trimValue(vpcId);
  const accountReady = !!accountId;
  const regionReady = !!normalizedRegion;
  const zoneReady = !!normalizedZone;

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

  const getFieldStatus = useCallback(
    (field: MachineCreateCatalogField): MachineCreateCatalogFieldState => {
      const category = FIELD_CATEGORY_MAP[field];
      const options = getMachineCreateFieldOptions(fieldMap, field);
      const group = getMachineCreateFieldGroup(fieldMap, field);
      const plan = planMap[category];
      const currentState = categoryStateMap[category];
      const matchesPlan =
        !!plan && currentState?.requestKey === plan.requestKey;
      const dependencyMessage = getDependencyMessage(
        field,
        accountReady,
        regionReady,
        zoneReady,
      );
      const loading =
        !dependencyMessage &&
        !!plan &&
        (!matchesPlan ||
          currentState?.loading === true ||
          (currentState?.refreshing === true && options.length === 0));
      const error =
        !dependencyMessage && matchesPlan ? currentState?.error : undefined;

      return {
        category,
        group,
        options,
        disabled: !!dependencyMessage || (loading && options.length === 0),
        loading,
        error,
        placeholder: dependencyMessage || FIELD_PLACEHOLDER_MAP[field],
        emptyText:
          dependencyMessage ||
          error ||
          getFieldEmptyText(field, normalizedRegion, normalizedZone, normalizedVpcId),
      };
    },
    [
      accountReady,
      categoryStateMap,
      fieldMap,
      normalizedRegion,
      normalizedVpcId,
      normalizedZone,
      planMap,
      regionReady,
      zoneReady,
    ],
  );

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
    getFieldStatus,
    reload,
    getPlan: (category: API.AssetMachineCreateCatalogCategory) => planMap[category],
  };
};

export type MachineCreateCatalogController = ReturnType<
  typeof useMachineCreateCatalogs
>;
