import { Modal, message } from 'antd';
import { getCachedOperationUser } from '@/services/auth/session';
import {
  getUserPreferences,
  saveUserPreferences,
} from './api';

export const USER_PREFERENCES_CLOUD_APPLIED_EVENT = 'user-preferences-cloud-applied';

const RATIO_BAR_COLOR_STORAGE_KEY = 'project-report-ratio-bar-colors';
const RATIO_BAR_COLOR_CHANGE_EVENT = 'project-report-ratio-bar-colors-change';
const SAVE_DEBOUNCE_MS = 1000;
const CLOUD_APPLY_SAVE_SUPPRESS_MS = 2000;

export const USER_PREFERENCE_KEYS = [
  'report.projectReport',
  'report.projectHourlyReport',
  RATIO_BAR_COLOR_STORAGE_KEY,
] as const;

type UserPreferenceKey = (typeof USER_PREFERENCE_KEYS)[number];
type LocalPreference =
  | {
      exists: true;
      key: UserPreferenceKey;
      value: API.UserPreferenceValue;
      stableJson: string;
      valueHash?: string;
    }
  | {
      exists: false;
      key: UserPreferenceKey;
    };

type ConflictItem = {
  key: UserPreferenceKey;
  local: API.UserPreferenceValue;
  remote: API.UserPreferenceItem;
};

const preferenceKeySet = new Set<string>(USER_PREFERENCE_KEYS);
const preferenceLabels: Record<UserPreferenceKey, string> = {
  'report.projectReport': '项目日报表状态',
  'report.projectHourlyReport': '项目小时汇总状态',
  [RATIO_BAR_COLOR_STORAGE_KEY]: '项目报表占比条颜色配置',
};

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const cloudApplySuppressedUntil = new Map<string, number>();

let runningSyncPromise: Promise<void> | undefined;
let conflictPromptShown = false;
let preferenceEventBridgeInstalled = false;

const isBrowser = () => typeof window !== 'undefined';

export const isUserPreferenceKey = (key: string): key is UserPreferenceKey =>
  preferenceKeySet.has(key);

const canSyncOperationPreferences = () => {
  if (!isBrowser()) return false;
  if (!localStorage.getItem('auth_token')) return false;
  return !!getCachedOperationUser();
};

const isJsonObjectOrArray = (value: unknown): value is API.UserPreferenceValue =>
  !!value && typeof value === 'object';

const normalizeForStableJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableJson(item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const nextValue = normalizeForStableJson(
          (value as Record<string, unknown>)[key],
        );
        if (nextValue !== undefined) {
          result[key] = nextValue;
        }
        return result;
      }, {});
  }

  return value;
};

const stableSerializePreferenceValue = (value: unknown) =>
  JSON.stringify(normalizeForStableJson(value));

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

const hashPreferenceValue = async (value: unknown) => {
  const serialized = stableSerializePreferenceValue(value);
  if (!globalThis.crypto?.subtle) {
    return undefined;
  }

  const bytes = new TextEncoder().encode(serialized);
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', bytes));
};

const readLocalPreference = async (
  key: UserPreferenceKey,
): Promise<LocalPreference> => {
  const raw = localStorage.getItem(key);
  if (raw === null) {
    return { exists: false, key };
  }

  try {
    const value = JSON.parse(raw);
    if (!isJsonObjectOrArray(value)) {
      return { exists: false, key };
    }

    return {
      exists: true,
      key,
      value,
      stableJson: stableSerializePreferenceValue(value),
      valueHash: await hashPreferenceValue(value),
    };
  } catch (_error) {
    return { exists: false, key };
  }
};

const isSamePreferenceValue = (
  local: Extract<LocalPreference, { exists: true }>,
  remote: API.UserPreferenceItem,
) => {
  if (local.valueHash && remote.valueHash === local.valueHash) {
    return true;
  }

  return local.stableJson === stableSerializePreferenceValue(remote.preferenceValue);
};

const emitCloudApplied = (keys: UserPreferenceKey[]) => {
  if (!keys.length || !isBrowser()) return;

  window.dispatchEvent(
    new CustomEvent(USER_PREFERENCES_CLOUD_APPLIED_EVENT, {
      detail: { keys },
    }),
  );

  if (keys.includes(RATIO_BAR_COLOR_STORAGE_KEY)) {
    window.dispatchEvent(new CustomEvent(RATIO_BAR_COLOR_CHANGE_EVENT));
  }
};

const suppressCloudSave = (keys: UserPreferenceKey[]) => {
  const until = Date.now() + CLOUD_APPLY_SAVE_SUPPRESS_MS;
  keys.forEach((key) => {
    cloudApplySuppressedUntil.set(key, until);
  });
};

const isCloudSaveSuppressed = (key: string) =>
  (cloudApplySuppressedUntil.get(key) ?? 0) > Date.now();

const installPreferenceEventBridge = () => {
  if (!isBrowser() || preferenceEventBridgeInstalled) return;
  preferenceEventBridgeInstalled = true;

  window.addEventListener(RATIO_BAR_COLOR_CHANGE_EVENT, () => {
    schedulePreferenceCloudSave(RATIO_BAR_COLOR_STORAGE_KEY);
  });
};

