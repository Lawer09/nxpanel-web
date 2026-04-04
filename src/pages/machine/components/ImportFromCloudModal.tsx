import { CloudDownloadOutlined, MinusCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { createMachine } from '@/services/machine/api';
import { getProviderInstances } from '@/services/provider/api';

const { Text } = Typography;

interface ImportFromCloudModalProps {
  open: boolean;
  providerOptions: Array<{ label: string; value: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  RUNNING: 'success',
  STOPPED: 'default',
  STARTING: 'processing',
  STOPPING: 'warning',
  ERROR: 'error',
};

const ImportFromCloudModal: React.FC<ImportFromCloudModalProps> = ({
  open,
  providerOptions,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [instances, setInstances] = useState<API.ProviderInstance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setInstances([]);
      setTotal(0);
      setPage(1);
      setImportedIds(new Set());
      setSelectedProviderId(undefined);
      form.resetFields();
    }
  }, [open, form]);

  const fetchInstances = async (currentPage = page, currentSize = pageSize) => {
    const values = form.getFieldsValue();
    if (!values.provider_id) return;
    setLoading(true);
    try {
      // Build tag filters
      const tagKeys: string[] = (values.tagKeys || []).filter(Boolean);
      const tags: API.ProviderInstanceTag[] = (values.tags || [])
        .filter((t: any) => t?.key)
        .map((t: any) => ({ key: t.key, value: t.value || undefined }));

      const res = await getProviderInstances({
        provider_id: values.provider_id,
        status: values.status || undefined,
        name: values.name || undefined,
        tagKeys: tagKeys.length ? tagKeys : undefined,
        tags: tags.length ? tags : undefined,
        page: currentPage,
        pageSize: currentSize,
      });
      if (res.code === 0 && res.data) {
        setInstances(res.data.data || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || currentPage);
      } else if (res.code !== 0) {
        messageApi.error(res.msg || '获取实例列表失败');
        setInstances([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchInstances(1, pageSize);
  };

  const handleImport = async (instance: API.ProviderInstance) => {
    const providerId = form.getFieldValue('provider_id');
    setImportingIds((prev) => new Set(prev).add(instance.instance_id));
    try {
      const res = await createMachine({
        name: instance.name || instance.instance_id,
        hostname: instance.name || instance.instance_id,
        ip_address: instance.public_ips?.[0] || instance.private_ips?.[0] || '',
        port: 22,
        username: 'root',
        provider: providerId,
        provider_instance_id: instance.instance_id,
        os_type: instance.image_name,
        cpu_cores: instance.cpu != null ? String(instance.cpu) : undefined,
        memory: instance.memory != null ? `${instance.memory}GB` : undefined,
      });
      if (res.code === 0) {
        setImportedIds((prev) => new Set(prev).add(instance.instance_id));
        onSuccess();
      } else {
        messageApi.error(res.msg || '导入失败');
      }
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(instance.instance_id);
        return next;
      });
    }
  };

  const columns = [
    {
      title: 'Instance ID',
      dataIndex: 'instance_id',
      width: 160,
      render: (id: string) => (
        <Text copyable style={{ fontSize: 12 }}>
          {id}
        </Text>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Badge
          status={(STATUS_COLOR[status] as any) || 'default'}
          text={status || '-'}
        />
      ),
    },
    {
      title: '可用区',
      dataIndex: 'zone_id',
      width: 130,
    },
    {
      title: '规格',
      dataIndex: 'instance_type',
      width: 120,
    },
    {
      title: 'CPU / 内存',
      width: 100,
      render: (_: any, r: API.ProviderInstance) => (
        <span>
          {r.cpu != null ? `${r.cpu}C` : '-'} / {r.memory != null ? `${r.memory}G` : '-'}
        </span>
      ),
    },
    {
      title: 'IP',
      width: 150,
      render: (_: any, r: API.ProviderInstance) => {
        const ips = [...(r.public_ips || []), ...(r.private_ips || [])];
        return (
          <Space direction="vertical" size={0}>
            {ips.slice(0, 2).map((ip) => (
              <Tag key={ip} style={{ fontSize: 11 }}>
                {ip}
              </Tag>
            ))}
            {ips.length > 2 && (
              <Tooltip title={ips.slice(2).join(', ')}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  +{ips.length - 2} more
                </Text>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '镜像',
      dataIndex: 'image_name',
      width: 130,
    },
    {
      title: '操作',
      width: 90,
      render: (_: any, record: API.ProviderInstance) => {
        const imported = importedIds.has(record.instance_id);
        const importing = importingIds.has(record.instance_id);
        return (
          <Button
            size="small"
            type={imported ? 'default' : 'primary'}
            loading={importing}
            disabled={imported}
            onClick={() => handleImport(record)}
          >
            {imported ? '已导入' : '导入'}
          </Button>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <CloudDownloadOutlined />
          从云端导入机器
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}
        onFinish={handleSearch}
      >
        <Form.Item name="provider_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
          <Select
            style={{ width: 200 }}
            options={providerOptions}
            placeholder="选择供应商"
            showSearch
            optionFilterProp="label"
            onChange={(v) => setSelectedProviderId(v)}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            style={{ width: 120 }}
            allowClear
            placeholder="全部"
            options={[
              { label: 'RUNNING', value: 'RUNNING' },
              { label: 'STOPPED', value: 'STOPPED' },
              { label: 'STARTING', value: 'STARTING' },
              { label: 'STOPPING', value: 'STOPPING' },
            ]}
          />
        </Form.Item>
        <Form.Item name="name" label="名称">
          <Input style={{ width: 160 }} placeholder="模糊搜索" allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              disabled={!selectedProviderId}
            >
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchInstances(page, pageSize)}
              disabled={!selectedProviderId}
            >
              刷新
            </Button>
          </Space>
        </Form.Item>

        {/* Tag filters in a collapsible panel to keep the toolbar compact */}
        <Collapse
          ghost
          size="small"
          style={{ width: '100%', marginTop: 4 }}
          items={[{
            key: 'tags',
            label: <Typography.Text type="secondary" style={{ fontSize: 13 }}>标签过滤（可选）</Typography.Text>,
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {/* tagKeys — 仅按键过滤 */}
                <Form.Item
                  name="tagKeys"
                  label="标签键"
                  style={{ marginBottom: 0 }}
                  tooltip="按标签键过滤，最多 20 个"
                >
                  <Select
                    mode="tags"
                    style={{ minWidth: 300 }}
                    placeholder="输入标签键后回车，如 env"
                    tokenSeparators={[',']}
                    maxCount={20}
                    allowClear
                  />
                </Form.Item>

                {/* tags — 键值对过滤 */}
                <Form.Item label="标签键值对" style={{ marginBottom: 0 }} tooltip="同时匹配键和值，最多 20 组">
                  <Form.List name="tags">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} align="baseline" size={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'key']}
                              rules={[{ required: true, message: '请输入键' }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="键" style={{ width: 140 }} />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'value']}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="值（可选）" style={{ width: 160 }} allowClear />
                            </Form.Item>
                            <MinusCircleOutlined
                              onClick={() => remove(name)}
                              style={{ color: '#ff4d4f', cursor: 'pointer' }}
                            />
                          </Space>
                        ))}
                        {fields.length < 20 && (
                          <Button
                            type="dashed"
                            onClick={() => add()}
                            icon={<PlusOutlined />}
                            size="small"
                          >
                            添加键值对
                          </Button>
                        )}
                      </Space>
                    )}
                  </Form.List>
                </Form.Item>
              </Space>
            ),
          }]}
        />
      </Form>

      <Table<API.ProviderInstance>
        rowKey="instance_id"
        columns={columns}
        dataSource={instances}
        loading={loading}
        size="small"
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: (p, size) => {
            setPage(p);
            setPageSize(size);
            fetchInstances(p, size);
          },
        }}
        locale={{ emptyText: selectedProviderId ? '暂无数据，请点击查询' : '请先选择供应商并点击查询' }}
      />
    </Modal>
  );
};

export default ImportFromCloudModal;
