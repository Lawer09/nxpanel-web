import {
  addPlatformAccount,
  bindCampaignGroup,
  createMintegralObject,
  deletePlatformAccount,
  discoverPlatformAccounts,
  getCampaignGroupBindingPage,
  getPlatformAccountPage,
  getPlatformObjectPage,
  getPlatformSyncHistoryPage,
  type PlatformReportGranularity,
  type PlatformSyncMode,
  syncPlatformAccount,
  unbindCampaignGroup,
  updatePlatformAccount,
  validatePlatformAccount,
} from '@/services/ads-console/platform';
import { getGroupOptions } from '@/services/ads-console/orgOptions';
import {
  ModalForm,
  type ProColumns,
  type ProFormInstance,
  ProFormDateRangePicker,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
} from '@ant-design/pro-components';
import { App, Button, Input, Modal, Popconfirm, Space, Switch, Tabs, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';

const SYNC_STATUS_MAP: Record<number, { color: string; text: string }> = {
  0: { color: 'processing', text: '同步中' },
  1: { color: 'success', text: '成功' },
  2: { color: 'error', text: '失败' },
};

const PLATFORM_OPTIONS = [
  { label: 'Mintegral', value: 'mintegral' },
  { label: 'Kwai', value: 'kwai' },
  { label: 'Google Ads', value: 'google_ads' },
];

const PLATFORM_VALUE_ENUM = {
  mintegral: { text: 'Mintegral' },
  kwai: { text: 'Kwai' },
  google_ads: { text: 'Google Ads' },
};

const GROUP_RESOLVE_MODE_OPTIONS = [
  { label: '账号绑定项目组', value: 'ACCOUNT_DIRECT' },
  { label: 'Campaign 名称前缀', value: 'CAMPAIGN_NAME_PREFIX' },
  { label: 'Campaign 显式绑定', value: 'CAMPAIGN_BINDING' },
  { label: '混合优先级', value: 'MIXED_PRIORITY' },
];

const GROUP_RESOLVE_MODE_VALUE_ENUM = {
  ACCOUNT_DIRECT: { text: '账号绑定' },
  CAMPAIGN_NAME_PREFIX: { text: '名称前缀' },
  CAMPAIGN_BINDING: { text: 'Campaign 绑定' },
  MIXED_PRIORITY: { text: '混合优先级' },
};

type SyncFormValues = {
  dateRange?: [string, string];
  granularity?: PlatformReportGranularity;
  syncMode?: PlatformSyncMode;
};

type CreateFormValues = {
  type?: string;
  payload?: string;
};

type PlatformAccountFormValues = Partial<AdsConsole.AdPlatformAccount> & {
  kwaiRefreshToken?: string;
  kwaiAccountId?: string;
  kwaiAgentId?: string;
  kwaiCorpId?: string;
  kwaiTimeZoneIana?: string;
  googleApiVersion?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleCustomerId?: string;
  googleLoginCustomerId?: string;
};

const KWAI_TIME_ZONE_OPTIONS = [
  'UTC-6',
  'UTC-5',
  'UTC-4',
  'UTC-3',
  'UTC+0',
  'UTC+1',
  'UTC+2',
  'UTC+3',
  'UTC+5',
  'UTC+6',
  'UTC+7',
  'UTC+8',
].map((value) => ({ label: value, value }));

const parseRawConfig = (rawConfig?: string): Record<string, unknown> => {
  if (!rawConfig?.trim()) return {};
  try {
    const parsed = JSON.parse(rawConfig);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const configText = (config: Record<string, unknown>, key: string) => {
  const value = config[key];
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
};

const configAliasText = (config: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = configText(config, key);
    if (value) return value;
  }
  return undefined;
};

const emptyToUndefined = (value?: string) => {
  const text = value?.trim();
  return text ? text : undefined;
};

const optionalNumber = (value?: string) => {
  const text = emptyToUndefined(value);
  if (!text) return undefined;
  return /^\d+$/.test(text) ? Number(text) : text;
};

const paginationNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeAccountInitialValues = (record?: AdsConsole.AdPlatformAccount): PlatformAccountFormValues => {
  if (!record) {
    return {
      platform: 'mintegral',
      status: 1,
      groupResolveMode: 'ACCOUNT_DIRECT',
      googleApiVersion: 'v24',
      kwaiTimeZoneIana: 'UTC+8',
    };
  }
  const rawConfig = parseRawConfig(record.rawConfig);
  return {
    ...record,
    groupResolveMode: record.groupResolveMode || 'ACCOUNT_DIRECT',
    kwaiRefreshToken: configText(rawConfig, 'refreshToken'),
    kwaiAccountId: configText(rawConfig, 'accountId'),
    kwaiAgentId: configText(rawConfig, 'agentId'),
    kwaiCorpId: configText(rawConfig, 'corpId'),
    kwaiTimeZoneIana: configText(rawConfig, 'timeZoneIana') || 'UTC+8',
    googleApiVersion: configText(rawConfig, 'apiVersion') || 'v24',
    googleClientId: configText(rawConfig, 'clientId'),
    googleClientSecret: configText(rawConfig, 'clientSecret'),
    googleCustomerId: configText(rawConfig, 'customerId'),
    googleLoginCustomerId: configText(rawConfig, 'loginCustomerId'),
  };
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractLabelValue = (source: string, labels: string[]) => {
  const labelPattern = labels.map(escapeRegExp).join('|');
  const match = source.match(new RegExp(`(?:^|[\\r\\n])\\s*(?:${labelPattern})\\s*[:：]\\s*(?:\\r?\\n\\s*)?([^\\r\\n]+)`, 'i'));
  return emptyToUndefined(match?.[1]);
};

const extractJsonObjectText = (source: string) => {
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) return undefined;
  return source.slice(start, end + 1);
};

const normalizeKwaiMailJsonText = (jsonText: string) =>
  jsonText
    .replace(/("[^"\\]*(?:\\.[^"\\]*)*")\s*(?="[A-Za-z_][\w]*"\s*:)/g, '$1,')
    .replace(/(\d+)\s*(?="[A-Za-z_][\w]*"\s*:)/g, '$1,');

const parseLooseKwaiTokenJsonText = (jsonText: string) => {
  const result: Record<string, unknown> = {};
  const textFields = [
    'access_token',
    'token_type',
    'refresh_token',
    'refreshToken',
    'clientId',
    'client_id',
    'secretKey',
    'secret_key',
    'clientSecret',
    'client_secret',
    'accountId',
    'account_id',
    'agentId',
    'agent_id',
    'corpId',
    'coprId',
    'corp_id',
  ];
  for (const field of textFields) {
    const match = jsonText.match(new RegExp(`"${escapeRegExp(field)}"\\s*:\\s*"([^"]*)"`, 'i'));
    if (match?.[1]) {
      result[field] = match[1].trim();
    }
  }
  const expiresInMatch = jsonText.match(/"expires_in"\s*:\s*(\d+)/i);
  if (expiresInMatch?.[1]) {
    result.expires_in = Number(expiresInMatch[1]);
  }
  if (Object.keys(result).length === 0) {
    throw new Error('授权内容不是合法 JSON 对象，请检查字段名、引号和逗号');
  }
  return result;
};

const parseJsonObjectText = (jsonText: string) => {
  const parseObject = (text: string) => {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('授权内容必须是 JSON 对象');
    }
    return parsed as Record<string, unknown>;
  };

  try {
    return parseObject(jsonText);
  } catch {
    try {
      return parseObject(normalizeKwaiMailJsonText(jsonText));
    } catch {
      return parseLooseKwaiTokenJsonText(jsonText);
    }
  }
};

const parseKwaiAuthText = (text?: string) => {
  const source = emptyToUndefined(text);
  if (!source) {
    throw new Error('请粘贴 Kwai 邮件授权内容或 Token JSON');
  }

  const jsonText = extractJsonObjectText(source);
  const tokenJson = jsonText ? parseJsonObjectText(jsonText) : {};
  const values: PlatformAccountFormValues = {};
  const parsedFields: string[] = [];
  const applyValue = (field: keyof PlatformAccountFormValues, label: string, value?: string) => {
    const normalized = emptyToUndefined(value);
    if (!normalized) return;
    values[field] = normalized as never;
    parsedFields.push(label);
  };

  applyValue(
    'accessKey',
    'Client ID',
    extractLabelValue(source, ['ClientId', 'Client ID', 'client_id'])
      || configAliasText(tokenJson, ['clientId', 'client_id']),
  );
  applyValue(
    'apiKey',
    'Client Secret',
    extractLabelValue(source, ['SecretKey', 'Secret Key', 'Client Secret', 'client_secret'])
      || configAliasText(tokenJson, ['secretKey', 'secret_key', 'clientSecret', 'client_secret']),
  );
  applyValue(
    'kwaiRefreshToken',
    'Refresh Token',
    configAliasText(tokenJson, ['refresh_token', 'refreshToken']),
  );
  applyValue(
    'kwaiAccountId',
    'Account ID',
    extractLabelValue(source, ['AccountId', 'Account ID', 'account_id'])
      || configAliasText(tokenJson, ['accountId', 'account_id']),
  );
  applyValue(
    'kwaiAgentId',
    'Agent ID',
    extractLabelValue(source, ['AgentId', 'Agent ID', 'agent_id'])
      || configAliasText(tokenJson, ['agentId', 'agent_id']),
  );
  applyValue(
    'kwaiCorpId',
    'Corp ID',
    extractLabelValue(source, ['CorpId', 'CoprId', 'Corp ID', 'corp_id'])
      || configAliasText(tokenJson, ['corpId', 'coprId', 'corp_id']),
  );

  if (!values.kwaiRefreshToken) {
    throw new Error('未解析到 refresh_token，请粘贴 Token 和 Refresh Token 下的 JSON');
  }
  if (values.kwaiAgentId && values.kwaiCorpId) {
    throw new Error('Agent ID 和 Corp ID 只能填写一个，请确认邮件授权类型');
  }
  if (parsedFields.length === 0) {
    throw new Error('未识别到可填写的 Kwai 凭证字段');
  }

  return { values, parsedFields };
};

const PlatformPage: React.FC = () => {
  const { message } = App.useApp();
  const accountActionRef = useRef<ActionType>(undefined);
  const objectActionRef = useRef<ActionType>(undefined);
  const bindingActionRef = useRef<ActionType>(undefined);
  const historyActionRef = useRef<ActionType>(undefined);
  const editFormRef = useRef<ProFormInstance<PlatformAccountFormValues>>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bindOpen, setBindOpen] = useState(false);
  const [kwaiParserOpen, setKwaiParserOpen] = useState(false);
  const [kwaiAuthText, setKwaiAuthText] = useState('');
  const [editRecord, setEditRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();
  const [syncRecord, setSyncRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();
  const [createRecord, setCreateRecord] = useState<AdsConsole.AdPlatformAccount | undefined>();
  const [bindRecord, setBindRecord] = useState<AdsConsole.AdPlatformObject | undefined>();
  const [groupOptions, setGroupOptions] = useState<AdsConsole.SelectOption[]>([]);

  useEffect(() => {
    getGroupOptions().then((res) => {
      setGroupOptions(
        (res?.data || []).map((item) => ({
          label: String(item.label),
          value: String(item.value),
        })),
      );
    });
  }, []);

  const openAdd = () => {
    setEditRecord(undefined);
    setEditOpen(true);
  };

  const openEdit = (record: AdsConsole.AdPlatformAccount) => {
    setEditRecord(record);
    setEditOpen(true);
  };

  const buildRawConfig = (platform: AdsConsole.AdPlatformAccount['platform'], values: PlatformAccountFormValues) => {
    const base = parseRawConfig(editRecord?.platform === platform ? editRecord.rawConfig : undefined);
    if (platform === 'kwai') {
      return JSON.stringify({
        ...base,
        refreshToken: emptyToUndefined(values.kwaiRefreshToken),
        accountId: emptyToUndefined(values.kwaiAccountId),
        agentId: optionalNumber(values.kwaiAgentId),
        corpId: optionalNumber(values.kwaiCorpId),
        timeZoneIana: emptyToUndefined(values.kwaiTimeZoneIana),
      });
    }
    if (platform === 'google_ads') {
      return JSON.stringify({
        ...base,
        apiVersion: emptyToUndefined(values.googleApiVersion) || 'v24',
        clientId: emptyToUndefined(values.googleClientId),
        clientSecret: emptyToUndefined(values.googleClientSecret),
        customerId: emptyToUndefined(values.googleCustomerId),
        loginCustomerId: emptyToUndefined(values.googleLoginCustomerId),
      });
    }
    return undefined;
  };

  const validateCredentialValues = (
    platform: AdsConsole.AdPlatformAccount['platform'],
    values: PlatformAccountFormValues,
  ) => {
    if (platform === 'kwai') {
      const hasAgentId = !!emptyToUndefined(values.kwaiAgentId);
      const hasCorpId = !!emptyToUndefined(values.kwaiCorpId);
      if (!hasAgentId && !hasCorpId) {
        message.error('Kwai 需要填写 Agent ID 或 Corp ID');
        return false;
      }
      if (hasAgentId && hasCorpId) {
        message.error('Kwai Agent ID 和 Corp ID 只能填写一个');
        return false;
      }
    }
    return true;
  };

  const handleSave = async (values: PlatformAccountFormValues) => {
    const platform = values.platform || 'mintegral';
    if (!validateCredentialValues(platform, values)) {
      return false;
    }
    const payload = {
      id: editRecord?.id,
      platform,
      name: values.name,
      accessKey: values.accessKey,
      apiKey: values.apiKey,
      groupId: values.groupId,
      groupResolveMode: values.groupResolveMode || 'ACCOUNT_DIRECT',
      rawConfig: buildRawConfig(platform, values),
      status: values.status,
    };
    const res = editRecord?.id ? await updatePlatformAccount(payload) : await addPlatformAccount(payload);
    if (!res?.success) {
      message.error(res?.errorMessage || '保存失败');
      return false;
    }
    message.success('保存成功');
    accountActionRef.current?.reload();
    return true;
  };

  const handleBindCampaignGroup = async (values: { groupId?: string }) => {
    if (!bindRecord?.platform || !bindRecord.platformAccountId || !bindRecord.objectId || !values.groupId) {
      message.error('Campaign 或项目组信息不完整');
      return false;
    }
    const res = await bindCampaignGroup({
      platform: bindRecord.platform,
      platformAccountId: bindRecord.platformAccountId,
      accountId: bindRecord.accountId,
      campaignId: bindRecord.objectId,
      campaignName: bindRecord.name,
      groupId: values.groupId,
    });
    if (!res?.success) {
      message.error(res?.errorMessage || '绑定失败');
      return false;
    }
    message.success('绑定成功');
    bindingActionRef.current?.reload();
    return true;
  };

  const handleUnbindCampaignGroup = async (record: AdsConsole.AdPlatformCampaignGroupBinding) => {
    const res = await unbindCampaignGroup({
      platform: record.platform,
      platformAccountId: record.platformAccountId,
      campaignIds: [record.campaignId],
    });
    if (res?.success) {
      message.success('已解除绑定');
      bindingActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '解除绑定失败');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePlatformAccount(id);
    if (res?.success) {
      message.success('删除成功');
      accountActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const handleValidate = async (id: string) => {
    const res = await validatePlatformAccount(id);
    if (res?.success) {
      message.success('账户远端校验完成');
      accountActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '校验失败');
    }
  };

  const handleDiscoverAccounts = async (record: AdsConsole.AdPlatformAccount) => {
    const res = await discoverPlatformAccounts(record.id);
    if (res?.success) {
      message.success(`关联账号更新完成：${res.data?.length || 0} 个`);
      accountActionRef.current?.reload();
      objectActionRef.current?.reload();
      historyActionRef.current?.reload();
    } else {
      message.error(res?.errorMessage || '关联账号更新失败');
    }
  };

  const handleSync = async (values: SyncFormValues) => {
    if (!syncRecord?.id || !values.dateRange?.[0] || !values.dateRange?.[1]) {
      message.error('请选择同步日期');
      return false;
    }
    const res = await syncPlatformAccount(syncRecord.id, {
      startDate: values.dateRange[0],
      endDate: values.dateRange[1],
      granularity: values.granularity || 'daily',
      syncMode: values.syncMode || 'INSIGHTS',
    });
    if (!res?.success) {
      message.error(res?.errorMessage || '同步触发失败');
      return false;
    }
    message.success('同步已触发');
    accountActionRef.current?.reload();
    historyActionRef.current?.reload();
    return true;
  };

  const handleParseKwaiAuthText = () => {
    try {
      const parsed = parseKwaiAuthText(kwaiAuthText);
      const nextValues = { ...parsed.values };
      if (nextValues.kwaiAgentId) nextValues.kwaiCorpId = undefined;
      if (nextValues.kwaiCorpId) nextValues.kwaiAgentId = undefined;
      editFormRef.current?.setFieldsValue(nextValues);
      message.success(`已解析并填入：${parsed.parsedFields.join('、')}`);
      setKwaiParserOpen(false);
      setKwaiAuthText('');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Kwai 授权内容解析失败');
    }
  };

  const handleCreate = async (values: CreateFormValues) => {
    if (!createRecord?.id || !values.type || !values.payload) {
      message.error('请选择创建类型并填写官方 JSON');
      return false;
    }
    let payload: Record<string, unknown>;
    try {
      const parsed = JSON.parse(values.payload);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('payload 必须是 JSON 对象');
      }
      payload = parsed as Record<string, unknown>;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'payload 不是合法 JSON');
      return false;
    }
    const res = await createMintegralObject(createRecord.id, { type: values.type, payload });
    if (!res?.success) {
      message.error(res?.errorMessage || '创建失败');
      return false;
    }
    message.success('创建成功');
    objectActionRef.current?.reload();
    historyActionRef.current?.reload();
    return true;
  };

  const accountColumns: ProColumns<AdsConsole.AdPlatformAccount>[] = [
    {
      title: '平台',
      dataIndex: 'platform',
      valueType: 'select',
      valueEnum: PLATFORM_VALUE_ENUM,
      width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '平台侧账户ID',
      dataIndex: 'accountId',
      hideInSearch: true,
      width: 170,
      renderText: (value) => value || '-',
    },
    {
      title: '平台侧账户名',
      dataIndex: 'accountName',
      hideInSearch: true,
      width: 180,
      renderText: (value) => value || '-',
    },
    {
      title: '项目组',
      dataIndex: 'groupId',
      valueType: 'select',
      fieldProps: {
        options: groupOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      width: 160,
      render: (_, record) => record.groupName || '-',
    },
    {
      title: '归属模式',
      dataIndex: 'groupResolveMode',
      valueType: 'select',
      valueEnum: GROUP_RESOLVE_MODE_VALUE_ENUM,
      width: 150,
      renderText: (value) => GROUP_RESOLVE_MODE_VALUE_ENUM[value as keyof typeof GROUP_RESOLVE_MODE_VALUE_ENUM]?.text || '账号绑定',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      hideInSearch: true,
      width: 120,
      renderText: (value) => value ?? '-',
    },
    {
      title: '币种',
      dataIndex: 'currency',
      hideInSearch: true,
      width: 90,
      renderText: (value) => value || '-',
    },
    {
      title: 'Access Key',
      dataIndex: 'accessKey',
      hideInSearch: true,
      width: 180,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      hideInSearch: true,
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '停用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
      render: (_, record) => <Switch checked={record.status !== 0} disabled />,
      width: 90,
    },
    {
      title: '同步状态',
      dataIndex: 'lastSyncStatus',
      hideInSearch: true,
      width: 180,
      render: (_, record) => {
        if (record.lastSyncStatus == null) return <span style={{ color: '#bfbfbf' }}>未同步</span>;
        const cfg = SYNC_STATUS_MAP[record.lastSyncStatus];
        const tag = <Tag color={cfg?.color}>{cfg?.text || record.lastSyncStatus}</Tag>;
        return (
          <Space size={6}>
            {record.lastSyncMsg ? <Tooltip title={record.lastSyncMsg}>{tag}</Tooltip> : tag}
            {record.lastSyncTime && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(record.lastSyncTime).format('YYYY-MM-DD HH:mm')}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 400,
      render: (_, record) => (
        <Space size={8}>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleValidate(record.id)}>
            校验
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSyncRecord(record);
              setSyncOpen(true);
            }}
          >
            同步
          </Button>
          {record.platform === 'google_ads' && (
            <Popconfirm
              title="更新关联账号"
              description="将按该 Google Ads 账号的关联关系更新或新增账号，不会拉取报表。"
              onConfirm={() => handleDiscoverAccounts(record)}
            >
              <Button type="link" size="small">
                更新关联账号
              </Button>
            </Popconfirm>
          )}
          {record.platform === 'mintegral' && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setCreateRecord(record);
                setCreateOpen(true);
              }}
            >
              创建
            </Button>
          )}
          <Popconfirm title="确定删除该平台账户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const objectColumns: ProColumns<AdsConsole.AdPlatformObject>[] = [
    { title: '平台', dataIndex: 'platform', valueType: 'select', valueEnum: PLATFORM_VALUE_ENUM, width: 120 },
    { title: '平台账户ID', dataIndex: 'platformAccountId', width: 140 },
    { title: '账户ID', dataIndex: 'accountId', width: 160 },
    { title: '对象类型', dataIndex: 'objectType', width: 140 },
    { title: '对象ID', dataIndex: 'objectId', width: 180 },
    { title: '父对象类型', dataIndex: 'parentObjectType', hideInSearch: true, width: 120 },
    { title: '父对象ID', dataIndex: 'parentObjectId', hideInSearch: true, width: 180 },
    { title: '名称', dataIndex: 'name', width: 220 },
    { title: '状态', dataIndex: 'status', width: 120 },
    {
      title: '同步时间',
      dataIndex: 'lastSyncTime',
      hideInSearch: true,
      width: 160,
      render: (_, record) => record.lastSyncTime ? dayjs(record.lastSyncTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => record.objectType === 'campaign' ? (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setBindRecord(record);
            setBindOpen(true);
          }}
        >
          绑定项目组
        </Button>
      ) : '-',
    },
  ];

  const bindingColumns: ProColumns<AdsConsole.AdPlatformCampaignGroupBinding>[] = [
    { title: '平台', dataIndex: 'platform', valueType: 'select', valueEnum: PLATFORM_VALUE_ENUM, width: 120 },
    { title: '平台账户ID', dataIndex: 'platformAccountId', width: 140 },
    { title: '账户ID', dataIndex: 'accountId', width: 160 },
    { title: 'Campaign ID', dataIndex: 'campaignId', width: 180 },
    { title: 'Campaign 名称', dataIndex: 'campaignName', width: 220 },
    {
      title: '项目组',
      dataIndex: 'groupId',
      valueType: 'select',
      fieldProps: {
        options: groupOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      width: 160,
      render: (_, record) => record.groupName || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '停用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
      width: 100,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      hideInSearch: true,
      width: 170,
      render: (_, record) => record.updateTime ? dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 110,
      render: (_, record) => (
        <Popconfirm title="确定解除该 Campaign 的项目组绑定？" onConfirm={() => handleUnbindCampaignGroup(record)}>
          <Button type="link" danger size="small">
            解除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const historyColumns: ProColumns<AdsConsole.AdPlatformSyncHistory>[] = [
    { title: '平台', dataIndex: 'platform', valueType: 'select', valueEnum: PLATFORM_VALUE_ENUM, width: 120 },
    { title: '对象类型', dataIndex: 'objectType', width: 140 },
    { title: '对象ID', dataIndex: 'objectId', width: 180 },
    {
      title: '状态',
      dataIndex: 'syncStatus',
      valueType: 'select',
      valueEnum: {
        0: { text: '同步中', status: 'Processing' },
        1: { text: '成功', status: 'Success' },
        2: { text: '失败', status: 'Error' },
      },
      width: 110,
    },
    {
      title: '同步时间',
      dataIndex: 'syncTime',
      hideInSearch: true,
      width: 170,
      render: (_, record) => dayjs(record.syncTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '消息',
      dataIndex: 'syncMsg',
      hideInSearch: true,
      render: (_, record) => record.syncMsg ? <Typography.Text ellipsis>{record.syncMsg}</Typography.Text> : '-',
    },
  ];

  return (
    <>
      <Tabs
        items={[
          {
            key: 'accounts',
            label: '平台账户',
            children: (
              <ProTable<AdsConsole.AdPlatformAccount>
                rowKey="id"
                actionRef={accountActionRef}
                columns={accountColumns}
                request={async (params) => {
                  const res = await getPlatformAccountPage({
                    current: params.current,
                    size: params.pageSize,
                    platform: params.platform || undefined,
                    name: params.name,
                    groupId: params.groupId || undefined,
                    groupResolveMode: params.groupResolveMode || undefined,
                    status: params.status,
                  });
                  return {
                    data: res.data?.records || [],
                    total: paginationNumber(res.data?.total),
                    success: !!res.success,
                  };
                }}
                toolBarRender={() => [
                  <Button key="add" type="primary" onClick={openAdd}>
                    新增账户
                  </Button>,
                ]}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 1280 }}
              />
            ),
          },
          {
            key: 'objects',
            label: '同步对象',
            children: (
              <ProTable<AdsConsole.AdPlatformObject>
                rowKey="id"
                actionRef={objectActionRef}
                columns={objectColumns}
                request={async (params) => {
                  const res = await getPlatformObjectPage({
                    current: params.current,
                    size: params.pageSize,
                    platform: params.platform || undefined,
                    platformAccountId: params.platformAccountId,
                    accountId: params.accountId,
                    objectType: params.objectType,
                    objectId: params.objectId,
                    name: params.name,
                  });
                  return {
                    data: res.data?.records || [],
                    total: paginationNumber(res.data?.total),
                    success: !!res.success,
                  };
                }}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 1300 }}
              />
            ),
          },
          {
            key: 'bindings',
            label: 'Campaign 绑定',
            children: (
              <ProTable<AdsConsole.AdPlatformCampaignGroupBinding>
                rowKey="id"
                actionRef={bindingActionRef}
                columns={bindingColumns}
                request={async (params) => {
                  const res = await getCampaignGroupBindingPage({
                    current: params.current,
                    size: params.pageSize,
                    platform: params.platform || undefined,
                    platformAccountId: params.platformAccountId,
                    accountId: params.accountId,
                    campaignId: params.campaignId,
                    campaignName: params.campaignName,
                    groupId: params.groupId,
                    status: params.status,
                  });
                  return {
                    data: res.data?.records || [],
                    total: paginationNumber(res.data?.total),
                    success: !!res.success,
                  };
                }}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 1250 }}
              />
            ),
          },
          {
            key: 'history',
            label: '同步历史',
            children: (
              <ProTable<AdsConsole.AdPlatformSyncHistory>
                rowKey="id"
                actionRef={historyActionRef}
                columns={historyColumns}
                request={async (params) => {
                  const res = await getPlatformSyncHistoryPage({
                    current: params.current,
                    size: params.pageSize,
                    platform: params.platform || undefined,
                    platformAccountId: params.platformAccountId,
                    objectType: params.objectType,
                    objectId: params.objectId,
                    syncStatus: params.syncStatus,
                  });
                  return {
                    data: res.data?.records || [],
                    total: paginationNumber(res.data?.total),
                    success: !!res.success,
                  };
                }}
                pagination={{ pageSize: 20, showSizeChanger: true }}
                scroll={{ x: 1000 }}
              />
            ),
          },
        ]}
      />

      <ModalForm
        title={editRecord ? '编辑平台账户' : '新增平台账户'}
        open={editOpen}
        formRef={editFormRef}
        modalProps={{ destroyOnHidden: true, onCancel: () => setEditOpen(false) }}
        initialValues={normalizeAccountInitialValues(editRecord)}
        onFinish={async (values) => {
          const ok = await handleSave(values);
          if (ok) setEditOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="platform"
          label="平台"
          tooltip="决定后续凭证字段和同步适配器；保存后切换平台会按新平台重新生成扩展配置。"
          options={PLATFORM_OPTIONS}
          rules={[{ required: true }]}
        />
        <ProFormText
          name="name"
          label="名称"
          tooltip="系统内展示名称，建议包含平台和账户用途。"
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="groupId"
          label="项目组"
          tooltip="可选。账号级归属项目组；按账号直接归属或混合归属时会用于报表项目组映射。"
          allowClear
          options={groupOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'label',
          }}
        />
        <ProFormSelect
          name="groupResolveMode"
          label="项目组归属模式"
          tooltip="账号绑定适合整个广告账户归属一个项目组；名称前缀适合按 Campaign 命名识别；显式绑定适合逐个 Campaign 指定；混合优先级会优先使用显式绑定。"
          options={GROUP_RESOLVE_MODE_OPTIONS}
          initialValue="ACCOUNT_DIRECT"
          rules={[{ required: true }]}
        />
        <ProFormDependency name={['platform']}>
          {({ platform }) => {
            if (platform === 'kwai') {
              return (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      onClick={() => {
                        setKwaiAuthText('');
                        setKwaiParserOpen(true);
                      }}
                    >
                      解析 Kwai 授权内容
                    </Button>
                    <Typography.Text type="secondary">
                      可粘贴官方邮件内容或 Token JSON，自动填入 Client ID、Secret、Refresh Token、Corp ID。
                    </Typography.Text>
                  </Space>
                  <ProFormText
                    name="accessKey"
                    label="Client ID"
                    tooltip="必填。Kwai OAuth 应用的 client_id，保存到后端 accessKey。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText.Password
                    name="apiKey"
                    label="Client Secret"
                    tooltip="必填。Kwai OAuth 应用的 client_secret，保存到后端 apiKey。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText.Password
                    name="kwaiRefreshToken"
                    label="Refresh Token"
                    tooltip="必填。用于刷新 Kwai access_token；校验账户和同步前都会使用。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText
                    name="kwaiAccountId"
                    label="Account ID"
                    tooltip="可选。当 Agent/Corp 下有多个广告账户时填写，用于指定同步哪个账户；不填且返回多个账户时后端会要求补充。"
                  />
                  <ProFormText
                    name="kwaiAgentId"
                    label="Agent ID"
                    tooltip="Agent 代理商维度授权时填写。Agent ID 和 Corp ID 必须二选一，不能同时填写。"
                    rules={[{ pattern: /^\d+$/, message: 'Agent ID 必须是数字' }]}
                  />
                  <ProFormText
                    name="kwaiCorpId"
                    label="Corp ID"
                    tooltip="Corp 主体维度授权时填写。Agent ID 和 Corp ID 必须二选一，不能同时填写。"
                    rules={[{ pattern: /^\d+$/, message: 'Corp ID 必须是数字' }]}
                  />
                  <ProFormSelect
                    name="kwaiTimeZoneIana"
                    label="时区"
                    tooltip="必填。Kwai 报表时间范围和小时换算使用该时区；默认 UTC+8。"
                    options={KWAI_TIME_ZONE_OPTIONS}
                    initialValue="UTC+8"
                    rules={[{ required: true }]}
                  />
                </>
              );
            }
            if (platform === 'google_ads') {
              return (
                <>
                  <ProFormText
                    name="accessKey"
                    label="Developer Token"
                    tooltip="必填。Google Ads API Center 获取的开发者令牌，保存到后端 accessKey。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText.Password
                    name="apiKey"
                    label="Refresh Token"
                    tooltip="必填。Google OAuth 授权生成的 refresh_token，授权 scope 需包含 Google Ads API。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText
                    name="googleApiVersion"
                    label="API Version"
                    tooltip="必填。Google Ads REST API 版本，例如 v24；后端会按该版本拼接接口地址。"
                    initialValue="v24"
                    rules={[{ required: true }]}
                  />
                  <ProFormText
                    name="googleClientId"
                    label="OAuth Client ID"
                    tooltip="必填。Google Cloud Console 中 OAuth Client 的 client_id。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText.Password
                    name="googleClientSecret"
                    label="OAuth Client Secret"
                    tooltip="必填。Google Cloud Console 中 OAuth Client 的 client_secret。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText
                    name="googleCustomerId"
                    label="Customer ID"
                    tooltip="必填。要同步报表的 Google Ads 广告账户 ID，可填写 123-456-7890 或纯数字。"
                    rules={[{ required: true }]}
                  />
                  <ProFormText
                    name="googleLoginCustomerId"
                    label="Login Customer ID"
                    tooltip="MCC/经理账号访问子账号时填写经理账号 ID；授权用户直接访问目标账户时留空。"
                  />
                </>
              );
            }
            return (
              <>
                <ProFormText
                  name="accessKey"
                  label="Access Key"
                  tooltip="必填。Mintegral 后台提供的 Access Key。"
                  rules={[{ required: true }]}
                />
                <ProFormText.Password
                  name="apiKey"
                  label="API Key"
                  tooltip="必填。Mintegral 后台提供的 API Key，用于生成请求 token。"
                  rules={[{ required: true }]}
                />
              </>
            );
          }}
        </ProFormDependency>
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]}
        />
      </ModalForm>

      <Modal
        title="解析 Kwai 授权内容"
        open={kwaiParserOpen}
        width={720}
        okText="解析并填入"
        cancelText="取消"
        destroyOnHidden
        onOk={handleParseKwaiAuthText}
        onCancel={() => {
          setKwaiParserOpen(false);
          setKwaiAuthText('');
        }}
      >
        <Input.TextArea
          rows={12}
          value={kwaiAuthText}
          onChange={(event) => setKwaiAuthText(event.target.value)}
          placeholder="粘贴 Kwai 官方邮件内容，或只粘贴 Token 和 Refresh Token 下的 JSON"
        />
      </Modal>

      <ModalForm
        title={`同步 ${syncRecord?.name || ''}`}
        open={syncOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setSyncOpen(false) }}
        initialValues={{
          granularity: 'daily',
          syncMode: 'INSIGHTS',
          dateRange: [dayjs().subtract(1, 'day').format('YYYY-MM-DD'), dayjs().subtract(1, 'day').format('YYYY-MM-DD')],
        }}
        onFinish={async (values) => {
          const ok = await handleSync(values as SyncFormValues);
          if (ok) setSyncOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="granularity"
          label="报表粒度"
          options={[
            { label: '日报', value: 'daily' },
            { label: '小时报', value: 'hourly' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="syncMode"
          label="同步模式"
          options={[
            { label: '实体', value: 'ENTITY' },
            { label: '报表', value: 'INSIGHTS' },
            { label: '全部', value: 'FULL' },
          ]}
        />
        <ProFormDateRangePicker name="dateRange" label="同步日期" rules={[{ required: true }]} />
      </ModalForm>

      <ModalForm
        title={`创建 Mintegral 对象 ${createRecord?.name || ''}`}
        open={createOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setCreateOpen(false) }}
        initialValues={{
          type: 'campaign',
          payload: '{\n  \n}',
        }}
        onFinish={async (values) => {
          const ok = await handleCreate(values as CreateFormValues);
          if (ok) setCreateOpen(false);
          return ok;
        }}
      >
        <ProFormSelect
          name="type"
          label="创建类型"
          options={[
            { label: 'Campaign', value: 'campaign' },
            { label: 'Offer', value: 'offer' },
            { label: 'Creative Set', value: 'creative_set' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="payload"
          label="官方 JSON Payload"
          fieldProps={{ rows: 14 }}
          rules={[{ required: true }]}
        />
      </ModalForm>

      <ModalForm
        title={`绑定 Campaign 项目组 ${bindRecord?.name || bindRecord?.objectId || ''}`}
        open={bindOpen}
        modalProps={{ destroyOnHidden: true, onCancel: () => setBindOpen(false) }}
        onFinish={async (values) => {
          const ok = await handleBindCampaignGroup(values as { groupId?: string });
          if (ok) setBindOpen(false);
          return ok;
        }}
      >
        <ProFormText name="campaignId" label="Campaign ID" initialValue={bindRecord?.objectId} disabled />
        <ProFormText name="campaignName" label="Campaign 名称" initialValue={bindRecord?.name} disabled />
        <ProFormSelect
          name="groupId"
          label="项目组"
          allowClear={false}
          options={groupOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'label',
          }}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
};

export default PlatformPage;

