import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  fetchVersions,
  saveVersion,
  updateVersion,
  dropVersion,
  publishVersion,
} from '@/services/version/api';

const { Text } = Typography;
const { TextArea } = Input;

const VersionPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [form] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<API.VersionItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    setEditOpen(true);
  };

  const openEdit = (record: API.VersionItem) => {
    setEditRecord(record);
    form.setFieldsValue({
      ...record,
      release_date: record.release_date ? dayjs(record.release_date) : undefined,
      features: record.features?.join('\n') || '',
      improvements: record.improvements?.join('\n') || '',
      bugfixes: record.bugfixes?.join('\n') || '',
    });
    setEditOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const parseLines = (text?: string): string[] | undefined => {
        if (!text?.trim()) return undefined;
        return text
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean);
      };

      const payload = {
        ...values,
        release_date: values.release_date?.format('YYYY-MM-DD'),
        features: parseLines(values.features),
        improvements: parseLines(values.improvements),
        bugfixes: parseLines(values.bugfixes),
      };

      let res;
      if (editRecord) {
        res = await updateVersion({ id: editRecord.id, ...payload });
      } else {
        res = await saveVersion(payload);
      }

      if (res.code === 0) {
        message.success(editRecord ? '更新成功' : '创建成功');
        setEditOpen(false);
        actionRef.current?.reload();
      } else {
        message.error(res.msg || '操作失败');
      }
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await dropVersion({ id });
    if (res.code === 0) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '删除失败');
    }
  };

  const handlePublish = async (id: number, published: boolean) => {
    const res = await publishVersion({ id, is_published: published });
    if (res.code === 0) {
      message.success(published ? '已发布' : '已取消发布');
      actionRef.current?.reload();
    } else {
      message.error(res.msg || '操作失败');
    }
  };

  const columns: ProColumns<API.VersionItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    {
      title: '版本号',
      dataIndex: 'version',
      width: 100,
      search: false,
      render: (_, r) => <Tag color="blue">{r.version}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      search: false,
    },
    {
      title: '发布日期',
      dataIndex: 'release_date',
      width: 120,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'is_published',
      width: 90,
      search: false,
      render: (_, r) =>
        r.is_published ? (
          <Tag color="success">已发布</Tag>
        ) : (
          <Tag color="default">草稿</Tag>
        ),
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
      search: false,
    },
    {
      title: '功能数',
      key: 'feature_count',
      width: 80,
      search: false,
      render: (_, r) => (r.features?.length || 0) + (r.improvements?.length || 0) + (r.bugfixes?.length || 0),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      search: false,
      render: (_, record) => (
        <Space>
          <a onClick={() => openEdit(record)}>编辑</a>
          <a
            onClick={() => handlePublish(record.id, !record.is_published)}
          >
            {record.is_published ? '取消发布' : '发布'}
          </a>
          <Popconfirm
            title="确定删除该版本？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.VersionItem>
        headerTitle="版本管理"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            新建版本
          </Button>,
        ]}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '8px 0' }}>
              {record.description && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">描述：</Text>
                  <Text>{record.description}</Text>
                </div>
              )}
              {record.features && record.features.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ color: '#52c41a' }}>✨ 新功能：</Text>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {record.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {record.improvements && record.improvements.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ color: '#1890ff' }}>🔧 优化：</Text>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {record.improvements.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {record.bugfixes && record.bugfixes.length > 0 && (
                <div>
                  <Text strong style={{ color: '#faad14' }}>🐛 修复：</Text>
                  <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                    {record.bugfixes.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        }}
        request={async (params) => {
          const { current, pageSize } = params;
          const res = await fetchVersions({ page: current, page_size: pageSize });
          const payload = (res as any)?.data ?? res;
          return {
            data: payload?.data || [],
            total: payload?.total || 0,
            success: true,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title={editRecord ? '编辑版本' : '新建版本'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如 1.3.0" />
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="版本标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="版本概述" />
          </Form.Item>
          <Form.Item name="features" label="新功能（每行一条）">
            <TextArea rows={4} placeholder="每行一条新功能" />
          </Form.Item>
          <Form.Item name="improvements" label="优化改进（每行一条）">
            <TextArea rows={3} placeholder="每行一条优化" />
          </Form.Item>
          <Form.Item name="bugfixes" label="Bug 修复（每行一条）">
            <TextArea rows={3} placeholder="每行一条修复" />
          </Form.Item>
          <Space>
            <Form.Item
              name="release_date"
              label="发布日期"
              rules={[{ required: true, message: '请选择发布日期' }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item name="sort_order" label="排序权重" initialValue={0}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item
              name="is_published"
              label="立即发布"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default VersionPage;
