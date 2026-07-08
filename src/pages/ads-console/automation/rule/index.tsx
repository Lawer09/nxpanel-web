import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import {getAutomationHistoryPage} from '@/services/ads-console/automation/history';
import {
    addAutomationRule,
    deleteAutomationRule,
    evaluateAutomationRule,
    type EvaluateAutomationRuleResponse,
    getAutomationOwnershipLevels,
    getAutomationRuleDetail,
    getAutomationRulePage,
    getAutomationScopeRefs,
    getAutomationScopeLevels,
    getAutomationTargetTypes,
    testFeishuWebhook,
    type AutomationRuleCondition,
    updateAutomationRule,
    updateAutomationRuleStatus,
} from '@/services/ads-console/automation/rule';
import {type ActionType, type ProColumns, ProTable} from '@ant-design/pro-components';
import {
    App,
    Badge,
    Button,
    Card,
    DatePicker,
    Descriptions,
    Drawer,
    Empty,
    Form,
    Input,
    InputNumber,
    List,
    Modal,
    Pagination,
    Popconfirm,
    Select,
    Space,
    Spin,
    Switch,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import {useModel} from '@umijs/max';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import dayjs from 'dayjs';

const drawerBodyStyle: React.CSSProperties = {
    background: '#ffffff',
    padding: 20,
};

const formShellStyle: React.CSSProperties = {
    maxWidth: 820,
    margin: '0 auto',
};

const configCardStyle: React.CSSProperties = {
    marginBottom: 16,
    borderRadius: 18,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
};

const detailCardStyle: React.CSSProperties = {
    ...configCardStyle,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
};

const configCardHeadStyle: React.CSSProperties = {
    minHeight: 72,
    padding: '0 22px',
    background: '#ffffff',
    borderBottom: '1px solid #edf0f4',
};

const configCardBodyStyle: React.CSSProperties = {
    padding: '22px 22px 24px',
    background: '#ffffff',
};

const metricLabelMap: Record<string, string> = {
    SPEND: 'Spend',
    IMPRESSIONS: 'Impressions',
    CLICKS: 'Clicks',
    REACH: 'Reach',
    RESULT: 'Result',
    CTR: 'CTR',
    CPC: 'CPC',
    CPM: 'CPM',
    CPA: 'CPA',
    ROAS: 'ROAS',
};

const metricOptions = ['SPEND', 'IMPRESSIONS', 'CLICKS', 'REACH', 'RESULT', 'CTR', 'CPC', 'CPM', 'CPA', 'ROAS']
    .map((value) => ({label: metricLabelMap[value] || value, value}));

const metricUnitMap: Record<string, string> = {
    SPEND: 'USD',
    CPC: 'USD',
    CPM: 'USD',
    CPA: 'USD',
    ROAS: 'x',
    CTR: '%',
    IMPRESSIONS: '个',
    CLICKS: '个',
    REACH: '个',
    RESULT: '个',
};

const operatorOptions = [
    {label: '大于', value: 'GT'},
    {label: '小于', value: 'LT'},
    {label: '等于', value: 'EQ'},
];

const operatorLabelMap: Record<string, string> = {
    GT: '大于',
    LT: '小于',
    EQ: '等于',
};

const targetTypeLabelMap: Record<string, string> = {
    ACCOUNT: '账户',
    CAMPAIGN: '广告系列',
    ADSET: '广告组',
    AD: '广告',
};

const targetObjectTypeLabelMap: Record<string, string> = {
    ACCOUNT: '账户',
    CAMPAIGN: '广告系列',
    ADSET: '广告组',
    AD: '广告',
};

const scopeLevelLabelMap: Record<string, string> = {
    SELF: '账户',
    TEAM: '团队',
    AGENCY: '代理商',
    GROUP: '项目组',
};

const allSelectValue = 'ALL';

const ownershipLevelLabelMap: Record<string, string> = {
    SELF: '仅自己',
    TEAM: '所属团队',
    AGENCY: '所属代理商',
    GROUP: '所属项目组',
};

const actionTypeLabelMap: Record<string, string> = {
    PAUSE: '暂停',
    ENABLE: '开启',
    NONE: '无动作（仅通知）',
};

const observeRangeOptions = [
    {label: '当天', value: '0,0'},
    {label: '近3天', value: '-2,0'},
    {label: '近7天', value: '-6,0'},
    {label: '近一个月', value: '-29,0'},
    {label: '近三个月', value: '-89,0'},
    {label: '起始日期（到今天）', value: 'from_date'},
    {label: '自定义日期', value: 'custom'},
];

const executionStatusLabelMap: Record<string, string> = {
    PENDING: '待执行',
    RUNNING: '执行中',
    WAITING_RETRY: '等待重试',
    SUCCESS: '执行成功',
    PARTIAL_SUCCESS: '部分成功',
    FAILED: '执行失败',
    SKIPPED: '已跳过',
};

const actionTagColorMap: Record<string, string> = {
    PAUSE: 'orange',
    ENABLE: 'green',
    NONE: 'default',
};

const formatMetricLabel = (metricType?: string) => {
    if (!metricType) {
        return '-';
    }
    if (metricType === 'targetEvent') {
        return '目标事件';
    }
    return metricLabelMap[metricType] || metricType;
};

const formatConditionText = (condition?: AutomationRuleCondition | any) => {
    if (!condition) {
        return '-';
    }
    const metric = formatMetricLabel(condition?.metricType);
    const operator = operatorLabelMap[condition?.operatorType] || condition?.operatorType || '-';
    const unit = metricUnitMap[condition?.metricType] || '';
    const threshold = condition?.thresholdValue == null ? '-' : unit ? `${condition.thresholdValue} ${unit}` : condition.thresholdValue;
    return `${metric} ${operator} ${threshold}`;
};

const parseMetricSnapshot = (metricSnapshot?: string) => {
    if (!metricSnapshot) {
        return undefined;
    }
    try {
        return JSON.parse(metricSnapshot);
    } catch (error) {
        return undefined;
    }
};

const formatReasonLines = (reason?: string) => {
    if (!reason) {
        return ['-'];
    }
    return reason.split(' 且 ').filter(Boolean);
};

const RulePage: React.FC = () => {
    const actionRef = useRef<ActionType | undefined>(undefined);
    const skipNextScopeReloadRef = useRef(false);
    const editingRequestIdRef = useRef(0);
    const {message} = App.useApp();
    const {initialState} = useModel('@@initialState');
    const currentUser = initialState?.currentUser as AdsConsole.CurrentUser | undefined;
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [form] = Form.useForm();

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyRuleId, setHistoryRuleId] = useState<string | null>(null);
    const [historyPagination, setHistoryPagination] = useState({current: 1, pageSize: 20, total: 0});
    const [historyFilters, setHistoryFilters] = useState<{ targetType?: string; targetObjectId?: string }>({});

    const [evaluateRunningId, setEvaluateRunningId] = useState<string | null>(null);
    const [feishuTestLoading, setFeishuTestLoading] = useState(false);
    const [evaluateModalOpen, setEvaluateModalOpen] = useState(false);
    const [evaluateLoading, setEvaluateLoading] = useState(false);
    const [evaluateExecuting, setEvaluateExecuting] = useState(false);
    const [evaluateRuleId, setEvaluateRuleId] = useState<string | null>(null);
    const [evaluateResult, setEvaluateResult] = useState<EvaluateAutomationRuleResponse | null>(null);
    const [evaluatePage, setEvaluatePage] = useState({current: 1, pageSize: 20});
    const [scopeRefHydrating, setScopeRefHydrating] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any | null>(null);
    const [tableFilters, setTableFilters] = useState<{ status?: number; name?: string }>({});

    const [scopeLevels, setScopeLevels] = useState<AdsConsole.SelectOption[]>([]);
    const [ownershipLevels, setOwnershipLevels] = useState<AdsConsole.SelectOption[]>([]);
    const [targetTypes, setTargetTypes] = useState<AdsConsole.SelectOption[]>([]);
    const [scopeRefOptions, setScopeRefOptions] = useState<AdsConsole.SelectOption[]>([]);
    const [scopeRefLoading, setScopeRefLoading] = useState(false);
    const targetType = Form.useWatch('targetType', form);
    const conditions = Form.useWatch('conditions', form);
    const observeRangePreset = Form.useWatch('observeRangePreset', form);
    const ownershipLevel = Form.useWatch('ownershipLevel', form);
    const scopeLevel = Form.useWatch('scopeLevel', form);

    const actionOptions = useMemo(
        () => [
            {label: '暂停', value: 'PAUSE'},
            {label: '开启', value: 'ENABLE'},
            {label: '无动作（仅通知）', value: 'NONE'},
        ],
        [],
    );

    const currentUserId = currentUser?.userId || currentUser?.id;
    const currentUserName = currentUser?.realName || currentUser?.username || '-';
    const currentTeamName = currentUser?.teamName;
    const currentAgencyNames = currentUser?.agencyNames || [];
    const currentGroupNames = currentUser?.groupNames || [];

    const resolveLevelNames = (level?: string) => {
        if (!level) {
            return '-';
        }
        if (level === 'SELF') {
            return currentUserName;
        }
        if (level === 'TEAM') {
            return currentTeamName || '-';
        }
        if (level === 'AGENCY') {
            return currentAgencyNames.length ? currentAgencyNames.join('、') : '-';
        }
        if (level === 'GROUP') {
            return currentGroupNames.length ? currentGroupNames.join('、') : '-';
        }
        return '-';
    };

    const loadOptions = async () => {
        const [sl, ol, tt] = await Promise.all([
            getAutomationScopeLevels(),
            getAutomationOwnershipLevels(),
            getAutomationTargetTypes(),
        ]);
        setScopeLevels(sl?.data || []);
        setOwnershipLevels(ol?.data || []);
        setTargetTypes(tt?.data || []);
    };

    const loadScopeRefs = async (nextScopeLevel?: string, selectedValues?: string[]) => {
        if (!nextScopeLevel) {
            setScopeRefOptions([]);
            return;
        }
        setScopeRefLoading(true);
        try {
            const res = await getAutomationScopeRefs({
                scopeLevel: nextScopeLevel,
            });
            const options = res?.data || [];
            setScopeRefOptions(options);
            skipNextScopeReloadRef.current = false;
            if (selectedValues) {
                form.setFieldValue('scopeRefs', selectedValues);
            }
        } finally {
            setScopeRefLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        if (!scopeLevel) {
            setScopeRefOptions([]);
            return;
        }
        if (!open || scopeRefHydrating) {
            return;
        }
        if (skipNextScopeReloadRef.current) {
            skipNextScopeReloadRef.current = false;
            return;
        }
        form.setFieldValue('scopeRefs', []);
        loadScopeRefs(scopeLevel);
    }, [scopeLevel, open]);

    const closeDrawer = () => {
        editingRequestIdRef.current += 1;
        setOpen(false);
        setDrawerLoading(false);
        setScopeRefHydrating(false);
    };

    const openCreate = () => {
        setEditingId(null);
        setDrawerLoading(false);
        setScopeRefHydrating(false);
        skipNextScopeReloadRef.current = false;
        setScopeRefOptions([]);
        form.resetFields();
        form.setFieldsValue({
            status: 1,
            conditions: [{metricType: 'SPEND', operatorType: 'GT', thresholdValue: 0, sortOrder: 1}],
            actionType: 'NONE',
            retryTimes: 1,
            windowType: 'TODAY',
            observeRangePreset: '0,0',
            observeDateRange: [dayjs(), dayjs()],
            feishuWebhook: undefined,
        });
        setOpen(true);
    };

    const openEdit = async (id: string) => {
        const requestId = editingRequestIdRef.current + 1;
        editingRequestIdRef.current = requestId;
        setEditingId(id);
        setDrawerLoading(true);
        setOpen(true);
        setScopeRefHydrating(true);
        skipNextScopeReloadRef.current = true;
        setScopeRefOptions([]);
        form.resetFields();
        try {
            const res = await getAutomationRuleDetail(id);
            if (editingRequestIdRef.current !== requestId) {
                return;
            }
            if (!res?.success) {
                message.error(res?.errorMessage || '加载详情失败');
                return;
            }
            const data = {...(res.data || {})} as any;
            const isCustomWindow = data.windowType === 'CUSTOM';
            const startDateText = data.observeStartDate;
            const endDateText = data.observeEndDate;
            const today = dayjs().format('YYYY-MM-DD');
            const presetValueForCustom = (startDateText && endDateText)
                ? observeRangeOptions.find((item) => {
                    if (item.value === 'custom') return false;
                    const [startStr, endStr] = item.value.split(',');
                    const start = dayjs().add(Number(startStr), 'day').format('YYYY-MM-DD');
                    const end = dayjs().add(Number(endStr), 'day').format('YYYY-MM-DD');
                    return start === startDateText && end === endDateText;
                })?.value
                : undefined;
            const presetValue = isCustomWindow
                ? (presetValueForCustom ?? 'custom')
                : data.windowType === 'FROM_DATE'
                    ? 'from_date'
                    : (data.windowType === 'LAST_3_DAYS' ? '-2,0' : data.windowType === 'LAST_7_DAYS' ? '-6,0' : '0,0');
            const rangeValue = isCustomWindow
                ? [dayjs(startDateText || today), dayjs(endDateText || today)]
                : [dayjs(), dayjs()];
            form.setFieldsValue({
                ...data,
                scopeRefs: Array.isArray(data.scopeRefs) ? data.scopeRefs : [],
                conditions: Array.isArray(data.conditions) && data.conditions.length > 0
                    ? data.conditions
                    : [{
                        metricType: data.metricType || 'SPEND',
                        operatorType: data.operatorType || 'GT',
                        thresholdValue: data.thresholdValue ?? 0,
                        sortOrder: 1,
                    }],
                windowType: data.windowType || 'TODAY',
                observeRangePreset: presetValue,
                observeDateRange: rangeValue,
                observeFromDate: data.windowType === 'FROM_DATE' && data.observeStartDate ? dayjs(data.observeStartDate) : undefined,
                retryTimes: data.retryTimes ?? 1,
                feishuWebhook: data.feishuWebhook,
            });
            await loadScopeRefs(
                data.scopeLevel,
                Array.isArray(data.scopeRefs) ? data.scopeRefs : [],
            );
            if (editingRequestIdRef.current !== requestId) {
                return;
            }
        } finally {
            if (editingRequestIdRef.current === requestId) {
                setScopeRefHydrating(false);
                setDrawerLoading(false);
            }
        }
    };

    const openHistory = async (id: string) => {
        setHistoryRuleId(id);
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryFilters({});
        const res = await getAutomationHistoryPage({current: 1, size: historyPagination.pageSize, ruleId: id});
        if (res?.success) {
            setHistoryData(res.data?.records || []);
            setHistoryPagination((prev) => ({
                ...prev,
                current: 1,
                total: res.data?.total || 0,
            }));
        } else {
            setHistoryData([]);
            setHistoryPagination((prev) => ({...prev, current: 1, total: 0}));
            message.error(res?.errorMessage || '加载历史失败');
        }
        setHistoryLoading(false);
    };

    const openDetail = async (record: any) => {
        setDetailOpen(true);
        setDetailLoading(true);
        setDetailData(null);
        try {
            const res = await getAutomationRuleDetail(record.id);
            if (!res?.success) {
                message.error(res?.errorMessage || '加载规则详情失败');
                return;
            }
            setDetailData(res.data || null);
        } finally {
            setDetailLoading(false);
        }
    };

    const submit = async () => {
        const values = await form.validateFields();
        const normalizedConditions: AutomationRuleCondition[] = (Array.isArray(values.conditions) ? values.conditions : [])
            .map((item: any, index: number) => ({
                metricType: item?.metricType,
                operatorType: item?.operatorType,
                thresholdValue: item?.thresholdValue,
                sortOrder: index + 1,
            }))
            .filter((item: AutomationRuleCondition) => item.metricType && item.operatorType && item.thresholdValue != null);
        let windowType = 'TODAY';
        let observeStartDate: string | undefined;
        let observeEndDate: string | undefined;
        if (values.observeRangePreset === 'from_date') {
            const fromDate = values.observeFromDate;
            if (!fromDate) {
                message.error('请选择起始日期');
                return;
            }
            windowType = 'FROM_DATE';
            observeStartDate = dayjs(fromDate).format('YYYY-MM-DD');
            observeEndDate = undefined;
        } else if (values.observeRangePreset && values.observeRangePreset !== 'custom') {
            if (values.observeRangePreset === '0,0') {
                windowType = 'TODAY';
            } else if (values.observeRangePreset === '-2,0') {
                windowType = 'LAST_3_DAYS';
            } else if (values.observeRangePreset === '-6,0') {
                windowType = 'LAST_7_DAYS';
            } else {
                const [startStr, endStr] = String(values.observeRangePreset).split(',');
                const startDate = dayjs().add(Number(startStr), 'day').startOf('day');
                const endDate = dayjs().add(Number(endStr), 'day').startOf('day');
                windowType = 'CUSTOM';
                observeStartDate = startDate.format('YYYY-MM-DD');
                observeEndDate = endDate.format('YYYY-MM-DD');
            }
        } else {
            const range = values.observeDateRange;
            if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
                message.error('请选择观察时间范围');
                return;
            }
            const startDate = dayjs(range[0]).startOf('day');
            const endDate = dayjs(range[1]).startOf('day');
            if (startDate.isAfter(endDate)) {
                message.error('观察时间范围不合法');
                return;
            }
            windowType = 'CUSTOM';
            observeStartDate = startDate.format('YYYY-MM-DD');
            observeEndDate = endDate.format('YYYY-MM-DD');
        }
        const first = normalizedConditions[0];
        const payload = {
            ...values,
            id: editingId || undefined,
            scopeRefs: Array.isArray(values.scopeRefs) ? values.scopeRefs.map((item: string) => String(item)) : [],
            conditions: normalizedConditions,
            metricType: first?.metricType,
            operatorType: first?.operatorType,
            thresholdValue: first?.thresholdValue,
            windowType,
            observeStartDate,
            observeEndDate,
            retryTimes: values.retryTimes ?? 1,
            feishuNotificationEnabled: true,
            feishuWebhook: values.feishuWebhook?.trim(),
        };
        const res = editingId ? await updateAutomationRule(payload) : await addAutomationRule(payload);
        if (res?.success) {
            message.success(editingId ? '更新成功' : '创建成功');
            setOpen(false);
            setScopeRefOptions([]);
            actionRef.current?.reload();
            return;
        }
        message.error(res?.errorMessage || '提交失败');
    };

    const runEvaluate = async (record: any) => {
        setEvaluateRuleId(record.id);
        setEvaluateRunningId(record.id);
        setEvaluateModalOpen(true);
        setEvaluateLoading(true);
        setEvaluateResult(null);
        setEvaluatePage({current: 1, pageSize: 20});
        try {
            const res = await evaluateAutomationRule(record.id, {dryRun: true});
            if (!res?.success) {
                message.error(res?.errorMessage || '试跑失败');
                return;
            }
            setEvaluateResult(res.data || {});
        } finally {
            setEvaluateLoading(false);
            setEvaluateRunningId(null);
        }
    };

    const runExecute = async () => {
        if (!evaluateRuleId) {
            message.warning('未找到当前规则，请重新试跑');
            return;
        }
        Modal.confirm({
            title: '确认真实执行？',
            content: `本次评估命中 ${evaluateResult?.matchedCount || 0} 个对象，确认后将按规则执行正式操作。`,
            okText: '确认执行',
            cancelText: '取消',
            onOk: async () => {
                setEvaluateModalOpen(false);
                setEvaluateExecuting(true);
                setEvaluateLoading(true);
                try {
                    const res = await evaluateAutomationRule(evaluateRuleId, {
                        dryRun: false,
                        evaluateDate: evaluateResult?.evaluateDate,
                    });
                    if (!res?.success) {
                        message.error(res?.errorMessage || '执行失败');
                        return;
                    }
                    setEvaluateResult(res.data || {});
                    message.success(res.data?.message || '执行完成');
                    actionRef.current?.reload();
                } finally {
                    setEvaluateLoading(false);
                    setEvaluateExecuting(false);
                }
            },
        });
    };

    const handleHistoryTableChange = async (pagination: { current?: number; pageSize?: number }) => {
        if (!historyRuleId) {
            return;
        }
        const nextCurrent = pagination.current || 1;
        const nextPageSize = pagination.pageSize || historyPagination.pageSize;
        setHistoryLoading(true);
        const res = await getAutomationHistoryPage({
            current: nextCurrent,
            size: nextPageSize,
            ruleId: historyRuleId,
            targetType: historyFilters.targetType,
            targetObjectId: historyFilters.targetObjectId,
        });
        if (res?.success) {
            setHistoryData(res.data?.records || []);
            setHistoryPagination({
                current: nextCurrent,
                pageSize: nextPageSize,
                total: res.data?.total || 0,
            });
        } else {
            message.error(res?.errorMessage || '加载历史失败');
        }
        setHistoryLoading(false);
    };

    const reloadHistory = async (current = 1, pageSize = historyPagination.pageSize) => {
        if (!historyRuleId) {
            return;
        }
        setHistoryLoading(true);
        const res = await getAutomationHistoryPage({
            current,
            size: pageSize,
            ruleId: historyRuleId,
            targetType: historyFilters.targetType,
            targetObjectId: historyFilters.targetObjectId,
        });
        if (res?.success) {
            setHistoryData(res.data?.records || []);
            setHistoryPagination({
                current,
                pageSize,
                total: res.data?.total || 0,
            });
        } else {
            message.error(res?.errorMessage || '加载历史失败');
        }
        setHistoryLoading(false);
    };

    const handleFeishuTest = async () => {
        const webhook = form.getFieldValue('feishuWebhook');
        if (!webhook || !String(webhook).trim()) {
            message.warning('请先填写飞书 webhook');
            return;
        }
        setFeishuTestLoading(true);
        try {
            const res = await testFeishuWebhook({webhook: String(webhook).trim()});
            if (res?.success) {
                message.success(res.data || '测试消息发送成功');
            } else {
                message.error(res?.errorMessage || '测试消息发送失败');
            }
        } finally {
            setFeishuTestLoading(false);
        }
    };

    const formatHistoryTime = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        const format = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mi = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
        };

        if (!Number.isNaN(date.getTime())) {
            return format(date);
        }

        const normalized = String(value).replace('T', ' ').replace(/\.\d+$/, '');
        const fallbackDate = new Date(normalized);
        if (!Number.isNaN(fallbackDate.getTime())) {
            return format(fallbackDate);
        }
        return normalized;
    };

    const formatObserveRangeLabel = (record: any) => {
        if (record.windowType === 'FROM_DATE' && record.observeStartDate) {
            return `${record.observeStartDate} ~ 今天`;
        }
        if (record.windowType === 'CUSTOM' && record.observeStartDate && record.observeEndDate) {
            return `${record.observeStartDate} ~ ${record.observeEndDate}`;
        }
        if (record.windowType === 'TODAY') {
            return '当天';
        }
        if (record.windowType === 'LAST_3_DAYS') {
            return '近3天';
        }
        if (record.windowType === 'LAST_7_DAYS') {
            return '近7天';
        }
        return '当天';
    };

    const formatScopeRefs = (scopeRefs?: string[]) => {
        if (!Array.isArray(scopeRefs) || scopeRefs.length === 0) {
            return '-';
        }
        if (scopeRefs.length === 1 && scopeRefs[0] === allSelectValue) {
            return '全部';
        }
        return scopeRefs.join('、');
    };

    const renderEvaluateResult = () => {
        if (evaluateLoading) {
            return (
                <div style={{padding: '20px 0', textAlign: 'center'}}>
                    <Spin/>
                    <div style={{marginTop: 12}}>{evaluateExecuting ? '正在执行规则，请稍候...' : '正在试跑规则，请稍候...'}</div>
                </div>
            );
        }

        if (!evaluateResult) {
            return <div>暂无试跑结果</div>;
        }

        const matched = Array.isArray(evaluateResult.matched) ? evaluateResult.matched : [];
        const total = matched.length;
        const start = (evaluatePage.current - 1) * evaluatePage.pageSize;
        const end = start + evaluatePage.pageSize;
        const pagedMatched = matched.slice(start, end);

        return (
            <Space direction="vertical" style={{width: '100%'}} size={12}>
                <Card size="small">
                    <Space size={24} wrap>
                        <div>评估日期：{evaluateResult.evaluateDate || '-'}</div>
                        <div>命中数量：{evaluateResult.matchedCount || 0}</div>
                        <div>模式：{evaluateResult.dryRun ? '试跑（不执行）' : '真实执行'}</div>
                    </Space>
                </Card>

                {matched.length === 0 ? (
                    <Card size="small">{evaluateResult.message || '本次试跑无命中对象'}</Card>
                ) : (
                    <>
                        <List
                            size="small"
                            bordered
                            dataSource={pagedMatched}
                            renderItem={(item: any, index: number) => (
                                <List.Item>
                                    <Space direction="vertical" style={{width: '100%'}} size={10}>
                                        <Typography.Title level={5} style={{margin: 0}}>命中对象 #{start + index + 1}</Typography.Title>
                                            <Descriptions size="small" column={1} bordered>
                                            <Descriptions.Item label="对象ID">{item.objectId || '-'}</Descriptions.Item>
                                            <Descriptions.Item label="执行结果">{item.action || '-'}</Descriptions.Item>
                                            <Descriptions.Item label="重试进度">
                                                {`${item.currentRetryCount ?? '-'} / ${item.retryTimes ?? '-'}`}
                                                {item.willExecuteAction ? '（已达到执行阈值）' : `（还剩 ${item.remainingRetryCount ?? '-'} 次）`}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="指标快照">
                                                {item.metrics && typeof item.metrics === 'object'
                                                    ? Object.entries(item.metrics).map(([metricType, value]) => {
                                                        const unit = metricUnitMap[metricType] || '';
                                                        return (
                                                            <div key={`${item.objectId || index}-metric-${metricType}`}>
                                                                {formatMetricLabel(metricType)}: {value == null ? '-' : `${value}${unit ? ` ${unit}` : ''}`}
                                                            </div>
                                                        );
                                                    })
                                                    : '-'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="触发条件">
                                                <Space direction="vertical" size={2}>
                                                    {formatReasonLines(item.reason).map((line, lineIndex) => (
                                                        <div key={`${item.objectId || index}-reason-${lineIndex}`}>{line}</div>
                                                    ))}
                                                </Space>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Space>
                                </List.Item>
                            )}
                        />
                        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 12}}>
                            <Pagination
                                current={evaluatePage.current}
                                pageSize={evaluatePage.pageSize}
                                total={total}
                                showSizeChanger={false}
                                onChange={(current) => setEvaluatePage((prev) => ({...prev, current}))}
                                showTotal={(t) => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </Space>
        );
    };

    const canOperateRecord = (_record?: any) => !!currentUserId || currentUser?.isSuperAdmin;

    const columns: ProColumns<any>[] = [
        {
            title: '状态',
            dataIndex: 'status',
            width: 96,
            hideInSearch: true,
            render: (_, record) => (
                <Switch
                    checked={record.status === 1}
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                    disabled={!canOperateRecord(record)}
                    onChange={async (checked) => {
                        const res = await updateAutomationRuleStatus(record.id, checked ? 1 : 0);
                        if (res?.success) {
                            message.success('状态已更新');
                            actionRef.current?.reload();
                        } else {
                            message.error(res?.errorMessage || '更新失败');
                        }
                    }}
                />
            ),
        },
        {
            title: '规则名',
            dataIndex: 'name',
            hideInSearch: true,
            width: 220,
            render: (_, record) => (
                <Button type="link" style={{padding: 0, fontWeight: 500}} onClick={() => openDetail(record)}>
                    {record.name}
                </Button>
            ),
        },
        {
            title: '创建人',
            dataIndex: 'creatorName',
            width: 140,
            hideInSearch: true,
            render: (_, record) => record.creatorName || record.createBy || '-',
        },
        {
            title: '归属权',
            dataIndex: 'ownershipLevel',
            width: 120,
            hideInSearch: true,
            render: (_, record) => ownershipLevelLabelMap[record.ownershipLevel] || record.ownershipLevel,
        },
        {
            title: '作用层级',
            dataIndex: 'scopeLevel',
            width: 120,
            hideInSearch: true,
            render: (_, record) => scopeLevelLabelMap[record.scopeLevel] || record.scopeLevel,
        },
        {
            title: '目标对象',
            dataIndex: 'targetType',
            width: 120,
            hideInSearch: true,
            render: (_, record) => targetTypeLabelMap[record.targetType] || record.targetType,
        },
        {
            title: '动作',
            dataIndex: 'actionType',
            width: 140,
            hideInSearch: true,
            render: (_, record) => (
                <Badge
                    count={record.retryTimes ?? 1}
                    size="small"
                    offset={[10, -2]}
                    style={{backgroundColor: '#e6f4ff', color: '#1677ff', boxShadow: 'none', fontWeight: 500}}
                >
                    <Tag color={actionTagColorMap[record.actionType] || 'default'} style={{marginInlineEnd: 0}}>
                        {actionTypeLabelMap[record.actionType] || record.actionType}
                    </Tag>
                </Badge>
            ),
        },
        {
            title: '观察范围',
            width: 180,
            hideInSearch: true,
            render: (_, record) => formatObserveRangeLabel(record),
        },
        {
            title: '操作',
            width: 300,
            valueType: 'option',
            render: (_, record) => {
                const canOperate = canOperateRecord(record);
                const actions = [
                    <Button key="history" type="link" onClick={() => openHistory(record.id)}>
                        历史
                    </Button>,
                ];
                if (!canOperate) {
                    return actions;
                }
                return [
                    <AdsConsoleAuthButton key="edit" code="automation:rule:edit" type="link" onClick={() => openEdit(record.id)}>
                        编辑
                    </AdsConsoleAuthButton>,
                    ...actions,
                    <AdsConsoleAuthButton
                        key="run"
                        code="automation:rule:execute"
                        type="link"
                        loading={evaluateRunningId === record.id}
                        onClick={() => runEvaluate(record)}
                    >
                        试跑
                    </AdsConsoleAuthButton>,
                    <Popconfirm
                        key="del"
                        title="确认删除该规则？"
                        okText="确认"
                        cancelText="取消"
                        onConfirm={async () => {
                            const res = await deleteAutomationRule(record.id);
                            if (res?.success) {
                                message.success('删除成功');
                                actionRef.current?.reload();
                            } else {
                                message.error(res?.errorMessage || '删除失败');
                            }
                        }}
                    >
                        <AdsConsoleAuthButton code="automation:rule:delete" type="link" danger>
                            删除
                        </AdsConsoleAuthButton>
                    </Popconfirm>,
                ];
            },
        },
    ];

    return (
        <>
            <ProTable<any>
                rowKey="id"
                actionRef={actionRef}
                columns={columns}
                size="small"
                search={false}
                request={async (params) => {
                    const res = await getAutomationRulePage({
                        current: params.current,
                        size: params.pageSize,
                        name: tableFilters.name,
                        status: tableFilters.status,
                    });
                    if (!res?.success) return {data: [], total: 0, success: false};
                    return {data: res.data?.records || [], total: res.data?.total || 0, success: true};
                }}
                toolbar={{
                    search: false,
                    filter: (
                        <Space size={12} wrap>
                            <Select
                                allowClear
                                placeholder="状态"
                                style={{width: 120}}
                                value={tableFilters.status}
                                options={[
                                    {label: '启用', value: 1},
                                    {label: '禁用', value: 0},
                                ]}
                                onChange={(value) => setTableFilters((prev) => ({...prev, status: value}))}
                            />
                            <Input
                                allowClear
                                placeholder="规则名"
                                style={{width: 220}}
                                value={tableFilters.name}
                                onChange={(event) => setTableFilters((prev) => ({...prev, name: event.target.value}))}
                                onPressEnter={() => actionRef.current?.reload()}
                            />
                            <Button type="primary" onClick={() => actionRef.current?.reload()}>
                                查询
                            </Button>
                            <Button
                                onClick={() => {
                                    setTableFilters({});
                                    setTimeout(() => actionRef.current?.reload(), 0);
                                }}
                            >
                                重置
                            </Button>
                        </Space>
                    ),
                    actions: [
                        <AdsConsoleAuthButton key="new" code="automation:rule:add" type="primary" onClick={openCreate}>
                            新建规则
                        </AdsConsoleAuthButton>,
                    ],
                }}
                scroll={{x: 1180}}
            />

            <Drawer
                title={editingId ? '编辑规则' : '新建规则'}
                width={900}
                open={open}
                onClose={closeDrawer}
                bodyStyle={drawerBodyStyle}
                extra={
                    <Space>
                        <Button onClick={closeDrawer}>取消</Button>
                        <Button type="primary" onClick={submit} loading={drawerLoading}>
                            保存
                        </Button>
                    </Space>
                }
            >
                <Spin spinning={drawerLoading}>
                <div style={formShellStyle}>
                <Form form={form} layout="vertical">
                    <Card
                        size="small"
                        bordered={false}
                        title={<Typography.Text strong style={{fontSize: 16, color: '#1f2937'}}>基础信息</Typography.Text>}
                        headStyle={configCardHeadStyle}
                        bodyStyle={configCardBodyStyle}
                        style={configCardStyle}
                    >
                        <Space style={{width: '100%'}} align="start" wrap>
                            <Form.Item name="name" label="规则名" rules={[{required: true, message: '请输入规则名'}]}>
                                <Input style={{width: 280}}/>
                            </Form.Item>
                            <Form.Item name="status" label="状态" rules={[{required: true}]}>
                                <Select options={[{label: '启用', value: 1}, {label: '禁用', value: 0}]} style={{width: 120}}/>
                            </Form.Item>
                        </Space>
                        <Form.Item name="description" label="描述">
                            <Input.TextArea rows={2}/>
                        </Form.Item>
                    </Card>

                    <Card
                        size="small"
                        bordered={false}
                        title={<Typography.Text strong style={{fontSize: 16, color: '#1f2937'}}>作用对象与范围</Typography.Text>}
                        headStyle={configCardHeadStyle}
                        bodyStyle={configCardBodyStyle}
                        style={configCardStyle}
                    >
                        <Space style={{width: '100%'}} align="start" wrap size={16}>
                            <Form.Item name="ownershipLevel" label="归属权" rules={[{required: true}]} style={{marginBottom: 0}}>
                                <Select
                                    options={ownershipLevels.map((item) => ({...item, label: ownershipLevelLabelMap[item.value] || item.label}))}
                                    style={{width: 180}}
                                />
                            </Form.Item>
                            <div style={{paddingTop: 26, minHeight: 58, display: 'flex', alignItems: 'flex-start', color: '#8c8c8c', lineHeight: '32px', maxWidth: 520}}>
                                    {resolveLevelNames(ownershipLevel)}
                            </div>
                        </Space>
                        <Space style={{width: '100%', marginTop: 12}} align="start" wrap size={16}>
                            <Form.Item name="scopeLevel" label="作用层级" rules={[{required: true}]} style={{marginBottom: 0}}>
                                <Select
                                    options={scopeLevels.map((item) => ({...item, label: scopeLevelLabelMap[item.value] || item.label}))}
                                    style={{width: 180}}
                                />
                            </Form.Item>
                        </Space>
                        <Space style={{width: '100%', marginTop: 12}} align="start" wrap size={16}>
                            <Form.Item
                                name="scopeRefs"
                                label="层级范围"
                                rules={[{required: true, message: '请选择层级范围'}]}
                                style={{marginBottom: 0, width: '100%'}}
                            >
                                <Select
                                    mode="multiple"
                                    options={scopeRefOptions}
                                    style={{width: '100%'}}
                                    loading={scopeRefLoading}
                                    showSearch
                                    optionFilterProp="label"
                                    placeholder={scopeLevel ? (scopeRefOptions.length ? '请选择层级范围' : '当前层级暂无可选范围') : '先选择作用层级'}
                                    notFoundContent={scopeLevel ? '当前层级暂无可选范围' : '先选择作用层级'}
                                    onChange={(values) => {
                                        const normalized = Array.isArray(values) ? values.map((item) => String(item)) : [];
                                        if (normalized.includes(allSelectValue)) {
                                            form.setFieldValue('scopeRefs', [allSelectValue]);
                                            return;
                                        }
                                        form.setFieldValue('scopeRefs', normalized);
                                    }}
                                    filterOption={(input, option) => String(option?.label || '').toLowerCase().includes(input.toLowerCase())}
                                />
                            </Form.Item>
                        </Space>
                        <Space style={{width: '100%', marginTop: 12}} align="start" wrap>
                            <Form.Item name="targetType" label="目标对象" rules={[{required: true}]} style={{marginBottom: 0}}>
                                <Select
                                    options={targetTypes.map((item) => ({...item, label: targetTypeLabelMap[item.value] || item.label}))}
                                    style={{width: 180}}
                                />
                            </Form.Item>
                        </Space>
                    </Card>

                    <Card
                        size="small"
                        bordered={false}
                        title={<Typography.Text strong style={{fontSize: 16, color: '#1f2937'}}>规则条件与动作</Typography.Text>}
                        headStyle={configCardHeadStyle}
                        bodyStyle={configCardBodyStyle}
                        style={{...configCardStyle, marginBottom: 10}}
                    >
                        <Space style={{width: '100%', marginBottom: 8}} align="start" wrap>
                            <div style={{width: 160}}><span style={{color: '#ff4d4f', marginRight: 4}}>*</span>指标</div>
                            <div style={{width: 120}}><span style={{color: '#ff4d4f', marginRight: 4}}>*</span>操作符</div>
                            <div style={{width: 160}}><span style={{color: '#ff4d4f', marginRight: 4}}>*</span>阈值</div>
                        </Space>
                        <Form.List
                            name="conditions"
                            rules={[{
                                validator: async (_, value) => {
                                    if (!value || value.length < 1) {
                                        throw new Error('至少需要一条条件');
                                    }
                                },
                            }]}
                        >
                            {(fields, {add, remove}, {errors}) => (
                                <>
                                    {fields.map((field, index) => {
                                        const rowMetricType = conditions?.[index]?.metricType;
                                        const isLast = index === fields.length - 1;
                                        return (
                                            <Space key={field.key} style={{width: '100%'}} align="start" wrap>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'metricType']}
                                                    rules={[{required: true}]}
                                                >
                                                    <Select options={metricOptions} style={{width: 160}}/>
                                                </Form.Item>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'operatorType']}
                                                    rules={[{required: true}]}
                                                >
                                                    <Select options={operatorOptions} style={{width: 120}}/>
                                                </Form.Item>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, 'thresholdValue']}
                                                    rules={[{required: true}]}
                                                >
                                                    <InputNumber min={0} style={{width: 160}} addonAfter={metricUnitMap[rowMetricType] || undefined}/>
                                                </Form.Item>
                                                <Form.Item>
                                                    <Space>
                                                        {isLast ? <Button onClick={() => add({metricType: 'SPEND', operatorType: 'GT', thresholdValue: 0})}>新增条件</Button> : null}
                                                        {fields.length > 1 ? <Button danger onClick={() => remove(field.name)}>删除</Button> : null}
                                                    </Space>
                                                </Form.Item>
                                            </Space>
                                        );
                                    })}
                                    <Form.ErrorList errors={errors}/>
                                </>
                            )}
                        </Form.List>

                        <Space style={{width: '100%'}} align="start" wrap>
                            <Form.Item
                                name="observeRangePreset"
                                label="观察时间范围"
                                rules={[{required: true}]}
                                initialValue="0,0"
                            >
                                <Select
                                    options={observeRangeOptions}
                                    style={{width: 180}}
                                    onChange={(value) => {
                                        if (value === 'custom' || value === 'from_date') {
                                            form.setFieldValue('observeDateRange', undefined);
                                            return;
                                        }
                                        form.setFieldValue('observeFromDate', undefined);
                                        const [startStr, endStr] = String(value).split(',');
                                        const start = Number(startStr);
                                        const end = Number(endStr);
                                        form.setFieldValue('observeDateRange', [dayjs().add(start, 'day'), dayjs().add(end, 'day')]);
                                    }}
                                />
                            </Form.Item>
                            {observeRangePreset === 'from_date' && (
                            <Form.Item
                                name="observeFromDate"
                                label="起始日期"
                                rules={[{required: true, message: '请选择起始日期'}]}
                            >
                                <DatePicker
                                    allowClear
                                    disabledDate={(current) => {
                                        if (!current) return false;
                                        return current.isAfter(dayjs(), 'day');
                                    }}
                                    placeholder="选择起始日期"
                                />
                            </Form.Item>
                            )}
                            {observeRangePreset === 'custom' && (
                            <Form.Item
                                name="observeDateRange"
                                label="时间范围筛选"
                                rules={[{required: true, message: '请选择时间范围'}]}
                            >
                                <DatePicker.RangePicker
                                    allowClear={false}
                                    disabledDate={(current) => {
                                        if (!current) return false;
                                        const earliest = dayjs().add(-365, 'day').startOf('day');
                                        return current.isBefore(earliest);
                                    }}
                                />
                            </Form.Item>
                            )}
                            <Form.Item
                                name="actionType"
                                label="执行动作"
                                rules={[{required: true}]}
                            >
                                <Select options={actionOptions} style={{width: 180}}/>
                            </Form.Item>
                        </Space>
                        <Space style={{width: '100%'}} align="start" wrap>
                            <Form.Item
                                name="retryTimes"
                                label="重试次数"
                                rules={[{required: true, message: '请输入重试次数'}]}
                                extra="连续命中达到该次数后才执行动作，默认 1"
                            >
                                <InputNumber min={1} precision={0} style={{width: 140}}/>
                            </Form.Item>
                        </Space>
                        <Form.Item
                            name="feishuWebhook"
                            label="飞书 webhook"
                            rules={[{required: true, message: '请填写飞书 webhook'}]}
                        >
                            <Input
                                placeholder="https://open.feishu.cn/..."
                                addonAfter={
                                    <Button type="link" size="small" loading={feishuTestLoading} onClick={handleFeishuTest}>
                                        测试
                                    </Button>
                                }
                            />
                        </Form.Item>
                    </Card>
                    <Typography.Text type="secondary" style={{display: 'block', marginTop: 2, marginBottom: 8, paddingLeft: 4}}>
                        提示：任务执行时间为每小时的 20 分钟。
                    </Typography.Text>
                </Form>
                </div>
                </Spin>
            </Drawer>

            <Modal
                title="规则详情"
                open={detailOpen}
                onCancel={() => {
                    setDetailOpen(false);
                    setDetailData(null);
                }}
                footer={null}
                width={860}
            >
                <Spin spinning={detailLoading}>
                    {detailData ? (
                        <Space direction="vertical" size={16} style={{width: '100%'}}>
                            <Card
                                size="small"
                                bordered={false}
                                headStyle={configCardHeadStyle}
                                bodyStyle={configCardBodyStyle}
                                style={detailCardStyle}
                                title={<Typography.Text strong>基础信息</Typography.Text>}
                            >
                                <Descriptions column={2} size="middle" labelStyle={{width: 96}}>
                                    <Descriptions.Item label="规则名">{detailData.name || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="状态">
                                        <Tag color={detailData.status === 1 ? 'success' : 'default'}>
                                            {detailData.status === 1 ? '启用' : '禁用'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="创建人">{detailData.creatorName || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="创建时间">{formatHistoryTime(detailData.createTime)}</Descriptions.Item>
                                    <Descriptions.Item label="说明" span={2}>
                                        <Typography.Paragraph style={{marginBottom: 0, color: '#595959'}}>
                                            {detailData.description || '暂无说明'}
                                        </Typography.Paragraph>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>

                            <Card
                                size="small"
                                bordered={false}
                                headStyle={configCardHeadStyle}
                                bodyStyle={configCardBodyStyle}
                                style={detailCardStyle}
                                title={<Typography.Text strong>作用对象与范围</Typography.Text>}
                            >
                                <Descriptions column={2} size="middle" labelStyle={{width: 96}}>
                                    <Descriptions.Item label="归属权">
                                        {ownershipLevelLabelMap[detailData.ownershipLevel] || detailData.ownershipLevel || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="作用层级">
                                        {scopeLevelLabelMap[detailData.scopeLevel] || detailData.scopeLevel || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="层级范围" span={2}>
                                        {formatScopeRefs(detailData.scopeRefs)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="目标对象">
                                        {targetTypeLabelMap[detailData.targetType] || detailData.targetType || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="观察范围">
                                        {formatObserveRangeLabel(detailData)}
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>

                            <Card
                                size="small"
                                bordered={false}
                                headStyle={configCardHeadStyle}
                                bodyStyle={configCardBodyStyle}
                                style={detailCardStyle}
                                title={<Typography.Text strong>规则条件与动作</Typography.Text>}
                            >
                                <Descriptions column={2} size="middle" labelStyle={{width: 96}} style={{marginBottom: 12}}>
                                    <Descriptions.Item label="执行动作">
                                        <Space size={8}>
                                            <Tag color={actionTagColorMap[detailData.actionType] || 'default'} style={{marginInlineEnd: 0}}>
                                                {actionTypeLabelMap[detailData.actionType] || detailData.actionType || '-'}
                                            </Tag>
                                            <Typography.Text type="secondary">
                                                重试 {detailData.retryTimes ?? 1} 次
                                            </Typography.Text>
                                        </Space>
                                    </Descriptions.Item>
                                </Descriptions>
                                <Descriptions column={1} size="middle" labelStyle={{width: 96}} style={{marginBottom: 16}}>
                                    <Descriptions.Item label="Webhook">
                                        <Typography.Text copyable style={{fontSize: 12}}>
                                            {detailData.feishuWebhook || '-'}
                                        </Typography.Text>
                                    </Descriptions.Item>
                                </Descriptions>
                                {Array.isArray(detailData.conditions) && detailData.conditions.length > 0 ? (
                                    <Space direction="vertical" size={10} style={{width: '100%'}}>
                                        {detailData.conditions.map((condition: any, index: number) => (
                                            <div
                                                key={condition.id || `${condition.metricType}-${index}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 16,
                                                    padding: '10px 12px',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: 8,
                                                    background: '#fafafa',
                                                }}
                                            >
                                                <Space size={12} wrap>
                                                    <Typography.Text type="secondary">条件 {index + 1}</Typography.Text>
                                                    <Typography.Text strong>{formatConditionText(condition)}</Typography.Text>
                                                </Space>
                                            </div>
                                        ))}
                                    </Space>
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无规则条件"/>
                                )}
                            </Card>
                        </Space>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无详情数据"/>
                    )}
                </Spin>
            </Modal>

            <Modal
                title="触发历史"
                open={historyOpen}
                maskClosable={false}
                keyboard={false}
                onCancel={() => {
                    setHistoryOpen(false);
                    setHistoryFilters({});
                }}
                footer={null}
                width={1160}
            >
                <Space size={12} wrap style={{width: '100%', marginBottom: 16}}>
                    <Select
                        allowClear
                        placeholder="目标对象"
                        style={{width: 160}}
                        value={historyFilters.targetType}
                        options={[
                            {label: '账户', value: 'ACCOUNT'},
                            {label: '广告系列', value: 'CAMPAIGN'},
                            {label: '广告组', value: 'ADSET'},
                            {label: '广告', value: 'AD'},
                        ]}
                        onChange={(value) => setHistoryFilters((prev) => ({...prev, targetType: value}))}
                    />
                    <Input
                        allowClear
                        placeholder="对象ID"
                        style={{width: 220}}
                        value={historyFilters.targetObjectId}
                        onChange={(event) => setHistoryFilters((prev) => ({...prev, targetObjectId: event.target.value}))}
                        onPressEnter={() => reloadHistory(1)}
                    />
                    <Button type="primary" onClick={() => reloadHistory(1)}>
                        查询
                    </Button>
                    <Button
                        onClick={() => {
                            setHistoryFilters({});
                            setTimeout(() => reloadHistory(1), 0);
                        }}
                    >
                        重置
                    </Button>
                </Space>
                <Table
                    rowKey="id"
                    size="small"
                    loading={historyLoading}
                    dataSource={historyData}
                    pagination={{
                        current: historyPagination.current,
                        pageSize: historyPagination.pageSize,
                        total: historyPagination.total,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                    }}
                    onChange={handleHistoryTableChange}
                    columns={[
                        {
                            title: '触发时间',
                            dataIndex: 'triggeredAt',
                            width: 220,
                            ellipsis: true,
                            render: (value: string) => formatHistoryTime(value),
                        },
                        {
                            title: '触发方式',
                            dataIndex: 'triggerSource',
                            width: 140,
                            render: (value: string) => <Tag
                                color={value === 'MANUAL' ? 'blue' : 'purple'}>{value === 'MANUAL' ? '手动' : '定时'}</Tag>,
                        },
                        {
                            title: '目标事件',
                            dataIndex: 'metricSnapshot',
                            width: 180,
                            ellipsis: true,
                            render: (value: string) => {
                                const snapshot = parseMetricSnapshot(value);
                                return snapshot?.targetEvent || '-';
                            },
                        },
                        {
                            title: '目标对象',
                            dataIndex: 'targetType',
                            width: 140,
                            ellipsis: true,
                            render: (value: string) => targetObjectTypeLabelMap[value] || value || '-',
                        },
                        {title: '对象ID', dataIndex: 'targetObjectId', width: 180, ellipsis: true},
                        {title: '触发原因(含阈值)', dataIndex: 'triggerReason', width: 360, ellipsis: true},
                        {
                            title: '动作摘要',
                            dataIndex: 'actionSummary',
                            width: 280,
                            render: (value: string) => (
                                <Typography.Text
                                    style={{maxWidth: 260}}
                                    ellipsis={{tooltip: value || '-'}}
                                >
                                    {value || '-'}
                                </Typography.Text>
                            ),
                        },
                        {
                            title: '重试进度',
                            dataIndex: 'currentRetryCount',
                            width: 180,
                            render: (_: any, record: any) => {
                                const current = record.currentRetryCount ?? '-';
                                const total = record.retryTimesSnapshot ?? '-';
                                const remaining = record.remainingRetryCount ?? '-';
                                return `${current} / ${total}，剩余 ${remaining}`;
                            },
                        },
                        {
                            title: '执行状态',
                            dataIndex: 'executionStatus',
                            width: 120,
                            render: (_: any, record: any) => {
                                const label = executionStatusLabelMap[record.executionStatus] || record.executionStatus || '-';
                                const tag = (
                                    <Tag color={record.executionStatus === 'SUCCESS' ? 'green' : record.executionStatus === 'FAILED' ? 'red' : 'default'}>
                                        {label}
                                    </Tag>
                                );
                                if (record.executionStatus === 'FAILED' && record.errorMessage) {
                                    return <Tooltip title={record.errorMessage}>{tag}</Tooltip>;
                                }
                                return tag;
                            },
                        },
                    ]}
                    scroll={{x: 1480, y: 560}}
                />
            </Modal>

            <Modal
                title="试跑结果"
                open={evaluateModalOpen}
                onCancel={() => setEvaluateModalOpen(false)}
                footer={
                    <Space>
                        <Button onClick={() => setEvaluateModalOpen(false)}>关闭</Button>
                        {evaluateResult?.dryRun === true && (evaluateResult?.matchedCount || 0) > 0 ? (
                            <Button type="primary" onClick={runExecute}>执行规则</Button>
                        ) : null}
                    </Space>
                }
                width={960}
                styles={{
                    body: {
                        height: '70vh',
                        overflowY: 'auto',
                    },
                }}
            >
                {renderEvaluateResult()}
            </Modal>
        </>
    );
};

export default RulePage;



