import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getAssetOperationDetail,
  listAssetOperations,
  listAssetProviderAccounts,
  listAssetProviders,
} from '@/services/asset-service/api';
import DevAuthGate from '../dev/components/DevAuthGate';
import JsonBlock from '../dev/components/JsonBlock';

const { Text } = Typography;

type OperationFilters = {
  provider_code?: string;
  account_id?: number;
  status?: string;
};

const formatText = (value?: string | number | null) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
};

const formatTime = (value?: string | null) => formatText(value);

const normalizeDevErrorMessage = (error: any) => {
  const messageText = error?.message || 'Request failed.';
  if (
    typeof messageText === 'string' &&
    messageText.includes('capability_not_supported')
  ) {
    return 'Current provider capability does not support this action.';
  }
  return messageText;
};

const OperationFiltersBar: React.FC<{
  filters: OperationFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onApply: (filters: OperationFilters) => void;
  onReset: () => void;
}> = ({ filters, providers, accounts, onApply, onReset }) => {
  const [local, setLocal] = useState<OperationFilters>(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const accountOptions = useMemo(
    () =>
      accounts
        .filter(
          (item) =>
            !local.provider_code || item.provider_code === local.provider_code,
        )
        .map((item) => ({
          label: `${item.name} (#${item.id})`,
          value: item.id,
        })),
    [accounts, local.provider_code],
  );

  return (
    <Space wrap size={12}>
      <Select
        allowClear
        showSearch
        style={{ width: 180 }}
        placeholder="Provider"
        optionFilterProp="label"
        value={local.provider_code}
        options={providers.map((item) => ({
          label: `${item.name} (${item.code})`,
          value: item.code,
        }))}
        onChange={(value) =>
          setLocal((current) => ({
            ...current,
            provider_code: value,
            account_id:
              current.provider_code === value ? current.account_id : undefined,
          }))
        }
      />
      <Select
        allowClear
        showSearch
        style={{ width: 220 }}
        placeholder="Account"
        optionFilterProp="label"
        value={local.account_id}
        options={accountOptions}
        onChange={(value) =>
          setLocal((current) => ({ ...current, account_id: value }))
        }
      />
      <Select
        allowClear
        style={{ width: 160 }}
        placeholder="Status"
        value={local.status}
        options={[
          { label: 'pending', value: 'pending' },
          { label: 'running', value: 'running' },
          { label: 'succeeded', value: 'succeeded' },
          { label: 'failed', value: 'failed' },
          { label: 'cancelled', value: 'cancelled' },
        ]}
        onChange={(value) =>
          setLocal((current) => ({ ...current, status: value }))
        }
      />
      <Button type="primary" onClick={() => onApply(local)}>
        Apply
      </Button>
      <Button
        onClick={() => {
          setLocal({});
          onReset();
        }}
      >
        Reset
      </Button>
    </Space>
  );
};

const AssetOperationsContent: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState<API.AssetProvider[]>([]);
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [filters, setFilters] = useState<OperationFilters>({});
  const [detail, setDetail] = useState<API.AssetOperation | null>(null);
  const [detailTab, setDetailTab] = useState('summary');

  const initialTaskId = searchParams.get('task_id');

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [providersResponse, accountsResponse] = await Promise.all([
          listAssetProviders({ page: 1, page_size: 200 }),
          listAssetProviderAccounts({ page: 1, page_size: 200 }),
        ]);
        setProviders(providersResponse.data?.items || []);
        setAccounts(accountsResponse.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      }
    };
    void loadMeta();
  }, []);

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetOperation>[] = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    {
      title: 'Operation Type',
      dataIndex: 'operation_type',
      renderText: formatText,
    },
    { title: 'Target Type', dataIndex: 'target_type', renderText: formatText },
    { title: 'Target ID', dataIndex: 'target_id', renderText: formatText },
    {
      title: 'Provider',
      dataIndex: 'provider_code',
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    { title: 'Account', dataIndex: 'account_name', renderText: formatText },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_, record) => {
        const status = record.status || '-';
        const color =
          status === 'succeeded'
            ? 'green'
            : status === 'failed'
              ? 'red'
              : status === 'running'
                ? 'blue'
                : status === 'cancelled'
                  ? 'default'
                  : 'gold';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Error Summary',
      dataIndex: 'error_summary',
      ellipsis: true,
      renderText: formatText,
    },
    { title: 'Created By', dataIndex: 'created_by', renderText: formatText },
    { title: 'Created At', dataIndex: 'created_at', renderText: formatTime },
    { title: 'Updated At', dataIndex: 'updated_at', renderText: formatTime },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="detail"
          onClick={async () => {
            try {
              const response = await getAssetOperationDetail(record.id);
              setDetail(response.data);
              setDetailTab('summary');
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
            }
          }}
        >
          Detail
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {initialTaskId ? (
          <Text type="secondary">Latest task hint: #{initialTaskId}</Text>
        ) : null}
        <OperationFiltersBar
          filters={filters}
          providers={providers}
          accounts={accounts}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            if (initialTaskId) {
              setSearchParams({});
            }
          }}
          onReset={() => {
            setFilters({});
            if (initialTaskId) {
              setSearchParams({});
            }
          }}
        />
        <ProTable<API.AssetOperation>
          rowKey="id"
          actionRef={actionRef}
          search={false}
          columns={columns}
          request={async (params) => {
            try {
              const response = await listAssetOperations({
                page: Number(params.current || 1),
                page_size: Number(params.pageSize || 10),
                provider_code: filters.provider_code,
                account_id: filters.account_id,
                status: filters.status,
              });
              const items = response.data?.items || [];
              const sortedItems = initialTaskId
                ? [...items].sort((left, right) => {
                    const leftMatch = String(left.id) === initialTaskId ? 1 : 0;
                    const rightMatch =
                      String(right.id) === initialTaskId ? 1 : 0;
                    return rightMatch - leftMatch;
                  })
                : items;
              return {
                data: sortedItems,
                success: true,
                total: response.data?.total || 0,
              };
            } catch (error: any) {
              message.error(normalizeDevErrorMessage(error));
              return { data: [], success: false, total: 0 };
            }
          }}
          toolBarRender={() => [
            <Button key="refresh" onClick={() => actionRef.current?.reload()}>
              Refresh
            </Button>,
          ]}
          rowClassName={(record) =>
            initialTaskId && String(record.id) === initialTaskId
              ? 'asset-operation-highlight'
              : ''
          }
        />
      </Space>

      <Drawer
        title={detail ? `Operation #${detail.id}` : 'Operation Detail'}
        open={Boolean(detail)}
        width={920}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Tabs
            activeKey={detailTab}
            onChange={setDetailTab}
            items={[
              {
                key: 'summary',
                label: '摘要',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="ID">
                      {detail.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {detail.status || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Operation Type">
                      {detail.operation_type || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Target Type">
                      {detail.target_type || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Target ID">
                      {detail.target_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Provider">
                      {detail.provider_code || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Account">
                      {detail.account_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By">
                      {formatText(detail.created_by)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Updated At">
                      {formatTime(detail.updated_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Error Summary" span={2}>
                      {detail.error_summary || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'request',
                label: '请求数据',
                children: <JsonBlock value={detail.request} />,
              },
              {
                key: 'result',
                label: '结果数据',
                children: <JsonBlock value={detail.result} />,
              },
            ]}
          />
        ) : null}
      </Drawer>
      <style>
        {`
          .asset-operation-highlight td {
            background: rgba(22, 119, 255, 0.08) !important;
          }
        `}
      </style>
    </PageContainer>
  );
};

const AssetOperationsPage: React.FC = () => (
  <DevAuthGate>
    <AssetOperationsContent />
  </DevAuthGate>
);

export default AssetOperationsPage;
