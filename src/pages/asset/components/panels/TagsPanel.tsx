import {
  CloudDownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Space } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  batchDeleteAssetTags,
  deleteAssetTag,
  listAssetProviderAccounts,
  listAssetTags,
} from '@/services/asset-service/api';
import TagCreateModal from '../tags/TagCreateModal';
import TagImportModal from '../tags/TagImportModal';
import {
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  normalizeDevErrorMessage,
} from '../../utils';

type TagFilters = {
  provider_tag_id?: string;
  key?: string;
  value?: string;
  name?: string;
};

const TagsPanel: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<TagFilters>();
  const [filters, setFilters] = useState<TagFilters>({});
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetProviderTag[]>([]);

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
      message.info('Select tags first.');
      return;
    }
    modal.confirm({
      title: `Delete ${selectedIds.length} selected tag record(s)?`,
      content: 'This only deletes local tag records.',
      okText: 'Delete',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetTags({ ids: selectedIds });
          handleBatchMutationResult('Batch delete tags', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ProColumns<API.AssetProviderTag>[] = useMemo(
    () => [
      {
        title: 'Local ID',
        dataIndex: 'id',
        width: 100,
      },
      {
        title: 'Provider Tag ID',
        dataIndex: 'provider_tag_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Key',
        dataIndex: 'key',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Value',
        dataIndex: 'value',
        width: 240,
        ellipsis: true,
        renderText: formatText,
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
                title: `Delete tag #${record.id}?`,
                content: 'This only deletes the local tag record.',
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: async () => {
                  try {
                    await deleteAssetTag(record.id);
                    message.success('Tag deleted.');
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
      <Form<TagFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_tag_id: values.provider_tag_id?.trim() || undefined,
            key: values.key?.trim() || undefined,
            value: values.value?.trim() || undefined,
            name: values.name?.trim() || undefined,
          })
        }
      >
        <Form.Item name="provider_tag_id" label="Provider Tag ID">
          <Input placeholder="Exact provider_tag_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="key" label="Key">
          <Input placeholder="Exact key" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="value" label="Value">
          <Input placeholder="Exact value" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="name" label="Keyword">
          <Input placeholder="Match tag id, key or value" style={{ width: 240 }} />
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

      <ProTable<API.AssetProviderTag>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1100 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `Selected ${selectedRowKeys.length} tag(s)`}
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
            const response = await listAssetTags({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_tag_id: filters.provider_tag_id,
              key: filters.key,
              value: filters.value,
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

      <TagCreateModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          actionRef.current?.reload();
        }}
      />

      <TagImportModal
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

export default TagsPanel;
