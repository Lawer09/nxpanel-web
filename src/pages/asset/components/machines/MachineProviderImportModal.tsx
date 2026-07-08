import { Alert, App, Button, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { listAssetProviderMachines } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

const { Text } = Typography;

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  initialAccountId?: number;
  initialProviderRegionId?: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    accountId: number;
    machines: API.AssetProviderMachine[];
  }) => Promise<void>;
};

const MachineProviderImportModal: React.FC<Props> = ({
  open,
  accounts,
  initialAccountId,
  initialProviderRegionId,
  saving,
  onCancel,
  onSubmit,
}) => {
  const { message } = App.useApp();
  const [accountId, setAccountId] = useState<number | undefined>(initialAccountId);
  const [providerRegionId, setProviderRegionId] = useState<string | undefined>(
    initialProviderRegionId,
  );
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<API.AssetProviderMachine[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const accountMap = useMemo(
    () => new Map(accounts.map((item) => [item.id, item])),
    [accounts],
  );
  const selectedAccount = accountId ? accountMap.get(accountId) : undefined;
  const selectedMachines = useMemo(
    () => machines.filter((item) => selectedRowKeys.includes(item.provider_machine_id)),
    [machines, selectedRowKeys],
  );

  const loadMachines = async (refresh?: boolean) => {
    if (!selectedAccount?.provider_code || !accountId) {
      setMachines([]);
      return;
    }
    setLoading(true);
    try {
      const response = await listAssetProviderMachines(
        selectedAccount.provider_code,
        accountId,
        {
          page: 1,
          page_size: 200,
          provider_region_id: providerRegionId?.trim() || undefined,
          refresh,
        },
      );
      setMachines(response.data?.items || []);
      setSelectedRowKeys([]);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setAccountId(initialAccountId);
    setProviderRegionId(initialProviderRegionId);
    setSelectedRowKeys([]);
  }, [initialAccountId, initialProviderRegionId, open]);

  useEffect(() => {
    if (open && selectedAccount?.provider_code && accountId) {
      void loadMachines();
    }
  }, [accountId, open, providerRegionId, selectedAccount?.provider_code]);

  return (
    <Modal
      title="Import provider machines"
      open={open}
      width={1100}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void (accountId ? onSubmit({ accountId, machines: selectedMachines }) : Promise.resolve())}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="Import saves selected provider machines into local assets"
          description="This no longer submits an async import task. Select provider machines from the provider list and save them directly into local machine assets."
        />

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
              Provider Region
            </Text>
            <Input
              value={providerRegionId}
              onChange={(event) => setProviderRegionId(event.target.value)}
              placeholder="Optional provider_region_id filter"
            />
          </div>
          <div style={{ paddingTop: 30 }}>
            <Button loading={loading} onClick={() => void loadMachines(true)}>
              Refresh Provider Data
            </Button>
          </div>
        </Space>

        <Table<API.AssetProviderMachine>
          rowKey="provider_machine_id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          dataSource={machines}
          columns={[
            {
              title: 'Machine',
              dataIndex: 'name',
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.name || record.label || record.provider_machine_id}</Text>
                  <Text type="secondary">{record.provider_machine_id}</Text>
                </Space>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 140,
              render: (_, record) => <Tag>{record.status || '-'}</Tag>,
            },
            {
              title: 'Zone',
              width: 160,
              render: (_, record) => record.zone?.provider_zone_id || '-',
            },
            {
              title: 'Image',
              width: 220,
              render: (_, record) =>
                record.image?.name || record.image?.provider_image_id || '-',
            },
            {
              title: 'Instance Type',
              width: 180,
              render: (_, record) =>
                record.instance_type_resource?.name ||
                record.instance_type_resource?.provider_instance_type_id ||
                '-',
            },
            {
              title: 'Subnet/VPC',
              width: 220,
              render: (_, record) =>
                [
                  record.subnet?.provider_subnet_id,
                  record.subnet?.vpc_id,
                ]
                  .filter(Boolean)
                  .join(' / ') || '-',
            },
          ]}
          locale={{
            emptyText: selectedAccount
              ? 'No provider machines found for the current query.'
              : 'Select an account first.',
          }}
        />

        <Text type="secondary">
          {selectedMachines.length
            ? `${selectedMachines.length} provider machine(s) selected for import.`
            : 'Select one or more provider machines to import.'}
        </Text>
      </Space>
    </Modal>
  );
};

export default MachineProviderImportModal;
