import { Card, Select, Space, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { postAdRevenueTopRank } from '@/services/ad/api';

const RANK_OPTIONS: { label: string; value: string }[] = [
  { label: '应用', value: 'app' },
  { label: '广告单元', value: 'adUnit' },
  { label: '国家', value: 'country' },
  { label: '账号', value: 'account' },
  { label: '平台', value: 'platform' },
];

const METRIC_OPTIONS: { label: string; value: string }[] = [
  { label: '预估收益', value: 'estimatedEarnings' },
  { label: '展示量', value: 'impressions' },
  { label: '点击量', value: 'clicks' },
  { label: 'eCPM', value: 'ecpm' },
  { label: 'CTR', value: 'ctr' },
];

function fmtMoney(v: any) {
  return `$${Number(v ?? 0).toFixed(2)}`;
}

interface TopRankTableProps {
  filters: API.AdRevenueQuery;
}

const TopRankTable: React.FC<TopRankTableProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.AdRevenueItem[]>([]);
  const [rankBy, setRankBy] = useState<'app' | 'adUnit' | 'country' | 'account' | 'platform'>('app');
  const [metric, setMetric] = useState('estimatedEarnings');
  const [limit, setLimit] = useState(20);

  const fetchData = async () => {
    if (!filters.dateFrom || !filters.dateTo) return;
    setLoading(true);
    try {
      const res = await postAdRevenueTopRank({
        ...filters,
        rankBy,
        metric,
        limit,
      });
      if (res.code === 0 && res.data) {
        setData(res.data.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, rankBy, metric, limit]);

  // 根据 rankBy 决定名称列
  const nameField: Record<string, { title: string; dataIndex: string }> = {
    app: { title: '应用 ID', dataIndex: 'providerAppId' },
    adUnit: { title: '广告单元', dataIndex: 'providerAdUnitId' },
    country: { title: '国家', dataIndex: 'countryCode' },
    account: { title: '账号 ID', dataIndex: 'accountId' },
    platform: { title: '平台', dataIndex: 'sourcePlatform' },
  };

  const nf = nameField[rankBy] || nameField.app;

  const columns: ColumnsType<API.AdRevenueItem> = [
    { title: '排名', key: 'rank', width: 60, render: (_, __, idx) => idx + 1 },
    { title: nf.title, dataIndex: nf.dataIndex, key: 'name', width: 180, ellipsis: true },
    { title: '请求数', dataIndex: 'adRequests', key: 'adRequests', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '展示量', dataIndex: 'impressions', key: 'impressions', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 90, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '预估收益', dataIndex: 'estimatedEarnings', key: 'estimatedEarnings', width: 110, render: (v) => fmtMoney(v) },
    { title: 'eCPM', dataIndex: 'ecpm', key: 'ecpm', width: 90, render: (v) => fmtMoney(v) },
  ];

  return (
    <Card
      title="Top 排行"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#999' }}>排行维度：</span>
          <Select
            size="small"
            style={{ width: 100 }}
            options={RANK_OPTIONS}
            value={rankBy}
            onChange={(v) => setRankBy(v as any)}
          />
          <span style={{ fontSize: 12, color: '#999' }}>指标：</span>
          <Select
            size="small"
            style={{ width: 120 }}
            options={METRIC_OPTIONS}
            value={metric}
            onChange={(v) => setMetric(v)}
          />
          <span style={{ fontSize: 12, color: '#999' }}>数量：</span>
          <Select
            size="small"
            style={{ width: 80 }}
            options={[
              { label: '10', value: 10 },
              { label: '20', value: 20 },
              { label: '50', value: 50 },
            ]}
            value={limit}
            onChange={(v) => setLimit(v)}
          />
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table<API.AdRevenueItem>
          rowKey={(record) => `${record[nameField[rankBy]?.dataIndex as keyof API.AdRevenueItem] ?? ''}-${record.estimatedEarnings}`}
          columns={columns}
          dataSource={data}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={false}
        />
      </Spin>
    </Card>
  );
};

export default TopRankTable;
