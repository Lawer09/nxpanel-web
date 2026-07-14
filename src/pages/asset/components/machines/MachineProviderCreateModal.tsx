import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createAssetMachine,
  listAssetImages,
  listAssetInstanceTypes,
  listAssetIps,
  listAssetSecurityGroups,
  listAssetSubnets,
  listAssetZones,
  retryAssetMachineProviderCreateV2,
} from '@/services/asset-service/api';
import AssetTagEditor from '../AssetTagEditor';
import { normalizeAssetTags, normalizeDevErrorMessage } from '../../utils';

const { Paragraph, Text, Title } = Typography;

type MachineProviderCreateFormValues = {
  account_id?: number;
  name?: string;
  count?: number;
  client_request_id?: string;
  asset_zone_id?: number;
  asset_image_id?: number;
  asset_instance_type_id?: number;
  asset_subnet_id?: number;
  asset_ip_id?: number;
  asset_security_group_ids?: number[];
  tags?: API.AssetTagItem[];
  disk?: {
    system_size_gb?: number;
  };
  login?: {
    auth_type?: 'password' | 'provider_key';
    ssh_key_id?: number;
    username?: string;
    password?: string;
  };
  time_zone?: string;
};

type Props = {
  open: boolean;
  mode: 'create' | 'retry';
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  retrying?: API.AssetMachine | null;
  initialValues?: Partial<API.AssetMachineProviderCreateParams>;
  onCancel: () => void;
  onSuccess: (ack: API.AssetTaskAck, title: string) => void;
};

type CatalogListItem = {
  key: number;
  title: string;
  subtitle?: string;
  lines?: string[];
  tags?: string[];
  disabled?: boolean;
};

type FilterKey =
  | 'zones'
  | 'instanceTypes'
  | 'images'
  | 'subnets'
  | 'ips'
  | 'securityGroups'
  | 'sshKeys';

const trimText = (value?: string) => {
  const next = value?.trim();
  return next || undefined;
};

const formatProviderName = (providerCode?: string) => {
  if (!providerCode) {
    return 'Unknown Provider';
  }
  return providerCode
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatBandwidth = (value?: number) => {
  if (!value || value <= 0) {
    return undefined;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} Gbps`;
  }
  return `${value} Mbps`;
};

const formatMemory = (value?: number) => {
  if (!value || value <= 0) {
    return undefined;
  }
  if (value % 1024 === 0) {
    return `${value / 1024} GiB`;
  }
  return `${value} MiB`;
};

const getAccountSummary = (account: API.AssetProviderAccount) => {
  const bits: string[] = [];
  if (account.status) {
    bits.push(account.status);
  }
  if (account.has_credential === false) {
    bits.push('no credential');
  }
  if (account.credential_version) {
    bits.push(`cred v${account.credential_version}`);
  }
  return bits.join(' | ');
};

const buildZoneItem = (item: API.AssetZone): CatalogListItem => ({
  key: item.id,
  title: item.city_name || item.provider_zone_id || `Zone #${item.id}`,
  subtitle: item.country_name || item.country_code || item.provider_region_id || undefined,
  lines: [
    item.provider_zone_id ? `Zone ID: ${item.provider_zone_id}` : '',
    item.provider_region_id ? `Region: ${item.provider_region_id}` : '',
    item.time_zone ? `Time Zone: ${item.time_zone}` : '',
  ].filter(Boolean),
  tags: [item.provider_code, item.city_code, item.source].filter(Boolean) as string[],
});

const buildImageItem = (item: API.AssetImage): CatalogListItem => ({
  key: item.id,
  title: item.name || item.provider_image_id || `Image #${item.id}`,
  subtitle: [item.os_type, item.version].filter(Boolean).join(' | ') || undefined,
  lines: [
    item.provider_image_id ? `Image ID: ${item.provider_image_id}` : '',
    item.category ? `Category: ${item.category}` : '',
    item.status ? `Status: ${item.status}` : '',
  ].filter(Boolean),
  tags: [item.type, item.source].filter(Boolean) as string[],
});

const buildInstanceTypeItem = (item: API.AssetInstanceType): CatalogListItem => ({
  key: item.id,
  title: item.name || item.provider_instance_type_id || `Spec #${item.id}`,
  subtitle:
    [item.cpu_count ? `${item.cpu_count} vCPU` : '', formatMemory(item.memory_mb)]
      .filter(Boolean)
      .join(' | ') || undefined,
  lines: [
    item.provider_instance_type_id ? `Type ID: ${item.provider_instance_type_id}` : '',
    formatBandwidth(item.internet_bandwidth_limit)
      ? `Bandwidth Limit: ${formatBandwidth(item.internet_bandwidth_limit)}`
      : '',
    item.with_stock === true
      ? 'Stock: available'
      : item.with_stock === false
        ? 'Stock: unknown or unavailable'
        : '',
  ].filter(Boolean),
  tags: [
    item.source,
    item.bps ? `bps ${item.bps}` : '',
    item.pps ? `pps ${item.pps}` : '',
  ].filter(Boolean) as string[],
});

