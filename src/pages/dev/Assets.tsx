import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  bindAssetMachineIp,
  createAssetMachineFromProvider,
  createAssetMachineManual,
  createAssetProviderAccount,
  createAssetProviderSshKey,
  createAssetSshKeyCustom,
  deleteAssetIp,
  deleteAssetMachine,
  deleteAssetProviderAccount,
  deleteAssetSshKey,
  destroyProviderAssetMachine,
  getAssetIpDetail,
  getAssetMachineDetail,
  getAssetSshKeyDetail,
  importAssetIpManual,
  importAssetIpsFromProvider,
  importAssetMachinesFromProvider,
  importAssetProviderSshKey,
  importAssetSshKeysFromProvider,
  listAssetIps,
  listAssetMachines,
  listAssetProviderAccounts,
  listAssetProviders,
  listAssetSshKeys,
  runAssetMachineCommand,
  switchPrimaryAssetMachineIp,
  syncAssetMachine,
  testAssetProviderAccountConnection,
  unbindAssetMachineIp,
  updateAssetIp,
  updateAssetMachine,
  updateAssetProviderAccount,
  updateAssetSshKey,
} from '@/services/asset-service/api';
import DevAuthGate from './components/DevAuthGate';
import JsonBlock from './components/JsonBlock';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

type AssetTabKey = 'accounts' | 'machines' | 'ips' | 'ssh-keys';

type SharedFilters = {
  provider_code?: string;
  account_id?: number;
  region?: string;
  status?: string;
};

type AccountFormValues = {
  provider_code: string;
  name: string;
  status?: string;
  access_key_id?: string;
  access_key_secret?: string;
  access_token?: string;
  api_base_url?: string;
};

type MachineFormValues = {
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

type MachineProviderFormValues = {
  account_id: number;
  region?: string;
  instanceName?: string;
  instanceType?: string;
  imageId?: string;
  keyId?: string;
  count?: number;
  publicIpAssigned?: boolean;
  internetChargeType?: string;
  bandwidthOutMbps?: number;
  payload_text?: string;
};

type MachineCommandFormValues = {
  ssh_key_id: number;
  username: string;
  port?: number;
  command: string;
  timeout_seconds?: number;
  confirmed?: boolean;
};

type IpFormValues = {
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

type SshKeyCustomFormValues = {
  name: string;
  public_key: string;
  private_key?: string;
  metadata_text?: string;
};

type SshKeyProviderFormValues = {
  account_id: number;
  name: string;
  external_key_id?: string;
  public_key?: string;
  payload_text?: string;
};

type SshKeyEditFormValues = {
  name: string;
  scope?: string;
  status?: string;
  public_key?: string;
  metadata_text?: string;
};

type JumpToTabHandler = (tab: AssetTabKey, accountId?: number) => void;

type TaskAckHandler = (ack: API.AssetTaskAck, title: string) => void;

const ACCOUNT_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'disabled', value: 'disabled' },
  { label: 'deleted', value: 'deleted' },
];

const MACHINE_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'creating', value: 'creating' },
  { label: 'stopped', value: 'stopped' },
  { label: 'destroyed', value: 'destroyed' },
];

const IP_STATUS_OPTIONS = [
  { label: 'available', value: 'available' },
  { label: 'bound', value: 'bound' },
  { label: 'reserved', value: 'reserved' },
  { label: 'released', value: 'released' },
  { label: 'unknown', value: 'unknown' },
];

const SSH_KEY_STATUS_OPTIONS = [
  { label: 'active', value: 'active' },
  { label: 'disabled', value: 'disabled' },
  { label: 'deleted', value: 'deleted' },
];

const ACCOUNT_PROVIDER_ACTION_KEYS = ['test_connection'];
const MACHINE_CREATE_ACTION_KEYS = ['create_machine', 'create_instance', 'create_from_provider'];
const MACHINE_IMPORT_ACTION_KEYS = ['import_machine', 'import_instances', 'import_from_provider'];
const MACHINE_SYNC_ACTION_KEYS = ['sync_machine', 'sync_instance'];
const MACHINE_DESTROY_ACTION_KEYS = [
  'destroy_machine',
  'destroy_instance',
  'destroy_provider_instance',
];
const IP_IMPORT_ACTION_KEYS = ['import_ip', 'import_ips', 'import_from_provider'];
const IP_SWITCH_PRIMARY_ACTION_KEYS = ['switch_primary_ip', 'set_primary_ip'];
const SSH_IMPORT_ACTION_KEYS = ['import_ssh_key', 'import_ssh_keys', 'import_provider_key'];
const SSH_CREATE_ACTION_KEYS = ['create_ssh_key', 'create_provider_key'];

const formatText = (value?: string | number | null | boolean) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

const formatTime = (value?: string | null) => formatText(value);

const parseJsonText = (value: string | undefined, fieldName: string) => {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fieldName} must be valid JSON.`);
  }
};

const stringifyJson = (value: unknown) => {
  if (value === undefined || value === null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

const normalizeDevErrorMessage = (error: any) => {
  const messageText = error?.message || 'Request failed.';
  if (typeof messageText === 'string' && messageText.includes('capability_not_supported')) {
    return 'Current provider capability does not support this action.';
  }
  return messageText;
};

const cleanupObject = <T extends Record<string, any>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
  ) as T;

const getStatusOptions = (tab: AssetTabKey) => {
  if (tab === 'accounts') {
    return ACCOUNT_STATUS_OPTIONS;
  }
  if (tab === 'machines') {
    return MACHINE_STATUS_OPTIONS;
  }
  if (tab === 'ips') {
    return IP_STATUS_OPTIONS;
  }
  return SSH_KEY_STATUS_OPTIONS;
};

const getCapabilityValue = (capabilities: Record<string, any> | null | undefined, key: string) => {
  if (!capabilities || typeof capabilities !== 'object') {
    return undefined;
  }

  if (typeof capabilities[key] === 'boolean') {
    return capabilities[key];
  }

  const segments = key.split('_');
  if (segments.length > 1) {
    const [group, ...rest] = segments;
    const grouped = capabilities[group];
    const groupedKey = rest.join('_');
    if (grouped && typeof grouped === 'object' && typeof grouped[groupedKey] === 'boolean') {
      return grouped[groupedKey];
    }
  }

  return undefined;
};

const isProviderCapabilitySupported = (
  provider: API.AssetProvider | undefined,
  keys: string[],
): boolean | undefined => {
  if (!provider?.capabilities) {
    return undefined;
  }

  for (const key of keys) {
    const value = getCapabilityValue(provider.capabilities, key);
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
};

const renderActionButton = (button: React.ReactElement<{ disabled?: boolean }>, disabledReason?: string) => {
  if (!disabledReason) {
    return button;
  }

  return (
    <Tooltip title={disabledReason}>
      <span>{React.cloneElement(button, { disabled: true })}</span>
    </Tooltip>
  );
};

const SharedFilterBar: React.FC<{
  activeTab: AssetTabKey;
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onApply: (filters: SharedFilters) => void;
  onReset: () => void;
}> = ({ activeTab, filters, providers, accounts, onApply, onReset }) => {
  const [form] = Form.useForm<SharedFilters>();

  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((item) => !filters.provider_code || item.provider_code === filters.provider_code)
        .map((item) => ({
          label: `${item.name} (#${item.id})`,
          value: item.id,
        })),
    [accounts, filters.provider_code],
  );

  return (
    <Form<SharedFilters>
      form={form}
      layout="inline"
      onFinish={(values) =>
        onApply({
          provider_code: values.provider_code,
          account_id: values.account_id,
          region: values.region?.trim() || undefined,
          status: values.status,
        })
      }
      style={{ rowGap: 12 }}
    >
      <Form.Item name="provider_code" label="Provider">
        <Select
          allowClear
          showSearch
          style={{ width: 180 }}
          optionFilterProp="label"
          options={providers.map((item) => ({
            label: `${item.name} (${item.code})`,
            value: item.code,
          }))}
        />
      </Form.Item>
      <Form.Item name="account_id" label="Account">
        <Select
          allowClear
          showSearch
          style={{ width: 240 }}
          optionFilterProp="label"
          options={filteredAccounts}
        />
      </Form.Item>
      <Form.Item name="region" label="Region">
        <Input placeholder="Region" style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="status" label="Status">
        <Select
          allowClear
          style={{ width: 180 }}
          options={getStatusOptions(activeTab)}
          placeholder="All statuses"
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Apply
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              onReset();
            }}
          >
            Reset
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

