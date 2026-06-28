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
    return value ? 'Yes' : 'No';
  }
  return String(value);
};

export const formatTime = (value?: string | null) => formatText(value);

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
    return 'Management login required. Sign in again and retry.';
  }

  if (error instanceof DevAdminRequestError) {
    if (error.errorType === 'IP_PULL_RUN_EXPIRED') {
      return 'The pulled IP cache has expired. Pull provider IPs again.';
    }

    if (
      isCapabilityNotSupportedDetail(
        error.errorType,
        error.errorDetail,
        error.message,
      )
    ) {
      return 'Current provider capability does not support this action.';
    }

    if (error.httpStatus === 403) {
      return 'You do not have permission to access this asset action.';
    }

    if (error.httpStatus === 400 || error.errorType === 'INVALID_REQUEST') {
      return error.message || 'The submitted asset request is invalid.';
    }

    if (error.httpStatus === 404 || error.errorType === 'COMMON_NOT_FOUND') {
      return 'The requested asset resource no longer exists.';
    }

    if (error.httpStatus === 409 || error.errorType === 'COMMON_CONFLICT') {
      return error.message || 'The request conflicts with the current asset state.';
    }

    if (error.httpStatus === 502) {
      return error.message || 'Provider request failed. Retry later or check provider status.';
    }

    if (error.httpStatus === 503 || error.errorType === 'COMMON_UNAVAILABLE') {
      return error.message || 'Dependent service is unavailable. Retry later.';
    }

    if (error.httpStatus === 401) {
      return 'Management login required. Sign in again and retry.';
    }

    return error.message || error.errorDetail || 'Request failed.';
  }

  const messageText = error?.message || 'Request failed.';
  if (
    isCapabilityNotSupportedDetail(
      error?.errorType,
      error?.errorDetail,
      messageText,
    )
  ) {
    return 'Current provider capability does not support this action.';
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
      { label: 'active', value: 'active' },
      { label: 'disabled', value: 'disabled' },
    ];
  }
  return SSH_KEY_STATUS_OPTIONS;
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