const buildSubnetItem = (item: API.AssetSubnet): CatalogListItem => ({
  key: item.id,
  title: item.provider_subnet_id || item.cidr_block || `Subnet #${item.id}`,
  subtitle: item.vpc_name || item.vpc_id || undefined,
  lines: [
    item.cidr_block ? `CIDR: ${item.cidr_block}` : '',
    item.gateway_ip_address ? `Gateway: ${item.gateway_ip_address}` : '',
    item.vpc_id ? `VPC ID: ${item.vpc_id}` : '',
  ].filter(Boolean),
  tags: [item.source].filter(Boolean) as string[],
});

const buildIpItem = (item: API.AssetIp): CatalogListItem => ({
  key: item.id,
  title: item.ip || item.external_ip_id || `IP #${item.id}`,
  subtitle: [item.type, item.ownership].filter(Boolean).join(' | ') || undefined,
  lines: [
    item.external_ip_id ? `Provider IP ID: ${item.external_ip_id}` : '',
    item.provider_region_id ? `Region: ${item.provider_region_id}` : '',
    item.status ? `Status: ${item.status}` : '',
  ].filter(Boolean),
  tags: [item.ip_version ? `IPv${item.ip_version}` : '', item.source].filter(Boolean) as string[],
});

const buildSecurityGroupItem = (item: API.AssetSecurityGroup): CatalogListItem => ({
  key: item.id,
  title: item.name || item.provider_security_group_id || `Security Group #${item.id}`,
  subtitle: item.provider_name || item.provider_code || undefined,
  lines: [
    item.provider_security_group_id ? `Group ID: ${item.provider_security_group_id}` : '',
    item.source ? `Source: ${item.source}` : '',
  ].filter(Boolean),
  tags: (item.tags || []).slice(0, 4).map((tag) => `${tag.key}:${tag.value}`),
});

const buildSshKeyItem = (item: API.AssetSshKey): CatalogListItem => ({
  key: item.id,
  title: item.name || item.external_key_id || `SSH Key #${item.id}`,
  subtitle: [item.account_name, item.scope].filter(Boolean).join(' | ') || undefined,
  lines: [
    item.external_key_id ? `Key ID: ${item.external_key_id}` : '',
    item.fingerprint ? `Fingerprint: ${item.fingerprint}` : '',
    item.status ? `Status: ${item.status}` : '',
  ].filter(Boolean),
  tags: [item.provider_code, item.has_private_key ? 'private key ready' : 'public only']
    .filter(Boolean) as string[],
});

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #f0f0f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
};

const providerGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const fieldSectionStyle: React.CSSProperties = {
  padding: 16,
  border: '1px solid #f0f0f0',
  borderRadius: 16,
  background: '#fafcff',
};

const listShellStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  background: '#fff',
  overflow: 'hidden',
};

const listMetaLineStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(0, 0, 0, 0.65)',
  lineHeight: '18px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const getSelectedValues = (value?: number | number[]) => {
  if (Array.isArray(value)) {
    return value;
  }
  return typeof value === 'number' ? [value] : [];
};

const applyCatalogFilter = (
  items: CatalogListItem[],
  keyword: string | undefined,
  selectedValues: number[],
  selectedOnly: boolean | undefined,
) => {
  const normalizedKeyword = keyword?.trim().toLowerCase();
  let nextItems = items;

  if (selectedOnly && selectedValues.length > 0) {
    nextItems = nextItems.filter((item) => selectedValues.includes(item.key));
  }

  if (!normalizedKeyword) {
    return nextItems;
  }

  return nextItems.filter((item) =>
    [item.title, item.subtitle, ...(item.lines || []), ...(item.tags || [])]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword),
  );
};

