import { CloudDownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
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
import { fetchProvider } from '@/services/provider/api';
import { getProviderEips, ipPoolBatchImport } from '@/services/infra/api';

const { Text } = Typography;

interface ImportFromCloudModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  TO_PRODUCT: 'default',
  CREATING: 'processing',
  DELETING: 'warning',
  ASSIGNING: 'processing',
  BINDED: 'success',
  RECYCLING: 'warning',
  RECYCLED: 'default',
  RUNNING: 'success',
  UNBIND: 'default',
  CREATE_FAILED: 'error',
};

const ImportFromCloudModal: React.FC<ImportFromCloudModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [providerOptions, setProviderOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [eips, setEips] = useState<API.ProviderEipItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [importingKeys, setImportingKeys] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<any>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);

  // Load provider options
  useEffect(() => {
    fetchProvider({ current: 1, pageSize: 1000 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setProviderOptions(
          res.data.data.map((item) => ({ label: item.name, value: item.id })),
        );
      }
    });
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEips([]);
      setTotal(0);
      setPage(1);
      setSelectedProviderId(undefined);
      setSelectedRowKeys([]);
      setImportingKeys(new Set());
      form.resetFields();
    }
  }, [open, form]);

  const fetchEips = async (currentPage = page, currentSize = pageSize) => {
    const values = form.getFieldsValue();
    if (!values.provider_id) return;
    setLoading(true);
    try {
      const tagKeys: string[] = (values.tagKeys || []).filter(Boolean);
      const tags: API.ProviderEipTag[] = (values.tags || [])
        .filter((t: any) => t?.key)
        .map((t: any) => ({ key: t.key, value: t.value || undefined }));

      const res = await getProviderEips({
        provider_id: values.provider_id,
        status: values.status || undefined,
        name: values.name || undefined,
        ipAddress: values.ipAddress || undefined,
        tagKeys: tagKeys.length ? tagKeys : undefined,
        tags: tags.length ? tags : undefined,
        page: currentPage,
        pageSize: currentSize,
      });
      if (res.code === 0 && res.data) {
        setEips(res.data.data || []);
        setTotal(res.data.total || 0);
        setPage(res.data.pageNum || currentPage);
      } else if (res.code !== 0) {
        messageApi.error(res.msg || '获取EIP列表失败');
        setEips([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchEips(1, pageSize);
  };

  const handleBatchImport = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('请选择至少一个 EIP');
      return;
    }

    setImportingKeys(new Set(selectedRowKeys.map(k => String(k))));

    try {
      const selectedEips = eips.filter((eip) =>
        selectedRowKeys.includes(eip.eip_id)
      );

      // Build batch import items
      const items = selectedEips.map((eip) => ({
        ip: eip.ip_address,
        machine_id: null,
        metadata: {
          eip_id: eip.eip_id,
          vendor: eips[0]?.metadata?.bandwidth ? 'zenlayer' : 'unknown',
          status: eip.status,
          zone_id: eip.zone_id,
          instance_id: eip.instance_id,
        },
        country: '-',
        status: 'active' as const,
      }));

      const res = await ipPoolBatchImport({ items });

      if (res.code === 0) {
        setImportResult(res.data);
        setImportResultVisible(true);
        messageApi.success('导入完成');
        onSuccess();
        // Clear selection after successful import
        setSelectedRowKeys([]);
        // Reset form for next batch
        setPage(1);
        fetchEips(1, pageSize);
      } else {
        messageApi.error(res.msg || '批量导入失败');
      }
    } catch (error: any) {
      messageApi.error(error?.message || '导入出错');
    } finally {
      setImportingKeys(new Set());
    }
  };

  const columns = [
    {
      title: 'EIP ID',
      dataIndex: 'eip_id',
      width: 160,
      render: (id: string) => (
        <Text copyable style={{ fontSize: 12 }}>
          {id}
        </Text>
      ),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip_address',
      width: 140,
      render: (ip: string) => (
        <Tag color="blue">{ip}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
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
      title: '关联实例',
      dataIndex: 'instance_id',
      width: 160,
      render: (id: string) => id ? (
        <Tooltip title={id}>
          <Text ellipsis style={{ maxWidth: 150 }}>
            {id}
          </Text>
        </Tooltip>
      ) : (
        <Text type="secondary">未关联</Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined />
            从云端导入 EIP
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={1200}
        destroyOnHidden
      >

        <Form
          form={form}
          layout="inline"
          style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}
          onFinish={handleSearch}
        >
          <Form.Item
            name="provider_id"
            label="供应商"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
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
              style={{ width: 180 }}
              allowClear
              placeholder="全部"
              options={[
                { label: 'TO_PRODUCT', value: 'TO_PRODUCT' },
                { label: 'CREATING', value: 'CREATING' },
                { label: 'DELETING', value: 'DELETING' },
                { label: 'ASSIGNING', value: 'ASSIGNING' },
                { label: 'BINDED', value: 'BINDED' },
                { label: 'RECYCLING', value: 'RECYCLING' },
                { label: 'RECYCLED', value: 'RECYCLED' },
                { label: 'RUNNING', value: 'RUNNING' },
                { label: 'UNBIND', value: 'UNBIND' },
                { label: 'CREATE_FAILED', value: 'CREATE_FAILED' },
              ]}
            />
          </Form.Item>
          <Form.Item name="ipAddress" label="IP 地址">
            <Input style={{ width: 160 }} placeholder="模糊搜索" allowClear />
          </Form.Item>
          {/* tags filter */}
          <Form.Item name="tagKeys" label="标签键" style={{ marginBottom: 0 }} tooltip="按标签键过滤，最多 20 个">
            <Select
              mode="tags"
              style={{ minWidth: 180 }}
              placeholder="输入标签键后回车，如 env"
              tokenSeparators={[',']}
              maxCount={20}
              allowClear
            />
          </Form.Item>
          <Form.List name="tags">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline" size={6}>
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      rules={[{ required: true, message: '请输入键' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="标签键" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="标签值（可选）" style={{ width: 120 }} allowClear />
                    </Form.Item>
                    <Button danger size="small" onClick={() => remove(name)} style={{ padding: 0, width: 22 }}>
                      删除
                    </Button>
                  </Space>
                ))}
                {fields.length < 20 && (
                  <Button type="dashed" onClick={() => add()} size="small">
                    添加标签键值对
                  </Button>
                )}
              </>
            )}
          </Form.List>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" disabled={!selectedProviderId}>
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchEips(page, pageSize)}
                disabled={!selectedProviderId}
              >
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table<API.ProviderEipItem>
          rowKey="eip_id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          columns={columns}
          dataSource={eips}
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
              fetchEips(p, size);
            },
          }}
          locale={{
            emptyText: selectedProviderId ? '暂无数据，请点击查询' : '请先选择供应商并点击查询',
          }}
        />

        {selectedRowKeys.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={handleBatchImport}
              loading={importingKeys.size > 0}
            >
              批量导入 ({selectedRowKeys.length} 个)
            </Button>
          </div>
        )}
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

        {importResult?.created?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#52c41a' }}>✓ 成功新建</h5>
            <Table
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: 'IP', dataIndex: 'ip', key: 'ip' },
              ]}
              dataSource={importResult.created}
              size="small"
              pagination={false}
              rowKey="id"
              bordered
            />
          </div>
        )}

        {importResult?.updated?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#1677ff' }}>◈ 成功更新</h5>
            <Table
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: 'IP', dataIndex: 'ip', key: 'ip' },
              ]}
              dataSource={importResult.updated}
              size="small"
              pagination={false}
              rowKey="id"
              bordered
            />
          </div>
        )}

        {importResult?.failed?.length > 0 && (
          <div>
            <h5 style={{ color: '#ff4d4f' }}>✗ 导入失败</h5>
            <Table
              columns={[
                { title: 'IP/字段', dataIndex: 'ip', key: 'ip' },
                { title: '原因', dataIndex: 'reason', key: 'reason' },
              ]}
              dataSource={importResult.failed}
              size="small"
              pagination={false}
              rowKey="ip"
              bordered
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImportFromCloudModal;
