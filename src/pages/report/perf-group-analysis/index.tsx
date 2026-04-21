import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  Card,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { getAggregatedPerformance } from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type GroupBy = API.AggregatedGroupBy;

/* ── 通用渲染辅助 ──────────────────────────────────────────────────────── */

const delayTag = (delay: number) => {
  if (delay <= 100) return <Tag color="success">{delay.toFixed(1)} ms</Tag>;
  if (delay <= 300) return <Tag color="warning">{delay.toFixed(1)} ms</Tag>;
  return <Tag color="error">{delay.toFixed(1)} ms</Tag>;
};

const successRateTag = (rate: number) => {
  if (rate >= 95) return <Tag color="success">{rate.toFixed(1)}%</Tag>;
  if (rate >= 80) return <Tag color="warning">{rate.toFixed(1)}%</Tag>;
  return <Tag color="error">{rate.toFixed(1)}%</Tag>;
};

/* ── 公共列定义 ────────────────────────────────────────────────────────── */

const colAvgSuccessRate: ColumnsType<API.AggregatedPerformanceItem>[number] = {
  title: '平均成功率',
  dataIndex: 'avg_success_rate',
  key: 'avg_success_rate',
  width: 130,
  render: (_, r) => successRateTag(r.avg_success_rate),
  sorter: (a, b) => a.avg_success_rate - b.avg_success_rate,
};

const colAvgDelay: ColumnsType<API.AggregatedPerformanceItem>[number] = {
  title: '平均延迟',
  dataIndex: 'avg_delay',
  key: 'avg_delay',
  width: 130,
  render: (_, r) => delayTag(r.avg_delay),
  sorter: (a, b) => a.avg_delay - b.avg_delay,
};

const colTotalCount: ColumnsType<API.AggregatedPerformanceItem>[number] = {
  title: '上报总数',
  dataIndex: 'total_count',
  key: 'total_count',
  width: 110,
  sorter: (a, b) => a.total_count - b.total_count,
};

const colNodeCount: ColumnsType<API.AggregatedPerformanceItem>[number] = {
  title: '节点数',
  dataIndex: 'node_count',
  key: 'node_count',
  width: 90,
};

const colRecordCount: ColumnsType<API.AggregatedPerformanceItem>[number] = {
  title: '记录数',
  dataIndex: 'record_count',
  key: 'record_count',
  width: 90,
};

/* ── 各维度列定义 ──────────────────────────────────────────────────────── */

const nodeColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  { title: '节点 ID', dataIndex: 'node_id', key: 'node_id', width: 100 },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colRecordCount,
];

const countryColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  { title: '国家', dataIndex: 'client_country', key: 'client_country', width: 100 },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

const ispColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  { title: '国家', dataIndex: 'client_country', key: 'client_country', width: 100 },
  { title: 'ISP', dataIndex: 'client_isp', key: 'client_isp', width: 180, ellipsis: true },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

const platformColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  {
    title: '平台',
    dataIndex: 'platform',
    key: 'platform',
    width: 140,
    render: (_, r) => (r.platform ? <Tag>{r.platform}</Tag> : '-'),
  },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

const appVersionColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  { title: 'App ID', dataIndex: 'app_id', key: 'app_id', width: 180, ellipsis: true },
  { title: '版本', dataIndex: 'app_version', key: 'app_version', width: 120 },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

const dateColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

const hourColumns: ColumnsType<API.AggregatedPerformanceItem> = [
  {
    title: '时间',
    key: 'time',
    width: 160,
    render: (_, r) => (
      <Text>{`${r.date} ${String(r.hour ?? 0).padStart(2, '0')}:00`}</Text>
    ),
  },
  colAvgSuccessRate,
  colAvgDelay,
  colTotalCount,
  colNodeCount,
  colRecordCount,
];

/* ── 映射表 ────────────────────────────────────────────────────────────── */

const columnsMap: Record<GroupBy, ColumnsType<API.AggregatedPerformanceItem>> = {
  node: nodeColumns,
  country: countryColumns,
  isp: ispColumns,
  platform: platformColumns,
  app_version: appVersionColumns,
  date: dateColumns,
  hour: hourColumns,
};

