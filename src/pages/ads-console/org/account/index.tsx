import { assignAccountAgency, assignAccountGroup, assignAccountOwner, batchAssignAccounts, getAccountManage } from '@/services/ads-console/account';
import { getAgencyOptions, getGroupOptions, getTeamOptions } from '@/services/ads-console/orgOptions';
import { getUserOptions } from '@/services/ads-console/userOptions';
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Input, Select, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';

const ACCOUNT_STATUS_MAP: Record<number, { color: string; label: string }> = {
  1: { color: 'success', label: '正常' },
  2: { color: 'error', label: '已禁用' },
  3: { color: 'warning', label: '未结清' },
  7: { color: 'warning', label: '待审核' },
  9: { color: 'default', label: '处理中' },
  100: { color: 'default', label: '已关闭' },
  101: { color: 'error', label: '已注销' },
};

const fmt = (t?: string) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-');

const AccountManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();

  const [allTeamOptions, setAllTeamOptions] = useState<{ label: string; value: string }[]>([]);
  const [allAgencyOptions, setAllAgencyOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [allGroupOptions, setAllGroupOptions] = useState<{ label: string; value: string }[]>([]);
  const [allUserOptions, setAllUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [filterTeamIds, setFilterTeamIds] = useState<string[]>([]);
  const [filterAgencyIds, setFilterAgencyIds] = useState<string[]>([]);
  const [filterGroupIds, setFilterGroupIds] = useState<string[]>([]);
  const [filterAccountId, setFilterAccountId] = useState('');

  const [agencyOpen, setAgencyOpen] = useState(false);
  const [agencyKey, setAgencyKey] = useState(0);
  const [agencyTargetIds, setAgencyTargetIds] = useState<string[]>([]);
  const [agencyTitle, setAgencyTitle] = useState('');
  const [agencyCurrentId, setAgencyCurrentId] = useState<string | undefined>(undefined);

  const [userOpen, setUserOpen] = useState(false);
  const [userKey, setUserKey] = useState(0);
  const [userTargetId, setUserTargetId] = useState('');
  const [userCurrentId, setUserCurrentId] = useState<string | undefined>(undefined);

  const [groupOpen, setGroupOpen] = useState(false);
  const [groupKey, setGroupKey] = useState(0);
  const [groupTargetId, setGroupTargetId] = useState('');
  const [groupCurrentId, setGroupCurrentId] = useState<string | undefined>(undefined);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<AdsConsole.AdsAccountManage[]>([]);
  const [batchUserOpen, setBatchUserOpen] = useState(false);
  const [batchUserKey, setBatchUserKey] = useState(0);
  const [batchGroupOpen, setBatchGroupOpen] = useState(false);
  const [batchGroupKey, setBatchGroupKey] = useState(0);

  const putIdOneFirst = <T extends { value: string | number }>(opts: T[]): T[] => {
    const idx = opts.findIndex((o) => String(o.value) === '1');
    if (idx <= 0) return opts;
    const result = [...opts];
    result.unshift(result.splice(idx, 1)[0]);
    return result;
  };

  useEffect(() => {
    getTeamOptions().then((res) => {
      const opts = (res?.data || []).map((o) => ({ label: String(o.label), value: String(o.value) }));
      setAllTeamOptions(putIdOneFirst(opts));
    });
    getAgencyOptions().then((res) => {
      const opts = res?.success ? res.data || [] : [];
      setAllAgencyOptions(putIdOneFirst(opts as { label: string; value: string | number }[]) as AdsConsole.SelectOption[]);
    });
    getGroupOptions().then((res) =>
      setAllGroupOptions((res?.data || []).map((o) => ({ label: String(o.label), value: String(o.value) }))),
    );
    getUserOptions().then((res) => {
      if (res?.success) setAllUserOptions(res.data || []);
    });
  }, []);

  const openAgencyAssign = (ids: string[], title: string, currentId?: string) => {
    setAgencyTargetIds(ids);
    setAgencyTitle(title);
    setAgencyCurrentId(currentId);
    setAgencyKey((k) => k + 1);
    setAgencyOpen(true);
  };

  const openUserAssign = (id: string, currentId?: string) => {
    setUserTargetId(id);
    setUserCurrentId(currentId);
    setUserKey((k) => k + 1);
    setUserOpen(true);
  };

  const openGroupAssign = (id: string, currentId?: string) => {
    setGroupTargetId(id);
    setGroupCurrentId(currentId);
    setGroupKey((k) => k + 1);
    setGroupOpen(true);
  };

  const columns: ProColumns<AdsConsole.AdsAccountManage>[] = [
    {
      title: '账户 ID',
      dataIndex: 'accountId',
      width: 190,
      fixed: 'left',
      render: (_, record) => (
        <Typography.Text copyable={{ text: record.accountId }}>
          {record.accountId}
        </Typography.Text>
      ),
    },
    {
      title: '账户名称',
      dataIndex: 'name',
      width: 260,
      fixed: 'left',
      ellipsis: { showTitle: false },
      hideInSearch: true,
      render: (_, record) =>
        record.name ? (
          <Tooltip title={record.name} placement="topLeft">
            <span>{record.name}</span>
          </Tooltip>
        ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'accountStatus',
      width: 90,
      hideInSearch: true,
      render: (_, record) => {
        const cfg = ACCOUNT_STATUS_MAP[record.accountStatus ?? 0];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{record.accountStatus ?? '-'}</Tag>;
      },
    },
    {
      title: '团队',
      dataIndex: 'teamName',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.teamName || '-',
    },
    {
      title: '代理商',
      dataIndex: 'agencyName',
      width: 180,
      hideInSearch: true,
      render: (_, record) =>
        record.agencyName ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => openAgencyAssign([record.id], `分配代理商 — ${record.accountId}`, record.agencyId)}
          >
            {record.agencyName}
          </Button>
        ) : (
          <Button
            type="link"
            size="small"
            danger
            style={{ padding: 0, fontWeight: 600 }}
            onClick={() => openAgencyAssign([record.id], `分配代理商 — ${record.accountId}`, record.agencyId)}
          >
            未分配（点击分配）
          </Button>
        ),
    },
    {
      title: '项目组',
      dataIndex: 'groupName',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) =>
        record.groupName ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => openGroupAssign(record.id, record.groupId)}
          >
            {record.groupName}
          </Button>
        ) : (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, color: '#bfbfbf' }}
            onClick={() => openGroupAssign(record.id, record.groupId)}
          >
            未分配
          </Button>
        ),
    },
    {
      title: '负责人',
      dataIndex: 'username',
      width: 150,
      hideInSearch: true,
      render: (_, record) =>
        record.username ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => openUserAssign(record.id, record.userId)}
          >
            {record.username}
          </Button>
        ) : (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, color: '#bfbfbf' }}
            onClick={() => openUserAssign(record.id, record.userId)}
          >
            未分配
          </Button>
        ),
    },
    {
      title: '货币',
      dataIndex: 'currency',
      width: 70,
      hideInSearch: true,
      render: (_, record) => record.currency || '-',
    },
    {
      title: '时区',
      dataIndex: 'timezoneName',
      width: 170,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => record.timezoneName || '-',
    },
    {
      title: '最近同步',
      dataIndex: 'lastSyncTime',
      width: 175,
      hideInSearch: true,
      render: (_, record) =>
        record.lastSyncTime ? (
          <Tooltip title={fmt(record.lastSyncTime)}>
            <span>{fmt(record.lastSyncTime)}</span>
          </Tooltip>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.AdsAccountManage>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertRender={({ selectedRowKeys: keys, onCleanSelected }) => (
          <Space>
            <span>已选 <strong>{keys.length}</strong> 条</span>
            <Button size="small" onClick={onCleanSelected}>取消选择</Button>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button
              size="small"
              onClick={() =>
                openAgencyAssign(
                  selectedRows.map((r) => r.id),
                  `批量分配代理商（${selectedRowKeys.length} 个账户）`,
                )
              }
            >
              分配代理商
            </Button>
            <Button
              size="small"
              onClick={() => { setBatchUserKey((k) => k + 1); setBatchUserOpen(true); }}
            >
              分配负责人
            </Button>
            <Button
              size="small"
              onClick={() => { setBatchGroupKey((k) => k + 1); setBatchGroupOpen(true); }}
            >
              分配项目组
            </Button>
          </Space>
        )}
        rowClassName={(record) => (!record.agencyId ? 'account-row-unassigned' : '')}
        request={async (params) => {
          const res = await getAccountManage({
            current: params.current,
            size: params.pageSize,
            accountId: filterAccountId.trim() || undefined,
            agencyIds: filterAgencyIds.length ? filterAgencyIds : undefined,
            teamIds: filterTeamIds.length ? filterTeamIds : undefined,
            groupIds: filterGroupIds.length ? filterGroupIds : undefined,
          });
          if (res?.success) {
            return { data: res.data?.records || [], total: res.data?.total || 0, success: true };
          }
          return { data: [], total: 0, success: false };
        }}
        search={false}
        toolbar={{
          filter: (
            <Space wrap size={8}>
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 180 }}
                placeholder="团队（多选）"
                options={allTeamOptions}
                value={filterTeamIds}
                onChange={(v) => {
                  setFilterTeamIds(v);
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 180 }}
                placeholder="代理商（多选）"
                options={allAgencyOptions.map((o) => ({ label: String(o.label), value: String(o.value) }))}
                value={filterAgencyIds}
                onChange={(v) => {
                  setFilterAgencyIds(v);
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
              <Select
                mode="multiple"
                allowClear
                style={{ minWidth: 180 }}
                placeholder="项目组（多选）"
                options={allGroupOptions}
                value={filterGroupIds}
                onChange={(v) => {
                  setFilterGroupIds(v);
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
                showSearch
                filterOption={(input, opt) =>
                  String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
              <Input.Search
                placeholder="搜索账户 ID"
                allowClear
                style={{ width: 200 }}
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(e.target.value)}
                onSearch={() => actionRef.current?.reload()}
              />
            </Space>
          ),
        }}
        options={{ reload: true, density: true, setting: true }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1400, y: '60vh' }}
        size="small"
        tableRender={(_props, defaultDom) => (
          <>
            <style>{`
              .account-row-unassigned td { background: #fff1f0 !important; }
              .account-row-unassigned:hover td { background: #ffe0de !important; }
            `}</style>
            {defaultDom}
          </>
        )}
      />

      {/* 分配代理商弹窗 */}
      <ModalForm
        key={`agency-${agencyKey}`}
        title={agencyTitle}
        open={agencyOpen}
        onOpenChange={(open) => {
          setAgencyOpen(open);
          if (!open) setAgencyTargetIds([]);
        }}
        initialValues={{ agencyId: agencyCurrentId }}
        onFinish={async (values) => {
          try {
            if (agencyTargetIds.length === 1) {
              await assignAccountAgency(agencyTargetIds[0], values.agencyId);
            } else {
              await batchAssignAccounts({ ids: agencyTargetIds, agencyId: values.agencyId });
            }
            message.success('分配成功');
            setSelectedRowKeys([]);
            setSelectedRows([]);
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('操作失败');
            return false;
          }
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormSelect
          name="agencyId"
          label="代理商"
          options={allAgencyOptions.map((o) => ({ label: String(o.label), value: String(o.value) }))}
          rules={[{ required: true, message: '请选择代理商' }]}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          placeholder="请选择要关联的代理商"
        />
      </ModalForm>

      {/* 分配负责人弹窗 */}
      <ModalForm
        key={`user-${userKey}`}
        title="分配负责人"
        open={userOpen}
        onOpenChange={(open) => setUserOpen(open)}
        initialValues={{ userId: userCurrentId }}
        onFinish={async (values) => {
          try {
            await assignAccountOwner(userTargetId, values.userId || undefined);
            message.success('分配成功');
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('操作失败');
            return false;
          }
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormSelect
          name="userId"
          label="负责人"
          options={allUserOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          placeholder="选择负责人（不选则清空）"
        />
      </ModalForm>
      {/* 批量分配负责人弹窗 */}
      <ModalForm
        key={`batch-user-${batchUserKey}`}
        title={`批量分配负责人（${selectedRowKeys.length} 个账户）`}
        open={batchUserOpen}
        onOpenChange={(open) => setBatchUserOpen(open)}
        onFinish={async (values) => {
          try {
            const ids = selectedRows.map((r) => r.id);
            await batchAssignAccounts({ ids, userId: values.userId || undefined });
            message.success('分配成功');
            setSelectedRowKeys([]);
            setSelectedRows([]);
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('操作失败');
            return false;
          }
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormSelect
          name="userId"
          label="负责人"
          options={allUserOptions}
          rules={[{ required: true, message: '请选择负责人' }]}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          placeholder="请选择要分配的负责人"
        />
      </ModalForm>

      {/* 批量分配项目组弹窗 */}
      <ModalForm
        key={`batch-group-${batchGroupKey}`}
        title={`批量分配项目组（${selectedRowKeys.length} 个账户）`}
        open={batchGroupOpen}
        onOpenChange={(open) => setBatchGroupOpen(open)}
        onFinish={async (values) => {
          try {
            const ids = selectedRows.map((r) => r.id);
            await batchAssignAccounts({ ids, groupId: values.groupId || undefined });
            message.success('分配成功');
            setSelectedRowKeys([]);
            setSelectedRows([]);
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('操作失败');
            return false;
          }
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormSelect
          name="groupId"
          label="项目组"
          options={allGroupOptions}
          rules={[{ required: true, message: '请选择项目组' }]}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          placeholder="请选择要分配的项目组"
        />
      </ModalForm>

      {/* 分配项目组弹窗 */}
      <ModalForm
        key={`group-${groupKey}`}
        title="分配项目组"
        open={groupOpen}
        onOpenChange={(open) => setGroupOpen(open)}
        initialValues={{ groupId: groupCurrentId }}
        onFinish={async (values) => {
          try {
            await assignAccountGroup(groupTargetId, values.groupId || undefined);
            message.success('分配成功');
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('操作失败');
            return false;
          }
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormSelect
          name="groupId"
          label="项目组"
          options={allGroupOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          placeholder="选择项目组（不选则清空）"
        />
      </ModalForm>
    </>
  );
};

export default AccountManagePage;

