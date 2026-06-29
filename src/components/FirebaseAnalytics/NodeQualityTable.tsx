import React, { useState, useEffect } from 'react';
import { Column } from '@ant-design/charts';
import { Alert, Card, Col, Row, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getNodeQualityRank, getVpnProbeNodeStats } from '@/services/firebase-analytics/api';
import type {
  FirebaseAnalyticsFilter,
  NodeQualityRankItem,
  ProbeNodeStatsItem,
} from '@/services/firebase-analytics/types';
import {
  formatBytes,
  formatDuration,
  formatNumber,
  formatPercentPointGap,
  formatRate,
} from '@/utils/firebase-analytics';

export interface NodeQualityTableProps {
  filters: FirebaseAnalyticsFilter;
}

type DiagnosticStatus =
  | 'connect_gap'
  | 'probe_only'
  | 'dual_risk'
  | 'session_risk'
  | 'probe_risk'
  | 'session_only'
  | 'healthy';

interface NodeDiagnosticRow {
  key: string;
  node_id: string;
  node_name: string;
  node_country: string;
  node_region: string;
  protocol: string;
  session_count: number;
  session_success_count: number;
  session_success_rate?: number;
  avg_connect_ms?: number;
  p95_connect_ms?: number;
  avg_duration_ms?: number;
  total_bytes?: number;
  session_top_error_code?: string;
  probe_test_count: number;
  probe_success_count: number;
  probe_fail_count: number;
  probe_success_rate?: number;
  avg_latency_ms?: number;
  p95_latency_ms?: number;
  avg_tcp_connect_ms?: number;
  avg_tls_hk_ms?: number;
  avg_proxy_hk_ms?: number;
  probe_top_error_code?: string;
  last_received_at?: string;
  status: DiagnosticStatus;
  statusLabel: string;
  statusColor: string;
  diagnosticHint: string;
  priority: number;
  rateGap?: number;
}

const PROBE_GOOD_THRESHOLD = 0.9;
const PROBE_ALERT_THRESHOLD = 0.85;
const SESSION_ALERT_THRESHOLD = 0.85;
const SUCCESS_RATE_GAP_THRESHOLD = 0.12;
const PROBE_P95_ALERT_MS = 800;
const SESSION_P95_ALERT_MS = 3000;

const DIAGNOSTIC_META: Record<
  DiagnosticStatus,
  { label: string; color: string; priority: number; hint: string }
> = {
  connect_gap: {
    label: '探测正常但连接偏差',
    color: 'volcano',
    priority: 1,
    hint: '优先排查握手、鉴权、协议配置和入口稳定性。',
  },
  probe_only: {
    label: '仅探测未连接',
    color: 'gold',
    priority: 2,
    hint: '优先检查节点是否进入可连接候选池，以及分流/曝光是否不足。',
  },
  dual_risk: {
    label: '探测与连接双侧风险',
    color: 'red',
    priority: 3,
    hint: '先看底层链路质量，再核对节点协议与出入口配置。',
  },
  session_risk: {
    label: '连接侧风险',
    color: 'magenta',
    priority: 4,
    hint: '关注连接成功率、P95 连接耗时和真实会话失败路径。',
  },
  probe_risk: {
    label: '探测侧风险',
    color: 'orange',
    priority: 5,
    hint: '关注探测超时、延迟抖动与区域链路质量。',
  },
  session_only: {
    label: '连接有样本但缺少探测',
    color: 'cyan',
    priority: 6,
    hint: '建议补齐探测覆盖，避免只能依赖真实流量被动发现问题。',
  },
  healthy: {
    label: '口径稳定',
    color: 'success',
    priority: 7,
    hint: '探测与连接口径基本一致，可继续观察趋势变化。',
  },
};

const getNodeKey = (record: {
  node_id?: string;
  protocol?: string;
  node_name?: string;
  node_country?: string;
}) => {
  const primary = record.node_id || record.node_name || 'unknown-node';
  return `${primary}__${record.protocol || 'unknown-protocol'}__${record.node_country || 'unknown-country'}`;
};

const toShortNodeLabel = (record: { node_name?: string; node_id?: string }) => {
  const base = record.node_name || record.node_id || '未知节点';
  return base.length > 16 ? `${base.slice(0, 16)}…` : base;
};

