import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import {getAccountOptions} from "@/services/ads-console/adsOptions";
import {getTargetCountryOptions, getTargetEventOptions} from "@/services/ads-console/adsOptions";
import {
  addProject,
  bindProjectAccounts,
  bindProjectUsers,
  deleteProject,
  getProjectAccounts,
  getProjectPage,
  getProjectUsers,
  removeProjectAccounts,
  removeProjectUsers,
  updateProject,
} from "@/services/ads-console/group";
import {getTeamOptions} from "@/services/ads-console/orgOptions";
import {getUserOptions} from "@/services/ads-console/userOptions";
import {PlusOutlined, SyncOutlined, TeamOutlined, UserOutlined} from "@ant-design/icons";
import {type ActionType, ModalForm, type ProColumns, ProFormSelect, ProFormText, ProFormTextArea, ProTable} from "@ant-design/pro-components";
import {App, Badge, Button, Drawer, Input, Popconfirm, Select, Space, Spin, Switch, Table, Tabs, Tag, Tooltip, Typography} from "antd";
import dayjs from "dayjs";
import React, {useEffect, useMemo, useRef, useState} from "react";

const {Text} = Typography;

const PREDEFINED_EVENT_OPTIONS: AdsConsole.SelectOption[] = [
  {label: "purchase", value: "purchase"},
  {label: "lead", value: "lead"},
  {label: "omni_app_install", value: "omni_app_install"},
];

const PREDEFINED_COUNTRY_OPTIONS: AdsConsole.SelectOption[] = [
  {label: "US - 美国", value: "US"},
  {label: "UK - 英国", value: "UK"},
  {label: "CA - 加拿大", value: "CA"},
  {label: "AU - 澳大利亚", value: "AU"},
  {label: "IN - 印度", value: "IN"},
  {label: "PH - 菲律宾", value: "PH"},
  {label: "ID - 印度尼西亚", value: "ID"},
  {label: "TH - 泰国", value: "TH"},
  {label: "MY - 马来西亚", value: "MY"},
  {label: "SG - 新加坡", value: "SG"},
  {label: "VN - 越南", value: "VN"},
  {label: "MM - 缅甸", value: "MM"},
  {label: "KH - 柬埔寨", value: "KH"},
  {label: "BR - 巴西", value: "BR"},
  {label: "DE - 德国", value: "DE"},
  {label: "FR - 法国", value: "FR"},
  {label: "JP - 日本", value: "JP"},
  {label: "KR - 韩国", value: "KR"},
];

const ProjectManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const {message, modal} = App.useApp();

  // 新增/编辑弹窗
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.AdsProject | null>(null);

  // 目标设置弹窗（快速设置 targetEvent/targetCountry）
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetModalKey, setTargetModalKey] = useState(0);
  const [targetModalRecord, setTargetModalRecord] = useState<AdsConsole.AdsProject | null>(null);

  // 目标事件/国家选项（编辑弹窗和目标设置弹窗共用）
  const [targetEventOptions, setTargetEventOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [targetEventLoading, setTargetEventLoading] = useState(false);
  const [targetCountryOptions, setTargetCountryOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [targetCountryLoading, setTargetCountryLoading] = useState(false);

  // 详情抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<AdsConsole.AdsProject | null>(null);
  const [drawerAccounts, setDrawerAccounts] = useState<AdsConsole.AdsProjectAccount[]>([]);
  const [drawerUsers, setDrawerUsers] = useState<AdsConsole.AdsProjectUser[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // 绑定账户弹窗
  const [bindAccountOpen, setBindAccountOpen] = useState(false);
  const [bindAccountGroupId, setBindAccountGroupId] = useState<string>("");
  const [bindAccountOptions, setBindAccountOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [bindAccountSelected, setBindAccountSelected] = useState<string[]>([]);
  const [bindAccountOriginal, setBindAccountOriginal] = useState<string[]>([]);
  const [_bindAccountLoading, setBindAccountLoading] = useState(false);
  const [bindAccountSearching, setBindAccountSearching] = useState(false);

  // 绑定用户弹窗
  const [bindUserOpen, setBindUserOpen] = useState(false);
  const [bindUserGroupId, setBindUserGroupId] = useState<string>("");
  const [bindUserOptions, setBindUserOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [bindUserSelected, setBindUserSelected] = useState<string[]>([]);
  const [bindUserOriginal, setBindUserOriginal] = useState<string[]>([]);
  const [_bindUserLoading, setBindUserLoading] = useState(false);
  const [teamOptions, setTeamOptions] = useState<{label: string; value: string}[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterTeamId, setFilterTeamId] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamOptions.forEach((item) => {
      map[item.value] = item.label;
    });
    return map;
  }, [teamOptions]);

  useEffect(() => {
    getTeamOptions().then((res) => {
      setTeamOptions(
        (res?.data || []).map((item) => ({
          label: item.label,
          value: String(item.value),
        })),
      );
    });
  }, []);

  // 加载项目组的目标事件选项（最近一周账户事件 + 预定义）
  const loadGroupEventOptions = async (groupId: string) => {
    setTargetEventLoading(true);
    try {
      const res = await getTargetEventOptions({
        objectId: groupId,
        objectType: "group",
        startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
      });
      const fetched = res?.data ?? [];
      const predefinedValues = new Set(PREDEFINED_EVENT_OPTIONS.map((o) => String(o.value)));
      setTargetEventOptions([
        ...PREDEFINED_EVENT_OPTIONS.map((o) => ({...o, label: `${o.label} (预设)`})),
        ...fetched.filter((o) => !predefinedValues.has(String(o.value))),
      ]);
    } finally {
      setTargetEventLoading(false);
    }
  };

  // 加载项目组的目标国家选项（最近一周账户数据 + 预定义）
  const loadGroupCountryOptions = async (groupId: string) => {
    setTargetCountryLoading(true);
    try {
      const res = await getTargetCountryOptions({
        objectId: groupId,
        objectType: "group",
        startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
      });
      const fetched = res?.data ?? [];
      const fetchedValues = new Set(fetched.map((o) => String(o.value)));
      setTargetCountryOptions([
        ...fetched,
        ...PREDEFINED_COUNTRY_OPTIONS.filter((o) => !fetchedValues.has(String(o.value))),
      ]);
    } finally {
      setTargetCountryLoading(false);
    }
  };

  // 打开目标快速设置弹窗
  const openTargetModal = (record: AdsConsole.AdsProject) => {
    // 先用当前值预填，保证回显正常（异步加载完成前也能看到已选值）
    setTargetEventOptions(
      record.targetEvent ? [{label: record.targetEvent, value: record.targetEvent}] : [],
    );
    setTargetCountryOptions(
      record.targetCountry ? [{label: record.targetCountry, value: record.targetCountry}] : [],
    );
    setTargetModalRecord(record);
    setTargetModalKey((k) => k + 1);
    setTargetModalOpen(true);
    loadGroupEventOptions(record.id);
    loadGroupCountryOptions(record.id);
  };

  // 加载用户下拉选项
  const loadUserOptions = async () => {
    const res = await getUserOptions();
    if (res?.success) {
      setBindUserOptions(res.data || []);
    }
  };

  // 搜索账户（加载全量账户选项）
  const searchAccounts = async (_keyword?: string) => {
    setBindAccountSearching(true);
    try {
      const res = await getAccountOptions();
      if (res?.success) {
        setBindAccountOptions(res.data || []);
      }
    } finally {
      setBindAccountSearching(false);
    }
  };

  // 打开详情抽屉
  const openDrawer = async (record: AdsConsole.AdsProject) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const [accRes, userRes] = await Promise.all([getProjectAccounts(record.id), getProjectUsers(record.id)]);
      setDrawerAccounts(accRes?.success ? accRes.data || [] : []);
      setDrawerUsers(userRes?.success ? userRes.data || [] : []);
    } finally {
      setDrawerLoading(false);
    }
  };

  // 打开绑定账户弹窗（回显已绑定账户）
  const openBindAccount = async (groupId: string) => {
    setBindAccountGroupId(groupId);
    setBindAccountOpen(true);
    const [, boundRes] = await Promise.all([searchAccounts(), getProjectAccounts(groupId)]);
    const boundIds = (boundRes?.success ? boundRes.data || [] : []).map((a) => a.accountId || "").filter(Boolean);
    setBindAccountOriginal(boundIds);
    setBindAccountSelected(boundIds);
  };

  // 打开绑定用户弹窗（回显已绑定用户）
  const openBindUser = async (groupId: string) => {
    setBindUserGroupId(groupId);
    setBindUserOpen(true);
    const [, boundRes] = await Promise.all([loadUserOptions(), getProjectUsers(groupId)]);
    const boundIds = (boundRes?.success ? boundRes.data || [] : []).map((u) => u.id);
    setBindUserOriginal(boundIds);
    setBindUserSelected(boundIds);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteProject(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleStatusChange = async (record: AdsConsole.AdsProject, checked: boolean) => {
    const res = await updateProject({
      id: record.id,
      teamId: record.teamId || "",
      name: record.name,
      status: checked ? 1 : 0,
      remark: record.remark,
      targetEvent: record.targetEvent,
      targetCountry: record.targetCountry,
    });
    if (res?.success) {
      message.success("状态更新成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "状态更新失败");
    }
  };

  const openEditModal = (record?: AdsConsole.AdsProject) => {
    setEditRecord(record || null);
    setEditModalKey((k) => k + 1);
    setEditModalOpen(true);
    if (record) {
      // 先用当前值预填，保证回显正常
      setTargetEventOptions(
        record.targetEvent ? [{label: record.targetEvent, value: record.targetEvent}] : [],
      );
      setTargetCountryOptions(
        record.targetCountry ? [{label: record.targetCountry, value: record.targetCountry}] : [],
      );
      loadGroupEventOptions(record.id);
      loadGroupCountryOptions(record.id);
    } else {
      setTargetEventOptions(PREDEFINED_EVENT_OPTIONS.map((o) => ({...o, label: `${o.label} (预设)`})));
      setTargetCountryOptions(PREDEFINED_COUNTRY_OPTIONS);
    }
  };

  // 确认绑定账户（差量：新增 + 移除）
  const handleBindAccounts = async () => {
    setBindAccountLoading(true);
    try {
      const toAdd = bindAccountSelected.filter((id) => !bindAccountOriginal.includes(id));
      const toRemove = bindAccountOriginal.filter((id) => !bindAccountSelected.includes(id));
      const ops: Promise<any>[] = [];
      if (toAdd.length > 0) ops.push(bindProjectAccounts(bindAccountGroupId, toAdd));
      if (toRemove.length > 0) ops.push(removeProjectAccounts(bindAccountGroupId, toRemove));
      if (ops.length === 0) {
        message.info("账户分配未发生变化");
        setBindAccountOpen(false);
        return;
      }
      const results = await Promise.all(ops);
      if (results.every((r) => r?.success)) {
        message.success("账户分配已保存");
        setBindAccountOpen(false);
        actionRef.current?.reload();
        if (drawerOpen && drawerRecord?.id === bindAccountGroupId) {
          const accRes = await getProjectAccounts(bindAccountGroupId);
          setDrawerAccounts(accRes?.success ? accRes.data || [] : []);
        }
      } else {
        const firstError = results.find((r) => !r?.success)?.errorMessage;
        message.error(firstError || "部分操作失败，请重试");
      }
    } finally {
      setBindAccountLoading(false);
    }
  };

  // 确认绑定用户（差量：新增 + 移除）
  const handleBindUsers = async () => {
    setBindUserLoading(true);
    try {
      const toAdd = bindUserSelected.filter((id) => !bindUserOriginal.includes(id));
      const toRemove = bindUserOriginal.filter((id) => !bindUserSelected.includes(id));
      const ops: Promise<any>[] = [];
      if (toAdd.length > 0) ops.push(bindProjectUsers(bindUserGroupId, toAdd));
      if (toRemove.length > 0) ops.push(removeProjectUsers(bindUserGroupId, toRemove));
      if (ops.length === 0) {
        message.info("用户成员未发生变化");
        setBindUserOpen(false);
        return;
      }
      const results = await Promise.all(ops);
      if (results.every((r) => r?.success)) {
        message.success("用户成员已保存");
        setBindUserOpen(false);
        actionRef.current?.reload();
        if (drawerOpen && drawerRecord?.id === bindUserGroupId) {
          const userRes = await getProjectUsers(bindUserGroupId);
          setDrawerUsers(userRes?.success ? userRes.data || [] : []);
        }
      } else {
        const firstError = results.find((r) => !r?.success)?.errorMessage;
        message.error(firstError || "部分操作失败，请重试");
      }
    } finally {
      setBindUserLoading(false);
    }
  };

  // 从抽屉中移除账户
  const handleRemoveAccount = (groupId: string, accountId: string) => {
    modal.confirm({
      title: "确认移除该账户？",
      content: "移除后该账户将不再属于此项目组。",
      okType: "danger",
      onOk: async () => {
        const res = await removeProjectAccounts(groupId, [accountId]);
        if (res?.success) {
          message.success("移除成功");
          setDrawerAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
          actionRef.current?.reload();
        } else {
          message.error(res?.errorMessage || "移除失败");
        }
      },
    });
  };

  // 从抽屉中移除用户
  const handleRemoveUser = (groupId: string, userId: string) => {
    modal.confirm({
      title: "确认移出该用户？",
      content: "移出后该用户将无法通过此项目组管理相应账户。",
      okType: "danger",
      onOk: async () => {
        const res = await removeProjectUsers(groupId, [userId]);
        if (res?.success) {
          message.success("移出成功");
          setDrawerUsers((prev) => prev.filter((u) => u.id !== userId));
          actionRef.current?.reload();
        } else {
          message.error(res?.errorMessage || "移出失败");
        }
      },
    });
  };

  const columns: ProColumns<AdsConsole.AdsProject>[] = [
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      fixed: "left",
      hideInSearch: true,
      render: (_, record) => <Switch checked={record.status === 1} checkedChildren="启用" unCheckedChildren="禁用" onChange={(c) => handleStatusChange(record, c)}/>,
    },
    {
      title: "ID",
      dataIndex: "id",
      width: 110,
      hideInTable: true,
      hideInSearch: true,
    },
    {
      title: "项目组名称",
      dataIndex: "name",
      width: 250,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => <a onClick={() => openDrawer(record)}>{record.name}</a>,
    },
    {
      title: "所属团队",
      dataIndex: "teamId",
      width: 180,
      hideInSearch: true,
      render: (_, record) => record.teamName || teamNameMap[record.teamId || ""] || record.teamId || "-",
    },
    {
      title: "目标事件",
      dataIndex: "targetEvent",
      width: 180,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.targetEvent) {
          return (
            <a
              style={{color: "#8c8c8c", borderBottom: "1px dashed #d9d9d9"}}
              onClick={() => openTargetModal(record)}
            >
              暂未设置
            </a>
          );
        }
        return (
          <Tooltip title="点击修改">
            <Tag
              color="blue"
              style={{cursor: "pointer", fontFamily: "monospace"}}
              onClick={() => openTargetModal(record)}
            >
              {record.targetEvent}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "目标国家",
      dataIndex: "targetCountry",
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.targetCountry) {
          return (
            <a
              style={{color: "#8c8c8c", borderBottom: "1px dashed #d9d9d9"}}
              onClick={() => openTargetModal(record)}
            >
              暂未设置
            </a>
          );
        }
        return (
          <Tooltip title="点击修改">
            <Tag
              style={{cursor: "pointer", fontFamily: "monospace"}}
              onClick={() => openTargetModal(record)}
            >
              {record.targetCountry}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "绑定账户",
      dataIndex: "accountCount",
      width: 90,
      hideInSearch: true,
      render: (_, record) => record.accountCount ?? 0,
    },
    {
      title: "绑定用户",
      dataIndex: "userCount",
      width: 90,
      hideInSearch: true,
      render: (_, record) => record.userCount ?? 0,
    },
    {
      title: "备注",
      dataIndex: "remark",
      width: 260,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: "操作",
      valueType: "option",
      width: 300,
      fixed: "right",
      render: (_, record) => [
        <AdsConsoleAuthButton key="bindAccount" code="org:group:edit" size="small" type="link" onClick={() => openBindAccount(record.id)}>
          绑定账户
        </AdsConsoleAuthButton>,
        <AdsConsoleAuthButton key="bindUser" code="org:group:edit" size="small" type="link" onClick={() => openBindUser(record.id)}>
          绑定用户
        </AdsConsoleAuthButton>,
        <AdsConsoleAuthButton key="edit" code="org:group:edit" size="small" type="link" onClick={() => openEditModal(record)}>
          编辑
        </AdsConsoleAuthButton>,
        <Popconfirm key="delete" title="确认删除该项目组？" description="删除后将同时清除所有账户和用户关联关系，不可恢复。" onConfirm={() => handleDelete(record.id)} okType="danger">
          <AdsConsoleAuthButton code="org:group:delete" size="small" type="link" danger>
            删除
          </AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.AdsProject>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getProjectPage({
            current: params.current,
            size: params.pageSize,
            name: filterName.trim() || undefined,
            teamId: filterTeamId,
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
                style={{minWidth: 150}}
                placeholder="状态"
                options={[
                  {label: "启用", value: 1},
                  {label: "禁用", value: 0},
                ]}
                value={filterStatus}
                onChange={(v) => {
                  setFilterStatus(v);
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
              />
              <Select
                allowClear
                style={{minWidth: 180}}
                placeholder="所属团队"
                options={teamOptions}
                value={filterTeamId}
                onChange={(v) => {
                  setFilterTeamId(v);
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              <Input.Search
                placeholder="搜索项目组名称"
                allowClear
                style={{width: 200}}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onSearch={() => actionRef.current?.reload()}
              />
            </Space>
          ),
        }}
        toolBarRender={() => [
          <AdsConsoleAuthButton key="add" code="org:group:add" type="primary" icon={<PlusOutlined/>} onClick={() => openEditModal()}>
            新建项目组
          </AdsConsoleAuthButton>,
        ]}
        pagination={{pageSize: 20, showSizeChanger: true}}
        scroll={{x: 1400, y: "65vh"}}
        size="small"
      />

      {/* 目标快速设置弹窗 */}
      <ModalForm
        key={targetModalKey}
        title={`设置目标 — ${targetModalRecord?.name ?? ""}`}
        open={targetModalOpen}
        onOpenChange={(open) => {
          setTargetModalOpen(open);
          if (!open) {
            setTargetModalRecord(null);
            setTargetEventOptions([]);
            setTargetCountryOptions([]);
          }
        }}
        initialValues={
          targetModalRecord
            ? {targetEvent: targetModalRecord.targetEvent, targetCountry: targetModalRecord.targetCountry}
            : {}
        }
        onFinish={async (values) => {
          if (!targetModalRecord) return false;
          const res = await updateProject({
            id: targetModalRecord.id,
            teamId: targetModalRecord.teamId || "",
            name: targetModalRecord.name,
            status: targetModalRecord.status,
            remark: targetModalRecord.remark,
            targetEvent: values.targetEvent ?? null,
            targetCountry: values.targetCountry ?? null,
          });
          if (res?.success) {
            message.success("设置成功");
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || "设置失败");
          return false;
        }}
        width={480}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <ProFormSelect
          name="targetEvent"
          label={
            <Space size={4}>
              <span>目标事件</span>
              {targetEventLoading
                ? <Spin size="small"/>
                : (
                  <Tooltip title="重新拉取账户最近一周事件">
                    <Button
                      type="text"
                      size="small"
                      icon={<SyncOutlined/>}
                      onClick={() => targetModalRecord && loadGroupEventOptions(targetModalRecord.id)}
                    />
                  </Tooltip>
                )
              }
            </Space>
          }
          placeholder="请选择或直接输入目标事件（选填）"
          options={targetEventOptions}
          fieldProps={{showSearch: true, allowClear: true, loading: targetEventLoading}}
        />
        <ProFormSelect
          name="targetCountry"
          label={
            <Space size={4}>
              <span>目标国家</span>
              {targetCountryLoading
                ? <Spin size="small"/>
                : (
                  <Tooltip title="重新拉取账户最近一周国家数据">
                    <Button
                      type="text"
                      size="small"
                      icon={<SyncOutlined/>}
                      onClick={() => targetModalRecord && loadGroupCountryOptions(targetModalRecord.id)}
                    />
                  </Tooltip>
                )
              }
            </Space>
          }
          placeholder="请选择或直接输入国家代码（如 US，选填）"
          options={targetCountryOptions}
          fieldProps={{showSearch: true, allowClear: true, loading: targetCountryLoading}}
        />
      </ModalForm>

      {/* 新增/编辑弹窗 */}
      <ModalForm
        key={editModalKey}
        title={editRecord ? "编辑项目组" : "新建项目组"}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setEditRecord(null);
            setTargetEventOptions([]);
            setTargetCountryOptions([]);
          }
        }}
        initialValues={editRecord ? {...editRecord, teamId: editRecord.teamId ? String(editRecord.teamId) : undefined} : {status: 1}}
        onFinish={async (values) => {
          const payload = values as {
            teamId: string;
            name: string;
            status: number;
            remark?: string;
            targetEvent?: string;
            targetCountry?: string;
          };
          const res = editRecord ? await updateProject({id: editRecord.id, ...payload}) : await addProject(payload);
          if (res?.success) {
            message.success(editRecord ? "修改成功" : "新建成功");
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || "操作失败");
          return false;
        }}
        width={500}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <ProFormText name="name" label="项目组名称" rules={[{required: true, message: "请输入项目组名称"}]} placeholder="请输入项目组名称（同租户下唯一）"/>
        <ProFormSelect
          name="teamId"
          label="所属团队"
          options={teamOptions}
          placeholder="请选择所属团队"
          rules={[{required: true, message: "请选择所属团队"}]}
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
        <ProFormSelect
          name="targetEvent"
          label={
            <Space size={4}>
              <span>目标事件</span>
              {editRecord && (
                targetEventLoading
                  ? <Spin size="small"/>
                  : (
                    <Tooltip title="重新拉取账户最近一周事件">
                      <Button
                        type="text"
                        size="small"
                        icon={<SyncOutlined/>}
                        onClick={() => editRecord && loadGroupEventOptions(editRecord.id)}
                      />
                    </Tooltip>
                  )
              )}
            </Space>
          }
          placeholder="请选择或直接输入目标事件（选填）"
          options={targetEventOptions}
          fieldProps={{showSearch: true, allowClear: true, loading: targetEventLoading}}
        />
        <ProFormSelect
          name="targetCountry"
          label={
            <Space size={4}>
              <span>目标国家</span>
              {editRecord && (
                targetCountryLoading
                  ? <Spin size="small"/>
                  : (
                    <Tooltip title="重新拉取账户最近一周国家数据">
                      <Button
                        type="text"
                        size="small"
                        icon={<SyncOutlined/>}
                        onClick={() => editRecord && loadGroupCountryOptions(editRecord.id)}
                      />
                    </Tooltip>
                  )
              )}
            </Space>
          }
          placeholder="请选择或直接输入国家代码（如 US，选填）"
          options={targetCountryOptions}
          fieldProps={{showSearch: true, allowClear: true, loading: targetCountryLoading}}
        />
      </ModalForm>

      {/* 绑定账户弹窗 */}
      <ModalForm
        title="绑定广告账户"
        open={bindAccountOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBindAccountOpen(false);
            setBindAccountSelected([]);
            setBindAccountOriginal([]);
          }
        }}
        submitter={{
          searchConfig: {submitText: "确认分配", resetText: "取消"},
        }}
        onFinish={async () => {
          await handleBindAccounts();
          return false;
        }}
        width={520}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <div style={{marginBottom: 8}}>
          <Text type="secondary">搜索并选择要绑定到该项目组的广告账户（支持按名称搜索，可多选）</Text>
        </div>
        <Select
          mode="multiple"
          style={{width: "100%"}}
          placeholder="输入账户名称搜索..."
          loading={bindAccountSearching}
          showSearch
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          options={bindAccountOptions}
          value={bindAccountSelected}
          onChange={(vals) => setBindAccountSelected(vals)}
          optionFilterProp="label"
          allowClear
          notFoundContent={bindAccountSearching ? "搜索中..." : "暂无匹配账户"}
        />
      </ModalForm>

      {/* 绑定用户弹窗 */}
      <ModalForm
        title="邀请用户"
        open={bindUserOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBindUserOpen(false);
            setBindUserSelected([]);
            setBindUserOriginal([]);
          }
        }}
        submitter={{
          searchConfig: {submitText: "确认添加", resetText: "取消"},
        }}
        onFinish={async () => {
          await handleBindUsers();
          return false;
        }}
        width={480}
        modalProps={{destroyOnHidden: true, maskClosable: false}}
      >
        <div style={{marginBottom: 8}}>
          <Text type="secondary">选择要绑定该项目组的用户（显示用户名，可多选，已在组内的用户自动跳过）</Text>
        </div>
        <Select
          mode="multiple"
          style={{width: "100%"}}
          placeholder="输入用户名搜索..."
          showSearch
          options={bindUserOptions}
          value={bindUserSelected}
          onChange={(vals) => setBindUserSelected(vals)}
          optionFilterProp="label"
          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
          allowClear
          notFoundContent="暂无用户数据"
        />
      </ModalForm>

      {/* 详情抽屉 */}
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
          setDrawerAccounts([]);
          setDrawerUsers([]);
        }}
        width={680}
        extra={
          <Space>
            <AdsConsoleAuthButton code="org:group:bindAccount" type="default" icon={<PlusOutlined/>} onClick={() => drawerRecord && openBindAccount(drawerRecord.id)}>
              绑定账户
            </AdsConsoleAuthButton>
            <AdsConsoleAuthButton code="org:group:bindUser" type="primary" icon={<UserOutlined/>} onClick={() => drawerRecord && openBindUser(drawerRecord.id)}>
              绑定用户
            </AdsConsoleAuthButton>
          </Space>
        }
      >
        {drawerRecord?.remark && (
          <div style={{marginBottom: 16}}>
            <Text type="secondary">{drawerRecord.remark}</Text>
          </div>
        )}
        <Tabs
          defaultActiveKey="accounts"
          items={[
            {
              key: "accounts",
              label: (
                <Space>
                  <span>已绑定账户</span>
                  <Badge count={drawerAccounts.length} showZero style={{backgroundColor: "#1677ff"}}/>
                </Space>
              ),
              children: (
                <Table<AdsConsole.AdsProjectAccount>
                  rowKey="id"
                  loading={drawerLoading}
                  dataSource={drawerAccounts}
                  size="small"
                  pagination={{pageSize: 10, showSizeChanger: false}}
                  columns={[
                    {title: "账户ID", dataIndex: "accountId", width: 180},
                    {title: "账户名称", dataIndex: "name", ellipsis: true},
                    {title: "货币", dataIndex: "currency", width: 70},
                    {
                      title: "状态",
                      dataIndex: "accountStatus",
                      width: 80,
                      render: (v) => {
                        const map: Record<number, {color: string; label: string}> = {
                          1: {color: "success", label: "正常"},
                          2: {color: "error", label: "已禁用"},
                          3: {color: "warning", label: "未结清"},
                          100: {color: "default", label: "已关闭"},
                          101: {color: "error", label: "已注销"},
                        };
                        const cfg = map[v];
                        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{v ?? "-"}</Tag>;
                      },
                    },
                    {
                      title: "操作",
                      width: 70,
                      render: (_, record) => (
                        <AdsConsoleAuthButton code="org:group:bindAccount" size="small" type="link" danger onClick={() => drawerRecord && handleRemoveAccount(drawerRecord.id, record.accountId || "")}>
                          移除
                        </AdsConsoleAuthButton>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText: "暂无关联账户，点击右上角「绑定账户」添加",
                  }}
                />
              ),
            },
            {
              key: "users",
              label: (
                <Space>
                  <span>已绑定用户</span>
                  <Badge count={drawerUsers.length} showZero style={{backgroundColor: "#52c41a"}}/>
                </Space>
              ),
              children: (
                <Table<AdsConsole.AdsProjectUser>
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
                        <AdsConsoleAuthButton code="org:group:bindUser" size="small" type="link" danger onClick={() => drawerRecord && handleRemoveUser(drawerRecord.id, record.id)}>
                          移出
                        </AdsConsoleAuthButton>
                      ),
                    },
                  ]}
                  locale={{
                    emptyText: "暂无关联用户，点击右上角「邀请用户」添加",
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

export default ProjectManagePage;

