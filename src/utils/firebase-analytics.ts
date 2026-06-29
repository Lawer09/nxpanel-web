import dayjs from 'dayjs';
import type { SortOrder } from 'antd/es/table/interface';
import type {
  NodeDiagnosisStatus,
  NodeSampleScope,
  NodeStatusListItem,
} from '@/services/firebase-analytics/types';

/**
 * 格式化数字，添加千分位
 */
export const formatNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  return num.toLocaleString();
};

/**
 * 格式化字节
 */
export const formatBytes = (bytes: number | undefined) => {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化时长 (ms)
 */
export const formatDuration = (ms: number | undefined) => {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(2)}m`;
  const hours = minutes / 60;
  return `${hours.toFixed(2)}h`;
};

/**
 * 格式化比率 (百分比)
 */
export const formatRate = (rate: number | undefined) => {
  if (rate === undefined || rate === null) return '-';
  return `${(rate * 100).toFixed(2)}%`;
};

/**
 * 格式化百分点击差
 */
export const formatPercentPointGap = (gap: number | undefined) => {
  if (gap === undefined || gap === null) return '-';
  const sign = gap > 0 ? '+' : '';
  return `${sign}${(gap * 100).toFixed(1)} pp`;
};

/**
 * 获取相对昨日的趋势文案和颜色
 */
export const getTrendInfo = (change: number | undefined) => {
  if (change === undefined || change === null) return { text: '-', color: 'default' };
  const isUp = change > 0;
  const absChange = Math.abs(change * 100).toFixed(1);
  return {
    text: `较昨日 ${isUp ? '↑' : '↓'} ${absChange}%`,
    color: isUp ? '#ef4444' : '#16a34a', // 默认上涨红色，下跌绿色，具体逻辑可能随指标变化
    isUp,
  };
};

/**
 * 构建查询对象，移除空值
 */
export const buildQuery = (params: any) => {
  const query: any = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query[key] = params[key];
    }
  });
  return query;
};

export const formatDateTime = (
  value: string | number | Date | dayjs.Dayjs | undefined,
  format = 'YYYY-MM-DD HH:mm:ss',
) => {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return '-';
  return parsed.format(format);
};

export const formatDateTimeShort = (value: string | undefined) =>
  formatDateTime(value, 'MM-DD HH:mm');

export const formatNodeLabel = (item: {
  node_name?: string;
  node_id?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
}) => {
  const title = item.node_name || item.node_id || '-';
  const meta = [item.node_id, item.node_country, item.node_region, item.protocol]
    .filter(Boolean)
    .join(' / ');
  return { title, meta };
};

export const NODE_DIAGNOSIS_META: Record<
  NodeDiagnosisStatus,
  { label: string; color: string; description: string }
> = {
  connect_gap: {
    label: '探测正常但连接偏差',
    color: 'volcano',
    description: '探测成功率正常，但连接成功率明显偏低。',
  },
  probe_only: {
    label: '仅探测未连接',
    color: 'gold',
    description: '只有探测样本，没有真实连接样本。',
  },
  dual_risk: {
    label: '双侧高风险',
    color: 'red',
    description: '探测与连接两侧都进入高风险区间。',
  },
  session_risk: {
    label: '连接侧高风险',
    color: 'magenta',
    description: '连接成功率或连接时延异常。',
  },
  probe_risk: {
    label: '探测侧高风险',
    color: 'orange',
    description: '探测成功率或探测时延异常。',
  },
  session_only: {
    label: '仅连接缺探测',
    color: 'cyan',
    description: '存在连接样本，但缺少探测覆盖。',
  },
  healthy: {
    label: '口径稳定',
    color: 'success',
    description: '探测与连接口径基本一致。',
  },
};

export const NODE_SAMPLE_SCOPE_META: Record<NodeSampleScope, string> = {
  all: '全部',
  probe_only: '仅探测',
  session_only: '仅连接',
  dual: '双侧都有',
};

export const NODE_STATUS_QUICK_FILTERS: Array<{
  key: string;
  label: string;
  diagnosis_status?: NodeDiagnosisStatus;
  sample_scope?: NodeSampleScope;
}> = [
  { key: 'all', label: '全部' },
  { key: 'connect_gap', label: '探测正常但连接偏差', diagnosis_status: 'connect_gap' },
  { key: 'probe_only', label: '仅探测未连接', diagnosis_status: 'probe_only', sample_scope: 'probe_only' },
  { key: 'dual_risk', label: '双侧高风险', diagnosis_status: 'dual_risk' },
  { key: 'session_only', label: '仅连接缺探测', diagnosis_status: 'session_only', sample_scope: 'session_only' },
];

export const getNodeDiagnosisMeta = (status?: NodeDiagnosisStatus) =>
  NODE_DIAGNOSIS_META[status || 'healthy'] || NODE_DIAGNOSIS_META.healthy;

export const getNodeStatusSummary = (items: NodeStatusListItem[]) => {
  const summary = {
    total: items.length,
    abnormalCount: 0,
    probeOnlyCount: 0,
    connectGapCount: 0,
    dualRiskCount: 0,
    sessionOnlyCount: 0,
  };

  items.forEach((item) => {
    if (item.diagnosis_status !== 'healthy') {
      summary.abnormalCount += 1;
    }
    if (item.diagnosis_status === 'probe_only') {
      summary.probeOnlyCount += 1;
    }
    if (item.diagnosis_status === 'connect_gap') {
      summary.connectGapCount += 1;
    }
    if (item.diagnosis_status === 'dual_risk') {
      summary.dualRiskCount += 1;
    }
    if (item.diagnosis_status === 'session_only') {
      summary.sessionOnlyCount += 1;
    }
  });

  return summary;
};

export const toRequestOrder = (order?: SortOrder): 'asc' | 'desc' | undefined => {
  if (order === 'ascend') return 'asc';
  if (order === 'descend') return 'desc';
  return undefined;
};
