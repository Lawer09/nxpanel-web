import dayjs from 'dayjs';

export const formatTrafficDateTime = (value?: string | null) => {
  if (!value) return '-';
  const base = dayjs(value);
  if (!base.isValid()) return value;
  const plus8 = new Date(base.valueOf() + 8 * 60 * 60 * 1000);
  const year = plus8.getUTCFullYear();
  const day = String(plus8.getUTCDate()).padStart(2, '0');
  const month = String(plus8.getUTCMonth() + 1).padStart(2, '0');
  const hour = String(plus8.getUTCHours()).padStart(2, '0');
  const minute = String(plus8.getUTCMinutes()).padStart(2, '0');
  const second = String(plus8.getUTCSeconds()).padStart(2, '0');
  return `${year}-${day}-${month} ${hour}:${minute}:${second}`;
};
