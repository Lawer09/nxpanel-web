import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  assignIamRolePermissions,
  createIamRole,
  deleteIamRole,
  listIamPermissions,
  listIamRolePermissions,
  listIamRoles,
  updateIamRole,
} from '@/services/iam/api';
import IamAuthPage from './components/IamAuthPage';
import { STATUS_OPTIONS, toPermissionOptions, trimOptional } from './components/utils';

type RoleFormValues = Partial<API.IamRoleCreateParams & API.IamRoleUpdateParams>;

const normalizeCreatePayload = (values: RoleFormValues): API.IamRoleCreateParams => ({
  name: values.name!.trim(),
  code: values.code!.trim(),
  description: trimOptional(values.description),
  sort: values.sort,
});

const normalizeUpdatePayload = (
  id: number,
  values: RoleFormValues,
): API.IamRoleUpdateParams => ({
  id,
  name: values.name!.trim(),
  description: trimOptional(values.description),
  status: values.status || 'active',
  sort: values.sort,
});

const RolesContent: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [form] = Form.useForm<RoleFormValues>();
  const [permissionsForm] = Form.useForm<{ permission_codes: string[] }>();
  const [permissions, setPermissions] = useState<API.IamPermission[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<API.IamRole | null>(null);
  const [activeRole, setActiveRole] = useState<API.IamRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);

  const permissionOptions = useMemo(() => toPermissionOptions(permissions), [permissions]);

  const reload = () => actionRef.current?.reload();

  const loadPermissions = async () => {
    try {
      const response = await listIamPermissions();
      setPermissions(response.data?.items ?? []);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load permissions.');
    }
  };

  React.useEffect(() => {
    void loadPermissions();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    form.setFieldsValue({
      name: '',
      code: '',
      description: '',
      status: 'active',
      sort: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (record: API.IamRole) => {
    setEditingRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status || 'active',
      sort: record.sort,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingRole) {
        await updateIamRole(normalizeUpdatePayload(editingRole.id, values));
        message.success('Role updated.');
      } else {
        await createIamRole(normalizeCreatePayload(values));
        message.success('Role created.');
      }
      setModalOpen(false);
      setEditingRole(null);
      form.resetFields();
      reload();
    } catch (error: any) {
      message.error(error?.message || 'Save role failed.');
    } finally {
      setSaving(false);
    }
  };

  const openAssignPermissionsModal = async (record: API.IamRole) => {
    setActiveRole(record);
    setPermissionsModalOpen(true);
    setPermissionLoading(true);
    try {
      const response = await listIamRolePermissions(record.id);
      permissionsForm.setFieldsValue({
        permission_codes: (response.data?.items ?? []).map((item) => item.code),
      });
    } catch (error: any) {
      message.error(error?.message || 'Failed to load role permissions.');
    } finally {
      setPermissionLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!activeRole) {
      return;
    }
    const values = await permissionsForm.validateFields();
    setSaving(true);
    try {
      await assignIamRolePermissions({
        role_id: activeRole.id,
        permission_codes: values.permission_codes ?? [],
      });
      message.success('Permissions assigned.');
      setPermissionsModalOpen(false);
      setActiveRole(null);
    } catch (error: any) {
      message.error(error?.message || 'Assign permissions failed.');
    } finally {
      setSaving(false);
    }
  };

  const columns: ProColumns<API.IamRole>[] = [
    { title: 'ID', dataIndex: 'id', width: 90, search: false },
    { title: 'Name', dataIndex: 'name', ellipsis: true, search: false },
    { title: 'Code', dataIndex: 'code', copyable: true, ellipsis: true, search: false },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => <Tag>{record.status || 'active'}</Tag>,
    },
    { title: 'Sort', dataIndex: 'sort', width: 90, search: false },
    { title: 'Description', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: 'Actions',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <a key="edit" onClick={() => openEditModal(record)}>
          Edit
        </a>,
        <a key="permissions" onClick={() => void openAssignPermissionsModal(record)}>
          Permissions
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this role?"
          onConfirm={async () => {
            try {
              await deleteIamRole(record.id);
              message.success('Role deleted.');
              reload();
            } catch (error: any) {
              message.error(error?.message || 'Delete role failed.');
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
      <ProTable<API.IamRole>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={false}
        request={async () => {
          try {
            const response = await listIamRoles();
            return {
              data: response.data?.items ?? [],
              success: true,
            };
          } catch (error: any) {
            message.error(error?.message || 'Failed to load roles.');
            return {
              data: [],
              success: false,
            };
          }
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Create Role
          </Button>,
        ]}
      />

      <Modal
        title={editingRole ? `Edit Role ${editingRole.id}` : 'Create Role'}
        open={modalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleSave()}
        onCancel={() => {
          setModalOpen(false);
          setEditingRole(null);
          form.resetFields();
        }}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter role name.' }]}
          >
            <Input />
          </Form.Item>
          {!editingRole && (
            <Form.Item
              name="code"
              label="Code"
              rules={[{ required: true, message: 'Please enter role code.' }]}
            >
              <Input />
            </Form.Item>
          )}
          {editingRole && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select status.' }]}
            >
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
          <Space size={16} style={{ width: '100%' }} align="start">
            <Form.Item name="sort" label="Sort" style={{ width: 180 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="description" label="Description" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title={activeRole ? `Assign Permissions: ${activeRole.name}` : 'Assign Permissions'}
        open={permissionsModalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleAssignPermissions()}
        onCancel={() => {
          setPermissionsModalOpen(false);
          setActiveRole(null);
          permissionsForm.resetFields();
        }}
        width={760}
      >
        <Form form={permissionsForm} layout="vertical">
          <Form.Item name="permission_codes" label="Permissions">
            <Select
              mode="multiple"
              allowClear
              showSearch
              loading={permissionLoading}
              optionFilterProp="label"
              options={permissionOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

const RolesPage: React.FC = () => (
  <IamAuthPage>
    <RolesContent />
  </IamAuthPage>
);

export default RolesPage;
