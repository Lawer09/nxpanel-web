import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Space } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listAssetTags } from '@/services/asset-service/api';
import { formatText, formatTime, normalizeDevErrorMessage } from '../../utils';

type TagFilters = {
  resource_id?: string;
  key?: string;
  value?: string;
  name?: string;
};

const TagsPanel: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<TagFilters>();
  const [filters, setFilters] = useState<TagFilters>({});

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  const columns: ProColumns<API.AssetProviderTag>[] = useMemo(
    () => [
      {
        title: '本地 ID',
        dataIndex: 'id',
        width: 100,
      },
      {
        title: 'Provider Tag ID',
        dataIndex: 'provider_tag_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Key',
        dataIndex: 'key',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Value',
        dataIndex: 'value',
        width: 240,
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
    ],
    [],
  );

  return (
    <>
      <Form<TagFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            resource_id: values.resource_id?.trim() || undefined,
            key: values.key?.trim() || undefined,
            value: values.value?.trim() || undefined,
            name: values.name?.trim() || undefined,
          })
        }
      >
        <Form.Item name="resource_id" label="Tag ID">
          <Input placeholder="精确匹配 provider_tag_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="key" label="Key">
          <Input placeholder="精确匹配 key" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="value" label="Value">
          <Input placeholder="精确匹配 value" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="name" label="关键字">
          <Input placeholder="模糊匹配 Tag ID / Key / Value" style={{ width: 240 }} />
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

      <ProTable<API.AssetProviderTag>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1100 }}
        columns={columns}
        request={async (params) => {
          try {
            const response = await listAssetTags({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              resource_id: filters.resource_id,
              key: filters.key,
              value: filters.value,
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

export default TagsPanel;
