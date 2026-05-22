import { request } from '@umijs/max';

export async function getDnsProviders(params?: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  return request<API.ApiResponse<API.PageResult<API.DnsToolProvider>>>(
    '/v3/dns/providers',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getDnsProviderDetail(id: number) {
  return request<API.ApiResponse<API.DnsToolProvider>>('/v3/dns/providers/detail', {
    method: 'GET',
    params: { id },
  });
}

export async function createDnsProvider(data: Partial<API.DnsToolProvider>) {
  return request<API.ApiResponse<boolean>>('/v3/dns/providers/create', {
    method: 'POST',
    data,
  });
}

export async function updateDnsProvider(data: Partial<API.DnsToolProvider> & { id: number }) {
  return request<API.ApiResponse<boolean>>('/v3/dns/providers/update', {
    method: 'POST',
    data,
  });
}

export async function getDnsProviderAccounts(params?: {
  keyword?: string;
  providerCode?: string;
  status?: API.DnsAccountStatus;
  page?: number;
  pageSize?: number;
}) {
  return request<API.ApiResponse<API.PageResult<API.DnsToolProviderAccount>>>(
    '/v3/dns/provider-accounts',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getDnsProviderAccountDetail(id: number) {
  return request<API.ApiResponse<API.DnsToolProviderAccount>>(
    '/v3/dns/provider-accounts/detail',
    {
      method: 'GET',
      params: { id },
    },
  );
}

export async function createDnsProviderAccount(
  data: Partial<API.DnsToolProviderAccount> & {
    providerCode: string;
    accountName: string;
  },
) {
  return request<API.ApiResponse<boolean>>('/v3/dns/provider-accounts/create', {
    method: 'POST',
    data,
  });
}

export async function updateDnsProviderAccount(
  data: Partial<API.DnsToolProviderAccount> & { id: number },
) {
  return request<API.ApiResponse<boolean>>('/v3/dns/provider-accounts/update', {
    method: 'POST',
    data,
  });
}

export async function getDnsDomains(params?: {
  keyword?: string;
  providerCode?: string;
  providerAccountId?: number;
  syncStatus?: API.DnsSyncStatus;
  isAvailable?: 0 | 1;
  page?: number;
  pageSize?: number;
}) {
  return request<API.ApiResponse<API.PageResult<API.DnsToolDomain>>>('/v3/dns/domains', {
    method: 'GET',
    params,
  });
}

export async function syncDnsDomains(params?: { providerAccountId?: number }) {
  return request<API.ApiResponse<boolean>>('/v3/dns/domains/sync', {
    method: 'GET',
    params,
  });
}

export async function updateDnsDomainMeta(data: {
  id: number;
  tags?: string;
  note?: string;
}) {
  return request<API.ApiResponse<boolean>>('/v3/dns/domains/update-meta', {
    method: 'POST',
    data,
  });
}

export async function getDnsIpBindings(params?: {
  keyword?: string;
  status?: API.DnsBindingStatus;
  ipv4?: string;
  providerAccountId?: number;
  domainId?: number;
  page?: number;
  pageSize?: number;
}) {
  return request<API.ApiResponse<API.PageResult<API.DnsToolIpBinding>>>(
    '/v3/dns/ip-bindings',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getDnsRecordsByIp(params: {
  ipv4: string;
  status?: API.DnsBindingStatus;
}) {
  return request<API.ApiResponse<API.DnsToolIpBinding[]>>('/v3/dns/records/by-ip', {
    method: 'GET',
    params,
  });
}

export async function updateDnsIpBindingMeta(data: {
  id: number;
  tags?: string;
  note?: string;
}) {
  return request<API.ApiResponse<boolean>>('/v3/dns/ip-bindings/update-meta', {
    method: 'POST',
    data,
  });
}

export async function resolveDnsRecord(data: API.DnsToolResolveParams) {
  return request<API.ApiResponse<any>>('/v3/dns/records/resolve', {
    method: 'POST',
    data,
  });
}

export async function unbindDnsRecord(data: API.DnsToolUnbindParams) {
  return request<API.ApiResponse<any>>('/v3/dns/records/unbind', {
    method: 'POST',
    data,
  });
}
