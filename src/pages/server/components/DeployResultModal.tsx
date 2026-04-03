import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Badge, Button, Descriptions, Modal, Progress, Space, Table, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getDeployResult } from '@/services/server/api';

const { Text, Paragraph } = Typography;

const POLL_INTERVAL = 2000; // 2s
const TERMINAL_STATUSES: API.DeployTaskStatus[] = ['success', 'failed'];

// ── helpers ─────────────────────────────────────────────────────────────────

const statusTag = (status: API.DeployTaskStatus) => {
  const map: Record<API.DeployTaskStatus, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'default', icon: <ClockCircleOutlined />, label: '等待中' },
    running: { color: 'processing', icon: <LoadingOutlined />, label: '部署中' },
    success: { color: 'success', icon: <CheckCircleOutlined />, label: '成功' },
    failed: { color: 'error', icon: <CloseCircleOutlined />, label: '失败' },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <Tag color={cfg.color} icon={cfg.icon}>
      {cfg.label}
    </Tag>
  );
};

// ── types ────────────────────────────────────────────────────────────────────

export type DeployTarget =
  | { mode: 'single'; task_id: number; server_name?: string }
  | { mode: 'batch'; batch_id: number };

interface Props {
  open: boolean;
  target: DeployTarget | null;
  onClose: () => void;
}

// ── component ────────────────────────────────────────────────────────────────

const DeployResultModal: React.FC<Props> = ({ open, target, onClose }) => {
  const [singleData, setSingleData] = useState<API.DeployResultSingle | null>(null);
  const [batchData, setBatchData] = useState<API.DeployResultBatch | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const isDone = () => {
    if (target?.mode === 'single' && singleData) {
      return TERMINAL_STATUSES.includes(singleData.status);
    }
    if (target?.mode === 'batch' && batchData) {
      const { summary } = batchData;
      return summary.pending === 0 && summary.running === 0;
    }
    return false;
  };

  const fetchResult = async () => {
    if (!target) return;
    try {
      if (target.mode === 'single') {
        const res = await getDeployResult({ task_id: target.task_id });
        if (res.code === 0 && res.data) {
          setSingleData(res.data as API.DeployResultSingle);
        }
      } else {
        const res = await getDeployResult({ batch_id: target.batch_id });
        if (res.code === 0 && res.data) {
          setBatchData(res.data as API.DeployResultBatch);
        }
      }
    } catch {
      // silently ignore poll errors
    }
  };

  const schedulePoll = () => {
    clearTimer();
    timerRef.current = setTimeout(async () => {
      await fetchResult();
      if (!isDone()) {
        schedulePoll();
      }
    }, POLL_INTERVAL);
  };

  // reset & start polling whenever target changes
  useEffect(() => {
    clearTimer();
    setSingleData(null);
    setBatchData(null);

    if (!open || !target) return;

    fetchResult().then(() => {
      // schedule subsequent polls only if not done after first fetch
    });
    schedulePoll();

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.mode === 'single' ? (target as any).task_id : (target as any)?.batch_id]);

  // stop polling when terminal state reached
  useEffect(() => {
    if (isDone()) {
      clearTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleData, batchData]);

  // ── render single ────────────────────────────────────────────────────────

  const renderSingle = () => {
    if (!singleData) {
      return (
        <Space style={{ padding: '24px 0', width: '100%', justifyContent: 'center' }}>
          <LoadingOutlined style={{ fontSize: 24 }} />
          <Text type="secondary">正在获取部署状态…</Text>
        </Space>
      );
    }
    const serverName =
      singleData.server?.name ?? (target as any)?.server_name ?? `节点 #${singleData.server_id}`;
    return (
      <>
        <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="节点">{serverName}</Descriptions.Item>
          <Descriptions.Item label="状态">{statusTag(singleData.status)}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{singleData.started_at ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{singleData.finished_at ?? '-'}</Descriptions.Item>
        </Descriptions>
        {singleData.output && (
          <>
            <Text strong>输出日志</Text>
            <Paragraph
              style={{
                background: '#141414',
                color: '#d9d9d9',
                padding: 12,
                borderRadius: 6,
                maxHeight: 320,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 12,
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {singleData.output}
            </Paragraph>
          </>
        )}
      </>
    );
  };

  // ── render batch ─────────────────────────────────────────────────────────

  const renderBatch = () => {
    if (!batchData) {
      return (
        <Space style={{ padding: '24px 0', width: '100%', justifyContent: 'center' }}>
          <LoadingOutlined style={{ fontSize: 24 }} />
          <Text type="secondary">正在获取批量部署状态…</Text>
        </Space>
      );
    }
    const { summary, tasks } = batchData;
    const successPct = summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0;
    const failedPct = summary.total > 0 ? Math.round((summary.failed / summary.total) * 100) : 0;
    const allDone = summary.pending === 0 && summary.running === 0;

    return (
      <>
        <Space size={16} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Badge count={summary.total} showZero color="blue" overflowCount={999}>
            <Tag>全部</Tag>
          </Badge>
          <Badge count={summary.pending} showZero color="default" overflowCount={999}>
            <Tag>等待中</Tag>
          </Badge>
          <Badge count={summary.running} showZero color="processing" overflowCount={999}>
            <Tag>部署中</Tag>
          </Badge>
          <Badge count={summary.success} showZero color="success" overflowCount={999}>
            <Tag>成功</Tag>
          </Badge>
          <Badge count={summary.failed} showZero color="error" overflowCount={999}>
            <Tag>失败</Tag>
          </Badge>
        </Space>
        <Progress
          percent={successPct + failedPct}
          success={{ percent: successPct }}
          status={allDone ? (summary.failed > 0 ? 'exception' : 'success') : 'active'}
          style={{ marginBottom: 16 }}
        />
        <Table<API.DeployTask>
          rowKey={(r) => String(r.id ?? r.task_id ?? r.server_id)}
          dataSource={tasks}
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          columns={[
            {
              title: '节点',
              render: (_, r) => r.server?.name ?? `#${r.server_id}`,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s: API.DeployTaskStatus) => statusTag(s),
            },
            {
              title: '开始时间',
              dataIndex: 'started_at',
              width: 160,
              render: (v) => v ?? '-',
            },
            {
              title: '完成时间',
              dataIndex: 'finished_at',
              width: 160,
              render: (v) => v ?? '-',
            },
          ]}
          expandable={{
            rowExpandable: (r) => Boolean(r.output),
            expandedRowRender: (r) => (
              <Paragraph
                style={{
                  background: '#141414',
                  color: '#d9d9d9',
                  padding: 10,
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {r.output}
              </Paragraph>
            ),
          }}
        />
      </>
    );
  };

  const title =
    target?.mode === 'single'
      ? `部署进度 — ${(target as any).server_name ?? `任务 #${(target as any).task_id}`}`
      : `批量部署进度`;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Button type="primary" onClick={onClose}>
          关闭
        </Button>
      }
      destroyOnHidden
    >
      {target?.mode === 'single' ? renderSingle() : renderBatch()}
    </Modal>
  );
};

export default DeployResultModal;
