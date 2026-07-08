import { request } from '@umijs/max';

type RawOptionItem =
  | string
  | number
  | {
      label?: unknown;
      value?: unknown;
      name?: unknown;
    };

const normalizeOptionValue = (item: RawOptionItem): string | undefined => {
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item);
  }
  if (!item || typeof item !== 'object') return undefined;
  const value =
    (item as { value?: unknown }).value ?? (item as { name?: unknown }).name;
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return undefined;
};

const normalizeOptions = (
  items?: RawOptionItem[],
): AdsConsole.SelectOption[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item): AdsConsole.SelectOption | null => {
      const value = normalizeOptionValue(item);
      if (!value) return null;
      const labelRaw =
        typeof item === 'object' && item !== null
          ? (item as { label?: unknown }).label
          : undefined;
      const label =
        typeof labelRaw === 'string' || typeof labelRaw === 'number'
          ? String(labelRaw)
          : value;
      return { label, value };
    })
    .filter((item): item is AdsConsole.SelectOption => !!item);
};

export async function getAccountOptions(params?: {
  teamId?: string | number;
  agencyId?: string | number;
  groupId?: string | number;
}) {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>(
    '/ads-api/fb/options/accounts',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getCampaignOptions() {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/campaigns',
    {
      method: 'GET',
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getAdsetOptions() {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/adsets',
    {
      method: 'GET',
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getAdOptions() {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/ads',
    {
      method: 'GET',
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getCreativeOptions() {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/creatives',
    {
      method: 'GET',
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getPageOptions(accountId: string) {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/pages',
    {
      method: 'GET',
      params: { accountId },
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getPixelOptions(accountId: string) {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/pixels',
    {
      method: 'GET',
      params: { accountId },
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getInstagramAccountOptions(accountId: string) {
  const res = await request<AdsConsole.Result<RawOptionItem[]>>(
    '/ads-api/fb/options/instagram-accounts',
    {
      method: 'GET',
      params: { accountId },
    },
  );
  return {
    ...res,
    data: normalizeOptions(res?.data),
  } as AdsConsole.Result<AdsConsole.SelectOption[]>;
}

export async function getTargetEventOptions(params: {
  objectId?: string;
  objectType: string;
  startDate?: string;
  endDate?: string;
  maxCostPerAction?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>(
    '/ads-api/fb/options/events',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getTargetCountryOptions(params: {
  objectId?: string;
  objectType: string;
  startDate?: string;
  endDate?: string;
  minSpend?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.SelectOption[]>>(
    '/ads-api/fb/options/countries',
    {
      method: 'GET',
      params,
    },
  );
}
