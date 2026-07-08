import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { hasAdsConsolePermission } from '@/utils/adsConsoleAccess';
import {
  App,
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Popconfirm,
  Row,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import { getPermissionTree } from '@/services/ads-console/permission';
import {
  addRole,
  deleteRole,
  getRolePage,
  getRolePermissions,
  updateRole,
} from '@/services/ads-console/role';

// 将权限树转为 antd Tree 的 DataNode 格式
const toTreeData = (perms: AdsConsole.SysPermission[]): DataNode[] => {
  return perms.map((p) => ({
    key: p.id,
    title: (
      <span>
        {p.name}
        {p.type === 2 && (
          <span style={{ color: '#1677ff', fontSize: 11, marginLeft: 6 }}>
            按钮
          </span>
        )}
        {p.type === 3 && (
          <span style={{ color: '#52c41a', fontSize: 11, marginLeft: 6 }}>
            接口
          </span>
        )}
      </span>
    ),
    children: p.children ? toTreeData(p.children) : undefined,
  }));
};

// 获取树所有节点 key（id 类型为 string，统一用 any[] 避免 string/number 不一致问题）
const getAllKeys = (perms: AdsConsole.SysPermission[]): any[] => {
  const keys: any[] = [];
  const collect = (list: AdsConsole.SysPermission[]) => {
    list.forEach((p) => {
      keys.push(p.id);
      if (p.children) collect(p.children);
    });
  };
  collect(perms);
  return keys;
};

const getParentMap = (
  perms: AdsConsole.SysPermission[],
): Record<string, string | undefined> => {
  const map: Record<string, string | undefined> = {};
  const walk = (list: AdsConsole.SysPermission[], parentId?: string) => {
    list.forEach((item) => {
      const id = String(item.id);
      map[id] = parentId;
      if (item.children?.length) walk(item.children, id);
    });
  };
  walk(perms);
  return map;
};

const getDescendantMap = (
  perms: AdsConsole.SysPermission[],
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};

  const walk = (node: AdsConsole.SysPermission): string[] => {
    const childList = node.children || [];
    const descendants = childList.flatMap((child) => {
      const childId = String(child.id);
      return [childId, ...walk(child)];
    });
    map[String(node.id)] = descendants;
    return descendants;
  };

  perms.forEach((item) => {
    walk(item);
  });
  return map;
};

const withAncestorKeys = (
  keys: (string | number)[],
  parentMap: Record<string, string | undefined>,
): string[] => {
  const checkedSet = new Set(keys.map((key) => String(key)));

  checkedSet.forEach((key) => {
    let parentId = parentMap[key];
    while (parentId) {
      checkedSet.add(parentId);
      parentId = parentMap[parentId];
    }
  });

  return Array.from(checkedSet);
};

const toDisplayCheckedKeys = (
  keys: (string | number)[],
  descendantMap: Record<string, string[]>,
): string[] => {
  const checkedSet = new Set(keys.map((key) => String(key)));

  return Array.from(checkedSet).filter((key) => {
    const descendants = descendantMap[key] || [];
    if (descendants.length === 0) return true;
    const hasCheckedDescendant = descendants.some((id) => checkedSet.has(id));
    return !hasCheckedDescendant;
  });
};

const RoleManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
  const { message } = App.useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.SysRole | null>(null);

  // 权限树数据
  const [permTree, setPermTree] = useState<AdsConsole.SysPermission[]>([]);
  // 当前编辑角色已勾选的权限 ID
  const [editPermIds, setEditPermIds] = useState<string[]>([]);
  const [checkAll, setCheckAll] = useState(false);

  const allPermKeys = useMemo(
    () => getAllKeys(permTree).map((key) => String(key)),
    [permTree],
  );
  const parentMap = useMemo(() => getParentMap(permTree), [permTree]);
  const descendantMap = useMemo(() => getDescendantMap(permTree), [permTree]);

  // 加载权限树（组件挂载时一次性加载）
  useEffect(() => {
    getPermissionTree().then((res) => {
      if (res?.success) setPermTree(res.data || []);
    });
  }, []);

  const handleDelete = async (id: any) => {
    const res = await deleteRole(id as number);
    if (res?.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const openEditModal = async (record?: AdsConsole.SysRole) => {
    setEditRecord(record || null);
    if (record) {
      const res = await getRolePermissions(record.id as any);
      const rawIds = res?.success
        ? ((res.data || []) as (string | number)[])
        : [];
      const fullIds = withAncestorKeys(rawIds, parentMap);
      const ids = toDisplayCheckedKeys(rawIds, descendantMap);
      setEditPermIds(ids);
      setCheckAll(fullIds.length === allPermKeys.length && fullIds.length > 0);
    } else {
      setEditPermIds([]);
      setCheckAll(false);
    }
    setEditModalKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const handleCheckAll = (checked: boolean) => {
    setCheckAll(checked);
    setEditPermIds(checked ? allPermKeys : []);
  };

  const columns: ProColumns<AdsConsole.SysRole>[] = [
    { title: '角色名称', dataIndex: 'name', width: 150, ellipsis: true },
    { title: '角色编码', dataIndex: 'code', width: 150, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        1: { text: '启用', status: 'Success' },
        0: { text: '禁用', status: 'Error' },
      },
    },
    { title: '排序', dataIndex: 'sort', width: 70, hideInSearch: true },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 96,
      fixed: 'right',
      render: (_, record) => [
        <AdsConsoleAuthButton
          key="edit"
          type="link"
          disabled={record.id === '1'}
          size="small"
          code="system:role:edit"
          onClick={() => openEditModal(record)}
        >
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm
          key="delete"
          title="确认删除该角色？"
          onConfirm={() => handleDelete(record.id)}
        >
          <AdsConsoleAuthButton
            type="link"
            size="small"
            disabled={record.id === '1'}
            danger
            code="system:role:delete"
          >
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.SysRole>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getRolePage({
            current: params.current,
            size: params.pageSize,
            name: params.name,
            status: params.status,
          });
          if (res?.success) {
            return {
              data: res.data?.records || [],
              total: res.data?.total || 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
        toolBarRender={() => [
          hasAdsConsolePermission(currentUser, 'system:role:add') && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openEditModal()}
            >
              新增角色
            </Button>
          ),
        ]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        size="small"
      />

      <ModalForm
        key={editModalKey}
        title={editRecord ? `编辑角色 — ${editRecord.name}` : '新增角色'}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={{ ...editRecord }}
        onFinish={async (values) => {
          let res: AdsConsole.Result<null> | undefined;
          if (editRecord) {
            res = await updateRole({
              id: editRecord.id as any,
              ...(values as any),
              permissionIds: withAncestorKeys(editPermIds, parentMap),
            });
          } else {
            res = await addRole({
              ...(values as any),
              permissionIds: withAncestorKeys(editPermIds, parentMap),
            });
          }
          if (res?.success) {
            message.success(editRecord ? '修改成功' : '新增成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        width={600}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormText
          name="name"
          label="角色名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
          placeholder="请输入角色名称"
        />
        <Row gutter={12}>
          <Col span={12}>
            <ProFormText
              name="code"
              label="角色编码"
              rules={[{ required: true, message: '请输入角色编码' }]}
              disabled={!!editRecord}
              placeholder="如 ADMIN"
            />
          </Col>
          <Col span={6}>
            <ProFormSelect
              name="status"
              label="状态"
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
            />
          </Col>
          <Col span={6}>
            <ProFormDigit name="sort" label="排序" min={0} />
          </Col>
        </Row>
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
          rows={2}
        />
        <Divider style={{ margin: '8px 0 12px' }}>权限配置</Divider>
        <Form.Item label={null}>
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              checked={checkAll}
              indeterminate={
                editPermIds.length > 0 &&
                editPermIds.length < allPermKeys.length
              }
              onChange={(e) => handleCheckAll(e.target.checked)}
            >
              全选 / 全不选
            </Checkbox>
          </div>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '8px 12px',
              maxHeight: 280,
              overflowY: 'auto',
              background: '#fafafa',
            }}
          >
            <Tree
              checkable
              treeData={toTreeData(permTree)}
              checkedKeys={editPermIds}
              onCheck={(checked) => {
                const keys = checked as (string | number)[];
                const checkedKeyList = keys.map((key) => String(key));
                const fullCheckedKeys = withAncestorKeys(
                  checkedKeyList,
                  parentMap,
                );
                setEditPermIds(checkedKeyList);
                setCheckAll(
                  fullCheckedKeys.length === allPermKeys.length &&
                    fullCheckedKeys.length > 0,
                );
              }}
              defaultExpandedKeys={[]}
            />
          </div>
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default RoleManagePage;




