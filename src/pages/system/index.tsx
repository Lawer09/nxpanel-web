import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getAuditLog,
  getHorizonFailedJobs,
  getQueueMasters,
  getQueueStats,
  getQueueWorkload,
  getSystemStatus,
} from '@/services/system/api';

const { Paragraph, Text, Title } = Typography;

const formatBoolean = (value: boolean) =>
  value ? <Tag color="success">正常</Tag> : <Tag color="error">异常</Tag>;

const formatTimestamp = (value?: number | null) =>
  value ? new Date(value * 1000).toLocaleString() : '未记录';

const SystemPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeKey, setActiveKey] = useState<string>('status');

  const [status, setStatus] = useState<API.SystemStatusResponse | null>(null);
  const [stats, setStats] = useState<API.QueueStatsResponse | null>(null);
  const [workload, setWorkload] = useState<API.QueueWorkloadItem[]>([]);
  const [masters, setMasters] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [failedLoading, setFailedLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  const [failedJobs, setFailedJobs] = useState<API.HorizonFailedJob[]>([]);
  const [failedTotal, setFailedTotal] = useState(0);
  const [failedPage, setFailedPage] = useState({ page: 1, pageSize: 20 });

  const [auditData, setAuditData] = useState<API.AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditParams, setAuditParams] = useState<{
    page: number;
    pageSize: number;
    action?: string;
    admin_id?: number;
    keyword?: string;
  }>({ page: 1, pageSize: 10 });

  const [auditForm] = Form.useForm();

  const loadSystemStatus = async () => {
    setLoading(true);
    try {
      const res = await getSystemStatus();
      if (res.code !== 0) {
        message.error(res.msg || '获取系统状态失败');
        return;
      }
      setStatus(res.data || null);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStats = async () => {
    setLoading(true);
    try {
      const res = await getQueueStats();
      if (res.code !== 0) {
        message.error(res.msg || '获取队列统计失败');
        return;
      }
      setStats(res.data || null);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkload = async () => {
    setLoading(true);
    try {
      const res = await getQueueWorkload();
      if (res.code !== 0) {
        message.error(res.msg || '获取队列工作负载失败');
        return;
      }
      setWorkload(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadMasters = async () => {
    setLoading(true);
    try {
      const res = await getQueueMasters();
      if (res.code !== 0) {
        message.error(res.msg || '获取 Master Supervisor 失败');
        return;
      }
      setMasters(res.data || null);
    } finally {
      setLoading(false);
    }
  };

  const loadFailedJobs = async (page = failedPage.page, pageSize = failedPage.pageSize) => {
    setFailedLoading(true);
    try {
      const res = await getHorizonFailedJobs({ page, pageSize });
      if (res.code !== 0) {
        message.error(res.msg || '获取失败任务列表失败');
        return;
      }
      setFailedJobs(res.data?.data || []);
      setFailedTotal(res.data?.total ?? 0);
      setFailedPage({ page: res.data?.page ?? page, pageSize: res.data?.pageSize ?? pageSize });
    } finally {
      setFailedLoading(false);
    }
  };

  const loadAuditLog = async (params = auditParams) => {
    setAuditLoading(true);
    try {
      const res = await getAuditLog(params);
      if (res.code !== 0) {
        message.error(res.msg || '获取审计日志失败');
        return;
      }
      setAuditData(res.data?.data || []);
      setAuditTotal(res.data?.total ?? 0);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    switch (activeKey) {
      case 'status':
        loadSystemStatus();
        break;
      case 'queueStats':
        loadQueueStats();
        break;
      case 'workload':
        loadWorkload();
        break;
      case 'masters':
        loadMasters();
        break;
      case 'failedJobs':
        loadFailedJobs();
        break;
      default:
        break;
    }
  }, [activeKey]);

  useEffect(() => {
    if (activeKey === 'auditLog') {
      loadAuditLog(auditParams);
    }
  }, [activeKey, auditParams]);

  const masterColumns = useMemo(() => {
    if (!Array.isArray(masters) || masters.length === 0) {
      return [];
    }
    const firstItem = masters[0];
    if (typeof firstItem !== 'object' || firstItem == null) {
      return [];
    }
    return Object.keys(firstItem).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      render: (value: any) =>
        typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-'),
    }));
  }, [masters]);

  return (
    <PageContainer title="系统状态监控">
      <Tabs activeKey={activeKey} onChange={(key) => setActiveKey(key)}>
        <Tabs.TabPane key="status" tab="系统状态">
          <Card loading={loading}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="定时任务运行状态">
                {status ? formatBoolean(status.schedule) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Horizon 队列运行状态">
                {status ? formatBoolean(status.horizon) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="定时任务最后执行时间">
                {status ? formatTimestamp(status.schedule_last_runtime) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane key="queueStats" tab="队列统计">
          <Card loading={loading}>
            {stats ? (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="最近失败任务数">
                  {stats.failedJobs}
                </Descriptions.Item>
                <Descriptions.Item label="每分钟处理任务数">
                  {stats.jobsPerMinute}
                </Descriptions.Item>
                <Descriptions.Item label="暂停的 Master Supervisor 数量">
                  {stats.pausedMasters}
                </Descriptions.Item>
                <Descriptions.Item label="失败任务保留时间（分钟）">
                  {stats.periods.failedJobs}
                </Descriptions.Item>
                <Descriptions.Item label="最近任务保留时间（分钟）">
                  {stats.periods.recentJobs}
                </Descriptions.Item>
                <Descriptions.Item label="总 Worker 进程数">
                  {stats.processes}
                </Descriptions.Item>
                <Descriptions.Item label="最长运行时间队列">
                  {stats.queueWithMaxRuntime}
                </Descriptions.Item>
                <Descriptions.Item label="最大吞吐量队列">
                  {stats.queueWithMaxThroughput}
                </Descriptions.Item>
                <Descriptions.Item label="最近处理任务数">
                  {stats.recentJobs}
                </Descriptions.Item>
                <Descriptions.Item label="Horizon 运行状态">
                  {formatBoolean(stats.status)}
                </Descriptions.Item>
                <Descriptions.Item label="各队列等待时间（秒）">
                  <Paragraph code>{JSON.stringify(stats.wait || {})}</Paragraph>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">暂无数据</Text>
            )}
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane key="workload" tab="队列负载">
          <Card loading={loading}>
            <Table<API.QueueWorkloadItem>
              rowKey="name"
              dataSource={workload}
              pagination={false}
              columns={[
                { title: '队列名', dataIndex: 'name', key: 'name' },
                { title: '队列长度', dataIndex: 'length', key: 'length' },
                { title: '等待时间（秒）', dataIndex: 'wait', key: 'wait' },
                { title: '进程数', dataIndex: 'processes', key: 'processes' },
              ]}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane key="masters" tab="Master Supervisor">
          <Card loading={loading}>
            {Array.isArray(masters) ? (
              <Table<any>
                rowKey={(record) => record?.name || record?.id || JSON.stringify(record)}
                dataSource={masters}
                pagination={false}
                columns={masterColumns}
              />
            ) : (
              <pre>{JSON.stringify(masters, null, 2)}</pre>
            )}
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane key="failedJobs" tab="失败任务">
          <Card>
            <Table<API.HorizonFailedJob>
              rowKey="id"
              loading={failedLoading}
              dataSource={failedJobs}
              pagination={{
                current: failedPage.page,
                pageSize: failedPage.pageSize,
                total: failedTotal,
                showSizeChanger: true,
                onChange: (page, pageSize) => loadFailedJobs(page, pageSize),
              }}
              columns={[
                { title: '任务 ID', dataIndex: 'id', key: 'id' },
                { title: '连接', dataIndex: 'connection', key: 'connection' },
                { title: '队列', dataIndex: 'queue', key: 'queue' },
                { title: '任务名', dataIndex: 'name', key: 'name' },
                { title: '失败时间', dataIndex: 'failed_at', key: 'failed_at' },
                {
                  title: '异常信息',
                  dataIndex: 'exception',
                  key: 'exception',
                  render: (value) => (
                    <Paragraph ellipsis={{ rows: 3, tooltip: value }}>{value}</Paragraph>
                  ),
                },
              ]}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane key="auditLog" tab="审计日志">
          <Card>
            <Form
              form={auditForm}
              layout="inline"
              initialValues={{
                action: auditParams.action,
                admin_id: auditParams.admin_id,
                keyword: auditParams.keyword,
              }}
              onFinish={(values) => {
                setAuditParams({
                  page: 1,
                  pageSize: auditParams.pageSize,
                  action: values.action,
                  admin_id: values.admin_id,
                  keyword: values.keyword,
                });
              }}
            >
              <Form.Item label="操作类型" name="action">
                <Input placeholder="POST/GET/..." allowClear />
              </Form.Item>
              <Form.Item label="管理员 ID" name="admin_id">
                <InputNumber placeholder="管理员 ID" style={{ width: 140 }} />
              </Form.Item>
              <Form.Item label="关键词" name="keyword">
                <Input placeholder="URI 或请求数据" allowClear />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    查询
                  </Button>
                  <Button
                    onClick={() => {
                      auditForm.resetFields();
                      setAuditParams({ page: 1, pageSize: auditParams.pageSize });
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
            <Table<API.AuditLogItem>
              rowKey="id"
              loading={auditLoading}
              dataSource={auditData}
              pagination={{
                current: auditParams.page,
                pageSize: auditParams.pageSize,
                total: auditTotal,
                showSizeChanger: true,
                onChange: (page, pageSize) => {
                  const next = {
                    ...auditParams,
                    page: page,
                    pageSize: pageSize,
                  };
                  setAuditParams(next);
                },
              }}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: '管理员 ID', dataIndex: 'admin_id', key: 'admin_id' },
                { title: '操作', dataIndex: 'action', key: 'action' },
                { title: 'URI', dataIndex: 'uri', key: 'uri' },
                {
                  title: '请求数据',
                  dataIndex: 'request_data',
                  key: 'request_data',
                  render: (value) => (
                    <Paragraph ellipsis={{ rows: 2, tooltip: value }}>{value}</Paragraph>
                  ),
                },
                { title: 'IP', dataIndex: 'ip', key: 'ip' },
                {
                  title: '创建时间',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (value) => (value ? new Date(value * 1000).toLocaleString() : '-'),
                },
                {
                  title: '管理员信息',
                  dataIndex: ['admin', 'email'],
                  key: 'admin',
                  render: (_value, record) =>
                    record.admin ? `${record.admin.email}(${record.admin.id})` : '-',
                },
              ]}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default SystemPage;
