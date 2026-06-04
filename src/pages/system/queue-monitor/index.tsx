import type { ColumnsType } from 'antd/es/table';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  DashboardOutlined,
  FireOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  getHorizonFailedJobs,
  getQueueMasters,
  getQueueStats,
  getQueueWorkload,
  getSendWebhookTasks,
  getSystemStatus,
} from '@/services/system/api';
import './index.less';

const { Paragraph, Text } = Typography;

const AUTO_REFRESH_INTERVAL = 30_000;
const DEFAULT_SAMPLE_LIMIT = 6;
const DEFAULT_FAILED_PAGE_SIZE = 10;
const DEFAULT_WEBHOOK_FAILED_PAGE_SIZE = 10;

const isSuccessResponse = (response: any) => {
  if (!response) return false;
  if (typeof response.code === 'number') {
    return response.code === 0 || response.code === 200;
  }
  if (typeof response.status === 'string') {
    return response.status === 'success' || response.status === 'ok';
  }
  return true;
};

const getResponseData = <T,>(response: any): T | undefined => {
  if (!response) return undefined;
  return (response.data ?? response) as T;
};

const formatDateTime = (value?: string | number | null) => {
  if (value == null || value === '') return '-';
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return formatDateTime(Number(value));
  }
  if (typeof value === 'number') {
    const target = value > 1_000_000_000_000 ? dayjs(value) : dayjs.unix(value);
    return target.isValid() ? target.format('YYYY-MM-DD HH:mm:ss') : String(value);
  }
  const target = dayjs(value);
  return target.isValid() ? target.format('YYYY-MM-DD HH:mm:ss') : String(value);
};

const formatCompactNumber = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '-';
  return new Intl.NumberFormat('zh-CN').format(numeric);
};

const formatWaitSeconds = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '-';
  if (numeric < 1) return `${numeric.toFixed(2)}s`;
  if (numeric < 60) return `${numeric.toFixed(1)}s`;
  const minutes = Math.floor(numeric / 60);
  const seconds = Math.round(numeric % 60);
  return `${minutes}m ${seconds}s`;
};

const statusTag = (healthy: boolean, healthyText = '正常', unhealthyText = '异常') => (
  <span className={classNames('healthTag', healthy ? 'healthy' : 'unhealthy')}>
    {healthy ? <CheckCircleFilled /> : <CloseCircleFilled />}
    {healthy ? healthyText : unhealthyText}
  </span>
);

const queueRiskTag = (value: number) => {
  if (value <= 0) return <Tag color="success">0</Tag>;
  if (value < 5) return <Tag color="warning">{value}</Tag>;
  return <Tag color="error">{value}</Tag>;
};

const extractHotQueueLabel = (value: string | Record<string, any> | null | undefined) => {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  return value.name || value.queue || value.label || JSON.stringify(value);
};

const normalizeWaitItems = (
  wait: API.QueueStatsResponse['wait'] | undefined,
): Array<{ queue: string; wait: number }> => {
  if (!wait) return [];
  if (Array.isArray(wait)) {
    return wait
      .map((item, index) => {
        const queue = String(item.name || item.queue || item.key || `queue_${index + 1}`);
        const waitValue = Number(item.wait ?? item.value ?? 0);
        return { queue, wait: Number.isFinite(waitValue) ? waitValue : 0 };
      })
      .sort((a, b) => b.wait - a.wait);
  }

  return Object.entries(wait)
    .map(([queue, value]) => ({ queue, wait: Number(value ?? 0) }))
    .sort((a, b) => b.wait - a.wait);
};

const normalizeWorkload = (value: any): API.QueueWorkloadItem[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([name, item]: [string, any]) => ({
      name,
      length: Number(item?.length ?? item?.size ?? item?.pending ?? 0),
      wait: Number(item?.wait ?? 0),
      processes: Number(item?.processes ?? item?.workers ?? 0),
      ...item,
    }));
  }
  return [];
};

const normalizeMasters = (value: any): API.QueueMasterSupervisor[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.masters)) return value.masters;
  if (value && typeof value === 'object') {
    return Object.values(value).filter((item) => !!item && typeof item === 'object');
  }
  return [];
};

