import { App, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetIps,
  listAssetProviderIps,
} from '@/services/asset-service/api';
import {
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  normalizeDevErrorMessage,
} from '../../utils';

const { Text } = Typography;

const PROVIDER_STATUS_OPTIONS = [
  { label: 'available', value: 'available' },
  { label: 'bound', value: 'bound' },
  { label: 'binding', value: 'binding' },
  { label: 'unavailable', value: 'unavailable' },
  { label: 'reserved', value: 'reserved' },
  { label: 'released', value: 'released' },
  { label: 'unknown', value: 'unknown' },
];

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  initialAccountId?: number;
  initialProviderRegionId?: string;
  onCancel: () => void;
  onSuccess: () => void;
};

const IpImportModal: React.FC<Props> = ({
  open,
  accounts,
  initialAccountId,
  initialProviderRegionId,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>(initialAccountId);
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>(
    initialProviderRegionId,
  );
  const [providerIpId, setProviderIpId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetProviderIp[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_ip_id || item.ip || '')),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(initialAccountId);
    setProviderRegionId(initialProviderRegionId);
    setProviderIpId(undefined);
    setStatus(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [initialAccountId, initialProviderRegionId, open]);

  const loadProviderIps = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderIps(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_region_id: providerRegionId?.trim() || undefined,
        provider_ip_id: providerIpId?.trim() || undefined,
        status: status || undefined,
        refresh,
      });
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
      message.error('Select provider IPs first.');
      return;
    }

    const invalidItem = selectedItems.find((item) => !item.ip);
    if (invalidItem) {
      message.error('Selected provider IP row is missing ip.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetIps({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_id: Number(item.provider_id || fallbackProviderId),
          ip: item.ip || '',
          ip_version: item.ip_version || undefined,
          type: item.type || undefined,
          source: 'import',
          provider_region_id: item.provider_region_id || undefined,
          status: item.status || undefined,
          ownership: item.ownership || undefined,
          provider_ip_id: item.provider_ip_id || undefined,
          tags: item.tags,
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
      title="Import Provider IPs"
      open={open}
      width={1120}
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
              Provider Region ID
            </Text>
            <Input
              value={providerRegionId}
              onChange={(event) => setProviderRegionId(event.target.value)}
              placeholder="Optional provider_region_id filter"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Provider IP ID
            </Text>
            <Input
              value={providerIpId}
              onChange={(event) => setProviderIpId(event.target.value)}
              placeholder="Optional provider_ip_id filter"
            />
          </div>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <div style={{ width: 240 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Status
            </Text>
            <Select
              allowClear
              value={status}
              style={{ width: '100%' }}
              options={PROVIDER_STATUS_OPTIONS}
              onChange={setStatus}
              placeholder="Optional status filter"
            />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadProviderIps()}>
            Load Provider IPs
          </Button>
          <Button loading={loading} onClick={() => void loadProviderIps(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderIp>
          rowKey={(record) => record.provider_ip_id || record.ip || ''}
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
              title: 'IP',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.ip || '-'}</Text>
                  <Text type="secondary">{record.provider_ip_id || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'Version / Type',
              width: 180,
              render: (_, record) => `${record.ip_version || '-'} / ${record.type || '-'}`,
            },
            {
              title: 'Provider Region',
              width: 180,
              render: (_, record) => record.provider_region_id || '-',
            },
            {
              title: 'Status',
              width: 120,
              render: (_, record) => <Tag>{record.status || '-'}</Tag>,
            },
            {
              title: 'Ownership',
              width: 120,
              render: (_, record) => record.ownership || '-',
            },
          ]}
          locale={{
            emptyText: accountId ? 'No provider IPs found.' : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default IpImportModal;
