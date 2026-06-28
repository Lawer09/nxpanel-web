import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAssetMachineCreateCatalog } from '@/services/asset-service/api';
import type { MachineCreateCatalogField } from '../../types';
import { normalizeDevErrorMessage } from '../../utils';
import {
  buildMachineCreateFieldMap,
  collectMachineCreateCatalogMessages,
  getMachineCreateFieldGroup,
  getMachineCreateFieldOptions,
  type MachineCreateCatalogFieldGroup,
  type MachineCreateCatalogOption,
} from './machineCreateCatalog';

type UseMachineCreateCatalogsParams = {
  open: boolean;
  accountId?: number;
  countryCode?: string;
  city?: string;
  zoneId?: string;
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

type MachineCreateCatalogDependency = 'account_id' | 'zone_id';

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
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');

  const base = `account:${accountId}|${category}`;
  return query ? `${base}?${query}` : base;
};

const buildCatalogPlans = ({
  accountId,
  countryCode,
  city,
  zoneId,
  vpcId,
}: Omit<
  UseMachineCreateCatalogsParams,
  'open'
>): MachineCreateCatalogPlan[] => {
  if (!accountId) {
    return [];
  }

  const normalizedCountryCode = trimValue(countryCode);
  const normalizedCity = trimValue(city);
  const normalizedZoneId = trimValue(zoneId);
  const normalizedVpcId = trimValue(vpcId);

  const zoneParams: API.AssetMachineCreateCatalogQuery = {
    country_code: normalizedCountryCode,
    city: normalizedCity,
  };

  const plans: MachineCreateCatalogPlan[] = [
    {
      category: 'zones',
      params: zoneParams,
      requestKey: buildRequestKey(accountId, 'zones', zoneParams),
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
    {
      category: 'tag-options',
      requestKey: buildRequestKey(accountId, 'tag-options'),
    },
  ];

  if (normalizedZoneId) {
    const scopedParams: API.AssetMachineCreateCatalogQuery = {
      zone_id: normalizedZoneId,
      vpc_id: normalizedVpcId,
    };

    plans.push(
      {
        category: 'instance-types',
        params: { zone_id: normalizedZoneId },
        requestKey: buildRequestKey(accountId, 'instance-types', {
          zone_id: normalizedZoneId,
        }),
      },
      {
        category: 'os-images',
        params: { zone_id: normalizedZoneId },
        requestKey: buildRequestKey(accountId, 'os-images', {
          zone_id: normalizedZoneId,
        }),
      },
      {
        category: 'vpcs',
        params: scopedParams,
        requestKey: buildRequestKey(accountId, 'vpcs', scopedParams),
      },
      {
        category: 'bandwidth-options',
        params: { zone_id: normalizedZoneId },
        requestKey: buildRequestKey(accountId, 'bandwidth-options', {
          zone_id: normalizedZoneId,
        }),
      },
    );
  }

  return plans;
};

const FIELD_CATEGORY_MAP: Record<
  MachineCreateCatalogField,
  API.AssetMachineCreateCatalogCategory
> = {
  'zone.zone_id': 'zones',
  'spec.type': 'instance-types',
  'os.image_id': 'os-images',
  'vpc.vpc_id': 'vpcs',
  'vpc.vswitch_id': 'vpcs',
  'internet.charge_type': 'bandwidth-options',
  'internet.bandwidth_mbps': 'bandwidth-options',
  'internet.traffic_package_size': 'bandwidth-options',
  'internet.eip_v4_type': 'bandwidth-options',
  'billing.mode': 'billing-options',
  'billing.period_unit': 'billing-options',
  'login.provider_key_id': 'ssh-keys',
  time_zone: 'timezones',
};

const FIELD_DEPENDENCIES: Record<
  MachineCreateCatalogField,
  MachineCreateCatalogDependency[]
> = {
  'zone.zone_id': ['account_id'],
  'spec.type': ['account_id', 'zone_id'],
  'os.image_id': ['account_id', 'zone_id'],
  'vpc.vpc_id': ['account_id', 'zone_id'],
  'vpc.vswitch_id': ['account_id', 'zone_id'],
  'internet.charge_type': ['account_id', 'zone_id'],
  'internet.bandwidth_mbps': ['account_id', 'zone_id'],
  'internet.traffic_package_size': ['account_id', 'zone_id'],
  'internet.eip_v4_type': ['account_id', 'zone_id'],
  'billing.mode': ['account_id'],
  'billing.period_unit': ['account_id'],
  'login.provider_key_id': ['account_id'],
  time_zone: ['account_id'],
};

const FIELD_PLACEHOLDER_MAP: Record<MachineCreateCatalogField, string> = {
  'zone.zone_id': 'Select zone',
  'spec.type': 'Select instance type',
  'os.image_id': 'Select image',
  'vpc.vpc_id': 'Select VPC',
  'vpc.vswitch_id': 'Select VSwitch',
  'internet.charge_type': 'Select charge type',
  'internet.bandwidth_mbps': 'Select bandwidth',
  'internet.traffic_package_size': 'Select traffic package size',
  'internet.eip_v4_type': 'Select IPv4 type',
  'billing.mode': 'Select billing mode',
  'billing.period_unit': 'Select period unit',
  'login.provider_key_id': 'Select provider SSH key',
  time_zone: 'Select time zone',
};

const getDependencyMessage = (
  field: MachineCreateCatalogField,
  accountReady: boolean,
  zoneReady: boolean,
) => {
  const dependencies = FIELD_DEPENDENCIES[field];

  for (const dependency of dependencies) {
    if (dependency === 'account_id' && !accountReady) {
      return 'Select provider account first.';
    }
    if (dependency === 'zone_id' && !zoneReady) {
      return 'Select zone first.';
    }
  }

  return undefined;
};

const getFieldEmptyText = (
  field: MachineCreateCatalogField,
  countryCode?: string,
  city?: string,
  zoneId?: string,
) => {
  switch (field) {
    case 'zone.zone_id':
      if (countryCode || city) {
        return `No zones were returned for ${countryCode || '-'} ${city || ''}.`.trim();
      }
      return 'No zone candidates were returned for the current provider account.';
    case 'spec.type':
      return zoneId
        ? `No instance type candidates were returned for zone ${zoneId}.`
        : 'No instance type candidates were returned for the current selection.';
    case 'os.image_id':
      return zoneId
        ? `No image candidates were returned for zone ${zoneId}.`
        : 'No image candidates were returned for the current selection.';
    case 'vpc.vpc_id':
      return zoneId
        ? `No VPC candidates were returned for zone ${zoneId}.`
        : 'No VPC candidates were returned for the current selection.';
    case 'vpc.vswitch_id':
      return zoneId
        ? `No VSwitch candidates were returned for zone ${zoneId}.`
        : 'No VSwitch candidates were returned for the current selection.';
    case 'internet.charge_type':
    case 'internet.bandwidth_mbps':
    case 'internet.traffic_package_size':
    case 'internet.eip_v4_type':
      return zoneId
        ? `No bandwidth candidates were returned for zone ${zoneId}.`
        : 'No bandwidth candidates were returned for the current selection.';
    case 'billing.mode':
    case 'billing.period_unit':
      return 'No billing candidates were returned for the current provider account.';
    case 'login.provider_key_id':
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
  countryCode,
  city,
  zoneId,
  vpcId,
}: UseMachineCreateCatalogsParams) => {
  const [categoryStateMap, setCategoryStateMap] = useState<
    Partial<
      Record<API.AssetMachineCreateCatalogCategory, MachineCreateCatalogState>
    >
  >({});
  const activeRequestKeyRef = useRef<
    Partial<Record<API.AssetMachineCreateCatalogCategory, string>>
  >({});

  const plans = useMemo(
    () => buildCatalogPlans({ accountId, countryCode, city, zoneId, vpcId }),
    [accountId, city, countryCode, vpcId, zoneId],
  );

  const planMap = useMemo(() => {
    const nextMap: Partial<
      Record<API.AssetMachineCreateCatalogCategory, MachineCreateCatalogPlan>
    > = {};

    plans.forEach((item) => {
      nextMap[item.category] = item;
    });

    return nextMap;
  }, [plans]);

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
        const response = await getAssetMachineCreateCatalog(
          accountId,
          plan.category,
          {
            ...plan.params,
            refresh: refresh || undefined,
          },
        );

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
      setCategoryStateMap((current) =>
        Object.keys(current).length ? {} : current,
      );
      return;
    }

    activeRequestKeyRef.current = Object.fromEntries(
      plans.map((item) => [item.category, item.requestKey]),
    );

    setCategoryStateMap((current) => {
      const nextState = { ...current };
      let changed = false;

      Object.keys(nextState).forEach((category) => {
        if (!planMap[category as API.AssetMachineCreateCatalogCategory]) {
          delete nextState[category as API.AssetMachineCreateCatalogCategory];
          changed = true;
        }
      });

      return changed ? nextState : current;
    });

    plans.forEach((plan) => {
      setCategoryStateMap((current) => {
        const currentState = current[plan.category];
        if (
          currentState?.requestKey === plan.requestKey &&
          (currentState.data ||
            currentState.error ||
            currentState.loading ||
            currentState.refreshing)
        ) {
          return current;
        }

        void runPlanRequest(plan, false);
        return current;
      });
    });
  }, [accountId, open, planMap, plans, runPlanRequest]);

  const catalogs = useMemo(() => {
    const nextCatalogs: Partial<
      Record<
        API.AssetMachineCreateCatalogCategory,
        API.AssetMachineCreateCatalog
      >
    > = {};

    plans.forEach((plan) => {
      const currentState = categoryStateMap[plan.category];
      if (currentState?.requestKey === plan.requestKey && currentState.data) {
        nextCatalogs[plan.category] = currentState.data;
      }
    });

    return nextCatalogs;
  }, [categoryStateMap, plans]);

  const fieldMap = useMemo(
    () => buildMachineCreateFieldMap(catalogs),
    [catalogs],
  );
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

  const normalizedCountryCode = trimValue(countryCode);
  const normalizedCity = trimValue(city);
  const normalizedZoneId = trimValue(zoneId);
  const accountReady = !!accountId;
  const zoneReady = !!normalizedZoneId;

  const loadingByCategory = useMemo(() => {
    const nextMap: Partial<
      Record<API.AssetMachineCreateCatalogCategory, boolean>
    > = {};

    plans.forEach((plan) => {
      nextMap[plan.category] =
        categoryStateMap[plan.category]?.loading || false;
    });

    return nextMap;
  }, [categoryStateMap, plans]);

  const refreshingByCategory = useMemo(() => {
    const nextMap: Partial<
      Record<API.AssetMachineCreateCatalogCategory, boolean>
    > = {};

    plans.forEach((plan) => {
      nextMap[plan.category] =
        categoryStateMap[plan.category]?.refreshing || false;
    });

    return nextMap;
  }, [categoryStateMap, plans]);

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
        disabled: !!dependencyMessage,
        loading,
        error,
        placeholder: dependencyMessage || FIELD_PLACEHOLDER_MAP[field],
        emptyText:
          dependencyMessage ||
          error ||
          getFieldEmptyText(
            field,
            normalizedCountryCode,
            normalizedCity,
            normalizedZoneId,
          ),
      };
    },
    [
      accountReady,
      categoryStateMap,
      fieldMap,
      normalizedCity,
      normalizedCountryCode,
      normalizedZoneId,
      planMap,
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
    getFieldGroup: (field: string) =>
      getMachineCreateFieldGroup(fieldMap, field),
    getFieldOptions: (field: string) =>
      getMachineCreateFieldOptions(fieldMap, field),
    getFieldStatus,
    reload,
    getPlan: (category: API.AssetMachineCreateCatalogCategory) =>
      planMap[category],
  };
};

export type MachineCreateCatalogController = ReturnType<
  typeof useMachineCreateCatalogs
>;