const getSupervisorCount = (record: API.QueueMasterSupervisor) =>
  Array.isArray(record.supervisors) ? record.supervisors.length : 0;

const getQueueRecommendations = (data?: API.SendWebhookTasksResponse) => {
  if (!data) return [];
  const summary = data.summary;
  const items: string[] = [];

  if ((summary.pendingCount ?? 0) > 0) {
    items.push('pending 持续堆积时，优先检查 send_webhook 队列消费者是否存活。');
  }
  if ((summary.delayedCount ?? 0) > 0) {
    items.push('delayed 中有任务通常表示 webhook 仍在延迟合并窗口，短时间内属于正常现象。');
  }
  if ((summary.reservedCount ?? 0) > 0) {
    items.push('reserved 长时间不释放时，通常意味着 worker 执行超时或确认失败。');
  }
  if ((summary.failedCount ?? 0) > 0) {
    items.push('failed 已出现异常，建议先看失败记录中的 exceptionSummary 与 payload 摘要。');
  }
  if (!items.length) {
    items.push('send_webhook 队列当前没有明显积压或失败，整体处于健康状态。');
  }

  return items;
};

const webhookSampleColumns: ColumnsType<API.QueueRedisJobSample> = [
  {
    title: 'UUID',
    dataIndex: 'uuid',
    width: 220,
    render: (value) =>
      value ? (
        <Text copyable={{ text: value }} ellipsis style={{ maxWidth: 200 }}>
          {value}
        </Text>
      ) : (
        '-'
      ),
  },
  {
    title: '任务类',
    dataIndex: 'displayName',
    width: 220,
    ellipsis: true,
  },
  {
    title: '尝试次数',
    dataIndex: 'attempts',
    width: 90,
    align: 'right',
    render: (value) => value ?? 0,
  },
  {
    title: '最大重试',
    dataIndex: 'maxTries',
    width: 90,
    align: 'right',
    render: (value) => value ?? '-',
  },
  {
    title: '执行器',
    dataIndex: 'job',
    width: 220,
    ellipsis: true,
  },
  {
    title: 'Payload 摘要',
    dataIndex: 'rawPayload',
    ellipsis: true,
    render: (value) =>
      value ? (
        <Tooltip title={value}>
          <span>{value}</span>
        </Tooltip>
      ) : (
        <Text type="secondary">-</Text>
      ),
  },
];

