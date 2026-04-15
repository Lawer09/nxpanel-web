import { CloudDownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import type { TableRowSelection } from 'antd/es/table/interface';
import { batchImportSshKeys } from '@/services/ssh-key/api';
import { getProviderSshKeys } from '@/services/provider/api';

const { Text } = Typography;

interface ImportFromCloudModalProps {
  open: boolean;
  providerOptions: Array<{ label: string; value: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportFromCloudModal: React.FC<ImportFromCloudModalProps> = ({
  open,
  providerOptions,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [keys, setKeys] = useState<API.ProviderSshKeyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<
    Array<
      API.ProviderSshKeyItem & {
        name: string;
        tags: string;
        public_key: string;
        secret_key: string;
        note: string;
      }
    >
  >([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setKeys([]);
      setTotal(0);
      setPage(1);
      setSelectedProviderId(undefined);
      setSelectedRowKeys([]);
      setImportResult(null);
      form.resetFields();
    }
  }, [open, form]);

  const fetchKeys = async (currentPage = page, currentSize = pageSize) => {
    const values = form.getFieldsValue();
    if (!values.provider_id) return;
    setLoading(true);
    try {
      const res = await getProviderSshKeys({
        provider_id: values.provider_id,
        keyName: values.keyName || undefined,
        page: currentPage,
        pageSize: currentSize,
      });
      if (res.code === 0 && res.data) {
        setKeys(res.data.data || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || currentPage);
      } else if (res.code !== 0) {
        messageApi.error(res.msg || '获取密钥列表失败');
        setKeys([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchKeys(1, pageSize);
  };

  const rowSelection: TableRowSelection<API.ProviderSshKeyItem> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const columns = [
    {
      title: 'Key ID',
      dataIndex: 'key_id',
      width: 180,
      render: (id: string) => (
        <Text copyable style={{ fontSize: 12 }}>
          {id}
        </Text>
      ),
    },
    {
      title: '密钥名称',
      dataIndex: 'key_name',
      width: 160,
    },
    {
      title: '描述',
      dataIndex: 'key_description',
      width: 160,
      ellipsis: true,
      render: (desc: string) => desc || '-',
    },
    {
      title: '公钥',
      dataIndex: 'public_key',
      width: 200,
      ellipsis: true,
      render: (pk: string) =>
        pk ? (
          <Text copyable={{ text: pk }} ellipsis style={{ fontSize: 12 }}>
            {pk}
          </Text>
        ) : (
          '-'
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      width: 160,
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined />
            从云端导入 SSH 密钥
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
          <Form.Item name="keyName" label="密钥名称">
            <Input style={{ width: 160 }} placeholder="模糊搜索" allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" disabled={!selectedProviderId}>
                查询
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchKeys(page, pageSize)}
                disabled={!selectedProviderId}
              >
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table<API.ProviderSshKeyItem>
          rowKey="key_id"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={keys}
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
              fetchKeys(p, size);
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
              onClick={() => {
                setPreviewData(
                  keys
                    .filter((k) => selectedRowKeys.includes(k.key_id))
                    .map((k) => ({
                      ...k,
                      name: k.key_name,
                      tags: '',
                      public_key: k.public_key || '',
                      secret_key: '',
                      note: '',
                    })),
                );
                setPreviewVisible(true);
              }}
            >
              批量导入 ({selectedRowKeys.length} 个)
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
            onClick={async () => {
              const providerId = form.getFieldValue('provider_id');

              try {
                const items = previewData.map((key) => ({
                  name: key.name || key.key_name,
                  tags: key.tags,
                  provider_id: providerId,
                  provider_key_id: key.key_id,
                  public_key: key.public_key || undefined,
                  secret_key: key.secret_key,
                  note: key.note,
                }));

                const res = await batchImportSshKeys({ items });

                if (res.code === 0 && res.data) {
                  setImportResult(res.data);
                  setImportResultVisible(true);

                  messageApi.success('批量导入完成');
                  onSuccess();
                  setPreviewVisible(false);
                  setSelectedRowKeys([]);
                } else {
                  messageApi.error(res.msg || '批量导入失败');
                }
              } catch (error: any) {
                messageApi.error(error?.message || '导入出错');
              }
            }}
          >
            开始导入
          </Button>,
        ]}
      >
        <Table
          rowKey="key_id"
          dataSource={previewData}
          columns={[
            {
              title: 'Key ID',
              dataIndex: 'key_id',
              width: 160,
            },
            {
              title: '密钥名称',
              width: 140,
              render: (_, record, index) => (
                <Input
                  value={record.name}
                  onChange={(e) => {
                    const newData = [...previewData];
                    newData[index].name = e.target.value;
                    setPreviewData(newData);
                  }}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: '标签',
              width: 120,
              render: (_, record, index) => (
                <Input
                  value={record.tags}
                  onChange={(e) => {
                    const newData = [...previewData];
                    newData[index].tags = e.target.value;
                    setPreviewData(newData);
                  }}
                  placeholder="可选"
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: '私钥内容',
              width: 200,
              render: (_, record, index) => (
                <Input.TextArea
                  value={record.secret_key}
                  onChange={(e) => {
                    const newData = [...previewData];
                    newData[index].secret_key = e.target.value;
                    setPreviewData(newData);
                  }}
                  placeholder="输入私钥内容（必填）"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{ width: '100%' }}
                />
              ),
            },
            {
              title: '公钥内容',
              width: 200,
              render: (_, record) =>
                record.public_key ? (
                  <Text copyable={{ text: record.public_key }} ellipsis style={{ fontSize: 12 }}>
                    {record.public_key}
                  </Text>
                ) : (
                  '-'
                ),
            },
            {
              title: '备注',
              width: 140,
              render: (_, record, index) => (
                <Input
                  value={record.note}
                  onChange={(e) => {
                    const newData = [...previewData];
                    newData[index].note = e.target.value;
                    setPreviewData(newData);
                  }}
                  placeholder="可选"
                  style={{ width: '100%' }}
                />
              ),
            },
          ]}
          size="small"
          scroll={{ x: 800 }}
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
            <span>✗ 失败: {importResult?.summary?.failed_count || 0}</span>
          </Space>
        </div>

        {importResult?.created && importResult.created.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h5 style={{ color: '#52c41a' }}>✓ 成功新建</h5>
            <Table
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: '名称', dataIndex: 'name', key: 'name' },
              ]}
              dataSource={importResult.created}
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
