import { CopyOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  assignIamClientRoles,
  createIamClient,
  deleteIamClient,
  listIamClients,
  listIamRoles,
  resetIamClientSecret,
  updateIamClient,
} from '@/services/iam/api';
import IamAuthPage from './components/IamAuthPage';
import { pageParams, STATUS_OPTIONS, toRoleOptions, trimOptional } from './components/utils';

const { Text } = Typography;

type ClientFormValues = Partial<API.IamClientCreateParams & API.IamClientUpdateParams>;

const normalizeCreatePayload = (values: ClientFormValues): API.IamClientCreateParams => ({
  client_id: values.client_id!.trim(),
  name: values.name!.trim(),
  description: trimOptional(values.description),
  status: values.status || 'active',
  role_ids: values.role_ids ?? [],
});

const normalizeUpdatePayload = (
  id: number,
  values: ClientFormValues,
): API.IamClientUpdateParams => ({
  id,
  name: values.name!.trim(),
  description: trimOptional(values.description),
  status: values.status || 'active',
});

const ClientsContent: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<ClientFormValues>();
  const [rolesForm] = Form.useForm<{ role_ids: number[] }>();
  const [roles, setRoles] = useState<API.IamRole[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [secretResult, setSecretResult] = useState<API.IamClientSecretResult | null>(null);
  const [editingClient, setEditingClient] = useState<API.IamClient | null>(null);
  const [activeClient, setActiveClient] = useState<API.IamClient | null>(null);
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(() => toRoleOptions(roles), [roles]);

  const reload = () => actionRef.current?.reload();

  const loadRoles = async () => {
    try {
      const response = await listIamRoles();
      setRoles(response.data?.items ?? []);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load roles.');
    }
  };

  React.useEffect(() => {
    void loadRoles();
  }, []);

  const openCreateModal = () => {
    setEditingClient(null);
    form.setFieldsValue({
      client_id: '',
      name: '',
      description: '',
      status: 'active',
      role_ids: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (record: API.IamClient) => {
    setEditingClient(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status || 'active',
    });
    setModalOpen(true);
  };

  const showSecret = (data: API.IamClientSecretResult) => {
    setSecretResult(data);
    setSecretModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingClient) {
        await updateIamClient(normalizeUpdatePayload(editingClient.id, values));
        message.success('Client updated.');
      } else {
        const response = await createIamClient(normalizeCreatePayload(values));
        message.success('Client created.');
        showSecret(response.data);
      }
      setModalOpen(false);
      setEditingClient(null);
      form.resetFields();
      reload();
    } catch (error: any) {
      message.error(error?.message || 'Save client failed.');
    } finally {
      setSaving(false);
    }
  };

  const openAssignRolesModal = (record: API.IamClient) => {
    setActiveClient(record);
    rolesForm.setFieldsValue({ role_ids: record.role_ids ?? [] });
    setRolesModalOpen(true);
  };

  const handleAssignRoles = async () => {
    if (!activeClient) {
      return;
    }
    const values = await rolesForm.validateFields();
    setSaving(true);
    try {
      await assignIamClientRoles({
        client_id: activeClient.client_id,
        role_ids: values.role_ids ?? [],
      });
      message.success('Roles assigned.');
      setRolesModalOpen(false);
      setActiveClient(null);
      reload();
    } catch (error: any) {
      message.error(error?.message || 'Assign roles failed.');
    } finally {
      setSaving(false);
    }
  };

  const copySecret = async () => {
    if (!secretResult?.client_secret) {
      return;
    }
    try {
      await navigator.clipboard.writeText(secretResult.client_secret);
      message.success('Secret copied.');
    } catch {
      message.error('Copy failed.');
    }
  };

  const columns: ProColumns<API.IamClient>[] = [
    { title: 'ID', dataIndex: 'id', width: 90, search: false },
    { title: 'Client ID', dataIndex: 'client_id', copyable: true, ellipsis: true, search: false },
    { title: 'Name', dataIndex: 'name', ellipsis: true, search: false },
    { title: 'Description', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => <Tag>{record.status || 'active'}</Tag>,
    },
    {
      title: 'Roles',
      dataIndex: 'role_ids',
      width: 160,
      search: false,
      render: (_, record) => (record.role_ids?.length ? record.role_ids.join(', ') : '-'),
    },
    { title: 'Last Used At', dataIndex: 'last_used_at', width: 180, search: false },
    { title: 'Created At', dataIndex: 'created_at', width: 180, search: false },
    {
      title: 'Actions',
      valueType: 'option',
      width: 280,
      render: (_, record) => [
        <a key="edit" onClick={() => openEditModal(record)}>
          Edit
        </a>,
        <a key="roles" onClick={() => openAssignRolesModal(record)}>
          Roles
        </a>,
        <a
          key="reset"
          onClick={async () => {
            try {
              const response = await resetIamClientSecret(record.id);
              message.success('Secret reset.');
              showSecret(response.data);
            } catch (error: any) {
              message.error(error?.message || 'Reset secret failed.');
            }
          }}
        >
          Reset Secret
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this client?"
          onConfirm={async () => {
            try {
              await deleteIamClient(record.id);
              message.success('Client deleted.');
              reload();
            } catch (error: any) {
              message.error(error?.message || 'Delete client failed.');
            }
          }}
        >
          <a>Delete</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.IamClient>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        scroll={{ x: 1400 }}
        request={async (params) => {
          try {
            const response = await listIamClients(pageParams(params));
            return {
              data: response.data?.items ?? [],
              success: true,
              total: response.data?.total ?? 0,
            };
          } catch (error: any) {
            message.error(error?.message || 'Failed to load clients.');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Create Client
          </Button>,
        ]}
      />

      <Modal
        title={editingClient ? `Edit Client ${editingClient.id}` : 'Create Client'}
        open={modalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleSave()}
        onCancel={() => {
          setModalOpen(false);
          setEditingClient(null);
          form.resetFields();
        }}
        width={720}
      >
        <Form form={form} layout="vertical">
          {!editingClient && (
            <Form.Item
              name="client_id"
              label="Client ID"
              rules={[{ required: true, message: 'Please enter client id.' }]}
            >
              <Input />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter client name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          {!editingClient && (
            <Form.Item name="role_ids" label="Initial Roles">
              <Select mode="multiple" allowClear options={roleOptions} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={activeClient ? `Assign Roles: ${activeClient.client_id}` : 'Assign Roles'}
        open={rolesModalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleAssignRoles()}
        onCancel={() => {
          setRolesModalOpen(false);
          setActiveClient(null);
          rolesForm.resetFields();
        }}
      >
        <Form form={rolesForm} layout="vertical">
          <Form.Item name="role_ids" label="Roles">
            <Select mode="multiple" allowClear options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Client Secret"
        open={secretModalOpen}
        destroyOnHidden
        onCancel={() => {
          setSecretModalOpen(false);
          setSecretResult(null);
        }}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => void copySecret()}>
            Copy Secret
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setSecretModalOpen(false);
              setSecretResult(null);
            }}
          >
            Close
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">The client secret is returned only once.</Text>
          <Input value={secretResult?.client_id} readOnly addonBefore="client_id" />
          <Input.TextArea
            value={secretResult?.client_secret}
            readOnly
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
};

const ClientsPage: React.FC = () => (
  <IamAuthPage>
    <ClientsContent />
  </IamAuthPage>
);

export default ClientsPage;
