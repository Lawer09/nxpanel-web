import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 将后端返回的 ISO 时间字符串 (如 2026-05-15T08:46:23.000000Z)
 * 转换为 UTC+8 (Asia/Shanghai) 的指定格式字符串。
 * 
 * @param dateStr 后端返回的 ISO 时间字符串
 * @param format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串，如果解析失败或为空则返回 '-'
 */
export function formatUTC8(dateStr?: string | null, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!dateStr) return '-';
  const d = dayjs(dateStr);
  if (!d.isValid()) return '-';
  // 转换为东八区时间并格式化
  return d.tz('Asia/Shanghai').format(format);
}
