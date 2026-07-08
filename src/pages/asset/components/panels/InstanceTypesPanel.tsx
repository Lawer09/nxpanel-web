import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetInstanceTypes } from '@/services/asset-service/api';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type InstanceTypeFilters = {
  provider_code?: string;
  source?: string;
  resource_id?: string;
  zone_id?: string;
  name?: string;
};

const SOURCE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '云上导入', value: 'import' },
  { label: '云上创建', value: 'provider' },
];

const InstanceTypesPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<InstanceTypeFilters>();
  const [filters, setFilters] = useState<InstanceTypeFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetInstanceType>[] = useMemo(
    () => [
      {
        title: '本地 ID',
        dataIndex: 'id',
        width: 100,
      },
      {
        title: '供应商',
        dataIndex: 'provider_code',
        width: 140,
        render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
      },
      {
        title: '规格 ID',
        dataIndex: 'provider_instance_type_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '规格名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'CPU / 内存',
        width: 180,
        render: (_, record) =>
          `${formatText(record.cpu_count)} / ${formatText(record.memory_mb)}`,
      },
      {
        title: 'BPS / PPS',
        width: 180,
        render: (_, record) => `${formatText(record.bps)} / ${formatText(record.pps)}`,
      },
      {
        title: '库存',
        dataIndex: 'with_stock',
        width: 100,
        render: (_, record) => formatText(record.with_stock),
      },
      {
        title: '带宽上限',
        dataIndex: 'internet_bandwidth_limit',
        width: 140,
        renderText: formatText,
      },
      {
        title: '关联可用区',
        dataIndex: 'zone_ids',
        width: 200,
        render: (_, record) =>
          record.zone_ids?.length
            ? `${record.zone_ids.length} 个 (${record.zone_ids.join(', ')})`
            : formatText(record.zone_id),
      },
      {
        title: '来源',
        dataIndex: 'source',
        width: 140,
        render: (_, record) => formatText(getAssetSourceLabel(record.source)),
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        width: 180,
        ellipsis: true,
        renderText: formatTime,
      },
    ],
    [],
  );

  return (
    <>
      <Form<InstanceTypeFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
            resource_id: values.resource_id?.trim() || undefined,
            zone_id: values.zone_id?.trim() || undefined,
            name: values.name?.trim() || undefined,
          })
        }
      >
        <Form.Item name="provider_code" label="供应商">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="全部供应商"
            style={{ width: 220 }}
            options={providers.map((item) => ({
              label: `${item.name || item.code} (${item.code})`,
              value: item.code,
            }))}
          />
        </Form.Item>
        <Form.Item name="source" label="来源">
          <Select
            allowClear
            placeholder="全部来源"
            style={{ width: 160 }}
            options={SOURCE_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="resource_id" label="规格 ID">
          <Input
            placeholder="精确匹配 provider_instance_type_id"
            style={{ width: 240 }}
          />
        </Form.Item>
        <Form.Item name="zone_id" label="可用区 ID">
          <Input placeholder="按本地 zone_id 过滤" style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="匹配规格名称或规格 ID" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              应用
            </Button>
            <Button
              onClick={() => {
                filterForm.resetFields();
                setFilters({});
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <ProTable<API.AssetInstanceType>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1800 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetInstanceTypes({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
              resource_id: filters.resource_id,
              zone_id: filters.zone_id,
              name: filters.name,
            });
            return {
              data: response.data?.items || [],
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
      />
    </>
  );
};

export default InstanceTypesPanel;
