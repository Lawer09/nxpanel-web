import {
  CloudDownloadOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Collapse,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createAssetProviderAccount,
  deleteAssetProviderAccount,
  listAssetIps,
  listAssetMachines,
  listAssetProviderAccounts,
  listAssetSshKeys,
  testAssetProviderAccountConnection,
  updateAssetProviderAccount,
} from '@/services/asset-service/api';
import {
  ACCOUNT_PROVIDER_ACTION_KEYS,
  ACCOUNT_STATUS_OPTIONS,
} from '../../constants';
import type {
  AccountFormValues,
  JumpToResourceHandler,
  SharedFilters,
} from '../../types';
import {
  cleanupObject,
  formatText,
  formatTime,
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';

const ProviderAccountsPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  onAccountCatalogChanged: () => Promise<void>;
  onJumpToResource: JumpToResourceHandler;
}> = ({ filters, providers, onAccountCatalogChanged, onJumpToResource }) => {
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
  const [credentialExpanded, setCredentialExpanded] = useState<string[]>([
    'credential',
  ]);

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
      tags: record.tags || [],
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
    {
      title: 'Last Synced',
      dataIndex: 'last_synced_at',
      renderText: formatTime,
    },
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
          supported === false
            ? 'Current provider capability does not support connection test.'
            : undefined;
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
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            New Account
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            Refresh
          </Button>,
        ]}
      />

      <Modal
        title={
          editing ? `Edit Account #${editing.id}` : 'Create Provider Account'
        }
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
              message.error(
                'Credential is required when creating a provider account.',
              );
              return;
            }

            setSaving(true);
            if (editing) {
              await updateAssetProviderAccount(
                cleanupObject({
                  id: editing.id,
                  name: values.name.trim(),
                  status: values.status,
                  credential: Object.keys(credential).length
                    ? credential
                    : undefined,
                  tags: values.tags ? normalizeAssetTags(values.tags) : undefined,
                }),
              );
              message.success('Provider account updated.');
            } else {
              await createAssetProviderAccount({
                provider_code: values.provider_code,
                name: values.name.trim(),
                status: values.status,
                credential,
                tags: normalizeAssetTags(values.tags),
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
          <AssetTagEditor name="tags" />
          <Collapse
            activeKey={credentialExpanded}
            onChange={(keys) =>
              setCredentialExpanded(Array.isArray(keys) ? keys : [keys])
            }
            items={[
              {
                key: 'credential',
                label: editing
                  ? 'Credential Update (leave blank to keep current value)'
                  : 'Credential',
                children: (
                  <>
                    <Form.Item name="access_key_id" label="Access Key ID">
                      <Input autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      name="access_key_secret"
                      label="Access Key Secret"
                    >
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
        title={
          detail ? `Provider Account #${detail.id}` : 'Provider Account Detail'
        }
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
              <Descriptions.Item label="Provider">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {detail.status || '-'}
              </Descriptions.Item>
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
              <Descriptions.Item label="Created At">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {formatTime(detail.updated_at)}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions bordered column={1} title="Tags">
              <Descriptions.Item label="Tags">
                {detail.tags?.length ? (
                  <Space wrap>
                    {detail.tags.map((item) => (
                      <Tag key={`${item.key}-${item.value}-${item.label || ''}`}>
                        {item.label || `${item.key}:${item.value}`}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
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
                  onJumpToResource('machines', detail.id);
                }}
              >
                View Machines
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToResource('ips', detail.id);
                }}
              >
                View IPs
              </Button>
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToResource('ssh-keys', detail.id);
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

export default ProviderAccountsPanel;
