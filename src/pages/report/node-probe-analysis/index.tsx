import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, Input, InputNumber, Select, Space, Switch, Tabs, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useRef, useState } from 'react';
import { getNodeFailureRank, getProbeErrors, getPseudoSuccess } from '@/services/performance/api';

const { RangePicker } = DatePicker;

const toNumber = (v: string | number | undefined | null) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const fmtPercent = (v: number) => `${Number(v ?? 0).toFixed(2)}%`;

const getNodeLabel = (row: { nodeName?: string | null; nodeIp?: string | null; nodeId?: number }) => {
  if (row.nodeName) return row.nodeName;
  if (row.nodeIp) return row.nodeIp;
  if (row.nodeId && row.nodeId > 0) return `#${row.nodeId}`;
  return 'external';
};

const normalizePagePayload = (res: any) => {
  const container = res?.data;
  if (!container) return { rows: [], total: 0 };
  const pageLike = Array.isArray(container?.data) ? container : container?.data ?? container;
  const rows = Array.isArray(pageLike?.data) ? pageLike.data : Array.isArray(pageLike) ? pageLike : [];
  const total = toNumber(pageLike?.total ?? rows.length);
  return { rows, total };
};

type NodeProbeAnalysisPageProps = {
  embedded?: boolean;
};

const NodeProbeAnalysisPage: React.FC<NodeProbeAnalysisPageProps> = ({ embedded }) => {
  const today = dayjs().format('YYYY-MM-DD');
  const [activeTab, setActiveTab] = useState<'rank' | 'pseudo' | 'errors'>('rank');

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    today,
  ]);
  const [clientCountry, setClientCountry] = useState<string | undefined>();
  const [platform, setPlatform] = useState<string | undefined>();
  const [appId, setAppId] = useState<string | undefined>();
  const [appVersion, setAppVersion] = useState<string | undefined>();
  const [includeExternal, setIncludeExternal] = useState<boolean>(false);

  const [probeStage, setProbeStage] = useState<'node_connect' | 'post_connect_probe' | 'tunnel_establish'>('node_connect');
  const [minTotal, setMinTotal] = useState<number>(20);
  const [minConnected, setMinConnected] = useState<number>(20);

  const [errorNodeId, setErrorNodeId] = useState<number | undefined>();
  const [errorStatus, setErrorStatus] = useState<API.ProbeStatus | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState<API.ProbeErrorsGroupBy>('stage_error');

  const rankActionRef = useRef<ActionType | null>(null);
  const pseudoActionRef = useRef<ActionType | null>(null);
  const errorActionRef = useRef<ActionType | null>(null);

  const commonParams = useMemo(
    () => ({
      dateFrom: dateRange[0],
      dateTo: dateRange[1],
      clientCountry,
      platform,
      appId,
      appVersion,
      includeExternal,
    }),
    [dateRange, clientCountry, platform, appId, appVersion, includeExternal],
  );

  const rankColumns: ProColumns<API.NodeFailureRankItem>[] = [
    {
      title: '节点',
      key: 'node',
      width: 240,
      render: (_, record) => (
        <Space>
          <Typography.Text>{getNodeLabel(record)}</Typography.Text>
          {record.nodeId === 0 ? <Tag color="warning">external</Tag> : null}
        </Space>
      ),
    },
    { title: '节点ID', dataIndex: 'nodeId', width: 90 },
    { title: '成功数', dataIndex: 'successCount', width: 110 },
    { title: '失败数', dataIndex: 'failedCount', width: 110 },
    { title: '总样本', dataIndex: 'totalCount', width: 110 },
    {
      title: '失败率',
      dataIndex: 'failureRate',
      width: 110,
      render: (_, record) => {
        const rate = toNumber(record.failureRate as any);
        return <Tag color={rate >= 30 ? 'error' : rate >= 15 ? 'warning' : 'default'}>{fmtPercent(rate)}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'op',
      width: 130,
      render: (_, record) => (
        <a
          onClick={() => {
            setErrorNodeId(record.nodeId > 0 ? record.nodeId : undefined);
            setGroupBy('stage_error');
            setActiveTab('errors');
            setTimeout(() => errorActionRef.current?.reload(), 0);
          }}
        >
          查看错误分布
        </a>
      ),
    },
  ];

  const pseudoColumns: ProColumns<API.PseudoSuccessItem>[] = [
    {
      title: '节点',
      key: 'node',
      width: 240,
      render: (_, record) => (
        <Space>
          <Typography.Text>{getNodeLabel(record)}</Typography.Text>
          {record.nodeId === 0 ? <Tag color="warning">external</Tag> : null}
        </Space>
      ),
    },
    { title: '节点ID', dataIndex: 'nodeId', width: 90 },
    { title: '连接成功样本', dataIndex: 'nodeConnectSuccessCount', width: 140 },
    { title: '后探测失败样本', dataIndex: 'postConnectFailedCount', width: 150 },
    {
      title: '伪成功率',
      dataIndex: 'pseudoSuccessRate',
      width: 120,
      render: (_, record) => {
        const rate = toNumber(record.pseudoSuccessRate as any);
        return <Tag color={rate >= 20 ? 'error' : rate >= 10 ? 'warning' : 'default'}>{fmtPercent(rate)}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'op',
      width: 130,
      render: (_, record) => (
        <a
          onClick={() => {
            setErrorNodeId(record.nodeId > 0 ? record.nodeId : undefined);
            setGroupBy('stage_error');
            setActiveTab('errors');
            setTimeout(() => errorActionRef.current?.reload(), 0);
          }}
        >
          查看错误分布
        </a>
      ),
    },
  ];

  const errorColumns: ProColumns<API.ProbeErrorsItem>[] = [
    {
      title: '节点',
      key: 'node',
      width: 220,
      render: (_, record) => (
        <Space>
          <Typography.Text>{getNodeLabel(record)}</Typography.Text>
          {record.nodeId === 0 ? <Tag color="warning">external</Tag> : null}
        </Space>
      ),
    },
    { title: '节点ID', dataIndex: 'nodeId', width: 90 },
    { title: '阶段', dataIndex: 'probeStage', width: 160 },
    { title: '状态', dataIndex: 'status', width: 110 },
    { title: '错误码', dataIndex: 'errorCode', width: 220 },
    { title: '数量', dataIndex: 'totalCount', width: 110 },
  ];

  const content = (
    <>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Space wrap>
          <RangePicker
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            presets={[
              { label: '今天', value: [dayjs(), dayjs()] },
              { label: '最近3天', value: [dayjs().subtract(2, 'day'), dayjs()] },
              { label: '最近一周', value: [dayjs().subtract(6, 'day'), dayjs()] },
            ]}
            onChange={(dates) => {
              const [start, end] = dates ?? [];
              if (!start || !end) return;
              setDateRange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
            }}
          />
          <Input placeholder="客户端国家(2位)" style={{ width: 140 }} value={clientCountry} onChange={(e) => setClientCountry(e.target.value || undefined)} />
          <Input placeholder="平台" style={{ width: 140 }} value={platform} onChange={(e) => setPlatform(e.target.value || undefined)} />
          <Input placeholder="应用ID" style={{ width: 180 }} value={appId} onChange={(e) => setAppId(e.target.value || undefined)} />
          <Input placeholder="应用版本" style={{ width: 140 }} value={appVersion} onChange={(e) => setAppVersion(e.target.value || undefined)} />
          <Space>
            <Typography.Text type="secondary">包含外部节点</Typography.Text>
            <Switch checked={includeExternal} onChange={setIncludeExternal} />
          </Space>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'rank' | 'pseudo' | 'errors')}
          items={[
            {
              key: 'rank',
              label: '节点失败率排行',
              children: (
                <ProTable<API.NodeFailureRankItem>
                  actionRef={rankActionRef}
                  rowKey={(r) => `${r.nodeId}_${r.nodeIp || ''}`}
                  search={false}
                  toolBarRender={false}
                  columns={rankColumns}
                  params={{ ...commonParams, probeStage, minTotal }}
                  request={async (params) => {
                    const res = await getNodeFailureRank({
                      ...commonParams,
                      probeStage,
                      minTotal,
                      pageSize: params.pageSize,
                    });
                    if (res.code !== 0) {
                      message.error(res.msg || '获取失败率排行失败');
                      return { data: [], total: 0, success: false };
                    }
                    const payload = normalizePagePayload(res);
                    const rows = payload.rows.map((item: API.NodeFailureRankItem) => ({
                      ...item,
                      successCount: toNumber(item.successCount as any),
                      failedCount: toNumber(item.failedCount as any),
                      totalCount: toNumber(item.totalCount as any),
                      failureRate: toNumber(item.failureRate as any),
                    }));
                    return { data: rows, total: payload.total, success: true };
                  }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <Select
                          value={probeStage}
                          style={{ width: 170 }}
                          onChange={setProbeStage}
                          options={[
                            { label: 'node_connect', value: 'node_connect' },
                            { label: 'post_connect_probe', value: 'post_connect_probe' },
                            { label: 'tunnel_establish', value: 'tunnel_establish' },
                          ]}
                        />
                        <Space.Compact>
                          <Button disabled>最小样本</Button>
                          <InputNumber min={1} value={minTotal} onChange={(v) => setMinTotal(v ?? 20)} />
                        </Space.Compact>
                      </Space>
                    ),
                  }}
                  pagination={{ defaultPageSize: 50, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'pseudo',
              label: '伪成功识别',
              children: (
                <ProTable<API.PseudoSuccessItem>
                  actionRef={pseudoActionRef}
                  rowKey={(r) => `${r.nodeId}_${r.nodeIp || ''}`}
                  search={false}
                  toolBarRender={false}
                  columns={pseudoColumns}
                  params={{ ...commonParams, minConnected }}
                  request={async (params) => {
                    const res = await getPseudoSuccess({
                      ...commonParams,
                      minConnected,
                      pageSize: params.pageSize,
                    });
                    if (res.code !== 0) {
                      message.error(res.msg || '获取伪成功报表失败');
                      return { data: [], total: 0, success: false };
                    }
                    const payload = normalizePagePayload(res);
                    const rows = payload.rows.map((item: API.PseudoSuccessItem) => ({
                      ...item,
                      nodeConnectSuccessCount: toNumber(item.nodeConnectSuccessCount as any),
                      postConnectFailedCount: toNumber(item.postConnectFailedCount as any),
                      pseudoSuccessRate: toNumber(item.pseudoSuccessRate as any),
                    }));
                    return { data: rows, total: payload.total, success: true };
                  }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <Space.Compact>
                          <Button disabled>最小连接样本</Button>
                          <InputNumber min={1} value={minConnected} onChange={(v) => setMinConnected(v ?? 20)} />
                        </Space.Compact>
                      </Space>
                    ),
                  }}
                  pagination={{ defaultPageSize: 50, showSizeChanger: true }}
                />
              ),
            },
            {
              key: 'errors',
              label: '探测错误分布',
              children: (
                <ProTable<API.ProbeErrorsItem>
                  actionRef={errorActionRef}
                  rowKey={(r) => `${r.nodeId || 0}_${r.probeStage || ''}_${r.errorCode || ''}_${r.status || ''}`}
                  search={false}
                  toolBarRender={false}
                  columns={errorColumns}
                  params={{ ...commonParams, errorNodeId, groupBy, probeStage, errorStatus, errorCode }}
                  request={async (params) => {
                    const res = await getProbeErrors({
                      ...commonParams,
                      nodeId: errorNodeId,
                      groupBy,
                      probeStage,
                      status: errorStatus,
                      errorCode,
                      pageSize: params.pageSize,
                    });
                    if (res.code !== 0) {
                      message.error(res.msg || '获取错误分布失败');
                      return { data: [], total: 0, success: false };
                    }
                    const payload = normalizePagePayload(res);
                    const rows = payload.rows.map((item: API.ProbeErrorsItem) => ({
                      ...item,
                      totalCount: toNumber(item.totalCount as any),
                    }));
                    return { data: rows, total: payload.total, success: true };
                  }}
                  toolbar={{
                    filter: (
                      <Space wrap>
                        <InputNumber
                          min={1}
                          value={errorNodeId}
                          onChange={(v) => setErrorNodeId(v ?? undefined)}
                          placeholder="节点ID"
                        />
                        <Select
                          value={groupBy}
                          style={{ width: 150 }}
                          onChange={(v) => setGroupBy(v)}
                          options={[
                            { label: 'stage_error', value: 'stage_error' },
                            { label: 'node', value: 'node' },
                            { label: 'error_code', value: 'error_code' },
                            { label: 'stage', value: 'stage' },
                            { label: 'status', value: 'status' },
                          ]}
                        />
                        <Select
                          value={probeStage}
                          style={{ width: 170 }}
                          onChange={setProbeStage}
                          options={[
                            { label: 'node_connect', value: 'node_connect' },
                            { label: 'post_connect_probe', value: 'post_connect_probe' },
                            { label: 'tunnel_establish', value: 'tunnel_establish' },
                          ]}
                        />
                        <Select
                          value={errorStatus}
                          style={{ width: 130 }}
                          allowClear
                          placeholder="状态"
                          onChange={(v) => setErrorStatus(v)}
                          options={[
                            { label: 'success', value: 'success' },
                            { label: 'failed', value: 'failed' },
                            { label: 'timeout', value: 'timeout' },
                            { label: 'cancelled', value: 'cancelled' },
                          ]}
                        />
                        <Input
                          placeholder="错误码"
                          value={errorCode}
                          onChange={(e) => setErrorCode(e.target.value || undefined)}
                          style={{ width: 180 }}
                        />
                      </Space>
                    ),
                  }}
                  pagination={{ defaultPageSize: 50, showSizeChanger: true }}
                />
              ),
            },
          ]}
        />
      </Space>
    </>
  );

  if (embedded) {
    return content;
  }

  return <PageContainer title="节点状态排查">{content}</PageContainer>;
};

export default NodeProbeAnalysisPage;
