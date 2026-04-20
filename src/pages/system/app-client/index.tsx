import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  dropAppClient,
  fetchAppClients,
  resetAppClientSecret,
  saveAppClient,
  updateAppClient,
} from '@/services/app-client/api';

const { Text, Paragraph } = Typography;

const AppClientPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<API.AppClientItem | undefined>();
  const [secretResult, setSecretResult] = useState<{
    app_token?: string;
    app_secret?: string;
  } | null>(null);

  const [form] = Form.useForm();

  const handleSave = async () => {
    const values = await form.validateFields();
    let res: any;
    if (editingRecord) {
      res = await updateAppClient({ id: editingRecord.id, ...values });
    } else {
      res = await saveAppClient(values);
    }
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    messageApi.success(editingRecord ? '更新成功' : '创建成功');
    setFormOpen(false);
    form.resetFields();
    setEditingRecord(undefined);
    actionRef.current?.reload();

    // 创建时返回 secret，展示给用户
    if (!editingRecord) {
      const data = (res as any)?.data ?? res;
      if (data?.app_secret) {
        setSecretResult({ app_token: data.app_token, app_secret: data.app_secret });
      }
    }
  };

  const handleResetSecret = async (record: API.AppClientItem) => {
    const res = await resetAppClientSecret({ id: record.id });
    if (res.code !== 0) {
      messageApi.error(res.msg || '重置失败');
      return;
    }
    const data = (res as any)?.data ?? res;
    setSecretResult({ app_token: data.app_token, app_secret: data.app_secret });
    messageApi.success('凭证已重置');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.AppClientItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '应用名称',
      dataIndex: 'name',
      width: 160,
      search: false,
    },
    {
      title: '应用标识 (app_id)',
      dataIndex: 'app_id',
      width: 200,
      search: false,
      render: (_, record) => <Text code>{record.app_id}</Text>,
    },
    {
      title: 'Token',
      dataIndex: 'app_token',
      width: 220,
      search: false,
      ellipsis: true,
      render: (_, record) => (
        <Text copyable={{ text: record.app_token }} ellipsis style={{ maxWidth: 200 }}>
          {record.app_token}
        </Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      search: false,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      width: 80,
      search: false,
      render: (_, record) =>
        record.is_enabled ? (
          <Badge status="success" text="启用" />
        ) : (
          <Badge status="default" text="禁用" />
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      search: false,
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditingRecord(record);
            form.setFieldsValue({
              name: record.name,
              app_id: record.app_id,
              description: record.description,
              is_enabled: record.is_enabled,
            });
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="reset"
          title="确认重置凭证？"
          description="重置后旧的 Token 和 Secret 将立即失效"
          onConfirm={() => handleResetSecret(record)}
        >
          <a>重置凭证</a>
        </Popconfirm>,
        <Popconfirm
          key="delete"
          title={`确认删除应用「${record.name}」？`}
          onConfirm={async () => {
            const res = await dropAppClient({ id: record.id });
            if (res.code !== 0) {
              messageApi.error(res.msg || '删除失败');
              return;
            }
            messageApi.success('已删除');
            actionRef.current?.reload();
          }}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.AppClientItem>
        headerTitle="应用列表"
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await fetchAppClients({
            current: params.current,
            pageSize: params.pageSize,
          });
          const payload = (res as any)?.data ?? res;
          return {
            data: payload?.data || [],
            total: payload?.total || 0,
            success: true,
          };
        }}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => {
              setEditingRecord(undefined);
              form.resetFields();
              setFormOpen(true);
            }}
          >
            新建应用
          </Button>,
        ]}
        scroll={{ x: 1200 }}
        size="small"
        bordered
      />

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑应用' : '新建应用'}
        open={formOpen}
        onOk={handleSave}
        onCancel={() => {
          setFormOpen(false);
          form.resetFields();
          setEditingRecord(undefined);
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="例如：我的应用" />
          </Form.Item>
          <Form.Item
            name="app_id"
            label="应用标识 (app_id)"
            rules={[{ required: !editingRecord, message: '请输入应用标识' }]}
          >
            <Input placeholder="例如：com.example.app" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="应用描述（可选）" />
          </Form.Item>
          {editingRecord && (
            <Form.Item name="is_enabled" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 凭证展示弹窗 */}
      <Modal
        title="⚠️ 请妥善保存凭证"
        open={!!secretResult}
        onOk={() => setSecretResult(null)}
        onCancel={() => setSecretResult(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="我已保存"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="danger">
            Secret 仅此一次展示，关闭后将无法再次查看！
          </Text>
          <div>
            <Text strong>App Token：</Text>
            <Paragraph copyable code style={{ marginBottom: 8 }}>
              {secretResult?.app_token}
            </Paragraph>
          </div>
          <div>
            <Text strong>App Secret：</Text>
            <Paragraph copyable code>
              {secretResult?.app_secret}
            </Paragraph>
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default AppClientPage;
