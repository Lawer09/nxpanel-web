export type AssetResourceKey =
  | 'accounts'
  | 'machines'
  | 'ips'
  | 'ssh-keys'
  | 'scripts';
export type AssetPageKind = AssetResourceKey;

export type SharedFilters = {
  provider_code?: string;
  account_id?: number;
  region?: string;
  status?: string;
  tag_key?: string;
  tag_value?: string;
};

export type AccountFormValues = {
  provider_code: string;
  name: string;
  status?: string;
  access_key_id?: string;
  access_key_secret?: string;
  access_token?: string;
  api_base_url?: string;
  tags?: AssetTagFormValue[];
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
  tags?: AssetTagFormValue[];
};

export type MachineCreateWizardMode = 'create' | 'retry';

export type MachineCreateCatalogField =
  | 'zone.zone_id'
  | 'spec.type'
  | 'os.image_id'
  | 'vpc.vpc_id'
  | 'vpc.vswitch_id'
  | 'internet.charge_type'
  | 'internet.bandwidth_mbps'
  | 'internet.traffic_package_size'
  | 'internet.eip_v4_type'
  | 'billing.mode'
  | 'billing.period_unit'
  | 'login.provider_key_id'
  | 'time_zone';

export type MachineCreateZoneFormValues = {
  country_code?: string;
  city?: string;
  zone_id?: string;
};

export type MachineCreateSpecFormValues = {
  type?: string;
  cpu_cores?: number;
  memory_mb?: number;
};

export type MachineCreateOsFormValues = {
  image_id?: string;
  name?: string;
  version?: string;
};

export type MachineCreateDiskFormValues = {
  system_size_gb?: number;
};

export type MachineCreateVpcFormValues = {
  vpc_id?: string;
  vswitch_id?: string;
  cidr_block_v4?: string;
  cidr_block_v6?: string;
};

export type MachineCreateInternetFormValues = {
  charge_type?: string;
  bandwidth_mbps?: number;
  traffic_package_size?: number;
  eip_v4_type?: string;
};

export type MachineCreateLoginFormValues = {
  auth_type?: 'provider_key' | 'password';
  provider_key_id?: string;
  ssh_key_id?: number;
  username?: string;
  password?: string;
};

export type MachineCreateBillingFormValues = {
  mode?: string;
  period?: number;
  period_unit?: string;
};

export type MachineCreateFormValues = {
  account_id?: number;
  name?: string;
  zone?: MachineCreateZoneFormValues;
  spec?: MachineCreateSpecFormValues;
  os?: MachineCreateOsFormValues;
  disk?: MachineCreateDiskFormValues;
  vpc?: MachineCreateVpcFormValues;
  bandwidth_mbps?: number;
  internet?: MachineCreateInternetFormValues;
  login?: MachineCreateLoginFormValues;
  billing?: MachineCreateBillingFormValues;
  tags?: AssetTagFormValue[];
  time_zone?: string;
  count?: number;
  client_request_id?: string;
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
  tags?: AssetTagFormValue[];
};

export type SshKeyCustomFormValues = {
  name: string;
  scope?: string;
  public_key: string;
  private_key?: string;
  metadata_text?: string;
  tags?: AssetTagFormValue[];
};

export type SshKeyProviderFormValues = {
  account_id: number;
  name: string;
  external_key_id?: string;
  public_key?: string;
  payload_text?: string;
  tags?: AssetTagFormValue[];
};

export type SshKeyEditFormValues = {
  name: string;
  scope?: string;
  status?: string;
  public_key?: string;
  metadata_text?: string;
  tags?: AssetTagFormValue[];
};

export type AssetTagFormValue = {
  key?: string;
  value?: string;
  label?: string;
};

export type MachineScriptFormValues = {
  name: string;
  description?: string;
  content: string;
  status?: string;
  metadata_text?: string;
  tags?: AssetTagFormValue[];
};

export type MachineScriptRunFormValues = {
  machine_ids?: number[];
  timeout_seconds?: number;
  port?: number;
};

export type JumpToResourceHandler = (
  tab: AssetResourceKey,
  accountId?: number,
) => void;

export type TaskAckHandler = (ack: API.AssetTaskAck, title: string) => void;
