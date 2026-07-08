import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import {getAgencyOptions, getProjectOptions} from "@/services/ads-console/orgOptions";
import {
  addTeam,
  bindTeamAgencies,
  bindTeamGroups,
  bindTeamUsers,
  deleteTeam,
  getTeamAgencies,
  getTeamGroups,
  getTeamPage,
  getTeamUsers,
  unbindTeamAgencies,
  unbindTeamGroups,
  unbindTeamUsers,
  updateTeam
} from "@/services/ads-console/team";
import {getUserOptions} from "@/services/ads-console/userOptions";
import {PlusOutlined, TeamOutlined, UserOutlined} from "@ant-design/icons";
import {type ActionType, ModalForm, type ProColumns, ProFormSelect, ProFormText, ProFormTextArea, ProTable} from "@ant-design/pro-components";
import {App, Badge, Drawer, Input, Popconfirm, Select, Space, Switch, Table, Tabs, Tag, Typography} from "antd";
import React, {useEffect, useRef, useState} from "react";

const {Text} = Typography;

const TeamManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const {message, modal} = App.useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.OrgTeam | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<AdsConsole.OrgTeam | null>(null);
  const [drawerAgencies, setDrawerAgencies] = useState<AdsConsole.AdsAgency[]>([]);
  const [drawerUsers, setDrawerUsers] = useState<AdsConsole.SysUser[]>([]);
  const [drawerGroups, setDrawerGroups] = useState<AdsConsole.AdsProject[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [associateAgencyOpen, setAssociateAgencyOpen] = useState(false);
  const [associateAgencyTeamId, setAssociateAgencyTeamId] = useState<string>("");
  const [agencyOptions, setAgencyOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [associateAgencySelected, setAssociateAgencySelected] = useState<string[]>([]);
  const [associateAgencyOriginal, setAssociateAgencyOriginal] = useState<string[]>([]);
  const [associateAgencySearching, setAssociateAgencySearching] = useState(false);

  const [associateUserOpen, setAssociateUserOpen] = useState(false);
  const [associateUserTeamId, setAssociateUserTeamId] = useState<string>("");
  const [userOptions, setUserOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [associateUserSelected, setAssociateUserSelected] = useState<string[]>([]);
  const [associateUserOriginal, setAssociateUserOriginal] = useState<string[]>([]);

  const [associateGroupOpen, setAssociateGroupOpen] = useState(false);
  const [associateGroupTeamId, setAssociateGroupTeamId] = useState<string>("");
  const [groupOptions, setGroupOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [associateGroupSelected, setAssociateGroupSelected] = useState<string[]>([]);
  const [associateGroupOriginal, setAssociateGroupOriginal] = useState<string[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);

  const loadAgencyOptions = async () => {
    setAssociateAgencySearching(true);
    try {
      const res = await getAgencyOptions();
      if (res?.success) {
        setAgencyOptions(
          (res.data || []).map((item) => ({
            label: item.label,
            value: String(item.value),
          }))
        );
      }
    } finally {
      setAssociateAgencySearching(false);
    }
  };

  const loadUserOptions = async () => {
    const res = await getUserOptions();
    if (res?.success) {
      setUserOptions(res.data || []);
    }
  };

  const loadGroupOptions = async () => {
    const res = await getProjectOptions();
    if (res?.success) {
      setGroupOptions(
        (res.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        })),
      );
    }
  };

  useEffect(() => {
    loadUserOptions();
  }, []);

  const getUserName = (userId?: string) => (userId ? userOptions.find((o) => String(o.value) === String(userId))?.label || userId : "-");

  const openDrawer = async (record: AdsConsole.OrgTeam) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const [agencyRes, userRes, groupRes] = await Promise.all([getTeamAgencies(record.id), getTeamUsers(record.id), getTeamGroups(record.id)]);
      setDrawerAgencies(agencyRes?.success ? agencyRes.data || [] : []);
      setDrawerUsers(userRes?.success ? userRes.data || [] : []);
      setDrawerGroups(groupRes?.success ? groupRes.data || [] : []);
    } finally {
      setDrawerLoading(false);
    }
  };

  const openAssociateAgency = async (teamId: string) => {
    setAssociateAgencyTeamId(teamId);
    setAssociateAgencyOpen(true);
    const [, boundRes] = await Promise.all([loadAgencyOptions(), getTeamAgencies(teamId)]);
    const boundIds = (boundRes?.success ? boundRes.data || [] : []).map((a) => String(a.id)).filter(Boolean);
    setAssociateAgencyOriginal(boundIds);
    setAssociateAgencySelected(boundIds);
  };

  const openAssociateUser = async (teamId: string) => {
    setAssociateUserTeamId(teamId);
    setAssociateUserOpen(true);
    const [, boundRes] = await Promise.all([loadUserOptions(), getTeamUsers(teamId)]);
    const boundIds = (boundRes?.success ? boundRes.data || [] : []).map((u) => String(u.id));
    setAssociateUserOriginal(boundIds);
    setAssociateUserSelected(boundIds);
  };

  const openAssociateGroup = async (teamId: string) => {
    setAssociateGroupTeamId(teamId);
    setAssociateGroupOpen(true);
    const [, boundRes] = await Promise.all([loadGroupOptions(), getTeamGroups(teamId)]);
    const boundIds = (boundRes?.success ? boundRes.data || [] : []).map((g) => String(g.id));
    setAssociateGroupOriginal(boundIds);
    setAssociateGroupSelected(boundIds);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteTeam(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleStatusChange = async (record: AdsConsole.OrgTeam, checked: boolean) => {
    const res = await updateTeam({
      id: record.id,
      name: record.name,
      ownerUserId: record.ownerUserId,
      remark: record.remark,
      status: checked ? 1 : 0,
    });
    if (res?.success) {
      message.success("状态更新成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "状态更新失败");
    }
  };

  const openEditModal = async (record?: AdsConsole.OrgTeam) => {
    await loadUserOptions();
    setEditRecord(record || null);
    setEditModalKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const handleAssociateAgencies = async () => {
    const toAdd = associateAgencySelected.filter((id) => !associateAgencyOriginal.includes(id));
    const toRemove = associateAgencyOriginal.filter((id) => !associateAgencySelected.includes(id));
    const ops: Promise<any>[] = [];
    if (toAdd.length > 0) ops.push(bindTeamAgencies(associateAgencyTeamId, toAdd));
    if (toRemove.length > 0) ops.push(unbindTeamAgencies(associateAgencyTeamId, toRemove));
    if (ops.length === 0) {
      message.info("代理商关联未发生变化");
      setAssociateAgencyOpen(false);
      return;
    }
    const results = await Promise.all(ops);
    if (results.every((r) => r?.success)) {
      message.success("代理商关联已保存");
      setAssociateAgencyOpen(false);
      actionRef.current?.reload();
      if (drawerOpen && drawerRecord?.id === associateAgencyTeamId) {
        const agencyRes = await getTeamAgencies(associateAgencyTeamId);
        setDrawerAgencies(agencyRes?.success ? agencyRes.data || [] : []);
      }
    } else {
      const firstError = results.find((r) => !r?.success)?.errorMessage;
      message.error(firstError || "部分操作失败，请重试");
    }
  };

  const handleAssociateUsers = async () => {
    const toAdd = associateUserSelected.filter((id) => !associateUserOriginal.includes(id));
    const toRemove = associateUserOriginal.filter((id) => !associateUserSelected.includes(id));
    const ops: Promise<any>[] = [];
    if (toAdd.length > 0) ops.push(bindTeamUsers(associateUserTeamId, toAdd));
    if (toRemove.length > 0) ops.push(unbindTeamUsers(associateUserTeamId, toRemove));
    if (ops.length === 0) {
      message.info("用户关联未发生变化");
      setAssociateUserOpen(false);
      return;
    }
    const results = await Promise.all(ops);
    if (results.every((r) => r?.success)) {
      message.success("用户关联已保存");
      setAssociateUserOpen(false);
      actionRef.current?.reload();
      if (drawerOpen && drawerRecord?.id === associateUserTeamId) {
        const userRes = await getTeamUsers(associateUserTeamId);
        setDrawerUsers(userRes?.success ? userRes.data || [] : []);
      }
    } else {
      const firstError = results.find((r) => !r?.success)?.errorMessage;
      message.error(firstError || "部分操作失败，请重试");
    }
  };

  const handleAssociateGroups = async () => {
    const toAdd = associateGroupSelected.filter((id) => !associateGroupOriginal.includes(id));
    const toRemove = associateGroupOriginal.filter((id) => !associateGroupSelected.includes(id));
    const ops: Promise<any>[] = [];
    if (toAdd.length > 0) ops.push(bindTeamGroups(associateGroupTeamId, toAdd));
    if (toRemove.length > 0) ops.push(unbindTeamGroups(associateGroupTeamId, toRemove));
    if (ops.length === 0) {
      message.info("项目组关联未发生变化");
      setAssociateGroupOpen(false);
      return;
    }
    const results = await Promise.all(ops);
    if (results.every((r) => r?.success)) {
      message.success("项目组关联已保存");
      setAssociateGroupOpen(false);
      actionRef.current?.reload();
      if (drawerOpen && drawerRecord?.id === associateGroupTeamId) {
        const groupRes = await getTeamGroups(associateGroupTeamId);
        setDrawerGroups(groupRes?.success ? groupRes.data || [] : []);
      }
    } else {
      const firstError = results.find((r) => !r?.success)?.errorMessage;
      message.error(firstError || "部分操作失败，请重试");
    }
  };

  const handleRemoveAgency = (teamId: string, agencyId: string) => {
    modal.confirm({
      title: "确认移除该代理商？",
      content: "移除后该代理商将不再属于此团队。",
      okType: "danger",
      onOk: async () => {
        const res = await unbindTeamAgencies(teamId, [agencyId]);
        if (res?.success) {
          message.success("移除成功");
          setDrawerAgencies((prev) => prev.filter((a) => String(a.id) !== agencyId));
          actionRef.current?.reload();
        } else {
          message.error(res?.errorMessage || "移除失败");
        }
      },
    });
  };

  const handleRemoveUser = (teamId: string, userId: string) => {
    modal.confirm({
      title: "确认移出该用户？",
      content: "移出后该用户将不再属于此团队。",
      okType: "danger",
      onOk: async () => {
        const res = await unbindTeamUsers(teamId, [userId]);
        if (res?.success) {
          message.success("移出成功");
          setDrawerUsers((prev) => prev.filter((u) => String(u.id) !== userId));
          actionRef.current?.reload();
        } else {
          message.error(res?.errorMessage || "移出失败");
        }
      },
    });
  };

  const handleRemoveGroup = (teamId: string, groupId: string) => {
    modal.confirm({
      title: "确认移除该项目组？",
      content: "移除后该项目组将不再属于此团队。",
      okType: "danger",
      onOk: async () => {
        const res = await unbindTeamGroups(teamId, [groupId]);
        if (res?.success) {
          message.success("移除成功");
          setDrawerGroups((prev) => prev.filter((g) => String(g.id) !== groupId));
          actionRef.current?.reload();
        } else {
          message.error(res?.errorMessage || "移除失败");
        }
      },
    });
  };

  const columns: ProColumns<AdsConsole.OrgTeam>[] = [
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: "left",
      hideInSearch: true,
      render: (_, record) => <Switch checked={record.status === 1} checkedChildren="启用" unCheckedChildren="禁用" onChange={(c) => handleStatusChange(record, c)}/>,
    },
    {
      title: "团队名称",
      dataIndex: "name",
      width: 250,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => <a onClick={() => openDrawer(record)}>{record.name}</a>,
    },
    {
      title: "团队负责人",
      dataIndex: "ownerUserId",
      width: 180,
      hideInSearch: true,
      render: (_, record) => getUserName(record.ownerUserId),
    },
    {
      title: "关联代理商",
      dataIndex: "agencyCount",
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.agencyCount ?? 0,
    },
    {
      title: "关联项目组",
      dataIndex: "groupCount",
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.groupCount ?? 0,
    },
    {
      title: "关联用户",
      dataIndex: "userCount",
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.userCount ?? record.memberCount ?? 0,
    },
    {
      title: "备注",
      dataIndex: "remark",
      width: 400,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: "操作",
      valueType: "option",
      width: 420,
      fixed: "right",
      render: (_, record) => [
        <AdsConsoleAuthButton key="associateAgency" code="org:team:edit" size="small" type="link" onClick={() => openAssociateAgency(record.id)}>
          关联代理商
        </AdsConsoleAuthButton>,
        <AdsConsoleAuthButton key="associateGroup" code="org:team:edit" size="small" type="link" onClick={() => openAssociateGroup(record.id)}>
          关联项目组
        </AdsConsoleAuthButton>,
        <AdsConsoleAuthButton key="associateUser" code="org:team:edit" size="small" type="link" onClick={() => openAssociateUser(record.id)}>
          关联用户
        </AdsConsoleAuthButton>,
        <AdsConsoleAuthButton key="edit" code="org:team:edit" size="small" type="link" onClick={() => openEditModal(record)}>
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm key="delete" title="确认删除该团队？" description="删除后将同时清除所有代理商和用户关联关系，不可恢复。" onConfirm={() => handleDelete(record.id)} okType="danger">
          <AdsConsoleAuthButton code="org:team:delete" size="small" type="link" danger>
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.OrgTeam>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTeamPage({
            current: params.current,
            size: params.pageSize,
            name: filterName.trim() || undefined,
            status: filterStatus,
          });
          if (res?.success) {
            return {
              data: res.data?.records || [],
              total: res.data?.total || 0,
              success: true,
            };
          }
          return {data: [], total: 0, success: false};
        }}
        search={false}
        toolbar={{
          filter: (
            <Space wrap size={8}>
              <Select
                allowClear
                style={{ minWidth: 120 }}
                placeholder="状态"
                options={[
                  { label: "启用", value: 1 },
                  { label: "禁用", value: 0 },
                ]}
                value={filterStatus}
                onChange={(v) => { setFilterStatus(v); setTimeout(() => actionRef.current?.reload(), 0); }}
              />
              <Input.Search
                placeholder="搜索团队名称"
                allowClear
                style={{ width: 200 }}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onSearch={() => actionRef.current?.reload()}
              />
            </Space>
          ),
        }}
        toolBarRender={() => [
          <AdsConsoleAuthButton key="add" code="org:team:add" type="primary" icon={<PlusOutlined/>} onClick={() => openEditModal()}>
            新增团队
          </AdsConsoleAuthButton>,
        ]}
        pagination={{pageSize: 20, showSizeChanger: true}}
        scroll={{x: 1200, y: "60vh"}}
        size="small"
      />

      <ModalForm
        key={editModalKey}
        title={editRecord ? "编辑团队" : "新增团队"}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={editRecord ? {...editRecord} : {status: 1}}
        onFinish={async (values) => {
          const payload = values as {
            name: string;
            ownerUserId?: string;
            status: number;
            remark?: string;
          };
          const res = editRecord ? await updateTeam({id: editRecord.id, ...payload}) : await addTeam(payload);
          if (res?.success) {
            message.success(editRecord ? "修改成功" : "新增成功");
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || "操作失败");
          return false;
        }}
        width={520}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <ProFormText name="name" label="团队名称" rules={[{required: true, message: "请输入团队名称"}]} placeholder="请输入团队名称"/>
        <ProFormSelect
          name="ownerUserId"
          label="团队负责人"
          options={userOptions}
          placeholder="请选择团队负责人"
          rules={[{required: true, message: "请选择团队负责人"}]}
          showSearch
          fieldProps={{optionFilterProp: "label"}}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            {label: "启用", value: 1},
            {label: "禁用", value: 0},
          ]}
          rules={[{required: true, message: "请选择状态"}]}
          initialValue={1}
        />
        <ProFormTextArea name="remark" label="备注" placeholder="请输入备注（选填）" fieldProps={{rows: 3}}/>
      </ModalForm>

      <ModalForm
        title="关联代理商"
        open={associateAgencyOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssociateAgencyOpen(false);
            setAssociateAgencySelected([]);
            setAssociateAgencyOriginal([]);
          }
        }}
        submitter={{
          searchConfig: {submitText: "确认分配", resetText: "取消"},
        }}
        onFinish={async () => {
          await handleAssociateAgencies();
          return false;
        }}
        width={520}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <div style={{marginBottom: 8}}>
          <Text type="secondary">搜索并选择要关联到该团队的代理商（可多选）</Text>
        </div>
        <Select
          mode="multiple"
          style={{width: "100%"}}
          placeholder="输入代理商名称搜索..."
          loading={associateAgencySearching}
          showSearch
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          options={agencyOptions}
          value={associateAgencySelected}
          onChange={(vals) => setAssociateAgencySelected(vals)}
          optionFilterProp="label"
          allowClear
          notFoundContent={associateAgencySearching ? "搜索中..." : "暂无匹配代理商"}
        />
      </ModalForm>

      <ModalForm
        title="关联用户"
        open={associateUserOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssociateUserOpen(false);
            setAssociateUserSelected([]);
            setAssociateUserOriginal([]);
          }
        }}
        submitter={{
          searchConfig: {submitText: "确认添加", resetText: "取消"},
        }}
        onFinish={async () => {
          await handleAssociateUsers();
          return false;
        }}
        width={480}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <div style={{marginBottom: 8}}>
          <Text type="secondary">选择要关联到该团队的用户（可多选）</Text>
        </div>
        <Select
          mode="multiple"
          style={{width: "100%"}}
          placeholder="输入用户名搜索..."
          showSearch
          options={userOptions}
          value={associateUserSelected}
          onChange={(vals) => setAssociateUserSelected(vals)}
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          allowClear
          notFoundContent="暂无用户数据"
        />
      </ModalForm>

      <ModalForm
        title="关联项目组"
        open={associateGroupOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssociateGroupOpen(false);
            setAssociateGroupSelected([]);
            setAssociateGroupOriginal([]);
          }
        }}
        submitter={{
          searchConfig: {submitText: "确认分配", resetText: "取消"},
        }}
        onFinish={async () => {
          await handleAssociateGroups();
          return false;
        }}
        width={520}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <div style={{marginBottom: 8}}>
          <Text type="secondary">选择要关联到该团队的项目组（可多选）</Text>
        </div>
        <Select
          mode="multiple"
          style={{width: "100%"}}
          placeholder="输入项目组名称搜索..."
          showSearch
          options={groupOptions}
          value={associateGroupSelected}
          onChange={(vals) => setAssociateGroupSelected(vals)}
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          allowClear
          notFoundContent="暂无项目组数据"
        />
      </ModalForm>

      <Drawer
        title={
          <Space>
            <TeamOutlined/>
            <span>{drawerRecord?.name}</span>
            {drawerRecord?.status === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>}
          </Space>
        }
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerRecord(null);
          setDrawerAgencies([]);
          setDrawerUsers([]);
          setDrawerGroups([]);
        }}
        width={700}
        extra={
          <Space>
            <AdsConsoleAuthButton code="org:team:edit" type="default" icon={<PlusOutlined/>} onClick={() => drawerRecord && openAssociateAgency(drawerRecord.id)}>
              关联代理商
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton code="org:team:edit" type="default" icon={<PlusOutlined/>} onClick={() => drawerRecord && openAssociateGroup(drawerRecord.id)}>
              关联项目组
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton code="org:team:edit" type="primary" icon={<UserOutlined/>} onClick={() => drawerRecord && openAssociateUser(drawerRecord.id)}>
              关联用户
            </AdsConsoleAuthButton>
          </Space>
        }
      >
        {drawerRecord?.ownerUserId && (
          <div style={{marginBottom: 16}}>
            <div style={{marginBottom: 4}}>
              <Text type="secondary">团队负责人：{getUserName(drawerRecord.ownerUserId)}</Text>
            </div>
            {drawerRecord?.remark && <Text type="secondary">{drawerRecord.remark}</Text>}
          </div>
        )}
        {!drawerRecord?.ownerUserId && drawerRecord?.remark && (
          <div style={{marginBottom: 16}}>
            <Text type="secondary">{drawerRecord.remark}</Text>
          </div>
        )}
        <Tabs
          defaultActiveKey="agencies"
          items={[
            {
              key: "agencies",
              label: (
                <Space>
                  <span>关联代理商</span>
                  <Badge count={drawerAgencies.length} showZero style={{backgroundColor: "#1677ff"}}/>
                </Space>
              ),
              children: (
                <Table<AdsConsole.AdsAgency>
                  rowKey="id"
                  loading={drawerLoading}
                  dataSource={drawerAgencies}
                  size="small"
                  pagination={{pageSize: 10, showSizeChanger: false}}
                  columns={[
                    {
                      title: "代理商名称",
                      dataIndex: "name",
                      width: 220,
                    },
                    {
                      title: "联系人",
                      dataIndex: "contact",
                      width: 160,
                    },
                    {
                      title: "状态",
                      dataIndex: "status",
                      width: 80,
                      render: (v) => (v === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>),
                    },
                    {
                      title: "操作",
                      width: 70,
                      render: (_, record) => (
                        <AdsConsoleAuthButton code="org:team:edit" size="small" type="link" danger onClick={() => drawerRecord && handleRemoveAgency(drawerRecord.id, String(record.id))}>
                          移除
                        </AdsConsoleAuthButton>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText: "暂无关联代理商，点击右上角「关联代理商」添加",
                  }}
                />
              ),
            },
            {
              key: "groups",
              label: (
                <Space>
                  <span>关联项目组</span>
                  <Badge count={drawerGroups.length} showZero style={{backgroundColor: "#722ed1"}}/>
                </Space>
              ),
              children: (
                <Table<AdsConsole.AdsProject>
                  rowKey="id"
                  loading={drawerLoading}
                  dataSource={drawerGroups}
                  size="small"
                  pagination={{pageSize: 10, showSizeChanger: false}}
                  columns={[
                    {
                      title: "项目组名称",
                      dataIndex: "name",
                      width: 220,
                      ellipsis: true,
                    },
                    {
                      title: "状态",
                      dataIndex: "status",
                      width: 80,
                      render: (v) => (v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>),
                    },
                    {title: "备注", dataIndex: "remark", ellipsis: true},
                    {
                      title: "操作",
                      width: 70,
                      render: (_, record) => (
                        <AdsConsoleAuthButton code="org:team:edit" size="small" type="link" danger onClick={() => drawerRecord && handleRemoveGroup(drawerRecord.id, String(record.id))}>
                          移除
                        </AdsConsoleAuthButton>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText: "暂无关联项目组，点击右上角「关联项目组」添加",
                  }}
                />
              ),
            },
            {
              key: "users",
              label: (
                <Space>
                  <span>关联用户</span>
                  <Badge count={drawerUsers.length} showZero style={{backgroundColor: "#52c41a"}}/>
                </Space>
              ),
              children: (
                <Table<AdsConsole.SysUser>
                  rowKey="id"
                  loading={drawerLoading}
                  dataSource={drawerUsers}
                  size="small"
                  pagination={{pageSize: 10, showSizeChanger: false}}
                  columns={[
                    {
                      title: "用户名",
                      dataIndex: "username",
                      width: 140,
                      ellipsis: true,
                    },
                    {title: "昵称", dataIndex: "nickname", ellipsis: true},
                    {
                      title: "状态",
                      dataIndex: "status",
                      width: 80,
                      render: (v) => (v === 1 ? <Tag color="success">正常</Tag> : <Tag color="default">禁用</Tag>),
                    },
                    {
                      title: "操作",
                      width: 70,
                      render: (_, record) => (
                        <AdsConsoleAuthButton code="org:team:edit" size="small" type="link" danger onClick={() => drawerRecord && handleRemoveUser(drawerRecord.id, String(record.id))}>
                          移出
                        </AdsConsoleAuthButton>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText: "暂无关联用户，点击右上角「关联用户」添加",
                  }}
                />
              ),
            },
          ]}
        />
      </Drawer>
    </>
  );
};

export default TeamManagePage;


