import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Dropdown,
  Form,
  Modal,
  Select,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  batchDeleteAssetMachines,
  batchSyncAssetMachines,
  batchUpdateAssetMachineStatus,
  batchUpdateAssetMachineTags,
  deleteAssetMachine,
  destroyProviderAssetMachine,
  getAssetMachineDetail,
  importAssetMachineFromProvider,
  listAssetIps,
  listAssetMachines,
  runAssetMachineCommand,
  syncAssetMachine,
} from '@/services/asset-service/api';
import {
  MACHINE_CREATE_ACTION_KEYS,
  MACHINE_DESTROY_ACTION_KEYS,
  MACHINE_IMPORT_ACTION_KEYS,
  MACHINE_STATUS_OPTIONS,
  MACHINE_SYNC_ACTION_KEYS,
} from '../../constants';
import type {
  AssetTagFormValue,
  MachineCommandFormValues,
  SharedFilters,
  TaskAckHandler,
} from '../../types';
import {
  buildAssetTaskDetailPath,
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  getMachineStatusColor,
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';
import MachineCommandModal from '../machines/MachineCommandModal';
import MachineDetailDrawer from '../machines/MachineDetailDrawer';
import MachineProviderCreateModal from '../machines/MachineProviderCreateModal';
import MachineProviderImportModal from '../machines/MachineProviderImportModal';

const { Text } = Typography;

const QUICK_STATUS_OPTIONS = [
  { label: 'All Status', value: '__all' },
  { label: 'Failed', value: 'create_failed' },
  { label: 'Creating', value: 'creating' },
  { label: 'Active', value: 'active' },
  { label: 'Stopped', value: 'stopped' },
  { label: 'Missing', value: 'missing' },
];

const QUICK_SOURCE_OPTIONS = [
  { label: 'All Source', value: '__all' },
  { label: 'Provider Create', value: 'provider' },
  { label: 'Provider Import', value: 'import' },
  { label: 'Manual', value: 'manual' },
];

const SOURCE_LABEL_MAP: Record<string, string> = {
  provider: 'Provider Create',
  import: 'Provider Import',
  manual: 'Manual',
};

const compactCellStyle: React.CSSProperties = {
  minWidth: 0,
  lineHeight: '20px',
};

const compactCellStackStyle: React.CSSProperties = {
  ...compactCellStyle,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const compactCellMutedStyle: React.CSSProperties = {
  color: 'rgba(0, 0, 0, 0.45)',
  fontSize: 12,
  lineHeight: '18px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const controlPanelStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  border: '1px solid #dbeafe',
  borderRadius: 10,
  background: '#f8fbff',
};

const controlPanelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

type Props = {
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  onTaskAck: TaskAckHandler;
  onResetFilters: () => void;
  onApplyFilters: (filters: SharedFilters) => void;
};

const MachinesPanel: React.FC<Props> = ({
  filters,
  providers,
  accounts,
  sshKeys,
  onTaskAck,
  onResetFilters,
  onApplyFilters,
}) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [commandForm] = Form.useForm<MachineCommandFormValues>();
  const [bindForm] = Form.useForm<API.AssetMachineBindIpParams>();
  const [batchStatusForm] = Form.useForm<{ status?: string }>();
  const [batchTagForm] = Form.useForm<{ tags?: AssetTagFormValue[] }>();
  const [providerCreateOpen, setProviderCreateOpen] = useState(false);
  const [retryCreateOpen, setRetryCreateOpen] = useState(false);
  const [providerCreateInitialValues, setProviderCreateInitialValues] =
    useState<Partial<API.AssetMachineProviderCreateParams>>();
  const [importOpen, setImportOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchTagOpen, setBatchTagOpen] = useState(false);
  const [retrying, setRetrying] = useState<API.AssetMachine | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetMachine[]>([]);
  const [detail, setDetail] = useState<API.AssetMachine | null>(null);
  const [detailTab, setDetailTab] = useState('basic');
  const [bindOptions, setBindOptions] = useState<API.AssetIp[]>([]);
  const [bindLoading, setBindLoading] = useState(false);
  const [currentPageRows, setCurrentPageRows] = useState<API.AssetMachine[]>([]);
  const [importAccountId, setImportAccountId] = useState<number | undefined>(
    filters.account_id,
  );
  const [importProviderRegionId, setImportProviderRegionId] = useState<string | undefined>(
    filters.region,
  );

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
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
  const selectedIds = useMemo(() => selectedRows.map((item) => item.id), [selectedRows]);

  const activeFilterItems = useMemo(() => {
    const items: Array<{ key: string; label: string; value: string }> = [];
    if (filters.name) {
      items.push({ key: 'name', label: 'Machine', value: filters.name });
    }
    if (filters.provider_code) {
      items.push({
        key: 'provider',
        label: 'Provider',
        value: providerMap.get(filters.provider_code)?.name || filters.provider_code,
      });
    }
    if (filters.account_id) {
      items.push({
        key: 'account',
        label: 'Account',
        value: accountMap.get(filters.account_id)?.name || String(filters.account_id),
      });
    }
    if (filters.region) {
      items.push({ key: 'region', label: 'Region', value: filters.region });
    }
    if (filters.status) {
      items.push({ key: 'status', label: 'Status', value: filters.status });
    }
    if (filters.source) {
      items.push({
        key: 'source',
        label: 'Source',
        value: SOURCE_LABEL_MAP[filters.source] || filters.source,
      });
    }
    if (filters.tag_key || filters.tag_value) {
      items.push({
        key: 'tag',
        label: 'Tag',
        value: [filters.tag_key, filters.tag_value].filter(Boolean).join(' = '),
      });
    }
    return items;
  }, [accountMap, filters, providerMap]);

  const pageInsights = useMemo(() => {
    const failed = currentPageRows.filter(
      (item) =>
        Boolean(item.last_error_summary) ||
        item.status === 'create_failed' ||
        item.status === 'missing',
    ).length;
    const creating = currentPageRows.filter(
      (item) => item.status === 'creating' || item.status === 'preparing',
    ).length;
    const active = currentPageRows.filter((item) => item.status === 'active').length;
    return { failed, creating, active };
  }, [currentPageRows]);

  useEffect(() => {
    actionRef.current?.reload();
    setSelectedRows([]);
  }, [filters]);

  const getPrimaryIp = (record: API.AssetMachine) =>
    record.ips?.find((item) => item.is_primary) || record.ips?.[0];

  const loadMachineDetail = async (machineId: number, nextTab: string = 'basic') => {
    try {
      const response = await getAssetMachineDetail(machineId);
      setDetail(response.data);
      setDetailTab(nextTab);
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
      });
      setBindOptions(response.data?.items || []);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
      setBindOptions([]);
    } finally {
      setBindLoading(false);
    }
  };

  const canRetryProviderCreate = (record: API.AssetMachine) =>
    record.source === 'provider' &&
    !record.provider_machine_id &&
    ['preparing', 'creating', 'create_failed'].includes(record.status || '');

  const openRetryCreate = async (record: API.AssetMachine) => {
    try {
      const response = await getAssetMachineDetail(record.id);
      setRetrying(response.data);
      setRetryCreateOpen(true);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    }
  };

  const handleCreateSuccess = (ack: API.AssetTaskAck, title: string) => {
    setProviderCreateOpen(false);
    setRetryCreateOpen(false);
    setRetrying(null);
    setProviderCreateInitialValues(undefined);
    actionRef.current?.reload();
    onTaskAck(ack, title);
  };

  const openDestroyConfirm = (record: API.AssetMachine) => {
    let confirmValue = '';
    modal.confirm({
      title: `Destroy provider instance for machine ${record.name || record.provider_machine_id || record.id}`,
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            Enter the provider machine ID to confirm this destructive action.
          </Text>
          <Typography.Paragraph copyable>
            {record.provider_machine_id || '-'}
          </Typography.Paragraph>
          <input
            style={{ width: '100%', padding: 8, border: '1px solid #d9d9d9', borderRadius: 6 }}
            placeholder="Provider machine ID"
            onChange={(event) => {
              confirmValue = event.target.value;
            }}
          />
        </Space>
      ),
      okText: 'Confirm destroy',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (confirmValue !== record.provider_machine_id) {
          message.error('Provider machine ID does not match.');
          throw new Error('Confirmation mismatch');
        }
        try {
          const response = await destroyProviderAssetMachine(record.id, {
            confirm_instance_id: confirmValue,
          });
          onTaskAck(response.data, `Machine #${record.id} destroy submitted`);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const openDeleteConfirm = (record: API.AssetMachine) => {
    modal.confirm({
      title: 'Delete local machine record',
      content:
        'This only deletes the local asset record and does not destroy the cloud provider instance.',
      okText: 'Confirm delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteAssetMachine(record.id);
          message.success('Machine record deleted.');
          actionRef.current?.reload();
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const openCommandModal = () => {
    if (!selectedRows.length) {
      message.info('Select machines first.');
      return;
    }
    commandForm.resetFields();
    commandForm.setFieldsValue({
      port: 22,
      timeout_seconds: 60,
      username: 'root',
      confirmed: false,
    });
    setCommandOpen(true);
  };

  const handleBatchMutationResult = (title: string, result: API.AssetBatchResult) => {
    const summary = getAssetBatchResultSummary(result);
    const failureLines = getAssetBatchFailureLines(result);
    if (failureLines.length) {
      modal.warning({
        title,
        content: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text>{summary}</Text>
            {failureLines.map((line) => (
              <Text key={line} type="danger">
                {line}
              </Text>
            ))}
          </Space>
        ),
      });
      message.warning(summary);
    } else {
      message.success(summary);
    }
    setSelectedRows([]);
    actionRef.current?.reload();
  };

  const handleBatchSync = async () => {
    if (!selectedIds.length) {
      message.info('Select machines first.');
      return;
    }
    try {
      setSaving(true);
      const response = await batchSyncAssetMachines({
        machine_ids: selectedIds,
      });
      const result = response.data;
      setSelectedRows([]);
      actionRef.current?.reload();
      if (result.tasks.length === 1) {
        onTaskAck(result.tasks[0], `Batch sync submitted for ${result.total} machine(s)`);
        return;
      }
      modal.info({
        title: 'Batch sync tasks submitted',
        content: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text>{`${result.total} machine(s), split into ${result.batch_count} task batch(es).`}</Text>
            <div>
              {result.tasks.slice(0, 10).map((task) => (
                <div key={task.task_id}>{`Task #${task.task_id} (${task.status || 'pending'})`}</div>
              ))}
            </div>
          </Space>
        ),
      });
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openBatchDeleteConfirm = () => {
    if (!selectedIds.length) {
      message.info('Select machines first.');
      return;
    }
    modal.confirm({
      title: `Delete ${selectedIds.length} local machine record(s)`,
      content:
        'This only deletes local asset records and does not destroy cloud provider instances.',
      okText: 'Confirm delete',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetMachines({ ids: selectedIds });
          handleBatchMutationResult('Batch delete machines', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const buildActionLabel = (label: string, disabledReason?: string, danger?: boolean) =>
    disabledReason ? (
      <Tooltip title={disabledReason}>
        <span
          style={{
            color: danger ? 'rgba(255,77,79,0.55)' : 'rgba(0,0,0,0.45)',
          }}
        >
          {label}
        </span>
      </Tooltip>
    ) : (
      label
    );

  const buildRowActionItems = (
    record: API.AssetMachine,
  ): NonNullable<MenuProps['items']> => {
    const provider = providerMap.get(record.provider_code || '');
    const destroySupported = isProviderCapabilitySupported(
      provider,
      MACHINE_DESTROY_ACTION_KEYS,
    );
    const syncSupported = isProviderCapabilitySupported(provider, MACHINE_SYNC_ACTION_KEYS);
    const destroyDisabledReason = !record.provider_machine_id
      ? 'This machine does not have a provider machine ID.'
      : destroySupported === false
        ? 'Current provider capability does not support destroy instance.'
        : undefined;
    const syncDisabledReason =
      syncSupported === false ? 'Current provider capability does not support sync.' : undefined;
    const retryDisabledReason = canRetryProviderCreate(record)
      ? undefined
      : 'Only provider machines without provider machine ID and in preparing/creating/create_failed status can be retried.';

    const runMenuAction = (handler: () => void, disabledReason?: string) => {
      if (disabledReason) {
        message.info(disabledReason);
        return;
      }
      handler();
    };

    return [
      ...(record.create_task_id
        ? [
            {
              key: 'view-task',
              label: 'View Create Task',
              onClick: () =>
                history.push(buildAssetTaskDetailPath(record.create_task_id || '')),
            },
          ]
        : []),
      {
        key: 'sync',
        label: buildActionLabel('Sync', syncDisabledReason),
        onClick: () =>
          runMenuAction(() => {
            void (async () => {
              try {
                const response = await syncAssetMachine(record.id);
                onTaskAck(response.data, `Machine #${record.id} sync submitted`);
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            })();
          }, syncDisabledReason),
      },
      {
        key: 'retry',
        label: buildActionLabel('Retry Create', retryDisabledReason),
        onClick: () => runMenuAction(() => void openRetryCreate(record), retryDisabledReason),
      },
      {
        key: 'bind',
        label: 'Bind IP',
        onClick: () => void loadMachineDetail(record.id, 'ip-bindings'),
      },
      {
        type: 'divider',
      },
      {
        key: 'destroy',
        danger: true,
        label: buildActionLabel('Destroy Provider Instance', destroyDisabledReason, true),
        onClick: () => runMenuAction(() => openDestroyConfirm(record), destroyDisabledReason),
      },
      {
        key: 'delete',
        danger: true,
        label: 'Delete Local Record',
        onClick: () => openDeleteConfirm(record),
      },
    ];
  };

  const columns: ProColumns<API.AssetMachine>[] = [
    {
      title: 'Machine',
      key: 'machine',
      width: 280,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <div
            style={{
              ...compactCellStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
            }}
          >
            <Text
              strong
              ellipsis={{ tooltip: record.name || record.provider_machine_id || `#${record.id}` }}
              style={{ minWidth: 0 }}
            >
              {record.name || record.provider_machine_id || `#${record.id}`}
            </Text>
            {record.source ? (
              <Tag style={{ marginInlineEnd: 0 }} bordered={false}>
                {SOURCE_LABEL_MAP[record.source] || record.source}
              </Tag>
            ) : null}
          </div>
          <div style={compactCellMutedStyle}>
            {record.provider_machine_id
              ? `Local #${record.id} / ${record.provider_machine_id}`
              : `Local #${record.id}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Provider / Account',
      key: 'provider_account',
      width: 220,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <div
            style={{
              ...compactCellStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
            }}
          >
            <Tag style={{ marginInlineEnd: 0 }}>{record.provider_code || '-'}</Tag>
            <Text ellipsis={{ tooltip: record.account_name || '-' }} style={{ minWidth: 0 }}>
              {record.account_name || '-'}
            </Text>
          </div>
          <div style={compactCellMutedStyle}>
            {record.account_id ? `Account ID: ${record.account_id}` : 'Account ID: -'}
          </div>
        </div>
      ),
    },
    {
      title: 'Asset References',
      key: 'asset_refs',
      width: 240,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <Text style={{ minWidth: 0 }}>
            {`Zone #${formatText(record.asset_zone_id)}`}
          </Text>
          <div style={compactCellMutedStyle}>
            {`Image #${formatText(record.asset_image_id)} / Type #${formatText(
              record.asset_instance_type_id,
            )}`}
          </div>
          <div style={compactCellMutedStyle}>
            {`Subnet #${formatText(record.asset_subnet_id)} / IP #${formatText(
              record.asset_ip_id,
            )}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Primary IP',
      key: 'primary_ip',
      width: 160,
      render: (_, record) => {
        const primaryIp = getPrimaryIp(record);
        if (!primaryIp) {
          return '-';
        }
        const extraIpCount = Math.max((record.ips?.length || 0) - 1, 0);
        return (
          <div style={compactCellStackStyle}>
            <Tag color={primaryIp.is_primary ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
              {primaryIp.ip || '-'}
            </Tag>
            <div style={compactCellMutedStyle}>
              {extraIpCount ? `+${extraIpCount} more / ${primaryIp.bind_type || '-'}` : primaryIp.bind_type || '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Disk / Bandwidth',
      key: 'size',
      width: 180,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <Text>{`${formatText(record.system_disk_size_gb)} GB`}</Text>
          <div style={compactCellMutedStyle}>{`${formatText(record.bandwidth_mbps)} Mbps`}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 190,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <div
            style={{
              ...compactCellStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflow: 'hidden',
            }}
          >
            <Tag color={getMachineStatusColor(record.status)} style={{ marginInlineEnd: 0 }}>
              {record.status || '-'}
            </Tag>
            {record.sync_status ? (
              <Text type="secondary" ellipsis={{ tooltip: record.sync_status }} style={{ minWidth: 0 }}>
                {record.sync_status}
              </Text>
            ) : null}
          </div>
          <div style={compactCellMutedStyle}>
            {record.create_task_id ? (
              <a onClick={() => history.push(buildAssetTaskDetailPath(record.create_task_id || ''))}>
                {`Task #${record.create_task_id}`}
              </a>
            ) : (
              `Attempt: ${formatText(record.create_attempt)}`
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Last Error',
      dataIndex: 'last_error_summary',
      width: 260,
      ellipsis: true,
      render: (_, record) =>
        record.last_error_summary ? (
          <Tooltip title={record.last_error_summary}>
            <Text
              type="danger"
              style={{
                display: 'block',
                lineHeight: '20px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.last_error_summary}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Last Synced',
      dataIndex: 'last_synced_at',
      width: 170,
      ellipsis: true,
      render: (_, record) => (
        <Text ellipsis={{ tooltip: formatTime(record.last_synced_at) }} style={{ display: 'block' }}>
          {formatTime(record.last_synced_at)}
        </Text>
      ),
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => void loadMachineDetail(record.id, 'basic')}>
          Detail
        </a>,
        <Dropdown key="more" menu={{ items: buildRowActionItems(record) }} trigger={['click']}>
          <a>
            <Space size={4}>
              <MoreOutlined />
              More
            </Space>
          </a>
        </Dropdown>,
      ],
    },
  ];

  const noAccountReason =
    filteredAccounts.length === 0 ? 'Create a provider account first.' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No provider account available"
          description="Create a provider account first, then return to machine create/import or SSH operations."
        />
      ) : null}

      <div style={controlPanelStyle}>
        {activeFilterItems.length ? (
          <div style={{ ...controlPanelRowStyle, marginBottom: 10 }}>
            <Space size={[8, 8]} wrap>
              <Text strong>Current Filters</Text>
              {activeFilterItems.map((item) => (
                <Tag key={item.key} color="blue" bordered={false} style={{ marginInlineEnd: 0 }}>
                  {`${item.label}: ${item.value}`}
                </Tag>
              ))}
            </Space>
            <Button type="link" size="small" onClick={onResetFilters}>
              Clear Filters
            </Button>
          </div>
        ) : null}
        <div style={controlPanelRowStyle}>
          <Space size={[12, 12]} wrap>
            <Text strong>Quick View</Text>
            <Text type="secondary">Status</Text>
            <Segmented
              size="small"
              value={filters.status || '__all'}
              options={QUICK_STATUS_OPTIONS}
              onChange={(value) =>
                onApplyFilters({
                  ...filters,
                  status: value === '__all' ? undefined : String(value),
                })
              }
            />
            <Text type="secondary">Source</Text>
            <Segmented
              size="small"
              value={filters.source || '__all'}
              options={QUICK_SOURCE_OPTIONS}
              onChange={(value) =>
                onApplyFilters({
                  ...filters,
                  source: value === '__all' ? undefined : String(value),
                })
              }
            />
          </Space>
          <Space size={[8, 8]} wrap>
            <Tag color="red" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`Error: ${pageInsights.failed}`}
            </Tag>
            <Tag color="processing" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`Creating: ${pageInsights.creating}`}
            </Tag>
            <Tag color="success" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`Active: ${pageInsights.active}`}
            </Tag>
          </Space>
        </div>
      </div>

      <ProTable<API.AssetMachine>
        rowKey="id"
        actionRef={actionRef}
        size="small"
        scroll={{ x: 1700 }}
        options={false}
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} machine(s)`,
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `Selected ${selectedRowKeys.length} machine(s)`}
        tableAlertOptionRender={() => [
          <a key="command" onClick={() => openCommandModal()}>
            Run Command
          </a>,
          <a key="sync" onClick={() => void handleBatchSync()}>
            Batch Sync
          </a>,
          <a
            key="status"
            onClick={() => {
              batchStatusForm.resetFields();
              setBatchStatusOpen(true);
            }}
          >
            Batch Status
          </a>,
          <a
            key="tags"
            onClick={() => {
              batchTagForm.setFieldsValue({ tags: [] });
              setBatchTagOpen(true);
            }}
          >
            Batch Tags
          </a>,
          <a key="delete" onClick={() => openBatchDeleteConfirm()}>
            Batch Delete
          </a>,
          <a key="clear" onClick={() => setSelectedRows([])}>
            Clear
          </a>,
        ]}
        request={async (params) => {
          try {
            const response = await listAssetMachines({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
              region: filters.region,
              status: filters.status,
              source: filters.source,
              name: filters.name,
              tag_key: filters.tag_key,
              tag_value: filters.tag_value,
            });
            setCurrentPageRows(response.data?.items || []);
            return {
              data: response.data?.items || [],
              success: true,
              total: response.data?.total || 0,
            };
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
            setCurrentPageRows([]);
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => {
          const createButton = renderActionButton(
            <Button
              key="provider-create"
              icon={<CloudUploadOutlined />}
              onClick={() => {
                setProviderCreateInitialValues({
                  account_id: filters.account_id,
                });
                setProviderCreateOpen(true);
              }}
            >
              Provider Create
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_CREATE_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider create.'
                : undefined),
          );

          const importButton = renderActionButton(
            <Button
              key="import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                setImportAccountId(filters.account_id);
                setImportProviderRegionId(filters.region);
                setImportOpen(true);
              }}
            >
              Provider Import
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_IMPORT_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider import.'
                : undefined),
          );

          return [
            createButton,
            importButton,
            <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
              Refresh
            </Button>,
          ];
        }}
      />

      <MachineProviderCreateModal
        open={providerCreateOpen}
        mode="create"
        accounts={filteredAccounts}
        sshKeys={availableSshKeys}
        initialValues={providerCreateInitialValues}
        onCancel={() => {
          setProviderCreateOpen(false);
          setProviderCreateInitialValues(undefined);
        }}
        onSuccess={handleCreateSuccess}
      />

      <MachineProviderCreateModal
        open={retryCreateOpen}
        mode="retry"
        accounts={filteredAccounts}
        sshKeys={availableSshKeys}
        retrying={retrying}
        onCancel={() => {
          setRetryCreateOpen(false);
          setRetrying(null);
        }}
        onSuccess={handleCreateSuccess}
      />

      <MachineProviderImportModal
        open={importOpen}
        accounts={filteredAccounts}
        initialAccountId={importAccountId}
        initialProviderRegionId={importProviderRegionId}
        saving={saving}
        onCancel={() => setImportOpen(false)}
        onSubmit={async ({ accountId, machines }) => {
          if (!machines.length) {
            message.error('Select provider machines first.');
            return;
          }
          try {
            setSaving(true);
            for (const machine of machines) {
              await importAssetMachineFromProvider({
                account_id: accountId,
                provider_id: machine.provider_id ?? undefined,
                provider_machine_id: machine.provider_machine_id,
                provider_region_id: machine.zone?.provider_region_id,
                name: machine.name,
                billing_type: machine.billing_type,
                status: machine.status,
                source: machine.source,
                tags: machine.tags,
                zone: machine.zone,
                image: machine.image,
                instance_type_resource: machine.instance_type_resource,
                subnet: machine.subnet,
                ip: machine.ip,
                security_groups: machine.security_groups,
                label: machine.label,
              });
            }
            setImportOpen(false);
            actionRef.current?.reload();
            message.success(`Imported ${machines.length} provider machine(s).`);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      />

      <MachineCommandModal
        open={commandOpen}
        selectedRows={selectedRows}
        sshKeys={availableSshKeys}
        form={commandForm}
        saving={saving}
        onCancel={() => {
          setCommandOpen(false);
          commandForm.resetFields();
        }}
        onSubmit={async () => {
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
            onTaskAck(response.data, 'Batch command submitted');
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      />

      <MachineDetailDrawer
        detail={detail}
        detailTab={detailTab}
        bindForm={bindForm}
        bindOptions={bindOptions}
        bindLoading={bindLoading}
        providerMap={providerMap}
        onClose={() => {
          setDetail(null);
          setBindOptions([]);
          bindForm.resetFields();
        }}
        onTabChange={setDetailTab}
        onReloadDetail={loadMachineDetail}
        onLoadBindOptions={(machine) => void loadBindOptions(machine)}
        onSuccess={message.success}
        onError={message.error}
      />

      <Modal
        title={`Update status for ${selectedIds.length} machine(s)`}
        open={batchStatusOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => {
          setBatchStatusOpen(false);
          batchStatusForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await batchStatusForm.validateFields();
            setSaving(true);
            const response = await batchUpdateAssetMachineStatus({
              ids: selectedIds,
              status: values.status,
            });
            setBatchStatusOpen(false);
            batchStatusForm.resetFields();
            handleBatchMutationResult('Batch update machine status', response.data);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={batchStatusForm} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Select a status.' }]}
          >
            <Select options={MACHINE_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Replace tags for ${selectedIds.length} machine(s)`}
        open={batchTagOpen}
        destroyOnHidden
        width={760}
        confirmLoading={saving}
        onCancel={() => {
          setBatchTagOpen(false);
          batchTagForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await batchTagForm.validateFields();
            setSaving(true);
            const response = await batchUpdateAssetMachineTags({
              ids: selectedIds,
              tags: normalizeAssetTags(values.tags),
            });
            setBatchTagOpen(false);
            batchTagForm.resetFields();
            handleBatchMutationResult('Batch update machine tags', response.data);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={batchTagForm} layout="vertical">
          <AssetTagEditor name="tags" label="Tags" />
        </Form>
      </Modal>
    </>
  );
};

export default MachinesPanel;
