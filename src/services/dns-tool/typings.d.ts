declare namespace API {
  type DnsSyncStatus = 'active' | 'disabled' | 'missing';
  type DnsBindingStatus = 'active' | 'released';
  type DnsAccountStatus = 'active' | 'disabled';

  interface DnsToolProvider {
    id: number;
    name: string;
    tags?: string;
    note?: string;
    officialWebsite?: string | null;
    apiHost?: string | null;
    requestTimeout?: number;
    rateLimitPerMinute?: number;
    createdAt?: string;
    updatedAt?: string;
  }

  interface DnsToolProviderAccount {
    id: number;
    providerCode: string;
    accountName: string;
    tags?: string;
    note?: string;
    configJson?: Record<string, unknown> | null;
    status: DnsAccountStatus;
    lastSyncedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }

  interface DnsToolDomain {
    id: number;
    domainName: string;
    providerCode?: string;
    providerAccountId?: number | null;
    accountName?: string;
    providerAccountName?: string;
    syncStatus: DnsSyncStatus;
    isAvailable: 0 | 1;
    bindingIpCount?: number;
    tags?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  interface DnsToolIpBinding {
    id: number;
    fqdn: string;
    subdomain: string;
    domainId?: number | null;
    domainName?: string;
    providerAccountId?: number | null;
    providerAccountName?: string;
    ipv4: string;
    status: DnsBindingStatus;
    tags?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
  }

  interface DnsToolResolveParams {
    ipv4: string;
    subdomain: string;
    domain: string;
    unique?: boolean;
  }

  interface DnsToolUnbindParams {
    ipv4: string;
    fqdn: string;
  }
}
