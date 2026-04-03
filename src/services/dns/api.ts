
import { request } from '@umijs/max';
// ── DNS ──────────────────────────────────────────────────────────────────────

export function availableDomains() {
  return request<API.DnsResponse<API.DnsDomain[]>>('/dns/domains/available', { method: 'GET' });
}

export function availableDomainsDetail() {
  return request<API.DnsResponse<API.DnsDomainDetail[]>>('/dns/domains/available/detail', {
    method: 'GET',
  });
}

export function unavailableDomains() {
  return request<API.DnsResponse<API.DnsDomain[]>>('/dns/domains/unavailable', { method: 'GET' });
}

export function enableDomain(body: { domain: string }) {
  return request<API.DnsResponse<{ domain: string; enabled: boolean }>>('/dns/domains/enable', {
    method: 'POST',
    data: body,
  });
}

export function disableDomain(body: { domain: string }) {
  return request<API.DnsResponse<{ domain: string; enabled: boolean }>>('/dns/domains/disable', {
    method: 'POST',
    data: body,
  });
}

export function syncDomains() {
  return request<API.DnsResponse<API.DnsSyncResult>>('/dns/domains/sync', { method: 'POST' });
}

export function resolveRecord(body: API.DnsResolveParams) {
  return request<API.DnsResponse<API.DnsResolveResult>>('/dns/records/resolve', {
    method: 'POST',
    data: body,
  });
}

export function recordsByIp(ipv4: string) {
  return request<API.DnsResponse<API.DnsRecordsByIpResult>>('/dns/records/by-ip', {
    method: 'GET',
    params: { ipv4 },
  });
}

export function unbindRecord(body: API.DnsUnbindParams) {
  return request<API.DnsResponse<API.DnsUnbindResult>>('/dns/records/unbind', {
    method: 'POST',
    data: body,
  });
}
