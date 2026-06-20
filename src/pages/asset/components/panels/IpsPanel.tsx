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
  deleteAssetIp,
  getAssetIpDetail,
  importAssetIpManual,
  importAssetIpsFromProvider,
  listAssetIps,
  updateAssetIp,
} from '@/services/asset-service/api';
import JsonBlock from '../../../dev/components/JsonBlock';
import { IP_IMPORT_ACTION_KEYS, IP_STATUS_OPTIONS } from '../../constants';
import type { IpFormValues, SharedFilters, TaskAckHandler } from '../../types';
import {
  cleanupObject,
  formatText,
  formatTime,
  isProviderCapabilitySupported,
  normalizeDevErrorMessage,
  parseJsonText,
  renderActionButton,
  stringifyJson,
} from '../../utils';

const { TextArea } = Input;

const IpsPanel: React.FC<{
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
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => <Tag>{record.status || '-'}</Tag>,
    },
    { title: 'Ownership', dataIndex: 'ownership', renderText: formatText },
    {
      title: 'External IP ID',
      dataIndex: 'external_ip_id',
      renderText: formatText,
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
              form.setFieldsValue({
                ip_version: 4,
                source: 'manual',
                status: 'available',
              });
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
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                IP_IMPORT_ACTION_KEYS,
              ) === false
                ? 'Current provider capability does not support provider-side IP import.'
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
              await importAssetIpManual(
                payload as API.AssetIpImportManualParams,
              );
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
            rules={
              !editing ? [{ required: true, message: 'Please enter IP.' }] : []
            }
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
              <Descriptions.Item label="IP">
                {detail.ip || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP Version">
                {formatText(detail.ip_version)}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {detail.type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Provider">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Account">
                {detail.account_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Region">
                {detail.region || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {detail.status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ownership">
                {detail.ownership || '-'}
              </Descriptions.Item>
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

export default IpsPanel;
