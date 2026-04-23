import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  getSyncStates,
  getSyncLogs,
  triggerSyncJob,
  getSyncServers,
} from '@/services/ad/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const SCOPE_OPTIONS = [
  { label: 'account_meta', value: 'account_meta' },
  { label: 'apps', value: 'apps' },
  { label: 'ad_units', value: 'ad_units' },
  { label: 'revenue_daily', value: 'revenue_daily' },
];

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  running: 'blue',
  failed: 'red',
  pending: 'default',
};

const SyncMonitorPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();

  // ── 同步状态 ──
  const [states, setStates] = useState<API.SyncState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);

  // ── 同步日志 ──
  const [logs, setLogs] = useState<API.SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterServer, setLogFilterServer] = useState<string>();
  const [logFilterStatus, setLogFilterStatus] = useState<string>();
  const [logFilterScope, setLogFilterScope] = useState<string>();
  const [logFilterRange, setLogFilterRange] = useState<[string, string] | undefined>();

  const [syncServers, setSyncServers] = useState<API.SyncServer[]>([]);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const loadStates = async () => {
    setStatesLoading(true);
    const res = await getSyncStates();
    setStatesLoading(false);
    if (res.code === 0) setStates(Array.isArray(res.data) ? res.data : []);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const params: API.SyncLogQuery = {
      server_id: logFilterServer,
      status: logFilterStatus,
      scope: logFilterScope,
      started_from: logFilterRange?.[0],
      started_to: logFilterRange?.[1],
    };
    const res = await getSyncLogs(params);
    setLogsLoading(false);
    if (res.code === 0) setLogs(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadStates();
    loadLogs();
    getSyncServers().then((res) => {
      if (res.code === 0 && res.data) setSyncServers(res.data);
    });
  }, []);

  const handleRetry = (record: API.SyncState) => {
    modalApi.confirm({
      title: '确认重试同步任务？',
      content: `Scope: ${record.scope}，Account: ${record.account_id}`,
      onOk: async () => {
        setTriggerLoading(true);
        const res = await triggerSyncJob({
          scope: record.scope,
          account_ids: [record.account_id],
        });
        setTriggerLoading(false);
        if (res.code !== 0) {
          messageApi.error(res.msg || '触发失败');
          return;
        }
        messageApi.success('已触发重试');
        loadStates();
      },
    });
  };

  const handleManualTrigger = () => {
    modalApi.confirm({
      title: '手动触发同步',
      content: (
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder="选择 Scope"
          options={SCOPE_OPTIONS}
          onChange={(v) => {
            // store in closure via data attribute
            (document.getElementById('__trigger_scope') as any)?.remove();
            const el = document.createElement('input');
            el.id = '__trigger_scope';
            el.type = 'hidden';
            el.value = v;
            document.body.appendChild(el);
          }}
        />
      ),
      onOk: async () => {
        const el = document.getElementById('__trigger_scope') as HTMLInputElement | null;
        const scope = el?.value;
        el?.remove();
        if (!scope) {
          messageApi.warning('请选择 Scope');
          return;
        }
        const res = await triggerSyncJob({ scope });
        if (res.code !== 0) {
          messageApi.error(res.msg || '触发失败');
          return;
        }
        messageApi.success('已触发同步');
        loadStates();
        loadLogs();
      },
    });
  };

  // ── 状态表列 ──
  const stateColumns: ColumnsType<API.SyncState> = [
    { title: 'Scope', dataIndex: 'scope', width: 140 },
    { title: '账号 ID', dataIndex: 'account_id', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '最后成功时间',
      dataIndex: 'last_success_at',
      width: 180,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '最后错误',
      dataIndex: 'last_error_message',
      ellipsis: true,
      render: (v) =>
        v ? <Text type="danger">{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) =>
        record.status === 'failed' ? (
          <a onClick={() => handleRetry(record)}>重试</a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  // ── 日志表列 ──
  const logColumns: ColumnsType<API.SyncLog> = [
    { title: '节点 ID', dataIndex: 'server_id', width: 140 },
    { title: 'Scope', dataIndex: 'scope', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    { title: '行数', dataIndex: 'row_count', width: 80, align: 'right' },
    { title: '开始时间', dataIndex: 'started_at', width: 180 },
    { title: '结束时间', dataIndex: 'ended_at', width: 180 },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      ellipsis: true,
      render: (v) =>
        v ? <Text type="danger">{v}</Text> : <Text type="secondary">-</Text>,
    },
  ];

  return (
    <PageContainer
      extra={[
        <Button
          key="trigger"
          icon={<PlayCircleOutlined />}
          loading={triggerLoading}
          onClick={handleManualTrigger}
        >
          手动触发
        </Button>,
      ]}
    >
      <Card
        title="同步状态"
        style={{ marginBottom: 24 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={loadStates}
          >
            刷新
          </Button>
        }
      >
        <Table<API.SyncState>
          rowKey={(r) => `${r.scope}_${r.account_id}`}
          dataSource={states}
          columns={stateColumns}
          loading={statesLoading}
          size="small"
          bordered
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Card
        title="同步日志"
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={loadLogs}
          >
            刷新
          </Button>
        }
      >
        <Space style={{ marginBottom: 12 }} wrap>
          <Select
            allowClear
            placeholder="节点"
            style={{ width: 180 }}
            value={logFilterServer}
            onChange={setLogFilterServer}
            options={syncServers.map((s) => ({
              label: `${s.server_name} (${s.server_id})`,
              value: s.server_id,
            }))}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 110 }}
            value={logFilterStatus}
            onChange={setLogFilterStatus}
            options={[
              { label: '成功', value: 'success' },
              { label: '失败', value: 'failed' },
            ]}
          />
          <Select
            allowClear
            placeholder="Scope"
            style={{ width: 150 }}
            value={logFilterScope}
            onChange={setLogFilterScope}
            options={SCOPE_OPTIONS}
          />
          <RangePicker
            showTime
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setLogFilterRange(dateStrings as [string, string]);
              } else {
                setLogFilterRange(undefined);
              }
            }}
          />
          <Button type="primary" onClick={loadLogs}>
            查询
          </Button>
        </Space>

        <Table<API.SyncLog>
          rowKey="id"
          dataSource={logs}
          columns={logColumns}
          loading={logsLoading}
          size="small"
          bordered
          scroll={{ x: 1100 }}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </PageContainer>
  );
};

export default SyncMonitorPage;
