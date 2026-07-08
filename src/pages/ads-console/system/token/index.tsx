import { addToken, deleteToken, exchangeLongLivedToken, getTokenPage, inspectToken, triggerTokenSync, updateToken } from '@/services/ads-console/token';
import { getAccountsByToken } from '@/services/ads-console/account';
import {
  type ActionType,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Modal, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';

const SYNC_STATUS_MAP: Record<number, { color: string; text: string }> = {
  0: { color: 'processing', text: '同步中' },
  1: { color: 'success', text: '成功' },
  2: { color: 'error', text: '失败' },
};

const TOKEN_LIFE_TYPE_MAP: Record<string, { color: string; text: string }> = {
  LONG: { color: 'success', text: '长期' },
  SHORT: { color: 'warning', text: '短期' },
  INVALID: { color: 'error', text: '无效' },
  UNKNOWN: { color: 'default', text: '未检测' },
};

const TokenPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message } = App.useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const [editRecord, setEditRecord] = useState<AdsConsole.FbToken | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [inspectingIds, setInspectingIds] = useState<Set<string>>(new Set());
  const [exchangingIds, setExchangingIds] = useState<Set<string>>(new Set());
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [accountsTokenRecord, setAccountsTokenRecord] = useState<AdsConsole.FbToken | null>(null);
  const accountActionRef = useRef<ActionType>(undefined);

  const openAdd = () => {
    setEditRecord(null);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  };

  const openEdit = (record: AdsConsole.FbToken) => {
    setEditRecord(record);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteToken(id);
    if (res?.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const handleSync = async (id: string) => {
    setSyncingIds((prev) => new Set([...prev, id]));
    try {
      const res = await triggerTokenSync(id);
      if (res?.success) {
        message.success('同步已触发，请稍后刷新查看结果');
        setTimeout(() => actionRef.current?.reload(), 2000);
      } else {
        message.error(res?.errorMessage || '触发失败');
      }
    } finally {
      setSyncingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const handleInspect = async (id: string) => {
    setInspectingIds((prev) => new Set([...prev, id]));
    try {
      const res = await inspectToken(id);
      if (res?.success) {
        message.success('检测完成');
        actionRef.current?.reload();
      } else {
        message.error(res?.errorMessage || '检测失败');
      }
    } finally {
      setInspectingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  const handleExchange = async (record: AdsConsole.FbToken) => {
    if (record.tokenLifeType === 'LONG') {
      message.info('当前 Token 已是长期 Token');
      return;
    }
    setExchangingIds((prev) => new Set([...prev, record.id]));
    try {
      const res = await exchangeLongLivedToken(record.id);
      if (res?.success) {
        message.success(res.data?.message || '转换成功');
        actionRef.current?.reload();
      } else {
        message.error(res?.errorMessage || '转换失败');
      }
    } finally {
      setExchangingIds((prev) => {
        const s = new Set(prev);
        s.delete(record.id);
        return s;
      });
    }
  };

  const handleToggleStatus = async (record: AdsConsole.FbToken, checked: boolean) => {
    const res = await updateToken({ id: record.id, status: checked ? 1 : 0 });
    if (res?.success) {
      message.success('状态更新成功');
      actionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '状态更新失败');
    }
  };

  const openAccounts = (record: AdsConsole.FbToken) => {
    setAccountsTokenRecord(record);
    setAccountsOpen(true);
    setTimeout(() => accountActionRef.current?.reload(), 0);
  };

  const columns: ProColumns<AdsConsole.FbToken>[] = [
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>状态</span>,
      dataIndex: 'status',
      width: 80,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      valueType: 'select',
      valueEnum: {
        0: { text: '禁用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          checkedChildren="开"
          unCheckedChildren="关"
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Token</span>,
      dataIndex: 'token',
      width: 180,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      hideInSearch: true,
      render: (_, record) =>
        record.token ? (
          <Typography.Text
            ellipsis={{ tooltip: record.token }}
            copyable={{ text: record.token }}
            style={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 180 }}
          >
            {record.token}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>过期时间</span>,
      dataIndex: 'tokenExpiresAt',
      width: 140,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      hideInSearch: true,
      render: (_, record) =>
        record.tokenExpiresAt ? (
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            {dayjs(record.tokenExpiresAt).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        ) : record.tokenLifeType === 'UNKNOWN' || !record.tokenLastCheckedAt ? (
          <Tag>未检测</Tag>
        ) : record.tokenCheckMsg && record.tokenLifeType === 'INVALID' ? (
          <Tooltip title={record.tokenCheckMsg}>
            <Tag color="error">无效</Tag>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>同步状态</span>,
      dataIndex: 'lastSyncStatus',
      width: 175,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      hideInSearch: true,
      render: (_, record) => {
        if (record.lastSyncStatus == null) return <span style={{ color: '#bfbfbf' }}>未同步</span>;
        const cfg = SYNC_STATUS_MAP[record.lastSyncStatus];
        const statusTag = (
          <Tag color={cfg?.color}>{cfg?.text ?? record.lastSyncStatus}</Tag>
        );
        return (
          <Space size={6}>
            {record.lastSyncMsg && record.lastSyncStatus === 2 ? (
              <Tooltip title={record.lastSyncMsg}>
                {statusTag}
              </Tooltip>
            ) : (
              statusTag
            )}
            {record.lastSyncTime && (
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                {dayjs(record.lastSyncTime).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>账户</span>,
      dataIndex: 'accountCount',
      width: 80,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      hideInSearch: true,
      render: (_, record) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openAccounts(record)}>
          {record.accountCount ?? 0}
        </Button>
      ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>备注</span>,
      dataIndex: 'remark',
      width: 220,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      hideInSearch: true,
      render: (_, record) =>
        record.remark ? (
          <Tooltip title={record.remark}>
            <Typography.Text ellipsis style={{ maxWidth: 220 }}>
              {record.remark}
            </Typography.Text>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>操作</span>,
      valueType: 'option',
      width: 320,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      render: (_, record) => [
        <Button
          key="inspect"
          type="link"
          size="small"
          loading={inspectingIds.has(record.id)}
          onClick={() => handleInspect(record.id)}
        >
          检测
        </Button>,
        <Button
          key="exchange"
          type="link"
          size="small"
          disabled={record.tokenLifeType === 'LONG'}
          loading={exchangingIds.has(record.id)}
          onClick={() => handleExchange(record)}
        >
          转长期
        </Button>,
        <Button
          key="sync"
          type="link"
          size="small"
          loading={syncingIds.has(record.id)}
          onClick={() => handleSync(record.id)}
        >
          手动同步
        </Button>,
        <Button key="edit" type="link" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确认删除该 Token？"
          description="删除后该 Token 对应的账户仍保留，但不再自动同步。"
          onConfirm={() => handleDelete(record.id)}
          okType="danger"
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.FbToken>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTokenPage({
            current: params.current,
            size: params.pageSize,
            status: params.status,
          });
          if (res?.success) {
            return { data: res.data?.records || [], total: res.data?.total || 0, success: true };
          }
          return { data: [], total: 0, success: false };
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={openAdd}>
            新增 Token
          </Button>,
        ]}
        options={{ reload: true, density: true, setting: true }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 'max-content' }}
        size="small"
        search={false}
      />

      <ModalForm
        key={editKey}
        title={editRecord ? '编辑 Token' : '新增 Token'}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditRecord(null);
        }}
        initialValues={editRecord ?? { status: 1 }}
        onFinish={async (values: { token: string; appId?: string; appSecret?: string; status?: number; remark?: string }) => {
          const payload = {
            ...values,
            appSecret: values.appSecret?.trim() || undefined,
            remark: values.remark?.trim() || undefined,
          };
          const res = editRecord
            ? await updateToken({ id: editRecord.id, ...payload })
            : await addToken(payload);
          if (res?.success) {
            message.success(editRecord ? '修改成功' : '新增成功');
            actionRef.current?.reload();
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        width={520}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormTextArea
          name="token"
          label="Facebook Token"
          placeholder="粘贴 Facebook 访问 Token"
          rules={[{ required: true, message: '请输入 Token' }]}
          fieldProps={{ rows: 8 }}
        />
        <ProFormText
          name="appId"
          label="App ID"
          placeholder="请输入 Facebook App ID"
        />
        <ProFormText.Password
          name="appSecret"
          label="App Secret"
          placeholder="请输入 Facebook App Secret"
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          rules={[{ required: true }]}
          initialValue={1}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="请输入备注"
          fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
        />
      </ModalForm>

      <Modal
        title={accountsTokenRecord ? `包含账户 - Token ${accountsTokenRecord.id}` : '包含账户'}
        open={accountsOpen}
        onCancel={() => {
          setAccountsOpen(false);
          setAccountsTokenRecord(null);
        }}
        footer={null}
        width={980}
        destroyOnClose
      >
        <ProTable<AdsConsole.AdsAccountManage>
          rowKey="id"
          actionRef={accountActionRef}
          search={{
            labelWidth: 'auto',
            defaultCollapsed: false,
          }}
          columns={[
            {
              title: '账户ID',
              dataIndex: 'accountId',
              width: 220,
              onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
              onCell: () => ({ style: { whiteSpace: 'nowrap' } }),
            },
            {
              title: '账户名称',
              dataIndex: 'name',
              width: 260,
              ellipsis: true,
            },
            {
              title: '代理商',
              dataIndex: 'agencyName',
              width: 180,
              ellipsis: true,
              hideInSearch: true,
            },
            {
              title: '项目组',
              dataIndex: 'groupName',
              width: 180,
              ellipsis: true,
              hideInSearch: true,
            },
          ]}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          options={false}
          request={async (params) => {
            if (!accountsTokenRecord?.id) {
              return { data: [], total: 0, success: true };
            }
            const res = await getAccountsByToken({
              current: params.current,
              size: params.pageSize,
              tokenId: accountsTokenRecord.id,
              accountId: params.accountId,
              name: params.name,
            });
            return {
              data: res?.data?.records || [],
              total: res?.data?.total || 0,
              success: !!res?.success,
            };
          }}
        />
      </Modal>
    </>
  );
};

export default TokenPage;



