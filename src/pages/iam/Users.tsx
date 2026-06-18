import { PlusOutlined } from '@ant-design/icons';
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
  Switch,
  Tag,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  assignIamUserRoles,
  createIamUser,
  deleteIamUser,
  listIamRoles,
  listIamUsers,
  resetIamUserPassword,
  updateIamUser,
} from '@/services/iam/api';
import IamAuthPage from './components/IamAuthPage';
import { pageParams, STATUS_OPTIONS, toRoleOptions, trimOptional } from './components/utils';

type UserFormValues = Partial<API.IamUserCreateParams & API.IamUserUpdateParams>;

const normalizeCreatePayload = (values: UserFormValues): API.IamUserCreateParams => ({
  username: values.username!.trim(),
  password: values.password!,
  nickname: trimOptional(values.nickname),
  email: trimOptional(values.email),
  phone: trimOptional(values.phone),
  is_super_admin: values.is_super_admin ?? false,
});

const normalizeUpdatePayload = (
  id: number,
  values: UserFormValues,
): API.IamUserUpdateParams => ({
  id,
  nickname: trimOptional(values.nickname),
  email: trimOptional(values.email),
  phone: trimOptional(values.phone),
  status: values.status || 'active',
  is_super_admin: values.is_super_admin ?? false,
});

const UsersContent: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<UserFormValues>();
  const [rolesForm] = Form.useForm<{ role_ids: number[] }>();
  const [passwordForm] = Form.useForm<{ new_password: string }>();
  const [roles, setRoles] = useState<API.IamRole[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<API.IamUser | null>(null);
  const [activeUser, setActiveUser] = useState<API.IamUser | null>(null);
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(() => toRoleOptions(roles), [roles]);

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

  const reload = () => actionRef.current?.reload();

  const openCreateModal = () => {
    setEditingUser(null);
    form.setFieldsValue({
      username: '',
      password: '',
      nickname: '',
      email: '',
      phone: '',
      status: 'active',
      is_super_admin: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (record: API.IamUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      nickname: record.nickname,
      email: record.email,
      phone: record.phone,
      status: record.status || 'active',
      is_super_admin: record.is_super_admin ?? false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingUser) {
        await updateIamUser(normalizeUpdatePayload(editingUser.id, values));
        message.success('User updated.');
      } else {
        await createIamUser(normalizeCreatePayload(values));
        message.success('User created.');
      }
      setModalOpen(false);
      setEditingUser(null);
      form.resetFields();
      reload();
    } catch (error: any) {
      message.error(error?.message || 'Save user failed.');
    } finally {
      setSaving(false);
    }
  };

  const openAssignRolesModal = (record: API.IamUser) => {
    setActiveUser(record);
    rolesForm.setFieldsValue({ role_ids: record.role_ids ?? [] });
    setRolesModalOpen(true);
  };

  const handleAssignRoles = async () => {
    if (!activeUser) {
      return;
    }
    const values = await rolesForm.validateFields();
    setSaving(true);
    try {
      await assignIamUserRoles({
        user_id: activeUser.id,
        role_ids: values.role_ids ?? [],
      });
      message.success('Roles assigned.');
      setRolesModalOpen(false);
      setActiveUser(null);
      reload();
    } catch (error: any) {
      message.error(error?.message || 'Assign roles failed.');
    } finally {
      setSaving(false);
    }
  };

  const openResetPasswordModal = (record: API.IamUser) => {
    setActiveUser(record);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!activeUser) {
      return;
    }
    const values = await passwordForm.validateFields();
    setSaving(true);
    try {
      await resetIamUserPassword(activeUser.id, values.new_password);
      message.success('Password reset.');
      setPasswordModalOpen(false);
      setActiveUser(null);
    } catch (error: any) {
      message.error(error?.message || 'Reset password failed.');
    } finally {
      setSaving(false);
    }
  };

  const columns: ProColumns<API.IamUser>[] = [
    { title: 'ID', dataIndex: 'id', width: 90, search: false },
    { title: 'Username', dataIndex: 'username', ellipsis: true, search: false },
    { title: 'Nickname', dataIndex: 'nickname', ellipsis: true, search: false },
    { title: 'Email', dataIndex: 'email', ellipsis: true, search: false },
    { title: 'Phone', dataIndex: 'phone', ellipsis: true, search: false },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => <Tag>{record.status || 'active'}</Tag>,
    },
    {
      title: 'Super Admin',
      dataIndex: 'is_super_admin',
      width: 120,
      search: false,
      render: (_, record) => (record.is_super_admin ? <Tag color="gold">Yes</Tag> : 'No'),
    },
    {
      title: 'Roles',
      dataIndex: 'role_ids',
      width: 160,
      search: false,
      render: (_, record) => (record.role_ids?.length ? record.role_ids.join(', ') : '-'),
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 260,
      render: (_, record) => [
        <a key="edit" onClick={() => openEditModal(record)}>
          Edit
        </a>,
        <a key="roles" onClick={() => openAssignRolesModal(record)}>
          Roles
        </a>,
        <a key="password" onClick={() => openResetPasswordModal(record)}>
          Reset Password
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this user?"
          onConfirm={async () => {
            try {
              await deleteIamUser(record.id);
              message.success('User deleted.');
              reload();
            } catch (error: any) {
              message.error(error?.message || 'Delete user failed.');
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
      <ProTable<API.IamUser>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        request={async (params) => {
          try {
            const response = await listIamUsers(pageParams(params));
            return {
              data: response.data?.items ?? [],
              success: true,
              total: response.data?.total ?? 0,
            };
          } catch (error: any) {
            message.error(error?.message || 'Failed to load users.');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Create User
          </Button>,
        ]}
      />

      <Modal
        title={editingUser ? `Edit User ${editingUser.id}` : 'Create User'}
        open={modalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleSave()}
        onCancel={() => {
          setModalOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={720}
      >
        <Form form={form} layout="vertical">
          {!editingUser && (
            <>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: 'Please enter username.' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter password.' }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="nickname" label="Nickname">
            <Input />
          </Form.Item>
          <Space size={16} style={{ width: '100%' }} align="start">
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          {editingUser && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status.' }]}
            >
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
          <Form.Item name="is_super_admin" label="Super Admin" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={activeUser ? `Assign Roles: ${activeUser.username}` : 'Assign Roles'}
        open={rolesModalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleAssignRoles()}
        onCancel={() => {
          setRolesModalOpen(false);
          setActiveUser(null);
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
        title={activeUser ? `Reset Password: ${activeUser.username}` : 'Reset Password'}
        open={passwordModalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleResetPassword()}
        onCancel={() => {
          setPasswordModalOpen(false);
          setActiveUser(null);
          passwordForm.resetFields();
        }}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="new_password"
            label="New Password"
            rules={[{ required: true, message: 'Please enter new password.' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

const UsersPage: React.FC = () => (
  <IamAuthPage>
    <UsersContent />
  </IamAuthPage>
);

export default UsersPage;
