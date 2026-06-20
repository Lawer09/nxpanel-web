import type {
  MachineCreateBillingFormValues,
  MachineCreateDiskFormValues,
  MachineCreateFormValues,
  MachineCreateIpAssignmentFormValues,
  MachineCreateNetworkFormValues,
  MachineCreateSshKeyFormValues,
  MachineFormValues,
} from '../../types';
import { cleanupObject, parseJsonText, stringifyJson } from '../../utils';

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

const asBoolean = (value: unknown) =>
  typeof value === 'boolean' ? value : undefined;

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

    return (nextEntries.length
      ? Object.fromEntries(nextEntries)
      : undefined) as T | undefined;
  }

  return value;
};

const parseOptionalJsonText = (value: string | undefined, fieldName: string) =>
  parseJsonText(value, fieldName) as Record<string, any> | undefined;

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

const buildBillingPayload = (
  billing?: MachineCreateBillingFormValues,
): API.AssetMachineCreateBilling | undefined =>
  cleanupDeep({
    type: trimString(billing?.type),
    period: billing?.period,
    period_unit: trimString(billing?.period_unit),
    auto_renew: billing?.auto_renew,
    internet_charge_type: trimString(billing?.internet_charge_type),
    traffic_package_size: billing?.traffic_package_size,
    extra: parseOptionalJsonText(billing?.extra_text, 'Billing extra JSON'),
  }) as API.AssetMachineCreateBilling | undefined;

const buildDiskPayload = (
  disk: MachineCreateDiskFormValues | undefined,
  fieldName: string,
): API.AssetMachineCreateDisk | undefined =>
  cleanupDeep({
    category: trimString(disk?.category),
    size_gb: disk?.size_gb,
    extra: parseOptionalJsonText(disk?.extra_text, fieldName),
  }) as API.AssetMachineCreateDisk | undefined;

const buildStoragePayload = (
  storage: MachineCreateFormValues['storage'],
): API.AssetMachineCreateStorage | undefined => {
  const systemDisk = buildDiskPayload(
    storage?.system_disk,
    'System disk extra JSON',
  );
  const dataDisks = storage?.data_disks
    ?.map((item, index) =>
      buildDiskPayload(item, `Data disk #${index + 1} extra JSON`),
    )
    .filter(Boolean) as API.AssetMachineCreateDisk[] | undefined;

  return cleanupDeep({
    system_disk: systemDisk,
    data_disks: dataDisks,
  }) as API.AssetMachineCreateStorage | undefined;
};

const buildNetworkPayload = (
  network?: MachineCreateNetworkFormValues,
): API.AssetMachineCreateNetwork | undefined =>
  cleanupDeep({
    vpc_id: trimString(network?.vpc_id),
    subnet_id: trimString(network?.subnet_id),
    security_group_id: trimString(network?.security_group_id),
    nic_network_type: trimString(network?.nic_network_type),
    lan_ip: trimString(network?.lan_ip),
    enable_agent: network?.enable_agent,
    enable_ip_forward: network?.enable_ip_forward,
    resource_group_id: trimString(network?.resource_group_id),
  }) as API.AssetMachineCreateNetwork | undefined;

const buildIpAssignmentPayload = (
  ipAssignment?: MachineCreateIpAssignmentFormValues,
): API.AssetMachineCreateIpAssignment | undefined =>
  cleanupDeep({
    mode: trimString(ipAssignment?.mode),
    ip_ids: ipAssignment?.ip_ids,
    quantity: ipAssignment?.quantity,
    bandwidth_mbps: ipAssignment?.bandwidth_mbps,
    internet_charge_type: trimString(ipAssignment?.internet_charge_type),
    traffic_package_size: ipAssignment?.traffic_package_size,
    eip_bind_type: trimString(ipAssignment?.eip_bind_type),
    eip_v4_type: trimString(ipAssignment?.eip_v4_type),
    cluster_id: trimString(ipAssignment?.cluster_id),
  }) as API.AssetMachineCreateIpAssignment | undefined;

