import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetSubnets } from '@/services/asset-service/api';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type SubnetFilters = {
  provider_code?: string;
  source?: string;
  resource_id?: string;
  region_id?: string;
  vpc_id?: string;
  name?: string;
};

const SOURCE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '云上导入', value: 'import' },
  { label: '云上创建', value: 'provider' },
];

const SubnetsPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<SubnetFilters>();
  const [filters, setFilters] = useState<SubnetFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetSubnet>[] = useMemo(
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
        title: '子网 ID',
        dataIndex: 'provider_subnet_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'CIDR',
        dataIndex: 'cidr_block',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '网关 IP',
        dataIndex: 'gateway_ip_address',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'VPC',
        width: 220,
        render: (_, record) => `${formatText(record.vpc_name)} / ${formatText(record.vpc_id)}`,
      },
      {
        title: '区域 ID',
        dataIndex: 'region_id',
        width: 120,
        renderText: formatText,
      },
      {
        title: '标签数',
        dataIndex: 'tags',
        width: 100,
        render: (_, record) => (record.tags?.length ? String(record.tags.length) : '-'),
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
      <Form<SubnetFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
            resource_id: values.resource_id?.trim() || undefined,
            region_id: values.region_id?.trim() || undefined,
            vpc_id: values.vpc_id?.trim() || undefined,
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
        <Form.Item name="resource_id" label="子网 ID">
          <Input placeholder="精确匹配 provider_subnet_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="region_id" label="区域 ID">
          <Input placeholder="按本地 region_id 过滤" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="vpc_id" label="VPC ID">
          <Input placeholder="按 vpc_id 过滤" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="匹配子网 ID 或 VPC 名称" style={{ width: 220 }} />
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

      <ProTable<API.AssetSubnet>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1700 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetSubnets({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
              resource_id: filters.resource_id,
              region_id: filters.region_id,
              vpc_id: filters.vpc_id,
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

export default SubnetsPanel;
