import { App, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetSecurityGroups,
  listAssetProviderSecurityGroups,
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

const SecurityGroupImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>();
  const [providerZoneId, setProviderZoneId] = useState<string | undefined>();
  const [providerSecurityGroupId, setProviderSecurityGroupId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetProviderSecurityGroup[]>([]);
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
        selectedRowKeys.includes(item.provider_security_group_id || ''),
      ),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderRegionId(undefined);
    setProviderZoneId(undefined);
    setProviderSecurityGroupId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadSecurityGroups = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderSecurityGroups(
        selectedAccount.provider_code,
        accountId,
        {
          page: 1,
          page_size: 200,
          provider_region_id: providerRegionId?.trim() || undefined,
          provider_zone_id: providerZoneId?.trim() || undefined,
          provider_security_group_id: providerSecurityGroupId?.trim() || undefined,
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
      message.error('Select provider security groups first.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetSecurityGroups({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_id: Number(item.provider_id || fallbackProviderId),
          provider_security_group_id: item.provider_security_group_id || undefined,
          name: item.name || undefined,
          provider_name: item.provider_name || undefined,
          source: 'import',
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
      title="Import Provider Security Groups"
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

        <Space size={16} align="start" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Provider Security Group ID
            </Text>
            <Input
              value={providerSecurityGroupId}
              onChange={(event) => setProviderSecurityGroupId(event.target.value)}
              placeholder="Optional provider_security_group_id filter"
            />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadSecurityGroups()}>
            Load Provider Security Groups
          </Button>
          <Button loading={loading} onClick={() => void loadSecurityGroups(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderSecurityGroup>
          rowKey={(record) => record.provider_security_group_id || ''}
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
              title: 'Security Group',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.name || record.provider_security_group_id || '-'}</Text>
                  <Text type="secondary">
                    {record.provider_security_group_id || '-'}
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
              title: 'Tags',
              width: 220,
              render: (_, record) =>
                record.tags?.length
                  ? record.tags.map((tag) => `${tag.key}=${tag.value}`).join(', ')
                  : '-',
            },
            {
              title: 'Source',
              width: 120,
              render: (_, record) => <Tag>{record.source || '-'}</Tag>,
            },
          ]}
          locale={{
            emptyText: accountId
              ? 'No provider security groups found.'
              : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default SecurityGroupImportModal;
