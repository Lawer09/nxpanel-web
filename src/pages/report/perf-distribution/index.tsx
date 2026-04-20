import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  Card,
  Col,
  DatePicker,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  getVersionDistribution,
  getPlatformDistribution,
  getCountryDistribution,
} from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

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

const DistributionPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [appId, setAppId] = useState<string | undefined>();
  const [nodeId, setNodeId] = useState<number | undefined>();

  const filterParams: API.DistributionParams = {
    date_from: dateRange?.[0],
    date_to: dateRange?.[1],
    app_id: appId,
    node_id: nodeId,
  };

  const { data: versionRes, loading: versionLoading } = useRequest(
    () => getVersionDistribution(filterParams),
    { refreshDeps: [dateRange, appId, nodeId] },
  );

  const { data: platformRes, loading: platformLoading } = useRequest(
    () => getPlatformDistribution(filterParams),
    { refreshDeps: [dateRange, appId, nodeId] },
  );

  const { data: countryRes, loading: countryLoading } = useRequest(
    () => getCountryDistribution(filterParams),
    { refreshDeps: [dateRange, appId, nodeId] },
  );

  const versionList: API.VersionDistributionItem[] =
    ((versionRes as any)?.data ?? versionRes) || [];
  const platformList: API.PlatformDistributionItem[] =
    ((platformRes as any)?.data ?? platformRes) || [];
  const countryList: API.CountryDistributionItem[] =
    ((countryRes as any)?.data ?? countryRes) || [];

  // ── 版本分布表格 ──────────────────────────────────────────────────────────

  const versionColumns = [
    { title: 'App 包名', dataIndex: 'app_id', key: 'app_id', render: (v: string) => v || '-' },
    { title: '版本', dataIndex: 'app_version', key: 'app_version', render: (v: string) => v || '-' },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: API.VersionDistributionItem, b: API.VersionDistributionItem) =>
        a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: API.VersionDistributionItem) => successRateTag(r.avg_success_rate),
      sorter: (a: API.VersionDistributionItem, b: API.VersionDistributionItem) =>
        a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: API.VersionDistributionItem) => delayTag(r.avg_delay),
      sorter: (a: API.VersionDistributionItem, b: API.VersionDistributionItem) =>
        a.avg_delay - b.avg_delay,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (v: number) => <Text>{v.toFixed(2)}%</Text>,
      sorter: (a: API.VersionDistributionItem, b: API.VersionDistributionItem) =>
        a.percentage - b.percentage,
    },
  ];

  // ── 平台分布表格 ──────────────────────────────────────────────────────────

  const platformColumns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: API.PlatformDistributionItem, b: API.PlatformDistributionItem) =>
        a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: API.PlatformDistributionItem) => successRateTag(r.avg_success_rate),
      sorter: (a: API.PlatformDistributionItem, b: API.PlatformDistributionItem) =>
        a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: API.PlatformDistributionItem) => delayTag(r.avg_delay),
      sorter: (a: API.PlatformDistributionItem, b: API.PlatformDistributionItem) =>
        a.avg_delay - b.avg_delay,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (v: number) => <Text>{v.toFixed(2)}%</Text>,
      sorter: (a: API.PlatformDistributionItem, b: API.PlatformDistributionItem) =>
        a.percentage - b.percentage,
    },
  ];

  // ── 国家/ISP 分布表格 ─────────────────────────────────────────────────────

  const countryColumns = [
    { title: '国家', dataIndex: 'client_country', key: 'client_country', render: (v: string) => v || '-' },
    { title: 'ISP', dataIndex: 'client_isp', key: 'client_isp', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '上报量',
      dataIndex: 'total_reports',
      key: 'total_reports',
      sorter: (a: API.CountryDistributionItem, b: API.CountryDistributionItem) =>
        a.total_reports - b.total_reports,
    },
    { title: '节点数', dataIndex: 'node_count', key: 'node_count' },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      key: 'avg_success_rate',
      render: (_: any, r: API.CountryDistributionItem) => successRateTag(r.avg_success_rate),
      sorter: (a: API.CountryDistributionItem, b: API.CountryDistributionItem) =>
        a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      key: 'avg_delay',
      render: (_: any, r: API.CountryDistributionItem) => delayTag(r.avg_delay),
      sorter: (a: API.CountryDistributionItem, b: API.CountryDistributionItem) =>
        a.avg_delay - b.avg_delay,
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (v: number) => <Text>{v.toFixed(2)}%</Text>,
      sorter: (a: API.CountryDistributionItem, b: API.CountryDistributionItem) =>
        a.percentage - b.percentage,
    },
  ];

  return (
    <PageContainer>
      {/* 公共筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
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
          <Input
            placeholder="App 包名"
            value={appId}
            onChange={(e) => setAppId(e.target.value || undefined)}
            allowClear
            style={{ width: 200 }}
          />
          <InputNumber
            placeholder="节点ID"
            value={nodeId}
            onChange={(v) => setNodeId(v ?? undefined)}
            style={{ width: 120 }}
            min={1}
          />
        </Space>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="version"
          items={[
            {
              key: 'version',
              label: '版本分布',
              children: (
                <Table
                  rowKey={(r) => `${r.app_id}_${r.app_version}`}
                  columns={versionColumns}
                  dataSource={versionList}
                  loading={versionLoading}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                  size="middle"
                />
              ),
            },
            {
              key: 'platform',
              label: '平台分布',
              children: (
                <Table
                  rowKey={(r) => r.platform || '-'}
                  columns={platformColumns}
                  dataSource={platformList}
                  loading={platformLoading}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                  size="middle"
                />
              ),
            },
            {
              key: 'country',
              label: '国家 / ISP 分布',
              children: (
                <Table
                  rowKey={(r) => `${r.client_country}_${r.client_isp}`}
                  columns={countryColumns}
                  dataSource={countryList}
                  loading={countryLoading}
                  pagination={{ defaultPageSize: 20, showSizeChanger: true }}
                  size="middle"
                />
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default DistributionPage;
