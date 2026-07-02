import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

/**
 * 日期快捷预设 key 类型。
 * 各页面可按需从 STANDARD_PRESETS / AD_SPEND_PRESETS 中选用，
 * 也可在本地定义自己的 preset item 列表，只要 key 类型兼容即可。
 */
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'previousWeek'
  | 'previousMonth'
  | 'last3Days'
  | 'last7Days'
  | 'last30Days'
  | 'yesterdayToToday'
  | 'last3Months'
  | 'lastYear'
  | 'custom';

export type DatePresetItem = {
  key: DateRangePreset;
  label: string;
  getValue: () => [dayjs.Dayjs, dayjs.Dayjs];
};

/** 今日 / 近三天 / 近一周 / 近一月 —— 用于大多数报表页 */
export const STANDARD_DATE_PRESET_ITEMS: DatePresetItem[] = [
  { key: 'today', label: '今日', getValue: () => [dayjs(), dayjs()] },
  { key: 'yesterday', label: '昨日', getValue: () => [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  {
    key: 'previousWeek',
    label: '上一周',
    getValue: () => {
      const previousWeek = dayjs().subtract(1, 'week');
      return [previousWeek.startOf('isoWeek'), previousWeek.endOf('isoWeek')];
    },
  },
  {
    key: 'previousMonth',
    label: '上一月',
    getValue: () => {
      const previousMonth = dayjs().subtract(1, 'month');
      return [previousMonth.startOf('month'), previousMonth.endOf('month')];
    },
  },
  { key: 'last3Days', label: '近三天', getValue: () => [dayjs().subtract(2, 'day'), dayjs()] },
  { key: 'last7Days', label: '近一周', getValue: () => [dayjs().subtract(6, 'day'), dayjs()] },
  { key: 'last30Days', label: '近一月', getValue: () => [dayjs().subtract(1, 'month'), dayjs()] },
  { key: 'last3Months', label: '近三月', getValue: () => [dayjs().subtract(3, 'month'), dayjs()] },
  { key: 'lastYear', label: '近一年', getValue: () => [dayjs().subtract(1, 'year'), dayjs()] },
];

/**
 * 把 preset item 列表转为 antd RangePicker 的 presets prop 格式。
 * 每次调用时 getValue() 都会以当前时间重算，确保动态性。
 */
export const toRangePickerPresets = (items: DatePresetItem[]) =>
  items.map((item) => ({ label: item.label, value: item.getValue() }));

/**
 * 根据选中的日期范围反查匹配的 preset key。
 * 若命中某个 preset 的当日计算值则返回对应 key，否则返回 'custom'。
 */
export const getPresetByDateRange = (
  items: DatePresetItem[],
  dateRange: [string, string],
): DateRangePreset => {
  const [start, end] = dateRange;
  const found = items.find((item) => {
    const [ps, pe] = item.getValue();
    return ps.format('YYYY-MM-DD') === start && pe.format('YYYY-MM-DD') === end;
  });
  return found?.key ?? 'custom';
};

/**
 * 根据 preset key 重算当前日期范围（返回 [YYYY-MM-DD, YYYY-MM-DD]）。
 * 若 key 为 'custom' 或未找到则返回 undefined，调用方应降级使用存储的固定 dateRange。
 */
export const resolveDateRangeByPreset = (
  items: DatePresetItem[],
  preset?: DateRangePreset,
): [string, string] | undefined => {
  if (!preset || preset === 'custom') return undefined;
  const found = items.find((item) => item.key === preset);
  if (!found) return undefined;
  const [s, e] = found.getValue();
  return [s.format('YYYY-MM-DD'), e.format('YYYY-MM-DD')];
};
