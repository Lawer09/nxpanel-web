import { App, Button, Input, Modal, Select, Space, Table, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateAssetSubnets,
  listAssetProviderSubnets,
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

const SubnetImportModal: React.FC<Props> = ({
  open,
  accounts,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>();
  const [providerSubnetId, setProviderSubnetId] = useState<string | undefined>();
  const [vpcId, setVpcId] = useState<string | undefined>();
  const [items, setItems] = useState<API.AssetProviderSubnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedRowKeys.includes(item.provider_subnet_id || '')),
    [items, selectedRowKeys],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(undefined);
    setProviderRegionId(undefined);
    setProviderSubnetId(undefined);
    setVpcId(undefined);
    setItems([]);
    setSelectedRowKeys([]);
  }, [open]);

  const loadSubnets = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderSubnets(selectedAccount.provider_code, accountId, {
        page: 1,
        page_size: 200,
        provider_region_id: providerRegionId?.trim() || undefined,
        provider_subnet_id: providerSubnetId?.trim() || undefined,
        vpc_id: vpcId?.trim() || undefined,
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
      message.error('Select provider subnets first.');
      return;
    }

    const fallbackProviderId = selectedAccount?.provider_id;
    if (!fallbackProviderId) {
      message.error('Current account has no provider id.');
      return;
    }

    try {
      setSaving(true);
      const response = await batchCreateAssetSubnets({
        batch_size: selectedItems.length,
        items: selectedItems.map((item) => ({
          provider_id: Number(item.provider_id || fallbackProviderId),
          provider_subnet_id: item.provider_subnet_id || undefined,
          cidr_block: item.cidr_block || undefined,
          gateway_ip_address: item.gateway_ip_address || undefined,
          vpc_id: item.vpc_id || undefined,
          vpc_name: item.vpc_name || undefined,
          source: 'import',
          provider_region_id: item.provider_region_id || undefined,
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
      title="Import Provider Subnets"
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
              Provider Subnet ID
            </Text>
            <Input
              value={providerSubnetId}
              onChange={(event) => setProviderSubnetId(event.target.value)}
              placeholder="Optional provider_subnet_id filter"
            />
          </div>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              VPC ID
            </Text>
            <Input
              value={vpcId}
              onChange={(event) => setVpcId(event.target.value)}
              placeholder="Optional vpc_id filter"
            />
          </div>
        </Space>

        <Space>
          <Button loading={loading} type="primary" onClick={() => void loadSubnets()}>
            Load Provider Subnets
          </Button>
          <Button loading={loading} onClick={() => void loadSubnets(true)}>
            Refresh Provider Data
          </Button>
        </Space>

        <Table<API.AssetProviderSubnet>
          rowKey={(record) => record.provider_subnet_id || ''}
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
              title: 'Subnet',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.provider_subnet_id || '-'}</Text>
                  <Text type="secondary">{record.cidr_block || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'VPC',
              width: 220,
              render: (_, record) =>
                [record.vpc_name, record.vpc_id].filter(Boolean).join(' / ') || '-',
            },
            {
              title: 'Gateway IP',
              width: 180,
              render: (_, record) => record.gateway_ip_address || '-',
            },
            {
              title: 'Provider Region',
              width: 180,
              render: (_, record) => record.provider_region_id || '-',
            },
          ]}
          locale={{
            emptyText: accountId ? 'No provider subnets found.' : 'Select an account first.',
          }}
        />
      </Space>
    </Modal>
  );
};

export default SubnetImportModal;