const QueueMonitorPage: React.FC = () => {
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>();
  const [warningText, setWarningText] = useState<string>();

  const [systemStatus, setSystemStatus] = useState<API.SystemStatusResponse>();
  const [queueStats, setQueueStats] = useState<API.QueueStatsResponse>();
  const [queueWorkload, setQueueWorkload] = useState<API.QueueWorkloadItem[]>([]);
  const [queueMasters, setQueueMasters] = useState<API.QueueMasterSupervisor[]>([]);
  const [failedJobs, setFailedJobs] = useState<API.HorizonFailedJob[]>([]);
  const [failedJobsTotal, setFailedJobsTotal] = useState(0);
  const [failedPage, setFailedPage] = useState(1);
  const [failedPageSize, setFailedPageSize] = useState(DEFAULT_FAILED_PAGE_SIZE);

  const [webhookData, setWebhookData] = useState<API.SendWebhookTasksResponse>();
  const [sampleLimit, setSampleLimit] = useState(DEFAULT_SAMPLE_LIMIT);
  const [webhookFailedPage, setWebhookFailedPage] = useState(1);
  const [webhookFailedPageSize, setWebhookFailedPageSize] = useState(
    DEFAULT_WEBHOOK_FAILED_PAGE_SIZE,
  );

  const waitItems = normalizeWaitItems(queueStats?.wait);
  const queueRecommendations = getQueueRecommendations(webhookData);
  const horizonHealthy =
    queueStats?.status ?? webhookData?.summary?.horizon ?? systemStatus?.horizon ?? false;
  const scheduleHealthy = systemStatus?.schedule ?? false;
  const webhookHealthy =
    horizonHealthy &&
    (webhookData?.summary?.pendingCount ?? 0) === 0 &&
    (webhookData?.summary?.reservedCount ?? 0) === 0 &&
    (webhookData?.summary?.failedCount ?? 0) === 0;

  const loadDashboard = async (silent = false) => {
    setLoading(true);
    setWarningText(undefined);

    const results = await Promise.allSettled([
      getSystemStatus(),
      getQueueStats(),
      getQueueWorkload(),
      getQueueMasters(),
      getHorizonFailedJobs({ page: failedPage, pageSize: failedPageSize }),
      getSendWebhookTasks({
        sampleLimit,
        failedPage: webhookFailedPage,
        failedPageSize: webhookFailedPageSize,
      }),
    ]);

    let failedCount = 0;

    const handleFailure = () => {
      failedCount += 1;
    };

    const [systemStatusRes, queueStatsRes, queueWorkloadRes, queueMastersRes, failedJobsRes, webhookRes] =
      results;

    if (systemStatusRes.status === 'fulfilled' && isSuccessResponse(systemStatusRes.value)) {
      setSystemStatus(getResponseData<API.SystemStatusResponse>(systemStatusRes.value));
    } else {
      handleFailure();
    }

    if (queueStatsRes.status === 'fulfilled' && isSuccessResponse(queueStatsRes.value)) {
      setQueueStats(getResponseData<API.QueueStatsResponse>(queueStatsRes.value));
    } else {
      handleFailure();
    }

    if (queueWorkloadRes.status === 'fulfilled' && isSuccessResponse(queueWorkloadRes.value)) {
      const payload = getResponseData<any>(queueWorkloadRes.value);
      setQueueWorkload(normalizeWorkload(payload));
    } else {
      handleFailure();
    }

    if (queueMastersRes.status === 'fulfilled' && isSuccessResponse(queueMastersRes.value)) {
      const payload = getResponseData<any>(queueMastersRes.value);
      setQueueMasters(normalizeMasters(payload));
    } else {
      handleFailure();
    }

    if (failedJobsRes.status === 'fulfilled' && isSuccessResponse(failedJobsRes.value)) {
      const payload = getResponseData<API.PageResult<API.HorizonFailedJob>>(failedJobsRes.value);
      setFailedJobs(payload?.data ?? []);
      setFailedJobsTotal(payload?.total ?? 0);
    } else {
      handleFailure();
    }

    if (webhookRes.status === 'fulfilled' && isSuccessResponse(webhookRes.value)) {
      setWebhookData(getResponseData<API.SendWebhookTasksResponse>(webhookRes.value));
    } else {
      handleFailure();
    }

    if (failedCount > 0) {
      const nextWarning = `有 ${failedCount} 组监控数据未成功加载，页面已保留可用数据。`;
      setWarningText(nextWarning);
      if (!silent) {
        messageApi.warning(nextWarning);
      }
    }

    setLastUpdatedAt(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    setLoading(false);
  };

  useEffect(() => {
    void loadDashboard(true);
  }, [failedPage, failedPageSize, sampleLimit, webhookFailedPage, webhookFailedPageSize]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => {
      void loadDashboard(true);
    }, AUTO_REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [
    autoRefresh,
    failedPage,
    failedPageSize,
    sampleLimit,
    webhookFailedPage,
    webhookFailedPageSize,
  ]);

  const failedJobColumns: ColumnsType<API.HorizonFailedJob> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 90,
    },
    {
      title: '队列',
      dataIndex: 'queue',
      width: 140,
      render: (value) => <Tag>{value || '-'}</Tag>,
    },
    {
      title: '任务类',
      key: 'displayName',
      width: 240,
      ellipsis: true,
      render: (_, record) => record.displayName || record.name || '-',
    },
    {
      title: '尝试次数',
      dataIndex: 'attempts',
      width: 90,
      align: 'right',
      render: (value) => value ?? '-',
    },
    {
      title: '失败时间',
      key: 'failedTime',
      width: 180,
      render: (_, record) => formatDateTime(record.failedAt || record.failed_at),
    },
    {
      title: '异常摘要',
      key: 'exception',
      ellipsis: true,
      render: (_, record) => {
        const text = record.exceptionSummary || record.exception || '-';
        return (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        );
      },
    },
  ];

  const webhookFailedColumns: ColumnsType<API.SendWebhookFailedJob> = [
    {
      title: '失败 ID',
      dataIndex: 'id',
      width: 90,
    },
    {
      title: '任务类',
      dataIndex: 'displayName',
      width: 220,
      ellipsis: true,
    },
    {
      title: '尝试次数',
      dataIndex: 'attempts',
      width: 90,
      align: 'right',
    },
    {
      title: '失败时间',
      dataIndex: 'failedAt',
      width: 180,
      render: (value) => formatDateTime(value),
    },
    {
      title: '异常摘要',
      dataIndex: 'exceptionSummary',
      ellipsis: true,
      render: (value) => (
        <Tooltip title={value}>
          <span>{value || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Payload 摘要',
      key: 'payload',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        const text = record.payload?.rawPayload || record.payload?.commandName || '-';
        return (
          <Tooltip title={typeof text === 'string' ? text : JSON.stringify(text)}>
            <span>{typeof text === 'string' ? text : JSON.stringify(text)}</span>
          </Tooltip>
        );
      },
    },
  ];

  const workloadColumns: ColumnsType<API.QueueWorkloadItem> = [
    {
      title: '队列',
      dataIndex: 'name',
      width: 220,
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: '积压长度',
      dataIndex: 'length',
      width: 120,
      align: 'right',
      render: (value) => formatCompactNumber(value),
    },
    {
      title: '等待时间',
      dataIndex: 'wait',
      width: 140,
      render: (value) => {
        const numeric = Number(value ?? 0);
        const color = numeric >= 60 ? 'error' : numeric >= 15 ? 'warning' : 'success';
        return <Tag color={color}>{formatWaitSeconds(numeric)}</Tag>;
      },
    },
    {
      title: 'Worker 进程',
      dataIndex: 'processes',
      width: 120,
      align: 'right',
      render: (value) => formatCompactNumber(value),
    },
  ];

  const masterColumns: ColumnsType<API.QueueMasterSupervisor> = [
    {
      title: 'Master',
      dataIndex: 'name',
      width: 200,
      render: (value) => <Text strong>{value || '-'}</Text>,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: 'PID',
      dataIndex: 'pid',
      width: 100,
      render: (value) => value ?? '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => {
        const lower = String(value || '').toLowerCase();
        const color = lower.includes('running')
          ? 'success'
          : lower.includes('paused')
            ? 'warning'
            : lower.includes('inactive')
              ? 'default'
              : 'processing';
        return <Tag color={color}>{value || '-'}</Tag>;
      },
    },
    {
      title: 'Supervisor 数',
      key: 'supervisors',
      width: 120,
      align: 'right',
      render: (_, record) => getSupervisorCount(record),
    },
  ];

  return (
    <PageContainer
      title="任务队列监控"
      content="集中观察调度器、Horizon 队列负载、失败任务和 send_webhook 专项异常，便于快速定位积压与通知未送达问题。"
      extra={[
        <Space key="controls" size="middle">
          <Space size={6}>
            <Text type="secondary">自动刷新</Text>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
          </Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => void loadDashboard(false)}
          >
            立即刷新
          </Button>
        </Space>,
      ]}
    >
      <div className="queueMonitorPage">
        <section className="queueHero">
          <div className="queueHeroContent">
            <div>
              <div className="eyebrow">System / Queue Control</div>
              <div className="heroTitle">Horizon 与调度链路健康状态</div>
              <div className="heroDesc">
                最近刷新时间：{lastUpdatedAt ?? '-'}，自动轮询间隔 30 秒。
              </div>
            </div>
            <div className="statusPills">
              <div className="statusPill">
                <span>调度器</span>
                {statusTag(scheduleHealthy)}
              </div>
              <div className="statusPill">
                <span>Horizon</span>
                {statusTag(horizonHealthy)}
              </div>
              <div className="statusPill">
                <span>Webhook 队列</span>
                {statusTag(webhookHealthy, '平稳', '需排查')}
              </div>
            </div>
          </div>
          <div className="queueHeroStats">
            <div className="heroStat">
              <div className="heroStatLabel">Worker 进程</div>
              <div className="heroStatValue">{formatCompactNumber(queueStats?.processes)}</div>
            </div>
            <div className="heroStat">
              <div className="heroStatLabel">每分钟处理量</div>
              <div className="heroStatValue">
                {formatCompactNumber(queueStats?.jobsPerMinute)}
              </div>
            </div>
            <div className="heroStat">
              <div className="heroStatLabel">最近失败任务</div>
              <div className="heroStatValue danger">
                {formatCompactNumber(queueStats?.failedJobs)}
              </div>
            </div>
            <div className="heroStat">
              <div className="heroStatLabel">调度心跳</div>
              <div className="heroStatValue small">
                {formatDateTime(systemStatus?.schedule_last_runtime)}
              </div>
            </div>
          </div>
        </section>

        {warningText ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={warningText}
          />
        ) : null}

        <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
          <Col xs={24} md={12} xl={6}>
            <Card variant="borderless" className="summaryCard">
              <Statistic
                title="最近任务量"
                value={queueStats?.recentJobs ?? 0}
                prefix={<ThunderboltOutlined />}
              />
              <div className="summaryHint">
                recentJobs 保留窗口：{queueStats?.periods?.recentJobs ?? '-'}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card variant="borderless" className="summaryCard">
              <Statistic
                title="失败任务量"
                value={queueStats?.failedJobs ?? 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: (queueStats?.failedJobs ?? 0) > 0 ? '#cf1322' : undefined }}
              />
              <div className="summaryHint">
                failedJobs 保留窗口：{queueStats?.periods?.failedJobs ?? '-'}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card variant="borderless" className="summaryCard">
              <Statistic
                title="运行时间最高队列"
                value={extractHotQueueLabel(queueStats?.queueWithMaxRuntime)}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: 22 }}
              />
              <div className="summaryHint">用于快速发现慢任务热点</div>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card variant="borderless" className="summaryCard">
              <Statistic
                title="吞吐最高队列"
                value={extractHotQueueLabel(queueStats?.queueWithMaxThroughput)}
                prefix={<FireOutlined />}
                valueStyle={{ fontSize: 22 }}
              />
              <div className="summaryHint">
                paused masters：{formatCompactNumber(queueStats?.pausedMasters)}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
          <Col xs={24} xl={8}>
            <Card
              title="系统链路状态"
              variant="borderless"
              className="panelCard"
              extra={<DashboardOutlined />}
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="调度器状态">
                  {statusTag(scheduleHealthy, '最近 120 秒内有心跳', '最近 120 秒内无心跳')}
                </Descriptions.Item>
                <Descriptions.Item label="Horizon 状态">
                  {statusTag(horizonHealthy, '运行中', '不可用或已暂停')}
                </Descriptions.Item>
                <Descriptions.Item label="最近心跳">
                  {formatDateTime(systemStatus?.schedule_last_runtime)}
                </Descriptions.Item>
                <Descriptions.Item label="Webhook 队列专项">
                  {statusTag(webhookHealthy, '未见明显积压', '存在积压或失败')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card title="等待时间快照" variant="borderless" className="panelCard">
              {waitItems.length ? (
                <div className="waitList">
                  {waitItems.slice(0, 6).map((item) => (
                    <div key={item.queue} className="waitItem">
                      <div className="waitQueue">
                        <Text code>{item.queue}</Text>
                      </div>
                      <div className="waitMeta">
                        <span>{formatWaitSeconds(item.wait)}</span>
                        {item.wait >= 60 ? (
                          <Tag color="error">高</Tag>
                        ) : item.wait >= 15 ? (
                          <Tag color="warning">中</Tag>
                        ) : (
                          <Tag color="success">低</Tag>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无等待快照" />
              )}
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card title="send_webhook 排查建议" variant="borderless" className="panelCard">
              <div className="recommendationList">
                {queueRecommendations.map((item) => (
                  <div key={item} className="recommendationItem">
                    <WarningOutlined />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
          <Col xs={24} xl={14}>
            <Card
              title="队列负载"
              variant="borderless"
              className="panelCard"
              extra={<Text type="secondary">Horizon workload 原始摘要</Text>}
            >
              <Table<API.QueueWorkloadItem>
                rowKey={(record) => record.name}
                columns={workloadColumns}
                dataSource={queueWorkload}
                loading={loading}
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无 workload 数据' }}
                scroll={{ x: 760 }}
              />
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card
              title="Master Supervisor"
              variant="borderless"
              className="panelCard"
              extra={<Text type="secondary">共 {queueMasters.length} 个</Text>}
            >
              <Table<API.QueueMasterSupervisor>
                rowKey={(record, index) => record.name || String(index)}
                columns={masterColumns}
                dataSource={queueMasters}
                loading={loading}
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无 master supervisor 数据' }}
                scroll={{ x: 680 }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="send_webhook 专项诊断"
          variant="borderless"
          className="panelCard webhookPanel"
          extra={
            <Space size="middle">
              <Text type="secondary">
                样本数：
                <a
                  onClick={() => setSampleLimit(5)}
                  style={{ marginLeft: 6, marginRight: 8 }}
                >
                  5
                </a>
                <a
                  onClick={() => setSampleLimit(10)}
                  style={{ marginRight: 8 }}
                >
                  10
                </a>
                <a onClick={() => setSampleLimit(20)}>20</a>
              </Text>
              <Text type="secondary">
                当前：<Text strong>{webhookData?.queue ?? 'send_webhook'}</Text>
              </Text>
            </Space>
          }
        >
          <div className="webhookSummary">
            <div className="webhookMetric">
              <div className="metricLabel">Pending</div>
              <div className="metricValue">{queueRiskTag(webhookData?.summary?.pendingCount ?? 0)}</div>
              <div className="metricHint">待消费队列长度</div>
            </div>
            <div className="webhookMetric">
              <div className="metricLabel">Delayed</div>
              <div className="metricValue">{queueRiskTag(webhookData?.summary?.delayedCount ?? 0)}</div>
              <div className="metricHint">延迟窗口内任务</div>
            </div>
            <div className="webhookMetric">
              <div className="metricLabel">Reserved</div>
              <div className="metricValue">{queueRiskTag(webhookData?.summary?.reservedCount ?? 0)}</div>
              <div className="metricHint">已取出未确认</div>
            </div>
            <div className="webhookMetric">
              <div className="metricLabel">Failed</div>
              <div className="metricValue">{queueRiskTag(webhookData?.summary?.failedCount ?? 0)}</div>
              <div className="metricHint">failed_jobs 记录数</div>
            </div>
          </div>

          <Descriptions column={3} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Redis 前缀">
              <Text code>{webhookData?.summary?.redisPrefix ?? '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Pending Key">
              <Text code>{webhookData?.summary?.keys?.pending ?? '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Delayed Key">
              <Text code>{webhookData?.summary?.keys?.delayed ?? '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Reserved Key" span={2}>
              <Text code>{webhookData?.summary?.keys?.reserved ?? '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Horizon">
              {statusTag(webhookData?.summary?.horizon ?? false)}
            </Descriptions.Item>
          </Descriptions>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={12}>
              <Card
                size="small"
                title="Pending 样本"
                variant="borderless"
                styles={{ body: { padding: 0 } }}
              >
                <Table<API.QueueRedisJobSample>
                  rowKey={(record, index) => record.uuid || `pending_${index}`}
                  columns={[
                    ...webhookSampleColumns,
                    {
                      title: '顺序',
                      dataIndex: 'position',
                      width: 90,
                      align: 'right',
                      render: (value) => value ?? '-',
                    },
                  ]}
                  dataSource={webhookData?.pendingJobs ?? []}
                  size="small"
                  pagination={false}
                  locale={{ emptyText: '暂无 pending 样本' }}
                  scroll={{ x: 960 }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                size="small"
                title="Delayed 样本"
                variant="borderless"
                styles={{ body: { padding: 0 } }}
              >
                <Table<API.QueueRedisJobSample>
                  rowKey={(record, index) => record.uuid || `delayed_${index}`}
                  columns={[
                    ...webhookSampleColumns,
                    {
                      title: '可执行时间',
                      dataIndex: 'available_at',
                      width: 180,
                      render: (value) => formatDateTime(value),
                    },
                  ]}
                  dataSource={webhookData?.delayedJobs ?? []}
                  size="small"
                  pagination={false}
                  locale={{ emptyText: '暂无 delayed 样本' }}
                  scroll={{ x: 1040 }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                size="small"
                title="Reserved 样本"
                variant="borderless"
                styles={{ body: { padding: 0 } }}
              >
                <Table<API.QueueRedisJobSample>
                  rowKey={(record, index) => record.uuid || `reserved_${index}`}
                  columns={[
                    ...webhookSampleColumns,
                    {
                      title: '保留时间',
                      dataIndex: 'reserved_at',
                      width: 180,
                      render: (value) => formatDateTime(value),
                    },
                  ]}
                  dataSource={webhookData?.reservedJobs ?? []}
                  size="small"
                  pagination={false}
                  locale={{ emptyText: '暂无 reserved 样本' }}
                  scroll={{ x: 1040 }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                size="small"
                title="Webhook 失败记录"
                variant="borderless"
                styles={{ body: { padding: 0 } }}
              >
                <Table<API.SendWebhookFailedJob>
                  rowKey="id"
                  columns={webhookFailedColumns}
                  dataSource={webhookData?.failedJobs?.data ?? []}
                  size="small"
                  locale={{ emptyText: '暂无 webhook 失败记录' }}
                  scroll={{ x: 980 }}
                  pagination={{
                    current: webhookFailedPage,
                    pageSize: webhookFailedPageSize,
                    total: webhookData?.failedJobs?.total ?? 0,
                    showSizeChanger: true,
                    onChange: (page, pageSize) => {
                      setWebhookFailedPage(page);
                      setWebhookFailedPageSize(pageSize);
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card
          title="Horizon 失败任务列表"
          variant="borderless"
          className="panelCard"
          extra={<Text type="secondary">用于观察全局失败任务趋势</Text>}
        >
          <Table<API.HorizonFailedJob>
            rowKey={(record) => String(record.id)}
            columns={failedJobColumns}
            dataSource={failedJobs}
            loading={loading}
            size="small"
            scroll={{ x: 980 }}
            locale={{ emptyText: '暂无全局失败任务' }}
            pagination={{
              current: failedPage,
              pageSize: failedPageSize,
              total: failedJobsTotal,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setFailedPage(page);
                setFailedPageSize(pageSize);
              },
            }}
          />
        </Card>

        {webhookData?.summary?.workload?.length ? (
          <Card
            title="send_webhook 命中 workload"
            variant="borderless"
            className="panelCard"
            extra={<Text type="secondary">仅展示与 send_webhook 匹配的队列项</Text>}
          >
            <Table<API.QueueWorkloadItem>
              rowKey={(record) => record.name}
              columns={workloadColumns}
              dataSource={webhookData.summary.workload}
              size="small"
              pagination={false}
              scroll={{ x: 760 }}
            />
          </Card>
        ) : null}

        <Card
          title="Payload 诊断提示"
          variant="borderless"
          className="panelCard"
          style={{ marginTop: 16 }}
        >
          <Paragraph style={{ marginBottom: 8 }}>
            `rawPayload` 为原始任务 payload 截断摘要，适合先看目标任务是否已正确入队；如果需要进一步排查，可以结合 `exceptionSummary`
            与后端日志定位目标地址、HTTP 状态码或超时原因。
          </Paragraph>
          <Paragraph style={{ marginBottom: 0 }}>
            当 `pending` 长期不降、`reserved` 长时间不释放、`failed` 快速增长时，优先检查对应 worker 存活状态、重试策略和 webhook
            目标端稳定性。
          </Paragraph>
        </Card>
      </div>
    </PageContainer>
  );
};

export default QueueMonitorPage;
