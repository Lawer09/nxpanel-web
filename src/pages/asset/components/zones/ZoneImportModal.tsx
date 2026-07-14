import { App, Button, Input, Modal, Select, Space, Table, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetZones,
  listAssetProviderZones,
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

const ZoneImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>();
  const [providerZoneId, setProviderZoneId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_zone_id || item.id)),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderRegionId(undefined);
    setProviderZoneId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadZones = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderZones(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_region_id: providerRegionId?.trim() || undefined,
        provider_zone_id: providerZoneId?.trim() || undefined,
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
      message.error('Select provider zones first.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetZones({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_id: Number(item.provider_id || fallbackProviderId),
          provider_zone_id: item.provider_zone_id || undefined,
          provider_name: item.provider_name || undefined,
          country_code: item.country_code || undefined,
          country_name: item.country_name || undefined,
          city_code: item.city_code || undefined,
          city_name: item.city_name || undefined,
          time_zone: item.time_zone || undefined,
          source: 'import',
          region_id: item.region_ids?.[0] || item.region_id,
          region_ids: item.region_ids,
          provider_region_id: item.provider_region_id || item.provider_region_ids?.[0],
          provider_region_ids: item.provider_region_ids,
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
      title="Import Provider Zones"
      open={open}
      width={1080}
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
          <Button loading={loading} type="primary" onClick={() => void loadZones()}>
            Load Provider Zones
          </Button>
          <Button loading={loading} onClick={() => void loadZones(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetZone>
          rowKey={(record) => record.provider_zone_id || String(record.id)}
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
              title: 'Zone',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.provider_zone_id || '-'}</Text>
                  <Text type="secondary">
                    {[record.country_name, record.city_name].filter(Boolean).join(' / ') || '-'}
                  </Text>
                </Space>
              ),
            },
            {
              title: 'Provider Name',
              width: 180,
              render: (_, record) => record.provider_name || '-',
            },
            {
              title: 'Time Zone',
              width: 180,
              render: (_, record) => record.time_zone || '-',
            },
            {
              title: 'Region Hints',
              width: 240,
              render: (_, record) =>
                record.provider_region_ids?.length
                  ? record.provider_region_ids.join(', ')
                  : record.provider_region_id || '-',
            },
          ]}
          locale={{
            emptyText: accountId ? 'No provider zones found.' : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default ZoneImportModal;