const applyRemotePreferences = (items: API.UserPreferenceItem[]) => {
  if (!isBrowser()) return;

  const appliedKeys: UserPreferenceKey[] = [];
  items.forEach((item) => {
    if (!isUserPreferenceKey(item.preferenceKey)) return;
    if (!isJsonObjectOrArray(item.preferenceValue)) return;

    localStorage.setItem(
      item.preferenceKey,
      JSON.stringify(item.preferenceValue),
    );
    appliedKeys.push(item.preferenceKey);
  });

  if (!appliedKeys.length) return;
  suppressCloudSave(appliedKeys);
  emitCloudApplied(appliedKeys);
};

const savePreferenceItems = async (items: API.UserPreferenceSaveItem[]) => {
  if (!items.length) return true;
  if (!canSyncOperationPreferences()) return false;

  try {
    const res = await saveUserPreferences(
      { items },
      { skipErrorHandler: true },
    );
    return res.code === 0;
  } catch (_error) {
    // Keep local preferences intact. The next refresh or local change will retry.
    return false;
  }
};

const confirmConflictStrategy = (conflicts: ConflictItem[]) =>
  new Promise<'cloud' | 'local'>((resolve) => {
    const labels = conflicts.map((item) => preferenceLabels[item.key]).join('、');

    Modal.confirm({
      title: '个人配置冲突',
      content: `检测到 ${labels} 的本地配置和云端配置不一致，请选择保留哪一份配置。`,
      okText: '保留云端配置',
      cancelText: '保留本地配置',
      closable: false,
      maskClosable: false,
      onOk: () => {
        resolve('cloud');
      },
      onCancel: () => {
        resolve('local');
      },
    });
  });

const doSyncUserPreferences = async () => {
  if (!canSyncOperationPreferences()) return;

  const res = await getUserPreferences(
    { keys: [...USER_PREFERENCE_KEYS] },
    { skipErrorHandler: true },
  );
  if (res.code !== 0 || !Array.isArray(res.data)) return;

  const remoteByKey = new Map<UserPreferenceKey, API.UserPreferenceItem>();
  res.data.forEach((item) => {
    if (!isUserPreferenceKey(item.preferenceKey)) return;
    if (!isJsonObjectOrArray(item.preferenceValue)) return;
    remoteByKey.set(item.preferenceKey, item);
  });

  const localEntries = await Promise.all(
    USER_PREFERENCE_KEYS.map((key) => readLocalPreference(key)),
  );
  const remoteOnlyItems: API.UserPreferenceItem[] = [];
  const localOnlyItems: API.UserPreferenceSaveItem[] = [];
  const conflicts: ConflictItem[] = [];

  localEntries.forEach((local) => {
    const remote = remoteByKey.get(local.key);

    if (!local.exists && remote) {
      remoteOnlyItems.push(remote);
      return;
    }

    if (local.exists && !remote) {
      localOnlyItems.push({
        preferenceKey: local.key,
        preferenceValue: local.value,
      });
      return;
    }

    if (local.exists && remote && !isSamePreferenceValue(local, remote)) {
      conflicts.push({
        key: local.key,
        local: local.value,
        remote,
      });
    }
  });

  applyRemotePreferences(remoteOnlyItems);
  await savePreferenceItems(localOnlyItems);

  if (!conflicts.length || conflictPromptShown) return;

  conflictPromptShown = true;
  const strategy = await confirmConflictStrategy(conflicts);
  if (strategy === 'cloud') {
    applyRemotePreferences(conflicts.map((item) => item.remote));
    message.success('已保留云端个人配置');
    return;
  }

  const saved = await savePreferenceItems(
    conflicts.map((item) => ({
      preferenceKey: item.key,
      preferenceValue: item.local,
    })),
  );
  if (saved) {
    message.success('已保留本地个人配置');
  } else {
    message.error('本地个人配置保存到云端失败，将保留当前本地配置');
  }
};

export const syncUserPreferencesFromCloud = async () => {
  installPreferenceEventBridge();

  if (runningSyncPromise) {
    return runningSyncPromise;
  }

  runningSyncPromise = doSyncUserPreferences()
    .catch((_error) => {
      // Preference sync must not block normal login or page rendering.
    })
    .finally(() => {
      runningSyncPromise = undefined;
    });

  return runningSyncPromise;
};

export const schedulePreferenceCloudSave = (key: string) => {
  if (!isUserPreferenceKey(key)) return;
  if (!canSyncOperationPreferences()) return;
  if (isCloudSaveSuppressed(key)) return;

  const existingTimer = saveTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    saveTimers.delete(key);
    if (isCloudSaveSuppressed(key) || !canSyncOperationPreferences()) return;

    void readLocalPreference(key).then((local) => {
      if (!local.exists) return;
      void savePreferenceItems([
        {
          preferenceKey: key,
          preferenceValue: local.value,
        },
      ]);
    });
  }, SAVE_DEBOUNCE_MS);

  saveTimers.set(key, timer);
};

installPreferenceEventBridge();
