import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useSearchParams } from '@umijs/max';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
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
import {
  formatText,
  formatTime,
  getOperationStatusColor,
  getOperationStatusLabel,
  normalizeDevErrorMessage,
} from './utils';

const { Text } = Typography;

type OperationFilters = {
  provider_code?: string;
  account_id?: number;
  status?: string;
};

const OPERATION_STATUS_OPTIONS = [
  { label: '排队中', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' },
];

const OperationFiltersBar: React.FC<{
  filters: OperationFilters;
  providers: API.AssetProvider[];
  accounts: API.AssetProviderAccount[];
  onApply: (filters: OperationFilters) => void;
  onReset: () => void;
}> = ({ filters, providers, accounts, onApply, onReset }) => {
  const [form] = Form.useForm<OperationFilters>();
  const providerCode = Form.useWatch('provider_code', form);

  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((item) => !providerCode || item.provider_code === providerCode)
        .map((item) => ({
          label: `${item.name} (#${item.id})`,
          value: item.id,
        })),
    [accounts, providerCode],
  );

  return (
    <Form<OperationFilters>
      form={form}
      layout="inline"
      onFinish={(values) =>
        onApply({
          provider_code: values.provider_code,
          account_id: values.account_id,
          status: values.status,
        })
      }
    >
      <Form.Item name="provider_code" label="供应商">
        <Select
          allowClear
          showSearch
          style={{ width: 180 }}
          placeholder="全部供应商"
          optionFilterProp="label"
          options={providers.map((item) => ({
            label: `${item.name} (${item.code})`,
            value: item.code,
          }))}
        />
      </Form.Item>
      <Form.Item name="account_id" label="账号">
        <Select
          allowClear
          showSearch
          style={{ width: 220 }}
          placeholder="全部账号"
          optionFilterProp="label"
          options={accountOptions}
        />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select
          allowClear
          style={{ width: 160 }}
          placeholder="全部状态"
          options={OPERATION_STATUS_OPTIONS}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            应用
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              onReset();
            }}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
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
  }, [message]);

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  useEffect(() => {
    if (!initialTaskId) {
      return;
    }
    const targetId = Number(initialTaskId);
    if (!Number.isFinite(targetId)) {
      return;
    }
    const loadDetail = async () => {
      try {
        const response = await getAssetOperationDetail(targetId);
        setDetail(response.data);
        setDetailTab('summary');
      } catch {
        // Ignore invalid task hint and keep the list usable.
      }
    };
    void loadDetail();
  }, [initialTaskId]);

  const columns: ProColumns<API.AssetOperation>[] = [
    { title: 'ID', dataIndex: 'id', width: 90 },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      width: 180,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '目标',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{formatText(record.target_type)}</div>
          <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12 }}>
            #{formatText(record.target_id)}
          </div>
        </div>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'provider_code',
      width: 120,
      render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
    },
    {
      title: '账号',
      dataIndex: 'account_name',
      width: 180,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={getOperationStatusColor(record.status)}>
          {getOperationStatusLabel(record.status)}
        </Tag>
      ),
    },
    {
      title: '错误摘要',
      dataIndex: 'error_summary',
      width: 260,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '发起人',
      dataIndex: 'created_by',
      width: 140,
      ellipsis: true,
      renderText: formatText,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      ellipsis: true,
      renderText: formatTime,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
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
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title="操作记录">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {initialTaskId ? (
          <Text type="secondary">当前高亮任务：{initialTaskId}</Text>
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
          scroll={{ x: 1420 }}
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
                    const rightMatch = String(right.id) === initialTaskId ? 1 : 0;
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
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => actionRef.current?.reload()}
            >
              刷新
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
        title={detail ? `操作详情 #${detail.id}` : '操作详情'}
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
                label: '概览',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={getOperationStatusColor(detail.status)}>
                        {getOperationStatusLabel(detail.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="操作类型">
                      {detail.operation_type || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="目标类型">
                      {detail.target_type || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="目标 ID">
                      {detail.target_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="供应商">
                      {detail.provider_code || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="账号">
                      {detail.account_name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="发起人">
                      {formatText(detail.created_by)}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                      {formatTime(detail.updated_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="错误摘要" span={2}>
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
