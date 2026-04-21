import { Descriptions, Modal, Progress, Space, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatBandwidth(bytesPerSec: number): string {
  const mbps = (bytesPerSec * 8) / 1_000_000;
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(2)} Gbps`;
  if (mbps >= 1) return `${mbps.toFixed(2)} Mbps`;
  const kbps = (bytesPerSec * 8) / 1000;
  return `${kbps.toFixed(1)} Kbps`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时 ${m}分`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
}

function percentColor(pct: number): string {
  if (pct >= 90) return '#ff4d4f';
  if (pct >= 70) return '#faad14';
  return '#52c41a';
}

function formatTimestamp(ts?: number) {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
}

interface NodeStatusModalProps {
  open: boolean;
  node?: API.ServerNode;
  onClose: () => void;
}

const NodeStatusModal: React.FC<NodeStatusModalProps> = ({ open, node, onClose }) => {
  const ls = node?.load_status;
  const mt = node?.metrics;

  const cpuPct = ls?.cpu ?? 0;
  const memPct = ls?.mem ? ((ls.mem.used / ls.mem.total) * 100) : 0;
  const diskPct = ls?.disk ? ((ls.disk.used / ls.disk.total) * 100) : 0;
  const swapPct = ls?.swap?.total ? ((ls.swap.used / ls.swap.total) * 100) : 0;

  return (
    <Modal
      title={`节点状态 — ${node?.name || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
        {/* ── 负载状态 ── */}
        <Descriptions.Item label="CPU" span={2}>
          <Progress
            percent={Number(cpuPct.toFixed(1))}
            strokeColor={percentColor(cpuPct)}
            size="small"
            style={{ width: 200, display: 'inline-flex', marginRight: 8 }}
          />
          <Text>{cpuPct.toFixed(1)}%</Text>
        </Descriptions.Item>

        <Descriptions.Item label="内存" span={2}>
          <Progress
            percent={Number(memPct.toFixed(1))}
            strokeColor={percentColor(memPct)}
            size="small"
            style={{ width: 200, display: 'inline-flex', marginRight: 8 }}
          />
          <Text>
            {formatBytes(ls?.mem?.used ?? 0)} / {formatBytes(ls?.mem?.total ?? 0)}
          </Text>
        </Descriptions.Item>

        <Descriptions.Item label="磁盘" span={2}>
          <Progress
            percent={Number(diskPct.toFixed(1))}
            strokeColor={percentColor(diskPct)}
            size="small"
            style={{ width: 200, display: 'inline-flex', marginRight: 8 }}
          />
          <Text>
            {formatBytes(ls?.disk?.used ?? 0)} / {formatBytes(ls?.disk?.total ?? 0)}
          </Text>
        </Descriptions.Item>

        {ls?.swap?.total ? (
          <Descriptions.Item label="Swap" span={2}>
            <Progress
              percent={Number(swapPct.toFixed(1))}
              strokeColor={percentColor(swapPct)}
              size="small"
              style={{ width: 200, display: 'inline-flex', marginRight: 8 }}
            />
            <Text>
              {formatBytes(ls.swap.used)} / {formatBytes(ls.swap.total)}
            </Text>
          </Descriptions.Item>
        ) : null}

        <Descriptions.Item label="负载上报时间" span={2}>
          {formatTimestamp(ls?.updated_at)}
        </Descriptions.Item>
      </Descriptions>

      {mt && (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="入站带宽">
            <Tag color="blue">{formatBandwidth(mt.inbound_speed)}</Tag>
            <Text type="secondary">({formatBytes(mt.inbound_speed)}/s)</Text>
          </Descriptions.Item>
          <Descriptions.Item label="出站带宽">
            <Tag color="green">{formatBandwidth(mt.outbound_speed)}</Tag>
            <Text type="secondary">({formatBytes(mt.outbound_speed)}/s)</Text>
          </Descriptions.Item>

          <Descriptions.Item label="运行时长">{formatUptime(mt.uptime)}</Descriptions.Item>
          <Descriptions.Item label="Goroutines">{mt.goroutines}</Descriptions.Item>

          <Descriptions.Item label="总用户">{mt.total_users}</Descriptions.Item>
          <Descriptions.Item label="活跃用户">{mt.active_users}</Descriptions.Item>

          <Descriptions.Item label="系统负载" span={2}>
            <Space>
              {(mt.load || []).map((v, i) => (
                <Tag key={i}>{v.toFixed(2)}</Tag>
              ))}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="每核 CPU" span={2}>
            <Space wrap>
              {(mt.cpu_per_core || []).map((v, i) => (
                <Tag key={i} color={percentColor(v)}>
                  核{i}: {v.toFixed(1)}%
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="指标上报时间" span={2}>
            {formatTimestamp(mt.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      )}

      {!ls && !mt && <Text type="secondary">暂无负载数据</Text>}
    </Modal>
  );
};

export default NodeStatusModal;

/* ── 内联摘要组件（用于表格列） ──────────────────────────────────────────── */

function bandwidthTag(bytesPerSec: number): React.ReactNode {
  const mbps = (bytesPerSec * 8) / 1_000_000;
  const label = formatBandwidth(bytesPerSec);
  if (mbps >= 100) return <Tag color="error">{label}</Tag>;
  if (mbps >= 10) return <Tag color="warning">{label}</Tag>;
  return <Tag color="default">{label}</Tag>;
}

export const NodeStatusSummary: React.FC<{ node: API.ServerNode }> = ({ node }) => {
  const ls = node.load_status;
  const mt = node.metrics;

  if (!ls && !mt) return <Text type="secondary">-</Text>;

  const cpuPct = ls?.cpu ?? 0;
  const memPct = ls?.mem ? ((ls.mem.used / ls.mem.total) * 100) : 0;

  return (
    <Space size={4} wrap>
      {ls && (
        <>
          <Tag color={percentColor(cpuPct)}>C:{cpuPct.toFixed(0)}%</Tag>
          <Tag color={percentColor(memPct)}>M:{memPct.toFixed(0)}%</Tag>
        </>
      )}
      {mt && (
        <>
          {bandwidthTag(mt.inbound_speed + mt.outbound_speed)}
        </>
      )}
    </Space>
  );
};
