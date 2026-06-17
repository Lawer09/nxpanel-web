import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
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
  Switch,
  Tabs,
  Tag,
  TreeSelect,
} from 'antd';
import React, { useMemo, useState } from 'react';
import {
  createAdminMenu,
  deleteAdminMenu,
  listAdminMenus,
  listAdminPermissions,
  listCurrentAdminMenus,
  updateAdminMenu,
} from '@/services/dev-admin/api';
import DevAuthGate from './components/DevAuthGate';

type MenuFormValues = API.DevAdminMenuCreateParams & {
  id?: number;
};

type MenuTreeSelectNode = {
  title: string;
  value: number;
  children?: MenuTreeSelectNode[];
};

const ROOT_PARENT_ID = 0;

const trimOptional = (value?: string) => {
  const text = value?.trim();
  return text || undefined;
};

const walkMenus = (items: API.DevAdminMenu[], visitor: (item: API.DevAdminMenu) => void) => {
  items.forEach((item) => {
    visitor(item);
    if (item.children?.length) {
      walkMenus(item.children, visitor);
    }
  });
};

const collectDescendantIds = (items: API.DevAdminMenu[], targetId?: number) => {
  if (!targetId) {
    return new Set<number>();
  }

  const excluded = new Set<number>();
  const collect = (item: API.DevAdminMenu) => {
    excluded.add(item.id);
    item.children?.forEach(collect);
  };
  const find = (menus: API.DevAdminMenu[]): boolean => {
    for (const item of menus) {
      if (item.id === targetId) {
        collect(item);
        return true;
      }
      if (item.children?.length && find(item.children)) {
        return true;
      }
    }
    return false;
  };
  find(items);
  return excluded;
};

const toChildTreeSelectData = (
  items: API.DevAdminMenu[],
  excludedIds: Set<number>,
): MenuTreeSelectNode[] =>
  items
    .filter((item) => !excludedIds.has(item.id))
    .map((item) => ({
      title: `${item.name} (${item.path})`,
      value: item.id,
      children: item.children?.length
        ? toChildTreeSelectData(item.children, excludedIds)
        : undefined,
    }));

const toTreeSelectData = (
  items: API.DevAdminMenu[],
  excludedIds: Set<number>,
): MenuTreeSelectNode[] => [
  {
    title: 'Root',
    value: ROOT_PARENT_ID,
    children: toChildTreeSelectData(items, excludedIds),
  },
];

const normalizePayload = (values: MenuFormValues): API.DevAdminMenuCreateParams => ({
  parent_id: values.parent_id ?? ROOT_PARENT_ID,
  name: values.name.trim(),
  path: values.path.trim(),
  component: values.component.trim(),
  icon: trimOptional(values.icon),
  sort: values.sort,
  visible: values.visible ?? true,
  permission_code: trimOptional(values.permission_code),
});

