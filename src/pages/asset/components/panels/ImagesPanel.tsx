import {
  CloudDownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteAssetImage,
  listAssetProviderAccounts,
  listAssetImages,
} from '@/services/asset-service/api';
import ImageEditModal from '../images/ImageEditModal';
import ImageImportModal from '../images/ImageImportModal';
import {
  formatText,
  formatTime,
  getAssetSourceLabel,
  normalizeDevErrorMessage,
} from '../../utils';

const { Text } = Typography;

type ImageFilters = {
  provider_code?: string;
  source?: string;
  status?: string;
  resource_id?: string;
  zone_id?: string;
  name?: string;
};

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
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
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [filterForm] = Form.useForm<ImageFilters>();
  const [filters, setFilters] = useState<ImageFilters>({});
  const [accounts, setAccounts] = useState<API.AssetProviderAccount[]>([]);
  const [editing, setEditing] = useState<API.AssetImage | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detail, setDetail] = useState<API.AssetImage | null>(null);

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

  const columns: ProColumns<API.AssetImage>[] = useMemo(
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
        title: 'Provider Image ID',
        dataIndex: 'provider_image_id',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Image Name',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Type / OS',
        width: 220,
        render: (_, record) =>
          `${formatText(record.type)} / ${formatText(record.os_type)}`,
      },
      {
        title: 'Category / Version',
        width: 220,
        render: (_, record) =>
          `${formatText(record.category)} / ${formatText(record.version)}`,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 140,
        renderText: formatText,
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        width: 100,
        render: (_, record) => (record.tags?.length ? String(record.tags.length) : '-'),
      },
      {
        title: 'Zone IDs',
        dataIndex: 'zone_ids',
        width: 220,
        render: (_, record) =>
          record.zone_ids?.length
            ? `${record.zone_ids.length} (${record.zone_ids.join(', ')})`
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
      {
        title: 'Action',
        valueType: 'option',
        width: 180,
        fixed: 'right',
        render: (_, record) => [
          <a
            key="detail"
            onClick={() => setDetail(record)}
          >
            Detail
          </a>,
          <a
            key="edit"
            onClick={() => {
              setEditing(record);
              setEditOpen(true);
            }}
          >
            Edit
          </a>,
          <a
            key="delete"
            onClick={() => {
              modal.confirm({
                title: `Delete image #${record.id}?`,
                content: 'This only deletes the local image record.',
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: async () => {
                  try {
                    await deleteAssetImage(record.id);
                    message.success('Image deleted.');
                    actionRef.current?.reload();
                  } catch (error: any) {
                    message.error(normalizeDevErrorMessage(error));
                    throw error;
                  }
                },
              });
            }}
          >
            Delete
          </a>,
        ],
      },
    ],
    [message, modal],
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
          <Select allowClear placeholder="All source" style={{ width: 160 }} options={SOURCE_OPTIONS} />
        </Form.Item>
        <Form.Item name="status" label="Status">
          <Select allowClear placeholder="All status" style={{ width: 160 }} options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="resource_id" label="Image ID">
          <Input placeholder="Exact provider_image_id" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="zone_id" label="Zone ID">
          <Input placeholder="Filter by local zone_id" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item name="name" label="Keyword">
          <Input placeholder="Match image name or id" style={{ width: 220 }} />
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

      <ProTable<API.AssetImage>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 2300 }}
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
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setEditOpen(true);
            }}
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

      <ImageEditModal
        open={editOpen}
        providers={providers}
        editing={editing}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setEditing(null);
          actionRef.current?.reload();
        }}
      />

      <ImageImportModal
        open={importOpen}
        accounts={accounts}
        onCancel={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          actionRef.current?.reload();
        }}
      />

      <Drawer
        title={detail ? detail.name || detail.provider_image_id || `Image #${detail.id}` : 'Image Detail'}
        open={Boolean(detail)}
        width={860}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Local ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
            <Descriptions.Item label="Provider Image ID">
              {detail.provider_image_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Name">{detail.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{detail.type || '-'}</Descriptions.Item>
            <Descriptions.Item label="OS Type">{detail.os_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="Category">{detail.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="Version">{detail.version || '-'}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
            <Descriptions.Item label="Source">
              {formatText(getAssetSourceLabel(detail.source))}
            </Descriptions.Item>
            <Descriptions.Item label="Zone IDs" span={2}>
              {detail.zone_ids?.length ? detail.zone_ids.join(', ') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tags" span={2}>
              <Space size={[8, 8]} wrap>
                {detail.tags?.length
                  ? detail.tags.map((tag) => (
                      <Tag key={`${tag.key}:${tag.value}`}>{`${tag.key}=${tag.value}`}</Tag>
                    ))
                  : '-'}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">{formatTime(detail.created_at)}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{formatTime(detail.updated_at)}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </>
  );
};

export default ImagesPanel;
