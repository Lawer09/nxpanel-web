import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Modal,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useRef, useState } from 'react';
import { getSyncStates, getSyncLogs, triggerSyncJob, testSyncServer } from '@/services/ad/api';

const { Text } = Typography;

const SCOPE_OPTIONS = [
  { label: 'accountMeta', value: 'accountMeta' },
  { label: 'apps', value: 'apps' },
  { label: 'adUnits', value: 'adUnits' },
  { label: 'revenueDaily', value: 'revenueDaily' },
];

const STATUS_COLORS: Record<string, string> = {
  success: 'green',
  running: 'blue',
  failed: 'red',
  pending: 'default',
};

interface Props {
  open: boolean;
  server: API.SyncServer | null;
  onClose: () => void;
}

const SyncDetailDrawer: React.FC<Props> = ({ open, server, onClose }) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const logActionRef = useRef<ActionType>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<API.TestSyncResult | null>(null);
  const [testResultOpen, setTestResultOpen] = useState(false);

  // ── 同步状态（简单表格） ──
  const [states, setStates] = useState<API.SyncState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesTotal, setStatesTotal] = useState(0);
  const [statesPage, setStatesPage] = useState(1);

  const loadStates = async () => {
    if (!server) return;
    setStatesLoading(true);
    try {
      const res = await getSyncStates({
        serverId: server.serverId,
        page: statesPage,
        pageSize: 10,
      });
      if (res.code === 0 && res.data) {
        setStates(res.data.data ?? []);
        setStatesTotal(res.data.total ?? 0);
      }
    } finally {
      setStatesLoading(false);
    }
  };

  useEffect(() => {
    if (open && server) {
      setStatesPage(1);
      setTestResult(null);
      // 延迟一帧让 ProTable 挂载后再 reload
      setTimeout(() => logActionRef.current?.reload(), 0);
    }
  }, [open, server?.serverId]);

  const handleTestSync = async () => {
    if (!server) return;
    setTestLoading(true);
    try {
      const res = await testSyncServer(server.serverId);
      if (res.code === 0 && res.data) {
        setTestResult(res.data);
        setTestResultOpen(true);
      } else {
        messageApi.error(res.msg || '测试失败');
      }
    } catch {
      messageApi.error('请求失败');
    } finally {
      setTestLoading(false);
    }
  };

  useEffect(() => {
    if (open && server) loadStates();
  }, [open, server?.serverId, statesPage]);

  const handleRetry = (record: API.SyncState) => {
    modalApi.confirm({
      title: '确认重试同步任务？',
      content: `Scope: ${record.syncScope}，Account: ${record.accountId}`,
      onOk: async () => {
        const res = await triggerSyncJob({
          scope: record.syncScope,
          accountIds: [record.accountId],
          assignedServerId: server?.serverId,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '触发失败');
          return;
        }
        messageApi.success('已触发重试');
        loadStates();
      },
    });
  };

  const stateColumns: ColumnsType<API.SyncState> = [
    { title: 'Scope', dataIndex: 'syncScope', width: 130 },
    { title: '账号 ID', dataIndex: 'accountId', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '最后成功',
      dataIndex: 'lastSuccessAt',
      width: 160,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '最后错误',
      dataIndex: 'lastErrorMessage',
      ellipsis: true,
      render: (v) =>
        v ? <Text type="danger">{v}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, record) =>
        record.status === 'failed' ? (
          <a onClick={() => handleRetry(record)}>重试</a>
        ) : null,
    },
  ];

  const logColumns: ProColumns<API.SyncLog>[] = [
    {
      title: 'Scope',
      dataIndex: 'syncScope',
      width: 120,
      valueType: 'select',
      fieldProps: { options: SCOPE_OPTIONS },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      fieldProps: {
        options: [
          { label: '待处理', value: 'pending' },
          { label: '运行中', value: 'running' },
          { label: '成功', value: 'success' },
          { label: '失败', value: 'failed' },
        ],
      },
      render: (_, record) => (
        <Tag color={STATUS_COLORS[record.status] || 'default'}>{record.status}</Tag>
      ),
    },
    {
      title: '行数',
      dataIndex: 'rowCount',
      width: 70,
      align: 'right',
      search: false,
    },
    {
      title: '开始时间',
      dataIndex: 'startedFrom',
      valueType: 'dateRange',
      width: 160,
      render: (_, record) => record.startedAt || <Text type="secondary">-</Text>,
      search: {
        transform: (value) => ({
          startedFrom: value[0],
          startedTo: value[1],
        }),
      },
    },
    {
      title: '结束时间',
      dataIndex: 'endedAt',
      width: 160,
      search: false,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      ellipsis: true,
      search: false,
      render: (v) =>
        v ? <Text type="danger">{String(v)}</Text> : <Text type="secondary">-</Text>,
    },
  ];

  return (
    <Drawer
      title={server ? `${server.serverName}（${server.serverId}）同步详情` : '同步详情'}
      open={open}
      onClose={onClose}
      width={900}
      destroyOnHidden
      extra={
        <Button type="primary" loading={testLoading} onClick={handleTestSync}>
          运行测试
        </Button>
      }
    >
      {/* 同步状态 */}
      {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 15 }}>同步状态</Text>
        <Button icon={<ReloadOutlined />} size="small" onClick={loadStates}>
          刷新
        </Button>
      </div> */}
      {/* <Table<API.SyncState>
        rowKey="id"
        dataSource={states}
        columns={stateColumns}
        loading={statesLoading}
        size="small"
        bordered
        pagination={{
          current: statesPage,
          pageSize: 10,
          total: statesTotal,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p) => setStatesPage(p),
        }}
        style={{ marginBottom: 24 }}
      /> */}

      {/* 同步日志 ProTable */}
      <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>同步日志</Text>
      <ProTable<API.SyncLog>
        actionRef={logActionRef}
        rowKey="id"
        columns={logColumns}
        size="small"
        bordered
        scroll={{ x: 800 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          span: 8,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        request={async (params) => {
          if (!server) return { data: [], total: 0, success: true };
          const { current, pageSize, status, scope, startedFrom, startedTo } = params;
          const res = await getSyncLogs({
            serverId: server.serverId,
            status: status || undefined,
            scope: scope || undefined,
            startedFrom: startedFrom || undefined,
            startedTo: startedTo || undefined,
            page: current,
            pageSize,
          });
          if (res.code === 0 && res.data) {
            return {
              data: res.data.data ?? [],
              total: res.data.total ?? 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
        options={{ reload: true, density: false }}
        dateFormatter="string"
      />

      <Modal
        title="同步测试结果"
        open={testResultOpen}
        onCancel={() => setTestResultOpen(false)}
        footer={null}
        width={640}
      >
        {testResult && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="请求 URL">{testResult.url}</Descriptions.Item>
            <Descriptions.Item label="HTTP 状态码">
              <Tag color={testResult.httpStatus >= 200 && testResult.httpStatus < 300 ? 'green' : 'red'}>
                {testResult.httpStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="响应内容">
              <pre style={{ margin: 0, maxHeight: 300, overflow: 'auto', fontSize: 12 }}>
                {typeof testResult.body === 'string'
                  ? testResult.body
                  : JSON.stringify(testResult.body, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Drawer>
  );
};

export default SyncDetailDrawer;
