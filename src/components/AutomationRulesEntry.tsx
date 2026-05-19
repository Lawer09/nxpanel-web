import {
  AlertOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AutomationRulesEntry.module.less';
import {
  createAutomationRule,
  getAutomationRuleDetail,
  getAutomationRuleExecutions,
  getAutomationRules,
  runAutomationRule,
  updateAutomationRule,
  updateAutomationRuleStatus,
} from '@/services/automation-rules/api';
import { getTrafficAccounts, getTrafficPlatforms } from '@/services/traffic-platform/api';

const { Paragraph, Text } = Typography;

type ModuleKey = 'traffic_platform' | 'node_status' | 'sync_monitor' | 'account_health';
type MetricType = 'number' | 'enum' | 'string';
type ScopeFieldType = 'multi-select' | 'remote-multi-select' | 'switch';

type ScopeFieldSchema = {
  key: string;
  label: string;
  type: ScopeFieldType;
  source?: string;
};

type MetricConfig = {
  label: string;
  value: string;
  unit?: string;
  type: MetricType;
  operators: string[];
  options?: Array<{ label: string; value: string | number }>;
};

type ActionConfig = {
  label: string;
  value: string;
  hasTemplate?: boolean;
  description?: string;
};

type ModuleConfig = {
  label: string;
  module: ModuleKey;
  description: string;
  accent: string;
  defaultTargetType: string;
  targetTypes: Array<{ label: string; value: string }>;
  targetScopeSchema: ScopeFieldSchema[];
  metrics: MetricConfig[];
  actions: ActionConfig[];
};

type RuleFormValues = {
  name: string;
  description?: string;
  module: ModuleKey;
  targetType: string;
  enabled: boolean;
  targetScope: Record<string, any>;
  conditionLogic: 'all' | 'any';
  conditions: Array<{ metric: string; operator: string; value: any }>;
  actions: Array<{ type: string; template?: string; params?: Record<string, any> }>;
  cooldownSeconds: number;
  recoveryEnabled: boolean;
};

type ModuleStats = {
  total: number;
  enabled: number;
  todayExecutions: number;
  failed: number;
  latestTime?: string;
};

const OPERATOR_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '等于 (eq)', value: 'eq' },
  { label: '不等于 (neq)', value: 'neq' },
  { label: '大于 (gt)', value: 'gt' },
  { label: '大于等于 (gte)', value: 'gte' },
  { label: '小于 (lt)', value: 'lt' },
  { label: '小于等于 (lte)', value: 'lte' },
  { label: '包含于 (in)', value: 'in' },
  { label: '不包含于 (not_in)', value: 'not_in' },
  { label: '介于 (between)', value: 'between' },
];

const MODULE_CONFIGS: Record<ModuleKey, ModuleConfig> = {
  traffic_platform: {
    label: '代理平台',
    module: 'traffic_platform',
    description: '账户余额 / 同步 / 状态告警',
    accent: '#2563EB',
    defaultTargetType: 'traffic_platform_account',
    targetTypes: [{ label: '代理平台账户', value: 'traffic_platform_account' }],
    targetScopeSchema: [
      { key: 'platformCodes', label: '平台范围', type: 'multi-select', source: 'trafficPlatforms' },
      { key: 'accountIds', label: '账户范围', type: 'remote-multi-select', source: 'trafficPlatformAccounts' },
      { key: 'includeDisabled', label: '包含停用账户', type: 'switch' },
    ],
    metrics: [
      { label: '账户余额', value: 'balance_mb', unit: 'MB', type: 'number', operators: ['lte', 'lt', 'gte', 'gt', 'between'] },
      {
        label: '账户状态',
        value: 'account_status',
        type: 'enum',
        operators: ['eq', 'neq', 'in', 'not_in'],
        options: [
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
          { label: '异常', value: 'error' },
        ],
      },
      { label: '同步失败次数', value: 'sync_failed_count', unit: '次', type: 'number', operators: ['gte', 'gt', 'between'] },
      { label: '距离上次同步', value: 'last_sync_minutes', unit: '分钟', type: 'number', operators: ['gte', 'gt'] },
    ],
    actions: [{ label: 'Telegram 管理员通知', value: 'telegram_admin', hasTemplate: true, description: '触发规则后向管理员发送 Telegram 告警消息' }],
  },
  node_status: {
    label: '节点状态',
    module: 'node_status',
    description: '节点在线 / 延迟 / 负载告警',
    accent: '#0EA5E9',
    defaultTargetType: 'node',
    targetTypes: [{ label: '节点', value: 'node' }],
    targetScopeSchema: [
      { key: 'nodeIds', label: '节点范围', type: 'remote-multi-select', source: 'nodes' },
      { key: 'groupIds', label: '节点分组', type: 'multi-select', source: 'nodeGroups' },
      { key: 'regions', label: '区域', type: 'multi-select', source: 'regions' },
      { key: 'includeDisabled', label: '包含停用节点', type: 'switch' },
    ],
    metrics: [
      { label: '离线时长', value: 'offline_minutes', unit: '分钟', type: 'number', operators: ['gte', 'gt'] },
      { label: '节点延迟', value: 'latency_ms', unit: 'ms', type: 'number', operators: ['gte', 'gt', 'between'] },
      { label: '节点负载', value: 'load_percent', unit: '%', type: 'number', operators: ['gte', 'gt', 'between'] },
      {
        label: '节点状态',
        value: 'node_status',
        type: 'enum',
        operators: ['eq', 'neq', 'in', 'not_in'],
        options: [
          { label: '在线', value: 'online' },
          { label: '离线', value: 'offline' },
          { label: '维护', value: 'maintenance' },
        ],
      },
    ],
    actions: [{ label: 'Telegram 管理员通知', value: 'telegram_admin', hasTemplate: true }],
  },
  sync_monitor: {
    label: '同步监控',
    module: 'sync_monitor',
    description: '数据同步 / 任务执行告警',
    accent: '#7C3AED',
    defaultTargetType: 'sync_job',
    targetTypes: [{ label: '同步任务', value: 'sync_job' }],
    targetScopeSchema: [
      { key: 'jobTypes', label: '任务类型', type: 'multi-select', source: 'jobTypes' },
      { key: 'regions', label: '区域', type: 'multi-select', source: 'regions' },
      { key: 'includeDisabled', label: '包含停用任务', type: 'switch' },
    ],
    metrics: [
      { label: '失败次数', value: 'failed_count', unit: '次', type: 'number', operators: ['gte', 'gt', 'between'] },
      { label: '排队时长', value: 'queue_minutes', unit: '分钟', type: 'number', operators: ['gte', 'gt', 'between'] },
    ],
    actions: [{ label: 'Telegram 管理员通知', value: 'telegram_admin', hasTemplate: true }],
  },
  account_health: {
    label: '账户健康',
    module: 'account_health',
    description: '账户异常 / 可用性告警',
    accent: '#F97316',
    defaultTargetType: 'account',
    targetTypes: [{ label: '账户', value: 'account' }],
    targetScopeSchema: [
      { key: 'accountIds', label: '账户范围', type: 'remote-multi-select', source: 'trafficPlatformAccounts' },
      { key: 'regions', label: '区域', type: 'multi-select', source: 'regions' },
      { key: 'includeDisabled', label: '包含停用账户', type: 'switch' },
    ],
    metrics: [{ label: '异常次数', value: 'error_count', unit: '次', type: 'number', operators: ['gte', 'gt', 'between'] }],
    actions: [{ label: 'Telegram 管理员通知', value: 'telegram_admin', hasTemplate: true }],
  },
};

