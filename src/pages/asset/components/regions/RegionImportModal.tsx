import { App, Button, Input, Modal, Select, Space, Table, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createAssetRegion,
  listAssetProviderRegions,
} from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

const { Text } = Typography;

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  onCancel: () => void;
  onSuccess: () => void;
};

const RegionImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_region_id || item.id)),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderRegionId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadRegions = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderRegions(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_region_id: providerRegionId?.trim() || undefined,
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
      message.error('Select provider regions first.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      for (const item of selectedItems) {
        await createAssetRegion({
          provider_id: Number(item.provider_id || fallbackProviderId),
          provider_region_id: item.provider_region_id || '',
          region_name: item.region_name || undefined,
          source: 'import',
        });
      }
      message.success(`Imported ${selectedItems.length} region(s).`);
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Import Provider Regions"
      open={open}
      width={960}
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
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadRegions()}>
            Load Provider Regions
          </Button>
          <Button loading={loading} onClick={() => void loadRegions(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetRegion>
          rowKey={(record) => record.provider_region_id || String(record.id)}
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
              title: 'Region',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.region_name || record.provider_region_id || '-'}</Text>
                  <Text type="secondary">{record.provider_region_id || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'Provider',
              width: 180,
              render: (_, record) => record.provider_code || '-',
            },
            {
              title: 'Source',
              width: 120,
              render: (_, record) => record.source || '-',
            },
          ]}
          locale={{
            emptyText: accountId ? 'No provider regions found.' : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default RegionImportModal;
