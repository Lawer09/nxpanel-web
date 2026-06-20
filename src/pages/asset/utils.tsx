import { Tooltip } from 'antd';
import React from 'react';
import { DevAdminRequestError } from '@/services/dev-admin/request';
import {
  ACCOUNT_STATUS_OPTIONS,
  IP_STATUS_OPTIONS,
  MACHINE_STATUS_OPTIONS,
  SSH_KEY_STATUS_OPTIONS,
} from './constants';
import type { AssetResourceKey } from './types';

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

export const normalizeDevErrorMessage = (error: any) => {
  if (error instanceof DevAdminRequestError) {
    if (error.errorType === 'CAPABILITY_NOT_SUPPORTED') {
      return error.errorDetail || 'Current provider capability does not support this action.';
    }
    return error.message || error.errorDetail || 'Request failed.';
  }
  const messageText = error?.message || 'Request failed.';
  if (
    typeof messageText === 'string' &&
    messageText.includes('capability_not_supported')
  ) {
    return 'Current provider capability does not support this action.';
  }
  return messageText;
};

export const isCapabilityNotSupportedError = (error: unknown) =>
  error instanceof DevAdminRequestError &&
  error.errorType === 'CAPABILITY_NOT_SUPPORTED';

export const cleanupObject = <T extends Record<string, any>>(value: T): T =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined && item !== null && item !== '',
    ),
  ) as T;

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
    <Tooltip title={disabledReason}>
      <span>{React.cloneElement(button, { disabled: true })}</span>
    </Tooltip>
  );
};
