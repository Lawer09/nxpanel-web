import {
  CloudDownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Form, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  listAssetProviderAccounts,
  listAssetZones,
} from '@/services/asset-service/api';
import ZoneCreateModal from '../zones/ZoneCreateModal';
import ZoneImportModal from '../zones/ZoneImportModal';
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
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
];

const ZonesPanel: React.FC<{
  providers: API.AssetProvider[];
}> = ({ providers }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<ZoneFilters>();
  const [filters, setFilters] = useState<ZoneFilters>({});
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    actionRef.current?.reload();
  }, [filters]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await listAssetProviderAccounts({ page: 1, page_size: 200 });
        setAccounts(response.data?.items || []);
      } catch (error: any) {
        message.error(normalizeDevErrorMessage(error));
      }
    };

    void loadAccounts();
  }, [message]);

  const columns: ProColumns<API.AssetZone>[] = useMemo(
    () => [
      {
        title: 'Local ID',
        dataIndex: 'id',
        width: 100,
      },
      {
        title: 'Provider',
        dataIndex: 'provider_code',
        width: 140,
        render: (_, record) => <Tag>{record.provider_code || '-'}</Tag>,
      },
      {
        title: 'Provider Zone ID',
        dataIndex: 'provider_zone_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Provider Name',
        dataIndex: 'provider_name',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Country / City',
        width: 220,
        render: (_, record) =>
          formatText([record.country_name, record.city_name].filter(Boolean).join(' / ')),
      },
      {
        title: 'Time Zone',
        dataIndex: 'time_zone',
        width: 180,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Region IDs',
        dataIndex: 'region_ids',
        width: 180,
        render: (_, record) =>
          record.region_ids?.length
            ? `${record.region_ids.length} (${record.region_ids.join(', ')})`
            : '-',
      },
      {
        title: 'Source',
        dataIndex: 'source',
        width: 140,
        render: (_, record) => formatText(getAssetSourceLabel(record.source)),
      },
      {
        title: 'Updated At',
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
        <Form.Item name="provider_code" label="Provider">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All providers"
            style={{ width: 220 }}
            options={providers.map((item) => ({
              label: `${item.name || item.code} (${item.code})`,
              value: item.code,
            }))}
          />
        </Form.Item>
        <Form.Item name="source" label="Source">
          <Select
            allowClear
            placeholder="All source"
            style={{ width: 160 }}
            options={ZONE_SOURCE_OPTIONS}
          />
        </Form.Item>
        <Form.Item name="zone_id" label="Zone ID">
          <Input placeholder="Exact provider_zone_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="name" label="Keyword">
          <Input placeholder="Match zone id, country or city" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Apply
            </Button>
            <Button
              onClick={() => {
                filterForm.resetFields();
                setFilters({});
              }}
            >
              Reset
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
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Create
          </Button>,
          <Button
            key="import"
            icon={<CloudDownloadOutlined />}
            onClick={() => setImportOpen(true)}
          >
            Import From Provider
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            Refresh
          </Button>,
        ]}
      />

      <ZoneCreateModal
        open={createOpen}
        providers={providers}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          actionRef.current?.reload();
        }}
      />

      <ZoneImportModal
        open={importOpen}
        accounts={accounts}
        onCancel={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default ZonesPanel;
