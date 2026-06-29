import { Tooltip } from 'antd';
import React from 'react';
import {
  DevAdminRequestError,
  DevAdminUnauthorizedError,
} from '@/services/dev-admin/request';
import {
  ACCOUNT_STATUS_OPTIONS,
  IP_STATUS_OPTIONS,
  MACHINE_STATUS_OPTIONS,
  SSH_KEY_STATUS_OPTIONS,
} from './constants';
import type { AssetResourceKey } from './types';
import type { AssetTagFormValue } from './types';

export const formatText = (value?: string | number | null | boolean) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  return String(value);
};

export const formatTime = (value?: string | null) => formatText(value);

export const getMachineStatusColor = (status?: string | null) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'creating':
      return 'processing';
    case 'create_failed':
      return 'error';
    case 'stopped':
      return 'warning';
    case 'destroyed':
      return 'default';
    default:
      return 'default';
  }
};

export const parseJsonText = (value: string | undefined, fieldName: string) => {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${fieldName} must be valid JSON.`);
  }
};

export const stringifyJson = (value: unknown) => {
  if (value === undefined || value === null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

export const buildAssetTaskDetailPath = (taskId: number | string) =>
  `/asset/tasks/${encodeURIComponent(String(taskId))}`;

const isCapabilityNotSupportedDetail = (
  errorType?: string,
  errorDetail?: string,
  message?: string,
) => {
  const normalizedType = errorType?.toUpperCase();
  const normalizedDetail = errorDetail?.toLowerCase();
  const normalizedMessage = message?.toLowerCase();

  return (
    normalizedType === 'CAPABILITY_NOT_SUPPORTED' ||
    normalizedDetail === 'capability_not_supported' ||
    normalizedMessage?.includes('capability_not_supported') === true
  );
};

export const normalizeDevErrorMessage = (error: any) => {
  if (error instanceof DevAdminUnauthorizedError) {
    return '管理端登录已失效，请重新登录后重试。';
  }

  if (error instanceof DevAdminRequestError) {
    if (error.errorType === 'IP_PULL_RUN_EXPIRED') {
      return '云上 IP 拉取缓存已过期，请重新拉取。';
    }

    if (
      isCapabilityNotSupportedDetail(
        error.errorType,
        error.errorDetail,
        error.message,
      )
    ) {
      return '当前供应商能力暂不支持此操作。';
    }

    if (error.httpStatus === 403) {
      return '当前账号无权执行该资产操作。';
    }

    if (error.httpStatus === 400 || error.errorType === 'INVALID_REQUEST') {
      return error.message || '提交的数据不合法，请检查后重试。';
    }

    if (error.httpStatus === 404 || error.errorType === 'COMMON_NOT_FOUND') {
      return '目标资产不存在，可能已被删除。';
    }

    if (error.httpStatus === 409 || error.errorType === 'COMMON_CONFLICT') {
      return error.message || '当前请求与资产现状冲突，请刷新后重试。';
    }

    if (error.httpStatus === 502) {
      return error.message || '供应商侧请求失败，请稍后重试或检查供应商状态。';
    }

    if (error.httpStatus === 503 || error.errorType === 'COMMON_UNAVAILABLE') {
      return error.message || '依赖服务暂不可用，请稍后重试。';
    }

    if (error.httpStatus === 401) {
      return '管理端登录已失效，请重新登录后重试。';
    }

    return error.message || error.errorDetail || '请求失败。';
  }

  const messageText = error?.message || '请求失败。';
  if (
    isCapabilityNotSupportedDetail(
      error?.errorType,
      error?.errorDetail,
      messageText,
    )
  ) {
    return '当前供应商能力暂不支持此操作。';
  }
  return messageText;
};

export const isCapabilityNotSupportedError = (error: unknown) =>
  error instanceof DevAdminRequestError &&
  isCapabilityNotSupportedDetail(error.errorType, error.errorDetail, error.message);

export const cleanupObject = <T extends Record<string, any>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined && item !== null && item !== '',
    ),
  ) as T;

export const normalizeAssetTags = (values?: AssetTagFormValue[]) =>
  (values || [])
    .map((item) =>
      cleanupObject({
        key: item.key?.trim(),
        value: item.value?.trim(),
        label: item.label?.trim(),
      }),
    )
    .filter((item) => item.key && item.value) as API.AssetTagItem[];

export const getAssetBatchResultSummary = (result: API.AssetBatchResult) =>
  `总计 ${result.total} 项，成功 ${result.succeeded} 项，失败 ${result.failed} 项。`;

export const getAssetBatchFailureLines = (
  result: API.AssetBatchResult,
  limit: number = 10,
) =>
  result.items
    .filter((item) => item.status === 'failed')
    .slice(0, limit)
    .map(
      (item) =>
        `#${item.id}: ${item.error_message || item.error_code || 'Unknown error'}`,
    );

export const getStatusOptions = (tab: AssetResourceKey) => {
  if (tab === 'accounts') {
    return ACCOUNT_STATUS_OPTIONS;
  }
  if (tab === 'machines') {
    return MACHINE_STATUS_OPTIONS;
  }
  if (tab === 'ips') {
    return IP_STATUS_OPTIONS;
  }
  if (tab === 'scripts') {
    return [
      { label: '启用', value: 'active' },
      { label: '停用', value: 'disabled' },
    ];
  }
  return SSH_KEY_STATUS_OPTIONS;
};

export const getAssetSourceLabel = (source?: string | null) => {
  switch (source) {
    case 'provider':
      return '云上创建';
    case 'import':
      return '云上导入';
    case 'manual':
      return '手动录入';
    default:
      return formatText(source);
  }
};

export const getOperationStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'pending':
      return '排队中';
    case 'running':
      return '执行中';
    case 'succeeded':
      return '成功';
    case 'failed':
      return '失败';
    case 'cancelled':
      return '已取消';
    default:
      return formatText(status);
  }
};

export const getOperationStatusColor = (status?: string | null) => {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'processing';
    case 'cancelled':
      return 'default';
    default:
      return 'warning';
  }
};

export const getCapabilityValue = (
  capabilities: Record<string, any> | null | undefined,
  key: string,
) => {
  if (!capabilities || typeof capabilities !== 'object') {
    return undefined;
  }

  if (typeof capabilities[key] === 'boolean') {
    return capabilities[key];
  }

  const segments = key.split('_');
  if (segments.length > 1) {
    const [group, ...rest] = segments;
    const grouped = capabilities[group];
    const groupedKey = rest.join('_');
    if (
      grouped &&
      typeof grouped === 'object' &&
      typeof grouped[groupedKey] === 'boolean'
    ) {
      return grouped[groupedKey];
    }
  }

  return undefined;
};

export const isProviderCapabilitySupported = (
  provider: API.AssetProvider | undefined,
  keys: string[],
): boolean | undefined => {
  if (!provider?.capabilities) {
    return undefined;
  }

  for (const key of keys) {
    const value = getCapabilityValue(provider.capabilities, key);
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
};

export const renderActionButton = (
  button: React.ReactElement<{ disabled?: boolean }>,
  disabledReason?: string,
) => {
  if (!disabledReason) {
    return button;
  }

  return (
    <Tooltip key={button.key ?? 'disabled-action'} title={disabledReason}>
      <span>{React.cloneElement(button, { disabled: true })}</span>
    </Tooltip>
  );
};
