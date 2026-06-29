import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
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
  batchDeleteAssetSshKeys,
  batchUpdateAssetSshKeyStatus,
  createAssetProviderSshKey,
  createAssetSshKeyCustom,
  deleteAssetSshKey,
  getAssetSshKeyDetail,
  importAssetProviderSshKey,
  importAssetSshKeysFromProvider,
  listAssetSshKeys,
  updateAssetSshKey,
} from '@/services/asset-service/api';
import JsonBlock from '../../../dev/components/JsonBlock';
import {
  SSH_CREATE_ACTION_KEYS,
  SSH_IMPORT_ACTION_KEYS,
  SSH_KEY_STATUS_OPTIONS,
} from '../../constants';
import type {
  SharedFilters,
  SshKeyCustomFormValues,
  SshKeyEditFormValues,
  SshKeyProviderFormValues,
  TaskAckHandler,
} from '../../types';
import {
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  parseJsonText,
  renderActionButton,
  stringifyJson,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';

const { TextArea } = Input;

const getSshStatusColor = (status?: string | null) => {
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

const SshKeysPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, onTaskAck }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [customForm] = Form.useForm<SshKeyCustomFormValues>();
  const [providerForm] = Form.useForm<SshKeyProviderFormValues>();
  const [editForm] = Form.useForm<SshKeyEditFormValues>();
  const [batchStatusForm] = Form.useForm<{ status?: string }>();
  const [customOpen, setCustomOpen] = useState(false);
  const [providerImportOpen, setProviderImportOpen] = useState(false);
  const [providerCreateOpen, setProviderCreateOpen] = useState(false);
  const [providerBatchOpen, setProviderBatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [detail, setDetail] = useState<API.AssetSshKey | null>(null);
  const [editing, setEditing] = useState<API.AssetSshKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetSshKey[]>([]);
  const [batchAccountId, setBatchAccountId] = useState<number | undefined>(
    filters.account_id,
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

  useEffect(() => {
    actionRef.current?.reload();
    setSelectedRows([]);
  }, [filters]);

  const selectedIds = useMemo(
    () => selectedRows.map((item) => item.id),
    [selectedRows],
  );

  const handleBatchMutationResult = (title: string, result: API.AssetBatchResult) => {
    const summary = getAssetBatchResultSummary(result);
    if (result.failed > 0) {
      const failureLines = getAssetBatchFailureLines(result);
      modal.info({
        title: `${title}结果`,
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
    actionRef.current?.reload();
  };

  const openBatchDeleteConfirm = () => {
    if (!selectedIds.length) {
      message.info('请先选择 SSH 密钥。');
      return;
    }
    modal.confirm({
      title: `批量删除 ${selectedIds.length} 个 SSH 密钥`,
      okText: '确认删除',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetSshKeys({ ids: selectedIds });
          handleBatchMutationResult('批量删除 SSH 密钥', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ProColumns<API.AssetSshKey>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
    },
    {
      title: '作用域',
      dataIndex: 'scope',
      width: 120,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '供应商',
      dataIndex: 'provider_code',
      width: 120,
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    {
      title: '账号',
      dataIndex: 'account_name',
      width: 180,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '指纹',
      dataIndex: 'fingerprint',
      width: 220,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '私钥',
      dataIndex: 'has_private_key',
      width: 100,
      render: (_, record) =>
        record.has_private_key ? (
          <Tag color="success">已存储</Tag>
        ) : (
          <Tag>未存储</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={getSshStatusColor(record.status)}>
          {SSH_KEY_STATUS_OPTIONS.find((item) => item.value === record.status)?.label ||
            formatText(record.status)}
        </Tag>
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
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      ellipsis: true,
      renderText: formatTime,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
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
          详情
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
                tags: current.tags || [],
              });
              setEditOpen(true);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该 SSH 密钥？"
          onConfirm={async () => {
            try {
              await deleteAssetSshKey(record.id);
              message.success('SSH 密钥已删除。');
              actionRef.current?.reload();
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  const noAccountReason =
    filteredAccounts.length === 0 ? '请先创建供应商账号。' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="暂无可用供应商账号"
          description="请先创建供应商账号，再进行云上 SSH 密钥相关操作。"
        />
      ) : null}

      <ProTable<API.AssetSshKey>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1500 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) =>
          `已选择 ${selectedRowKeys.length} 个 SSH 密钥`
        }
        tableAlertOptionRender={() => [
          <a
            key="status"
            onClick={() => {
              batchStatusForm.resetFields();
              setBatchStatusOpen(true);
            }}
          >
            批量改状态
          </a>,
          <a key="delete" onClick={() => openBatchDeleteConfirm()}>
            批量删除
          </a>,
          <a key="clear" onClick={() => setSelectedRows([])}>
            清空选择
          </a>,
        ]}
        request={async (params) => {
          try {
            const response = await listAssetSshKeys({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
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
            key="custom"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              customForm.resetFields();
              setCustomOpen(true);
            }}
          >
            新建自定义
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
              单个导入
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_IMPORT_ACTION_KEYS,
              ) === false
                ? '当前供应商不支持云上 SSH 密钥导入。'
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
              批量导入
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_IMPORT_ACTION_KEYS,
              ) === false
                ? '当前供应商不支持云上 SSH 密钥导入。'
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
              云上创建
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_CREATE_ACTION_KEYS,
              ) === false
                ? '当前供应商不支持云上 SSH 密钥创建。'
                : undefined),
          ),
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
        title={`批量更新 ${selectedIds.length} 个 SSH 密钥状态`}
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
            const response = await batchUpdateAssetSshKeyStatus({
              ids: selectedIds,
              status: values.status,
            });
            setBatchStatusOpen(false);
            batchStatusForm.resetFields();
            handleBatchMutationResult('批量更新 SSH 密钥状态', response.data);
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
            label="状态"
            rules={[{ required: true, message: '请选择状态。' }]}
          >
            <Select
              options={SSH_KEY_STATUS_OPTIONS.filter((item) =>
                ['active', 'disabled', 'missing'].includes(String(item.value)),
              )}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建自定义 SSH 密钥"
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
              scope: values.scope?.trim() || undefined,
              public_key: values.public_key.trim(),
              private_key: values.private_key?.trim() || undefined,
              metadata: parseJsonText(values.metadata_text, 'Metadata'),
              tags: normalizeAssetTags(values.tags),
            });
            setCustomOpen(false);
            customForm.resetFields();
            message.success('自定义 SSH 密钥已创建。');
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyCustomFormValues> form={customForm} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称。' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="scope" label="作用域">
            <Input placeholder="custom" />
          </Form.Item>
          <Form.Item
            name="public_key"
            label="公钥"
            rules={[{ required: true, message: '请输入公钥。' }]}
          >
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item name="private_key" label="私钥">
            <TextArea rows={5} />
          </Form.Item>
          <AssetTagEditor name="tags" />
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导入单个云上 SSH 密钥"
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
              tags: normalizeAssetTags(values.tags),
            });
            setProviderImportOpen(false);
            providerForm.resetFields();
            message.success('云上 SSH 密钥元数据已导入。');
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
            label="供应商账号"
            rules={[{ required: true, message: '请选择供应商账号。' }]}
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
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称。' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="外部 Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="公钥">
            <TextArea rows={4} />
          </Form.Item>
          <AssetTagEditor name="tags" />
          <Form.Item name="payload_text" label="高级 Payload JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="云上创建 SSH 密钥"
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
              tags: normalizeAssetTags(values.tags),
            });
            setProviderCreateOpen(false);
            providerForm.resetFields();
            onTaskAck(response.data, '云上 SSH 密钥创建任务已提交。');
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
            label="供应商账号"
            rules={[{ required: true, message: '请选择供应商账号。' }]}
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
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称。' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="外部 Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="公钥">
            <TextArea rows={4} />
          </Form.Item>
          <AssetTagEditor name="tags" />
          <Form.Item name="payload_text" label="高级 Payload JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入云上 SSH 密钥"
        open={providerBatchOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => setProviderBatchOpen(false)}
        onOk={async () => {
          if (!batchAccountId) {
            message.error('请选择供应商账号。');
            return;
          }
          try {
            setSaving(true);
            const response = await importAssetSshKeysFromProvider({
              account_id: batchAccountId,
            });
            setProviderBatchOpen(false);
            onTaskAck(response.data, '云上 SSH 密钥批量导入任务已提交。');
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
          placeholder="选择账号"
        />
      </Modal>

      <Modal
        title={editing ? `编辑 SSH 密钥 #${editing.id}` : '编辑 SSH 密钥'}
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
              tags: values.tags ? normalizeAssetTags(values.tags) : undefined,
            });
            setEditOpen(false);
            setEditing(null);
            editForm.resetFields();
            message.success('SSH 密钥已更新。');
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<SshKeyEditFormValues> form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称。' }]}
          >
            <Input />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="scope" label="作用域" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select options={SSH_KEY_STATUS_OPTIONS} />
            </Form.Item>
          </Space>
          <Form.Item name="public_key" label="公钥">
            <TextArea rows={5} />
          </Form.Item>
          <AssetTagEditor name="tags" />
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `SSH 密钥详情 #${detail.id}` : 'SSH 密钥详情'}
        open={Boolean(detail)}
        width={760}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} title="基本信息">
              <Descriptions.Item label="名称">
                {detail.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="作用域">
                {detail.scope || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="供应商">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="账号">
                {detail.account_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="外部 Key ID">
                {detail.external_key_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="指纹">
                {detail.fingerprint || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="私钥状态">
                {detail.has_private_key ? '已存储' : '未存储'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {SSH_KEY_STATUS_OPTIONS.find((item) => item.value === detail.status)
                  ?.label || formatText(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {formatText(detail.created_by)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatTime(detail.updated_at)}
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock title="tags" value={detail.tags} />
            <JsonBlock title="public_key" value={detail.public_key || ''} />
            <JsonBlock title="metadata" value={detail.metadata} />
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

export default SshKeysPanel;