const buildDiagnosticMeta = (row: {
  probe_test_count: number;
  probe_success_rate?: number;
  p95_latency_ms?: number;
  session_count: number;
  session_success_rate?: number;
  p95_connect_ms?: number;
  rateGap?: number;
}) => {
  const probeRisk =
    row.probe_test_count > 0 &&
    ((row.probe_success_rate ?? 1) < PROBE_ALERT_THRESHOLD ||
      (row.p95_latency_ms ?? 0) > PROBE_P95_ALERT_MS);
  const sessionRisk =
    row.session_count > 0 &&
    ((row.session_success_rate ?? 1) < SESSION_ALERT_THRESHOLD ||
      (row.p95_connect_ms ?? 0) > SESSION_P95_ALERT_MS);
  const hasGap =
    row.probe_test_count > 0 &&
    row.session_count > 0 &&
    (row.probe_success_rate ?? 0) >= PROBE_GOOD_THRESHOLD &&
    (row.rateGap ?? 0) >= SUCCESS_RATE_GAP_THRESHOLD;

  let status: DiagnosticStatus = 'healthy';

  if (hasGap) {
    status = 'connect_gap';
  } else if (row.probe_test_count > 0 && row.session_count === 0) {
    status = 'probe_only';
  } else if (row.session_count > 0 && row.probe_test_count === 0) {
    status = 'session_only';
  } else if (probeRisk && sessionRisk) {
    status = 'dual_risk';
  } else if (sessionRisk) {
    status = 'session_risk';
  } else if (probeRisk) {
    status = 'probe_risk';
  }

  return {
    status,
    ...DIAGNOSTIC_META[status],
  };
};

