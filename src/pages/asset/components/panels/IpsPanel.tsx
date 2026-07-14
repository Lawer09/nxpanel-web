import {
  CloudDownloadOutlined,
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
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  batchDeleteAssetIps,
  batchUpdateAssetIpStatus,
  batchUpdateAssetIpTags,
  createAssetIp,
  deleteAssetIp,
  getAssetIpDetail,
  listAssetIps,
  updateAssetIp,
} from '@/services/asset-service/api';
import { IP_IMPORT_ACTION_KEYS, IP_STATUS_OPTIONS } from '../../constants';
import type {
  AssetTagFormValue,
  IpFormValues,
  SharedFilters,
  TaskAckHandler,
} from '../../types';
import {
  cleanupObject,
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  getAssetSourceLabel,
  isProviderCapabilitySupported,
  normalizeAssetTags,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';
import IpImportModal from '../ips/IpImportModal';

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
];

const getIpStatusColor = (status?: string | null) => {
  if (status === 'available') {
    return 'success';
  }
  if (status === 'bound') {
    return 'processing';
  }
  if (status === 'reserved') {
    return 'warning';
  }
  if (status === 'released') {
    return 'default';
  }
  return 'default';
};

const IpsPanel: React.FC<{
  filters: SharedFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onTaskAck: TaskAckHandler;
}> = ({ filters, providers, accounts, onTaskAck: _onTaskAck }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<IpFormValues>();
  const [batchStatusForm] = Form.useForm<{ status?: string }>();
  const [batchTagForm] = Form.useForm<{ tags?: AssetTagFormValue[] }>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetIp | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<API.AssetIp | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchTagOpen, setBatchTagOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetIp[]>([]);

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
    setSelectedRows([]);
  }, [filters]);

  const selectedIds = useMemo(() => selectedRows.map((item) => item.id), [selectedRows]);

  const handleBatchMutationResult = (title: string, result: API.AssetBatchResult) => {
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
    actionRef.current?.reload();
  };

  const openBatchDeleteConfirm = () => {
    if (!selectedIds.length) {
      message.info('Select IPs first.');
      return;
    }
    modal.confirm({
      title: `Delete ${selectedIds.length} selected IP record(s)?`,
      okText: 'Delete',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetIps({ ids: selectedIds });
          handleBatchMutationResult('Batch delete IPs', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const buildCreatePayload = (values: IpFormValues): API.AssetIpCreateParams =>
    cleanupObject({
      ip: values.ip?.trim(),
      ip_version: values.ip_version,
      type: values.type?.trim(),
      source: values.source?.trim() || 'manual',
      provider_id: values.provider_id,
      region_id: values.region_id,
      provider_region_id: values.provider_region_id?.trim(),
      status: values.status?.trim(),
      ownership: values.ownership?.trim(),
      provider_ip_id: values.provider_ip_id?.trim(),
      tags: normalizeAssetTags(values.tags),
    }) as API.AssetIpCreateParams;

  const columns: ProColumns<API.AssetIp>[] = useMemo(
    () => [
      {
        title: 'IP',
        dataIndex: 'ip',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Version / Type',
        width: 160,
        render: (_, record) => `${formatText(record.ip_version)} / ${formatText(record.type)}`,
      },
      {
        title: 'Provider',
        dataIndex: 'provider_code',
        width: 140,
        render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
      },
      {
        title: 'Provider IP ID',
        dataIndex: 'provider_ip_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Provider Region ID',
        dataIndex: 'provider_region_id',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Local Region ID',
        dataIndex: 'region_id',
        width: 140,
        renderText: formatText,
      },
      {
        title: 'Source',
        dataIndex: 'source',
        width: 120,
        render: (_, record) => formatText(getAssetSourceLabel(record.source)),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => (
          <Tag color={getIpStatusColor(record.status)}>
            {IP_STATUS_OPTIONS.find((item) => item.value === record.status)?.label ||
              formatText(record.status)}
          </Tag>
        ),
      },
      {
        title: 'Ownership',
        dataIndex: 'ownership',
        width: 120,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        width: 100,
        render: (_, record) => (record.tags?.length ? String(record.tags.length) : '-'),
      },
      {
        title: 'Updated At',
        dataIndex: 'updated_at',
        width: 180,
        ellipsis: true,
        renderText: formatTime,
      },
      {
        title: 'Action',
        valueType: 'option',
        width: 180,
        fixed: 'right',
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
                  provider_id: current.provider_id || undefined,
                  region_id: current.region_id,
                  provider_region_id: current.provider_region_id,
                  status: current.status,
                  ownership: current.ownership,
                  provider_ip_id: current.provider_ip_id,
                  tags: current.tags || [],
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
            title="Delete this local IP record?"
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
    ],
    [form, message],
  );

  const noAccountReason =
    filteredAccounts.length === 0 ? 'Create a provider account first.' : undefined;

  return (
    <>
      {filteredAccounts.length === 0 ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="No provider accounts available"
          description="Create a provider account before importing provider IPs."
        />
      ) : null}

      <ProTable<API.AssetIp>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1700 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `Selected ${selectedRowKeys.length} IP(s)`}
        tableAlertOptionRender={() => [
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
            const response = await listAssetIps({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              account_id: filters.account_id,
              region: filters.region,
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
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({
                ip_version: 4,
                source: 'manual',
                status: 'available',
                ownership: 'self',
              });
              setOpen(true);
            }}
          >
            Create
          </Button>,
          renderActionButton(
            <Button
              key="import"
              icon={<CloudDownloadOutlined />}
              onClick={() => setImportOpen(true)}
            >
              Import From Provider
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                IP_IMPORT_ACTION_KEYS,
              ) === false
                ? 'Current provider does not support provider IP import.'
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
        title={`Batch update ${selectedIds.length} IP status`}
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
            const response = await batchUpdateAssetIpStatus({
              ids: selectedIds,
              status: values.status,
            });
            setBatchStatusOpen(false);
            batchStatusForm.resetFields();
            handleBatchMutationResult('Batch update IP status', response.data);
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
            rules={[{ required: true, message: 'Select status.' }]}
          >
            <Select options={IP_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Batch replace tags for ${selectedIds.length} IP(s)`}
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
            const response = await batchUpdateAssetIpTags({
              ids: selectedIds,
              tags: normalizeAssetTags(values.tags),
            });
            setBatchTagOpen(false);
            batchTagForm.resetFields();
            handleBatchMutationResult('Batch update IP tags', response.data);
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

      <Modal
        title={editing ? `Edit IP #${editing.id}` : 'Create IP'}
        open={open}
        destroyOnHidden
        width={860}
        confirmLoading={saving}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setSaving(true);
            if (editing) {
              await updateAssetIp(
                cleanupObject({
                  id: editing.id,
                  type: values.type?.trim(),
                  region_id: values.region_id,
                  provider_region_id: values.provider_region_id?.trim(),
                  status: values.status?.trim(),
                  ownership: values.ownership?.trim(),
                  provider_ip_id: values.provider_ip_id?.trim(),
                  tags: normalizeAssetTags(values.tags),
                }) as API.AssetIpUpdateParams,
              );
              message.success('IP updated.');
            } else {
              await createAssetIp(buildCreatePayload(values));
              message.success('IP created.');
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
            rules={!editing ? [{ required: true, message: 'Enter IP address.' }] : []}
          >
            <Input disabled={Boolean(editing)} />
          </Form.Item>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="ip_version" label="IP Version" style={{ flex: 1 }}>
              <InputNumber min={4} max={6} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="type" label="Type" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="source" label="Source" style={{ flex: 1 }}>
              <Select disabled={Boolean(editing)} options={SOURCE_OPTIONS} />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="provider_id" label="Provider" style={{ flex: 1 }}>
              <Select
                allowClear
                disabled={Boolean(editing)}
                showSearch
                optionFilterProp="label"
                options={providers.map((item) => ({
                  label: `${item.name || item.code} (#${item.id})`,
                  value: item.id,
                }))}
              />
            </Form.Item>
            <Form.Item name="provider_ip_id" label="Provider IP ID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="provider_region_id" label="Provider Region ID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="region_id" label="Local Region ID" style={{ flex: 1 }}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={IP_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="ownership" label="Ownership" style={{ flex: 1 }}>
              <Input placeholder="self / provider / unknown" />
            </Form.Item>
          </Space>

          <AssetTagEditor name="tags" label="Tags" />
        </Form>
      </Modal>

      <IpImportModal
        open={importOpen}
        accounts={filteredAccounts}
        initialAccountId={filters.account_id}
        initialProviderRegionId={filters.region}
        onCancel={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          actionRef.current?.reload();
        }}
      />

      <Drawer
        title={detail ? detail.ip || detail.provider_ip_id || `IP #${detail.id}` : 'IP Detail'}
        open={Boolean(detail)}
        width={760}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Local ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP">{detail.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="IP Version">
              {formatText(detail.ip_version)}
            </Descriptions.Item>
            <Descriptions.Item label="Type">{detail.type || '-'}</Descriptions.Item>
            <Descriptions.Item label="Source">
              {formatText(getAssetSourceLabel(detail.source))}
            </Descriptions.Item>
            <Descriptions.Item label="Provider IP ID">
              {detail.provider_ip_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Provider Region ID">
              {detail.provider_region_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Local Region ID">
              {formatText(detail.region_id)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {IP_STATUS_OPTIONS.find((item) => item.value === detail.status)?.label ||
                formatText(detail.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Ownership">{detail.ownership || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatTime(detail.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatTime(detail.updated_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Tags" span={2}>
              <Space size={[8, 8]} wrap>
                {detail.tags?.length
                  ? detail.tags.map((tag) => (
                      <Tag key={`${tag.key}:${tag.value}`}>{`${tag.key}=${tag.value}`}</Tag>
                    ))
                  : '-'}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </>
  );
};

export default IpsPanel;
