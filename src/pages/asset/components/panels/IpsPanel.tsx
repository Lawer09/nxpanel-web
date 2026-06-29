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
  deleteAssetIp,
  getAssetIpDetail,
  importAssetIpManual,
  listAssetIps,
  pullAssetIpsFromProvider,
  updateAssetIp,
} from '@/services/asset-service/api';
import JsonBlock from '../../../dev/components/JsonBlock';
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
  parseJsonText,
  renderActionButton,
  stringifyJson,
} from '../../utils';
import AssetTagEditor from '../AssetTagEditor';
import IpPullFromProviderModal from '../ips/IpPullFromProviderModal';
import IpPullRunDrawer from '../ips/IpPullRunDrawer';

const { TextArea } = Input;

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
}> = ({ filters, providers, accounts, onTaskAck }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<IpFormValues>();
  const [batchStatusForm] = Form.useForm<{ status?: string }>();
  const [batchTagForm] = Form.useForm<{ tags?: AssetTagFormValue[] }>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetIp | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<API.AssetIp | null>(null);
  const [pullOpen, setPullOpen] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchTagOpen, setBatchTagOpen] = useState(false);
  const [pullRunId, setPullRunId] = useState<number | undefined>();
  const [pullRunOpen, setPullRunOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetIp[]>([]);
  const [pullInitialValues, setPullInitialValues] = useState<
    Partial<API.AssetIpPullFromProviderParams>
  >({
    account_id: filters.account_id,
    region: filters.region,
    page: 1,
    page_size: 50,
  });

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
      message.info('请先选择 IP。');
      return;
    }
    modal.confirm({
      title: `批量删除 ${selectedIds.length} 条 IP 记录`,
      okText: '确认删除',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetIps({ ids: selectedIds });
          handleBatchMutationResult('批量删除 IP', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

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
      tags: normalizeAssetTags(values.tags),
    });

  const columns: ProColumns<API.AssetIp>[] = [
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 180,
    },
    {
      title: '版本/类型',
      width: 140,
      render: (_, record) => `${record.ip_version || '-'} / ${record.type || '-'}`,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 110,
      render: (_, record) => formatText(getAssetSourceLabel(record.source)),
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
      title: '地域',
      dataIndex: 'region',
      width: 140,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={getIpStatusColor(record.status)}>
          {IP_STATUS_OPTIONS.find((item) => item.value === record.status)?.label ||
            formatText(record.status)}
        </Tag>
      ),
    },
    {
      title: '归属',
      dataIndex: 'ownership',
      width: 140,
      ellipsis: true,
      renderText: formatText,
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
              const response = await getAssetIpDetail(record.id);
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
                tags: current.tags || [],
              });
              setOpen(true);
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该 IP 记录？"
          onConfirm={async () => {
            try {
              await deleteAssetIp(record.id);
              message.success('IP 已删除。');
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
          description="请先创建供应商账号，再进行云上 IP 拉取。"
        />
      ) : null}

      <ProTable<API.AssetIp>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1400 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `已选择 ${selectedRowKeys.length} 条 IP`}
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
          <a
            key="tags"
            onClick={() => {
              batchTagForm.setFieldsValue({ tags: [] });
              setBatchTagOpen(true);
            }}
          >
            批量改标签
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
            手动录入
          </Button>,
          renderActionButton(
            <Button
              key="provider-import"
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                setPullInitialValues({
                  account_id: filters.account_id,
                  region: filters.region,
                  page: 1,
                  page_size: 50,
                });
                setPullOpen(true);
              }}
            >
              云上拉取
            </Button>,
            noAccountReason ||
              (filters.provider_code &&
              isProviderCapabilitySupported(
                providerMap.get(filters.provider_code),
                IP_IMPORT_ACTION_KEYS,
              ) === false
                ? '当前供应商不支持云上 IP 拉取。'
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
        title={`批量更新 ${selectedIds.length} 条 IP 状态`}
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
            handleBatchMutationResult('批量更新 IP 状态', response.data);
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
            <Select options={IP_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`批量替换 ${selectedIds.length} 条 IP 标签`}
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
            handleBatchMutationResult('批量更新 IP 标签', response.data);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={batchTagForm} layout="vertical">
          <AssetTagEditor name="tags" label="标签" />
        </Form>
      </Modal>

      <Modal
        title={editing ? `编辑 IP #${editing.id}` : '手动录入 IP'}
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
                tags: payload.tags,
              });
              message.success('IP 已更新。');
            } else {
              await importAssetIpManual(
                payload as API.AssetIpImportManualParams,
              );
              message.success('IP 已录入。');
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
            rules={!editing ? [{ required: true, message: '请输入 IP。' }] : []}
          >
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="ip_version" label="IP 版本" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="type" label="类型" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="source" label="来源" style={{ flex: 1 }}>
              <Input disabled={Boolean(editing)} />
            </Form.Item>
          </Space>
          <Space size={16} align="start" style={{ width: '100%' }}>
            <Form.Item name="region" label="地域" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select options={IP_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="ownership" label="归属" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="external_ip_id" label="外部 IP ID">
            <Input />
          </Form.Item>
          <AssetTagEditor name="tags" />
          <Form.Item name="metadata_text" label="Metadata JSON">
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>

      <IpPullFromProviderModal
        open={pullOpen}
        loading={saving}
        accounts={filteredAccounts}
        initialValues={pullInitialValues}
        onCancel={() => setPullOpen(false)}
        onSubmit={async (values) => {
          try {
            setSaving(true);
            const response = await pullAssetIpsFromProvider({
              account_id: values.account_id,
              region: values.region?.trim() || undefined,
              status: values.status,
              page: values.page,
              page_size: values.page_size,
              refresh: values.refresh,
            });
            const nextPullRunId =
              response.data.pull_run_id || response.data.task_id;
            if (!nextPullRunId) {
              throw new Error('云上 IP 拉取未返回 pull run id。');
            }
            setPullOpen(false);
            setPullRunId(nextPullRunId);
            setPullRunOpen(true);
            message.success(
              response.data.cached
                ? '已加载缓存的云上 IP 拉取结果。'
                : '云上 IP 拉取任务已提交。',
            );
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      />

      <Drawer
        title={detail ? `IP 详情 #${detail.id}` : 'IP 详情'}
        open={Boolean(detail)}
        width={720}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} title="基本信息">
              <Descriptions.Item label="IP">
                {detail.ip || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="IP 版本">
                {formatText(detail.ip_version)}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {detail.type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">
                {getAssetSourceLabel(detail.source)}
              </Descriptions.Item>
              <Descriptions.Item label="供应商">
                {detail.provider_code || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="账号">
                {detail.account_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="地域">
                {detail.region || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {IP_STATUS_OPTIONS.find((item) => item.value === detail.status)?.label ||
                  formatText(detail.status)}
              </Descriptions.Item>
              <Descriptions.Item label="归属">
                {detail.ownership || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="外部 IP ID">
                {detail.external_ip_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatTime(detail.updated_at)}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions bordered column={1} title="机器绑定">
              <Descriptions.Item label="机器">
                {detail.machine_binding?.machine_business_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="机器本地 ID">
                {formatText(detail.machine_binding?.machine_id)}
              </Descriptions.Item>
              <Descriptions.Item label="绑定类型">
                {detail.machine_binding?.bind_type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="是否主 IP">
                {formatText(detail.machine_binding?.is_primary)}
              </Descriptions.Item>
              <Descriptions.Item label="绑定时间">
                {formatTime(detail.machine_binding?.bound_at)}
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock title="tags" value={detail.tags} />
            <JsonBlock title="metadata" value={detail.metadata} />
          </Space>
        ) : null}
      </Drawer>
      <IpPullRunDrawer
        open={pullRunOpen}
        pullRunId={pullRunId}
        onClose={() => setPullRunOpen(false)}
        onImported={onTaskAck}
        onImportedDone={() => actionRef.current?.reload()}
      />
    </>
  );
};

export default IpsPanel;