const buildSshKeyPayload = (
  sshKey?: MachineCreateSshKeyFormValues,
): API.AssetMachineCreateSshKey | undefined =>
  cleanupDeep({
    provider_key_id: trimString(sshKey?.provider_key_id),
    password: trimString(sshKey?.password),
  }) as API.AssetMachineCreateSshKey | undefined;

const readMetadataVpcId = (metadata: Record<string, any> | undefined) => {
  const providerNetwork = asPlainObject(metadata?.provider_network);
  return asString(providerNetwork?.vpcId || providerNetwork?.vpc_id);
};

const normalizeLegacyCreateRequest = (
  request: Record<string, any>,
  machine?: API.AssetMachine | null,
) => {
  const payload = asPlainObject(request.payload) || {};
  const metadata = asPlainObject(request.metadata) || machine?.metadata || {};

  return {
    account_id: request.account_id ?? machine?.account_id,
    region: asString(request.region) || machine?.region,
    zone: asString(request.zone) || asString(payload.zoneId) || machine?.zone,
    instance_type:
      asString(request.instance_type) ||
      asString(payload.instanceType) ||
      machine?.instance_type,
    image_id:
      asString(request.image_id) ||
      asString(payload.imageId) ||
      machine?.image_id,
    count:
      asNumber(request.count) ||
      asNumber(payload.instanceCount) ||
      asNumber(payload.count) ||
      1,
    machine_id_template: asString(request.machine_id_template),
    name_template: asString(request.name_template) || asString(payload.instanceName),
    billing: {
      type: asString(request.billing_type) || machine?.billing_type,
      internet_charge_type: asString(payload.internetChargeType),
    },
    storage: {
      system_disk: {
        size_gb: machine?.spec?.disk_gb,
      },
    },
    network: {
      vpc_id: readMetadataVpcId(metadata),
      subnet_id: asString(payload.subnetId),
      security_group_id: asString(payload.securityGroupId),
    },
    ip_assignment: {
      mode: payload.publicIpAssigned === false ? 'provider_existing' : 'provider_auto',
      bandwidth_mbps: asNumber(payload.bandwidth),
      internet_charge_type: asString(payload.internetChargeType),
    },
    ssh_key: {
      provider_key_id: asString(payload.keyId),
    },
    time_zone:
      asString(request.time_zone) ||
      asString(payload.timeZone) ||
      asString(payload.timezone),
    init_command_template:
      asString(request.init_command_template) || asString(payload.userData),
    metadata,
    client_request_id: asString(request.client_request_id) || machine?.client_request_id,
  };
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
    spec: Object.keys(spec).length ? spec : undefined,
  });
};

export const buildMachineCreateRequest = (
  values: MachineCreateFormValues,
): API.AssetMachineCreateFromProviderParams =>
  cleanupDeep({
    account_id: values.account_id,
    region: trimString(values.region),
    zone: trimString(values.zone),
    instance_type: trimString(values.instance_type),
    image_id: trimString(values.image_id),
    billing: buildBillingPayload(values.billing),
    storage: buildStoragePayload(values.storage),
    network: buildNetworkPayload(values.network),
    ip_assignment: buildIpAssignmentPayload(values.ip_assignment),
    ssh_key: buildSshKeyPayload(values.ssh_key),
    time_zone: trimString(values.time_zone),
    count: values.count,
    machine_id_template: trimString(values.machine_id_template),
    name_template: trimString(values.name_template),
    init_command_template: trimString(values.init_command_template),
    metadata: parseOptionalJsonText(values.metadata_text, 'Metadata JSON'),
    client_request_id: trimString(values.client_request_id),
  }) as API.AssetMachineCreateFromProviderParams;

