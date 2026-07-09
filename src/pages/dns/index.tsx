import { DisconnectOutlined, LinkOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDnsProvider,
  createDnsProviderAccount,
  getDnsDomains,
  getDnsIpBindings,
  getDnsProviderAccountDetail,
  getDnsProviderAccounts,
  getDnsProviderDetail,
  getDnsProviders,
  getDnsRecordsByIp,
  resolveDnsRecord,
  syncDnsDomains,
  unbindDnsRecord,
  updateDnsDomainMeta,
  updateDnsIpBindingMeta,
  updateDnsProvider,
  updateDnsProviderAccount,
} from '@/services/dns-tool/api';
import DomainDetailDrawer from './components/DomainDetailDrawer';
import DomainListPanel, { type DomainQuery } from './components/DomainListPanel';
import DomainOverviewCards from './components/DomainOverviewCards';
import { IP_V4_PATTERN, bindingStatusTag, parsePagePayload, parseTags } from './helpers';
import { formatUTC8 } from '@/utils/format';
import './index.less';

type CardMode = 'domains' | 'bindings' | 'providers' | 'accounts';
type MetaEditType = 'domain' | 'binding';

interface OptionItem {
  label: string;
  value: string | number;
}

interface DnsOverview {
  domainTotal: number;
  availableDomains: number;
  missingDomains: number;
  providerTotal: number;
  accountTotal: number;
}

const DnsPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();

  const [mode, setMode] = useState<CardMode>('domains');

  const [domainQuery, setDomainQuery] = useState<DomainQuery>({});
  const [bindingQuery, setBindingQuery] = useState<{
    keyword?: string;
    ipv4?: string;
    providerAccountId?: number;
    domainId?: number;
    status?: API.DnsBindingStatus;
  }>({});
  const [providerQuery, setProviderQuery] = useState<{ keyword?: string }>({});
  const [accountQuery, setAccountQuery] = useState<{
    keyword?: string;
    providerCode?: string;
    status?: API.DnsAccountStatus;
  }>({});

  const [selectedDomain, setSelectedDomain] = useState<API.DnsToolDomain | null>(null);
  const [selectedBinding, setSelectedBinding] = useState<API.DnsToolIpBinding | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<API.DnsToolProvider | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<API.DnsToolProviderAccount | null>(null);

  const [domainBindings, setDomainBindings] = useState<API.DnsToolIpBinding[]>([]);
  const [sameIpBindings, setSameIpBindings] = useState<API.DnsToolIpBinding[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overview, setOverview] = useState<DnsOverview>({
    domainTotal: 0,
    availableDomains: 0,
    missingDomains: 0,
    providerTotal: 0,
    accountTotal: 0,
  });
  const [domainDetailOpen, setDomainDetailOpen] = useState(false);

  const [providerOptions, setProviderOptions] = useState<OptionItem[]>([]);
  const [providerAccountOptions, setProviderAccountOptions] = useState<OptionItem[]>([]);
  const [domainOptions, setDomainOptions] = useState<OptionItem[]>([]);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [unbindOpen, setUnbindOpen] = useState(false);
  const [unbindTarget, setUnbindTarget] = useState<{ fqdn: string; ipv4: string } | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [providerFormLoading, setProviderFormLoading] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountFormLoading, setAccountFormLoading] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<number | null>(null);

  const [providerEditing, setProviderEditing] = useState<API.DnsToolProvider | null>(null);
  const [accountEditing, setAccountEditing] = useState<API.DnsToolProviderAccount | null>(null);
  const [metaType, setMetaType] = useState<MetaEditType>('domain');
  const [metaDomainRecord, setMetaDomainRecord] = useState<API.DnsToolDomain | null>(null);
  const [metaBindingRecord, setMetaBindingRecord] = useState<API.DnsToolIpBinding | null>(null);

  const [resolveForm] = Form.useForm<{
    ipv4: string;
    domain: string;
    subdomain: string;
    unique: boolean;
  }>();
  const [metaForm] = Form.useForm<{ tags?: string; note?: string }>();
  const [providerForm] = Form.useForm<{
    name: string;
    officialWebsite?: string;
    apiHost?: string;
    requestTimeout?: number;
    rateLimitPerMinute?: number;
    tags?: string;
    note?: string;
  }>();
  const [accountForm] = Form.useForm<{
    providerCode: string;
    accountName: string;
    status: API.DnsAccountStatus;
    configJson?: string;
    apiKey?: string;
    apiSecret?: string;
    tags?: string;
    note?: string;
  }>();
  const accountProviderCode = Form.useWatch('providerCode', accountForm);
  const isGodaddyProvider = (accountProviderCode || '').toLowerCase() === 'godaddy';

  const actionRefDomain = useRef<ActionType | undefined>(undefined);
  const actionRefBinding = useRef<ActionType | undefined>(undefined);
  const actionRefProvider = useRef<ActionType | undefined>(undefined);
  const actionRefAccount = useRef<ActionType | undefined>(undefined);

  const clearSelection = useCallback(() => {
    setSelectedDomain(null);
    setSelectedBinding(null);
    setSelectedProvider(null);
    setSelectedAccount(null);
    setDomainBindings([]);
    setSameIpBindings([]);
    setDomainDetailOpen(false);
  }, []);

  const loadOptions = useCallback(async () => {
    const [providerRes, accountRes, domainRes] = await Promise.all([
      getDnsProviders({ page: 1, pageSize: 200 }),
      getDnsProviderAccounts({ page: 1, pageSize: 200 }),
      getDnsDomains({ page: 1, pageSize: 200 }),
    ]);

    if (providerRes.code === 0) {
      const page = parsePagePayload<API.DnsToolProvider>(providerRes.data, 1, 200);
      setProviderOptions(page.list.map((item) => ({ label: item.name, value: item.name })));
    }
    if (accountRes.code === 0) {
      const page = parsePagePayload<API.DnsToolProviderAccount>(accountRes.data, 1, 200);
      setProviderAccountOptions(
        page.list.map((item) => ({
          label: `${item.accountName} (${item.providerCode})`,
          value: item.id,
        })),
      );
    }
    if (domainRes.code === 0) {
      const page = parsePagePayload<API.DnsToolDomain>(domainRes.data, 1, 200);
      setDomainOptions(page.list.map((item) => ({ label: item.domainName, value: item.id })));
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    const [domainAllRes, availableDomainRes, domainMissingRes, providerRes, accountRes] =
      await Promise.all([
        getDnsDomains({ page: 1, pageSize: 1 }),
        getDnsDomains({ isAvailable: 1, page: 1, pageSize: 1 }),
        getDnsDomains({ syncStatus: 'missing', page: 1, pageSize: 1 }),
        getDnsProviders({ page: 1, pageSize: 1 }),
        getDnsProviderAccounts({ page: 1, pageSize: 1 }),
      ]);
    setOverviewLoading(false);

    setOverview({
      domainTotal:
        domainAllRes.code === 0
          ? parsePagePayload<API.DnsToolDomain>(domainAllRes.data, 1, 1).total
          : 0,
      availableDomains:
        availableDomainRes.code === 0
          ? parsePagePayload<API.DnsToolDomain>(availableDomainRes.data, 1, 1).total
          : 0,
      missingDomains:
        domainMissingRes.code === 0
          ? parsePagePayload<API.DnsToolDomain>(domainMissingRes.data, 1, 1).total
          : 0,
      providerTotal:
        providerRes.code === 0
          ? parsePagePayload<API.DnsToolProvider>(providerRes.data, 1, 1).total
          : 0,
      accountTotal:
        accountRes.code === 0
          ? parsePagePayload<API.DnsToolProviderAccount>(accountRes.data, 1, 1).total
          : 0,
    });
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOverview(), loadOptions()]);
  }, [loadOverview, loadOptions]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const loadDomainBindings = useCallback(async (domainId: number) => {
    setDetailLoading(true);
    const res = await getDnsIpBindings({ domainId, page: 1, pageSize: 20 });
    setDetailLoading(false);
    if (res.code !== 0) {
      setDomainBindings([]);
      return;
    }
    setDomainBindings(parsePagePayload<API.DnsToolIpBinding>(res.data, 1, 20).list);
  }, []);

  const loadSameIpBindings = useCallback(
    async (ipv4: string) => {
      setDetailLoading(true);
      const res = await getDnsRecordsByIp({ ipv4, status: 'active' });
      setDetailLoading(false);
      if (res.code !== 0) {
        setSameIpBindings([]);
        messageApi.error(res.msg || '同 IP 查询失败');
        return;
      }
      setSameIpBindings(parsePagePayload<API.DnsToolIpBinding>(res.data, 1, 20).list);
    },
    [messageApi],
  );

  const openResolveModal = useCallback(
    (preset?: { domain?: string; ipv4?: string; subdomain?: string }) => {
      resolveForm.setFieldsValue({
        domain: preset?.domain,
        ipv4: preset?.ipv4,
        subdomain: preset?.subdomain,
        unique: false,
      });
      setResolveOpen(true);
    },
    [resolveForm],
  );

  const handleResolveSubmit = useCallback(async () => {
    const values = await resolveForm.validateFields();
    const ok = await new Promise<boolean>((resolve) => {
      modalApi.confirm({
        title: '确认执行 DNS 解析？',
        content: '该操作会调用外部 DNS 服务，请确认域名、子域名和 IP 地址正确。',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!ok) return;

    const res = await resolveDnsRecord(values);
    if (res.code !== 0) {
      messageApi.error(res.msg || '执行解析失败');
      return;
    }
    messageApi.success('执行解析成功');
    setResolveOpen(false);
    setMode('bindings');
    setBindingQuery((prev) => ({
      ...prev,
      keyword: `${values.subdomain}.${values.domain}`,
      ipv4: values.ipv4,
    }));
    clearSelection();
    await Promise.all([loadOverview(), loadOptions()]);
  }, [clearSelection, loadOptions, loadOverview, messageApi, modalApi, resolveForm]);

  const handleUnbindSubmit = useCallback(async () => {
    if (!unbindTarget?.fqdn || !unbindTarget?.ipv4) {
      messageApi.error('缺少解绑目标信息');
      return;
    }
    const ok = await new Promise<boolean>((resolve) => {
      modalApi.confirm({
        title: '确认解绑 DNS 记录？',
        content: '该操作会调用外部 DNS 服务并解除解析绑定，请谨慎操作。',
        okType: 'danger',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!ok) return;

    const res = await unbindDnsRecord(unbindTarget);
    if (res.code !== 0) {
      messageApi.error(res.msg || '解绑失败');
      return;
    }
    messageApi.success('解绑成功');
    setUnbindOpen(false);
    setUnbindTarget(null);
    await refreshAll();
    if (selectedDomain?.id) {
      loadDomainBindings(selectedDomain.id);
    }
    if (selectedBinding?.ipv4) {
      loadSameIpBindings(selectedBinding.ipv4);
    }
  }, [
    loadDomainBindings,
    loadSameIpBindings,
    messageApi,
    modalApi,
    refreshAll,
    selectedBinding?.ipv4,
    selectedDomain?.id,
    unbindTarget,
  ]);

  const handleMetaSave = useCallback(async () => {
    const values = await metaForm.validateFields();
    if (metaType === 'domain' && metaDomainRecord) {
      const res = await updateDnsDomainMeta({
        id: metaDomainRecord.id,
        tags: values.tags,
        note: values.note,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '保存失败');
        return;
      }
    }
    if (metaType === 'binding' && metaBindingRecord) {
      const res = await updateDnsIpBindingMeta({
        id: metaBindingRecord.id,
        tags: values.tags,
        note: values.note,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '保存失败');
        return;
      }
    }
    messageApi.success('保存成功');
    setMetaOpen(false);
    await refreshAll();
  }, [
    messageApi,
    metaBindingRecord,
    metaDomainRecord,
    metaForm,
    metaType,
    refreshAll,
  ]);

  const handleSaveProvider = useCallback(async () => {
    const values = await providerForm.validateFields();
    setProviderFormLoading(true);
    const res = providerEditing
      ? await updateDnsProvider({ ...values, id: providerEditing.id })
      : await createDnsProvider(values);
    setProviderFormLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '保存失败');
      return;
    }
    messageApi.success('保存成功');
    setProviderFormOpen(false);
    await refreshAll();
    actionRefProvider.current?.reload();
  }, [messageApi, providerEditing, providerForm, refreshAll]);

  const handleSaveAccount = useCallback(async () => {
    const values = await accountForm.validateFields();
    const providerCode = String(values.providerCode || '').trim();
    const isGodaddy = providerCode.toLowerCase() === 'godaddy';

    let authJson: Record<string, unknown> | undefined;
    if (isGodaddy) {
      const apiKey = values.apiKey?.trim();
      const apiSecret = values.apiSecret?.trim();
      if (!accountEditing && (!apiKey || !apiSecret)) {
        messageApi.error('Godaddy 需要填写 api_key 和 api_secret');
        return;
      }
      if (apiKey || apiSecret) {
        authJson = {};
        if (apiKey) authJson.api_key = apiKey;
        if (apiSecret) authJson.api_secret = apiSecret;
      }
    } else if (values.configJson?.trim()) {
      try {
        authJson = JSON.parse(values.configJson);
      } catch {
        messageApi.error('配置信息 格式错误');
        return;
      }
    }

    setAccountFormLoading(true);
    const payload = {
      providerCode,
      accountName: values.accountName,
      status: values.status,
      configJson: authJson,
      tags: values.tags,
      note: values.note,
    };
    const res = accountEditing
      ? await updateDnsProviderAccount({ ...payload, id: accountEditing.id })
      : await createDnsProviderAccount(payload);
    setAccountFormLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '保存失败');
      return;
    }
    messageApi.success('保存成功');
    setAccountFormOpen(false);
    await refreshAll();
    actionRefAccount.current?.reload();
  }, [accountEditing, accountForm, messageApi, refreshAll]);

  const bindingColumns = useMemo<ProColumns<API.DnsToolIpBinding>[]>(
    () => [
      {
        title: 'FQDN',
        dataIndex: 'fqdn',
        ellipsis: true,
        render: (_, record) => (
          <Typography.Text copyable={{ text: record.fqdn }}>{record.fqdn}</Typography.Text>
        ),
      },
      {
        title: 'IPv4',
        dataIndex: 'ipv4',
        width: 130,
        render: (_, record) => (
          <Typography.Text copyable={{ text: record.ipv4 }}>{record.ipv4}</Typography.Text>
        ),
      },
      { title: '子域名', dataIndex: 'subdomain', width: 110 },
      { title: '主域名', dataIndex: 'domainName', width: 160 },
      {
        title: 'Provider 账号',
        width: 170,
        render: (_, record) => record.providerAccountName || record.providerAccountId || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (_, record) => bindingStatusTag(record.status),
      },
      {
        title: '标签',
        dataIndex: 'tags',
        width: 160,
        render: (_, record) => (
          <Space size={[4, 4]} wrap>
            {parseTags(record.tags).map((tag, idx) => (
              <Tag key={`${idx}-${tag}`}>{tag}</Tag>
            ))}
            {!record.tags && '-'}
          </Space>
        ),
      },
      // { title: '备注', dataIndex: 'note', width: 180, ellipsis: true },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 170,
        render: (_, record) => formatUTC8(record.updatedAt),
      },
      {
        title: '操作',
        width: 220,
        fixed: 'right',
        render: (_, record) => (
          <Space size={6}>
            <Button
              type="link"
              size="small"
              danger
              icon={<DisconnectOutlined />}
              onClick={() => {
                setUnbindTarget({ fqdn: record.fqdn, ipv4: record.ipv4 });
                setUnbindOpen(true);
              }}
            >
              解绑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setMetaType('binding');
                setMetaDomainRecord(null);
                setMetaBindingRecord(record);
                metaForm.setFieldsValue({ tags: record.tags, note: record.note });
                setMetaOpen(true);
              }}
            >
              编辑元信息
            </Button>
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={async () => {
                setSelectedBinding(record);
                setSelectedDomain(null);
                setSelectedProvider(null);
                setSelectedAccount(null);
                await loadSameIpBindings(record.ipv4);
              }}
            >
              同 IP
            </Button>
          </Space>
        ),
      },
    ],
    [loadSameIpBindings, metaForm],
  );

  const providerColumns = useMemo<ProColumns<API.DnsToolProvider>[]>(
    () => [
      { title: 'ID', dataIndex: 'id', width: 60 },
      { title: 'Provider', dataIndex: 'name', width: 160 },
      { title: '标签', dataIndex: 'tags', width: 150, ellipsis: true },
      // { title: '备注', dataIndex: 'note', width: 170, ellipsis: true },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 170,
        render: (_, record) => formatUTC8(record.updatedAt),
      },
      {
        title: '操作',
        width: 120,
        fixed: 'right',
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            onClick={async () => {
              const res = await getDnsProviderDetail(record.id);
              if (res.code !== 0) {
                messageApi.error(res.msg || '获取详情失败');
                return;
              }
              setProviderEditing(record);
              providerForm.setFieldsValue({
                name: res.data.name,
                officialWebsite: res.data.officialWebsite || undefined,
                apiHost: res.data.apiHost || undefined,
                requestTimeout: res.data.requestTimeout,
                rateLimitPerMinute: res.data.rateLimitPerMinute,
                tags: res.data.tags,
                note: res.data.note,
              });
              setProviderFormOpen(true);
            }}
          >
            编辑
          </Button>
        ),
      },
    ],
    [messageApi, providerForm],
  );

  const accountColumns = useMemo<ProColumns<API.DnsToolProviderAccount>[]>(
    () => [
      { title: '账号名', dataIndex: 'accountName', width: 170 },
      { title: 'Provider', dataIndex: 'providerCode', width: 120 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (_, record) =>
          record.status === 'active' ? (
            <Tag color="success">active</Tag>
          ) : (
            <Tag color="warning">disabled</Tag>
          ),
      },
      { title: '标签', dataIndex: 'tags', width: 160, ellipsis: true },
      // { title: '备注', dataIndex: 'note', width: 170, ellipsis: true },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 170,
        render: (_, record) => formatUTC8(record.updatedAt),
      },
      {
        title: '操作',
        width: 220,
        fixed: 'right',
        render: (_, record) => (
          <Space size={2}>
            <Button
              type="link"
              size="small"
              loading={syncingAccountId === record.id}
              onClick={async () => {
                setSyncingAccountId(record.id);
                const res = await syncDnsDomains({ providerAccountId: record.id });
                setSyncingAccountId(null);
                if (res.code !== 0) {
                  messageApi.error(res.msg || '同步失败');
                  return;
                }
                messageApi.success('同步任务已触发');
                await refreshAll();
                actionRefDomain.current?.reload();
                actionRefAccount.current?.reload();
              }}
            >
              同步
            </Button>
            <Button
              type="link"
              size="small"
              onClick={async () => {
                const res = await getDnsProviderAccountDetail(record.id);
                if (res.code !== 0) {
                  messageApi.error(res.msg || '获取详情失败');
                  return;
                }
                setAccountEditing(record);
                const config = (res.data.configJson || {}) as Record<string, unknown>;
                accountForm.setFieldsValue({
                  providerCode: res.data.providerCode,
                  accountName: res.data.accountName,
                  status: res.data.status,
                  configJson: res.data.configJson
                    ? JSON.stringify(res.data.configJson, null, 2)
                    : '',
                  apiKey: typeof config.api_key === 'string' ? config.api_key : undefined,
                  apiSecret:
                    typeof config.api_secret === 'string' ? config.api_secret : undefined,
                  tags: res.data.tags,
                  note: res.data.note,
                });
                setAccountFormOpen(true);
              }}
            >
              编辑
            </Button>
          </Space>
        ),
      },
    ],
    [accountForm, messageApi, refreshAll, syncingAccountId],
  );

  const handleSelectDomain = useCallback(
    async (record: API.DnsToolDomain) => {
      setSelectedDomain(record);
      setSelectedBinding(null);
      setSelectedProvider(null);
      setSelectedAccount(null);
      setSameIpBindings([]);
      setDomainDetailOpen(true);
      await loadDomainBindings(record.id);
    },
    [loadDomainBindings],
  );

  const handleOverviewModeChange = useCallback(
    (nextMode: 'domains' | 'providers' | 'accounts') => {
      setMode(nextMode);
      clearSelection();
      if (nextMode === 'domains') {
        setDomainQuery({});
        if (mode === 'domains') actionRefDomain.current?.reload();
        return;
      }
      if (nextMode === 'providers' && mode === 'providers') {
        actionRefProvider.current?.reload();
        return;
      }
      if (nextMode === 'accounts' && mode === 'accounts') {
        actionRefAccount.current?.reload();
      }
    },
    [clearSelection, mode],
  );

  return (
    <PageContainer
      className="dns-tool-page"
      title="域名管理"
      subTitle="统一管理域名、解析记录、IP 绑定和 DNS 平台 配置"
    >
      <DomainOverviewCards
        mode={mode}
        loading={overviewLoading}
        overview={overview}
        onModeChange={handleOverviewModeChange}
      />

      <Row gutter={16} wrap={false} style={{ alignItems: 'flex-start' }}>
        <Col flex="auto" style={{ minWidth: 0 }}>
          <ProCard bodyStyle={{ paddingBottom: 8 }} style={{ borderRadius: 12 }} bordered>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {mode === 'domains'
                  ? '域名列表'
                  : mode === 'bindings'
                    ? '活跃绑定列表'
                    : mode === 'providers'
                      ? '平台列表'
                      : '平台账号列表'}
              </Typography.Title>

              {mode === 'domains' && (
                <DomainListPanel
                  actionRef={actionRefDomain}
                  query={domainQuery}
                  onQueryChange={setDomainQuery}
                  providerOptions={providerOptions}
                  providerAccountOptions={providerAccountOptions}
                  selectedId={selectedDomain?.id}
                  onSelectDomain={handleSelectDomain}
                  onOpenResolve={openResolveModal}
                  onEditMeta={(record) => {
                    setMetaType('domain');
                    setMetaDomainRecord(record);
                    setMetaBindingRecord(null);
                    metaForm.setFieldsValue({ tags: record.tags, note: record.note });
                    setMetaOpen(true);
                  }}
                  onRequestError={(msg) => messageApi.error(msg)}
                />
              )}

              {mode === 'bindings' && (
                <>
                  <Space wrap size={12}>
                    <Input
                      placeholder="关键词：FQDN / subdomain / IPv4 / tags / note"
                      value={bindingQuery.keyword}
                      onChange={(e) =>
                        setBindingQuery((prev) => ({
                          ...prev,
                          keyword: e.target.value || undefined,
                        }))
                      }
                      style={{ width: 280 }}
                    />
                    <Input
                      placeholder="IPv4 精确查询"
                      value={bindingQuery.ipv4}
                      onChange={(e) =>
                        setBindingQuery((prev) => ({
                          ...prev,
                          ipv4: e.target.value || undefined,
                        }))
                      }
                      style={{ width: 180 }}
                    />
                    <Select
                      allowClear
                      placeholder="Provider 账号"
                      value={bindingQuery.providerAccountId}
                      options={providerAccountOptions}
                      style={{ width: 220 }}
                      onChange={(value) =>
                        setBindingQuery((prev) => ({
                          ...prev,
                          providerAccountId: value as number | undefined,
                        }))
                      }
                    />
                    <Select
                      allowClear
                      placeholder="主域名"
                      value={bindingQuery.domainId}
                      options={domainOptions}
                      style={{ width: 180 }}
                      onChange={(value) =>
                        setBindingQuery((prev) => ({
                          ...prev,
                          domainId: value as number | undefined,
                        }))
                      }
                    />
                    <Select
                      allowClear
                      placeholder="绑定状态"
                      value={bindingQuery.status}
                      options={[
                        { label: 'active', value: 'active' },
                        { label: 'released', value: 'released' },
                      ]}
                      style={{ width: 140 }}
                      onChange={(value) =>
                        setBindingQuery((prev) => ({
                          ...prev,
                          status: value as API.DnsBindingStatus | undefined,
                        }))
                      }
                    />
                    <Button type="primary" onClick={() => actionRefBinding.current?.reload()}>
                      查询
                    </Button>
                    <Button
                      onClick={() => {
                        setBindingQuery({ status: 'active' });
                        actionRefBinding.current?.reloadAndRest?.();
                      }}
                    >
                      重置
                    </Button>
                  </Space>

                  <ProTable<API.DnsToolIpBinding>
                    rowKey="id"
                    actionRef={actionRefBinding}
                    columns={bindingColumns}
                    options={false}
                    search={false}
                    scroll={{x: '100%' }}
                    rowClassName={(record) =>
                      selectedBinding?.id === record.id ? 'dns-selected-row' : ''
                    }
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedBinding(record);
                        setSelectedDomain(null);
                        setSelectedProvider(null);
                        setSelectedAccount(null);
                        setSameIpBindings([]);
                      },
                    })}
                    request={async (params) => {
                      const res = await getDnsIpBindings({
                        ...bindingQuery,
                        page: params.current,
                        pageSize: params.pageSize,
                      });
                      if (res.code !== 0) {
                        messageApi.error(res.msg || 'IP 绑定数据加载失败');
                        return { data: [], total: 0, success: false };
                      }
                      const page = parsePagePayload<API.DnsToolIpBinding>(
                        res.data,
                        Number(params.current || 1),
                        Number(params.pageSize || 20),
                      );
                      return { data: page.list, total: page.total, success: true };
                    }}
                    pagination={{ showSizeChanger: true }}
                  />
                </>
              )}

              {mode === 'providers' && (
                <>
                  <Space wrap size={12}>
                    <Input
                      placeholder="关键词：name / tags / note"
                      value={providerQuery.keyword}
                      onChange={(e) =>
                        setProviderQuery({ keyword: e.target.value || undefined })
                      }
                      style={{ width: 280 }}
                    />
                    <Button type="primary" onClick={() => actionRefProvider.current?.reload()}>
                      查询
                    </Button>
                    <Button
                      onClick={() => {
                        setProviderQuery({});
                        actionRefProvider.current?.reloadAndRest?.();
                      }}
                    >
                      重置
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setProviderEditing(null);
                        providerForm.resetFields();
                        providerForm.setFieldsValue({
                          requestTimeout: 15,
                          rateLimitPerMinute: 60,
                        });
                        setProviderFormOpen(true);
                      }}
                    >
                      新增 Provider
                    </Button>
                  </Space>

                  <ProTable<API.DnsToolProvider>
                    rowKey="id"
                    actionRef={actionRefProvider}
                    columns={providerColumns}
                    options={false}
                    search={false}
                    scroll={{x: '100%' }}
                    rowClassName={(record) =>
                      selectedProvider?.id === record.id ? 'dns-selected-row' : ''
                    }
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedProvider(record);
                        setSelectedDomain(null);
                        setSelectedBinding(null);
                        setSelectedAccount(null);
                      },
                    })}
                    request={async (params) => {
                      const res = await getDnsProviders({
                        keyword: providerQuery.keyword,
                        page: params.current,
                        pageSize: params.pageSize,
                      });
                      if (res.code !== 0) {
                        messageApi.error(res.msg || 'Provider 列表加载失败');
                        return { data: [], total: 0, success: false };
                      }
                      const page = parsePagePayload<API.DnsToolProvider>(
                        res.data,
                        Number(params.current || 1),
                        Number(params.pageSize || 20),
                      );
                      return { data: page.list, total: page.total, success: true };
                    }}
                    pagination={{ showSizeChanger: true }}
                  />
                </>
              )}

              {mode === 'accounts' && (
                <>
                  <Space wrap size={12}>
                    <Input
                      placeholder="关键词：账号 / tags / note"
                      value={accountQuery.keyword}
                      onChange={(e) =>
                        setAccountQuery((prev) => ({
                          ...prev,
                          keyword: e.target.value || undefined,
                        }))
                      }
                      style={{ width: 260 }}
                    />
                    <Select
                      allowClear
                      placeholder="平台"
                      value={accountQuery.providerCode}
                      options={providerOptions}
                      style={{ width: 180 }}
                      onChange={(value) =>
                        setAccountQuery((prev) => ({
                          ...prev,
                          providerCode: value as string | undefined,
                        }))
                      }
                    />
                    <Select
                      allowClear
                      placeholder="状态"
                      value={accountQuery.status}
                      options={[
                        { label: 'active', value: 'active' },
                        { label: 'disabled', value: 'disabled' },
                      ]}
                      style={{ width: 140 }}
                      onChange={(value) =>
                        setAccountQuery((prev) => ({
                          ...prev,
                          status: value as API.DnsAccountStatus | undefined,
                        }))
                      }
                    />
                    <Button type="primary" onClick={() => actionRefAccount.current?.reload()}>
                      查询
                    </Button>
                    <Button
                      onClick={() => {
                        setAccountQuery({});
                        actionRefAccount.current?.reloadAndRest?.();
                      }}
                    >
                      重置
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        setAccountEditing(null);
                        accountForm.resetFields();
                        accountForm.setFieldsValue({
                          status: 'active',
                          configJson: '{\n\n}',
                          apiKey: undefined,
                          apiSecret: undefined,
                        });
                        setAccountFormOpen(true);
                      }}
                    >
                      新增账号
                    </Button>
                  </Space>

                  <ProTable<API.DnsToolProviderAccount>
                    rowKey="id"
                    actionRef={actionRefAccount}
                    columns={accountColumns}
                    options={false}
                    search={false}
                    scroll={{x: '100%' }}
                    rowClassName={(record) =>
                      selectedAccount?.id === record.id ? 'dns-selected-row' : ''
                    }
                    onRow={(record) => ({
                      onClick: () => {
                        setSelectedAccount(record);
                        setSelectedDomain(null);
                        setSelectedBinding(null);
                        setSelectedProvider(null);
                      },
                    })}
                    request={async (params) => {
                      const res = await getDnsProviderAccounts({
                        keyword: accountQuery.keyword,
                        providerCode: accountQuery.providerCode,
                        status: accountQuery.status,
                        page: params.current,
                        pageSize: params.pageSize,
                      });
                      if (res.code !== 0) {
                        messageApi.error(res.msg || '账号列表加载失败');
                        return { data: [], total: 0, success: false };
                      }
                      const page = parsePagePayload<API.DnsToolProviderAccount>(
                        res.data,
                        Number(params.current || 1),
                        Number(params.pageSize || 20),
                      );
                      return { data: page.list, total: page.total, success: true };
                    }}
                    pagination={{ showSizeChanger: true }}
                  />
                </>
              )}
            </Space>
          </ProCard>
        </Col>
      </Row>

      <DomainDetailDrawer
        open={domainDetailOpen}
        loading={detailLoading}
        domain={selectedDomain}
        bindings={domainBindings}
        onClose={() => setDomainDetailOpen(false)}
        onEditBindingMeta={(binding) => {
          setMetaType('binding');
          setMetaDomainRecord(null);
          setMetaBindingRecord(binding);
          metaForm.setFieldsValue({ tags: binding.tags, note: binding.note });
          setMetaOpen(true);
        }}
        onUnbindBinding={(binding) => {
          setUnbindTarget({ fqdn: binding.fqdn, ipv4: binding.ipv4 });
          setUnbindOpen(true);
        }}
      />

      <Modal
        open={resolveOpen}
        title="执行 DNS 解析"
        width={620}
        destroyOnHidden
        onCancel={() => setResolveOpen(false)}
        onOk={handleResolveSubmit}
        okText="确认解析"
      >
        <Form form={resolveForm} layout="vertical" preserve={false} initialValues={{ unique: false }}>
          <Form.Item
            name="ipv4"
            label="IPv4 地址"
            rules={[
              { required: true, message: '请输入 IPv4 地址' },
              { pattern: IP_V4_PATTERN, message: 'IPv4 格式不正确' },
            ]}
          >
            <Input placeholder="1.2.3.4" />
          </Form.Item>
          <Form.Item
            name="domain"
            label="主域名"
            rules={[{ required: true, message: '请选择主域名' }]}
          >
            <Select
              showSearch
              options={domainOptions.map((item) => ({
                label: item.label,
                value: item.label,
              }))}
              placeholder="请选择主域名"
            />
          </Form.Item>
          <Form.Item
            name="subdomain"
            label="子域名"
            rules={[{ required: true, message: '请输入子域名' }]}
          >
            <Input placeholder="node-a" />
          </Form.Item>
          <Form.Item name="unique" label="唯一绑定" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message="该操作会调用外部 DNS 服务，请确认域名、子域名和 IP 地址正确。"
          />
        </Form>
      </Modal>

      <Modal
        open={unbindOpen}
        title="解绑 DNS 记录"
        width={560}
        destroyOnHidden
        onCancel={() => {
          setUnbindOpen(false);
          setUnbindTarget(null);
        }}
        onOk={handleUnbindSubmit}
        okButtonProps={{ danger: true }}
        okText="确认解绑"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary">FQDN</Typography.Text>
            <div>
              <Typography.Text copyable={{ text: unbindTarget?.fqdn || '' }}>
                {unbindTarget?.fqdn || '-'}
              </Typography.Text>
            </div>
          </div>
          <div>
            <Typography.Text type="secondary">IPv4 地址</Typography.Text>
            <div>
              <Typography.Text copyable={{ text: unbindTarget?.ipv4 || '' }}>
                {unbindTarget?.ipv4 || '-'}
              </Typography.Text>
            </div>
          </div>
          <Alert
            type="error"
            showIcon
            message="该操作会调用外部 DNS 服务并解除解析绑定，请谨慎操作。"
          />
        </Space>
      </Modal>

      <Modal
        open={metaOpen}
        title={metaType === 'domain' ? '编辑域名元信息' : '编辑绑定元信息'}
        width={540}
        destroyOnHidden
        onCancel={() => setMetaOpen(false)}
        onOk={handleMetaSave}
      >
        <Form form={metaForm} layout="vertical" preserve={false}>
          {metaType === 'domain' ? (
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary">域名</Typography.Text>
              <div>
                <Typography.Text copyable={{ text: metaDomainRecord?.domainName || '' }}>
                  {metaDomainRecord?.domainName || '-'}
                </Typography.Text>
              </div>
            </div>
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
              <div>
                <Typography.Text type="secondary">FQDN</Typography.Text>
                <div>
                  <Typography.Text copyable={{ text: metaBindingRecord?.fqdn || '' }}>
                    {metaBindingRecord?.fqdn || '-'}
                  </Typography.Text>
                </div>
              </div>
              <div>
                <Typography.Text type="secondary">IPv4</Typography.Text>
                <div>
                  <Typography.Text copyable={{ text: metaBindingRecord?.ipv4 || '' }}>
                    {metaBindingRecord?.ipv4 || '-'}
                  </Typography.Text>
                </div>
              </div>
            </Space>
          )}
          <Form.Item name="tags" label="标签">
            <Input placeholder="如 vip,prod" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={providerFormOpen}
        title={providerEditing ? '编辑 Provider' : '新增 Provider'}
        width={700}
        destroyOnHidden
        confirmLoading={providerFormLoading}
        onCancel={() => setProviderFormOpen(false)}
        onOk={handleSaveProvider}
      >
        <Form form={providerForm} layout="vertical" preserve={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="officialWebsite"
                label="官方网站"
                rules={[{ type: 'url', message: 'URL 格式不正确' }]}
              >
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="apiHost"
                label="API Host"
                rules={[{ type: 'url', message: 'URL 格式不正确' }]}
              >
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="requestTimeout" label="请求超时（秒）">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="rateLimitPerMinute" label="限流/分钟">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Input placeholder="prod,global" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={accountFormOpen}
        title={accountEditing ? '编辑 平台账号' : '新增 平台账号'}
        width={760}
        destroyOnHidden
        confirmLoading={accountFormLoading}
        onCancel={() => setAccountFormOpen(false)}
        onOk={handleSaveAccount}
      >
        <Form form={accountForm} layout="vertical" preserve={false}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="providerCode"
                label="平台"
                rules={[{ required: true, message: '请选择平台' }]}
              >
                <Select
                  options={providerOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountName"
                label="账号名称"
                rules={[{ required: true, message: '请输入账号名称' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select
                  options={[
                    { label: 'active', value: 'active' },
                    { label: 'disabled', value: 'disabled' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Input placeholder="prod,main" />
              </Form.Item>
            </Col>
          </Row>

          {isGodaddyProvider ? (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="apiKey"
                  label="api_key"
                  rules={
                    accountEditing
                      ? []
                      : [{ required: true, message: '请输入 api_key' }]
                  }
                >
                  <Input placeholder="请输入 api_key" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="apiSecret"
                  label="api_secret"
                  rules={
                    accountEditing
                      ? []
                      : [{ required: true, message: '请输入 api_secret' }]
                  }
                  extra={accountEditing ? '留空表示不修改密钥' : undefined}
                >
                  <Input.Password placeholder="请输入 api_secret" />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <Form.Item
              name="configJson"
              label="配置信息"
              extra="编辑时如后端不返回明文密钥，留空表示不修改密钥"
            >
              <Input.TextArea
                rows={10}
                style={{ fontFamily: 'Consolas, Monaco, monospace', background: '#f7f8fa' }}
                placeholder={'{\n  "api_key": "***",\n  "api_secret": "***"\n}'}
              />
            </Form.Item>
          )}

          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DnsPage;
