import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetRegions } from '@/services/asset-service/api';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type RegionFilters = {
  provider_code?: string;
  source?: string;
  name?: string;
  region_id?: string;
};

const REGION_SOURCE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '云上导入', value: 'import' },
  { label: '云上创建', value: 'provider' },
];

const RegionsPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<RegionFilters>();
  const [filters, setFilters] = useState<RegionFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetRegion>[] = useMemo(
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
        title: '供应商地域 ID',
        dataIndex: 'provider_region_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '区域名称',
        dataIndex: 'region_name',
        width: 220,
        ellipsis: true,
        renderText: formatText,
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
      <Form<RegionFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
            name: values.name?.trim() || undefined,
            region_id: values.region_id?.trim() || undefined,
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
            options={REGION_SOURCE_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="region_id" label="地域 ID">
          <Input placeholder="精确匹配 provider_region_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="匹配地域 ID 或区域名称" style={{ width: 220 }} />
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

      <ProTable<API.AssetRegion>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1000 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetRegions({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
              name: filters.name,
              region_id: filters.region_id,
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

export default RegionsPanel;
