import { App, Button, Input, Modal, Select, Space, Table, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetTags,
  listAssetProviderTags,
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

const TagImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerTagId, setProviderTagId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetProviderTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_tag_id || item.id)),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderTagId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadTags = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderTags(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_tag_id: providerTagId?.trim() || undefined,
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
      message.error('Select provider tags first.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetTags({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_tag_id: item.provider_tag_id || undefined,
          key: item.key || '',
          value: item.value || undefined,
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
      title="Import Provider Tags"
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
              Provider Tag ID
            </Text>
            <Input
              value={providerTagId}
              onChange={(event) => setProviderTagId(event.target.value)}
              placeholder="Optional provider_tag_id filter"
            />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadTags()}>
            Load Provider Tags
          </Button>
          <Button loading={loading} onClick={() => void loadTags(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderTag>
          rowKey={(record) => record.provider_tag_id || String(record.id)}
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
              title: 'Tag',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>
                    {record.key || '-'}
                    {record.value ? `=${record.value}` : ''}
                  </Text>
                  <Text type="secondary">{record.provider_tag_id || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'Value',
              width: 240,
              render: (_, record) => record.value || '-',
            },
          ]}
          locale={{
            emptyText: accountId ? 'No provider tags found.' : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default TagImportModal;