const SelectableResourceList: React.FC<{
  items: CatalogListItem[];
  value?: number | number[];
  multiple?: boolean;
  onChange: (value: number | number[] | undefined) => void;
  emptyText: string;
  loading?: boolean;
  height?: number;
}> = ({ items, value, multiple = false, onChange, emptyText, loading = false, height = 300 }) => {
  const selectedValues = useMemo(() => getSelectedValues(value), [value]);

  if (loading) {
    return (
      <div style={{ ...listShellStyle, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">Loading options...</Text>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ ...listShellStyle, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </div>
    );
  }

  return (
    <div style={listShellStyle}>
      <div style={{ maxHeight: height, overflowY: 'auto' }}>
        {items.map((item, index) => {
          const active = selectedValues.includes(item.key);
          const isLast = index === items.length - 1;
          return (
            <div
              key={item.key}
              onClick={() => {
                if (item.disabled) {
                  return;
                }
                if (multiple) {
                  const next = active
                    ? selectedValues.filter((current) => current !== item.key)
                    : [...selectedValues, item.key];
                  onChange(next);
                  return;
                }
                onChange(active ? undefined : item.key);
              }}
              style={{
                padding: 12,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                background: active ? '#f0f7ff' : '#fff',
                borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                boxShadow: active ? '0 0 0 1px #1677ff inset' : 'none',
              }}
            >
              <Space align="start" size={12} style={{ width: '100%' }}>
                {multiple ? (
                  <Checkbox checked={active} style={{ pointerEvents: 'none', marginTop: 2 }} />
                ) : (
                  <Radio checked={active} style={{ pointerEvents: 'none', marginTop: 2 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Space
                    align="start"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    wrap
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text strong ellipsis={{ tooltip: item.title }} style={{ display: 'block' }}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text type="secondary" ellipsis={{ tooltip: item.subtitle }} style={{ display: 'block', fontSize: 12 }}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </div>
                    {item.tags?.length ? (
                      <Space size={[6, 6]} wrap>
                        {item.tags.slice(0, 4).map((tag) => (
                          <Tag key={tag} color="blue" bordered={false} style={{ marginInlineEnd: 0 }}>
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    ) : null}
                  </Space>
                  {item.lines?.length ? (
                    <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                      {item.lines.slice(0, 3).map((line) => (
                        <div key={line} title={line} style={listMetaLineStyle}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Space>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SelectionToolbar: React.FC<{
  title: string;
  description: string;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  searchValue?: string;
  selectedOnly?: boolean;
  searchPlaceholder: string;
  searchDisabled?: boolean;
  onSearchChange: (value: string) => void;
  onSelectedOnlyChange: (checked: boolean) => void;
}> = ({
  title,
  description,
  totalCount,
  filteredCount,
  selectedCount,
  searchValue,
  selectedOnly,
  searchPlaceholder,
  searchDisabled = false,
  onSearchChange,
  onSelectedOnlyChange,
}) => {
  const countText =
    filteredCount === totalCount
      ? `${totalCount} item(s)`
      : `Showing ${filteredCount} / ${totalCount}`;

  return (
    <Space
      align="start"
      style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}
      wrap
    >
      <div>
        <Text strong>{title}</Text>
        <div>
          <Text type="secondary">{description}</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {countText}
          {selectedCount > 0 ? ` | Selected ${selectedCount}` : ''}
        </Text>
      </div>
      <Space size={12} wrap>
        <Checkbox
          checked={selectedOnly}
          disabled={selectedCount === 0}
          onChange={(event) => onSelectedOnlyChange(event.target.checked)}
        >
          Selected only
        </Checkbox>
        <Input.Search
          allowClear
          value={searchValue}
          disabled={searchDisabled}
          placeholder={searchPlaceholder}
          style={{ width: 240 }}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </Space>
    </Space>
  );
};

const MachineProviderCreateModal: React.FC<Props> = ({
  open,
  mode,
  accounts,
  sshKeys,
  retrying,
  initialValues,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<MachineProviderCreateFormValues>();
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [zones, setZones] = useState<API.AssetZone[]>([]);
  const [images, setImages] = useState<API.AssetImage[]>([]);
  const [instanceTypes, setInstanceTypes] = useState<API.AssetInstanceType[]>([]);
  const [subnets, setSubnets] = useState<API.AssetSubnet[]>([]);
  const [securityGroups, setSecurityGroups] = useState<API.AssetSecurityGroup[]>([]);
  const [ips, setIps] = useState<API.AssetIp[]>([]);
  const [currentStep, setCurrentStep] = useState<'account' | 'config'>('account');
  const [activeProviderCode, setActiveProviderCode] = useState<string | undefined>(undefined);
  const [searchTexts, setSearchTexts] = useState<Record<FilterKey, string>>({
    zones: '',
    instanceTypes: '',
    images: '',
    subnets: '',
    ips: '',
    securityGroups: '',
    sshKeys: '',
  });
  const [selectedOnlyMap, setSelectedOnlyMap] = useState<Record<FilterKey, boolean>>({
    zones: false,
    instanceTypes: false,
    images: false,
    subnets: false,
    ips: false,
    securityGroups: false,
    sshKeys: false,
  });
  const previousAccountIdRef = useRef<number | undefined>(undefined);
  const previousAuthTypeRef = useRef<'password' | 'provider_key' | undefined>(undefined);

  const accountId = Form.useWatch('account_id', form);
  const zoneId = Form.useWatch('asset_zone_id', form);
  const instanceTypeId = Form.useWatch('asset_instance_type_id', form);
  const imageId = Form.useWatch('asset_image_id', form);
  const subnetId = Form.useWatch('asset_subnet_id', form);
  const ipId = Form.useWatch('asset_ip_id', form);
  const authType = Form.useWatch(['login', 'auth_type'], form);
  const sshKeyId = Form.useWatch(['login', 'ssh_key_id'], form);
  const selectedSecurityGroupIds =
    (Form.useWatch('asset_security_group_ids', form) as number[] | undefined) || [];

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedZone = useMemo(
    () => zones.find((item) => item.id === zoneId),
    [zoneId, zones],
  );

  const groupedAccounts = useMemo(() => {
    const nextMap = new Map<
      string,
      { providerCode: string; providerName: string; accounts: API.AssetProviderAccount[] }
    >();
    accounts.forEach((item) => {
      const providerCode = item.provider_code || 'unknown';
      if (!nextMap.has(providerCode)) {
        nextMap.set(providerCode, {
          providerCode,
          providerName: formatProviderName(providerCode),
          accounts: [],
        });
      }
      nextMap.get(providerCode)!.accounts.push(item);
    });
    return Array.from(nextMap.values()).sort((left, right) =>
      left.providerName.localeCompare(right.providerName),
    );
  }, [accounts]);

  const availableSshKeys = useMemo(
    () =>
      sshKeys.filter(
        (item) =>
          item.has_private_key &&
          (!accountId || item.account_id === accountId || item.account_id == null),
      ),
    [accountId, sshKeys],
  );

  const updateSearchText = (key: FilterKey, value: string) => {
    setSearchTexts((current) => ({ ...current, [key]: value }));
  };

  const updateSelectedOnly = (key: FilterKey, value: boolean) => {
    setSelectedOnlyMap((current) => ({ ...current, [key]: value }));
  };

  const zoneSelectedValues = useMemo(() => getSelectedValues(zoneId), [zoneId]);
  const instanceTypeSelectedValues = useMemo(
    () => getSelectedValues(instanceTypeId),
    [instanceTypeId],
  );
  const imageSelectedValues = useMemo(() => getSelectedValues(imageId), [imageId]);
  const subnetSelectedValues = useMemo(() => getSelectedValues(subnetId), [subnetId]);
  const ipSelectedValues = useMemo(() => getSelectedValues(ipId), [ipId]);
  const securityGroupSelectedValues = useMemo(
    () => getSelectedValues(selectedSecurityGroupIds),
    [selectedSecurityGroupIds],
  );
  const sshKeySelectedValues = useMemo(() => getSelectedValues(sshKeyId), [sshKeyId]);

  const zoneItems = useMemo(() => zones.map(buildZoneItem), [zones]);
  const instanceTypeItems = useMemo(
    () => instanceTypes.map(buildInstanceTypeItem),
    [instanceTypes],
  );
  const imageItems = useMemo(() => images.map(buildImageItem), [images]);
  const subnetItems = useMemo(() => subnets.map(buildSubnetItem), [subnets]);
  const ipItems = useMemo(() => ips.map(buildIpItem), [ips]);
  const securityGroupItems = useMemo(
    () => securityGroups.map(buildSecurityGroupItem),
    [securityGroups],
  );
  const sshKeyItems = useMemo(
    () => availableSshKeys.map(buildSshKeyItem),
    [availableSshKeys],
  );

  const zoneFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        zoneItems,
        searchTexts.zones,
        zoneSelectedValues,
        selectedOnlyMap.zones,
      ),
    [searchTexts.zones, selectedOnlyMap.zones, zoneItems, zoneSelectedValues],
  );
  const instanceTypeFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        instanceTypeItems,
        searchTexts.instanceTypes,
        instanceTypeSelectedValues,
        selectedOnlyMap.instanceTypes,
      ),
    [
      instanceTypeItems,
      instanceTypeSelectedValues,
      searchTexts.instanceTypes,
      selectedOnlyMap.instanceTypes,
    ],
  );
  const imageFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        imageItems,
        searchTexts.images,
        imageSelectedValues,
        selectedOnlyMap.images,
      ),
    [imageItems, imageSelectedValues, searchTexts.images, selectedOnlyMap.images],
  );
  const subnetFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        subnetItems,
        searchTexts.subnets,
        subnetSelectedValues,
        selectedOnlyMap.subnets,
      ),
    [searchTexts.subnets, selectedOnlyMap.subnets, subnetItems, subnetSelectedValues],
  );
  const ipFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        ipItems,
        searchTexts.ips,
        ipSelectedValues,
        selectedOnlyMap.ips,
      ),
    [ipItems, ipSelectedValues, searchTexts.ips, selectedOnlyMap.ips],
  );
  const securityGroupFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        securityGroupItems,
        searchTexts.securityGroups,
        securityGroupSelectedValues,
        selectedOnlyMap.securityGroups,
      ),
    [
      searchTexts.securityGroups,
      securityGroupItems,
      securityGroupSelectedValues,
      selectedOnlyMap.securityGroups,
    ],
  );
  const sshKeyFilteredItems = useMemo(
    () =>
      applyCatalogFilter(
        sshKeyItems,
        searchTexts.sshKeys,
        sshKeySelectedValues,
        selectedOnlyMap.sshKeys,
      ),
    [searchTexts.sshKeys, selectedOnlyMap.sshKeys, sshKeyItems, sshKeySelectedValues],
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setZones([]);
      setImages([]);
      setInstanceTypes([]);
      setSubnets([]);
      setSecurityGroups([]);
      setIps([]);
      setSaving(false);
      setCurrentStep('account');
      setActiveProviderCode(undefined);
      setSearchTexts({
        zones: '',
        instanceTypes: '',
        images: '',
        subnets: '',
        ips: '',
        securityGroups: '',
        sshKeys: '',
      });
      setSelectedOnlyMap({
        zones: false,
        instanceTypes: false,
        images: false,
        subnets: false,
        ips: false,
        securityGroups: false,
        sshKeys: false,
      });
      previousAccountIdRef.current = undefined;
      previousAuthTypeRef.current = undefined;
      return;
    }

    const nextValues = {
      count: 1,
      time_zone: 'Asia/Shanghai',
      login: {
        auth_type: 'provider_key' as const,
      },
      tags: [],
      ...initialValues,
      ...(mode === 'retry' && retrying
        ? {
            account_id: retrying.account_id || undefined,
            name: retrying.name || undefined,
            asset_zone_id: retrying.asset_zone_id || undefined,
            asset_image_id: retrying.asset_image_id || undefined,
            asset_instance_type_id: retrying.asset_instance_type_id || undefined,
            asset_subnet_id: retrying.asset_subnet_id || undefined,
            asset_ip_id: retrying.asset_ip_id || undefined,
            asset_security_group_ids: retrying.asset_security_group_ids || [],
            disk: {
              system_size_gb: retrying.system_disk_size_gb || undefined,
            },
            tags: retrying.tags || [],
          }
        : {}),
    };

    form.setFieldsValue(nextValues);
    const nextAccount = nextValues.account_id ? accountMap.get(nextValues.account_id) : undefined;
    setActiveProviderCode(nextAccount?.provider_code || accounts[0]?.provider_code);
    setCurrentStep(mode === 'retry' ? 'config' : nextValues.account_id ? 'config' : 'account');
    previousAccountIdRef.current = nextValues.account_id;
    previousAuthTypeRef.current = nextValues.login?.auth_type;
  }, [accountMap, accounts, form, initialValues, mode, open, retrying]);

  useEffect(() => {
    if (!open || !selectedAccount?.provider_code) {
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [zonesRes, securityGroupsRes, ipsRes] = await Promise.all([
          listAssetZones({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
          }),
          listAssetSecurityGroups({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
          }),
          listAssetIps({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            account_id: selectedAccount.id,
          }),
        ]);
        setZones(zonesRes.data?.items || []);
        setSecurityGroups(securityGroupsRes.data?.items || []);
        setIps(ipsRes.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [message, open, selectedAccount]);

  useEffect(() => {
    if (!open || !selectedAccount?.provider_code || !zoneId) {
      setImages([]);
      setInstanceTypes([]);
      setSubnets([]);
      return;
    }

    const loadZoneScopedOptions = async () => {
      setLoadingOptions(true);
      try {
        const regionId =
          selectedZone?.region_ids && selectedZone.region_ids.length > 0
            ? String(selectedZone.region_ids[0])
            : undefined;
        const [imagesRes, instanceTypesRes, subnetsRes] = await Promise.all([
          listAssetImages({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            zone_id: String(zoneId),
          }),
          listAssetInstanceTypes({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            zone_id: String(zoneId),
          }),
          listAssetSubnets({
            page: 1,
            page_size: 200,
            provider_code: selectedAccount.provider_code,
            region_id: regionId,
          }),
        ]);
        setImages(imagesRes.data?.items || []);
        setInstanceTypes(instanceTypesRes.data?.items || []);
        setSubnets(subnetsRes.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadZoneScopedOptions();
  }, [message, open, selectedAccount, selectedZone, zoneId]);

  useEffect(() => {
    if (!zoneId) {
      form.setFieldsValue({
        asset_image_id: undefined,
        asset_instance_type_id: undefined,
        asset_subnet_id: undefined,
      });
    }
  }, [form, zoneId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (previousAccountIdRef.current === undefined) {
      previousAccountIdRef.current = accountId;
      return;
    }

    if (previousAccountIdRef.current !== accountId) {
      previousAccountIdRef.current = accountId;
      form.setFieldsValue({
        asset_zone_id: undefined,
        asset_image_id: undefined,
        asset_instance_type_id: undefined,
        asset_subnet_id: undefined,
        asset_ip_id: undefined,
        asset_security_group_ids: [],
        login: {
          ...form.getFieldValue('login'),
          ssh_key_id: undefined,
        },
      });
      setImages([]);
      setInstanceTypes([]);
      setSubnets([]);
      setSearchTexts((current) => ({
        ...current,
        zones: '',
        instanceTypes: '',
        images: '',
        subnets: '',
        ips: '',
        securityGroups: '',
        sshKeys: '',
      }));
      setSelectedOnlyMap((current) => ({
        ...current,
        zones: false,
        instanceTypes: false,
        images: false,
        subnets: false,
        ips: false,
        securityGroups: false,
        sshKeys: false,
      }));
    }
  }, [accountId, form, open]);

  useEffect(() => {
    if (!authType) {
      return;
    }

    if (previousAuthTypeRef.current === undefined) {
      previousAuthTypeRef.current = authType;
      return;
    }

    if (previousAuthTypeRef.current === authType) {
      return;
    }

    previousAuthTypeRef.current = authType;
    const currentLogin = form.getFieldValue('login') || {};
    if (authType === 'provider_key') {
      form.setFieldsValue({
        login: {
          ...currentLogin,
          username: undefined,
          password: undefined,
        },
      });
      return;
    }

    form.setFieldsValue({
      login: {
        ...currentLogin,
        ssh_key_id: undefined,
      },
    });
  }, [authType, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: API.AssetMachineProviderCreateParams = {
        account_id: values.account_id!,
        name: values.name!.trim(),
        count: values.count || 1,
        client_request_id: trimText(values.client_request_id),
        asset_zone_id: values.asset_zone_id!,
        asset_image_id: values.asset_image_id!,
        asset_instance_type_id: values.asset_instance_type_id!,
        asset_subnet_id: values.asset_subnet_id!,
        asset_ip_id: values.asset_ip_id,
        asset_security_group_ids:
          values.asset_security_group_ids && values.asset_security_group_ids.length > 0
            ? values.asset_security_group_ids
            : undefined,
        tags: normalizeAssetTags(values.tags),
        disk: {
          system_size_gb: values.disk?.system_size_gb!,
        },
        login: {
          auth_type: values.login?.auth_type || 'provider_key',
          ssh_key_id: values.login?.ssh_key_id,
          username: trimText(values.login?.username),
          password: trimText(values.login?.password),
        },
        time_zone: trimText(values.time_zone),
      };

      setSaving(true);
      if (mode === 'retry' && retrying) {
        const response = await retryAssetMachineProviderCreateV2(retrying.id, {
          name: payload.name,
          asset_zone_id: payload.asset_zone_id,
          asset_image_id: payload.asset_image_id,
          asset_instance_type_id: payload.asset_instance_type_id,
          asset_subnet_id: payload.asset_subnet_id,
          asset_ip_id: payload.asset_ip_id,
          asset_security_group_ids: payload.asset_security_group_ids,
          tags: payload.tags,
          disk: payload.disk,
          login: payload.login,
          time_zone: payload.time_zone,
        });
        onSuccess(response.data, `Machine #${retrying.id} retry submitted`);
        return;
      }

      const response = await createAssetMachine(payload);
      onSuccess(response.data, 'Machine create submitted');
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const accountStep = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={sectionCardStyle}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={4} style={{ margin: 0 }}>
            Select Provider Account
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Choose a platform first, expand its accounts, then enter the resource selection step.
          </Paragraph>
        </Space>
      </Card>

      <div style={providerGridStyle}>
        {groupedAccounts.map((group) => {
          const active = activeProviderCode === group.providerCode;
          return (
            <Card
              key={group.providerCode}
              hoverable
              onClick={() => setActiveProviderCode(group.providerCode)}
              style={{
                ...sectionCardStyle,
                borderColor: active ? '#1677ff' : '#e5e7eb',
                background: active ? '#f5faff' : '#fff',
              }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{group.providerName}</Text>
                  <Tag color={active ? 'blue' : 'default'}>{group.accounts.length} accounts</Tag>
                </Space>
                <Text type="secondary">{group.providerCode}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Expand this provider to choose a concrete account.
                </Text>
              </Space>
            </Card>
          );
        })}
      </div>

      <Card style={sectionCardStyle}>
        <Collapse
          ghost
          activeKey={activeProviderCode ? [activeProviderCode] : []}
          items={groupedAccounts.map((group) => ({
            key: group.providerCode,
            label: (
              <Space>
                <Text strong>{group.providerName}</Text>
                <Tag>{group.providerCode}</Tag>
              </Space>
            ),
            children: (
              <div style={providerGridStyle}>
                {group.accounts.map((account) => {
                  const active = account.id === accountId;
                  return (
                    <Card
                      key={account.id}
                      hoverable
                      onClick={() => {
                        form.setFieldsValue({ account_id: account.id });
                        setActiveProviderCode(account.provider_code || group.providerCode);
                      }}
                      style={{
                        borderRadius: 14,
                        borderColor: active ? '#1677ff' : '#e5e7eb',
                        background: active ? '#f0f7ff' : '#fff',
                      }}
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space
                          align="start"
                          style={{ width: '100%', justifyContent: 'space-between' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <Text strong ellipsis style={{ display: 'block' }}>
                              {account.name}
                            </Text>
                            <Text type="secondary">Account #{account.id}</Text>
                          </div>
                          <Radio checked={active} />
                        </Space>
                        <Space size={[6, 6]} wrap>
                          <Tag color={account.status === 'active' ? 'success' : 'default'}>
                            {account.status || 'unknown'}
                          </Tag>
                          {account.has_credential ? (
                            <Tag color="processing">credential ready</Tag>
                          ) : (
                            <Tag color="warning">credential missing</Tag>
                          )}
                        </Space>
                        {getAccountSummary(account) ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {getAccountSummary(account)}
                          </Text>
                        ) : null}
                      </Space>
                    </Card>
                  );
                })}
              </div>
            ),
          }))}
        />
      </Card>
    </Space>
  );

  const configStep = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card style={sectionCardStyle}>
        <Space
          align="start"
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Configure Machine
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              High-volume resources such as images, instance types, IPs, and security groups use
              fixed-height lists with lightweight filters to keep selection stable.
            </Paragraph>
          </div>
          <Space size={[8, 8]} wrap>
            <Tag color="blue">{selectedAccount?.provider_code || '-'}</Tag>
            <Tag>{selectedAccount?.name || '-'}</Tag>
          </Space>
        </Space>
      </Card>

      <div style={fieldSectionStyle}>
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name="name"
            label="Name"
            style={{ flex: 1, minWidth: 280 }}
            rules={[{ required: true, message: 'Enter machine name.' }]}
          >
            <Input placeholder="edge-node" />
          </Form.Item>
          {mode === 'create' ? (
            <Form.Item name="count" label="Count" style={{ width: 160 }}>
              <InputNumber min={1} max={100} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          ) : null}
          <Form.Item
            name="client_request_id"
            label="Client Request ID"
            style={{ flex: 1, minWidth: 280 }}
          >
            <Input disabled={mode === 'retry'} placeholder="create-edge-001" />
          </Form.Item>
        </Space>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="Zone"
          description="Choose the target city and zone before images and instance types."
          totalCount={zoneItems.length}
          filteredCount={zoneFilteredItems.length}
          selectedCount={zoneSelectedValues.length}
          searchValue={searchTexts.zones}
          selectedOnly={selectedOnlyMap.zones}
          searchPlaceholder="Search zone"
          onSearchChange={(value) => updateSearchText('zones', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('zones', checked)}
        />
        <Form.Item
          name="asset_zone_id"
          rules={[{ required: true, message: 'Select a zone.' }]}
          style={{ marginBottom: 0 }}
        >
          <SelectableResourceList
            items={zoneFilteredItems}
            value={zoneId}
            onChange={(value) => form.setFieldsValue({ asset_zone_id: value as number | undefined })}
            loading={loadingOptions}
            emptyText="No zone found for the selected provider."
            height={240}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="Instance Type"
          description="This list usually grows large. Use search or selected-only to narrow it quickly."
          totalCount={instanceTypeItems.length}
          filteredCount={instanceTypeFilteredItems.length}
          selectedCount={instanceTypeSelectedValues.length}
          searchValue={searchTexts.instanceTypes}
          selectedOnly={selectedOnlyMap.instanceTypes}
          searchPlaceholder="Search instance type"
          searchDisabled={!zoneId}
          onSearchChange={(value) => updateSearchText('instanceTypes', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('instanceTypes', checked)}
        />
        <Form.Item
          name="asset_instance_type_id"
          rules={[{ required: true, message: 'Select an instance type.' }]}
          style={{ marginBottom: 0 }}
        >
          <SelectableResourceList
            items={instanceTypeFilteredItems}
            value={instanceTypeId}
            onChange={(value) =>
              form.setFieldsValue({ asset_instance_type_id: value as number | undefined })
            }
            loading={loadingOptions}
            emptyText={
              zoneId ? 'No instance type found for the selected zone.' : 'Select a zone first.'
            }
            height={320}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="Image"
          description="Images can also be numerous. Filter by OS, version, category, or provider image ID."
          totalCount={imageItems.length}
          filteredCount={imageFilteredItems.length}
          selectedCount={imageSelectedValues.length}
          searchValue={searchTexts.images}
          selectedOnly={selectedOnlyMap.images}
          searchPlaceholder="Search image"
          searchDisabled={!zoneId}
          onSearchChange={(value) => updateSearchText('images', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('images', checked)}
        />
        <Form.Item
          name="asset_image_id"
          rules={[{ required: true, message: 'Select an image.' }]}
          style={{ marginBottom: 0 }}
        >
          <SelectableResourceList
            items={imageFilteredItems}
            value={imageId}
            onChange={(value) => form.setFieldsValue({ asset_image_id: value as number | undefined })}
            loading={loadingOptions}
            emptyText={zoneId ? 'No image found for the selected zone.' : 'Select a zone first.'}
            height={320}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="Subnet"
          description="Subnets are shown as a scrollable list with VPC and CIDR metadata."
          totalCount={subnetItems.length}
          filteredCount={subnetFilteredItems.length}
          selectedCount={subnetSelectedValues.length}
          searchValue={searchTexts.subnets}
          selectedOnly={selectedOnlyMap.subnets}
          searchPlaceholder="Search subnet"
          searchDisabled={!zoneId}
          onSearchChange={(value) => updateSearchText('subnets', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('subnets', checked)}
        />
        <Form.Item
          name="asset_subnet_id"
          rules={[{ required: true, message: 'Select a subnet.' }]}
          style={{ marginBottom: 0 }}
        >
          <SelectableResourceList
            items={subnetFilteredItems}
            value={subnetId}
            onChange={(value) => form.setFieldsValue({ asset_subnet_id: value as number | undefined })}
            loading={loadingOptions}
            emptyText={zoneId ? 'No subnet found for the selected zone.' : 'Select a zone first.'}
            height={260}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="IP"
          description="IP pools can become large, so this list stays scrollable with search."
          totalCount={ipItems.length}
          filteredCount={ipFilteredItems.length}
          selectedCount={ipSelectedValues.length}
          searchValue={searchTexts.ips}
          selectedOnly={selectedOnlyMap.ips}
          searchPlaceholder="Search IP"
          onSearchChange={(value) => updateSearchText('ips', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('ips', checked)}
        />
        <Form.Item name="asset_ip_id" style={{ marginBottom: 0 }}>
          <SelectableResourceList
            items={ipFilteredItems}
            value={ipId}
            onChange={(value) => form.setFieldsValue({ asset_ip_id: value as number | undefined })}
            loading={loadingOptions}
            emptyText="No IP found for the selected account."
            height={280}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <SelectionToolbar
          title="Security Groups"
          description="Use multi-select with a fixed-height list instead of a large multi-dropdown."
          totalCount={securityGroupItems.length}
          filteredCount={securityGroupFilteredItems.length}
          selectedCount={securityGroupSelectedValues.length}
          searchValue={searchTexts.securityGroups}
          selectedOnly={selectedOnlyMap.securityGroups}
          searchPlaceholder="Search security group"
          onSearchChange={(value) => updateSearchText('securityGroups', value)}
          onSelectedOnlyChange={(checked) => updateSelectedOnly('securityGroups', checked)}
        />
        <Form.Item name="asset_security_group_ids" style={{ marginBottom: 0 }}>
          <SelectableResourceList
            items={securityGroupFilteredItems}
            value={selectedSecurityGroupIds}
            multiple
            onChange={(value) =>
              form.setFieldsValue({
                asset_security_group_ids: Array.isArray(value) ? value : [],
              })
            }
            loading={loadingOptions}
            emptyText="No security group found for the selected provider."
            height={280}
          />
        </Form.Item>
      </div>

      <div style={fieldSectionStyle}>
        <Space size={16} align="start" style={{ width: '100%' }} wrap>
          <Form.Item
            name={['disk', 'system_size_gb']}
            label="System Disk (GB)"
            style={{ width: 220 }}
            rules={[{ required: true, message: 'Enter system disk size.' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time_zone" label="Time Zone" style={{ flex: 1, minWidth: 220 }}>
            <Input placeholder={selectedZone?.time_zone || 'Asia/Shanghai'} />
          </Form.Item>
        </Space>
      </div>

      <div style={fieldSectionStyle}>
        <Form.Item
          name={['login', 'auth_type']}
          label="Login Auth Type"
          style={{ width: 240 }}
          rules={[{ required: true, message: 'Select login auth type.' }]}
        >
          <Radio.Group
            options={[
              { label: 'Provider SSH Key', value: 'provider_key' },
              { label: 'Password', value: 'password' },
            ]}
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>

        {authType === 'provider_key' ? (
          <>
            <SelectionToolbar
              title="SSH Key"
              description="Provider SSH keys also use a fixed-height list because accounts may have many imported keys."
              totalCount={sshKeyItems.length}
              filteredCount={sshKeyFilteredItems.length}
              selectedCount={sshKeySelectedValues.length}
              searchValue={searchTexts.sshKeys}
              selectedOnly={selectedOnlyMap.sshKeys}
              searchPlaceholder="Search SSH key"
              onSearchChange={(value) => updateSearchText('sshKeys', value)}
              onSelectedOnlyChange={(checked) => updateSelectedOnly('sshKeys', checked)}
            />
            <Form.Item
              name={['login', 'ssh_key_id']}
              rules={[{ required: true, message: 'Select an SSH key.' }]}
              style={{ marginBottom: 0 }}
            >
              <SelectableResourceList
                items={sshKeyFilteredItems}
                value={sshKeyId}
                onChange={(value) =>
                  form.setFieldsValue({
                    login: {
                      ...form.getFieldValue('login'),
                      ssh_key_id: value as number | undefined,
                    },
                  })
                }
                emptyText="No SSH key found for the selected account."
                height={260}
              />
            </Form.Item>
          </>
        ) : (
          <Space size={16} align="start" style={{ width: '100%' }} wrap>
            <Form.Item
              name={['login', 'username']}
              label="Username"
              style={{ flex: 1, minWidth: 220 }}
              rules={[{ required: true, message: 'Enter username.' }]}
            >
              <Input placeholder="root" />
            </Form.Item>
            <Form.Item
              name={['login', 'password']}
              label="Password"
              style={{ flex: 1, minWidth: 220 }}
              rules={[{ required: true, message: 'Enter password.' }]}
            >
              <Input.Password />
            </Form.Item>
          </Space>
        )}
      </div>

      <div style={fieldSectionStyle}>
        <AssetTagEditor name="tags" label="Tags" />
      </div>
    </Space>
  );

  return (
    <Modal
      title={mode === 'retry' ? 'Retry provider create' : 'Create machine'}
      open={open}
      width={1120}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      footer={
        currentStep === 'account'
          ? [
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="next"
                type="primary"
                disabled={!accountId}
                onClick={() => setCurrentStep('config')}
              >
                Next
              </Button>,
            ]
          : [
              mode === 'retry' ? null : (
                <Button key="back" onClick={() => setCurrentStep('account')}>
                  Back
                </Button>
              ),
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={saving}
                onClick={() => void handleSubmit()}
              >
                {mode === 'retry' ? 'Submit Retry' : 'Submit Create'}
              </Button>,
            ]
      }
    >
      <Form<MachineProviderCreateFormValues> form={form} layout="vertical">
        <Form.Item
          name="account_id"
          hidden
          rules={[{ required: true, message: 'Select an account.' }]}
        >
          <InputNumber />
        </Form.Item>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Create uses local asset references"
            description="Zone, image, instance type, subnet, IP, security group, and SSH key are selected from current local asset tables. Old raw provider fields are not submitted in this flow."
          />
          <Space size={[8, 8]} wrap>
            <Tag color={currentStep === 'account' ? 'blue' : 'default'}>1. Account</Tag>
            <Tag color={currentStep === 'config' ? 'blue' : 'default'}>2. Resource Config</Tag>
          </Space>
          {currentStep === 'account' ? accountStep : configStep}
        </Space>
      </Form>
    </Modal>
  );
};

export default MachineProviderCreateModal;
