import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import {
  addTenant,
  deleteTenant,
  getTenantPage,
  updateTenant,
} from '@/services/ads-console/tenant';

const TenantManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();
  const [editModalKey, setEditModalKey] = useState(0);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdsConsole.SysTenant | null>(null);

  const handleDelete = async (id: string) => {
    const res = await deleteTenant(id);
    if (res?.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const columns: ProColumns<AdsConsole.SysTenant>[] = [
    { title: '租户名称', dataIndex: 'name', width: 150, ellipsis: true },
    { title: '租户编码', dataIndex: 'code', width: 120, ellipsis: true },
    { title: '租户域名', dataIndex: 'domain', width: 250, ellipsis: true },
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
    // {
    //   title: '到期时间',
    //   dataIndex: 'expireTime',
    //   width: 160,
    //   hideInSearch: true,
    //   render: (t) => t || <Tag color="blue">永久</Tag>,
    // },
    { title: '联系人', dataIndex: 'contact', width: 100, hideInSearch: true },
    // {title: '联系电话', dataIndex: 'contactPhone', width: 130, hideInSearch: true},
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 160,
      ellipsis: true,
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
          size="small"
          code="system:tenant:edit"
          onClick={() => {
            setEditRecord(record);
            setEditModalOpen(true);
            setEditModalKey((k) => k + 1);
          }}
        >
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm
          key="delete"
          title="确认删除该租户？"
          onConfirm={() => handleDelete(record.id)}
        >
          <AdsConsoleAuthButton
            type="link"
            size="small"
            danger
            code="system:tenant:delete"
          >
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.SysTenant>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTenantPage({
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
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditRecord(null);
              setEditModalOpen(true);
              setEditModalKey((k) => k + 1);
            }}
          >
            新增租户
          </Button>,
        ]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        size="small"
      />

      {/* 新增/编辑弹窗 */}
      <ModalForm
        key={editModalKey}
        title={editRecord ? '编辑租户' : '新增租户'}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={{ ...editRecord }}
        onFinish={async (values) => {
          let res: any;
          if (editRecord) {
            res = await updateTenant({ id: editRecord.id, ...values });
          } else {
            res = await addTenant(values);
          }
          if (res?.success) {
            message.success(editRecord ? '修改成功' : '新增成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        width={500}
      >
        <ProFormText
          name="name"
          label="租户名称"
          rules={[{ required: true, message: '请输入租户名称' }]}
          placeholder="请输入租户名称"
        />
        <ProFormText
          name="code"
          label="租户编码"
          rules={[{ required: true, message: '请输入租户编码' }]}
          disabled={!!editRecord}
          placeholder="大写英文，如 DEMO"
        />
        <ProFormText
          name="domain"
          label="租户域名"
          rules={[{ required: true, message: '请输入租户域名' }]}
          placeholder="如 console.wuyouhudong.com"
        />
        <ProFormSelect
          name="status"
          label="状态"
          rules={[{ required: true, message: '请设置租户状态' }]}
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
        />
        <ProFormText name="contact" label="联系人" placeholder="联系人姓名" />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>
    </>
  );
};

export default TenantManagePage;




