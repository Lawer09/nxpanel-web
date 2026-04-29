import { Line } from '@ant-design/charts';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Statistic,
  Switch,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createTrafficAccount,
  createTrafficPlatform,
  getTrafficAccounts,
  getTrafficAccountDetail,
  getTrafficDaily,
  getTrafficHourly,
  getTrafficMonthly,
  getTrafficPlatforms,
  getTrafficRanking,
  getTrafficSyncJobDetail,
  getTrafficSyncJobs,
  getTrafficTrend,
  testTrafficAccount,
  toggleTrafficAccountStatus,
  toggleTrafficPlatformStatus,
  triggerTrafficSync,
  updateTrafficAccount,
  updateTrafficPlatform,
} from '@/services/traffic-platform/api';
import { formatTrafficDateTime } from '../utils';

const { RangePicker } = DatePicker;

const toNumber = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toGb = (row: any) => {
  if (row?.trafficGb !== undefined && row?.trafficGb !== null && row?.trafficGb !== '') {
    return toNumber(row.trafficGb);
  }
  if (row?.trafficMb !== undefined && row?.trafficMb !== null && row?.trafficMb !== '') {
    return toNumber(row.trafficMb) / 1024;
  }
  return 0;
};

const pickPageRows = (res: any) => {
  const lv1 = res?.data;
  if (Array.isArray(lv1?.data)) {
    return { rows: lv1.data, total: toNumber(lv1?.total ?? lv1.data.length) };
  }
  if (Array.isArray(lv1?.data?.data)) {
    return { rows: lv1.data.data, total: toNumber(lv1.data?.total ?? lv1.data.data.length) };
  }
  if (Array.isArray(lv1)) {
    return { rows: lv1, total: lv1.length };
  }
  return { rows: [], total: 0 };
};

const TrafficDashboardPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [activeTab, setActiveTab] = useState('trend');
  const [queryVer, setQueryVer] = useState(1);

  const today = dayjs();
  const [dateRange, setDateRange] = useState<[string, string]>([
    today.subtract(6, 'day').format('YYYY-MM-DD'),
    today.format('YYYY-MM-DD'),
  ]);
  const [platformCode, setPlatformCode] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [externalUid, setExternalUid] = useState<string | undefined>();
  const [geo, setGeo] = useState<string | undefined>();
  const [granularity, setGranularity] = useState<'hour' | 'day' | 'month'>('day');

  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  const [overview, setOverview] = useState({ todayGb: 0, yesterdayGb: 0, monthGb: 0, enabledAccounts: 0 });
  const [trendData, setTrendData] = useState<{ time: string; trafficGb: number }[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [rankBy, setRankBy] = useState<'account' | 'external_uid' | 'geo'>('account');
  const [rankLimit, setRankLimit] = useState(20);

  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [accountCurrent, setAccountCurrent] = useState<API.TrafficAccountDetail | undefined>();
  const [accountSubmitLoading, setAccountSubmitLoading] = useState(false);
  const [accountForm] = Form.useForm();

  const [platformFormOpen, setPlatformFormOpen] = useState(false);
  const [platformCurrent, setPlatformCurrent] = useState<API.TrafficPlatformItem | undefined>();
  const [platformSubmitLoading, setPlatformSubmitLoading] = useState(false);
  const [platformForm] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.TrafficSyncJobDetail | undefined>();

  const [syncOpen, setSyncOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncForm] = Form.useForm();

  const detailActionRef = useRef<ActionType | null>(null);
  const rankingActionRef = useRef<ActionType | null>(null);
  const accountActionRef = useRef<ActionType | null>(null);
  const platformActionRef = useRef<ActionType | null>(null);
  const syncActionRef = useRef<ActionType | null>(null);

  const commonUsageParams = useMemo(
    () => ({ platformCode, accountId, externalUid, geo }),
    [platformCode, accountId, externalUid, geo],
  );

  const reloadCurrentTab = () => {
    setQueryVer((v) => v + 1);
    if (activeTab === 'detail') detailActionRef.current?.reload();
    if (activeTab === 'ranking') rankingActionRef.current?.reload();
    if (activeTab === 'accounts') accountActionRef.current?.reload();
    if (activeTab === 'platforms') platformActionRef.current?.reload();
    if (activeTab === 'sync-jobs') syncActionRef.current?.reload();
  };

  const fetchPlatforms = async () => {
    const res = await getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 });
    const { rows } = pickPageRows(res);
    setPlatformOptions(rows.map((p: API.TrafficPlatformItem) => ({ label: p.name, value: p.code })));
  };

  const fetchAccounts = async (pc?: string) => {
    const res = await getTrafficAccounts({ enabled: 1, platformCode: pc, page: 1, pageSize: 200 });
    const { rows } = pickPageRows(res);
    setAccountOptions(rows.map((a: API.TrafficAccountItem) => ({ label: `${a.accountName} (${a.platformCode})`, value: a.id })));
  };

  useEffect(() => {
    fetchPlatforms();
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchAccounts(platformCode);
    setAccountId(undefined);
  }, [platformCode]);

  useEffect(() => {
    const run = async () => {
      setTrendLoading(true);
      try {
        const [todayRes, yRes, monthRes, accRes, trendRes] = await Promise.all([
          getTrafficDaily({ ...commonUsageParams, startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD'), page: 1, pageSize: 200 }),
          getTrafficDaily({ ...commonUsageParams, startDate: today.subtract(1, 'day').format('YYYY-MM-DD'), endDate: today.subtract(1, 'day').format('YYYY-MM-DD'), page: 1, pageSize: 200 }),
          getTrafficMonthly({ platformCode, accountId, externalUid, startMonth: today.format('YYYY-MM'), endMonth: today.format('YYYY-MM'), page: 1, pageSize: 200 }),
          getTrafficAccounts({ platformCode, enabled: 1, page: 1, pageSize: 1 }),
          getTrafficTrend({
            platformCode,
            accountId,
            externalUid,
            startDate: dateRange[0],
            endDate: dateRange[1],
            dimension: granularity,
          }),
        ]);

        const todayRows = pickPageRows(todayRes).rows;
        const yRows = pickPageRows(yRes).rows;
        const monthRows = pickPageRows(monthRes).rows;
        const accTotal = pickPageRows(accRes).total;

        setOverview({
          todayGb: todayRows.reduce((s: number, r: any) => s + toGb(r), 0),
          yesterdayGb: yRows.reduce((s: number, r: any) => s + toGb(r), 0),
          monthGb: monthRows.reduce((s: number, r: any) => s + toGb(r), 0),
          enabledAccounts: accTotal,
        });

        const trendPayload = (trendRes as any)?.data?.data ?? trendRes.data;
        const trendRows = Array.isArray(trendPayload) ? trendPayload : [];
        setTrendData(trendRows.map((r: API.TrafficTrendItem) => ({ time: r.time, trafficGb: toGb(r) })));
      } catch {
        setTrendData([]);
      }
      setTrendLoading(false);
    };
    run();
  }, [queryVer]);

  const detailColumns: ProColumns<any>[] =
    granularity === 'hour'
      ? [
          { title: '时间', dataIndex: 'statTime', width: 180, render: (_, r) => formatTrafficDateTime(r.statTime) },
          { title: '平台', dataIndex: 'platformCode', width: 100 },
          { title: '账号', dataIndex: 'accountName', width: 140 },
          { title: '子账号', key: 'uid', width: 180, render: (_, r) => r.externalUsername || r.externalUid || '-' },
          { title: '地区', key: 'geo', width: 140, render: (_, r) => r.geo || r.region || '-' },
          { title: '流量 MB', dataIndex: 'trafficMb', width: 120 },
        ]
      : granularity === 'day'
        ? [
            { title: '日期', dataIndex: 'statDate', width: 140 },
            { title: '平台', dataIndex: 'platformCode', width: 100 },
            { title: '账号', dataIndex: 'accountName', width: 140 },
            { title: '子账号', key: 'uid', width: 180, render: (_, r) => r.externalUsername || r.externalUid || '-' },
            { title: '地区', key: 'geo', width: 140, render: (_, r) => r.geo || r.region || '-' },
            { title: '流量 GB', key: 'gb', width: 120, render: (_, r) => toGb(r).toFixed(3) },
          ]
        : [
            { title: '月份', dataIndex: 'statMonth', width: 140 },
            { title: '平台', dataIndex: 'platformCode', width: 100 },
            { title: '账号', dataIndex: 'accountName', width: 140 },
            { title: '子账号', key: 'uid', width: 180, render: (_, r) => r.externalUsername || r.externalUid || '-' },
            { title: '流量 GB', key: 'gb', width: 120, render: (_, r) => toGb(r).toFixed(3) },
          ];

  const rankingColumns: ProColumns<any>[] = [
    { title: '排名', key: 'idx', width: 80, render: (_, __, idx) => idx + 1 },
    {
      title: '对象',
      key: 'name',
      width: 260,
      render: (_, r) => {
        if (rankBy === 'account') return r.accountName || r.platformCode || r.platformAccountId || '-';
        if (rankBy === 'external_uid') return r.externalUsername || r.externalUid || '-';
        return r.region || r.geo || '-';
      },
    },
    { title: '流量 GB', key: 'gb', width: 140, render: (_, r) => toGb(r).toFixed(3) },
  ];

  const accountColumns: ProColumns<API.TrafficAccountItem>[] = [
    { title: '平台', dataIndex: 'platformCode', width: 110 },
    { title: '账号名称', dataIndex: 'accountName', width: 150 },
    { title: '外部账号ID', dataIndex: 'externalAccountId', width: 140 },
    { title: '时区', dataIndex: 'timezone', width: 140 },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 120,
      render: (_, r) => (
        <Switch
          checked={r.enabled === 1}
          onChange={async () => {
            const res = await toggleTrafficAccountStatus(r.id, r.enabled === 1 ? 0 : 1);
            if (res.code !== 0) {
              messageApi.error(res.msg || '操作失败');
              return;
            }
            accountActionRef.current?.reload();
          }}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, r) => [
        <a
          key="edit"
          onClick={async () => {
            const detailRes = await getTrafficAccountDetail(r.id);
            if (detailRes.code !== 0) {
              messageApi.error(detailRes.msg || '获取详情失败');
              return;
            }
            setAccountCurrent(detailRes.data);
            accountForm.setFieldsValue({
              ...detailRes.data,
              credentialAccessid: detailRes.data.credentialMasked?.accessid ?? '',
              credentialSecret: '',
            });
            setAccountFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="test"
          onClick={async () => {
            const res = await testTrafficAccount(r.id);
            if (res.code !== 0) {
              messageApi.error(res.msg || '测试失败');
              return;
            }
            const ov = res.data?.overview || res.data?.debug?.overview || res.data;
            Modal.success({
              title: '测试成功',
              content: (
                <div>
                  <div>余额: {ov?.balance ?? 0}</div>
                  <div>今日用量: {ov?.todayUse ?? ov?.today_use ?? 0}</div>
                  <div>本月用量: {ov?.monthUse ?? ov?.month_use ?? 0}</div>
                </div>
              ),
            });
          }}
        >
          测试连接
        </a>,
      ],
    },
  ];

  const platformColumns: ProColumns<API.TrafficPlatformItem>[] = [
    { title: '平台编码', dataIndex: 'code', width: 120 },
    { title: '平台名称', dataIndex: 'name', width: 140 },
    { title: 'API地址', dataIndex: 'baseUrl', width: 260, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 120,
      render: (_, r) => (
        <Switch
          checked={r.enabled === 1}
          onChange={async () => {
            const res = await toggleTrafficPlatformStatus(r.id, r.enabled === 1 ? 0 : 1);
            if (res.code !== 0) {
              messageApi.error(res.msg || '操作失败');
              return;
            }
            platformActionRef.current?.reload();
          }}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a
          key="edit"
          onClick={() => {
            setPlatformCurrent(r);
            platformForm.setFieldsValue(r);
            setPlatformFormOpen(true);
          }}
        >
          编辑
        </a>,
      ],
    },
  ];

  const syncColumns: ProColumns<API.TrafficSyncJobItem>[] = [
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, r) => <Tag color={r.status === 'success' ? 'success' : r.status === 'failed' ? 'error' : 'processing'}>{r.status}</Tag>,
    },
    { title: '开始时间', dataIndex: 'startTime', width: 170, render: (_, r) => formatTrafficDateTime(r.startTime) },
    { title: '结束时间', dataIndex: 'endTime', width: 170, render: (_, r) => formatTrafficDateTime(r.endTime) },
    { title: '错误信息', dataIndex: 'errorMessage', width: 200, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: (_, r) => formatTrafficDateTime(r.createdAt) },
    {
      title: '操作',
      valueType: 'option',
      render: (_, r) => [
        <a
          key="detail"
          onClick={async () => {
            const res = await getTrafficSyncJobDetail(r.id);
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取详情失败');
              return;
            }
            setDetailRow(res.data);
            setDetailOpen(true);
          }}
        >
          查看详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title="代理流量看板">
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Card>
          <Space wrap>
            <Select allowClear placeholder="平台" style={{ width: 150 }} value={platformCode} onChange={setPlatformCode} options={platformOptions} />
            <Select
              allowClear
              placeholder="账号"
              style={{ width: 240 }}
              value={accountId}
              onChange={setAccountId}
              options={accountOptions}
              showSearch
              optionFilterProp="label"
            />
            <Input placeholder="子账号 externalUid" style={{ width: 180 }} value={externalUid} onChange={(e) => setExternalUid(e.target.value || undefined)} />
            <Input placeholder="地区 geo" style={{ width: 140 }} value={geo} onChange={(e) => setGeo(e.target.value || undefined)} />
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                const [start, end] = dates ?? [];
                if (!start || !end) return;
                setDateRange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
              }}
            />
            <Select
              value={granularity}
              style={{ width: 110 }}
              onChange={setGranularity}
              options={[
                { label: '小时', value: 'hour' },
                { label: '日', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
            <Button type="primary" onClick={reloadCurrentTab}>查询</Button>
            <Button onClick={() => setSyncOpen(true)}>手动同步</Button>
          </Space>
        </Card>

        <Card>
          <Space size={24} wrap>
            <Statistic title="今日流量" value={overview.todayGb} precision={2} suffix="GB" />
            <Statistic title="昨日流量" value={overview.yesterdayGb} precision={2} suffix="GB" />
            <Statistic title="本月流量" value={overview.monthGb} precision={2} suffix="GB" />
            <Statistic title="账号数量" value={overview.enabledAccounts} suffix="个" />
          </Space>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'trend',
              label: '流量趋势',
              children: (
                <Card>
                  <Line
                    height={380}
                    loading={trendLoading}
                    data={trendData}
                    xField="time"
                    yField="trafficGb"
                    smooth
                    point={{ size: 3 }}
                  />
                </Card>
              ),
            },
            {
              key: 'detail',
              label: '流量明细',
              children: (
                <ProTable<any>
                  rowKey={(r) => `${r.platformAccountId || ''}_${r.statTime || r.statDate || r.statMonth || ''}_${r.externalUid || ''}_${r.geo || ''}`}
                  actionRef={detailActionRef}
                  search={false}
                  toolBarRender={false}
                  columns={detailColumns}
                  params={{ queryVer, granularity, ...commonUsageParams, dateRange: `${dateRange[0]}_${dateRange[1]}` }}
                  request={async (params) => {
                    if (granularity === 'hour') {
                      const res = await getTrafficHourly({
                        platformCode,
                        accountId,
                        externalUid,
                        geo,
                        startTime: `${dateRange[0]} 00:00:00`,
                        endTime: `${dateRange[1]} 23:59:59`,
                        page: params.current,
                        pageSize: params.pageSize,
                      });
                      const { rows, total } = pickPageRows(res);
                      return { data: rows, total, success: true };
                    }
                    if (granularity === 'day') {
                      const res = await getTrafficDaily({
                        platformCode,
                        accountId,
                        externalUid,
                        geo,
                        startDate: dateRange[0],
                        endDate: dateRange[1],
                        page: params.current,
                        pageSize: params.pageSize,
                      });
                      const { rows, total } = pickPageRows(res);
                      return { data: rows, total, success: true };
                    }
                    const res = await getTrafficMonthly({
                      platformCode,
                      accountId,
                      externalUid,
                      startMonth: dayjs(dateRange[0]).format('YYYY-MM'),
                      endMonth: dayjs(dateRange[1]).format('YYYY-MM'),
                      page: params.current,
                      pageSize: params.pageSize,
                    });
                    const { rows, total } = pickPageRows(res);
                    return { data: rows, total, success: true };
                  }}
                  pagination={{ defaultPageSize: 50, showSizeChanger: true }}
                  scroll={{ x: 1200 }}
                />
              ),
            },
            {
              key: 'ranking',
              label: '流量排行',
              children: (
                <ProTable<any>
                  rowKey={(r) => `${rankBy}_${r.platformAccountId || ''}_${r.externalUid || r.geo || ''}`}
                  actionRef={rankingActionRef}
                  search={false}
                  columns={rankingColumns}
                  params={{ queryVer, rankBy, rankLimit, platformCode, dateRange: `${dateRange[0]}_${dateRange[1]}` }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <Select
                          value={rankBy}
                          style={{ width: 140 }}
                          onChange={(v) => setRankBy(v)}
                          options={[
                            { label: '按账号', value: 'account' },
                            { label: '按子账号', value: 'external_uid' },
                            { label: '按地区', value: 'geo' },
                          ]}
                        />
                        <Space.Compact>
                          <Button disabled>Top</Button>
                          <InputNumber min={1} max={100} value={rankLimit} onChange={(v) => setRankLimit(v ?? 20)} />
                        </Space.Compact>
                      </Space>
                    ),
                  }}
                  request={async () => {
                    const res = await getTrafficRanking({
                      platformCode,
                      startDate: dateRange[0],
                      endDate: dateRange[1],
                      rankBy,
                      limit: rankLimit,
                    });
                    const payload = (res as any)?.data?.data ?? res.data;
                    const rows = Array.isArray(payload) ? payload : [];
                    return { data: rows, total: rows.length, success: true };
                  }}
                  pagination={false}
                />
              ),
            },
            {
              key: 'accounts',
              label: '账号管理',
              children: (
                <ProTable<API.TrafficAccountItem>
                  rowKey="id"
                  actionRef={accountActionRef}
                  search={false}
                  columns={accountColumns}
                  params={{ queryVer, platformCode }}
                  toolBarRender={() => [
                    <Button
                      key="add"
                      type="primary"
                      onClick={() => {
                        setAccountCurrent(undefined);
                        accountForm.resetFields();
                        accountForm.setFieldsValue({ enabled: 1, timezone: 'Asia/Shanghai' });
                        setAccountFormOpen(true);
                      }}
                    >
                      新增账号
                    </Button>,
                  ]}
                  request={async (params) => {
                    const res = await getTrafficAccounts({
                      platformCode,
                      keyword: params.keyword as string | undefined,
                      page: params.current,
                      pageSize: params.pageSize,
                    });
                    const { rows, total } = pickPageRows(res);
                    return { data: rows, total, success: true };
                  }}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'platforms',
              label: '平台配置',
              children: (
                <ProTable<API.TrafficPlatformItem>
                  rowKey="id"
                  actionRef={platformActionRef}
                  search={false}
                  columns={platformColumns}
                  params={{ queryVer }}
                  toolBarRender={() => [
                    <Button
                      key="add"
                      type="primary"
                      onClick={() => {
                        setPlatformCurrent(undefined);
                        platformForm.resetFields();
                        platformForm.setFieldsValue({ enabled: 1, supportsHourly: 0 });
                        setPlatformFormOpen(true);
                      }}
                    >
                      新增平台
                    </Button>,
                  ]}
                  request={async (params) => {
                    const res = await getTrafficPlatforms({ keyword: params.keyword as string | undefined, page: params.current, pageSize: params.pageSize });
                    const { rows, total } = pickPageRows(res);
                    return { data: rows, total, success: true };
                  }}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'sync-jobs',
              label: '同步任务',
              children: (
                <ProTable<API.TrafficSyncJobItem>
                  rowKey="id"
                  actionRef={syncActionRef}
                  search={false}
                  columns={syncColumns}
                  params={{ queryVer, platformCode, accountId, dateRange: `${dateRange[0]}_${dateRange[1]}` }}
                  request={async (params) => {
                    const res = await getTrafficSyncJobs({
                      platformCode,
                      accountId,
                      status: params.status as string | undefined,
                      startTime: `${dateRange[0]} 00:00:00`,
                      endTime: `${dateRange[1]} 23:59:59`,
                      page: params.current,
                      pageSize: params.pageSize,
                    });
                    const { rows, total } = pickPageRows(res);
                    return { data: rows, total, success: true };
                  }}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                />
              ),
            },
          ]}
        />
      </Space>

      <Modal
        title={accountCurrent ? '编辑账号' : '新增账号'}
        open={accountFormOpen}
        onCancel={() => setAccountFormOpen(false)}
        onOk={async () => {
          const values = await accountForm.validateFields();
          setAccountSubmitLoading(true);
          const payload: API.TrafficAccountCreateParams = {
            platformCode: values.platformCode,
            accountName: values.accountName,
            externalAccountId: values.externalAccountId,
            credential: { accessid: values.credentialAccessid, secret: values.credentialSecret || '' },
            timezone: values.timezone,
            enabled: values.enabled,
            remark: values.remark,
          };
          const res = accountCurrent?.id
            ? await updateTrafficAccount(accountCurrent.id, payload as API.TrafficAccountUpdateParams)
            : await createTrafficAccount(payload);
          setAccountSubmitLoading(false);
          if (res.code !== 0) {
            messageApi.error(res.msg || '保存失败');
            return;
          }
          setAccountFormOpen(false);
          accountActionRef.current?.reload();
        }}
        confirmLoading={accountSubmitLoading}
        destroyOnHidden
        width={560}
      >
        <Form form={accountForm} layout="vertical" preserve={false}>
          {!accountCurrent ? (
            <Form.Item name="platformCode" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
              <Select options={platformOptions} />
            </Form.Item>
          ) : null}
          <Form.Item name="accountName" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}><Input /></Form.Item>
          <Form.Item name="externalAccountId" label="外部账号ID" rules={[{ required: true, message: '请输入外部账号ID' }]}><Input /></Form.Item>
          <Form.Item name="credentialAccessid" label="accessid" rules={[{ required: !accountCurrent, message: '请输入 accessid' }]}><Input /></Form.Item>
          <Form.Item name="credentialSecret" label="secret" rules={[{ required: !accountCurrent, message: '请输入 secret' }]}><Input.Password placeholder={accountCurrent ? '留空不修改' : ''} /></Form.Item>
          <Form.Item name="timezone" label="timezone" initialValue="Asia/Shanghai"><Input /></Form.Item>
          <Form.Item name="enabled" label="enabled" initialValue={1}><Select options={[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={platformCurrent ? '编辑平台' : '新增平台'}
        open={platformFormOpen}
        onCancel={() => setPlatformFormOpen(false)}
        onOk={async () => {
          const values = await platformForm.validateFields();
          setPlatformSubmitLoading(true);
          const res = platformCurrent?.id
            ? await updateTrafficPlatform(platformCurrent.id, values)
            : await createTrafficPlatform(values);
          setPlatformSubmitLoading(false);
          if (res.code !== 0) {
            messageApi.error(res.msg || '保存失败');
            return;
          }
          setPlatformFormOpen(false);
          platformActionRef.current?.reload();
          fetchPlatforms();
        }}
        confirmLoading={platformSubmitLoading}
        destroyOnHidden
      >
        <Form form={platformForm} layout="vertical" preserve={false}>
          {!platformCurrent ? <Form.Item name="code" label="平台编码" rules={[{ required: true, message: '请输入平台编码' }]}><Input /></Form.Item> : null}
          <Form.Item name="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}><Input /></Form.Item>
          <Form.Item name="baseUrl" label="API地址" rules={[{ required: true, message: '请输入API地址' }]}><Input /></Form.Item>
          <Form.Item name="enabled" label="enabled" initialValue={1}><InputNumber min={0} max={1} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title="手动同步"
        open={syncOpen}
        onCancel={() => setSyncOpen(false)}
        onOk={async () => {
          const v = await syncForm.validateFields();
          setSyncLoading(true);
          const res = await triggerTrafficSync({
            accountId: v.accountId,
            platformCode: v.platformCode,
            startDate: v.dateRange[0].format('YYYY-MM-DD'),
            endDate: v.dateRange[1].format('YYYY-MM-DD'),
          });
          setSyncLoading(false);
          if (res.code !== 0) {
            messageApi.error(res.msg || '提交失败');
            return;
          }
          messageApi.success(`已提交，同步任务ID: ${res.data?.jobId}`);
          setSyncOpen(false);
          syncActionRef.current?.reload();
        }}
        confirmLoading={syncLoading}
        destroyOnHidden
      >
        <Form form={syncForm} layout="vertical" preserve={false}>
          <Form.Item name="platformCode" label="平台（可选）"><Select allowClear options={platformOptions} /></Form.Item>
          <Form.Item name="accountId" label="账号" rules={[{ required: true, message: '请选择账号' }]}>
            <Select options={accountOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="同步任务详情" width={620} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {detailRow ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="平台">{detailRow.platformCode}</Descriptions.Item>
            <Descriptions.Item label="账号">{detailRow.accountName}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{formatTrafficDateTime(detailRow.startTime)}</Descriptions.Item>
            <Descriptions.Item label="结束时间">{formatTrafficDateTime(detailRow.endTime)}</Descriptions.Item>
            <Descriptions.Item label="状态">{detailRow.status}</Descriptions.Item>
            <Descriptions.Item label="错误信息">{detailRow.errorMessage || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatTrafficDateTime(detailRow.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatTrafficDateTime(detailRow.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="请求参数"><pre style={{ margin: 0 }}>{JSON.stringify(detailRow.requestParams, null, 2)}</pre></Descriptions.Item>
            <Descriptions.Item label="响应摘要"><pre style={{ margin: 0 }}>{JSON.stringify(detailRow.responseSummary, null, 2)}</pre></Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default TrafficDashboardPage;