const rowKeyMap: Record<GroupBy, (r: API.AggregatedPerformanceItem, idx?: number) => string> = {
  node: (r, i) => `${r.node_id ?? i}`,
  country: (r, i) => `${r.client_country ?? i}`,
  isp: (r, i) => `${r.client_country ?? ''}_${r.client_isp ?? ''}_${i}`,
  platform: (r, i) => `${r.platform ?? i}`,
  app_version: (r, i) => `${r.app_id ?? ''}_${r.app_version ?? ''}_${i}`,
  date: (r, i) => `${r.date ?? i}`,
  hour: (r, i) => `${r.date ?? ''}_${r.hour ?? ''}_${i}`,
};

const groupByOptions: { label: string; value: GroupBy }[] = [
  { label: '按节点聚合', value: 'node' },
  { label: '按国家聚合', value: 'country' },
  { label: '按 ISP 聚合', value: 'isp' },
  { label: '按平台聚合', value: 'platform' },
  { label: '按应用版本聚合', value: 'app_version' },
  { label: '按日期聚合', value: 'date' },
  { label: '按小时聚合', value: 'hour' },
];

/* ── 页面组件 ──────────────────────────────────────────────────────────── */

const PerfGroupAnalysisPage: React.FC = () => {
  const [groupBy, setGroupBy] = useState<GroupBy>('node');
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [nodeId, setNodeId] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [isp, setIsp] = useState<string | undefined>();
  const [platform, setPlatform] = useState<string | undefined>();
  const [appId, setAppId] = useState<string | undefined>();
  const [appVersion, setAppVersion] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: res, loading } = useRequest(
    () =>
      getAggregatedPerformance({
        group_by: groupBy,
        node_id: nodeId,
        client_country: country,
        client_isp: isp,
        platform,
        app_id: appId,
        app_version: appVersion,
        date_from: dateRange?.[0],
        date_to: dateRange?.[1],
        page,
        page_size: pageSize,
      }),
    {
      refreshDeps: [groupBy, dateRange, nodeId, country, isp, platform, appId, appVersion, page, pageSize],
    },
  );

  // 响应: { code, msg, data: { data: [...], total, page, pageSize, group_by } }
  // useRequest 可能自动剥离外层 {code,msg,data}，兼容两种情况
  const raw = (res as any) || {};
  const payload = Array.isArray(raw?.data) ? raw : (raw?.data || raw);
  const dataList: API.AggregatedPerformanceItem[] = Array.isArray(payload?.data) ? payload.data : [];
  const total: number = payload?.total || 0;

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={groupBy}
            onChange={(v) => {
              setGroupBy(v);
              setPage(1);
            }}
            style={{ width: 180 }}
            options={groupByOptions}
          />
          <RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : undefined}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              } else {
                setDateRange(undefined);
              }
              setPage(1);
            }}
          />
          <InputNumber
            placeholder="节点ID"
            value={nodeId}
            onChange={(v) => {
              setNodeId(v ?? undefined);
              setPage(1);
            }}
            style={{ width: 120 }}
            min={1}
          />
          <Input
            placeholder="国家代码 (如 CN)"
            value={country}
            onChange={(e) => setCountry(e.target.value || undefined)}
            onPressEnter={() => setPage(1)}
            style={{ width: 150 }}
            maxLength={2}
          />
          <Input
            placeholder="ISP"
            value={isp}
            onChange={(e) => setIsp(e.target.value || undefined)}
            onPressEnter={() => setPage(1)}
            style={{ width: 160 }}
          />
          <Input
            placeholder="平台"
            value={platform}
            onChange={(e) => setPlatform(e.target.value || undefined)}
            onPressEnter={() => setPage(1)}
            style={{ width: 150 }}
          />
          <Input
            placeholder="App 包名"
            value={appId}
            onChange={(e) => setAppId(e.target.value || undefined)}
            onPressEnter={() => setPage(1)}
            style={{ width: 180 }}
          />
          <Input
            placeholder="App 版本"
            value={appVersion}
            onChange={(e) => setAppVersion(e.target.value || undefined)}
            onPressEnter={() => setPage(1)}
            style={{ width: 140 }}
          />
        </Space>
      </Card>

      <Card>
        <Table<API.AggregatedPerformanceItem>
          rowKey={rowKeyMap[groupBy]}
          columns={columnsMap[groupBy]}
          dataSource={dataList}
          loading={loading}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default PerfGroupAnalysisPage;
