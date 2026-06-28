import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Dropdown,
  Form,
  Input,
  Modal,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createAssetMachineManual,
  deleteAssetMachine,
  destroyProviderAssetMachine,
  getAssetMachineDetail,
  importAssetMachinesFromProvider,
  listAssetIps,
  listAssetMachines,
  runAssetMachineCommand,
  syncAssetMachine,
  updateAssetMachine,
} from '@/services/asset-service/api';
import {
  MACHINE_CREATE_ACTION_KEYS,
  MACHINE_DESTROY_ACTION_KEYS,
  MACHINE_IMPORT_ACTION_KEYS,
  MACHINE_SYNC_ACTION_KEYS,
} from '../../constants';
import type {
  MachineCommandFormValues,
  MachineCreateFormValues,
  MachineFormValues,
  SharedFilters,
  TaskAckHandler,
} from '../../types';
import {
  formatText,
  formatTime,
  getMachineStatusColor,
  isProviderCapabilitySupported,
  buildAssetTaskDetailPath,
  normalizeDevErrorMessage,
  renderActionButton,
  stringifyJson,
} from '../../utils';
import JsonBlock from '../../../dev/components/JsonBlock';
import MachineCommandModal from '../machines/MachineCommandModal';
import MachineCreateWizardModal from '../machines/MachineCreateWizardModal';
import MachineDetailDrawer from '../machines/MachineDetailDrawer';
import MachineImportModal from '../machines/MachineImportModal';
import MachineManualModal from '../machines/MachineManualModal';
import { buildMachinePayload } from '../machines/machinePayload';
import { history } from '@umijs/max';

const { Text, Paragraph } = Typography;

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

const QUICK_STATUS_OPTIONS = [
  { label: '全部状态', value: '__all' },
  { label: '创建失败', value: 'create_failed' },
  { label: '创建中', value: 'creating' },
  { label: '活跃', value: 'active' },
  { label: '已停止', value: 'stopped' },
  { label: '缺失', value: 'missing' },
];

const QUICK_SOURCE_OPTIONS = [
  { label: '全部来源', value: '__all' },
  { label: '供应商创建', value: 'provider' },
  { label: '供应商导入', value: 'import' },
  { label: '手动录入', value: 'manual' },
];

const SOURCE_LABEL_MAP: Record<string, string> = {
  provider: '供应商创建',
  import: '供应商导入',
  manual: '手动录入',
};

const MachinesPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  onTaskAck: TaskAckHandler;
  onResetFilters: () => void;
  onApplyFilters: (filters: SharedFilters) => void;
}> = ({
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
  const [manualForm] = Form.useForm<MachineFormValues>();
  const [commandForm] = Form.useForm<MachineCommandFormValues>();
  const [bindForm] = Form.useForm<API.AssetMachineBindIpParams>();
  const [manualOpen, setManualOpen] = useState(false);
  const [providerWizardOpen, setProviderWizardOpen] = useState(false);
  const [retryWizardOpen, setRetryWizardOpen] = useState(false);
  const [providerWizardInitialValues, setProviderWizardInitialValues] =
    useState<Partial<MachineCreateFormValues>>();
  const [importOpen, setImportOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetMachine | null>(null);
  const [retrying, setRetrying] = useState<API.AssetMachine | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetMachine[]>([]);
  const [detail, setDetail] = useState<API.AssetMachine | null>(null);
  const [detailTab, setDetailTab] = useState('basic');
  const [bindOptions, setBindOptions] = useState<API.AssetIp[]>([]);
  const [bindLoading, setBindLoading] = useState(false);
  const [manualCreateResult, setManualCreateResult] =
    useState<API.AssetMachineCreateManualResult | null>(null);
  const [currentPageRows, setCurrentPageRows] = useState<API.AssetMachine[]>([]);
  const [importAccountId, setImportAccountId] = useState<number | undefined>(
    filters.account_id,
  );
  const [importRegion, setImportRegion] = useState<string | undefined>(
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
        (item) =>
          !filters.provider_code ||
          item.provider_code === filters.provider_code,
      ),
    [accounts, filters.provider_code],
  );

  const availableSshKeys = useMemo(
    () => sshKeys.filter((item) => item.has_private_key),
    [sshKeys],
  );

  const activeFilterItems = useMemo(() => {
    const items: Array<{ key: string; label: string; value: string }> = [];

    if (filters.name) {
      items.push({ key: 'name', label: '机器', value: filters.name });
    }
    if (filters.provider_code) {
      const provider = providerMap.get(filters.provider_code);
      items.push({
        key: 'provider',
        label: '供应商',
        value: provider?.name || filters.provider_code,
      });
    }
    if (filters.account_id) {
      const account = accountMap.get(filters.account_id);
      items.push({
        key: 'account',
        label: '账号',
        value: account?.name || String(filters.account_id),
      });
    }
    if (filters.region) {
      items.push({ key: 'region', label: '区域', value: filters.region });
    }
    if (filters.status) {
      items.push({ key: 'status', label: '状态', value: filters.status });
    }
    if (filters.source) {
      items.push({
        key: 'source',
        label: '来源',
        value: SOURCE_LABEL_MAP[filters.source] || filters.source,
      });
    }
    if (filters.tag_key || filters.tag_value) {
      items.push({
        key: 'tag',
        label: '标签',
        value: [filters.tag_key, filters.tag_value].filter(Boolean).join(' = '),
      });
    }

    return items;
  }, [
    accountMap,
    filters.account_id,
    filters.name,
    filters.provider_code,
    filters.region,
    filters.source,
    filters.status,
    filters.tag_key,
    filters.tag_value,
    providerMap,
  ]);

  const pageInsights = useMemo(() => {
    const failed = currentPageRows.filter(
      (item) =>
        Boolean(item.last_error_summary) ||
        item.status === 'create_failed' ||
        item.status === 'missing',
    ).length;
    const creating = currentPageRows.filter(
      (item) => item.status === 'creating',
    ).length;
    const active = currentPageRows.filter((item) => item.status === 'active').length;

    return { failed, creating, active };
  }, [currentPageRows]);

  const handleQuickStatusChange = (value: string | number) => {
    onApplyFilters({
      ...filters,
      status: value === '__all' ? undefined : String(value),
    });
  };

  const handleQuickSourceChange = (value: string | number) => {
    onApplyFilters({
      ...filters,
      source: value === '__all' ? undefined : String(value),
    });
  };

  useEffect(() => {
    actionRef.current?.reload();
    setSelectedRows([]);
  }, [filters]);

  const getPrimaryIp = (record: API.AssetMachine) =>
    record.ips?.find((item) => item.is_primary) || record.ips?.[0];

  const loadMachineDetail = async (
    machineId: number,
    nextTab: string = 'basic',
  ) => {
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

  const canRetryProviderCreate = (record: API.AssetMachine) =>
    record.source === 'provider' &&
    !record.external_instance_id &&
    ['creating', 'create_failed'].includes(record.status || '');

  const openRetryCreate = async (record: API.AssetMachine) => {
    try {
      const response = await getAssetMachineDetail(record.id);
      setRetrying(response.data);
      setRetryWizardOpen(true);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    }
  };

  const handleProviderWizardSuccess = (ack: API.AssetTaskAck, title: string) => {
    setProviderWizardOpen(false);
    setRetryWizardOpen(false);
    setRetrying(null);
    setProviderWizardInitialValues(undefined);
    actionRef.current?.reload();
    onTaskAck(ack, title);
  };

  const openManualEditor = async (record: API.AssetMachine) => {
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
        tags: response.data.tags || [],
      });
      setManualOpen(true);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    }
  };

  const openDestroyConfirm = (record: API.AssetMachine) => {
    let confirmValue = '';
    modal.confirm({
      title: `Destroy provider instance for machine ${record.name || record.machine_id || record.id}`,
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            输入外部实例 ID 以确认这个不可逆操作。
          </Text>
          <Paragraph copyable>{record.external_instance_id}</Paragraph>
          <Input
            placeholder="外部实例 ID"
            onChange={(event) => {
              confirmValue = event.target.value;
            }}
          />
        </Space>
      ),
      okText: '确认销毁',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (confirmValue !== record.external_instance_id) {
          message.error('外部实例 ID 不匹配。');
          throw new Error('Confirmation mismatch');
        }
        try {
          const response = await destroyProviderAssetMachine(record.id, {
            confirm_instance_id: confirmValue,
          });
          onTaskAck(
            response.data,
            `机器 #${record.id} 的销毁任务已提交。`,
          );
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const openDeleteConfirm = (record: API.AssetMachine) => {
    modal.confirm({
      title: '删除本地机器记录？',
      content:
        '这只会删除本地资产记录，不会销毁云平台上的实例。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteAssetMachine(record.id);
          message.success('机器记录已删除。');
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
      message.info('请先勾选机器。');
      return;
    }
    commandForm.resetFields();
    commandForm.setFieldsValue({
      port: 22,
      timeout_seconds: 60,
      confirmed: false,
    });
    setCommandOpen(true);
  };

  const buildActionLabel = (
    label: string,
    disabledReason?: string,
    danger?: boolean,
  ) =>
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
    const syncSupported = isProviderCapabilitySupported(
      provider,
      MACHINE_SYNC_ACTION_KEYS,
    );
    const destroyDisabledReason = !record.external_instance_id
      ? 'This machine does not have an external instance id.'
      : destroySupported === false
        ? 'Current provider capability does not support destroy instance.'
        : undefined;
    const syncDisabledReason =
      syncSupported === false
        ? 'Current provider capability does not support sync.'
        : undefined;
    const retryDisabledReason = canRetryProviderCreate(record)
      ? undefined
      : 'Only provider machines without external instance id and in creating/create_failed status can be retried.';

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
              label: '查看创建任务',
              onClick: () =>
                history.push(
                  buildAssetTaskDetailPath(record.create_task_id || ''),
                ),
            },
          ]
        : []),
      {
        key: 'sync',
        label: buildActionLabel('同步', syncDisabledReason),
        onClick: () =>
          runMenuAction(() => {
            void (async () => {
              try {
                const response = await syncAssetMachine(record.id);
                onTaskAck(response.data, `机器 #${record.id} 的同步任务已提交。`);
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            })();
          }, syncDisabledReason),
      },
      {
        key: 'retry',
        label: buildActionLabel('重试创建', retryDisabledReason),
        onClick: () => runMenuAction(() => void openRetryCreate(record), retryDisabledReason),
      },
      {
        key: 'bind',
        label: '绑定 IP',
        onClick: () => void loadMachineDetail(record.id, 'ip-bindings'),
      },
      {
        type: 'divider',
      },
      {
        key: 'destroy',
        danger: true,
        label: buildActionLabel(
          '销毁云实例',
          destroyDisabledReason,
          true,
        ),
        onClick: () => runMenuAction(() => openDestroyConfirm(record), destroyDisabledReason),
      },
      {
        key: 'delete',
        danger: true,
        label: '删除本地记录',
        onClick: () => openDeleteConfirm(record),
      },
    ];
  };

  const columns: ProColumns<API.AssetMachine>[] = [
    {
      title: '机器',
      key: 'machine',
      width: 260,
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
              ellipsis={{ tooltip: record.name || record.machine_id || `#${record.id}` }}
              style={{ minWidth: 0 }}
            >
              {record.name || record.machine_id || `#${record.id}`}
            </Text>
            {record.source ? (
              <Tag style={{ marginInlineEnd: 0 }} bordered={false}>
                {SOURCE_LABEL_MAP[record.source] || record.source}
              </Tag>
            ) : null}
          </div>
          <div style={compactCellMutedStyle}>
            {record.external_instance_id
              ? `${record.machine_id || '-'} / ${record.external_instance_id}`
              : record.machine_id || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '供应商 / 账号',
      key: 'provider_account',
      width: 210,
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
            <Text
              ellipsis={{ tooltip: record.account_name || '-' }}
              style={{ minWidth: 0 }}
            >
              {record.account_name || '-'}
            </Text>
          </div>
          <div style={compactCellMutedStyle}>
            {record.account_id ? `账号 ID: ${record.account_id}` : '账号 ID: -'}
          </div>
        </div>
      ),
    },
    {
      title: '区域 / 规格',
      key: 'placement',
      width: 190,
      render: (_, record) => (
        <div style={compactCellStackStyle}>
          <Text ellipsis={{ tooltip: record.region || '-' }} style={{ minWidth: 0 }}>
            {record.region || '-'}
          </Text>
          <div style={compactCellMutedStyle}>
            {[record.zone, record.instance_type].filter(Boolean).join(' / ') || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '主 IP',
      key: 'primary_ip',
      width: 150,
      render: (_, record) => {
        const primaryIp = getPrimaryIp(record);
        if (!primaryIp) {
          return '-';
        }
        const extraIpCount = Math.max((record.ips?.length || 0) - 1, 0);
        return (
          <div style={compactCellStackStyle}>
            <div style={{ ...compactCellStyle, display: 'flex', alignItems: 'center' }}>
              <Tag
                color={primaryIp.is_primary ? 'green' : 'default'}
                style={{ marginInlineEnd: 0 }}
              >
                {primaryIp.ip || '-'}
              </Tag>
            </div>
            <div style={compactCellMutedStyle}>
              {extraIpCount ? `另 ${extraIpCount} 个` : primaryIp.bind_type || '-'}
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 180,
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
              <Text
                type="secondary"
                ellipsis={{ tooltip: record.sync_status }}
                style={{ minWidth: 0 }}
              >
                {record.sync_status}
              </Text>
            ) : null}
          </div>
          <div style={compactCellMutedStyle}>
            {record.create_task_id ? (
              <a
                onClick={() =>
                  history.push(
                    buildAssetTaskDetailPath(record.create_task_id || ''),
                  )
                }
              >
                {`Task #${record.create_task_id}`}
              </a>
            ) : (
              `尝试次数: ${formatText(record.create_attempt)}`
            )}
          </div>
        </div>
      ),
    },
    {
      title: '最近异常',
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
      title: '最近同步',
      dataIndex: 'last_synced_at',
      width: 170,
      ellipsis: true,
      render: (_, record) => (
        <Text
          ellipsis={{ tooltip: formatTime(record.last_synced_at) }}
          style={{ display: 'block' }}
        >
          {formatTime(record.last_synced_at)}
        </Text>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        return [
          <a
            key="detail"
            onClick={() => void loadMachineDetail(record.id, 'basic')}
          >
            详情
          </a>,
          <a
            key="edit"
            onClick={() => void openManualEditor(record)}
          >
            编辑
          </a>,
          <Dropdown
            key="more"
            menu={{ items: buildRowActionItems(record) }}
            trigger={['click']}
          >
            <a>
              <Space size={4}>
                <MoreOutlined />
                更多
              </Space>
            </a>
          </Dropdown>,
        ];
      },
    },
  ];

  const noAccountReason =
    filteredAccounts.length === 0
      ? '请先创建供应商账号。'
      : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="当前没有可用的供应商账号"
          description="请先创建供应商账号，再回来执行供应商创建、导入和 SSH 操作。"
        />
      ) : null}

      <div style={controlPanelStyle}>
        {activeFilterItems.length ? (
          <div style={{ ...controlPanelRowStyle, marginBottom: 10 }}>
            <Space size={[8, 8]} wrap>
              <Text strong>当前筛选</Text>
              {activeFilterItems.map((item) => (
                <Tag key={item.key} color="blue" bordered={false} style={{ marginInlineEnd: 0 }}>
                  {`${item.label}: ${item.value}`}
                </Tag>
              ))}
            </Space>
            <Button type="link" size="small" onClick={onResetFilters}>
              清空筛选
            </Button>
          </div>
        ) : null}
        <div style={controlPanelRowStyle}>
          <Space size={[12, 12]} wrap>
            <Text strong>快捷视图</Text>
            <Text type="secondary">状态</Text>
            <Segmented
              size="small"
              value={filters.status || '__all'}
              options={QUICK_STATUS_OPTIONS}
              onChange={handleQuickStatusChange}
            />
            <Text type="secondary">来源</Text>
            <Segmented
              size="small"
              value={filters.source || '__all'}
              options={QUICK_SOURCE_OPTIONS}
              onChange={handleQuickSourceChange}
            />
          </Space>
          <Space size={[8, 8]} wrap>
            <Tag color="red" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`异常: ${pageInsights.failed}`}
            </Tag>
            <Tag color="processing" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`创建中: ${pageInsights.creating}`}
            </Tag>
            <Tag color="success" bordered={false} style={{ marginInlineEnd: 0 }}>
              {`活跃: ${pageInsights.active}`}
            </Tag>
          </Space>
        </div>
      </div>

      <ProTable<API.AssetMachine>
        rowKey="id"
        actionRef={actionRef}
        size="small"
        scroll={{ x: 1600 }}
        options={false}
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 台机器`,
        }}
        locale={{
          emptyText: activeFilterItems.length
            ? '当前筛选条件下没有机器。'
            : '暂无机器数据。',
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) =>
          `已选择 ${selectedRowKeys.length} 台机器`
        }
        tableAlertOptionRender={() => [
          <a key="command" onClick={() => openCommandModal()}>
            执行命令
          </a>,
          <a key="clear" onClick={() => setSelectedRows([])}>
            清空选择
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
                setProviderWizardInitialValues({
                  account_id: filters.account_id,
                  count: 1,
                  zone: {
                    country_code: filters.region,
                  },
                });
                setProviderWizardOpen(true);
              }}
            >
              供应商创建
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_CREATE_ACTION_KEYS,
              ) === false
                ? '当前供应商能力不支持供应商创建。'
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
              供应商导入
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                MACHINE_IMPORT_ACTION_KEYS,
              ) === false
                ? '当前供应商能力不支持供应商导入。'
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
              手动录入
            </Button>,
            createButton,
            importButton,
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => actionRef.current?.reload()}
            >
              刷新
            </Button>,
          ];
        }}
      />

      <MachineManualModal
        open={manualOpen}
        editing={editing}
        form={manualForm}
        saving={saving}
        onCancel={() => {
          setManualOpen(false);
          setEditing(null);
          manualForm.resetFields();
        }}
        onSubmit={async () => {
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
                tags: payload.tags,
                spec: payload.spec,
              });
              message.success('Machine updated.');
            } else {
              const response = await createAssetMachineManual(
                payload as API.AssetMachineCreateManualParams,
              );
              setManualCreateResult(response.data);
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
      />

      <MachineCreateWizardModal
        open={providerWizardOpen}
        mode="create"
        accounts={filteredAccounts}
        initialValues={providerWizardInitialValues}
        onCancel={() => {
          setProviderWizardOpen(false);
          setProviderWizardInitialValues(undefined);
        }}
        onSuccess={handleProviderWizardSuccess}
      />

      <MachineCreateWizardModal
        open={retryWizardOpen}
        mode="retry"
        accounts={filteredAccounts}
        retrying={retrying}
        onCancel={() => {
          setRetryWizardOpen(false);
          setRetrying(null);
        }}
        onSuccess={handleProviderWizardSuccess}
      />

      <MachineImportModal
        open={importOpen}
        accounts={filteredAccounts}
        accountId={importAccountId}
        region={importRegion}
        saving={saving}
        onAccountIdChange={setImportAccountId}
        onRegionChange={setImportRegion}
        onCancel={() => setImportOpen(false)}
        onSubmit={async () => {
          if (!importAccountId) {
            message.error('请选择供应商账号。');
            return;
          }
          try {
            setSaving(true);
            const response = await importAssetMachinesFromProvider({
              account_id: importAccountId,
              region: importRegion?.trim() || undefined,
            });
            setImportOpen(false);
            onTaskAck(response.data, '供应商机器导入任务已提交。');
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
            onTaskAck(response.data, 'Batch command submitted.');
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
        title={
          manualCreateResult
            ? `Manual Machine Created #${manualCreateResult.id}`
            : 'Manual Machine Created'
        }
        open={Boolean(manualCreateResult)}
        footer={[
          <Button key="close" type="primary" onClick={() => setManualCreateResult(null)}>
            Close
          </Button>,
        ]}
        width={860}
        destroyOnHidden
        onCancel={() => setManualCreateResult(null)}
      >
        {manualCreateResult ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Machine Record ID">
                {manualCreateResult.id}
              </Descriptions.Item>
              <Descriptions.Item label="Inject Task ID">
                {manualCreateResult.trust_token?.inject_task_id ? (
                  <a
                    onClick={() =>
                      history.push(
                        buildAssetTaskDetailPath(
                          manualCreateResult.trust_token?.inject_task_id || '',
                        ),
                      )
                    }
                  >
                    {manualCreateResult.trust_token.inject_task_id}
                  </a>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Machine ID">
                {manualCreateResult.trust_token?.machine_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Asset Machine ID">
                {formatText(manualCreateResult.trust_token?.asset_machine_id)}
              </Descriptions.Item>
              <Descriptions.Item label="Inject Status">
                {manualCreateResult.trust_token?.inject_status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Expires In Seconds">
                {formatText(manualCreateResult.trust_token?.expires_in_seconds)}
              </Descriptions.Item>
              <Descriptions.Item label="Inject Task URL" span={2}>
                {manualCreateResult.trust_token?.inject_task_url || '-'}
              </Descriptions.Item>
            </Descriptions>
            {manualCreateResult.trust_token?.trust_token ? (
              <Typography.Paragraph copyable>
                {manualCreateResult.trust_token.trust_token}
              </Typography.Paragraph>
            ) : null}
            {manualCreateResult.trust_token?.inject_task_id ? (
              <Button
                onClick={() =>
                  history.push(
                    buildAssetTaskDetailPath(
                      manualCreateResult.trust_token?.inject_task_id || '',
                    ),
                  )
                }
              >
                View Inject Task
              </Button>
            ) : null}
            <JsonBlock
              title="asset.config payload"
              value={manualCreateResult.trust_token?.config}
            />
          </Space>
        ) : null}
      </Modal>
    </>
  );
};

export default MachinesPanel;