const DEFAULT_SCOPE_OPTIONS: Record<string, Array<{ label: string; value: string | number }>> = {
  trafficPlatforms: [],
  trafficPlatformAccounts: [],
  nodes: [],
  nodeGroups: [],
  regions: [
    { label: 'HK', value: 'HK' },
    { label: 'SG', value: 'SG' },
    { label: 'US', value: 'US' },
  ],
  jobTypes: [
    { label: 'daily_sync', value: 'daily_sync' },
    { label: 'hourly_sync', value: 'hourly_sync' },
  ],
};

const MODULE_KEYS = Object.keys(MODULE_CONFIGS) as ModuleKey[];

const extractRows = (raw: any): { rows: any[]; total: number } => {
  const payload = raw?.data ?? raw;
  if (Array.isArray(payload)) return { rows: payload, total: payload.length };
  const pageObj = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  const rows =
    (Array.isArray(pageObj?.data) && pageObj.data) ||
    (Array.isArray(pageObj?.list) && pageObj.list) ||
    (Array.isArray(pageObj?.rows) && pageObj.rows) ||
    [];
  const total = Number(pageObj?.total ?? pageObj?.count ?? pageObj?.totalCount ?? rows.length);
  return { rows, total };
};

const formatRelative = (time?: string) => {
  if (!time) return '-';
  const t = dayjs(time);
  if (!t.isValid()) return '-';
  const minutes = dayjs().diff(t, 'minute');
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = dayjs().diff(t, 'hour');
  if (hours < 24) return `${hours} 小时前`;
  return `${dayjs().diff(t, 'day')} 天前`;
};

const defaultRuleValues = (module: ModuleKey): RuleFormValues => {
  const cfg = MODULE_CONFIGS[module];
  return {
    module,
    name: '',
    description: '',
    targetType: cfg.defaultTargetType,
    enabled: true,
    targetScope: { includeDisabled: false },
    conditionLogic: 'all',
    conditions: [{ metric: cfg.metrics[0]?.value, operator: cfg.metrics[0]?.operators[0], value: undefined }],
    actions: [{ type: cfg.actions[0]?.value ?? 'telegram_admin', template: '' }],
    cooldownSeconds: 3600,
    recoveryEnabled: true,
  };
};

const statusBadgeColor = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'failed') return '#DC2626';
  if (s === 'recovered') return '#16A34A';
  if (s === 'triggered') return '#F97316';
  return '#94A3B8';
};

