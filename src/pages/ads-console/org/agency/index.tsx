import AdsConsoleAuthButton from "@/components/AdsConsoleAuthButton";
import { addAgency, deleteAgency, getAgencyPage, updateAgency } from "@/services/ads-console/agency";
import { getTeamOptions } from "@/services/ads-console/orgOptions";
import { PlusOutlined } from "@ant-design/icons";
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from "@ant-design/pro-components";
import { App, Descriptions, Drawer, Input, Popconfirm, Select, Space, Switch, Tag } from "antd";
import React, { useMemo, useRef, useState } from "react";

const AgencyPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.AdsAgency | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdsConsole.AdsAgency | null>(null);
  const [teamOptions, setTeamOptions] = useState<{ label: string; value: string }[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterTeamId, setFilterTeamId] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamOptions.forEach((item) => { map[item.value] = item.label; });
    return map;
  }, [teamOptions]);

  React.useEffect(() => {
    getTeamOptions().then((res) => {
      setTeamOptions((res?.data || []).map((item) => ({ label: item.label, value: String(item.value) })));
    });
  }, []);

  const openEdit = (record?: AdsConsole.AdsAgency) => {
    setEditRecord(record || null);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  };

  const openDetail = (record: AdsConsole.AdsAgency) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteAgency(id);
    if (res?.success) {
      message.success("删除成功");
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || "删除失败");
    }
  };

  const handleStatusChange = async (record: AdsConsole.AdsAgency, checked: boolean) => {
    const res = await updateAgency({ id: record.id, name: record.name, contact: record.contact, email: record.email, remark: record.remark, status: checked ? 1 : 0 });
    if (res?.success) { message.success("状态更新成功"); actionRef.current?.reload(); }
    else { message.error(res?.errorMessage || "状态更新失败"); }
  };

  const columns: ProColumns<AdsConsole.AdsAgency>[] = [
    {
      title: "状态", dataIndex: "status", width: 90, hideInSearch: true,
      render: (_, record) => <Switch checked={record.status === 1} checkedChildren="启用" unCheckedChildren="禁用" onChange={(c) => handleStatusChange(record, c)} />,
    },
    {
      title: "代理商名称", dataIndex: "name", width: 200, ellipsis: true, hideInSearch: true,
      render: (_, record) => <a onClick={() => openDetail(record)}>{record.name}</a>,
    },
    {
      title: "所属团队", dataIndex: "teamId", width: 180, hideInSearch: true,
      render: (_, record) => teamNameMap[record.teamId || ""] || record.teamId || "-",
    },
    {
      title: "账户数", dataIndex: "bmCount", width: 100, hideInSearch: true,
      render: (_, record) => record.bmCount ?? 0,
    },
    {
      title: "备注", width: 300, dataIndex: "remark", hideInSearch: true, ellipsis: true,
    },
    {
      title: "操作", valueType: "option", width: 160,
      render: (_, record) => [
        <AdsConsoleAuthButton key="edit" code="org:agency:edit" size="small" type="link" onClick={() => openEdit(record)}>编辑</AdsConsoleAuthButton>,
        <Popconfirm key="delete" title="确认删除该代理商？" description="若旗下存在账户，将删除失败。" onConfirm={() => handleDelete(record.id)} okType="danger">
          <AdsConsoleAuthButton code="org:agency:delete" size="small" type="link" danger>删除</AdsConsoleAuthButton>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.AdsAgency>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getAgencyPage({
            current: params.current,
            size: params.pageSize,
            name: filterName.trim() || undefined,
            teamId: filterTeamId,
            status: filterStatus,
          });
          if (res?.success) return { data: res.data?.records || [], total: res.data?.total || 0, success: true };
          return { data: [], total: 0, success: false };
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
              <Select
                allowClear
                style={{ minWidth: 180 }}
                placeholder="所属团队"
                options={teamOptions}
                value={filterTeamId}
                onChange={(v) => { setFilterTeamId(v); setTimeout(() => actionRef.current?.reload(), 0); }}
                showSearch
                filterOption={(input, opt) => String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
              <Input.Search
                placeholder="搜索代理商名称"
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
          <AdsConsoleAuthButton key="add" code="org:agency:add" type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新建代理商</AdsConsoleAuthButton>,
        ]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100, y: "60vh" }}
        size="small"
      />

      <ModalForm
        key={editKey}
        title={editRecord ? "编辑代理商" : "新建代理商"}
        open={editOpen}
        onOpenChange={(open) => { setEditOpen(open); if (!open) setEditRecord(null); }}
        initialValues={editRecord ? { ...editRecord } : { status: 1 }}
        onFinish={async (values) => {
          const res = editRecord ? await updateAgency({ id: editRecord.id, ...(values as any) }) : await addAgency(values as any);
          if (res?.success) { message.success(editRecord ? "修改成功" : "新建成功"); actionRef.current?.reload(); return true; }
          message.error(res?.errorMessage || "操作失败"); return false;
        }}
        width={520}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormText name="name" label="代理商名称" rules={[{ required: true, message: "请输入代理商名称" }]} />
        <ProFormSelect name="teamId" label="所属团队" options={teamOptions} rules={[{ required: true, message: "请选择所属团队" }]} showSearch fieldProps={{ optionFilterProp: "label" }} />
        <ProFormText name="contact" label="联系人" placeholder="选填" />
        <ProFormText name="email" label="联系人邮箱" placeholder="选填" rules={[{ type: "email", message: "邮箱格式不正确" }]} />
        <ProFormSelect name="status" label="状态" options={[{ label: "启用", value: 1 }, { label: "禁用", value: 0 }]} rules={[{ required: true }]} initialValue={1} />
        <ProFormTextArea name="remark" label="备注" fieldProps={{ rows: 3 }} />
      </ModalForm>

      <Drawer title={detailRecord ? `代理商详情 - ${detailRecord.name}` : "代理商详情"} open={detailOpen} onClose={() => setDetailOpen(false)} width={480}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="代理商名称">{detailRecord?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="状态">{detailRecord?.status === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>}</Descriptions.Item>
          <Descriptions.Item label="所属团队">{teamNameMap[detailRecord?.teamId || ""] || detailRecord?.teamId || "-"}</Descriptions.Item>
          <Descriptions.Item label="联系人">{detailRecord?.contact || "-"}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{detailRecord?.email || "-"}</Descriptions.Item>
          <Descriptions.Item label="账户数">{detailRecord?.bmCount ?? 0}</Descriptions.Item>
          <Descriptions.Item label="备注">{detailRecord?.remark || "-"}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{detailRecord?.createTime || "-"}</Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  );
};

export default AgencyPage;


