import {
  CloudDownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  batchDeleteAssetSubnets,
  deleteAssetSubnet,
  listAssetProviderAccounts,
  listAssetSubnets,
} from '@/services/asset-service/api';
import SubnetCreateModal from '../subnets/SubnetCreateModal';
import SubnetImportModal from '../subnets/SubnetImportModal';
import {
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type SubnetFilters = {
  provider_code?: string;
  source?: string;
  resource_id?: string;
  region_id?: string;
  vpc_id?: string;
  name?: string;
};

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
];

const SubnetsPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<SubnetFilters>();
  const [filters, setFilters] = useState<SubnetFilters>({});
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetSubnet[]>([]);

  useEffect(() => {
    actionRef.current?.reload();
    setSelectedRows([]);
  }, [filters]);

  const selectedIds = useMemo(() => selectedRows.map((item) => item.id), [selectedRows]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await listAssetProviderAccounts({ page: 1, page_size: 200 });
        setAccounts(response.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      }
    };

    void loadAccounts();
  }, [message]);

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
      message.info('Select subnets first.');
      return;
    }
    modal.confirm({
      title: `Delete ${selectedIds.length} selected subnet record(s)?`,
      content: 'This only deletes local subnet records.',
      okText: 'Delete',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetSubnets({ ids: selectedIds });
          handleBatchMutationResult('Batch delete subnets', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ProColumns<API.AssetSubnet>[] = useMemo(
    () => [
      {
        title: 'Local ID',
        dataIndex: 'id',
        width: 100,
      },
      {
        title: 'Provider',
        dataIndex: 'provider_code',
        width: 140,
        render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
      },
      {
        title: 'Subnet ID',
        dataIndex: 'provider_subnet_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'CIDR Block',
        dataIndex: 'cidr_block',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Gateway IP',
        dataIndex: 'gateway_ip_address',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'VPC',
        width: 240,
        ellipsis: true,
        render: (_, record) =>
          [record.vpc_name, record.vpc_id].filter(Boolean).join(' / ') || '-',
      },
      {
        title: 'Region ID',
        dataIndex: 'region_id',
        width: 120,
        renderText: formatText,
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        width: 100,
        render: (_, record) => (record.tags?.length ? String(record.tags.length) : '-'),
      },
      {
        title: 'Source',
        dataIndex: 'source',
        width: 140,
        render: (_, record) => formatText(getAssetSourceLabel(record.source)),
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
        width: 120,
        render: (_, record) => [
          <a
            key="delete"
            onClick={() => {
              modal.confirm({
                title: `Delete subnet #${record.id}?`,
                content: 'This only deletes the local subnet record.',
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: async () => {
                  try {
                    await deleteAssetSubnet(record.id);
                    message.success('Subnet deleted.');
                    actionRef.current?.reload();
                  } catch (error: any) {
                    message.error(normalizeDevErrorMessage(error));
                    throw error;
                  }
                },
              });
            }}
          >
            Delete
          </a>,
        ],
      },
    ],
    [message, modal],
  );

  return (
    <>
      <Form<SubnetFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
            resource_id: values.resource_id?.trim() || undefined,
            region_id: values.region_id?.trim() || undefined,
            vpc_id: values.vpc_id?.trim() || undefined,
            name: values.name?.trim() || undefined,
          })
        }
      >
        <Form.Item name="provider_code" label="Provider">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All providers"
            style={{ width: 220 }}
            options={providers.map((item) => ({
              label: `${item.name || item.code} (${item.code})`,
              value: item.code,
            }))}
          />
        </Form.Item>
        <Form.Item name="source" label="Source">
          <Select
            allowClear
            placeholder="All source"
            style={{ width: 160 }}
            options={SOURCE_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="resource_id" label="Subnet ID">
          <Input placeholder="Exact provider_subnet_id" style={{ width: 240 }} />
        </Form.Item>
        <Form.Item name="region_id" label="Region ID">
          <Input placeholder="Filter by local region_id" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="vpc_id" label="VPC ID">
          <Input placeholder="Exact vpc_id" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="name" label="Keyword">
          <Input placeholder="Match subnet id or VPC name" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Apply
            </Button>
            <Button
              onClick={() => {
                filterForm.resetFields();
                setFilters({});
              }}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <ProTable<API.AssetSubnet>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1660 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `Selected ${selectedRowKeys.length} subnet(s)`}
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
            const response = await listAssetSubnets({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
              resource_id: filters.resource_id,
              region_id: filters.region_id,
              vpc_id: filters.vpc_id,
              name: filters.name,
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
            onClick={() => setCreateOpen(true)}
          >
            Create
          </Button>,
          <Button
            key="import"
            icon={<CloudDownloadOutlined />}
            onClick={() => setImportOpen(true)}
          >
            Import From Provider
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

      <SubnetCreateModal
        open={createOpen}
        providers={providers}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          actionRef.current?.reload();
        }}
      />

      <SubnetImportModal
        open={importOpen}
        accounts={accounts}
        onCancel={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default SubnetsPanel;
