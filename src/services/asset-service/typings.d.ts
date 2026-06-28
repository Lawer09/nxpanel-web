declare namespace API {
  interface AssetTagItem {
    key: string;
    value: string;
    label?: string;
  }

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
    tags?: AssetTagItem[];
    last_synced_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  type AssetMachineCreateCatalogCategory =
    | 'zones'
    | 'instance-types'
    | 'os-images'
    | 'vpcs'
    | 'bandwidth-options'
    | 'tag-options'
    | 'billing-options'
    | 'ssh-keys'
    | 'timezones';

  interface AssetMachineCreateCatalogQuery {
    zone_id?: string;
    country_code?: string;
    city?: string;
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
    country_code?: string;
    city?: string;
    zone_id?: string;
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
    tags?: AssetTagItem[];
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
    tags?: AssetTagItem[];
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
    tags?: AssetTagItem[];
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetIpPullRun {
    id: number;
    account_id?: number | null;
    account_name?: string;
    provider_id?: number | null;
    provider_code?: string;
    region?: string;
    status_filter?: string;
    task_id?: number;
    status?: string;
    page?: number;
    page_size?: number;
    page_count?: number;
    cached?: boolean;
    total_count?: number;
    pulled_count?: number;
    imported_count?: number;
    error_summary?: string;
    request?: Record<string, any> | null;
    expires_at?: string | null;
    created_by?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetIpPullItem {
    id: number;
    pull_run_id?: number;
    provider_id?: number | null;
    provider_code?: string;
    account_id?: number | null;
    account_name?: string;
    external_ip_id?: string;
    ip?: string;
    ip_version?: number;
    type?: string;
    region?: string;
    status?: string;
    ownership?: string;
    provider_binding_id?: string;
    raw?: Record<string, any> | null;
    import_status?: string;
    imported?: boolean;
    imported_ip_id?: number | null;
    error_summary?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface AssetMachineScript {
    id: number;
    name: string;
    description?: string;
    content?: string;
    tags?: AssetTagItem[];
    metadata?: Record<string, any> | null;
    status?: string;
    created_by?: number;
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
    pull_run_id?: number;
    cached?: boolean;
  }

  interface AssetMachineTrustToken {
    machine_id: string;
    asset_machine_id: number;
    trust_token: string;
    config?: Record<string, any> | null;
    expires_in_seconds?: number;
    inject_task_id?: number;
    inject_task_url?: string;
    inject_status?: string;
  }

  interface AssetListParams {
    page?: number;
    page_size?: number;
    provider_code?: string;
    account_id?: number;
    region?: string;
    status?: string;
    source?: string;
    name?: string;
    tag_key?: string;
    tag_value?: string;
  }

  interface AssetProviderAccountCreateParams {
    provider_code: string;
    name: string;
    status?: string;
    credential: AssetProviderCredentialInput;
    tags?: AssetTagItem[];
  }

  interface AssetProviderAccountUpdateParams {
    id: number;
    name?: string;
    status?: string;
    credential?: AssetProviderCredentialInput;
    tags?: AssetTagItem[];
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
    tags?: AssetTagItem[];
    spec?: AssetMachineSpec;
  }

  interface AssetMachineCreateManualResult {
    id: number;
    trust_token?: AssetMachineTrustToken | null;
  }

  interface AssetMachineCreateZone {
    country_code: string;
    city?: string;
    zone_id: string;
  }

  interface AssetMachineCreateSpec {
    type: string;
    cpu_cores?: number;
    memory_mb?: number;
  }

  interface AssetMachineCreateOs {
    image_id: string;
    name?: string;
    version?: string;
  }

  interface AssetMachineCreateDisk {
    system_size_gb: number;
  }

  interface AssetMachineCreateVpc {
    vpc_id: string;
    vswitch_id?: string;
    cidr_block_v4?: string;
    cidr_block_v6?: string;
  }

  interface AssetMachineCreateInternet {
    charge_type?: string;
    bandwidth_mbps?: number;
    traffic_package_size?: number;
    eip_v4_type?: string;
  }

  interface AssetMachineCreateLogin {
    auth_type: string;
    provider_key_id?: string;
    ssh_key_id?: number;
    username?: string;
    password?: string;
  }

  interface AssetMachineCreateBilling {
    mode: string;
    period?: number;
    period_unit?: string;
  }

  interface AssetMachineCreateFromProviderParams {
    account_id: number;
    name: string;
    zone: AssetMachineCreateZone;
    spec: AssetMachineCreateSpec;
    os: AssetMachineCreateOs;
    disk: AssetMachineCreateDisk;
    vpc: AssetMachineCreateVpc;
    bandwidth_mbps?: number;
    internet?: AssetMachineCreateInternet;
    login: AssetMachineCreateLogin;
    tags?: AssetTagItem[];
    time_zone: string;
    billing: AssetMachineCreateBilling;
    count?: number;
    client_request_id?: string;
    metadata?: Record<string, any>;
  }

  interface AssetMachineRetryProviderCreateParams {
    name?: string;
    zone?: Partial<AssetMachineCreateZone>;
    spec?: Partial<AssetMachineCreateSpec>;
    os?: Partial<AssetMachineCreateOs>;
    disk?: Partial<AssetMachineCreateDisk>;
    vpc?: Partial<AssetMachineCreateVpc>;
    bandwidth_mbps?: number;
    internet?: Partial<AssetMachineCreateInternet>;
    login?: Partial<AssetMachineCreateLogin>;
    tags?: AssetTagItem[];
    time_zone?: string;
    billing?: Partial<AssetMachineCreateBilling>;
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
    tags?: AssetTagItem[];
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
    tags?: AssetTagItem[];
  }

  interface AssetIpUpdateParams {
    id: number;
    type?: string;
    region?: string;
    status?: string;
    ownership?: string;
    external_ip_id?: string;
    metadata?: Record<string, any>;
    tags?: AssetTagItem[];
  }

  interface AssetIpPullFromProviderParams {
    account_id: number;
    region?: string;
    status?: string;
    page?: number;
    page_size?: number;
    refresh?: boolean;
  }

  interface AssetIpPullRunItemsParams {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
    region?: string;
    ip?: string;
  }

  interface AssetIpImportFromProviderParams {
    pull_run_id: number;
    import_all?: boolean;
    item_ids?: number[];
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
    tags?: AssetTagItem[];
  }

  interface AssetSshKeyImportProviderParams {
    account_id: number;
    name: string;
    external_key_id?: string;
    public_key?: string;
    payload?: Record<string, any>;
    tags?: AssetTagItem[];
  }

  interface AssetSshKeyCreateProviderParams {
    account_id: number;
    name: string;
    external_key_id?: string;
    public_key?: string;
    payload?: Record<string, any>;
    tags?: AssetTagItem[];
  }

  interface AssetSshKeyUpdateParams {
    id: number;
    name?: string;
    scope?: string;
    status?: string;
    public_key?: string;
    metadata?: Record<string, any>;
    tags?: AssetTagItem[];
  }

  interface AssetOperationListParams extends AssetListParams {
    operation_type?: string;
  }

  interface AssetMachineScriptListParams {
    page?: number;
    page_size?: number;
    name?: string;
    status?: string;
    tag_key?: string;
    tag_value?: string;
  }

  interface AssetMachineScriptUpsertParams {
    id?: number;
    name: string;
    description?: string;
    content: string;
    tags?: AssetTagItem[];
    metadata?: Record<string, any>;
    status?: string;
  }

  interface AssetMachineScriptRunParams {
    script_name: string;
    machine_ids: number[];
    timeout_seconds?: number;
    port?: number;
  }
}
