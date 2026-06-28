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
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  parseJsonText,
  renderActionButton,
  stringifyJson,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';

const { TextArea } = Input;

const SshKeysPanel: React.FC<{
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
    {
      title: 'External Key ID',
      dataIndex: 'external_key_id',
      renderText: formatText,
    },
    { title: 'Fingerprint', dataIndex: 'fingerprint', renderText: formatText },
    {
      title: 'Private Key',
      dataIndex: 'has_private_key',
      render: (_, record) =>
        record.has_private_key ? (
          <Tag color="green">Present</Tag>
        ) : (
          <Tag>Not Stored</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => <Tag>{record.status || '-'}</Tag>,
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
                tags: current.tags || [],
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
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_IMPORT_ACTION_KEYS,
              ) === false
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
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_IMPORT_ACTION_KEYS,
              ) === false
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
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                SSH_CREATE_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider-side SSH create.'
                : undefined),
          ),
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
              scope: values.scope?.trim() || undefined,
              public_key: values.public_key.trim(),
              private_key: values.private_key?.trim() || undefined,
              metadata: parseJsonText(values.metadata_text, 'Metadata'),
              tags: normalizeAssetTags(values.tags),
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
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="scope" label="Scope">
            <Input placeholder="custom" />
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
          <AssetTagEditor name="tags" />
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
              tags: normalizeAssetTags(values.tags),
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
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="External Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="Public Key">
            <TextArea rows={4} />
          </Form.Item>
          <AssetTagEditor name="tags" />
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
              tags: normalizeAssetTags(values.tags),
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
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="external_key_id" label="External Key ID">
            <Input />
          </Form.Item>
          <Form.Item name="public_key" label="Public Key">
            <TextArea rows={4} />
          </Form.Item>
          <AssetTagEditor name="tags" />
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
            const response = await importAssetSshKeysFromProvider({
              account_id: batchAccountId,
            });
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
              tags: values.tags ? normalizeAssetTags(values.tags) : undefined,
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
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name.' }]}
          >
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
          <AssetTagEditor name="tags" />
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
              <Descriptions.Item label="Name">
                {detail.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Scope">
                {detail.scope || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Provider">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {detail.account_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="External Key ID">
                {detail.external_key_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Fingerprint">
                {detail.fingerprint || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Private Key">
                {detail.has_private_key ? 'Stored' : 'Not Stored'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {detail.status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {formatText(detail.created_by)}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
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
