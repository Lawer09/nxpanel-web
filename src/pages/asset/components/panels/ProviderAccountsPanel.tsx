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
  batchDeleteAssetProviderAccounts,
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
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';

const getAccountStatusColor = (status?: string | null) => {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'disabled') {
    return 'warning';
  }
  if (status === 'deleted') {
    return 'default';
  }
  return 'default';
};

const ProviderAccountsPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  onAccountCatalogChanged: () => Promise<void>;
  onJumpToResource: JumpToResourceHandler;
}> = ({ filters, providers, onAccountCatalogChanged, onJumpToResource }) => {
  const { message, modal } = App.useApp();
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
  const [selectedRows, setSelectedRows] = useState<API.AssetProviderAccount[]>([]);

  const providerMap = useMemo(
    () => new Map(providers.map((item) => [item.code, item])),
    [providers],
  );

  useEffect(() => {
    actionRef.current?.reload();
    setSelectedRows([]);
  }, [filters]);

  const selectedIds = useMemo(() => selectedRows.map((item) => item.id), [selectedRows]);

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

  const handleBatchMutationResult = async (title: string, result: API.AssetBatchResult) => {
    const summary = getAssetBatchResultSummary(result);
    if (result.failed > 0) {
      const failureLines = getAssetBatchFailureLines(result);
      modal.info({
        title: `${title} Result`,
        width: 720,
        content: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <span>{summary}</span>
            <div>
              {failureLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </Space>
        ),
      });
      message.warning(summary);
    } else {
      message.success(summary);
    }
    setSelectedRows([]);
    await onAccountCatalogChanged();
    actionRef.current?.reload();
  };

  const openBatchDeleteConfirm = () => {
    if (!selectedIds.length) {
      message.info('Select provider accounts first.');
      return;
    }
    modal.confirm({
      title: `Delete ${selectedIds.length} selected provider account(s)?`,
      content: 'This deletes the selected local provider account records.',
      okText: 'Delete',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetProviderAccounts({ ids: selectedIds });
          await handleBatchMutationResult('Batch delete provider accounts', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ProColumns<API.AssetProviderAccount>[] = [
    {
      title: '账号',
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <div>{record.name || '-'}</div>
          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
            #{record.id}
          </div>
        </div>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'provider_code',
      width: 140,
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={getAccountStatusColor(record.status)}>
          {ACCOUNT_STATUS_OPTIONS.find((item) => item.value === record.status)?.label ||
            formatText(record.status)}
        </Tag>
      ),
    },
    {
      title: '凭证',
      dataIndex: 'has_credential',
      width: 120,
      render: (_, record) =>
        record.has_credential ? (
          <Tag color="success">已配置</Tag>
        ) : (
          <Tag>缺失</Tag>
        ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 90,
      render: (_, record) =>
        record.tags?.length ? `${record.tags.length} 个` : '-',
    },
    {
      title: '最近同步',
      dataIndex: 'last_synced_at',
      width: 180,
      ellipsis: true,
      renderText: formatTime,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      ellipsis: true,
      renderText: formatTime,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const supported = isProviderCapabilitySupported(
          providerMap.get(record.provider_code || ''),
          ACCOUNT_PROVIDER_ACTION_KEYS,
        );
        const unsupportedReason =
          supported === false ? '当前供应商不支持连通性测试。' : undefined;

        return [
          <a
            key="detail"
            onClick={() => {
              setDetail(record);
              void loadCounts(record);
            }}
          >
            详情
          </a>,
          <a key="edit" onClick={() => openEdit(record)}>
            编辑
          </a>,
          renderActionButton(
            <a
              key="test"
              onClick={async () => {
                try {
                  await testAssetProviderAccountConnection(record.id);
                  message.success('连通性测试通过。');
                } catch (error: any) {
                  message.error(normalizeDevErrorMessage(error));
                }
              }}
            >
              测试
            </a>,
            unsupportedReason,
          ),
          <Popconfirm
            key="delete"
            title="确认删除该供应商账号？"
            onConfirm={async () => {
              try {
                await deleteAssetProviderAccount(record.id);
                message.success('供应商账号已删除。');
                await onAccountCatalogChanged();
                actionRef.current?.reload();
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            <a>删除</a>
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
        scroll={{ x: 1180 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) =>
          `Selected ${selectedRowKeys.length} provider account(s)`
        }
        tableAlertOptionRender={() => [
          <a key="delete" onClick={() => openBatchDeleteConfirm()}>
            Batch Delete
          </a>,
          <a key="clear" onClick={() => setSelectedRows([])}>
            Clear
          </a>,
        ]}
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
            新建账号
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      <Modal
        title={editing ? `编辑账号 #${editing.id}` : '新建供应商账号'}
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
              message.error('新建账号时必须填写凭证。');
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
              message.success('供应商账号已更新。');
            } else {
              await createAssetProviderAccount({
                provider_code: values.provider_code,
                name: values.name.trim(),
                status: values.status,
                credential,
                tags: normalizeAssetTags(values.tags),
              });
              message.success('供应商账号已创建。');
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
            label="供应商"
            rules={[{ required: true, message: '请选择供应商。' }]}
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
            label="账号名称"
            rules={[{ required: true, message: '请输入账号名称。' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态">
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
                  ? '更新凭证（留空表示保持原值）'
                  : '账号凭证',
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
        title={detail ? `账号详情 #${detail.id}` : '供应商账号详情'}
        open={Boolean(detail)}
        width={700}
        onClose={() => {
          setDetail(null);
          setRelatedCounts(null);
        }}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} title="基本信息">
              <Descriptions.Item label="账号名称">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="供应商">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {ACCOUNT_STATUS_OPTIONS.find((item) => item.value === detail.status)
                  ?.label || formatText(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="凭证状态">
                {detail.has_credential ? '已配置' : '缺失'}
              </Descriptions.Item>
              <Descriptions.Item label="凭证版本">
                {formatText(detail.credential_version)}
              </Descriptions.Item>
              <Descriptions.Item label="凭证摘要">
                {detail.credential_masked || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最近同步">
                {formatTime(detail.last_synced_at)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatTime(detail.updated_at)}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions bordered column={1} title="标签">
              <Descriptions.Item label="标签">
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
            <Descriptions bordered column={1} title="关联资源">
              <Descriptions.Item label="机器">
                {relatedCounts ? relatedCounts.machines : '加载中...'}
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                {relatedCounts ? relatedCounts.ips : '加载中...'}
              </Descriptions.Item>
              <Descriptions.Item label="SSH 密钥">
                {relatedCounts ? relatedCounts.sshKeys : '加载中...'}
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
                查看机器
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToResource('ips', detail.id);
                }}
              >
                查看 IP
              </Button>
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={() => {
                  setDetail(null);
                  onJumpToResource('ssh-keys', detail.id);
                }}
              >
                查看 SSH 密钥
              </Button>
            </Space>
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

export default ProviderAccountsPanel;
