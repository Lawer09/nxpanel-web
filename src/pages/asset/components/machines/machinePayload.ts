import type { MachineCreateFormValues, MachineFormValues } from '../../types';
import {
  cleanupObject,
  normalizeAssetTags,
  parseJsonText,
  stringifyJson,
} from '../../utils';

const asPlainObject = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

const asString = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
};

const asNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const trimString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

const cleanupDeep = <T>(value: T): T | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    const nextValues = value
      .map((item) => cleanupDeep(item))
      .filter((item) => item !== undefined);

    return (nextValues.length ? nextValues : undefined) as T | undefined;
  }

  if (typeof value === 'object') {
    const nextEntries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, cleanupDeep(item)] as const)
      .filter(([, item]) => item !== undefined);

    return (nextEntries.length ? Object.fromEntries(nextEntries) : undefined) as
      | T
      | undefined;
  }

  return value;
};

const normalizeCountryCode = (value?: string) =>
  trimString(value)?.toUpperCase();

const normalizeLegacyCreateRequest = (
  request: Record<string, any>,
  machine?: API.AssetMachine | null,
) => {
  const payload = asPlainObject(request.payload) || {};
  const metadata = asPlainObject(request.metadata) || machine?.metadata || {};

  return {
    account_id: request.account_id ?? machine?.account_id,
    name:
      asString(request.name) ||
      asString(request.name_template) ||
      asString(payload.instanceName) ||
      machine?.name,
    zone: {
      country_code:
        asString(request.country_code) || asString(metadata.country_code),
      city: asString(request.city) || asString(metadata.city),
      zone_id:
        asString(request.zone) || asString(payload.zoneId) || machine?.zone,
    },
    spec: {
      type:
        asString(request.instance_type) ||
        asString(payload.instanceType) ||
        machine?.instance_type,
      cpu_cores: asNumber(machine?.spec?.cpu_cores),
      memory_mb: asNumber(machine?.spec?.memory_mb),
    },
    os: {
      image_id:
        asString(request.image_id) ||
        asString(payload.imageId) ||
        machine?.image_id,
    },
    disk: {
      system_size_gb: asNumber(machine?.spec?.disk_gb),
    },
    vpc: {
      vpc_id: asString(metadata.provider_network?.vpcId),
    },
    bandwidth_mbps: asNumber(payload.bandwidth),
    internet: {
      charge_type: asString(payload.internetChargeType),
      bandwidth_mbps: asNumber(payload.bandwidth),
      traffic_package_size: asNumber(payload.trafficPackageSize),
      eip_v4_type: asString(payload.eipV4Type),
    },
    login: {
      auth_type: asString(payload.keyId) ? 'provider_key' : 'password',
      provider_key_id: asString(payload.keyId),
      username: asString(request.username) || 'root',
    },
    tags: machine?.tags || [],
    time_zone:
      asString(request.time_zone) ||
      asString(payload.timeZone) ||
      asString(payload.timezone),
    billing: {
      mode: asString(request.billing_type) || machine?.billing_type,
    },
    count: asNumber(request.count) || 1,
    client_request_id:
      asString(request.client_request_id) || machine?.client_request_id,
    metadata,
  };
};

const buildMachineSpecPayload = (
  values: Pick<
    MachineFormValues,
    'cpu_cores' | 'memory_mb' | 'disk_gb' | 'bandwidth_mbps' | 'spec_text'
  >,
) => {
  const specJson = parseJsonText(values.spec_text, 'Spec JSON');
  const baseSpec = typeof specJson === 'object' && specJson ? specJson : {};
  return cleanupObject({
    ...baseSpec,
    cpu_cores: values.cpu_cores,
    memory_mb: values.memory_mb,
    disk_gb: values.disk_gb,
    bandwidth_mbps: values.bandwidth_mbps,
  });
};

export const buildMachinePayload = (values: MachineFormValues) => {
  const metadata = parseJsonText(values.metadata_text, 'Metadata');
  const spec = buildMachineSpecPayload(values);
  return cleanupObject({
    machine_id: values.machine_id?.trim(),
    name: values.name.trim(),
    region: values.region?.trim(),
    zone: values.zone?.trim(),
    instance_type: values.instance_type?.trim(),
    image_id: values.image_id?.trim(),
    billing_type: values.billing_type?.trim(),
    status: values.status?.trim(),
    external_instance_id: values.external_instance_id?.trim(),
    metadata,
    tags: normalizeAssetTags(values.tags),
    spec: Object.keys(spec).length ? spec : undefined,
  });
};

