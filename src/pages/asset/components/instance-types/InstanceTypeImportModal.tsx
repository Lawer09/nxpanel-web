import { App, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetInstanceTypes,
  listAssetProviderInstanceTypes,
} from '@/services/asset-service/api';
import {
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  normalizeDevErrorMessage,
} from '../../utils';

const { Text } = Typography;

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  onCancel: () => void;
  onSuccess: () => void;
};

const InstanceTypeImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerInstanceTypeId, setProviderInstanceTypeId] = useState<string | undefined>();
  const [providerZoneId, setProviderZoneId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetProviderInstanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () =>
      items.filter((item) =>
        selectedRowKeys.includes(item.provider_instance_type_id || ''),
      ),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderInstanceTypeId(undefined);
    setProviderZoneId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadInstanceTypes = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderInstanceTypes(
        selectedAccount.provider_code,
        accountId,
        {
          page: 1,
          page_size: 200,
          provider_instance_type_id: providerInstanceTypeId?.trim() || undefined,
          provider_zone_id: providerZoneId?.trim() || undefined,
          refresh,
        },
      );
      setItems(response.data?.items || []);
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedItems.length) {
      message.error('Select provider instance types first.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetInstanceTypes({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_id: Number(item.provider_id || fallbackProviderId),
          provider_instance_type_id: item.provider_instance_type_id || undefined,
          name: item.name || undefined,
          cpu_count: item.cpu_count,
          memory_mb: item.memory_mb,
          bps: item.bps,
          pps: item.pps,
          with_stock: item.with_stock,
          internet_bandwidth_limit: item.internet_bandwidth_limit,
          source: 'import',
          provider_zone_id: item.provider_zone_id || item.provider_zone_ids?.[0],
          provider_zone_ids: item.provider_zone_ids,
        })),
      });
      const summary = getAssetBatchResultSummary(response.data);
      const failureLines = getAssetBatchFailureLines(response.data);
      if (response.data.failed > 0) {
        message.warning(
          failureLines.length ? `${summary} ${failureLines.join('; ')}` : summary,
        );
      } else {
        message.success(summary);
      }
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Import Provider Instance Types"
      open={open}
      width={1100}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleImport()}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space size={16} align="start" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Account
            </Text>
            <Select
              showSearch
              value={accountId}
              style={{ width: '100%' }}
              optionFilterProp="label"
              options={accounts.map((item) => ({
                label: `${item.name} (#${item.id})`,
                value: item.id,
              }))}
              onChange={setAccountId}
              placeholder="Select provider account"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Provider Instance Type ID
            </Text>
            <Input
              value={providerInstanceTypeId}
              onChange={(event) => setProviderInstanceTypeId(event.target.value)}
              placeholder="Optional provider_instance_type_id filter"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Provider Zone ID
            </Text>
            <Input
              value={providerZoneId}
              onChange={(event) => setProviderZoneId(event.target.value)}
              placeholder="Optional provider_zone_id filter"
            />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadInstanceTypes()}>
            Load Provider Instance Types
          </Button>
          <Button loading={loading} onClick={() => void loadInstanceTypes(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderInstanceType>
          rowKey={(record) => record.provider_instance_type_id || ''}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          dataSource={items}
          columns={[
            {
              title: 'Instance Type',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>
                    {record.name || record.provider_instance_type_id || '-'}
                  </Text>
                  <Text type="secondary">
                    {record.provider_instance_type_id || '-'}
                  </Text>
                </Space>
              ),
            },
            {
              title: 'CPU / Memory',
              width: 180,
              render: (_, record) =>
                `${record.cpu_count ?? '-'} / ${record.memory_mb ?? '-'}`,
            },
            {
              title: 'BPS / PPS',
              width: 180,
              render: (_, record) => `${record.bps ?? '-'} / ${record.pps ?? '-'}`,
            },
            {
              title: 'Stock',
              width: 120,
              render: (_, record) => <Tag>{String(record.with_stock ?? '-')}</Tag>,
            },
            {
              title: 'Provider Zones',
              width: 220,
              render: (_, record) =>
                record.provider_zone_ids?.length
                  ? record.provider_zone_ids.join(', ')
                  : record.provider_zone_id || '-',
            },
          ]}
          locale={{
            emptyText: accountId
              ? 'No provider instance types found.'
              : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default InstanceTypeImportModal;
