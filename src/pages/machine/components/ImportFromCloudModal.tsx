import { CloudDownloadOutlined, MinusCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import type { TableRowSelection } from 'antd/es/table/interface';
import { batchImportMachines } from '@/services/machine/api';
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<Array<API.ProviderInstance & { username: string; port: string; authMethod: 'password' | 'key'; credentials: string }>>([]);
  const [importResult, setImportResult] = useState<API.BatchImportMachinesResult | null>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setInstances([]);
      setTotal(0);
      setPage(1);
      setImportedIds(new Set());
      setSelectedProviderId(undefined);
      setSelectedRowKeys([]);
      setImportResult(null);
      form.resetFields();
    }
  }, [open, form]);

  const fetchInstances = async (currentPage = page, currentSize = pageSize) => {
    const values = form.getFieldsValue();
    if (!values.providerId) return;
    setLoading(true);
    try {
      // Build tag filters
      const tagKeys: string[] = (values.tagKeys || []).filter(Boolean);
      const tags: API.ProviderInstanceTag[] = (values.tags || [])
        .filter((t: any) => t?.key)
        .map((t: any) => ({ key: t.key, value: t.value || undefined }));

      const res = await getProviderInstances({
        providerId: values.providerId,
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

  const rowSelection: TableRowSelection<API.ProviderInstance> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
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
  ];

  return (
    <>
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
        forceRender
      >
      <Form
        form={form}
        layout="inline"
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}
        onFinish={handleSearch}
      >
        <Form.Item name="providerId" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
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
        rowSelection={rowSelection}
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
      
      {selectedRowKeys.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Button 
            type="primary" 
            onClick={() => {
              setPreviewData(
                instances
                  .filter(i => selectedRowKeys.includes(i.instance_id))
                  .map(i => ({
                    ...i,
                    username: 'root',
                    port: '22',
                    authMethod: 'password',
                    credentials: ''
                  }))
              );
              setPreviewVisible(true);
            }}
          >
            批量导入 ({selectedRowKeys.length} 台)
          </Button>
        </div>
      )}
      </Modal>
      
      <Modal
        title="批量导入预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary" 
            loading={importingIds.size > 0}
            onClick={async () => {
              const providerId = form.getFieldValue('providerId');
              setImportingIds(new Set(previewData.map(i => i.instance_id)));
              
              try {
                const items = previewData.map(instance => ({
                  name: instance.name || instance.instance_id,
                  hostname: instance.name || instance.instance_id,
                  ip_address: instance.public_ips?.[0] || instance.private_ips?.[0] || '',
                  private_ip_address: instance.private_ips?.[0] || '',
                  port: parseInt(instance.port) || 22,
                  username: instance.username || 'root',
                  [instance.authMethod === 'password' ? 'password' : 'private_key']: instance.credentials,
                  provider: providerId,
                  provider_instance_id: instance.instance_id,
                  provider_nic_id: instance.nic_id,
                  provider_zone_id: instance.zone_id,
                  os_type: instance.image_name,
                  cpu_cores: instance.cpu != null ? String(instance.cpu) : undefined,
                  memory: instance.memory != null ? `${instance.memory}GB` : undefined,
                }));
                
                const res = await batchImportMachines({ items });
                
                if (res.code === 0 && res.data) {
                  setImportResult(res.data);
                  setImportResultVisible(true);
                  
                  // Mark imported instances
                  res.data.created.forEach(item => {
                    setImportedIds(prev => new Set(prev).add(item.provider_instance_id));
                  });
                  res.data.updated.forEach(item => {
                    setImportedIds(prev => new Set(prev).add(item.provider_instance_id));
                  });
                  
                  messageApi.success('批量导入完成');
                  onSuccess();
                  setPreviewVisible(false);
                  setSelectedRowKeys([]);
                } else {
                  messageApi.error(res.msg || '批量导入失败');
                }
              } catch (error: any) {
                messageApi.error(error?.message || '导入出错');
              } finally {
                setImportingIds(new Set());
              }
            }}
          >
            开始导入
          </Button>
        ]}
      >
      <Table
        rowKey="instance_id"
        dataSource={previewData}
        columns={[
          {
            title: 'Instance ID',
            dataIndex: 'instance_id',
            width: 160,
          },
          {
            title: '名称',
            dataIndex: 'name',
            width: 140,
          },
          {
            title: 'SSH 用户名',
            width: 120,
            render: (_, record, index) => (
              <Input 
                value={record.username}
                onChange={(e) => {
                  const newData = [...previewData];
                  newData[index].username = e.target.value;
                  setPreviewData(newData);
                }}
                style={{ width: '100%' }} 
              />
            ),
          },
          {
            title: 'SSH 端口',
            width: 100,
            render: (_, record, index) => (
              <Input 
                value={record.port}
                onChange={(e) => {
                  const newData = [...previewData];
                  newData[index].port = e.target.value;
                  setPreviewData(newData);
                }}
                style={{ width: '100%' }} 
              />
            ),
          },
          {
            title: '认证方式',
            width: 120,
            render: (_, record, index) => (
              <Select
                value={record.authMethod}
                onChange={(value) => {
                  const newData = [...previewData];
                  newData[index].authMethod = value;
                  setPreviewData(newData);
                }}
                options={[
                  { label: '密码', value: 'password' },
                  { label: '密钥', value: 'key' },
                ]}
                style={{ width: '100%' }}
              />
            ),
          },
          {
            title: '密码/密钥',
            width: 200,
            render: (_, record, index) => (
              <Input.Password 
                value={record.credentials}
                onChange={(e) => {
                  const newData = [...previewData];
                  newData[index].credentials = e.target.value;
                  setPreviewData(newData);
                }}
                placeholder={record.authMethod === 'password' ? '输入密码' : '输入密钥'}
                style={{ width: '100%' }} 
              />
            ),
          },
        ]}
        size="small"
      />
      </Modal>

      {/* Import Result Modal */}
      <Modal
        title="导入结果"
        open={importResultVisible}
        onCancel={() => setImportResultVisible(false)}
        onOk={() => setImportResultVisible(false)}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>导入统计</h4>
          <Space>
            <span>✓ 新建: {importResult?.summary?.created_count || 0}</span>
            <span>◈ 更新: {importResult?.summary?.updated_count || 0}</span>
            <span>✗ 失败: {importResult?.summary?.failed_count || 0}</span>
          </Space>
        </div>

        {importResult?.created && importResult.created.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#52c41a' }}>✓ 成功新建</h5>
            <Table
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
              ]}
              dataSource={importResult.created}
              size="small"
              pagination={false}
              rowKey="id"
              bordered
            />
          </div>
        )}

        {importResult?.updated && importResult.updated.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#1677ff' }}>◈ 成功更新</h5>
            <Table
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
              ]}
              dataSource={importResult.updated}
              size="small"
              pagination={false}
              rowKey="id"
              bordered
            />
          </div>
        )}

        {importResult?.failed && importResult.failed.length > 0 && (
          <div>
            <h5 style={{ color: '#ff4d4f' }}>✗ 导入失败</h5>
            <Table
              columns={[
                { title: '序号', dataIndex: 'index', key: 'index' },
                { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
                { title: '原因', dataIndex: 'reason', key: 'reason' },
              ]}
              dataSource={importResult.failed}
              size="small"
              pagination={false}
              rowKey="index"
              bordered
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImportFromCloudModal;