const MenusContent: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm<MenuFormValues>();
  const [menus, setMenus] = useState<API.DevAdminMenu[]>([]);
  const [currentMenus, setCurrentMenus] = useState<API.DevAdminMenu[]>([]);
  const [permissions, setPermissions] = useState<API.DevAdminPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLoading, setCurrentLoading] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<API.DevAdminMenu | null>(null);
  const [saving, setSaving] = useState(false);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const response = await listAdminMenus();
      setMenus(response.data?.items ?? []);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load menus.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentMenus = async () => {
    setCurrentLoading(true);
    try {
      const response = await listCurrentAdminMenus();
      setCurrentMenus(response.data?.items ?? []);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load current menus.');
    } finally {
      setCurrentLoading(false);
    }
  };

  const loadPermissions = async () => {
    setPermissionLoading(true);
    try {
      const response = await listAdminPermissions();
      setPermissions(response.data?.items ?? []);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load permissions.');
    } finally {
      setPermissionLoading(false);
    }
  };

  React.useEffect(() => {
    void loadMenus();
    void loadPermissions();
  }, []);

  const permissionOptions = useMemo(
    () =>
      permissions.map((item) => ({
        label: `${item.code}${item.name ? ` - ${item.name}` : ''}`,
        value: item.code,
      })),
    [permissions],
  );

  const treeSelectData = useMemo(
    () => toTreeSelectData(menus, collectDescendantIds(menus, editingMenu?.id)),
    [menus, editingMenu?.id],
  );

  const openCreateModal = (parent?: API.DevAdminMenu) => {
    setEditingMenu(null);
    form.setFieldsValue({
      parent_id: parent?.id ?? ROOT_PARENT_ID,
      name: '',
      path: '',
      component: '',
      icon: '',
      sort: 0,
      visible: true,
      permission_code: undefined,
    });
    setModalOpen(true);
  };

  const openEditModal = (record: API.DevAdminMenu) => {
    setEditingMenu(record);
    form.setFieldsValue({
      id: record.id,
      parent_id: record.parent_id ?? ROOT_PARENT_ID,
      name: record.name,
      path: record.path,
      component: record.component,
      icon: record.icon,
      sort: record.sort,
      visible: record.visible ?? true,
      permission_code: record.permission_code || undefined,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = normalizePayload(values);
    setSaving(true);
    try {
      if (editingMenu) {
        await updateAdminMenu({
          ...payload,
          id: editingMenu.id,
        });
        message.success('Menu updated.');
      } else {
        await createAdminMenu(payload);
        message.success('Menu created.');
      }
      setModalOpen(false);
      setEditingMenu(null);
      form.resetFields();
      await loadMenus();
    } catch (error: any) {
      message.error(error?.message || 'Save menu failed.');
    } finally {
      setSaving(false);
    }
  };

  const baseColumns: ProColumns<API.DevAdminMenu>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Name', dataIndex: 'name', width: 180 },
    {
      title: 'Path',
      dataIndex: 'path',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Component',
      dataIndex: 'component',
      copyable: true,
      ellipsis: true,
    },
    { title: 'Parent ID', dataIndex: 'parent_id', width: 100 },
    { title: 'Icon', dataIndex: 'icon', width: 120, renderText: (value) => value || '-' },
    { title: 'Sort', dataIndex: 'sort', width: 90 },
    {
      title: 'Visible',
      dataIndex: 'visible',
      width: 100,
      render: (_, record) => <Switch checked={record.visible ?? true} disabled />,
    },
    {
      title: 'Permission',
      dataIndex: 'permission_code',
      width: 220,
      render: (_, record) => (record.permission_code ? <Tag>{record.permission_code}</Tag> : '-'),
    },
  ];

  const columns: ProColumns<API.DevAdminMenu>[] = [
    ...baseColumns,
    {
      title: 'Actions',
      valueType: 'option',
      width: 220,
      render: (_, record) => [
        <a key="child" onClick={() => openCreateModal(record)}>
          Add Child
        </a>,
        <a key="edit" onClick={() => openEditModal(record)}>
          Edit
        </a>,
        <Popconfirm
          key="delete"
          title="Delete this menu?"
          onConfirm={async () => {
            try {
              await deleteAdminMenu(record.id);
              message.success('Menu deleted.');
              await loadMenus();
            } catch (error: any) {
              message.error(error?.message || 'Delete menu failed.');
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
      <Tabs
        defaultActiveKey="all"
        onChange={(key) => {
          if (key === 'current' && currentMenus.length === 0) {
            void loadCurrentMenus();
          }
        }}
        items={[
          {
            key: 'all',
            label: 'All Menus',
            children: (
              <ProTable<API.DevAdminMenu>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={menus}
                search={false}
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                toolBarRender={() => [
                  <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
                    Create Root Menu
                  </Button>,
                  <Button key="refresh" onClick={() => void loadMenus()}>
                    Refresh
                  </Button>,
                ]}
              />
            ),
          },
          {
            key: 'current',
            label: 'Current User Preview',
            children: (
              <ProTable<API.DevAdminMenu>
                rowKey="id"
                loading={currentLoading}
                columns={baseColumns}
                dataSource={currentMenus}
                search={false}
                pagination={false}
                options={false}
                expandable={{ defaultExpandAllRows: true }}
                toolBarRender={() => [
                  <Button key="refresh" onClick={() => void loadCurrentMenus()}>
                    Refresh
                  </Button>,
                ]}
              />
            ),
          },
        ]}
      />

      <Modal
        title={editingMenu ? `Edit Menu ${editingMenu.id}` : 'Create Menu'}
        open={modalOpen}
        destroyOnHidden
        confirmLoading={saving}
        onOk={() => void handleSave()}
        onCancel={() => {
          setModalOpen(false);
          setEditingMenu(null);
          form.resetFields();
        }}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="parent_id"
            label="Parent Menu"
            rules={[{ required: true, message: 'Please select parent menu.' }]}
          >
            <TreeSelect treeData={treeSelectData} treeDefaultExpandAll />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter menu name.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="path"
            label="Path"
            rules={[{ required: true, message: 'Please enter menu path.' }]}
          >
            <Input placeholder="/dev/menus" />
          </Form.Item>
          <Form.Item
            name="component"
            label="Component"
            rules={[{ required: true, message: 'Please enter component.' }]}
          >
            <Input placeholder="./dev/Menus" />
          </Form.Item>
          <Space size={16} style={{ width: '100%' }} align="start">
            <Form.Item name="icon" label="Icon" style={{ flex: 1 }}>
              <Input placeholder="code" />
            </Form.Item>
            <Form.Item name="sort" label="Sort" style={{ width: 160 }}>
              <InputNumber style={{ width: '100%' }} precision={0} />
            </Form.Item>
            <Form.Item name="visible" label="Visible" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="permission_code" label="Permission Code">
            <Select
              allowClear
              showSearch
              loading={permissionLoading}
              optionFilterProp="label"
              options={permissionOptions}
              placeholder="No permission binding"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

const MenusPage: React.FC = () => (
  <DevAuthGate>
    <MenusContent />
  </DevAuthGate>
);

export default MenusPage;
