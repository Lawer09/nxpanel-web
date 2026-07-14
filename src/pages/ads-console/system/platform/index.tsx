import {
  addPlatformAccount,
  createMintegralObject,
  deletePlatformAccount,
  getPlatformAccountPage,
  getPlatformObjectPage,
  getPlatformSyncHistoryPage,
  syncPlatformAccount,
  updatePlatformAccount,
  validatePlatformAccount,
} from '@/services/ads-console/platform';
import {
  ModalForm,
  type ProColumns,
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Switch, Tabs, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';

const SYNC_STATUS_MAP: Record<number, { color: string; text: string }> = {
  0: { color: 'processing', text: '同步中' },
  1: { color: 'success', text: '成功' },
  2: { color: 'error', text: '失败' },
};

const PLATFORM_OPTIONS = [{ label: 'Mintegral', value: 'mintegral' }];

type SyncFormValues = {
  dateRange?: [string, string];
  granularity?: string;
  syncMode?: string;
};

type CreateFormValues = {
  type?: string;
  payload?: string;
};

const PlatformPage: React.FC = () => {
  const { message } = App.useApp();
  const accountActionRef = useRef<ActionType>(undefined);
  const objectActionRef = useRef<ActionType>(undefined);
  const historyActionRef = useRef<ActionType>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();
  const [syncRecord, setSyncRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();
  const [createRecord, setCreateRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();

  const openAdd = () => {
    setEditRecord(undefined);
    setEditOpen(true);
  };

  const openEdit = (record: AdsConsole.AdPlatformAccount) => {
    setEditRecord(record);
    setEditOpen(true);
  };

  const handleSave = async (values: Partial<AdsConsole.AdPlatformAccount>) => {
    const payload = { ...values, id: editRecord?.id, platform: values.platform || 'mintegral' };
    const res = editRecord?.id ? await updatePlatformAccount(payload) : await addPlatformAccount(payload);
    if (!res?.success) {
      message.error(res?.errorMessage || '保存失败');
      return false;
    }
    message.success('保存成功');
    accountActionRef.current?.reload();
    return true;
  };

  const handleDelete = async (id: string) => {
    const res = await deletePlatformAccount(id);
    if (res?.success) {
      message.success('删除成功');
      accountActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const handleValidate = async (id: string) => {
    const res = await validatePlatformAccount(id);
    if (res?.success) {
      message.success('账户远端校验完成');
      accountActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '校验失败');
    }
  };

  const handleSync = async (values: SyncFormValues) => {
    if (!syncRecord?.id || !values.dateRange?.[0] || !values.dateRange?.[1]) {
      message.error('请选择同步日期');
      return false;
    }
    const res = await syncPlatformAccount(syncRecord.id, {
      startDate: values.dateRange[0],
      endDate: values.dateRange[1],
      granularity: values.granularity || 'daily',
      syncMode: values.syncMode || 'FULL',
    });
    if (!res?.success) {
      message.error(res?.errorMessage || '同步触发失败');
      return false;
    }
    message.success('同步已触发');
    accountActionRef.current?.reload();
    historyActionRef.current?.reload();
    return true;
  };

  const handleCreate = async (values: CreateFormValues) => {
    if (!createRecord?.id || !values.type || !values.payload) {
      message.error('请选择创建类型并填写官方 JSON');
      return false;
    }
    let payload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(values.payload);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('payload 必须是 JSON 对象');
      }
      payload = parsed as Record<string, unknown>;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'payload 不是合法 JSON');
      return false;
    }
    const res = await createMintegralObject(createRecord.id, { type: values.type, payload });
    if (!res?.success) {
      message.error(res?.errorMessage || '创建失败');
      return false;
    }
    message.success('创建成功');
    objectActionRef.current?.reload();
    historyActionRef.current?.reload();
    return true;
  };

  const accountColumns: ProColumns<AdsConsole.AdPlatformAccount>[] = [
    {
      title: '平台',
      dataIndex: 'platform',
      valueType: 'select',
      valueEnum: {
        mintegral: { text: 'Mintegral' },
      },
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '平台侧账户ID',
      dataIndex: 'accountId',
      hideInSearch: true,
      width: 170,
      renderText: (value) => value || '-',
    },
    {
      title: '平台侧账户名',
      dataIndex: 'accountName',
      hideInSearch: true,
      width: 180,
      renderText: (value) => value || '-',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      hideInSearch: true,
      width: 120,
      renderText: (value) => value ?? '-',
    },
    {
      title: '币种',
      dataIndex: 'currency',
      hideInSearch: true,
      width: 90,
      renderText: (value) => value || '-',
    },
    {
      title: 'Access Key',
      dataIndex: 'accessKey',
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      hideInSearch: true,
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '停用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
      render: (_, record) => <Switch checked={record.status !== 0} disabled />,
      width: 90,
    },
    {
      title: '同步状态',
      dataIndex: 'lastSyncStatus',
      hideInSearch: true,
      width: 180,
      render: (_, record) => {
        if (record.lastSyncStatus == null) return <span style={{ color: '#bfbfbf' }}>未同步</span>;
        const cfg = SYNC_STATUS_MAP[record.lastSyncStatus];
        const tag = <Tag color={cfg?.color}>{cfg?.text || record.lastSyncStatus}</Tag>;
        return (
          <Space size={6}>
            {record.lastSyncMsg ? <Tooltip title={record.lastSyncMsg}>{tag}</Tooltip> : tag}
            {record.lastSyncTime && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(record.lastSyncTime).format('YYYY-MM-DD HH:mm')}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 320,
      render: (_, record) => (
        <Space size={8}>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleValidate(record.id)}>
            校验
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSyncRecord(record);
              setSyncOpen(true);
            }}
          >
            同步
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setCreateRecord(record);
              setCreateOpen(true);
            }}
          >
            创建
          </Button>
          <Popconfirm title="确定删除该平台账户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const objectColumns: ProColumns<AdsConsole.AdPlatformObject>[] = [
    { title: '平台', dataIndex: 'platform', valueType: 'select', valueEnum: { mintegral: { text: 'Mintegral' } }, width: 120 },
    { title: '账户ID', dataIndex: 'accountId', width: 160 },
    { title: '对象类型', dataIndex: 'objectType', width: 140 },
    { title: '对象ID', dataIndex: 'objectId', width: 180 },
    { title: '父对象类型', dataIndex: 'parentObjectType', hideInSearch: true, width: 120 },
    { title: '父对象ID', dataIndex: 'parentObjectId', hideInSearch: true, width: 180 },
    { title: '名称', dataIndex: 'name', width: 220 },
    { title: '状态', dataIndex: 'status', width: 120 },
    {
      title: '同步时间',
      dataIndex: 'lastSyncTime',
      hideInSearch: true,
      width: 160,
      render: (_, record) => record.lastSyncTime ? dayjs(record.lastSyncTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  const historyColumns: ProColumns<AdsConsole.AdPlatformSyncHistory>[] = [
    { title: '平台', dataIndex: 'platform', valueType: 'select', valueEnum: { mintegral: { text: 'Mintegral' } }, width: 120 },
    { title: '对象类型', dataIndex: 'objectType', width: 140 },
    { title: '对象ID', dataIndex: 'objectId', width: 180 },
    {
      title: '状态',
      dataIndex: 'syncStatus',
      valueType: 'select',
      valueEnum: {
        0: { text: '同步中', status: 'Processing' },
        1: { text: '成功', status: 'Success' },
        2: { text: '失败', status: 'Error' },
      },
      width: 110,
    },
    {
      title: '同步时间',
      dataIndex: 'syncTime',
      hideInSearch: true,
      width: 170,
      render: (_, record) => dayjs(record.syncTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '消息',
      dataIndex: 'syncMsg',
      hideInSearch: true,
      render: (_, record) => record.syncMsg ? <Typography.Text ellipsis>{record.syncMsg}</Typography.Text> : '-',
    },
  ];

  return (
    <>
      <Tabs
        items={[
          {
            key: 'accounts',
            label: '平台账户',
            children: (
              <ProTable<AdsConsole.AdPlatformAccount>
                rowKey="id"
                actionRef={accountActionRef}
                columns={accountColumns}
                request={async (params) => {
                  const res = await getPlatformAccountPage({ ...params, platform: params.platform || undefined });
                  return {
                    data: res.data?.records || [],
                    total: res.data?.total || 0,
                    success: !!res.success,
                  };
                }}
                toolBarRender={() => [
                  <Button key="add" type="primary" onClick={openAdd}>
                    新增账户
                  </Button>,
                ]}
                scroll={{ x: 1180 }}
              />
            ),
          },
          {
            key: 'objects',
            label: '同步对象',
            children: (
              <ProTable<AdsConsole.AdPlatformObject>
                rowKey="id"
                actionRef={objectActionRef}
                columns={objectColumns}
                request={async (params) => {
                  const res = await getPlatformObjectPage(params);
                  return {
                    data: res.data?.records || [],
                    total: res.data?.total || 0,
                    success: !!res.success,
                  };
                }}
                scroll={{ x: 1300 }}
              />
            ),
          },
          {
            key: 'history',
            label: '同步历史',
            children: (
              <ProTable<AdsConsole.AdPlatformSyncHistory>
                rowKey="id"
                actionRef={historyActionRef}
                columns={historyColumns}
                request={async (params) => {
                  const res = await getPlatformSyncHistoryPage(params);
                  return {
                    data: res.data?.records || [],
                    total: res.data?.total || 0,
                    success: !!res.success,
                  };
                }}
                scroll={{ x: 1000 }}
              />
            ),
          },
        ]}
      />

      <ModalForm
        title={editRecord ? '编辑平台账户' : '新增平台账户'}
        open={editOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setEditOpen(false) }}
        initialValues={editRecord || { platform: 'mintegral', status: 1 }}
        onFinish={async (values) => {
          const ok = await handleSave(values);
          if (ok) setEditOpen(false);
          return ok;
        }}
      >
        <ProFormSelect name="platform" label="平台" options={PLATFORM_OPTIONS} rules={[{ required: true }]} />
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormText name="accessKey" label="Access Key" rules={[{ required: true }]} />
        <ProFormText.Password name="apiKey" label="API Key" rules={[{ required: true }]} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]}
        />
        <ProFormTextArea name="rawConfig" label="扩展配置 JSON" fieldProps={{ rows: 4 }} />
      </ModalForm>

      <ModalForm
        title={`同步 ${syncRecord?.name || ''}`}
        open={syncOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setSyncOpen(false) }}
        initialValues={{
          granularity: 'daily',
          syncMode: 'FULL',
          dateRange: [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dayjs().subtract(1, 'day').format('YYYY-MM-DD')],
        }}
        onFinish={async (values) => {
          const ok = await handleSync(values as SyncFormValues);
          if (ok) setSyncOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="granularity"
          label="报表粒度"
          options={[
            { label: '日报', value: 'daily' },
            { label: '小时报', value: 'hourly' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="syncMode"
          label="同步模式"
          options={[
            { label: '实体 + 报表', value: 'FULL' },
            { label: '仅实体', value: 'ENTITY' },
            { label: '仅报表', value: 'INSIGHTS' },
          ]}
        />
        <ProFormDateRangePicker name="dateRange" label="同步日期" rules={[{ required: true }]} />
      </ModalForm>

      <ModalForm
        title={`创建 Mintegral 对象 ${createRecord?.name || ''}`}
        open={createOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setCreateOpen(false) }}
        initialValues={{
          type: 'campaign',
          payload: '{\n  \n}',
        }}
        onFinish={async (values) => {
          const ok = await handleCreate(values as CreateFormValues);
          if (ok) setCreateOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="type"
          label="创建类型"
          options={[
            { label: 'Campaign', value: 'campaign' },
            { label: 'Offer', value: 'offer' },
            { label: 'Creative Set', value: 'creative_set' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="payload"
          label="官方 JSON Payload"
          fieldProps={{ rows: 14 }}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
};

export default PlatformPage;

