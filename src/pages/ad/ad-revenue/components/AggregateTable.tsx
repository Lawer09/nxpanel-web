import { Card, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { postAdRevenueAggregate } from '@/services/ad/api';
import { formatUtc8 } from '../../utils/time';

const GROUP_BY_OPTIONS: { label: string; value: API.AdRevenueGroupBy }[] = [
  { label: '日期', value: 'reportDate' },
  { label: '平台', value: 'sourcePlatform' },
  { label: '账号', value: 'accountId' },
  { label: '应用', value: 'providerAppId' },
  { label: '广告单元', value: 'providerAdUnitId' },
  { label: '国家', value: 'countryCode' },
  { label: '设备', value: 'devicePlatform' },
  { label: '广告格式', value: 'adFormat' },
  { label: '报表类型', value: 'reportType' },
  { label: '广告源', value: 'adSourceCode' },
];

function fmtMoney(v: any) {
  return `$${Number(v ?? 0).toFixed(2)}`;
}

function fmtRate(v: any) {
  return `${(Number(v ?? 0) * 100).toFixed(2)}%`;
}

function fmtUtc8Date(v?: string | null) {
  if (!v) return '-';
  const value = v.includes('T') ? v : `${v}T00:00:00Z`;
  return formatUtc8(value).slice(0, 10);
}

interface AggregateTableProps {
  filters: API.AdRevenueQuery;
}

const AggregateTable: React.FC<AggregateTableProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.AdRevenueItem[]>([]);
  const [groupBy, setGroupBy] = useState<API.AdRevenueGroupBy[]>(['reportDate']);

  const fetchData = async () => {
    if (!filters.dateFrom || !filters.dateTo) return;
    setLoading(true);
    try {
      const res = await postAdRevenueAggregate({
        ...filters,
        groupBy,
      });
      if (res.code === 0 && res.data) {
        setData(res.data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, groupBy]);

  // 动态列：根据 groupBy 生成维度列
  const dimColumns: ColumnsType<API.AdRevenueItem> = groupBy.map((g) => {
    const opt = GROUP_BY_OPTIONS.find((o) => o.value === g);
    if (g === 'reportDate') {
      return {
        title: opt?.label ?? g,
        dataIndex: g,
        key: g,
        width: 120,
        ellipsis: true,
        render: (v) => fmtUtc8Date(v),
      };
    }
    return {
      title: opt?.label ?? g,
      dataIndex: g,
      key: g,
      width: 120,
      ellipsis: true,
    };
  });

  const metricColumns: ColumnsType<API.AdRevenueItem> = [
    { title: '预估收益', dataIndex: 'estimatedEarnings', key: 'estimatedEarnings', width: 110, render: (v) => fmtMoney(v) },
    { title: '请求数', dataIndex: 'adRequests', key: 'adRequests', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '匹配数', dataIndex: 'matchedRequests', key: 'matchedRequests', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '展示量', dataIndex: 'impressions', key: 'impressions', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 90, render: (v) => (v ?? 0).toLocaleString() },
    { title: 'eCPM', dataIndex: 'ecpm', key: 'ecpm', width: 90, render: (v) => fmtMoney(v) },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', width: 80, render: (v) => fmtRate(v) },
    { title: '匹配率', dataIndex: 'matchRate', key: 'matchRate', width: 80, render: (v) => fmtRate(v) },
    { title: '展示率', dataIndex: 'showRate', key: 'showRate', width: 80, render: (v) => fmtRate(v) },
  ];

  return (
    <Card
      title="统计汇总"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#999' }}>分组维度：</span>
          <Select
            mode="multiple"
            size="small"
            style={{ minWidth: 260 }}
            placeholder="选择分组维度"
            options={GROUP_BY_OPTIONS}
            value={groupBy}
            onChange={(v) => setGroupBy(v)}
            maxTagCount={3}
          />
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Table<API.AdRevenueItem>
          rowKey={(record, idx) => `${groupBy.map((g) => record[g]).join('-')}-${idx}`}
          columns={[...dimColumns, ...metricColumns]}
          dataSource={data}
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Spin>
    </Card>
  );
};

export default AggregateTable;
