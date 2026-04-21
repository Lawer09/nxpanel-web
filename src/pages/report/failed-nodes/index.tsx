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
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { getFailedNodes } from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type GroupBy = 'country' | 'isp' | 'node' | 'time';

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

const FailedNodesPage: React.FC = () => {
  const [groupBy, setGroupBy] = useState<GroupBy>('country');
  const [maxSuccessRate, setMaxSuccessRate] = useState<number>(50);
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [nodeId, setNodeId] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [isp, setIsp] = useState<string | undefined>();
  const [appId, setAppId] = useState<string | undefined>();

  const { data: res, loading } = useRequest(
    () =>
      getFailedNodes({
        group_by: groupBy,
        max_success_rate: maxSuccessRate,
        date_from: dateRange?.[0],
        date_to: dateRange?.[1],
        node_id: nodeId,
        client_country: country,
        client_isp: isp,
        app_id: appId,
      }),
    { refreshDeps: [groupBy, maxSuccessRate, dateRange, nodeId, country, isp, appId] },
  );

  const dataList: any[] = ((res as any)?.data ?? res) || [];

  // ── 按国家聚合 ────────────────────────────────────────────────────────────
  const countryColumns = [
    { title: '国家', dataIndex: 'client_country', key: 'client_country' },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: any, b: any) => a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: any) => successRateTag(r.avg_success_rate),
      sorter: (a: any, b: any) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: any) => delayTag(r.avg_delay),
      sorter: (a: any, b: any) => a.avg_delay - b.avg_delay,
    },
  ];

  // ── 按 ISP 聚合 ───────────────────────────────────────────────────────────
  const ispColumns = [
    { title: '国家', dataIndex: 'client_country', key: 'client_country' },
    { title: 'ISP', dataIndex: 'client_isp', key: 'client_isp', ellipsis: true },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: any, b: any) => a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: any) => successRateTag(r.avg_success_rate),
      sorter: (a: any, b: any) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: any) => delayTag(r.avg_delay),
      sorter: (a: any, b: any) => a.avg_delay - b.avg_delay,
    },
  ];

  // ── 按节点聚合 ────────────────────────────────────────────────────────────
  const nodeColumns = [
    { title: '节点ID', dataIndex: 'node_id', key: 'node_id', width: 90 },
    { title: '国家', dataIndex: 'client_country', key: 'client_country' },
    { title: 'ISP', dataIndex: 'client_isp', key: 'client_isp', ellipsis: true },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: any, b: any) => a.total_reports - b.total_reports,
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: any) => successRateTag(r.avg_success_rate),
      sorter: (a: any, b: any) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: any) => delayTag(r.avg_delay),
      sorter: (a: any, b: any) => a.avg_delay - b.avg_delay,
    },
    { title: '首次出现', dataIndex: 'first_seen', key: 'first_seen', width: 170 },
    { title: '最后出现', dataIndex: 'last_seen', key: 'last_seen', width: 170 },
  ];

  // ── 按时间聚合 ────────────────────────────────────────────────────────────
  const timeColumns = [
    {
      title: '时间',
      key: 'time',
      width: 160,
      render: (_: any, r: any) =>
        `${r.date} ${String(r.hour).padStart(2, '0')}:00`,
    },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: any, b: any) => a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: any) => successRateTag(r.avg_success_rate),
      sorter: (a: any, b: any) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: any) => delayTag(r.avg_delay),
      sorter: (a: any, b: any) => a.avg_delay - b.avg_delay,
    },
  ];

  const columnsMap: Record<GroupBy, any[]> = {
    country: countryColumns,
    isp: ispColumns,
    node: nodeColumns,
    time: timeColumns,
  };

  const rowKeyMap: Record<GroupBy, (r: any, idx: number) => string> = {
    country: (r, i) => `${r.client_country ?? ''}_${i}`,
    isp: (r, i) => `${r.client_country ?? ''}_${r.client_isp ?? ''}_${i}`,
    node: (r, i) => `${r.node_id ?? ''}_${r.client_country ?? ''}_${r.client_isp ?? ''}_${i}`,
    time: (r, i) => `${r.date ?? ''}_${r.hour ?? ''}_${i}`,
  };

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: 160 }}
            options={[
              { label: '按国家聚合', value: 'country' },
              { label: '按 ISP 聚合', value: 'isp' },
              { label: '按节点聚合', value: 'node' },
              { label: '按时间聚合', value: 'time' },
            ]}
          />
          <InputNumber
            addonBefore="成功率 <"
            value={maxSuccessRate}
            onChange={(v) => setMaxSuccessRate(v ?? 50)}
            min={0}
            max={100}
            style={{ width: 180 }}
            suffix="%"
          />
          <RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : undefined}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              } else {
                setDateRange(undefined);
              }
            }}
          />
          <InputNumber
            placeholder="节点ID"
            value={nodeId}
            onChange={(v) => setNodeId(v ?? undefined)}
            style={{ width: 120 }}
            min={1}
          />
          <Input
            placeholder="国家代码"
            value={country}
            onChange={(e) => setCountry(e.target.value || undefined)}
            style={{ width: 120 }}
            maxLength={2}
          />
          <Input
            placeholder="ISP"
            value={isp}
            onChange={(e) => setIsp(e.target.value || undefined)}
            style={{ width: 160 }}
          />
          <Input
            placeholder="App 包名"
            value={appId}
            onChange={(e) => setAppId(e.target.value || undefined)}
            style={{ width: 200 }}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey={rowKeyMap[groupBy]}
          columns={columnsMap[groupBy]}
          dataSource={dataList}
          loading={loading}
          pagination={{ defaultPageSize: 50, showSizeChanger: true }}
          size="middle"
        />
      </Card>
    </PageContainer>
  );
};

export default FailedNodesPage;
