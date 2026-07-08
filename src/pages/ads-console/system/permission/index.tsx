import * as AntIcons from '@ant-design/icons';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { hasAdsConsolePermission } from '@/utils/adsConsoleAccess';
import {
  App,
  Button,
  Col,
  Form,
  Popconfirm,
  Row,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import AdsConsoleIconSelector from '@/components/AdsConsoleIconSelector';
import {
  addPermission,
  deletePermission,
  getPermissionList,
  updatePermission,
} from '@/services/ads-console/permission';

/** 将权限树转为 TreeSelect 所需格式，excludeId 为要排除的节点（编辑时排除自身及子树） */
const toParentSelectData = (
  perms: AdsConsole.SysPermission[],
  excludeId?: string,
): {
  title: string;
  value: any;
  children?: any[];
}[] => {
  return perms
    .filter((p) => String(p.id) !== String(excludeId))
    .map((p) => ({
      title: p.name,
      value: p.id,
      children: p.children?.length
        ? toParentSelectData(p.children, excludeId)
        : undefined,
    }));
};

const PERM_TYPE_MAP: Record<number, { text: string; color: string }> = {
  1: { text: '菜单', color: 'blue' },
  2: { text: '按钮', color: 'green' },
  3: { text: '接口', color: 'orange' },
};

/** 动态渲染 Ant Design 图标 */
const DynamicIcon: React.FC<{ name?: string }> = ({ name }) => {
  if (!name) return <>-</>;
  const IconComp = (AntIcons as any)[name];
  if (!IconComp) return <code style={{ fontSize: 11 }}>{name}</code>;
  return (
    <Tooltip title={name}>
      <IconComp style={{ fontSize: 16 }} />
    </Tooltip>
  );
};

const PermissionManagePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<AdsConsole.SysPermission[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdsConsole.SysPermission | null>(null);
  const [parentId, setParentId] = useState<string>('0');
  const [_parentType, setParentType] = useState<number>(0);
  // 用于强制 ModalForm 重新挂载（刷新 initialValues）
  const [modalKey, setModalKey] = useState(0);

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await getPermissionList();
      if (res?.success) setTreeData(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deletePermission(id as any);
    if (res?.success) {
      message.success('删除成功');
      loadTree();
    }
  };

  /** 新增子节点：pid 为父节点 id，pType 为父节点类型 */
  const openAdd = (pid = '0', pType = 0) => {
    setEditRecord(null);
    setParentId(pid);
    setParentType(pType);
    setModalKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const openEdit = (record: AdsConsole.SysPermission) => {
    setEditRecord(record);
    setParentId(record.parentId);
    setModalKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const columns: ColumnsType<AdsConsole.SysPermission> = [
    {
      title: '权限名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 75,
      render: (type: number) => {
        const t = PERM_TYPE_MAP[type];
        return t ? <Tag color={t.color}>{t.text}</Tag> : '-';
      },
    },
    {
      title: '权限码',
      dataIndex: 'code',
      width: 210,
      ellipsis: true,
      render: (code: string) =>
        code ? <code style={{ fontSize: 11 }}>{code}</code> : '-',
    },
    {
      title: '路由 / 接口路径',
      dataIndex: 'path',
      width: 180,
      ellipsis: true,
      render: (path: string) => path || '-',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 70,
      align: 'center',
      render: (icon: string) => <DynamicIcon name={icon} />,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 60,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    // {
    //   title: '操作',
    //   width: 200,
    //   fixed: 'right',
    //   render: (_, record) => (
    //     <Space size={4}>
    //       {record.type === 1 && (
    //         <a onClick={() => openAdd(record.id as any, record.type)}>
    //           <PlusOutlined/> 新增子项
    //         </a>
    //       )}
    //       <a onClick={() => openEdit(record)} style={{marginLeft: 5, marginRight: 5}}>
    //         <EditOutlined/> 编辑
    //       </a>
    //       <Popconfirm
    //         title="确认删除该权限？"
    //         description="删除后关联的角色权限也会失效，且不可恢复"
    //         onConfirm={() => handleDelete(record.id)}
    //       >
    //         <a style={{color: '#ff4d4f'}}>
    //           <DeleteOutlined/> 删除
    //         </a>
    //       </Popconfirm>
    //     </Space>
    //   ),
    // },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        record.type === 1 && (
          <AdsConsoleAuthButton
            key="add"
            type="link"
            size="small"
            code="system:permission:add"
            onClick={() => openAdd(record.id as any, record.type)}
          >
            新增子项
          </AdsConsoleAuthButton>
        ),
        <AdsConsoleAuthButton
          key="edit"
          type="link"
          size="small"
          code="system:permission:edit"
          onClick={() => openEdit(record)}
        >
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm
          key="delete"
          title="确认删除该权限？"
          description="删除后关联的角色权限也会失效，且不可恢复"
          onConfirm={() => handleDelete(record.id)}
        >
          <AdsConsoleAuthButton
            type="link"
            size="small"
            danger
            code="system:permission:delete"
          >
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>权限管理</span>
          {(hasAdsConsolePermission(currentUser, 'system:permission:add') ||
            false) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openAdd('0', 0)}
            >
              新增根节点
            </Button>
          )}
        </div>

        <Table<AdsConsole.SysPermission>
          rowKey="id"
          columns={columns}
          dataSource={treeData}
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ x: 1080 }}
          expandable={{ defaultExpandAllRows: true }}
          indentSize={20}
          childrenColumnName="children"
        />
      </div>

      <ModalForm
        key={modalKey}
        title={
          editRecord
            ? `编辑权限 — ${PERM_TYPE_MAP[editRecord.type]?.text ?? ''}`
            : `新增权限${parentId ? '（子节点）' : ''}`
        }
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={{ ...editRecord }}
        onFinish={async (values) => {
          const submitValues = {
            ...values,
            icon: values.icon ?? null,
            path: values.path ?? null,
            component: values.component ?? null,
            code: values.code ?? null,
            remark: values.remark ?? null,
          };
          let res: any;
          if (editRecord) {
            res = await updatePermission({
              id: editRecord.id as any,
              ...submitValues,
            });
          } else {
            res = await addPermission({ ...submitValues, parentId });
          }
          if (res?.success) {
            message.success(editRecord ? '修改成功' : '新增成功');
            loadTree();
            return true;
          }
          return false;
        }}
        width={560}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        {/* 父节点（仅子节点编辑时显示，支持更换挂载位置） */}
        {editRecord && editRecord.parentId !== '0' && (
          <Form.Item
            name="parentId"
            label="父节点"
            tooltip="可将当前节点移动到其他菜单节点下"
          >
            <TreeSelect
              treeData={toParentSelectData(treeData, String(editRecord.id))}
              placeholder="请选择父节点"
              treeDefaultExpandAll={false}
              allowClear={false}
              showSearch
              treeNodeFilterProp="title"
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        {/* 权限名称（宽）+ 权限类型（窄）并排 */}
        <Row gutter={12}>
          <Col span={16}>
            <ProFormText
              name="name"
              label="权限名称"
              rules={[{ required: true, message: '请输入权限名称' }]}
              placeholder="请输入权限名称"
            />
          </Col>
          <Col span={8}>
            <ProFormSelect
              name="type"
              label="权限类型"
              options={[
                { label: '菜单', value: 1 },
                { label: '按钮', value: 2 },
                { label: '接口', value: 3 },
              ]}
              rules={[{ required: true, message: '请选择权限类型' }]}
            />
          </Col>
        </Row>

        {/* 根据类型动态展示字段 */}
        <ProFormDependency name={['type']}>
          {({ type }) => {
            if (type === 1) {
              return (
                <>
                  <Row gutter={12}>
                    <Col span={12}>
                      <ProFormText
                        name="path"
                        label="路由路径"
                        placeholder="如 /ads-console/system/user"
                        tooltip="菜单对应的前端路由 URL 路径"
                      />
                    </Col>
                    <Col span={12}>
                      <ProFormText
                        name="component"
                        label="组件路径"
                        placeholder="如 ./ads-console/system/user/index"
                        tooltip="相对于 src/pages 目录的组件文件路径"
                      />
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="icon" label="菜单图标">
                        <AdsConsoleIconSelector placeholder="点击选择菜单图标" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <ProFormText
                        name="code"
                        label="权限码"
                        placeholder="如 system:user:view（可选）"
                        tooltip="菜单级别权限码，用于前端访问控制"
                      />
                    </Col>
                  </Row>
                </>
              );
            }

            if (type === 2) {
              return (
                <ProFormText
                  name="code"
                  label="权限码"
                  rules={[
                    { required: true, message: '按钮类型必须填写权限码' },
                  ]}
                  placeholder="如 system:user:add"
                  tooltip="格式：模块:资源:动作，用于前端按钮权限控制"
                />
              );
            }

            if (type === 3) {
              return (
                <Row gutter={12}>
                  <Col span={12}>
                    <ProFormText
                      name="code"
                      label="权限码"
                      rules={[
                        { required: true, message: '接口类型必须填写权限码' },
                      ]}
                      placeholder="如 system:user:add"
                      tooltip="格式：模块:资源:动作，用于后端接口权限控制"
                    />
                  </Col>
                  <Col span={12}>
                    <ProFormText
                      name="path"
                      label="接口路径"
                      placeholder="如 POST:/ads-api/sys/user"
                      tooltip="HTTP 方法 + 接口路径，如 POST:/ads-api/sys/user"
                    />
                  </Col>
                </Row>
              );
            }

            return null;
          }}
        </ProFormDependency>

        {/* 排序 + 状态 并排，备注独占一行 */}
        <Row gutter={12}>
          <Col span={8}>
            <ProFormDigit name="sort" label="排序" min={0} />
          </Col>
          <Col span={8}>
            <ProFormSelect
              name="status"
              label="状态"
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
            />
          </Col>
        </Row>
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="备注信息（可选）"
          rows={2}
        />
      </ModalForm>
    </>
  );
};

export default PermissionManagePage;