const NodeQualityTable: React.FC<NodeQualityTableProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [sessionData, setSessionData] = useState<NodeQualityRankItem[]>([]);
  const [probeData, setProbeData] = useState<ProbeNodeStatsItem[]>([]);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [sessionRes, probeRes] = await Promise.all([
          getNodeQualityRank({
            ...filters,
            source: 'session',
            limit: 200,
          }),
          getVpnProbeNodeStats({
            ...filters,
            page: 1,
            page_size: 200,
            sort_by: 'last_received_at',
            order: 'desc',
          }),
        ]);

        if (!active) {
          return;
        }

        setSessionData(sessionRes.data?.items || []);
        setProbeData(probeRes.data?.items || []);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [filters]);

  const probeMap = new Map(probeData.map((item) => [getNodeKey(item), item]));
  const sessionMap = new Map(sessionData.map((item) => [getNodeKey(item), item]));
  const mergedKeys = Array.from(new Set([...probeMap.keys(), ...sessionMap.keys()]));

  const diagnosticRows: NodeDiagnosticRow[] = mergedKeys
    .map((key) => {
      const probe = probeMap.get(key);
      const session = sessionMap.get(key);
      const rateGap =
        probe?.success_rate != null && session?.success_rate != null
          ? probe.success_rate - session.success_rate
          : undefined;
      const diagnosticMeta = buildDiagnosticMeta({
        probe_test_count: probe?.test_count || 0,
        probe_success_rate: probe?.success_rate,
        p95_latency_ms: probe?.p95_latency_ms,
        session_count: session?.session_count || 0,
        session_success_rate: session?.success_rate,
        p95_connect_ms: session?.p95_connect_ms,
        rateGap,
      });

      return {
        key,
        node_id: session?.node_id || probe?.node_id || '-',
        node_name: session?.node_name || probe?.node_name || '-',
        node_country: session?.node_country || probe?.node_country || '-',
        node_region: session?.node_region || probe?.node_region || '-',
        protocol: session?.protocol || probe?.protocol || '-',
        session_count: session?.session_count || 0,
        session_success_count: session?.success_count || 0,
        session_success_rate: session?.success_rate,
        avg_connect_ms: session?.avg_connect_ms,
        p95_connect_ms: session?.p95_connect_ms,
        avg_duration_ms: session?.avg_duration_ms,
        total_bytes: session?.total_bytes,
        session_top_error_code: session?.top_error_code,
        probe_test_count: probe?.test_count || 0,
        probe_success_count: probe?.success_count || 0,
        probe_fail_count: probe?.fail_count || 0,
        probe_success_rate: probe?.success_rate,
        avg_latency_ms: probe?.avg_latency_ms,
        p95_latency_ms: probe?.p95_latency_ms,
        avg_tcp_connect_ms: probe?.avg_tcp_connect_ms,
        avg_tls_hk_ms: probe?.avg_tls_hk_ms,
        avg_proxy_hk_ms: probe?.avg_proxy_hk_ms,
        probe_top_error_code: probe?.top_error_code,
        last_received_at: probe?.last_received_at,
        rateGap,
        status: diagnosticMeta.status,
        statusLabel: diagnosticMeta.label,
        statusColor: diagnosticMeta.color,
        diagnosticHint: diagnosticMeta.hint,
        priority: diagnosticMeta.priority,
      };
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      if ((b.rateGap ?? 0) !== (a.rateGap ?? 0)) {
        return (b.rateGap ?? 0) - (a.rateGap ?? 0);
      }

      if (b.probe_test_count !== a.probe_test_count) {
        return b.probe_test_count - a.probe_test_count;
      }

      return b.session_count - a.session_count;
    });

  const probeOnlyCount = diagnosticRows.filter((item) => item.status === 'probe_only').length;
  const connectGapCount = diagnosticRows.filter((item) => item.status === 'connect_gap').length;
  const highRiskCount = diagnosticRows.filter((item) =>
    ['dual_risk', 'session_risk', 'probe_risk'].includes(item.status),
  ).length;
  const sessionOnlyCount = diagnosticRows.filter((item) => item.status === 'session_only').length;

  const abnormalRows = diagnosticRows.filter((item) => item.status !== 'healthy');
  const focusRows = (abnormalRows.length > 0 ? abnormalRows : diagnosticRows).slice(0, 8);
  const focusChartData = focusRows.flatMap((item) => [
    {
      node: toShortNodeLabel(item),
      metric: '探测成功率',
      value:
        item.probe_success_rate != null ? Number((item.probe_success_rate * 100).toFixed(2)) : 0,
      sampleLabel: item.probe_test_count > 0 ? `${formatNumber(item.probe_test_count)} 次探测` : '无探测样本',
      statusLabel: item.statusLabel,
    },
    {
      node: toShortNodeLabel(item),
      metric: '连接成功率',
      value:
        item.session_success_rate != null ? Number((item.session_success_rate * 100).toFixed(2)) : 0,
      sampleLabel: item.session_count > 0 ? `${formatNumber(item.session_count)} 次连接` : '无连接样本',
      statusLabel: item.statusLabel,
    },
  ]);

  const diagnosticColumns: ColumnsType<NodeDiagnosticRow> = [
    {
      title: '诊断',
      dataIndex: 'statusLabel',
      key: 'statusLabel',
      width: 180,
      render: (_value, record) => <Tag color={record.statusColor}>{record.statusLabel}</Tag>,
    },
    {
      title: '节点',
      dataIndex: 'node_name',
      key: 'node_name',
      width: 220,
      render: (_value, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{record.node_name || record.node_id}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {record.node_id}
            {record.node_country && record.node_country !== '-' ? ` · ${record.node_country}` : ''}
            {record.protocol && record.protocol !== '-' ? ` · ${record.protocol}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: '探测成功率',
      dataIndex: 'probe_success_rate',
      key: 'probe_success_rate',
      align: 'right',
      render: (value) => formatRate(value),
    },
    {
      title: '连接成功率',
      dataIndex: 'session_success_rate',
      key: 'session_success_rate',
      align: 'right',
      render: (value) => formatRate(value),
    },
    {
      title: '成功率落差',
      dataIndex: 'rateGap',
      key: 'rateGap',
      align: 'right',
      render: (value: number | undefined) => {
        const color = value != null && value >= SUCCESS_RATE_GAP_THRESHOLD ? '#dc2626' : undefined;
        return <span style={{ color }}>{formatPercentPointGap(value)}</span>;
      },
    },
    {
      title: '探测 / 连接样本',
      key: 'sample_count',
      width: 180,
      render: (_value, record) => `${formatNumber(record.probe_test_count)} / ${formatNumber(record.session_count)}`,
    },
    {
      title: '探测延迟',
      key: 'probe_latency',
      width: 180,
      render: (_value, record) =>
        `${formatDuration(record.avg_latency_ms)} / ${formatDuration(record.p95_latency_ms)}`,
    },
    {
      title: '连接耗时',
      key: 'connect_latency',
      width: 180,
      render: (_value, record) =>
        `${formatDuration(record.avg_connect_ms)} / ${formatDuration(record.p95_connect_ms)}`,
    },
    {
      title: '最近探测',
      dataIndex: 'last_received_at',
      key: 'last_received_at',
      width: 150,
      render: (value) => (value ? dayjs(value).format('MM-DD HH:mm') : '-'),
    },
    {
      title: '排查建议',
      dataIndex: 'diagnosticHint',
      key: 'diagnosticHint',
      width: 260,
      ellipsis: true,
    },
  ];

  const sessionColumns: ColumnsType<NodeQualityRankItem> = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60 },
    { title: '节点 ID', dataIndex: 'node_id', key: 'node_id' },
    { title: '节点名称', dataIndex: 'node_name', key: 'node_name', ellipsis: true },
    { title: '国家/地区', dataIndex: 'node_country', key: 'node_country' },
    { title: '协议', dataIndex: 'protocol', key: 'protocol' },
    { 
      title: '连接次数', 
      dataIndex: 'session_count', 
      key: 'session_count', 
      align: 'right' as const, 
      sorter: (a: any, b: any) => a.session_count - b.session_count 
    },
    { 
      title: '成功率', 
      dataIndex: 'success_rate', 
      key: 'success_rate', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.success_rate - b.success_rate,
      render: (val: number) => {
        const color = val != null && val < 0.9 ? '#ef4444' : 'inherit';
        return <span style={{ color }}>{formatRate(val)}</span>;
      }
    },
    { 
      title: '平均连接耗时', 
      dataIndex: 'avg_connect_ms', 
      key: 'avg_connect_ms', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.avg_connect_ms - b.avg_connect_ms,
      render: (val: number) => formatDuration(val)
    },
    { 
      title: 'P95 连接耗时', 
      dataIndex: 'p95_connect_ms', 
      key: 'p95_connect_ms', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.p95_connect_ms - b.p95_connect_ms,
      render: (val: number) => {
        const color = val != null && val > 3000 ? '#ef4444' : 'inherit';
        return <span style={{ color }}>{formatDuration(val)}</span>;
      }
    },
    { 
      title: '平均使用时长', 
      dataIndex: 'avg_duration_ms', 
      key: 'avg_duration_ms', 
      align: 'right' as const, 
      render: (val: number) => formatDuration(val) 
    },
    { 
      title: '总流量', 
      dataIndex: 'total_bytes', 
      key: 'total_bytes', 
      align: 'right' as const, 
      sorter: (a: any, b: any) => a.total_bytes - b.total_bytes, 
      render: (val: number) => formatBytes(val) 
    },
    { title: '主要错误', dataIndex: 'top_error_code', key: 'top_error_code', ellipsis: true },
  ];

  const probeColumns: ColumnsType<ProbeNodeStatsItem> = [
    { title: '节点 ID', dataIndex: 'node_id', key: 'node_id' },
    { title: '节点名称', dataIndex: 'node_name', key: 'node_name', ellipsis: true },
    { title: '国家/地区', dataIndex: 'node_country', key: 'node_country' },
    { title: '协议', dataIndex: 'protocol', key: 'protocol' },
    {
      title: '探测次数',
      dataIndex: 'test_count',
      key: 'test_count',
      align: 'right',
      render: (value: number) => formatNumber(value),
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      align: 'right',
      render: (value: number) => formatRate(value),
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_latency_ms',
      key: 'avg_latency_ms',
      align: 'right',
      render: (value: number) => formatDuration(value),
    },
    {
      title: 'P95 延迟',
      dataIndex: 'p95_latency_ms',
      key: 'p95_latency_ms',
      align: 'right',
      render: (value: number) => formatDuration(value),
    },
    {
      title: 'TCP 耗时',
      dataIndex: 'avg_tcp_connect_ms',
      key: 'avg_tcp_connect_ms',
      align: 'right',
      render: (value: number) => formatDuration(value),
    },
    {
      title: 'TLS 耗时',
      dataIndex: 'avg_tls_hk_ms',
      key: 'avg_tls_hk_ms',
      align: 'right',
      render: (value: number) => formatDuration(value),
    },
    {
      title: '代理握手耗时',
      dataIndex: 'avg_proxy_hk_ms',
      key: 'avg_proxy_hk_ms',
      align: 'right',
      render: (value: number) => formatDuration(value),
    },
    {
      title: '最近探测',
      dataIndex: 'last_received_at',
      key: 'last_received_at',
      render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    { title: '主要错误', dataIndex: 'top_error_code', key: 'top_error_code', ellipsis: true },
  ];

  return (
    <Card
      title="节点质量诊断"
      loading={loading && sessionData.length === 0 && probeData.length === 0}
      variant="borderless"
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      }}
      styles={{ body: { padding: '16px 20px 20px' } }}
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        对照节点探测样本与真实连接样本，优先暴露“仅探测未连接”“探测正常但连接偏差”和“双侧高风险”节点。
      </Typography.Paragraph>

      <Alert
        showIcon
        type={probeOnlyCount + connectGapCount + highRiskCount > 0 ? 'warning' : 'success'}
        style={{ marginBottom: 16 }}
        message={
          probeOnlyCount + connectGapCount + highRiskCount > 0
            ? `当前筛选下发现 ${probeOnlyCount} 个仅探测节点、${connectGapCount} 个探测正常但连接偏差节点，以及 ${highRiskCount} 个高风险节点。`
            : '当前筛选下未发现明显的探测/连接偏差，节点质量口径基本稳定。'
        }
        description={
          sessionOnlyCount > 0
            ? `另有 ${sessionOnlyCount} 个连接节点缺少探测覆盖，建议后续补齐探测样本，避免只能依赖真实流量被动发现问题。`
            : '建议先从诊断列表中查看成功率落差和探测/连接样本覆盖，再决定进入会话错误或探测结果明细继续排查。'
        }
      />

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#f8fafc' }}>
            <Statistic title="探测节点数" value={probeData.length} suffix="个" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              当前筛选下有探测样本的节点
            </Typography.Text>
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fff7ed' }}>
            <Statistic title="仅探测节点" value={probeOnlyCount} suffix="个" valueStyle={{ color: '#d97706' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              有延迟探测，但没有真实连接样本
            </Typography.Text>
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fff1f2' }}>
            <Statistic title="连接偏差节点" value={connectGapCount} suffix="个" valueStyle={{ color: '#dc2626' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              探测成功率较高，但真实连接成功率明显更低
            </Typography.Text>
          </div>
        </Col>
        <Col xl={6} sm={12} xs={24}>
          <div style={{ borderRadius: 12, padding: 16, background: '#fdf2f8' }}>
            <Statistic title="高风险节点" value={highRiskCount} suffix="个" valueStyle={{ color: '#be123c' }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              至少一侧成功率或 P95 耗时触发阈值
            </Typography.Text>
          </div>
        </Col>
      </Row>

      <div style={{ marginBottom: 8, fontWeight: 600, color: '#111827' }}>重点节点成功率对照</div>
      <div style={{ marginBottom: 16 }}>
        {focusChartData.length > 0 ? (
          <Column
            data={focusChartData}
            xField="node"
            yField="value"
            seriesField="metric"
            isGroup
            height={280}
            color={['#0ea5e9', '#f97316']}
            legend={{ position: 'top-right' }}
            meta={{ value: { alias: '成功率 (%)', min: 0, max: 100 } }}
            xAxis={{ label: { autoHide: true, autoRotate: false } }}
            yAxis={{ label: { formatter: (value: string) => `${value}%` } }}
            tooltip={{
              formatter: (datum: any) => ({
                name: `${datum.metric}（${datum.sampleLabel}）`,
                value: `${datum.value.toFixed(2)}%`,
              }),
            }}
          />
        ) : (
          <div
            style={{
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              borderRadius: 12,
              color: '#9ca3af',
            }}
          >
            当前筛选下暂无可对照的节点样本
          </div>
        )}
      </div>

      <Tabs
        items={[
          {
            key: 'diagnostics',
            label: `诊断列表 (${diagnosticRows.length})`,
            children: (
              <Table
                size="small"
                dataSource={diagnosticRows}
                columns={diagnosticColumns}
                loading={loading}
                rowKey={(record) => record.key}
                pagination={{ pageSize: 8 }}
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'session',
            label: `连接排行 (${sessionData.length})`,
            children: (
              <Table
                size="small"
                dataSource={sessionData}
                columns={sessionColumns}
                loading={loading}
                rowKey={(record) => getNodeKey(record)}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            ),
          },
          {
            key: 'probe',
            label: `探测统计 (${probeData.length})`,
            children: (
              <Table
                size="small"
                dataSource={probeData}
                columns={probeColumns}
                loading={loading}
                rowKey={(record) => getNodeKey(record)}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};

export default NodeQualityTable;
