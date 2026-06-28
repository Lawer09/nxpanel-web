import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAssetIpPullRun,
  importAssetIpsFromProvider,
  listAssetIpPullRunItems,
} from '@/services/asset-service/api';
import type { TaskAckHandler } from '../../types';
import { formatText, formatTime, normalizeDevErrorMessage } from '../../utils';

type Props = {
  open: boolean;
  pullRunId?: number;
  onClose: () => void;
  onImported: TaskAckHandler;
  onImportedDone: () => void;
};

const getStatusColor = (status?: string) => {
  if (status === 'succeeded' || status === 'imported') {
    return 'green';
  }
  if (status === 'failed') {
    return 'red';
  }
  if (status === 'running' || status === 'binding') {
    return 'blue';
  }
  if (status === 'pending') {
    return 'gold';
  }
  return 'default';
};

const IpPullRunDrawer: React.FC<Props> = ({
  open,
  pullRunId,
  onClose,
  onImported,
  onImportedDone,
}) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [summary, setSummary] = useState<API.AssetIpPullRun | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const loadSummary = async () => {
    if (!pullRunId) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const response = await getAssetIpPullRun(pullRunId);
      setSummary(response.data);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !pullRunId) {
      return;
    }
    void loadSummary();
    actionRef.current?.reload();
    setSelectedRowKeys([]);
  }, [open, pullRunId]);

  const handleImport = async (payload: API.AssetIpImportFromProviderParams) => {
    try {
      setImporting(true);
      const response = await importAssetIpsFromProvider(payload);
      onImportedDone();
      onImported(response.data, 'IP import submitted.');
      await loadSummary();
      actionRef.current?.reload();
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const columns: ProColumns<API.AssetIpPullItem>[] = [
    { title: 'IP', dataIndex: 'ip', renderText: formatText },
    { title: 'Version', dataIndex: 'ip_version', width: 90, renderText: formatText },
    { title: 'Type', dataIndex: 'type', renderText: formatText },
    { title: 'Region', dataIndex: 'region', renderText: formatText },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>{record.status || '-'}</Tag>
      ),
    },
    {
      title: 'Imported',
      dataIndex: 'imported',
      render: (_, record) =>
        record.imported ? (
          <Tag color="green">Imported</Tag>
        ) : (
          <Tag>Pending</Tag>
        ),
    },
    {
      title: 'Import Status',
      dataIndex: 'import_status',
      render: (_, record) => (
        <Tag color={getStatusColor(record.import_status)}>
          {record.import_status || '-'}
        </Tag>
      ),
    },
    {
      title: 'External IP ID',
      dataIndex: 'external_ip_id',
      renderText: formatText,
      ellipsis: true,
    },
    {
      title: 'Error',
      dataIndex: 'error_summary',
      renderText: formatText,
      ellipsis: true,
    },
  ];

  const importDisabled = !summary || summary.status !== 'succeeded';

  return (
    <Drawer
      title={pullRunId ? `Provider IP Pull #${pullRunId}` : 'Provider IP Pull'}
      open={open}
      width={1200}
      onClose={onClose}
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={summaryLoading}
            onClick={() => {
              void loadSummary();
              actionRef.current?.reload();
            }}
          >
            Refresh
          </Button>
          <Button
            disabled={importDisabled || selectedRowKeys.length === 0}
            loading={importing}
            onClick={() =>
              pullRunId
                ? void handleImport({
                    pull_run_id: pullRunId,
                    item_ids: selectedRowKeys.map((item) => Number(item)),
                  })
                : undefined
            }
          >
            Import Selected
          </Button>
          <Button
            type="primary"
            disabled={importDisabled}
            loading={importing}
            onClick={() =>
              pullRunId
                ? void handleImport({
                    pull_run_id: pullRunId,
                    import_all: true,
                  })
                : undefined
            }
          >
            Import Pulled Page
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {summary?.status !== 'succeeded' ? (
          <Alert
            type={summary?.status === 'failed' ? 'error' : 'info'}
            showIcon
            message={
              summary?.status === 'failed'
                ? 'Pull task failed'
                : 'Pull task is still processing'
            }
            description={
              summary?.error_summary ||
              'Refresh this drawer after the provider pull task completes.'
            }
          />
        ) : null}
        {summary?.cached ? (
          <Alert
            type="warning"
            showIcon
            message="Showing cached pull result"
            description="The latest pull request reused an unexpired staged result from Redis."
          />
        ) : null}
        {summary ? (
          <Descriptions bordered column={3} size="small">
            <Descriptions.Item label="Account">
              {summary.account_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Provider">
              {summary.provider_code || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Region">
              {summary.region || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(summary.status)}>
                {summary.status || '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Provider Page">
              {summary.page || 1}
            </Descriptions.Item>
            <Descriptions.Item label="Page Size">
              {summary.page_size || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Provider Total">
              {formatText(summary.total_count)}
            </Descriptions.Item>
            <Descriptions.Item label="Pulled Count">
              {formatText(summary.pulled_count)}
            </Descriptions.Item>
            <Descriptions.Item label="Imported Count">
              {formatText(summary.imported_count)}
            </Descriptions.Item>
            <Descriptions.Item label="Expires At">
              {formatTime(summary.expires_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatTime(summary.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatTime(summary.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
        <ProTable<API.AssetIpPullItem>
          rowKey="id"
          actionRef={actionRef}
          search={{
            labelWidth: 'auto',
          }}
          options={false}
          columns={[
            ...columns,
            { title: 'IP Filter', dataIndex: 'ip', hideInTable: true },
            { title: 'Region', dataIndex: 'region', hideInTable: true },
            { title: 'Status', dataIndex: 'status', hideInTable: true },
            { title: 'Type', dataIndex: 'type', hideInTable: true },
          ]}
          rowSelection={{
            selectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: Boolean(record.imported),
            }),
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          request={async (params) => {
            if (!pullRunId) {
              return { data: [], success: true, total: 0 };
            }
            try {
              const response = await listAssetIpPullRunItems(pullRunId, {
                page: Number(params.current || 1),
                page_size: Number(params.pageSize || 10),
                status: params.status as string | undefined,
                type: params.type as string | undefined,
                region: params.region as string | undefined,
                ip: params.ip as string | undefined,
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
        />
      </Space>
    </Drawer>
  );
};

export default IpPullRunDrawer;
