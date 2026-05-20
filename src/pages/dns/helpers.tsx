import { Tag } from 'antd';
import React from 'react';

export const IP_V4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const parseTags = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const pickArray = <T,>(source: unknown): { found: boolean; list: T[] } => {
  if (Array.isArray(source)) {
    return { found: true, list: source as T[] };
  }
  if (!source || typeof source !== 'object') {
    return { found: false, list: [] };
  }
  const obj = source as Record<string, unknown>;
  for (const key of ['data', 'list', 'items', 'rows']) {
    if (Array.isArray(obj[key])) {
      return { found: true, list: obj[key] as T[] };
    }
  }
  return { found: false, list: [] };
};

const readNumber = (source: unknown, key: string, fallback = 0): number => {
  if (!source || typeof source !== 'object') {
    return fallback;
  }
  const n = Number((source as Record<string, unknown>)[key]);
  return Number.isFinite(n) ? n : fallback;
};

export const parsePagePayload = <T,>(
  payload: unknown,
  fallbackPage = 1,
  fallbackPageSize = 20,
) => {
  const nodes = [payload, (payload as Record<string, unknown> | undefined)?.data];
  for (const node of nodes) {
    const { found, list } = pickArray<T>(node);
    if (!found) continue;
    return {
      list,
      total: Math.max(
        readNumber(node, 'total', list.length),
        readNumber(node, 'totalCount', list.length),
        list.length,
      ),
      page: readNumber(node, 'page', fallbackPage),
      pageSize: readNumber(node, 'pageSize', fallbackPageSize),
    };
  }
  return { list: [] as T[], total: 0, page: fallbackPage, pageSize: fallbackPageSize };
};

export const syncStatusTag = (status?: API.DnsSyncStatus) => {
  if (status === 'active') return <Tag color="success">active</Tag>;
  if (status === 'disabled') return <Tag color="warning">disabled</Tag>;
  return <Tag color="error">missing</Tag>;
};

export const bindingStatusTag = (status?: API.DnsBindingStatus) => {
  if (status === 'active') return <Tag color="success">active</Tag>;
  return <Tag color="default">released</Tag>;
};

export const availableTag = (isAvailable?: number) => {
  if (isAvailable === 1) return <Tag color="success">available</Tag>;
  return <Tag color="error">unavailable</Tag>;
};
