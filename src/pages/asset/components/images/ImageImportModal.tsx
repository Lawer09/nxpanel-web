import { App, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createAssetImage,
  listAssetProviderImages,
} from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

const { Text } = Typography;

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  initialAccountId?: number;
  onCancel: () => void;
  onSuccess: () => void;
};

const ImageImportModal: React.FC<Props> = ({
  open,
  accounts,
  initialAccountId,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>(initialAccountId);
  const [providerZoneId, setProviderZoneId] = useState<string | undefined>();
  const [providerImageId, setProviderImageId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<API.AssetProviderImage[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_image_id)),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(initialAccountId);
    setProviderZoneId(undefined);
    setProviderImageId(undefined);
    setStatus(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [initialAccountId, open]);

  const loadProviderImages = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderImages(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_zone_id: providerZoneId?.trim() || undefined,
        provider_image_id: providerImageId?.trim() || undefined,
        status: status?.trim() || undefined,
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
      message.error('Select provider images first.');
      return;
    }
    try {
      setSaving(true);
      for (const item of selectedItems) {
        await createAssetImage({
          provider_id: item.provider_id ?? undefined,
          provider_image_id: item.provider_image_id,
          name: item.name || item.label || item.provider_image_id,
          type: item.type,
          os_type: item.os_type,
          category: item.category,
          version: item.version,
          status: item.status,
          tags: item.tags,
          source: 'import',
          provider_zone_id: item.provider_zone_id,
          provider_zone_ids: item.provider_zone_ids,
        });
      }
      message.success(`Imported ${selectedItems.length} image(s).`);
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Import Provider Images"
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
              Provider Zone ID
            </Text>
            <Input value={providerZoneId} onChange={(event) => setProviderZoneId(event.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Provider Image ID
            </Text>
            <Input value={providerImageId} onChange={(event) => setProviderImageId(event.target.value)} />
          </div>
          <div style={{ width: 160 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Status
            </Text>
            <Input value={status} onChange={(event) => setStatus(event.target.value)} />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadProviderImages()}>
            Load Provider Images
          </Button>
          <Button loading={loading} onClick={() => void loadProviderImages(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderImage>
          rowKey="provider_image_id"
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
              title: 'Image',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.name || record.label || record.provider_image_id}</Text>
                  <Text type="secondary">{record.provider_image_id}</Text>
                </Space>
              ),
            },
            {
              title: 'Type / OS',
              width: 180,
              render: (_, record) => `${record.type || '-'} / ${record.os_type || '-'}`,
            },
            {
              title: 'Category / Version',
              width: 200,
              render: (_, record) => `${record.category || '-'} / ${record.version || '-'}`,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 120,
              render: (_, record) => <Tag>{record.status || '-'}</Tag>,
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
            emptyText: accountId ? 'No provider images found.' : 'Select an account first.',
          }}
        />

        <Text type="secondary">
          {selectedItems.length
            ? `${selectedItems.length} provider image(s) selected for import.`
            : 'Select one or more provider images to import.'}
        </Text>
      </Space>
    </Modal>
  );
};

export default ImageImportModal;
