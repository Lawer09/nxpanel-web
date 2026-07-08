import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import { getTeamOptions } from "@/services/ads-console/orgOptions";
import { getRoleList } from "@/services/ads-console/role";
import { addUser, deleteUser, getUserPage, getUserRoleIds, resetPassword, updateUser } from "@/services/ads-console/user";
import { PlusOutlined } from "@ant-design/icons";
import { type ActionType, ModalForm, type ProColumns, ProFormSelect, ProFormText, ProTable } from "@ant-design/pro-components";
import { App, Popconfirm, Switch, Tag } from "antd";
import React, { useEffect, useRef, useState } from "react";

const UserManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message, modal } = App.useApp();

  // 新增/编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.SysUser | null>(null);
  const [editInitialRoleIds, setEditInitialRoleIds] = useState<string[]>([]);

  // 角色选项
  const [allRoles, setAllRoles] = useState<AdsConsole.SysRole[]>([]);
  const [teamOptions, setTeamOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    Promise.all([getRoleList(), getTeamOptions()]).then(([roleRes, teamRes]) => {
      if (roleRes?.success) setAllRoles(roleRes.data || []);
      setTeamOptions(
        (teamRes?.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        }))
      );
    });
  }, []);

  const handleDelete = async (id: string) => {
    const res = await deleteUser(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleResetPwd = (record: AdsConsole.SysUser) => {
    modal.confirm({
      title: `重置用户 "${record.username}" 的密码`,
      content: "重置后密码将变为 Admin@123，是否继续？",
      onOk: async () => {
        const res = await resetPassword(record.id, "Admin@123");
        if (res?.success) {
          message.success("密码已重置为 Admin@123");
        } else {
          message.error(res?.errorMessage || "重置失败");
        }
      },
    });
  };

  const handleStatusChange = async (record: AdsConsole.SysUser, checked: boolean) => {
    const res = await updateUser({ id: record.id, status: checked ? 1 : 0 });
    if (res?.success) {
      message.success("状态更新成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "状态更新失败");
    }
  };

  const openEditModal = async (record?: AdsConsole.SysUser) => {
    setEditRecord(record || null);
    if (record) {
      const res = await getUserRoleIds(record.id);
      setEditInitialRoleIds(res?.success ? res.data || [] : []);
    } else {
      setEditInitialRoleIds([]);
    }
    setEditModalKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const columns: ProColumns<AdsConsole.SysUser>[] = [
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: "left",
      valueType: "select",
      valueEnum: {
        0: { text: "暂停", status: "Error" },
        1: { text: "正常", status: "Success" },
      },
      render: (_, record) => <Switch checked={record.status === 1} checkedChildren="开" unCheckedChildren="关" onChange={(c) => handleStatusChange(record, c)} />,
    },
    {
      title: "用户名",
      dataIndex: "username",
      width: 250,
      ellipsis: true,
    },
    {
      title: "昵称",
      dataIndex: "nickname",
      width: 120,
      ellipsis: true,
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 100,
      hideInSearch: true,
      render: (_, record) => {
        const roles = record.roles || [];
        if (roles.length === 0) return <span style={{ color: "#bfbfbf" }}>—</span>;
        return (
          <>
            {roles.map((r, idx) => (
              <Tag key={r.id ?? `role-${idx}`} color="blue" style={{ marginBottom: 2 }}>
                {r.name}
              </Tag>
            ))}
          </>
        );
      },
    },
    {
      title: "所属团队",
      dataIndex: "teamId",
      width: 150,
      valueType: "select",
      fieldProps: {
        options: teamOptions,
        showSearch: true,
        allowClear: true,
        optionFilterProp: "label",
      },
      render: (_, record) => record.teamName || record.teamId || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 160,
      valueType: "dateTime",
      hideInSearch: true,
      sorter: true,
    },
    {
      title: "操作",
      valueType: "option",
      width: 180,
      fixed: "right",
      render: (_, record) => [
        <AdsConsoleAuthButton key="edit" code="system:user:edit" size="small" type="link" disabled={record.id === "1"} onClick={() => openEditModal(record)}>
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm key="delete" title="确认删除该用户？" onConfirm={() => handleDelete(record.id)}>
          <AdsConsoleAuthButton code="system:user:delete" size="small" type="link" disabled={record.id === "1"} danger>
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
        <AdsConsoleAuthButton key="resetPwd" code="system:user:resetPwd" size="small" type="link" disabled={record.id === "1"} onClick={() => handleResetPwd(record)}>
          密码重置
        </AdsConsoleAuthButton>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.SysUser>
        rowKey={(r) => `${r.id}`}
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getUserPage({
            current: params.current,
            size: params.pageSize,
            username: params.username,
            teamId: params.teamId,
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
          <AdsConsoleAuthButton key="add" code="system:user:add" type="primary" icon={<PlusOutlined />} onClick={() => openEditModal()}>
            新增用户
          </AdsConsoleAuthButton>,
        ]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ y: "50vh" }}
        size="small"
      />

      {/* 新增/编辑弹窗 */}
      <ModalForm
        key={editModalKey}
        title={editRecord ? "编辑用户" : "新增用户"}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={{ ...editRecord, roleIds: editInitialRoleIds }}
        onFinish={async (values) => {
          let res: any;
          if (editRecord) {
            res = await updateUser({ id: editRecord.id, ...(values as any) });
          } else {
            res = await addUser(values as any);
          }
          if (res?.success) {
            message.success(editRecord ? "修改成功" : "新增成功");
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || "操作失败");
          return false;
        }}
        width={580}
        grid={true}
        rowProps={{ gutter: [16, 0] }}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormText
          name="username"
          label="用户名"
          colProps={{ span: editRecord ? 12 : 12 }}
          rules={[{ required: true, message: "请输入用户名" }]}
          disabled={!!editRecord}
          placeholder="请输入用户名"
        />
        {!editRecord && <ProFormText.Password name="password" label="初始密码" colProps={{ span: 12 }} rules={[{ required: true, message: "请输入初始密码" }]} placeholder="请输入初始密码" />}
        <ProFormText name="nickname" label="昵称" colProps={{ span: 12 }} placeholder="请输入昵称" rules={[{ required: true, message: "请输入昵称" }]} />
        <ProFormSelect
          name="teamId"
          label="所属团队"
          colProps={{ span: 12 }}
          options={teamOptions}
          placeholder="请选择所属团队"
          showSearch
          fieldProps={{ optionFilterProp: "label" }}
          rules={[{ required: true, message: "请选择所属团队" }]}
        />
        {/*<ProFormText name="phone" label="手机号" colProps={{span: 12}} placeholder="请输入手机号"/>*/}
        {/*<ProFormText name="email" label="邮箱" colProps={{span: 12}} placeholder="请输入邮箱"/>*/}
        <ProFormSelect
          name="status"
          label="状态"
          colProps={{ span: 12 }}
          options={[
            { label: "启用", value: 1 },
            { label: "禁用", value: 0 },
          ]}
          rules={[{ required: true, message: "请选择状态" }]}
        />
        <ProFormSelect
          name="roleIds"
          label="分配角色"
          colProps={{ span: 24 }}
          mode="multiple"
          options={allRoles.map((r) => ({ label: r.name, value: r.id }))}
          placeholder="请选择角色（可多选）"
          fieldProps={{ allowClear: true }}
          rules={[{ required: true, message: "请选择分配角色" }]}
        />
        {/*<ProFormTextArea name="remark" label="备注" placeholder="请输入备注" rows={2}/>*/}
      </ModalForm>
    </>
  );
};

export default UserManagePage;



