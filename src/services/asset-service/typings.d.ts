declare namespace API {
  interface AssetApiResponse<T> {
    code: number;
    message: string;
    data: T;
    request_id?: string;
    timestamp?: number;
    error?: {
      type?: string;
      detail?: string;
    } | null;
  }

  interface AssetPageResult<T> {
    items: T[];
    page: number;
    page_size: number;
    total: number;
  }

  interface AssetProvider {
    id: number;
    code: string;
    name: string;
    type?: string;
    status?: string;
    capabilities?: Record<string, any> | null;
    default_region?: string;
  }

  interface AssetProviderCredentialInput {
    access_key_id?: string;
    access_key_secret?: string;
    access_token?: string;
    api_base_url?: string;
  }

  interface AssetProviderAccount {
    id: number;
    provider_id?: number | null;
    provider_code?: string;
    name: string;
    status?: string;
    has_credential?: boolean;
    credential_masked?: string;
    credential_version?: number;
    last_synced_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  interface AssetMachineSpec {
    cpu_cores?: number;
    memory_mb?: number;
    disk_gb?: number;
    bandwidth_mbps?: number;
    spec?: Record<string, any> | null;
    [key: string]: any;
  }

  interface AssetMachineIpBinding {
    id: number;
    machine_id?: number;
    machine_business_id?: string;
    ip_id?: number;
    ip?: string;
    bind_type?: string;
    is_primary?: boolean;
    status?: string;
    provider_binding_id?: string;
    bound_at?: string | null;
    unbound_at?: string | null;
    [key: string]: any;
  }

  interface AssetMachine {
    id: number;
    machine_id?: string;
    provider_id?: number | null;
    provider_code?: string;
    account_id?: number | null;
    account_name?: string;
    external_instance_id?: string;
    name?: string;
    region?: string;
    zone?: string;
    instance_type?: string;
    image_id?: string;
    billing_type?: string;
    status?: string;
    source?: string;
    sync_status?: string;
    metadata?: Record<string, any> | null;
    spec?: AssetMachineSpec | null;
    ips?: AssetMachineIpBinding[];
    last_synced_at?: string | null;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetIp {
    id: number;
    ip?: string;
    ip_version?: number;
    type?: string;
    source?: string;
    provider_id?: number | null;
    provider_code?: string;
    account_id?: number | null;
    account_name?: string;
    external_ip_id?: string;
    region?: string;
    status?: string;
    ownership?: string;
    metadata?: Record<string, any> | null;
    machine_binding?: AssetMachineIpBinding | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetSshKey {
    id: number;
    name?: string;
    scope?: string;
    provider_id?: number | null;
    provider_code?: string;
    account_id?: number | null;
    account_name?: string;
    external_key_id?: string;
    public_key?: string;
    has_private_key?: boolean;
    fingerprint?: string;
    status?: string;
    created_by?: number;
    metadata?: Record<string, any> | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetOperation {
    id: number;
    operation_type?: string;
    target_type?: string;
    target_id?: string;
    provider_id?: number | null;
    provider_code?: string;
    account_id?: number | null;
    account_name?: string;
    status?: string;
    request?: Record<string, any> | null;
    result?: Record<string, any> | null;
    error_summary?: string;
    created_by?: number | string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetTaskAck {
    task_id: number;
    status?: string;
    task_url?: string;
  }

  interface AssetListParams {
    page?: number;
    page_size?: number;
    provider_code?: string;
    account_id?: number;
    region?: string;
    status?: string;
  }

  interface AssetProviderAccountCreateParams {
    provider_code: string;
    name: string;
    status?: string;
    credential: AssetProviderCredentialInput;
  }

  interface AssetProviderAccountUpdateParams {
    id: number;
    name?: string;
    status?: string;
    credential?: AssetProviderCredentialInput;
  }

  interface AssetMachineCreateManualParams {
    machine_id: string;
    name: string;
    region?: string;
    zone?: string;
    instance_type?: string;
    image_id?: string;
    billing_type?: string;
    status?: string;
    external_instance_id?: string;
    metadata?: Record<string, any>;
    spec?: AssetMachineSpec;
  }

  interface AssetMachineCreateFromProviderParams {
    account_id: number;
    region?: string;
    payload?: Record<string, any>;
  }

  interface AssetMachineUpdateParams {
    id: number;
    name?: string;
    region?: string;
    zone?: string;
    instance_type?: string;
    image_id?: string;
    billing_type?: string;
    status?: string;
    metadata?: Record<string, any>;
    spec?: AssetMachineSpec;
  }

  interface AssetMachineRunCommandParams {
    machine_ids: number[];
    ssh_key_id: number;
    username: string;
    port?: number;
    command: string;
    timeout_seconds?: number;
  }

  interface AssetIpImportManualParams {
    ip: string;
    ip_version?: number;
    type?: string;
    source?: string;
    region?: string;
    status?: string;
    ownership?: string;
    external_ip_id?: string;
    metadata?: Record<string, any>;
  }

  interface AssetIpUpdateParams {
    id: number;
    type?: string;
    region?: string;
    status?: string;
    ownership?: string;
    external_ip_id?: string;
    metadata?: Record<string, any>;
  }

  interface AssetMachineBindIpParams {
    ip_id: number;
    bind_type?: string;
    is_primary?: boolean;
    provider_binding_id?: string;
  }

  interface AssetMachineUnbindIpParams {
    ip_id: number;
  }

  interface AssetMachineSwitchPrimaryIpParams {
    ip_id: number;
  }

  interface AssetSshKeyCreateCustomParams {
    name: string;
    scope?: string;
    public_key: string;
    private_key?: string;
    metadata?: Record<string, any>;
  }

  interface AssetSshKeyImportProviderParams {
    account_id: number;
    name: string;
    external_key_id?: string;
    public_key?: string;
    payload?: Record<string, any>;
  }

  interface AssetSshKeyCreateProviderParams {
    account_id: number;
    name: string;
    external_key_id?: string;
    public_key?: string;
    payload?: Record<string, any>;
  }

  interface AssetSshKeyUpdateParams {
    id: number;
    name?: string;
    scope?: string;
    status?: string;
    public_key?: string;
    metadata?: Record<string, any>;
  }

  interface AssetOperationListParams extends AssetListParams {
    operation_type?: string;
    target_type?: string;
  }
}