export const buildMachineCreateRequest = (
  values: MachineCreateFormValues,
): API.AssetMachineCreateFromProviderParams =>
  cleanupDeep({
    account_id: values.account_id,
    name: trimString(values.name),
    zone: {
      country_code: normalizeCountryCode(values.zone?.country_code),
      city: trimString(values.zone?.city),
      zone_id: trimString(values.zone?.zone_id),
    },
    spec: {
      type: trimString(values.spec?.type),
      cpu_cores: values.spec?.cpu_cores,
      memory_mb: values.spec?.memory_mb,
    },
    os: {
      image_id: trimString(values.os?.image_id),
      name: trimString(values.os?.name),
      version: trimString(values.os?.version),
    },
    disk: {
      system_size_gb: values.disk?.system_size_gb,
    },
    vpc: {
      vpc_id: trimString(values.vpc?.vpc_id),
      vswitch_id: trimString(values.vpc?.vswitch_id),
      cidr_block_v4: trimString(values.vpc?.cidr_block_v4),
      cidr_block_v6: trimString(values.vpc?.cidr_block_v6),
    },
    bandwidth_mbps: asNumber(
      values.internet?.bandwidth_mbps ?? values.bandwidth_mbps,
    ),
    internet: {
      charge_type: trimString(values.internet?.charge_type),
      bandwidth_mbps: asNumber(values.internet?.bandwidth_mbps),
      traffic_package_size: asNumber(values.internet?.traffic_package_size),
      eip_v4_type: trimString(values.internet?.eip_v4_type),
    },
    login: {
      auth_type: trimString(values.login?.auth_type),
      provider_key_id: trimString(values.login?.provider_key_id),
      ssh_key_id: values.login?.ssh_key_id,
      username: trimString(values.login?.username),
      password: trimString(values.login?.password),
    },
    tags: normalizeAssetTags(values.tags),
    time_zone: trimString(values.time_zone),
    billing: {
      mode: trimString(values.billing?.mode),
      period: values.billing?.period,
      period_unit: trimString(values.billing?.period_unit),
    },
    count: values.count,
    client_request_id: trimString(values.client_request_id),
    metadata: parseJsonText(values.metadata_text, 'Metadata JSON'),
  }) as API.AssetMachineCreateFromProviderParams;

export const buildMachineRetryRequest = (
  values: MachineCreateFormValues,
): API.AssetMachineRetryProviderCreateParams => {
  const {
    account_id: _accountId,
    count: _count,
    client_request_id: _clientRequestId,
    ...payload
  } = buildMachineCreateRequest(values);

  return cleanupDeep(payload) as API.AssetMachineRetryProviderCreateParams;
};

export const normalizeCreateRequestToFormValues = (
  createRequest: Record<string, any> | null | undefined,
  machine?: API.AssetMachine | null,
): MachineCreateFormValues => {
  const request = asPlainObject(createRequest) || {};
  const normalized =
    request.zone || request.spec || request.os || request.vpc || request.login
      ? request
      : normalizeLegacyCreateRequest(request, machine);

  const zone = asPlainObject(normalized.zone);
  const spec = asPlainObject(normalized.spec);
  const os = asPlainObject(normalized.os);
  const disk = asPlainObject(normalized.disk);
  const vpc = asPlainObject(normalized.vpc);
  const internet = asPlainObject(normalized.internet);
  const login = asPlainObject(normalized.login);
  const billing = asPlainObject(normalized.billing);
  const metadata =
    asPlainObject(normalized.metadata) || machine?.metadata || undefined;
  const normalizedRecord = normalized as Record<string, any>;

  return cleanupDeep({
    account_id: normalizedRecord.account_id ?? machine?.account_id,
    name: asString(normalizedRecord.name) || machine?.name,
    zone: {
      country_code:
        normalizeCountryCode(asString(zone?.country_code)) ||
        normalizeCountryCode(asString(metadata?.country_code)),
      city: asString(zone?.city) || asString(metadata?.city),
      zone_id: asString(zone?.zone_id) || machine?.zone,
    },
    spec: {
      type: asString(spec?.type) || machine?.instance_type,
      cpu_cores:
        asNumber(spec?.cpu_cores) || asNumber(machine?.spec?.cpu_cores),
      memory_mb:
        asNumber(spec?.memory_mb) || asNumber(machine?.spec?.memory_mb),
    },
    os: {
      image_id: asString(os?.image_id) || machine?.image_id,
      name: asString(os?.name),
      version: asString(os?.version),
    },
    disk: {
      system_size_gb:
        asNumber(disk?.system_size_gb) || asNumber(machine?.spec?.disk_gb),
    },
    vpc: {
      vpc_id: asString(vpc?.vpc_id),
      vswitch_id: asString(vpc?.vswitch_id),
      cidr_block_v4: asString(vpc?.cidr_block_v4),
      cidr_block_v6: asString(vpc?.cidr_block_v6),
    },
    bandwidth_mbps:
      asNumber(normalizedRecord.bandwidth_mbps) ||
      asNumber(internet?.bandwidth_mbps),
    internet: {
      charge_type: asString(internet?.charge_type),
      bandwidth_mbps:
        asNumber(internet?.bandwidth_mbps) ||
        asNumber(normalizedRecord.bandwidth_mbps),
      traffic_package_size: asNumber(internet?.traffic_package_size),
      eip_v4_type: asString(internet?.eip_v4_type),
    },
    login: {
      auth_type:
        (asString(login?.auth_type) as
          | 'provider_key'
          | 'password'
          | undefined) || undefined,
      provider_key_id: asString(login?.provider_key_id),
      ssh_key_id: asNumber(login?.ssh_key_id),
      username: asString(login?.username),
    },
    billing: {
      mode: asString(billing?.mode) || machine?.billing_type,
      period: asNumber(billing?.period),
      period_unit: asString(billing?.period_unit),
    },
    tags: Array.isArray(normalizedRecord.tags)
      ? normalizedRecord.tags
      : machine?.tags,
    time_zone: asString(normalizedRecord.time_zone),
    count: asNumber(normalizedRecord.count) || 1,
    client_request_id:
      asString(normalizedRecord.client_request_id) ||
      machine?.client_request_id,
    metadata_text: stringifyJson(metadata),
  }) as MachineCreateFormValues;
};
