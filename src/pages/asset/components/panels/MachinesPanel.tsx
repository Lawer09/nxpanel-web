import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  PlayCircleOutlined,
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
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
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

const MachinesPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  sshKeys: API.AssetSshKey[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, sshKeys, onTaskAck }) => {
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
  const [tableQuery, setTableQuery] = useState<{
    source?: string;
    name?: string;
  }>({});
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

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

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

  const columns: ProColumns<API.AssetMachine>[] = [
    { title: 'Machine ID', dataIndex: 'machine_id', width: 160 },
    { title: 'Name', dataIndex: 'name', hideInSearch: true },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    { title: 'Account', dataIndex: 'account_name', renderText: formatText },
    { title: 'Region', dataIndex: 'region', renderText: formatText },
    {
      title: 'Instance Type',
      dataIndex: 'instance_type',
      renderText: formatText,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => <Tag color="blue">{record.status || '-'}</Tag>,
    },
    { title: 'Source', dataIndex: 'source', renderText: formatText, hideInSearch: true },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (_, record) =>
        record.tags?.length ? (
          <Space wrap>
            {record.tags.map((item) => (
              <Tag key={`${item.key}-${item.value}-${item.label || ''}`}>
                {item.label || `${item.key}:${item.value}`}
              </Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    { title: 'Sync Status', dataIndex: 'sync_status', renderText: formatText },
    {
      title: 'Create Task',
      dataIndex: 'create_task_id',
      renderText: formatText,
      width: 120,
    },
    {
      title: 'Create Attempts',
      dataIndex: 'create_attempt',
      renderText: formatText,
      width: 130,
    },
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
    {
      title: 'Last Synced',
      dataIndex: 'last_synced_at',
      renderText: formatTime,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 260,
      fixed: 'right',
      render: (_, record) => {
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

        return [
          <a
            key="detail"
            onClick={() => void loadMachineDetail(record.id, 'basic')}
          >
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
                  external_instance_id:
                    response.data.external_instance_id || undefined,
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
                  onTaskAck(
                    response.data,
                    `Machine #${record.id} sync submitted.`,
                  );
                } catch (error: any) {
                  message.error(normalizeDevErrorMessage(error));
                }
              }}
            >
              Sync
            </a>,
            syncDisabledReason,
          ),
          renderActionButton(
            <a key="retry" onClick={() => void openRetryCreate(record)}>
              Retry Create
            </a>,
            retryDisabledReason,
          ),
          <a
            key="bind"
            onClick={() => void loadMachineDetail(record.id, 'ip-bindings')}
          >
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
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: '100%' }}
                    >
                      <Text type="secondary">
                        Enter the external instance id to confirm this
                        irreversible action.
                      </Text>
                      <Paragraph copyable>
                        {record.external_instance_id}
                      </Paragraph>
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
                      const response = await destroyProviderAssetMachine(
                        record.id,
                        {
                          confirm_instance_id: confirmValue,
                        },
                      );
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

  const noAccountReason =
    filteredAccounts.length === 0
      ? 'Create a provider account first.'
      : undefined;

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
        scroll={{ x: 1800 }}
        options={false}
        search={{
          labelWidth: 'auto',
        }}
        columns={[
          ...columns,
          {
            title: 'Source',
            key: 'source_search',
            dataIndex: 'source',
            hideInTable: true,
          },
          {
            title: 'Name',
            key: 'name_search',
            dataIndex: 'name',
            hideInTable: true,
          },
        ]}
        onSubmit={(params) =>
          setTableQuery({
            source: params.source as string | undefined,
            name: params.name as string | undefined,
          })
        }
        onReset={() => setTableQuery({})}
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
              source: tableQuery.source,
              name: tableQuery.name,
              tag_key: filters.tag_key,
              tag_value: filters.tag_value,
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
                  commandForm.setFieldsValue({
                    port: 22,
                    timeout_seconds: 60,
                    confirmed: false,
                  });
                  setCommandOpen(true);
                }}
              >
                Run Command
              </Button>,
              selectedRows.length ? undefined : 'Select machines first.',
            ),
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => actionRef.current?.reload()}
            >
              Refresh
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