export const buildMachineRetryRequest = (
  values: MachineCreateFormValues,
): API.AssetMachineRetryProviderCreateParams => {
  const {
    account_id: _accountId,
    count: _count,
    machine_id_template: _machineIdTemplate,
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
    request.payload && !request.billing && !request.storage && !request.network
      ? normalizeLegacyCreateRequest(request, machine)
      : request;

  const billing = asPlainObject(normalized.billing);
  const storage = asPlainObject(normalized.storage);
  const systemDisk = asPlainObject(storage?.system_disk);
  const dataDisks = Array.isArray(storage?.data_disks)
    ? storage?.data_disks.map((item) => asPlainObject(item)).filter(Boolean)
    : [];
  const network = asPlainObject(normalized.network);
  const ipAssignment = asPlainObject(normalized.ip_assignment);
  const sshKey = asPlainObject(normalized.ssh_key);
  const metadata =
    asPlainObject(normalized.metadata) || machine?.metadata || undefined;
  const normalizedRecord = normalized as Record<string, any>;

  return cleanupDeep({
    account_id: normalizedRecord.account_id ?? machine?.account_id,
    region: asString(normalizedRecord.region) || machine?.region,
    zone: asString(normalizedRecord.zone) || machine?.zone,
    instance_type:
      asString(normalizedRecord.instance_type) || machine?.instance_type,
    image_id: asString(normalizedRecord.image_id) || machine?.image_id,
    count: asNumber(normalizedRecord.count) || 1,
    machine_id_template: asString(normalizedRecord.machine_id_template),
    name_template: asString(normalizedRecord.name_template),
    client_request_id:
      asString(normalizedRecord.client_request_id) || machine?.client_request_id,
    billing: cleanupDeep({
      type: asString(billing?.type) || machine?.billing_type,
      period: asNumber(billing?.period),
      period_unit: asString(billing?.period_unit),
      auto_renew: asBoolean(billing?.auto_renew),
      internet_charge_type: asString(billing?.internet_charge_type),
      traffic_package_size: asNumber(billing?.traffic_package_size),
      extra_text: stringifyJson(billing?.extra),
    }),
    storage: cleanupDeep({
      system_disk: {
        category: asString(systemDisk?.category),
        size_gb: asNumber(systemDisk?.size_gb) || machine?.spec?.disk_gb,
        extra_text: stringifyJson(systemDisk?.extra),
      },
      data_disks: dataDisks.map((item) => ({
        category: asString(item?.category),
        size_gb: asNumber(item?.size_gb),
        extra_text: stringifyJson(item?.extra),
      })),
    }),
    network: cleanupDeep({
      vpc_id: asString(network?.vpc_id) || readMetadataVpcId(metadata),
      subnet_id: asString(network?.subnet_id),
      security_group_id: asString(network?.security_group_id),
      nic_network_type: asString(network?.nic_network_type),
      lan_ip: asString(network?.lan_ip),
      enable_agent: asBoolean(network?.enable_agent),
      enable_ip_forward: asBoolean(network?.enable_ip_forward),
      resource_group_id: asString(network?.resource_group_id),
    }),
    ip_assignment: cleanupDeep({
      mode: asString(ipAssignment?.mode),
      ip_ids: Array.isArray(ipAssignment?.ip_ids)
        ? ipAssignment.ip_ids
            .map((item) => asNumber(item))
            .filter((item): item is number => item !== undefined)
        : undefined,
      quantity: asNumber(ipAssignment?.quantity),
      bandwidth_mbps: asNumber(ipAssignment?.bandwidth_mbps),
      internet_charge_type: asString(ipAssignment?.internet_charge_type),
      traffic_package_size: asNumber(ipAssignment?.traffic_package_size),
      eip_bind_type: asString(ipAssignment?.eip_bind_type),
      eip_v4_type: asString(ipAssignment?.eip_v4_type),
      cluster_id: asString(ipAssignment?.cluster_id),
    }),
    ssh_key: cleanupDeep({
      provider_key_id: asString(sshKey?.provider_key_id),
      password: asString(sshKey?.password),
    }),
    time_zone: asString(normalizedRecord.time_zone),
    init_command_template: asString(normalizedRecord.init_command_template),
    metadata_text: stringifyJson(metadata),
  }) as MachineCreateFormValues;
};
