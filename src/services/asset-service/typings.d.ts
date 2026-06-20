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

  type AssetMachineCreateCatalogCategory =
    | 'regions'
    | 'zones'
    | 'instance-types'
    | 'billing-options'
    | 'images'
    | 'storage-options'
    | 'network-options'
    | 'ip-options'
    | 'ssh-keys'
    | 'timezones';

  interface AssetMachineCreateCatalogQuery {
    region?: string;
    zone?: string;
    vpc_id?: string;
    refresh?: boolean;
  }

  interface AssetMachineCreateCatalogOptionExtra {
    label?: string;
    selectable?: boolean;
    reason?: string;
    raw?: Record<string, any> | null;
    cached?: boolean;
    stale?: boolean;
    [key: string]: any;
  }

  interface AssetMachineCreateCatalogOption {
    id: string;
    value: string | number | boolean;
    extra?: AssetMachineCreateCatalogOptionExtra | null;
  }

  interface AssetMachineCreateCatalogOptionGroup {
    field: string;
    depends_on?: string[];
    options?: AssetMachineCreateCatalogOption[];
    extra?: Record<string, any> | null;
  }

  interface AssetMachineCreateCatalog {
    account_id: number;
    provider_code?: string;
    category: AssetMachineCreateCatalogCategory;
    region?: string;
    zone?: string;
    vpc_id?: string;
    refresh?: boolean;
    cache_ttl_seconds?: number;
    min_refresh_age_seconds?: number;
    option_groups?: AssetMachineCreateCatalogOptionGroup[];
  }

  interface AssetMachineCreatePriceQuote {
    account_id: number;
    provider_code?: string;
    currency?: string;
    total_price?: number;
    breakdown?: Record<string, any> | null;
    provider_raw?: Record<string, any> | null;
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
    client_request_id?: string;
    create_task_id?: number;
    create_request_json?: Record<string, any> | null;
    create_attempt?: number;
    last_error_summary?: string;
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
    machines?: AssetMachine[];
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

  interface AssetMachineCreateBilling {
    type: string;
    period?: number;
    period_unit?: string;
    auto_renew?: boolean;
    internet_charge_type?: string;
    traffic_package_size?: number;
    extra?: Record<string, any> | null;
  }

  interface AssetMachineCreateDisk {
    category?: string;
    size_gb: number;
    extra?: Record<string, any> | null;
  }

  interface AssetMachineCreateStorage {
    system_disk: AssetMachineCreateDisk;
    data_disks?: AssetMachineCreateDisk[];
  }

  interface AssetMachineCreateNetwork {
    vpc_id?: string;
    subnet_id: string;
    security_group_id?: string;
    nic_network_type?: string;
    lan_ip?: string;
    enable_agent?: boolean;
    enable_ip_forward?: boolean;
    resource_group_id?: string;
  }

  interface AssetMachineCreateIpAssignment {
    mode?: string;
    ip_ids?: number[];
    quantity?: number;
    bandwidth_mbps?: number;
    internet_charge_type?: string;
    traffic_package_size?: number;
    eip_bind_type?: string;
    eip_v4_type?: string;
    cluster_id?: string;
  }

  interface AssetMachineCreateSshKey {
    provider_key_id?: string;
    password?: string;
  }

  interface AssetMachineCreateFromProviderParams {
    account_id: number;
    region: string;
    zone: string;
    instance_type: string;
    image_id: string;
    billing: AssetMachineCreateBilling;
    storage: AssetMachineCreateStorage;
    network: AssetMachineCreateNetwork;
    ip_assignment?: AssetMachineCreateIpAssignment;
    ssh_key?: AssetMachineCreateSshKey;
    time_zone?: string;
    count?: number;
    machine_id_template?: string;
    name_template?: string;
    init_command_template?: string;
    metadata?: Record<string, any>;
    client_request_id?: string;
  }

  interface AssetMachineRetryProviderCreateParams {
    region?: string;
    zone?: string;
    instance_type?: string;
    image_id?: string;
    billing?: AssetMachineCreateBilling;
    storage?: AssetMachineCreateStorage;
    network?: AssetMachineCreateNetwork;
    ip_assignment?: AssetMachineCreateIpAssignment;
    ssh_key?: AssetMachineCreateSshKey;
    time_zone?: string;
    name_template?: string;
    init_command_template?: string;
    metadata?: Record<string, any>;
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

  interface AssetOperationListParams extends AssetListParams {}
}
