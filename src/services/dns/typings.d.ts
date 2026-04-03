declare namespace API {
    
  // ── DNS ──────────────────────────────────────────────────────────────────────

  interface DnsDomain {
    id: number;
    domain: string;
    enabled: boolean;
    provider: string;
    last_synced_at?: string | null;
  }

  interface DnsDomainRecord {
    id: number;
    subdomain: string;
    fqdn: string;
    ipv4: string;
    enabled: boolean;
  }

  interface DnsDomainDetail extends DnsDomain {
    records: DnsDomainRecord[];
  }

  interface DnsRecord {
    id: number;
    domain: string;
    subdomain: string;
    fqdn: string;
    enabled: boolean;
  }

  interface DnsResolveParams {
    ipv4: string;
    subdomain: string;
    domain: string;
    unique: boolean;
  }

  interface DnsResolveResult {
    action: 'created' | 'unchanged' | 'replace';
    ipv4: string;
    subdomain: string;
    domain: string;
    fqdn: string;
    unique: boolean;
    removed_records?: string[];
  }

  interface DnsRecordsByIpResult {
    ipv4: string;
    records: DnsRecord[];
  }

  interface DnsUnbindParams {
    ipv4: string;
    fqdn: string;
  }

  interface DnsUnbindResult {
    ipv4: string;
    fqdn: string;
    action: string;
  }

  interface DnsSyncResult {
    total_remote: number;
    inserted: number;
    updated: number;
  }

  interface DnsResponse<T> {
    code: number;
    msg: string;
    data: T | null;
  }
}