const AutomationRulesEntry: React.FC = () => {
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [moduleKey, setModuleKey] = useState<ModuleKey>('traffic_platform');
  const [rules, setRules] = useState<API.AutomationRuleItem[]>([]);
  const [rulesTotal, setRulesTotal] = useState(0);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<API.AutomationRuleItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [executions, setExecutions] = useState<API.AutomationRuleExecutionItem[]>([]);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [saving, setSaving] = useState(false);
  const [moduleStatsLoading, setModuleStatsLoading] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [enabled, setEnabled] = useState<number | undefined>(undefined);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>(undefined);
  const [rulePage, setRulePage] = useState(1);
  const [rulePageSize] = useState(8);
  const [execStatusFilter, setExecStatusFilter] = useState<string | undefined>(undefined);
  const [execKeyword, setExecKeyword] = useState('');

  const [sourceOptions, setSourceOptions] = useState(DEFAULT_SCOPE_OPTIONS);
  const [moduleStats, setModuleStats] = useState<Record<ModuleKey, ModuleStats>>({
    traffic_platform: { total: 0, enabled: 0, todayExecutions: 0, failed: 0 },
    node_status: { total: 0, enabled: 0, todayExecutions: 0, failed: 0 },
    sync_monitor: { total: 0, enabled: 0, todayExecutions: 0, failed: 0 },
    account_health: { total: 0, enabled: 0, todayExecutions: 0, failed: 0 },
  });

  const [form] = Form.useForm<RuleFormValues>();
  const moduleConfig = MODULE_CONFIGS[moduleKey];

  const loadScopeSources = useCallback(async (search?: string) => {
    try {
      const [platformRes, accountRes] = await Promise.all([
        getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 }),
        getTrafficAccounts({ enabled: 1, page: 1, pageSize: 200, keyword: search }),
      ]);
      const platforms = extractRows(platformRes).rows as API.TrafficPlatformItem[];
      const accounts = extractRows(accountRes).rows as API.TrafficAccountItem[];
      setSourceOptions((prev) => ({
        ...prev,
        trafficPlatforms: platforms.map((x) => ({ label: `${x.name} (${x.code})`, value: x.code })),
        trafficPlatformAccounts: accounts.map((x) => ({ label: `${x.accountName} (#${x.id})`, value: x.id })),
      }));
    } catch {
      // ignore
    }
  }, []);

  const loadRules = useCallback(async () => {
    if (!open) return;
    setRulesLoading(true);
    try {
      const res = await getAutomationRules({
        module: moduleKey,
        keyword: keyword || undefined,
        enabled,
        targetType: targetTypeFilter,
        page: rulePage,
        pageSize: rulePageSize,
      });
      const { rows, total } = extractRows(res);
      setRules(rows as API.AutomationRuleItem[]);
      setRulesTotal(total);
    } catch (error) {
      console.error(error);
      message.error('加载规则列表失败');
    } finally {
      setRulesLoading(false);
    }
  }, [enabled, keyword, message, moduleKey, open, rulePage, rulePageSize, targetTypeFilter]);

  const loadExecutions = useCallback(async (ruleId?: number) => {
    if (!open) return;
    setExecutionLoading(true);
    try {
      const res = await getAutomationRuleExecutions({
        module: moduleKey,
        ruleId,
        page: 1,
        pageSize: 50,
      });
      const { rows } = extractRows(res);
      setExecutions(rows as API.AutomationRuleExecutionItem[]);
    } catch (error) {
      console.error(error);
      message.error('加载执行记录失败');
    } finally {
      setExecutionLoading(false);
    }
  }, [message, moduleKey, open]);

  const loadModuleStats = useCallback(async () => {
    if (!open) return;
    setModuleStatsLoading(true);
    try {
      const nextStats = { ...moduleStats };
      for (const moduleName of MODULE_KEYS) {
        const [totalRes, enabledRes, execRes] = await Promise.all([
          getAutomationRules({ module: moduleName, page: 1, pageSize: 1 }),
          getAutomationRules({ module: moduleName, enabled: 1, page: 1, pageSize: 1 }),
          getAutomationRuleExecutions({ module: moduleName, page: 1, pageSize: 100 }),
        ]);
        const total = extractRows(totalRes).total;
        const enabledCount = extractRows(enabledRes).total;
        const execRows = extractRows(execRes).rows as API.AutomationRuleExecutionItem[];
        const today = dayjs().format('YYYY-MM-DD');
        const todayExecutions = execRows.filter((row) => dayjs(row.executed_at || row.executedAt).format('YYYY-MM-DD') === today).length;
        const failed = execRows.filter((row) => (row.status || '').toLowerCase() === 'failed').length;
        const latestTime = execRows[0]?.executed_at || execRows[0]?.executedAt;
        nextStats[moduleName] = { total, enabled: enabledCount, todayExecutions, failed, latestTime };
      }
      setModuleStats(nextStats);
    } catch (error) {
      console.error(error);
    } finally {
      setModuleStatsLoading(false);
    }
  }, [moduleStats, open]);

  const loadRuleDetail = useCallback(
    async (ruleId: number) => {
      setDetailLoading(true);
      try {
        const res = await getAutomationRuleDetail({ id: ruleId, module: moduleKey });
        const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        const values: RuleFormValues = {
          module: moduleKey,
          name: data?.name ?? '',
          description: data?.description ?? '',
          targetType: data?.targetType ?? moduleConfig.defaultTargetType,
          enabled: Number(data?.enabled ?? 0) === 1,
          targetScope: {
            ...(data?.targetScope || {}),
            includeDisabled: Number(data?.targetScope?.includeDisabled ?? 0) === 1,
          },
          conditionLogic: data?.conditionLogic === 'any' ? 'any' : 'all',
          conditions:
            Array.isArray(data?.conditions) && data.conditions.length > 0
              ? data.conditions
              : [{ metric: moduleConfig.metrics[0]?.value, operator: moduleConfig.metrics[0]?.operators[0], value: undefined }],
          actions:
            Array.isArray(data?.actions) && data.actions.length > 0
              ? data.actions
              : [{ type: moduleConfig.actions[0]?.value ?? 'telegram_admin', template: '' }],
          cooldownSeconds: Number(data?.cooldownSeconds ?? 0),
          recoveryEnabled: Number(data?.recoveryEnabled ?? 0) === 1,
        };
        setSelectedRule(data as API.AutomationRuleItem);
        form.setFieldsValue(values);
        loadExecutions(ruleId);
      } catch (error) {
        console.error(error);
        message.error('加载规则详情失败');
      } finally {
        setDetailLoading(false);
      }
    },
    [form, loadExecutions, message, moduleConfig, moduleKey],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedRule(null);
    form.setFieldsValue(defaultRuleValues(moduleKey));
    setKeyword('');
    setEnabled(undefined);
    setTargetTypeFilter(undefined);
    setRulePage(1);
    setExecStatusFilter(undefined);
    setExecKeyword('');
    setActiveTab('detail');
    if (moduleKey === 'traffic_platform' || moduleKey === 'account_health') {
      void loadScopeSources();
    }
  }, [form, loadScopeSources, moduleKey, open]);

  useEffect(() => {
    if (!open) return;
    void loadRules();
    void loadExecutions();
    void loadModuleStats();
  }, [loadExecutions, loadModuleStats, loadRules, open]);

  useEffect(() => {
    if (!open) return;
    void loadRules();
  }, [enabled, keyword, loadRules, moduleKey, rulePage, targetTypeFilter, open]);

  const refreshAll = async () => {
    await Promise.all([
      loadRules(),
      loadExecutions(selectedRule?.id ? Number(selectedRule.id) : undefined),
      loadModuleStats(),
    ]);
  };

  const validateBeforeSave = (values: RuleFormValues) => {
    if (!values.module) throw new Error('module 必填');
    if (!values.name) throw new Error('规则名称必填');
    if (!values.targetType) throw new Error('目标类型必填');
    if (!Array.isArray(values.conditions) || values.conditions.length < 1) throw new Error('至少配置一个 condition');
    if (!Array.isArray(values.actions) || values.actions.length < 1) throw new Error('至少配置一个 action');

    values.conditions.forEach((c) => {
      if (!c.metric) throw new Error('condition.metric 必填');
      if (!c.operator) throw new Error('condition.operator 必填');
      if (c.operator === 'between') {
        if (!Array.isArray(c.value) || c.value.length !== 2 || c.value[0] === undefined || c.value[1] === undefined) {
          throw new Error('between 条件必须填写开始值和结束值');
        }
      } else if (c.operator === 'in' || c.operator === 'not_in') {
        if (!Array.isArray(c.value) || c.value.length === 0) throw new Error('in/not_in 必须填写数组值');
      } else if (c.value === undefined || c.value === null || c.value === '') {
        throw new Error('条件值必填');
      }
    });
  };

  const normalizeScope = (scope: Record<string, any>) => {
    const next = { ...(scope || {}) };
    next.includeDisabled = next.includeDisabled ? 1 : 0;
    return next;
  };

  const handleSave = async (forceEnableWhenCreate = false) => {
    try {
      const values = await form.validateFields();
      validateBeforeSave(values);
      const payload: API.AutomationRuleUpsertBody = {
        module: moduleKey,
        name: values.name,
        description: values.description,
        targetType: values.targetType,
        targetScope: normalizeScope(values.targetScope),
        conditionLogic: values.conditionLogic,
        conditions: values.conditions,
        actions: values.actions,
        cooldownSeconds: Number(values.cooldownSeconds || 0),
        recoveryEnabled: values.recoveryEnabled ? 1 : 0,
        enabled: forceEnableWhenCreate ? 1 : values.enabled ? 1 : 0,
      };
      setSaving(true);
      const isEdit = !!selectedRule?.id;
      const res = isEdit
        ? await updateAutomationRule({ ...payload, id: Number(selectedRule?.id) })
        : await createAutomationRule(payload);
      if ((res as any)?.code !== 0) {
        message.error((res as any)?.msg || '保存失败');
        return;
      }
      message.success('规则已保存，将在下一轮调度中生效。');
      await refreshAll();
      if (isEdit && selectedRule?.id) {
        await loadRuleDetail(Number(selectedRule.id));
      } else {
        setSelectedRule(null);
        form.setFieldsValue(defaultRuleValues(moduleKey));
      }
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRuleStatus = async (rule: API.AutomationRuleItem) => {
    try {
      const res = await updateAutomationRuleStatus({
        module: moduleKey,
        id: Number(rule.id),
        enabled: Number(rule.enabled) === 1 ? 0 : 1,
      });
      if ((res as any)?.code !== 0) {
        message.error((res as any)?.msg || '状态更新失败');
        return;
      }
      message.success('规则状态已更新。');
      await refreshAll();
      if (selectedRule?.id === rule.id) {
        await loadRuleDetail(Number(rule.id));
      }
    } catch (error) {
      console.error(error);
      message.error('状态更新失败');
    }
  };

  const runRule = async (ruleId: number, dryRun: boolean) => {
    try {
      const scope = form.getFieldValue(['targetScope']) || {};
      const targetIds = (scope.accountIds || scope.nodeIds || scope.jobIds || []) as Array<string | number>;
      const res = await runAutomationRule({
        module: moduleKey,
        ruleId,
        targetIds: targetIds.map((x) => String(x)),
        dryRun: dryRun ? 1 : 0,
      });
      if ((res as any)?.code !== 0) {
        message.error((res as any)?.msg || '执行失败');
        return;
      }
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? {};
      const hit = Number(data?.hitCount ?? data?.matched ?? 0);
      const skipped = Number(data?.skippedCount ?? 0);
      const failed = Number(data?.failedCount ?? 0);
      message.success(dryRun ? '试运行成功' : '执行成功');
      modal.info({
        title: dryRun ? '试运行结果' : '执行结果',
        content: (
          <div>
            <div>命中目标数：{hit}</div>
            <div>跳过目标数：{skipped}</div>
            <div>失败目标数：{failed}</div>
            <div>动作是否实际执行：{dryRun ? '否' : '是'}</div>
          </div>
        ),
      });
      await refreshAll();
      if (selectedRule?.id) {
        await loadExecutions(Number(selectedRule.id));
      }
    } catch (error) {
      console.error(error);
      message.error('执行失败');
    }
  };

  const currentStats = moduleStats[moduleKey];

  const recentByRule = useMemo(() => {
    const map = new Map<number, API.AutomationRuleExecutionItem>();
    executions.forEach((item) => {
      const id = Number(item.rule_id ?? item.ruleId ?? 0);
      if (!id) return;
      if (!map.has(id)) map.set(id, item);
    });
    return map;
  }, [executions]);

  const visibleExecutions = useMemo(() => {
    return executions.filter((item) => {
      const status = (item.status || '').toLowerCase();
      const target = String(item.target_name || item.targetName || item.target_id || item.targetId || '').toLowerCase();
      if (execStatusFilter && status !== execStatusFilter) return false;
      if (execKeyword && !target.includes(execKeyword.toLowerCase())) return false;
      return true;
    });
  }, [execKeyword, execStatusFilter, executions]);

  const renderScopeField = (field: ScopeFieldSchema) => {
    if (field.type === 'switch') {
      return (
        <Form.Item key={field.key} name={['targetScope', field.key]} label={field.label} valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      );
    }
    const options = sourceOptions[field.source || ''] || [];
    const isRemote = field.type === 'remote-multi-select';
    return (
      <Form.Item key={field.key} name={['targetScope', field.key]} label={field.label}>
        <Select
          mode="multiple"
          allowClear
          placeholder={`请选择${field.label}`}
          options={options}
          showSearch={isRemote}
          filterOption={!isRemote}
          onSearch={
            isRemote && (field.source === 'trafficPlatformAccounts' || field.source === 'accountIds')
              ? (value) => {
                  void loadScopeSources(value);
                }
              : undefined
          }
        />
      </Form.Item>
    );
  };

  const getMetric = (value?: string) => moduleConfig.metrics.find((m) => m.value === value);

  const renderConditionValue = (index: number, metric?: MetricConfig, operator?: string) => {
    if (!metric || !operator) return <Input placeholder="请输入值" />;
    if (operator === 'between') {
      return (
        <Input.Group compact>
          <Form.Item noStyle name={['conditions', index, 'value', 0]}>
            <InputNumber style={{ width: '47%' }} placeholder="开始值" />
          </Form.Item>
          <span style={{ display: 'inline-block', width: '6%', textAlign: 'center' }}>~</span>
          <Form.Item noStyle name={['conditions', index, 'value', 1]}>
            <InputNumber style={{ width: '47%' }} placeholder="结束值" />
          </Form.Item>
        </Input.Group>
      );
    }
    if (operator === 'in' || operator === 'not_in') {
      if (metric.type === 'enum' && metric.options) return <Select mode="multiple" options={metric.options} />;
      return <Select mode="tags" tokenSeparators={[',']} placeholder="输入多个值" />;
    }
    if (metric.type === 'enum' && metric.options) return <Select options={metric.options} />;
    if (metric.type === 'number') return <InputNumber style={{ width: '100%' }} />;
    return <Input />;
  };

  return (
    <>
      <Button icon={<RobotOutlined />} onClick={() => setOpen(true)} className={styles.entryButton}>
        自动化策略
      </Button>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width="92vw"
        className={styles.modal}
        destroyOnHidden
        classNames={{ body: styles.modalBody }}
      >
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div>
                <div className={styles.headerTitle}>自动化策略配置</div>
                <div className={styles.headerSubtitle}>
                  统一管理不同业务模块的自动化规则、触发条件、执行动作与执行记录
                </div>
              </div>
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() =>
                    modal.info({
                      title: '使用说明',
                      content: '先选择模块，再选择规则并完成范围、条件、动作配置。所有请求均按当前模块隔离。',
                    })
                  }
                >
                  使用说明
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()}>
                  刷新
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className={styles.btnPrimary}
                  onClick={() => {
                    setSelectedRule(null);
                    setActiveTab('detail');
                    form.setFieldsValue(defaultRuleValues(moduleKey));
                  }}
                >
                  新建规则
                </Button>
                <Button onClick={() => setOpen(false)}>关闭</Button>
              </Space>
            </div>
          </div>

          <div className={styles.moduleSection}>
            <div className={styles.moduleSectionTitle}>选择模块</div>
            <Spin spinning={moduleStatsLoading}>
              <div className={styles.moduleGrid}>
                {MODULE_KEYS.map((key) => {
                  const cfg = MODULE_CONFIGS[key];
                  const active = key === moduleKey;
                  const stats = moduleStats[key];
                  return (
                    <div
                      key={key}
                      onClick={() => setModuleKey(key)}
                      className={`${styles.moduleCard} ${active ? styles.moduleCardActive : ''}`}
                      style={{ borderColor: active ? cfg.accent : undefined }}
                    >
                      <div className={styles.moduleCardHeader}>
                        <Text strong className={styles.moduleCardTitle}>{cfg.label}</Text>
                        <Badge color={cfg.accent} />
                      </div>
                      <div className={styles.moduleCardKey}>{cfg.module}</div>
                      <div className={styles.moduleCardDesc}>{cfg.description}</div>
                      <div className={styles.moduleCardStats}>规则 {stats.total} · 启用 {stats.enabled}</div>
                    </div>
                  );
                })}
              </div>
            </Spin>
          </div>

          <div className={styles.statsSection}>
            <Row gutter={12}>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div>
                      <Text type="secondary">启用规则</Text>
                      <div className={styles.statCardValue}>{currentStats.enabled} / {currentStats.total}</div>
                    </div>
                    <div className={styles.statIconWrapper} style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      <RobotOutlined style={{ color: '#2563EB' }} />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div>
                      <Text type="secondary">今日触发</Text>
                      <div className={styles.statCardValue}>{currentStats.todayExecutions} 次</div>
                    </div>
                    <div className={styles.statIconWrapper} style={{ background: '#ECFDF5', color: '#16A34A' }}>
                      <AlertOutlined style={{ color: '#16A34A' }} />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div>
                      <Text type="secondary">失败</Text>
                      <div className={`${styles.statCardValue} ${styles.statCardValueDanger}`}>{currentStats.failed} 次</div>
                    </div>
                    <div className={styles.statIconWrapper} style={{ background: '#FEF2F2', color: '#DC2626' }}>
                      <SafetyOutlined style={{ color: '#DC2626' }} />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" className={styles.statCard}>
                  <div className={styles.statCardContent}>
                    <div>
                      <Text type="secondary">最近执行</Text>
                      <div className={styles.statCardValue}>{formatRelative(currentStats.latestTime)}</div>
                    </div>
                    <div className={styles.statIconWrapper} style={{ background: '#F3E8FF', color: '#7C3AED' }}>
                      <ClockCircleOutlined style={{ color: '#7C3AED' }} />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          <div className={styles.mainContent}>
            <Card
              size="small"
              className={styles.leftPanel}
              classNames={{ body: styles.leftPanelBody }}
            >
              <Input
                allowClear
                placeholder="搜索规则名称 / 描述"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={() => {
                  setRulePage(1);
                  void loadRules();
                }}
              />
              <Space>
                <Select
                  style={{ width: 120 }}
                  placeholder="全部状态"
                  allowClear
                  value={enabled}
                  options={[
                    { label: '启用', value: 1 },
                    { label: '停用', value: 0 },
                  ]}
                  onChange={(value) => {
                    setEnabled(value);
                    setRulePage(1);
                  }}
                />
                <Select
                  style={{ flex: 1 }}
                  placeholder="全部目标类型"
                  allowClear
                  value={targetTypeFilter}
                  options={moduleConfig.targetTypes}
                  onChange={(value) => {
                    setTargetTypeFilter(value);
                    setRulePage(1);
                  }}
                />
                <Button icon={<ReloadOutlined />} onClick={() => void loadRules()} />
              </Space>

              <div className={styles.ruleListContainer}>
                <Spin spinning={rulesLoading}>
                  {rules.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无自动化规则（${moduleConfig.label}）`}>
                      <Button type="primary" onClick={() => form.setFieldsValue(defaultRuleValues(moduleKey))}>
                        新建规则
                      </Button>
                    </Empty>
                  ) : (
                    <List
                      split={false}
                      dataSource={rules}
                      renderItem={(rule) => {
                        const active = selectedRule?.id === rule.id;
                        const recent = recentByRule.get(Number(rule.id));
                        const status = Number(rule.enabled) === 1 ? '启用' : '停用';
                        const statusColor = Number(rule.enabled) === 1 ? '#16A34A' : '#94A3B8';
                        const recentStatus = (recent?.status || '').toLowerCase();
                        const hasRecentFailed = recentStatus === 'failed';
                        const cond = Array.isArray(rule.conditions) && rule.conditions[0] ? `${rule.conditions[0].metric} ${rule.conditions[0].operator}` : '未配置';
                        const act = Array.isArray(rule.actions) ? rule.actions.map((a: any) => a.type).join(', ') : '未配置';
                        return (
                          <List.Item style={{ padding: 0, marginBottom: 8 }}>
                            <Card
                              size="small"
                              hoverable
                              onClick={() => {
                                setActiveTab('detail');
                                void loadRuleDetail(Number(rule.id));
                              }}
                              className={`${styles.ruleCard} ${active ? styles.ruleCardActive : ''} ${hasRecentFailed ? styles.ruleCardFailed : ''}`}
                              style={{ borderColor: active && !hasRecentFailed ? moduleConfig.accent : undefined }}
                              classNames={{ body: styles.ruleCardBody }}
                            >
                              <div className={styles.ruleCardHeader}>
                                <Space size={6}>
                                  <Badge color={statusColor} />
                                  <Text strong>{rule.name}</Text>
                                </Space>
                                <Dropdown
                                  trigger={['click']}
                                  menu={{
                                    items: [
                                      { key: 'edit', label: '编辑' },
                                      { key: 'copy', label: '复制规则' },
                                      { key: 'run', label: '手动执行' },
                                      { key: 'toggle', label: Number(rule.enabled) === 1 ? '停用' : '启用' },
                                      { key: 'executions', label: '查看执行记录' },
                                    ],
                                    onClick: ({ key }) => {
                                      if (key === 'edit') void loadRuleDetail(Number(rule.id));
                                      if (key === 'copy') {
                                        setSelectedRule(null);
                                        form.setFieldsValue({ ...defaultRuleValues(moduleKey), ...rule, enabled: false, name: `${rule.name}-复制` } as any);
                                      }
                                      if (key === 'run') void runRule(Number(rule.id), true);
                                      if (key === 'toggle') void handleToggleRuleStatus(rule);
                                      if (key === 'executions') {
                                        setSelectedRule(rule);
                                        setActiveTab('executions');
                                        void loadExecutions(Number(rule.id));
                                      }
                                    },
                                  }}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} />
                                </Dropdown>
                              </div>
                              <div className={styles.ruleTags}>
                                <Tag color={Number(rule.enabled) === 1 ? 'success' : 'default'}>{status}</Tag>
                                <Tag color="blue">{moduleConfig.module}</Tag>
                                <Tag>{rule.targetType}</Tag>
                              </div>
                              <div className={styles.ruleTextSecondary} style={{ marginTop: 8 }}>条件：{cond}</div>
                              <div className={styles.ruleTextSecondary}>动作：{act}</div>
                              <div className={styles.ruleTextSecondary} style={{ marginTop: 4 }}>
                                冷却：{Number(rule.cooldownSeconds || 0)} 秒 · 恢复通知：{Number(rule.recoveryEnabled) === 1 ? '开启' : '关闭'}
                              </div>
                              <div className={styles.ruleTextMuted}>最近执行：{formatRelative(recent?.executed_at || recent?.executedAt)}</div>
                            </Card>
                          </List.Item>
                        );
                      }}
                    />
                  )}
                </Spin>
              </div>
              <div className={styles.paginationWrapper}>
                <Pagination
                  current={rulePage}
                  pageSize={rulePageSize}
                  total={rulesTotal}
                  size="small"
                  showSizeChanger={false}
                  showTotal={(t) => `共 ${t} 条`}
                  onChange={(page) => setRulePage(page)}
                />
              </div>
            </Card>

            <Card
              size="small"
              className={styles.rightPanel}
              classNames={{ body: styles.rightPanelBody }}
            >
              <div className={styles.ruleCardHeader}>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    { key: 'detail', label: '规则详情' },
                    { key: 'executions', label: '执行记录' },
                    { key: 'history', label: '触发历史' },
                    { key: 'changes', label: '变更记录' },
                  ]}
                />
                <Space size={14}>
                  <Text type="secondary">规则 ID：{selectedRule?.id ? `#${selectedRule.id}` : '-'}</Text>
                  <Text type="secondary">创建时间：{selectedRule?.createdAt || '-'}</Text>
                </Space>
              </div>

              <div className={styles.rightPanelContent}>
                {activeTab === 'detail' ? (
                  <Spin spinning={detailLoading}>
                    {!selectedRule && !form.getFieldValue('name') ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="请选择一条规则进行查看或编辑，也可以点击“新建规则”创建自动化策略"
                      />
                    ) : (
                      <Form<RuleFormValues> form={form} layout="vertical" initialValues={defaultRuleValues(moduleKey)}>
                        <Row gutter={12}>
                          <Col span={10}>
                            <Card size="small" title="基础信息" className={styles.formCard}>
                              <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
                                <Input />
                              </Form.Item>
                              <Form.Item name="description" label="规则描述">
                                <Input.TextArea rows={2} />
                              </Form.Item>
                              <Form.Item label="所属模块">
                                <Input value={`${moduleConfig.module} ${moduleConfig.label}`} disabled />
                              </Form.Item>
                              <Form.Item
                                name="targetType"
                                label="目标类型"
                                rules={[{ required: true, message: '请选择目标类型' }]}
                              >
                                {moduleConfig.targetTypes.length === 1 ? (
                                  <Input value={moduleConfig.targetTypes[0].label} disabled />
                                ) : (
                                  <Select options={moduleConfig.targetTypes} />
                                )}
                              </Form.Item>
                              <Form.Item name="enabled" label="当前状态" valuePropName="checked">
                                <Switch checkedChildren="启用" unCheckedChildren="停用" />
                              </Form.Item>
                            </Card>

                            <Card size="small" title="触发条件" className={styles.formCard}>
                              <Form.Item name="conditionLogic" label="条件关系">
                                <Segmented
                                  options={[
                                    { label: '满足全部 all', value: 'all' },
                                    { label: '满足任一 any', value: 'any' },
                                  ]}
                                />
                              </Form.Item>
                              <Form.List name="conditions">
                                {(fields, { add, remove }) => (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {fields.map((field) => {
                                      const metricValue = form.getFieldValue(['conditions', field.name, 'metric']);
                                      const operatorValue = form.getFieldValue(['conditions', field.name, 'operator']);
                                      const metric = getMetric(metricValue);
                                      return (
                                        <Card key={field.key} size="small" className={styles.conditionCard}>
                                          <Row gutter={8}>
                                            <Col span={8}>
                                              <Form.Item
                                                {...field}
                                                name={[field.name, 'metric']}
                                                label="指标"
                                                rules={[{ required: true, message: '请选择指标' }]}
                                              >
                                                <Select
                                                  options={moduleConfig.metrics.map((x) => ({ label: x.label, value: x.value }))}
                                                  onChange={() => {
                                                    form.setFieldValue(['conditions', field.name, 'operator'], undefined);
                                                    form.setFieldValue(['conditions', field.name, 'value'], undefined);
                                                  }}
                                                />
                                              </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                              <Form.Item
                                                {...field}
                                                name={[field.name, 'operator']}
                                                label="操作符"
                                                rules={[{ required: true, message: '请选择操作符' }]}
                                              >
                                                <Select
                                                  options={OPERATOR_OPTIONS.filter((op) => metric?.operators.includes(op.value))}
                                                  onChange={() => form.setFieldValue(['conditions', field.name, 'value'], undefined)}
                                                />
                                              </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                              <Form.Item label={`值${metric?.unit ? ` (${metric.unit})` : ''}`}>
                                                {renderConditionValue(field.name, metric, operatorValue)}
                                              </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                              <Button danger type="link" onClick={() => remove(field.name)}>
                                                删除
                                              </Button>
                                            </Col>
                                          </Row>
                                        </Card>
                                      );
                                    })}
                                    <Button
                                      type="dashed"
                                      icon={<PlusOutlined />}
                                      onClick={() =>
                                        add({
                                          metric: moduleConfig.metrics[0]?.value,
                                          operator: moduleConfig.metrics[0]?.operators[0],
                                        })
                                      }
                                    >
                                      添加条件
                                    </Button>
                                  </div>
                                )}
                              </Form.List>
                            </Card>

                            <Card size="small" title="执行控制" className={styles.formCard} style={{ marginBottom: 0 }}>
                              <Form.Item
                                name="cooldownSeconds"
                                label="冷却时间（秒）"
                                rules={[{ required: true, message: '请输入冷却时间' }]}
                                extra={`≈ ${Math.floor(Number(form.getFieldValue('cooldownSeconds') || 0) / 60)} 分钟`}
                              >
                                <InputNumber min={0} style={{ width: '100%' }} />
                              </Form.Item>
                              <Form.Item name="recoveryEnabled" label="恢复通知" valuePropName="checked">
                                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                              </Form.Item>
                              <Space>
                                <Button icon={<ExperimentOutlined />} disabled={!selectedRule?.id} onClick={() => selectedRule?.id && void runRule(Number(selectedRule.id), true)}>
                                  试运行 dryRun
                                </Button>
                                <Button disabled={!selectedRule?.id} onClick={() => selectedRule?.id && void runRule(Number(selectedRule.id), false)}>
                                  立即执行
                                </Button>
                              </Space>
                            </Card>
                          </Col>

                          <Col span={14}>
                            <Card size="small" title="作用范围" className={styles.formCard}>
                              <Row gutter={12}>
                                {moduleConfig.targetScopeSchema.map((field) => (
                                  <Col span={field.type === 'switch' ? 24 : 12} key={field.key}>
                                    {renderScopeField(field)}
                                  </Col>
                                ))}
                              </Row>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                未配置明确范围时，默认作用于当前模块下可用目标。
                              </Text>
                            </Card>

                            <Card size="small" title="执行动作" className={styles.formCard}>
                              <Form.List name="actions">
                                {(fields, { add, remove }) => (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {fields.map((field) => {
                                      const type = form.getFieldValue(['actions', field.name, 'type']);
                                      const actionCfg = moduleConfig.actions.find((x) => x.value === type);
                                      return (
                                        <Card key={field.key} size="small" className={styles.conditionCard}>
                                          <Row gutter={10}>
                                            <Col span={7}>
                                              <Form.Item
                                                {...field}
                                                name={[field.name, 'type']}
                                                label="动作类型"
                                                rules={[{ required: true, message: '请选择动作类型' }]}
                                              >
                                                <Select options={moduleConfig.actions.map((x) => ({ label: x.label, value: x.value }))} />
                                              </Form.Item>
                                            </Col>
                                            <Col span={15}>
                                              <Form.Item {...field} name={[field.name, 'template']} label="通知模板">
                                                <Input.TextArea rows={2} placeholder="[告警] {target_name} ..." />
                                              </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                              <Button danger type="link" onClick={() => remove(field.name)}>
                                                删除
                                              </Button>
                                            </Col>
                                          </Row>
                                          {actionCfg?.description ? <Text type="secondary">{actionCfg.description}</Text> : null}
                                        </Card>
                                      );
                                    })}
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ type: moduleConfig.actions[0]?.value })}>
                                      添加动作
                                    </Button>
                                  </div>
                                )}
                              </Form.List>
                            </Card>

                            <Card size="small" title="最近执行记录" className={styles.formCard} style={{ marginBottom: 0 }}>
                              <Space style={{ marginBottom: 10 }}>
                                <Select
                                  style={{ width: 160 }}
                                  placeholder="全部状态"
                                  allowClear
                                  value={execStatusFilter}
                                  options={[
                                    { label: 'triggered', value: 'triggered' },
                                    { label: 'recovered', value: 'recovered' },
                                    { label: 'skipped', value: 'skipped' },
                                    { label: 'failed', value: 'failed' },
                                  ]}
                                  onChange={setExecStatusFilter}
                                />
                                <Input
                                  style={{ width: 220 }}
                                  allowClear
                                  placeholder="搜索目标 ID / 名称"
                                  value={execKeyword}
                                  onChange={(e) => setExecKeyword(e.target.value)}
                                />
                                <Button icon={<ReloadOutlined />} onClick={() => selectedRule?.id && void loadExecutions(Number(selectedRule.id))} />
                              </Space>
                              <Spin spinning={executionLoading}>
                                <List
                                  size="small"
                                  dataSource={visibleExecutions.slice(0, 6)}
                                  renderItem={(item) => (
                                    <List.Item>
                                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space size={10}>
                                          <Badge color={statusBadgeColor(item.status)} text={item.status || '-'} />
                                          <Text>{item.target_name || item.targetName || '-'}</Text>
                                          <Text type="secondary">{item.rule_name || item.ruleName || '-'}</Text>
                                        </Space>
                                        <Tooltip title={item.error_message || item.errorMessage || '执行成功'}>
                                          <Text type="secondary">{formatRelative(item.executed_at || item.executedAt)}</Text>
                                        </Tooltip>
                                      </Space>
                                    </List.Item>
                                  )}
                                />
                              </Spin>
                            </Card>
                          </Col>
                        </Row>
                      </Form>
                    )}
                  </Spin>
                ) : activeTab === 'executions' ? (
                  <Spin spinning={executionLoading}>
                    <Space style={{ marginBottom: 12 }} wrap>
                      <Select
                        style={{ width: 150 }}
                        placeholder="状态"
                        allowClear
                        value={execStatusFilter}
                        options={[
                          { label: 'triggered', value: 'triggered' },
                          { label: 'recovered', value: 'recovered' },
                          { label: 'skipped', value: 'skipped' },
                          { label: 'failed', value: 'failed' },
                        ]}
                        onChange={setExecStatusFilter}
                      />
                      <Input
                        style={{ width: 240 }}
                        allowClear
                        value={execKeyword}
                        placeholder="搜索目标 ID / 名称"
                        onChange={(e) => setExecKeyword(e.target.value)}
                      />
                      <Button icon={<ReloadOutlined />} onClick={() => selectedRule?.id && void loadExecutions(Number(selectedRule.id))}>
                        刷新
                      </Button>
                    </Space>
                    <List
                      dataSource={visibleExecutions}
                      renderItem={(item) => (
                        <List.Item>
                          <div style={{ width: '100%' }}>
                            <div className={styles.ruleCardHeader}>
                              <Space>
                                <Badge color={statusBadgeColor(item.status)} text={item.status || '-'} />
                                <Text strong>{item.rule_name || item.ruleName || '-'}</Text>
                                <Text>{item.target_name || item.targetName || '-'}</Text>
                              </Space>
                              <Text type="secondary">{item.executed_at || item.executedAt || '-'}</Text>
                            </div>
                            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                              {item.error_message || item.errorMessage || '执行成功'}
                            </Paragraph>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Spin>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该 Tab 预留扩展中" />
                )}
              </div>
            </Card>
          </div>

          <div className={styles.footer}>
            <Space className={styles.footerInfo} split={<span style={{ color: '#CBD5E1' }}>|</span>}>
              <Text type="secondary">当前模块：{moduleConfig.label} {moduleConfig.module}</Text>
              <Text type="secondary">规则 ID：{selectedRule?.id ? `#${selectedRule.id}` : '新建中'}</Text>
              <Text type="secondary">最后更新：{selectedRule?.updatedAt || '-'}</Text>
              <Text type="secondary">状态：{selectedRule?.enabled ? '已启用' : '停用 / 未保存'}</Text>
            </Space>
            <Space>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button
                icon={<ExperimentOutlined />}
                disabled={!selectedRule?.id}
                onClick={() => selectedRule?.id && void runRule(Number(selectedRule.id), true)}
              >
                试运行
              </Button>
              <Button type="primary" loading={saving} className={styles.btnPrimary} onClick={() => void handleSave(!selectedRule?.id)}>
                {selectedRule?.id ? '保存更改' : '创建并启用'}
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AutomationRulesEntry;
