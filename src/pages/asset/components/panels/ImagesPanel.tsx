import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetImages } from '@/services/asset-service/api';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

type ImageFilters = {
  provider_code?: string;
  source?: string;
  status?: string;
  resource_id?: string;
  zone_id?: string;
  name?: string;
};

const SOURCE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '云上导入', value: 'import' },
  { label: '云上创建', value: 'provider' },
];

const STATUS_OPTIONS = [
  { label: 'Available', value: 'available' },
  { label: 'Active', value: 'active' },
  { label: 'Deprecated', value: 'deprecated' },
  { label: 'Disabled', value: 'disabled' },
];

const ImagesPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<ImageFilters>();
  const [filters, setFilters] = useState<ImageFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetImage>[] = useMemo(
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
        title: '镜像 ID',
        dataIndex: 'provider_image_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '镜像名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '类型 / 系统',
        width: 220,
        render: (_, record) =>
          `${formatText(record.type)} / ${formatText(record.os_type)}`,
      },
      {
        title: '分类 / 版本',
        width: 220,
        render: (_, record) =>
          `${formatText(record.category)} / ${formatText(record.version)}`,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 140,
        renderText: formatText,
      },
      {
        title: '标签数',
        dataIndex: 'tags',
        width: 100,
        render: (_, record) => (record.tags?.length ? String(record.tags.length) : '-'),
      },
      {
        title: '关联可用区',
        dataIndex: 'zone_ids',
        width: 220,
        render: (_, record) =>
          record.zone_ids?.length
            ? `${record.zone_ids.length} 个 (${record.zone_ids.join(', ')})`
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
      <Form<ImageFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            provider_code: values.provider_code || undefined,
            source: values.source || undefined,
            status: values.status || undefined,
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
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 160 }}
            options={STATUS_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="resource_id" label="镜像 ID">
          <Input placeholder="精确匹配 provider_image_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="zone_id" label="可用区 ID">
          <Input placeholder="按本地 zone_id 过滤" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="匹配镜像名称或镜像 ID" style={{ width: 220 }} />
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

      <ProTable<API.AssetImage>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 2100 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetImages({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              provider_code: filters.provider_code,
              source: filters.source,
              status: filters.status,
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

export default ImagesPanel;
