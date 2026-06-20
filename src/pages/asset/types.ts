export type AssetResourceKey = 'accounts' | 'machines' | 'ips' | 'ssh-keys';
export type AssetPageKind = AssetResourceKey;

export type SharedFilters = {
  provider_code?: string;
  account_id?: number;
  region?: string;
  status?: string;
};

export type AccountFormValues = {
  provider_code: string;
  name: string;
  status?: string;
  access_key_id?: string;
  access_key_secret?: string;
  access_token?: string;
  api_base_url?: string;
};

export type MachineFormValues = {
  machine_id?: string;
  name: string;
  region?: string;
  zone?: string;
  instance_type?: string;
  image_id?: string;
  billing_type?: string;
  status?: string;
  external_instance_id?: string;
  metadata_text?: string;
  cpu_cores?: number;
  memory_mb?: number;
  disk_gb?: number;
  bandwidth_mbps?: number;
  spec_text?: string;
};

export type MachineCreateWizardMode = 'create' | 'retry';

export type MachineCreateCatalogField =
  | 'region'
  | 'zone'
  | 'instance_type'
  | 'billing.type'
  | 'billing.period_unit'
  | 'billing.internet_charge_type'
  | 'image_id'
  | 'storage.system_disk.category'
  | 'storage.data_disks.category'
  | 'network.vpc_id'
  | 'network.subnet_id'
  | 'network.security_group_id'
  | 'ip_assignment.mode'
  | 'ip_assignment.ip_ids'
  | 'ssh_key.provider_key_id'
  | 'time_zone';

export type MachineCreateDiskFormValues = {
  category?: string;
  size_gb?: number;
  extra_text?: string;
};

export type MachineCreateBillingFormValues = {
  type?: string;
  period?: number;
  period_unit?: string;
  auto_renew?: boolean;
  internet_charge_type?: string;
  traffic_package_size?: number;
  extra_text?: string;
};

export type MachineCreateNetworkFormValues = {
  vpc_id?: string;
  subnet_id?: string;
  security_group_id?: string;
  nic_network_type?: string;
  lan_ip?: string;
  enable_agent?: boolean;
  enable_ip_forward?: boolean;
  resource_group_id?: string;
};

export type MachineCreateIpAssignmentFormValues = {
  mode?: string;
  ip_ids?: number[];
  quantity?: number;
  bandwidth_mbps?: number;
  internet_charge_type?: string;
  traffic_package_size?: number;
  eip_bind_type?: string;
  eip_v4_type?: string;
  cluster_id?: string;
};

export type MachineCreateSshKeyFormValues = {
  provider_key_id?: string;
  password?: string;
};

export type MachineCreateFormValues = {
  account_id?: number;
  region?: string;
  zone?: string;
  instance_type?: string;
  image_id?: string;
  count?: number;
  machine_id_template?: string;
  name_template?: string;
  client_request_id?: string;
  billing?: MachineCreateBillingFormValues;
  storage?: {
    system_disk?: MachineCreateDiskFormValues;
    data_disks?: MachineCreateDiskFormValues[];
  };
  network?: MachineCreateNetworkFormValues;
  ip_assignment?: MachineCreateIpAssignmentFormValues;
  ssh_key?: MachineCreateSshKeyFormValues;
  time_zone?: string;
  init_command_template?: string;
  metadata_text?: string;
};

export type MachineCommandFormValues = {
  ssh_key_id: number;
  username: string;
  port?: number;
  command: string;
  timeout_seconds?: number;
  confirmed?: boolean;
};

export type IpFormValues = {
  ip?: string;
  ip_version?: number;
  type?: string;
  source?: string;
  region?: string;
  status?: string;
  ownership?: string;
  external_ip_id?: string;
  metadata_text?: string;
};

export type SshKeyCustomFormValues = {
  name: string;
  public_key: string;
  private_key?: string;
  metadata_text?: string;
};

export type SshKeyProviderFormValues = {
  account_id: number;
  name: string;
  external_key_id?: string;
  public_key?: string;
  payload_text?: string;
};

export type SshKeyEditFormValues = {
  name: string;
  scope?: string;
  status?: string;
  public_key?: string;
  metadata_text?: string;
};

export type JumpToResourceHandler = (
  tab: AssetResourceKey,
  accountId?: number,
) => void;

export type TaskAckHandler = (ack: API.AssetTaskAck, title: string) => void;
