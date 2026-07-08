import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetZones } from '@/services/asset-service/api';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type ZoneFilters = {
  provider_code?: string;
  source?: string;
  zone_id?: string;
  name?: string;
};

const ZONE_SOURCE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '云上导入', value: 'import' },
  { label: '云上创建', value: 'provider' },
];

const ZonesPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<ZoneFilters>();
  const [filters, setFilters] = useState<ZoneFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetZone>[] = useMemo(
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
        title: '供应商可用区 ID',
        dataIndex: 'provider_zone_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '供应商名称',
        dataIndex: 'provider_name',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '国家 / 城市',
        width: 220,
        render: (_, record) =>
          formatText(
            [record.country_name, record.city_name].filter(Boolean).join(' / '),
          ),
      },
      {
        title: '时区',
        dataIndex: 'time_zone',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '关联区域',
        dataIndex: 'region_ids',
        width: 180,
        render: (_, record) =>
          record.region_ids?.length
            ? `${record.region_ids.length} 个 (${record.region_ids.join(', ')})`
            : '-',
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
      <Form<ZoneFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
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
            options={ZONE_SOURCE_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="zone_id" label="可用区 ID">
          <Input placeholder="精确匹配 provider_zone_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="匹配可用区 ID、国家或城市" style={{ width: 220 }} />
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

      <ProTable<API.AssetZone>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1480 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetZones({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
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

export default ZonesPanel;