const AccountTab: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  onAccountCatalogChanged: () => Promise<void>;
  onJumpToTab: JumpToTabHandler;
}> = ({ filters, providers, onAccountCatalogChanged, onJumpToTab }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<AccountFormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetProviderAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<API.AssetProviderAccount | null>(null);
  const [relatedCounts, setRelatedCounts] = useState<{
    machines: number;
    ips: number;
    sshKeys: number;
  } | null>(null);
  const [credentialExpanded, setCredentialExpanded] = useState<string[]>(['credential']);

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const openCreate = () => {
    setEditing(null);
    setCredentialExpanded(['credential']);
    form.resetFields();
    form.setFieldsValue({
      provider_code: filters.provider_code || providers[0]?.code || 'zenlayer',
      status: 'active',
    });
    setOpen(true);
  };

  const openEdit = (record: API.AssetProviderAccount) => {
    setEditing(record);
    setCredentialExpanded([]);
    form.setFieldsValue({
      provider_code: record.provider_code || providers[0]?.code || 'zenlayer',
      name: record.name,
      status: record.status || 'active',
      access_key_id: undefined,
      access_key_secret: undefined,
      access_token: undefined,
      api_base_url: undefined,
    });
    setOpen(true);
  };

  const loadCounts = async (record: API.AssetProviderAccount) => {
    setRelatedCounts(null);
    try {
      const [machinesRes, ipsRes, sshRes] = await Promise.all([
        listAssetMachines({ page: 1, page_size: 1, account_id: record.id }),
        listAssetIps({ page: 1, page_size: 1, account_id: record.id }),
        listAssetSshKeys({ page: 1, page_size: 1, account_id: record.id }),
      ]);
      setRelatedCounts({
        machines: machinesRes.data?.total ?? 0,
        ips: ipsRes.data?.total ?? 0,
        sshKeys: sshRes.data?.total ?? 0,
      });
    } catch {
      setRelatedCounts({ machines: 0, ips: 0, sshKeys: 0 });
    }
  };

  const columns: ProColumns<API.AssetProviderAccount>[] = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => <Tag color="blue">{record.status || '-'}</Tag>,
    },
    {
      title: 'Credential',
      dataIndex: 'has_credential',
      render: (_, record) =>
        record.has_credential ? (
          <Tag color="green">Configured</Tag>
        ) : (
          <Tag color="default">Missing</Tag>
        ),
    },
    { title: 'Version', dataIndex: 'credential_version', width: 100 },
    { title: 'Last Synced', dataIndex: 'last_synced_at', renderText: formatTime },
    { title: 'Updated At', dataIndex: 'updated_at', renderText: formatTime },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => {
        const supported = isProviderCapabilitySupported(
          providerMap.get(record.provider_code || ''),
          ACCOUNT_PROVIDER_ACTION_KEYS,
        );
        const unsupportedReason =
          supported === false ? 'Current provider capability does not support connection test.' : undefined;
        return [
          <a
            key="detail"
            onClick={() => {
              setDetail(record);
              void loadCounts(record);
            }}
          >
            Detail
          </a>,
          <a key="edit" onClick={() => openEdit(record)}>
            Edit
          </a>,
          renderActionButton(
            <a
              key="test"
              onClick={async () => {
                try {
                  await testAssetProviderAccountConnection(record.id);
                  message.success('Connection test passed.');
                } catch (error: any) {
                  message.error(normalizeDevErrorMessage(error));
                }
              }}
            >
              Test Connection
            </a>,
            unsupportedReason,
          ),
          <Popconfirm
            key="delete"
            title="Delete this provider account?"
            onConfirm={async () => {
              try {
                await deleteAssetProviderAccount(record.id);
                message.success('Provider account deleted.');
                await onAccountCatalogChanged();
                actionRef.current?.reload();
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            <a>Delete</a>
          </Popconfirm>,
        ];
      },
    },
  ];

  return (
    <>
      <ProTable<API.AssetProviderAccount>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetProviderAccounts({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              status: filters.status,
            });
            return {
              data: response.data?.items || [],
              success: true,
              total: response.data?.total || 0,
            };
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Account
          </Button>,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            Refresh
          </Button>,
        ]}
      />

      <Modal
        title={editing ? `Edit Account #${editing.id}` : 'Create Provider Account'}
        open={open}
        destroyOnHidden
        confirmLoading={saving}
        width={760}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const credential = cleanupObject({
              access_key_id: values.access_key_id?.trim(),
              access_key_secret: values.access_key_secret?.trim(),
              access_token: values.access_token?.trim(),
              api_base_url: values.api_base_url?.trim(),
            });
            if (!editing && Object.keys(credential).length === 0) {
              message.error('Credential is required when creating a provider account.');
              return;
            }

            setSaving(true);
            if (editing) {
              await updateAssetProviderAccount(
                cleanupObject({
                  id: editing.id,
                  name: values.name.trim(),
                  status: values.status,
                  credential: Object.keys(credential).length ? credential : undefined,
                }),
              );
              message.success('Provider account updated.');
            } else {
              await createAssetProviderAccount({
                provider_code: values.provider_code,
                name: values.name.trim(),
                status: values.status,
                credential,
              });
              message.success('Provider account created.');
            }
            setOpen(false);
            setEditing(null);
            form.resetFields();
            await onAccountCatalogChanged();
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<AccountFormValues> form={form} layout="vertical">
          <Form.Item
            name="provider_code"
            label="Provider"
            rules={[{ required: true, message: 'Please select provider.' }]}
          >
            <Select
              disabled={Boolean(editing)}
              options={providers.map((item) => ({
                label: `${item.name} (${item.code})`,
                value: item.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="Account Name"
            rules={[{ required: true, message: 'Please enter account name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={ACCOUNT_STATUS_OPTIONS} />
          </Form.Item>
          <Collapse
            activeKey={credentialExpanded}
            onChange={(keys) => setCredentialExpanded(Array.isArray(keys) ? keys : [keys])}
            items={[
              {
                key: 'credential',
                label: editing ? 'Credential Update (leave blank to keep current value)' : 'Credential',
                children: (
                  <>
                    <Form.Item name="access_key_id" label="Access Key ID">
                      <Input autoComplete="off" />
                    </Form.Item>
                    <Form.Item name="access_key_secret" label="Access Key Secret">
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="access_token" label="Access Token">
                      <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="api_base_url" label="API Base URL">
                      <Input />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Drawer
        title={detail ? `Provider Account #${detail.id}` : 'Provider Account Detail'}
        open={Boolean(detail)}
        width={680}
        onClose={() => {
          setDetail(null);
          setRelatedCounts(null);
        }}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
              <Descriptions.Item label="Credential">
                {detail.has_credential ? 'Configured' : 'Missing'}
              </Descriptions.Item>
              <Descriptions.Item label="Credential Version">
                {formatText(detail.credential_version)}
              </Descriptions.Item>
              <Descriptions.Item label="Credential Summary">
                {detail.credential_masked || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Synced">
                {formatTime(detail.last_synced_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">{formatTime(detail.updated_at)}</Descriptions.Item>
            </Descriptions>
            <Descriptions bordered column={1} title="Related Resources">
              <Descriptions.Item label="Machines">
                {relatedCounts ? relatedCounts.machines : 'Loading...'}
              </Descriptions.Item>
              <Descriptions.Item label="IPs">
                {relatedCounts ? relatedCounts.ips : 'Loading...'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH Keys">
                {relatedCounts ? relatedCounts.sshKeys : 'Loading...'}
              </Descriptions.Item>
            </Descriptions>
            <Space wrap>
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToTab('machines', detail.id);
                }}
              >
                View Machines
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToTab('ips', detail.id);
                }}
              >
                View IPs
              </Button>
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToTab('ssh-keys', detail.id);
                }}
              >
                View SSH Keys
              </Button>
            </Space>
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

const MachineTab: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, sshKeys, onTaskAck }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [manualForm] = Form.useForm<MachineFormValues>();
  const [providerForm] = Form.useForm<MachineProviderFormValues>();
  const [commandForm] = Form.useForm<MachineCommandFormValues>();
  const [bindForm] = Form.useForm<API.AssetMachineBindIpParams>();
  const [manualOpen, setManualOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetMachine | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetMachine[]>([]);
  const [detail, setDetail] = useState<API.AssetMachine | null>(null);
  const [detailTab, setDetailTab] = useState('basic');
  const [bindOptions, setBindOptions] = useState<API.AssetIp[]>([]);
  const [bindLoading, setBindLoading] = useState(false);
  const [importAccountId, setImportAccountId] = useState<number | undefined>(filters.account_id);
  const [importRegion, setImportRegion] = useState<string | undefined>(filters.region);

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );

  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (item) => !filters.provider_code || item.provider_code === filters.provider_code,
      ),
    [accounts, filters.provider_code],
  );

  const availableSshKeys = useMemo(
    () => sshKeys.filter((item) => item.has_private_key),
    [sshKeys],
  );

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const loadMachineDetail = async (machineId: number, nextTab: string = 'basic') => {
    try {
      const response = await getAssetMachineDetail(machineId);
      setDetail(response.data);
      setDetailTab(nextTab);
      bindForm.resetFields();
      if (nextTab === 'ip-bindings') {
        void loadBindOptions(response.data);
      }
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    }
  };

  const loadBindOptions = async (machine: API.AssetMachine) => {
    setBindLoading(true);
    try {
      const response = await listAssetIps({
        page: 1,
        page_size: 200,
        account_id: machine.account_id || undefined,
        provider_code: machine.provider_code || undefined,
        region: machine.region || undefined,
      });
      setBindOptions(response.data?.items || []);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
      setBindOptions([]);
    } finally {
      setBindLoading(false);
    }
  };

  const buildSpecPayload = (values: MachineFormValues) => {
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

  const buildMachinePayload = (values: MachineFormValues) => {
    const metadata = parseJsonText(values.metadata_text, 'Metadata');
    const spec = buildSpecPayload(values);
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

  const buildProviderPayload = (values: MachineProviderFormValues) => {
    const payloadText = parseJsonText(values.payload_text, 'Provider payload');
    const payload =
      typeof payloadText === 'object' && payloadText
        ? { ...payloadText }
        : {};
    const mergedPayload = cleanupObject({
      ...payload,
      instanceName: values.instanceName?.trim(),
      instanceType: values.instanceType?.trim(),
      imageId: values.imageId?.trim(),
      keyId: values.keyId?.trim(),
      count: values.count,
      publicIpAssigned: values.publicIpAssigned,
      internetChargeType: values.internetChargeType?.trim(),
      bandwidthOutMbps: values.bandwidthOutMbps,
    });

    return cleanupObject({
      account_id: values.account_id,
      region: values.region?.trim(),
      payload: Object.keys(mergedPayload).length ? mergedPayload : undefined,
    });
  };

  const columns: ProColumns<API.AssetMachine>[] = [
    { title: 'Machine ID', dataIndex: 'machine_id', width: 160 },
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    { title: 'Account', dataIndex: 'account_name', renderText: formatText },
    { title: 'Region', dataIndex: 'region', renderText: formatText },
    { title: 'Instance Type', dataIndex: 'instance_type', renderText: formatText },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => <Tag color="blue">{record.status || '-'}</Tag>,
    },
    { title: 'Source', dataIndex: 'source', renderText: formatText },
    { title: 'Sync Status', dataIndex: 'sync_status', renderText: formatText },
    {
      title: 'IPs',
      dataIndex: 'ips',
      render: (_, record) =>
        record.ips?.length ? (
          <Space wrap>
            {record.ips.map((item) => (
              <Tag key={item.id} color={item.is_primary ? 'green' : 'default'}>
                {item.ip || '-'}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    { title: 'Last Synced', dataIndex: 'last_synced_at', renderText: formatTime },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => {
        const provider = providerMap.get(record.provider_code || '');
        const destroySupported = isProviderCapabilitySupported(provider, MACHINE_DESTROY_ACTION_KEYS);
        const syncSupported = isProviderCapabilitySupported(provider, MACHINE_SYNC_ACTION_KEYS);
        const destroyDisabledReason = !record.external_instance_id
          ? 'This machine does not have an external instance id.'
          : destroySupported === false
            ? 'Current provider capability does not support destroy instance.'
            : undefined;
        const syncDisabledReason =
          syncSupported === false
            ? 'Current provider capability does not support sync.'
            : undefined;

        return [
          <a key="detail" onClick={() => void loadMachineDetail(record.id, 'basic')}>
            Detail
          </a>,
          <a
            key="edit"
            onClick={async () => {
              try {
                const response = await getAssetMachineDetail(record.id);
                setEditing(response.data);
                manualForm.setFieldsValue({
                  machine_id: response.data.machine_id,
                  name: response.data.name || '',
                  region: response.data.region || undefined,
                  zone: response.data.zone || undefined,
                  instance_type: response.data.instance_type || undefined,
                  image_id: response.data.image_id || undefined,
                  billing_type: response.data.billing_type || undefined,
                  status: response.data.status || undefined,
                  external_instance_id: response.data.external_instance_id || undefined,
                  metadata_text: stringifyJson(response.data.metadata),
                  cpu_cores: response.data.spec?.cpu_cores,
                  memory_mb: response.data.spec?.memory_mb,
                  disk_gb: response.data.spec?.disk_gb,
                  bandwidth_mbps: response.data.spec?.bandwidth_mbps,
                  spec_text: stringifyJson(response.data.spec?.spec),
                });
                setManualOpen(true);
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            Edit
          </a>,
          renderActionButton(
            <a
              key="sync"
              onClick={async () => {
                try {
                  const response = await syncAssetMachine(record.id);
                  onTaskAck(response.data, `Machine #${record.id} sync submitted.`);
                } catch (error: any) {
                  message.error(normalizeDevErrorMessage(error));
                }
              }}
            >
              Sync
            </a>,
            syncDisabledReason,
          ),
          <a key="bind" onClick={() => void loadMachineDetail(record.id, 'ip-bindings')}>
            Bind IP
          </a>,
          renderActionButton(
            <a
              key="destroy"
              onClick={() => {
                let confirmValue = '';
                modal.confirm({
                  title: `Destroy provider instance for machine ${record.name || record.machine_id || record.id}`,
                  content: (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Text type="secondary">
                        Enter the external instance id to confirm this irreversible action.
                      </Text>
                      <Paragraph copyable>{record.external_instance_id}</Paragraph>
                      <Input
                        placeholder="External instance id"
                        onChange={(event) => {
                          confirmValue = event.target.value;
                        }}
                      />
                    </Space>
                  ),
                  okText: 'Destroy',
                  okButtonProps: { danger: true },
                  onOk: async () => {
                    if (confirmValue !== record.external_instance_id) {
                      message.error('External instance id does not match.');
                      throw new Error('Confirmation mismatch');
                    }
                    try {
                      const response = await destroyProviderAssetMachine(record.id, {
                        confirm_instance_id: confirmValue,
                      });
                      onTaskAck(
                        response.data,
                        `Destroy request for machine #${record.id} submitted.`,
                      );
                    } catch (error: any) {
                      message.error(normalizeDevErrorMessage(error));
                      throw error;
                    }
                  },
                });
              }}
            >
              Destroy Cloud Instance
            </a>,
            destroyDisabledReason,
          ),
          <Popconfirm
            key="delete"
            title="Delete local machine record?"
            onConfirm={async () => {
              try {
                await deleteAssetMachine(record.id);
                message.success('Machine record deleted.');
                actionRef.current?.reload();
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            <a>Delete</a>
          </Popconfirm>,
        ];
      },
    },
  ];

  const noAccountReason = filteredAccounts.length === 0 ? 'Create a provider account first.' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No provider account available"
          description="Create a provider account first, then return here for provider-side create, import and SSH actions."
        />
      ) : null}

      <ProTable<API.AssetMachine>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        request={async (params) => {
          try {
            const response = await listAssetMachines({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
              region: filters.region,
              status: filters.status,
            });
            return {
              data: response.data?.items || [],
              success: true,
              total: response.data?.total || 0,
            };
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => {
          const createButton = renderActionButton(
            <Button
              key="provider-create"
              icon={<CloudUploadOutlined />}
              onClick={() => {
                providerForm.resetFields();
                providerForm.setFieldsValue({
                  account_id: filters.account_id,
                  region: filters.region,
                  count: 1,
                  publicIpAssigned: true,
                });
                setProviderOpen(true);
              }}
            >
              Create From Provider
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_CREATE_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider-side create.'
                : undefined),
          );

          const importButton = renderActionButton(
            <Button
              key="import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                setImportAccountId(filters.account_id);
                setImportRegion(filters.region);
                setImportOpen(true);
              }}
            >
              Import From Provider
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_IMPORT_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider-side import.'
                : undefined),
          );

          return [
            <Button
              key="manual"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                manualForm.resetFields();
                manualForm.setFieldsValue({
                  region: filters.region,
                  status: 'active',
                });
                setManualOpen(true);
              }}
            >
              Create Manual
            </Button>,
            createButton,
            importButton,
            renderActionButton(
              <Button
                key="command"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  commandForm.resetFields();
                  commandForm.setFieldsValue({ port: 22, timeout_seconds: 60, confirmed: false });
                  setCommandOpen(true);
                }}
              >
                Run Command
              </Button>,
              selectedRows.length ? undefined : 'Select machines first.',
            ),
            <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
              Refresh
            </Button>,
          ];
        }}
      />

      <Modal
        title={editing ? `Edit Machine #${editing.id}` : 'Create Manual Machine'}
        open={manualOpen}
        destroyOnHidden
        width={880}
        confirmLoading={saving}
        onCancel={() => {
          setManualOpen(false);
          setEditing(null);
          manualForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await manualForm.validateFields();
            const payload = buildMachinePayload(values);
            setSaving(true);
            if (editing) {
              await updateAssetMachine({
                id: editing.id,
                name: payload.name,
                region: payload.region,
                zone: payload.zone,
                instance_type: payload.instance_type,
                image_id: payload.image_id,
                billing_type: payload.billing_type,
                status: payload.status,
                metadata: payload.metadata,
                spec: payload.spec,
              });
              message.success('Machine updated.');
            } else {
              await createAssetMachineManual(payload as API.AssetMachineCreateManualParams);
              message.success('Machine created.');
            }
            setManualOpen(false);
            setEditing(null);
            manualForm.resetFields();
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<MachineFormValues> form={manualForm} layout="vertical">
          {!editing ? (
            <Form.Item
              name="machine_id"
              label="Machine ID"
              rules={[{ required: true, message: 'Please enter machine id.' }]}
            >
              <Input />
            </Form.Item>
          ) : (
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Machine ID">{editing.machine_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="External Instance ID">
                {editing.external_instance_id || '-'}
              </Descriptions.Item>
            </Descriptions>
          )}
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name.' }]}>
            <Input />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="region" label="Region" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="zone" label="Zone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="instance_type" label="Instance Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="image_id" label="Image ID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="billing_type" label="Billing Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={MACHINE_STATUS_OPTIONS} />
            </Form.Item>
          </Space>
          {!editing ? (
            <Form.Item name="external_instance_id" label="External Instance ID">
              <Input />
            </Form.Item>
          ) : null}
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Spec
          </Text>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="cpu_cores" label="CPU Cores" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="memory_mb" label="Memory MiB" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="disk_gb" label="Disk GiB" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="bandwidth_mbps" label="Bandwidth Mbps" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
          </Space>
          <Form.Item name="spec_text" label="Spec Advanced JSON">
            <TextArea rows={5} placeholder='{"provider_spec": {...}}' />
          </Form.Item>
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Machine From Provider"
        open={providerOpen}
        destroyOnHidden
        width={840}
        confirmLoading={saving}
        onCancel={() => {
          setProviderOpen(false);
          providerForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await providerForm.validateFields();
            setSaving(true);
            const response = await createAssetMachineFromProvider(
              buildProviderPayload(values) as API.AssetMachineCreateFromProviderParams,
            );
            setProviderOpen(false);
            providerForm.resetFields();
            onTaskAck(response.data, 'Provider-side machine create submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<MachineProviderFormValues> form={providerForm} layout="vertical">
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="account_id"
              label="Provider Account"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Please select account.' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={filteredAccounts.map((item) => ({
                  label: `${item.name} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
            <Form.Item name="region" label="Region" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="instanceName" label="Instance Name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="instanceType" label="Instance Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="imageId" label="Image ID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="keyId" label="Key ID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="count" label="Count" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} precision={0} />
            </Form.Item>
            <Form.Item name="internetChargeType" label="Internet Charge Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="bandwidthOutMbps" label="Bandwidth Out Mbps" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
          </Space>
          <Form.Item name="publicIpAssigned" label="Assign Public IP" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="payload_text" label="Advanced Provider Payload JSON">
            <TextArea rows={6} placeholder='{"subnetId": "...", "securityGroupId": "..."}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import Machines From Provider"
        open={importOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => setImportOpen(false)}
        onOk={async () => {
          if (!importAccountId) {
            message.error('Please select provider account.');
            return;
          }
          try {
            setSaving(true);
            const response = await importAssetMachinesFromProvider({
              account_id: importAccountId,
              region: importRegion?.trim() || undefined,
            });
            setImportOpen(false);
            onTaskAck(response.data, 'Provider-side machine import submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Select
            showSearch
            value={importAccountId}
            optionFilterProp="label"
            options={filteredAccounts.map((item) => ({
              label: `${item.name} (#${item.id})`,
              value: item.id,
            }))}
            onChange={setImportAccountId}
            placeholder="Select account"
          />
          <Input
            value={importRegion}
            onChange={(event) => setImportRegion(event.target.value)}
            placeholder="Region"
          />
        </Space>
      </Modal>

      <Modal
        title={`Run Command on ${selectedRows.length} Machine(s)`}
        open={commandOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setCommandOpen(false);
          commandForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await commandForm.validateFields();
            if (!values.confirmed) {
              message.error('Please confirm this high-risk action.');
              return;
            }
            setSaving(true);
            const response = await runAssetMachineCommand({
              machine_ids: selectedRows.map((item) => item.id),
              ssh_key_id: values.ssh_key_id,
              username: values.username.trim(),
              port: values.port,
              command: values.command,
              timeout_seconds: values.timeout_seconds,
            });
            setCommandOpen(false);
            commandForm.resetFields();
            setSelectedRows([]);
            onTaskAck(response.data, 'Batch command submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 16 }}>
          {selectedRows.length ? (
            <Alert
              type="warning"
              showIcon
              message={`Selected machines: ${selectedRows.map((item) => item.name || item.machine_id || item.id).join(', ')}`}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select machines in the table first." />
          )}
        </Space>
        <Form<MachineCommandFormValues> form={commandForm} layout="vertical">
          <Form.Item
            name="ssh_key_id"
            label="SSH Key"
            rules={[{ required: true, message: 'Please select SSH key.' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={availableSshKeys.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item
              name="username"
              label="Username"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Please enter username.' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="port" label="Port" style={{ width: 160 }}>
              <InputNumber style={{ width: '100%' }} precision={0} min={1} />
            </Form.Item>
            <Form.Item name="timeout_seconds" label="Timeout Seconds" style={{ width: 180 }}>
              <InputNumber style={{ width: '100%' }} precision={0} min={1} />
            </Form.Item>
          </Space>
          <Form.Item
            name="command"
            label="Command"
            rules={[{ required: true, message: 'Please enter command.' }]}
          >
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item
            name="confirmed"
            valuePropName="checked"
            rules={[
              {
                validator: async (_, value) => {
                  if (value) {
                    return;
                  }
                  throw new Error('Please confirm this high-risk action.');
                },
              },
            ]}
          >
            <Checkbox>I understand this command will run on all selected machines.</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `Machine #${detail.id}` : 'Machine Detail'}
        open={Boolean(detail)}
        width={960}
        onClose={() => {
          setDetail(null);
          setBindOptions([]);
          bindForm.resetFields();
        }}
      >
        {detail ? (
          <Tabs
            activeKey={detailTab}
            onChange={(key) => {
              setDetailTab(key);
              if (key === 'ip-bindings') {
                void loadBindOptions(detail);
              }
            }}
            items={[
              {
                key: 'basic',
                label: 'Basic',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Machine ID">{detail.machine_id || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Name">{detail.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Account">{detail.account_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Region">{detail.region || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Zone">{detail.zone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Instance Type">
                      {detail.instance_type || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Source">{detail.source || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Sync Status">{detail.sync_status || '-'}</Descriptions.Item>
                    <Descriptions.Item label="External Instance ID">
                      {detail.external_instance_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Synced">
                      {formatTime(detail.last_synced_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="CPU Cores">
                      {formatText(detail.spec?.cpu_cores)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Memory MiB">
                      {formatText(detail.spec?.memory_mb)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Disk GiB">
                      {formatText(detail.spec?.disk_gb)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bandwidth Mbps">
                      {formatText(detail.spec?.bandwidth_mbps)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'ip-bindings',
                label: 'IP Bindings',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Form<API.AssetMachineBindIpParams>
                      form={bindForm}
                      layout="vertical"
                      onFinish={async (values) => {
                        try {
                          await bindAssetMachineIp(detail.id, values);
                          message.success('IP binding created.');
                          bindForm.resetFields();
                          await loadMachineDetail(detail.id, 'ip-bindings');
                        } catch (error: any) {
                          message.error(normalizeDevErrorMessage(error));
                        }
                      }}
                    >
                      <Space size={16} align="start" style={{ width: '100%' }}>
                        <Form.Item
                          name="ip_id"
                          label="IP"
                          style={{ flex: 1 }}
                          rules={[{ required: true, message: 'Please select IP.' }]}
                        >
                          <Select
                            loading={bindLoading}
                            showSearch
                            optionFilterProp="label"
                            options={bindOptions.map((item) => ({
                              label: `${item.ip} (#${item.id}) ${item.status ? `[${item.status}]` : ''}`,
                              value: item.id,
                            }))}
                          />
                        </Form.Item>
                        <Form.Item name="bind_type" label="Bind Type" style={{ width: 180 }}>
                          <Input placeholder="manual" />
                        </Form.Item>
                        <Form.Item name="provider_binding_id" label="Provider Binding ID" style={{ flex: 1 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item name="is_primary" label="Primary" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Space>
                      <Button type="primary" htmlType="submit">
                        Bind IP
                      </Button>
                    </Form>
                    <ProTable<API.AssetMachineIpBinding>
                      rowKey="id"
                      search={false}
                      options={false}
                      pagination={false}
                      dataSource={detail.ips || []}
                      columns={[
                        { title: 'IP', dataIndex: 'ip', renderText: formatText },
                        { title: 'Bind Type', dataIndex: 'bind_type', renderText: formatText },
                        {
                          title: 'Primary',
                          dataIndex: 'is_primary',
                          render: (_, record) => (record.is_primary ? <Tag color="green">Primary</Tag> : '-'),
                        },
                        { title: 'Status', dataIndex: 'status', renderText: formatText },
                        { title: 'Bound At', dataIndex: 'bound_at', renderText: formatTime },
                        {
                          title: 'Actions',
                          valueType: 'option',
                          render: (_, record) => {
                            const provider = providerMap.get(detail.provider_code || '');
                            const switchSupported = isProviderCapabilitySupported(
                              provider,
                              IP_SWITCH_PRIMARY_ACTION_KEYS,
                            );
                            return [
                              renderActionButton(
                                <a
                                  key="primary"
                                  onClick={async () => {
                                    try {
                                      await switchPrimaryAssetMachineIp(detail.id, { ip_id: record.ip_id || 0 });
                                      message.success('Primary IP switched.');
                                      await loadMachineDetail(detail.id, 'ip-bindings');
                                    } catch (error: any) {
                                      message.error(normalizeDevErrorMessage(error));
                                    }
                                  }}
                                >
                                  Set Primary
                                </a>,
                                switchSupported === false
                                  ? 'Current provider capability does not support primary IP switching.'
                                  : undefined,
                              ),
                              <Popconfirm
                                key="unbind"
                                title="Unbind this IP?"
                                onConfirm={async () => {
                                  try {
                                    await unbindAssetMachineIp(detail.id, { ip_id: record.ip_id || 0 });
                                    message.success('IP unbound.');
                                    await loadMachineDetail(detail.id, 'ip-bindings');
                                  } catch (error: any) {
                                    message.error(normalizeDevErrorMessage(error));
                                  }
                                }}
                              >
                                <a>Unbind</a>
                              </Popconfirm>,
                            ];
                          },
                        },
                      ]}
                    />
                  </Space>
                ),
              },
              {
                key: 'metadata',
                label: 'Metadata',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <JsonBlock title="metadata" value={detail.metadata} />
                    <JsonBlock title="spec.extra" value={detail.spec?.spec} />
                  </Space>
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>
    </>
  );
};

const IpTab: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, onTaskAck }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<IpFormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetIp | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<API.AssetIp | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importAccountId, setImportAccountId] = useState<number | undefined>(filters.account_id);
  const [importRegion, setImportRegion] = useState<string | undefined>(filters.region);

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );

  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (item) => !filters.provider_code || item.provider_code === filters.provider_code,
      ),
    [accounts, filters.provider_code],
  );

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const buildIpPayload = (values: IpFormValues) =>
    cleanupObject({
      ip: values.ip?.trim(),
      ip_version: values.ip_version,
      type: values.type?.trim(),
      source: values.source?.trim(),
      region: values.region?.trim(),
      status: values.status?.trim(),
      ownership: values.ownership?.trim(),
      external_ip_id: values.external_ip_id?.trim(),
      metadata: parseJsonText(values.metadata_text, 'Metadata'),
    });

  const columns: ProColumns<API.AssetIp>[] = [
    { title: 'IP', dataIndex: 'ip' },
    { title: 'Version', dataIndex: 'ip_version', width: 90 },
    { title: 'Type', dataIndex: 'type', renderText: formatText },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    { title: 'Account', dataIndex: 'account_name', renderText: formatText },
    { title: 'Region', dataIndex: 'region', renderText: formatText },
    { title: 'Status', dataIndex: 'status', render: (_, record) => <Tag>{record.status || '-'}</Tag> },
    { title: 'Ownership', dataIndex: 'ownership', renderText: formatText },
    { title: 'External IP ID', dataIndex: 'external_ip_id', renderText: formatText },
    { title: 'Updated At', dataIndex: 'updated_at', renderText: formatTime },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={async () => {
            try {
              const response = await getAssetIpDetail(record.id);
              setDetail(response.data);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          Detail
        </a>,
        <a
          key="edit"
          onClick={async () => {
            try {
              const response = await getAssetIpDetail(record.id);
              const current = response.data;
              setEditing(current);
              form.setFieldsValue({
                ip: current.ip,
                ip_version: current.ip_version,
                type: current.type,
                source: current.source,
                region: current.region,
                status: current.status,
                ownership: current.ownership,
                external_ip_id: current.external_ip_id,
                metadata_text: stringifyJson(current.metadata),
              });
              setOpen(true);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          Edit
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this IP record?"
          onConfirm={async () => {
            try {
              await deleteAssetIp(record.id);
              message.success('IP deleted.');
              actionRef.current?.reload();
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          <a>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  const noAccountReason = filteredAccounts.length === 0 ? 'Create a provider account first.' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No provider account available"
          description="Create a provider account first, then return here for provider-side IP import."
        />
      ) : null}

      <ProTable<API.AssetIp>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetIps({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
              region: filters.region,
              status: filters.status,
            });
            return {
              data: response.data?.items || [],
              success: true,
              total: response.data?.total || 0,
            };
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => [
          <Button
            key="manual"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ ip_version: 4, source: 'manual', status: 'available' });
              setOpen(true);
            }}
          >
            Import Manual
          </Button>,
          renderActionButton(
            <Button
              key="provider-import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                setImportAccountId(filters.account_id);
                setImportRegion(filters.region);
                setImportOpen(true);
              }}
            >
              Import From Provider
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(providerMap.get(filters.provider_code), IP_IMPORT_ACTION_KEYS) ===
                false
                ? 'Current provider capability does not support provider-side IP import.'
                : undefined),
          ),
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            Refresh
          </Button>,
        ]}
      />

      <Modal
        title={editing ? `Edit IP #${editing.id}` : 'Import Manual IP'}
        open={open}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const payload = buildIpPayload(values);
            setSaving(true);
            if (editing) {
              await updateAssetIp({
                id: editing.id,
                type: payload.type,
                region: payload.region,
                status: payload.status,
                ownership: payload.ownership,
                external_ip_id: payload.external_ip_id,
                metadata: payload.metadata,
              });
              message.success('IP updated.');
            } else {
              await importAssetIpManual(payload as API.AssetIpImportManualParams);
              message.success('IP imported.');
            }
            setOpen(false);
            setEditing(null);
            form.resetFields();
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<IpFormValues> form={form} layout="vertical">
          <Form.Item
            name="ip"
            label="IP"
            rules={!editing ? [{ required: true, message: 'Please enter IP.' }] : []}
          >
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="ip_version" label="IP Version" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="type" label="Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="source" label="Source" style={{ flex: 1 }}>
              <Input disabled={Boolean(editing)} />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="region" label="Region" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={IP_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="ownership" label="Ownership" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="external_ip_id" label="External IP ID">
            <Input />
          </Form.Item>
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import IPs From Provider"
        open={importOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => setImportOpen(false)}
        onOk={async () => {
          if (!importAccountId) {
            message.error('Please select provider account.');
            return;
          }
          try {
            setSaving(true);
            const response = await importAssetIpsFromProvider({
              account_id: importAccountId,
              region: importRegion?.trim() || undefined,
            });
            setImportOpen(false);
            onTaskAck(response.data, 'Provider-side IP import submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Select
            showSearch
            value={importAccountId}
            optionFilterProp="label"
            options={filteredAccounts.map((item) => ({
              label: `${item.name} (#${item.id})`,
              value: item.id,
            }))}
            onChange={setImportAccountId}
            placeholder="Select account"
          />
          <Input
            value={importRegion}
            onChange={(event) => setImportRegion(event.target.value)}
            placeholder="Region"
          />
        </Space>
      </Modal>

      <Drawer
        title={detail ? `IP #${detail.id}` : 'IP Detail'}
        open={Boolean(detail)}
        width={720}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} title="Basic">
              <Descriptions.Item label="IP">{detail.ip || '-'}</Descriptions.Item>
              <Descriptions.Item label="IP Version">{formatText(detail.ip_version)}</Descriptions.Item>
              <Descriptions.Item label="Type">{detail.type || '-'}</Descriptions.Item>
              <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="Account">{detail.account_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Region">{detail.region || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
              <Descriptions.Item label="Ownership">{detail.ownership || '-'}</Descriptions.Item>
              <Descriptions.Item label="External IP ID">
                {detail.external_ip_id || '-'}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions bordered column={1} title="Machine Binding">
              <Descriptions.Item label="Machine">
                {detail.machine_binding?.machine_business_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Machine Local ID">
                {formatText(detail.machine_binding?.machine_id)}
              </Descriptions.Item>
              <Descriptions.Item label="Bind Type">
                {detail.machine_binding?.bind_type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Primary">
                {formatText(detail.machine_binding?.is_primary)}
              </Descriptions.Item>
              <Descriptions.Item label="Bound At">
                {formatTime(detail.machine_binding?.bound_at)}
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock title="metadata" value={detail.metadata} />
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

const SshKeyTab: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, onTaskAck }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [customForm] = Form.useForm<SshKeyCustomFormValues>();
  const [providerForm] = Form.useForm<SshKeyProviderFormValues>();
  const [editForm] = Form.useForm<SshKeyEditFormValues>();
  const [customOpen, setCustomOpen] = useState(false);
  const [providerImportOpen, setProviderImportOpen] = useState(false);
  const [providerCreateOpen, setProviderCreateOpen] = useState(false);
  const [providerBatchOpen, setProviderBatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detail, setDetail] = useState<API.AssetSshKey | null>(null);
  const [editing, setEditing] = useState<API.AssetSshKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchAccountId, setBatchAccountId] = useState<number | undefined>(filters.account_id);

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );

  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (item) => !filters.provider_code || item.provider_code === filters.provider_code,
      ),
    [accounts, filters.provider_code],
  );

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetSshKey>[] = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Scope', dataIndex: 'scope', renderText: formatText },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    { title: 'Account', dataIndex: 'account_name', renderText: formatText },
    { title: 'External Key ID', dataIndex: 'external_key_id', renderText: formatText },
    { title: 'Fingerprint', dataIndex: 'fingerprint', renderText: formatText },
    {
      title: 'Private Key',
      dataIndex: 'has_private_key',
      render: (_, record) =>
        record.has_private_key ? <Tag color="green">Present</Tag> : <Tag>Not Stored</Tag>,
    },
    { title: 'Status', dataIndex: 'status', render: (_, record) => <Tag>{record.status || '-'}</Tag> },
    { title: 'Updated At', dataIndex: 'updated_at', renderText: formatTime },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={async () => {
            try {
              const response = await getAssetSshKeyDetail(record.id);
              setDetail(response.data);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          Detail
        </a>,
        <a
          key="edit"
          onClick={async () => {
            try {
              const response = await getAssetSshKeyDetail(record.id);
              const current = response.data;
              setEditing(current);
              editForm.setFieldsValue({
                name: current.name || '',
                scope: current.scope || undefined,
                status: current.status || undefined,
                public_key: current.public_key || undefined,
                metadata_text: stringifyJson(current.metadata),
              });
              setEditOpen(true);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          Edit
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this SSH key?"
          onConfirm={async () => {
            try {
              await deleteAssetSshKey(record.id);
              message.success('SSH key deleted.');
              actionRef.current?.reload();
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          <a>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  const noAccountReason = filteredAccounts.length === 0 ? 'Create a provider account first.' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No provider account available"
          description="Create a provider account first, then return here for provider-side SSH key operations."
        />
      ) : null}

      <ProTable<API.AssetSshKey>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetSshKeys({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
              status: filters.status,
            });
            return {
              data: response.data?.items || [],
              success: true,
              total: response.data?.total || 0,
            };
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => [
          <Button
            key="custom"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              customForm.resetFields();
              setCustomOpen(true);
            }}
          >
            Create Custom Key
          </Button>,
          renderActionButton(
            <Button
              key="single-import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                providerForm.resetFields();
                providerForm.setFieldsValue({ account_id: filters.account_id });
                setProviderImportOpen(true);
              }}
            >
              Import Single Provider Key
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(providerMap.get(filters.provider_code), SSH_IMPORT_ACTION_KEYS) ===
                false
                ? 'Current provider capability does not support provider-side SSH import.'
                : undefined),
          ),
          renderActionButton(
            <Button
              key="batch-import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                setBatchAccountId(filters.account_id);
                setProviderBatchOpen(true);
              }}
            >
              Import From Provider
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(providerMap.get(filters.provider_code), SSH_IMPORT_ACTION_KEYS) ===
                false
                ? 'Current provider capability does not support provider-side SSH import.'
                : undefined),
          ),
          renderActionButton(
            <Button
              key="provider-create"
              icon={<CloudUploadOutlined />}
              onClick={() => {
                providerForm.resetFields();
                providerForm.setFieldsValue({ account_id: filters.account_id });
                setProviderCreateOpen(true);
              }}
            >
              Create Provider Key
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(providerMap.get(filters.provider_code), SSH_CREATE_ACTION_KEYS) ===
                false
                ? 'Current provider capability does not support provider-side SSH create.'
                : undefined),
          ),
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            Refresh
          </Button>,
        ]}
      />

      <Modal
        title="Create Custom SSH Key"
        open={customOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setCustomOpen(false);
          customForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await customForm.validateFields();
            setSaving(true);
            await createAssetSshKeyCustom({
              name: values.name.trim(),
              public_key: values.public_key.trim(),
              private_key: values.private_key?.trim() || undefined,
              metadata: parseJsonText(values.metadata_text, 'Metadata'),
            });
            setCustomOpen(false);
            customForm.resetFields();
            message.success('Custom SSH key created.');
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyCustomFormValues> form={customForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name.' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="public_key"
            label="Public Key"
            rules={[{ required: true, message: 'Please enter public key.' }]}
          >
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item name="private_key" label="Private Key">
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import Single Provider SSH Key"
        open={providerImportOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setProviderImportOpen(false);
          providerForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await providerForm.validateFields();
            setSaving(true);
            await importAssetProviderSshKey({
              account_id: values.account_id,
              name: values.name.trim(),
              external_key_id: values.external_key_id?.trim() || undefined,
              public_key: values.public_key?.trim() || undefined,
              payload: parseJsonText(values.payload_text, 'Payload'),
            });
            setProviderImportOpen(false);
            providerForm.resetFields();
            message.success('Provider SSH key metadata imported.');
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyProviderFormValues> form={providerForm} layout="vertical">
          <Form.Item
            name="account_id"
            label="Provider Account"
            rules={[{ required: true, message: 'Please select account.' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={filteredAccounts.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="External Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="Public Key">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="payload_text" label="Advanced Payload JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Provider SSH Key"
        open={providerCreateOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setProviderCreateOpen(false);
          providerForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await providerForm.validateFields();
            setSaving(true);
            const response = await createAssetProviderSshKey({
              account_id: values.account_id,
              name: values.name.trim(),
              external_key_id: values.external_key_id?.trim() || undefined,
              public_key: values.public_key?.trim() || undefined,
              payload: parseJsonText(values.payload_text, 'Payload'),
            });
            setProviderCreateOpen(false);
            providerForm.resetFields();
            onTaskAck(response.data, 'Provider-side SSH key create submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyProviderFormValues> form={providerForm} layout="vertical">
          <Form.Item
            name="account_id"
            label="Provider Account"
            rules={[{ required: true, message: 'Please select account.' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={filteredAccounts.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="External Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="Public Key">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="payload_text" label="Advanced Payload JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import SSH Keys From Provider"
        open={providerBatchOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => setProviderBatchOpen(false)}
        onOk={async () => {
          if (!batchAccountId) {
            message.error('Please select provider account.');
            return;
          }
          try {
            setSaving(true);
            const response = await importAssetSshKeysFromProvider({ account_id: batchAccountId });
            setProviderBatchOpen(false);
            onTaskAck(response.data, 'Provider-side SSH key import submitted.');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Select
          showSearch
          value={batchAccountId}
          optionFilterProp="label"
          options={filteredAccounts.map((item) => ({
            label: `${item.name} (#${item.id})`,
            value: item.id,
          }))}
          onChange={setBatchAccountId}
          placeholder="Select account"
        />
      </Modal>

      <Modal
        title={editing ? `Edit SSH Key #${editing.id}` : 'Edit SSH Key'}
        open={editOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
          editForm.resetFields();
        }}
        onOk={async () => {
          if (!editing) {
            return;
          }
          try {
            const values = await editForm.validateFields();
            setSaving(true);
            await updateAssetSshKey({
              id: editing.id,
              name: values.name.trim(),
              scope: values.scope?.trim() || undefined,
              status: values.status?.trim() || undefined,
              public_key: values.public_key?.trim() || undefined,
              metadata: parseJsonText(values.metadata_text, 'Metadata'),
            });
            setEditOpen(false);
            setEditing(null);
            editForm.resetFields();
            message.success('SSH key updated.');
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyEditFormValues> form={editForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter name.' }]}>
            <Input />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="scope" label="Scope" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={SSH_KEY_STATUS_OPTIONS} />
            </Form.Item>
          </Space>
          <Form.Item name="public_key" label="Public Key">
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `SSH Key #${detail.id}` : 'SSH Key Detail'}
        open={Boolean(detail)}
        width={760}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{detail.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Scope">{detail.scope || '-'}</Descriptions.Item>
              <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="Account">{detail.account_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="External Key ID">
                {detail.external_key_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Fingerprint">
                {detail.fingerprint || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Private Key">
                {detail.has_private_key ? 'Stored' : 'Not Stored'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
            </Descriptions>
            <JsonBlock title="public_key" value={detail.public_key || ''} />
            <JsonBlock title="metadata" value={detail.metadata} />
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

const AssetsContent: React.FC = () => {
  const { message, notification } = App.useApp();
  const [activeTab, setActiveTab] = useState<AssetTabKey>('accounts');
  const [filters, setFilters] = useState<SharedFilters>({});
  const [providers, setProviders] = useState<API.AssetProvider[]>([]);
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [sshKeys, setSshKeys] = useState<API.AssetSshKey[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const loadProviders = async () => {
    const response = await listAssetProviders({ page: 1, page_size: 200 });
    setProviders(response.data?.items || []);
  };

  const loadAccountsCatalog = async () => {
    const response = await listAssetProviderAccounts({ page: 1, page_size: 200 });
    setAccounts(response.data?.items || []);
  };

  const loadSshKeyCatalog = async () => {
    const response = await listAssetSshKeys({ page: 1, page_size: 200 });
    setSshKeys(response.data?.items || []);
  };

  const reloadReferenceData = async () => {
    setLoadingMeta(true);
    try {
      await Promise.all([loadProviders(), loadAccountsCatalog(), loadSshKeyCatalog()]);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    void reloadReferenceData();
  }, []);

  const handleTaskAck = (ack: API.AssetTaskAck, title: string) => {
    notification.success({
      message: title,
      description: `Task ID: ${ack.task_id}, status: ${ack.status || 'pending'}.`,
      btn: (
        <Button size="small" onClick={() => history.push(`/dev/asset-operations?task_id=${ack.task_id}`)}>
          View Operations
        </Button>
      ),
    });
    history.push(`/dev/asset-operations?task_id=${ack.task_id}`);
  };

  const handleJumpToTab: JumpToTabHandler = (tab, accountId) => {
    setActiveTab(tab);
    setFilters((current) => ({
      ...current,
      account_id: accountId,
    }));
  };

  return (
    <PageContainer
      extra={[
        <Button key="reload-meta" icon={<ReloadOutlined />} loading={loadingMeta} onClick={() => void reloadReferenceData()}>
          Reload Reference Data
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <SharedFilterBar
          activeTab={activeTab}
          filters={filters}
          providers={providers}
          accounts={accounts}
          onApply={setFilters}
          onReset={() => setFilters({})}
        />
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as AssetTabKey)}
          items={[
            {
              key: 'accounts',
              label: '供应商账号',
              children: (
                <AccountTab
                  filters={filters}
                  providers={providers}
                  onAccountCatalogChanged={async () => {
                    await Promise.all([loadAccountsCatalog(), loadSshKeyCatalog()]);
                  }}
                  onJumpToTab={handleJumpToTab}
                />
              ),
            },
            {
              key: 'machines',
              label: '机器',
              children: (
                <MachineTab
                  filters={filters}
                  providers={providers}
                  accounts={accounts}
                  sshKeys={sshKeys}
                  onTaskAck={handleTaskAck}
                />
              ),
            },
            {
              key: 'ips',
              label: 'IP',
              children: (
                <IpTab
                  filters={filters}
                  providers={providers}
                  accounts={accounts}
                  onTaskAck={handleTaskAck}
                />
              ),
            },
            {
              key: 'ssh-keys',
              label: 'SSH 密钥',
              children: (
                <SshKeyTab
                  filters={filters}
                  providers={providers}
                  accounts={accounts}
                  onTaskAck={async (ack, title) => {
                    await loadSshKeyCatalog();
                    handleTaskAck(ack, title);
                  }}
                />
              ),
            },
          ]}
        />
      </Space>
    </PageContainer>
  );
};

const AssetsPage: React.FC = () => (
  <DevAuthGate>
    <AssetsContent />
  </DevAuthGate>
);

export default AssetsPage;
