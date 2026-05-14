import dayjs from 'dayjs';

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
