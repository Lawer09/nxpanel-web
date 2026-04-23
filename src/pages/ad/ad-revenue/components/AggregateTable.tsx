import { Card, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { postAdRevenueAggregate } from '@/services/ad/api';

const GROUP_BY_OPTIONS: { label: string; value: API.AdRevenueGroupBy }[] = [
  { label: '日期', value: 'report_date' },
  { label: '平台', value: 'source_platform' },
  { label: '账号', value: 'account_id' },
  { label: '应用', value: 'provider_app_id' },
  { label: '广告单元', value: 'provider_ad_unit_id' },
  { label: '国家', value: 'country_code' },
  { label: '设备', value: 'device_platform' },
  { label: '广告格式', value: 'ad_format' },
  { label: '报表类型', value: 'report_type' },
  { label: '广告源', value: 'ad_source_code' },
];

function fmtMoney(v: any) {
  return `$${Number(v ?? 0).toFixed(2)}`;
}

function fmtRate(v: any) {
  return `${(Number(v ?? 0) * 100).toFixed(2)}%`;
}

interface AggregateTableProps {
  filters: API.AdRevenueQuery;
}

const AggregateTable: React.FC<AggregateTableProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.AdRevenueItem[]>([]);
  const [groupBy, setGroupBy] = useState<API.AdRevenueGroupBy[]>(['report_date']);

  const fetchData = async () => {
    if (!filters.date_from || !filters.date_to) return;
    setLoading(true);
    try {
      const res = await postAdRevenueAggregate({
        ...filters,
        group_by: groupBy,
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
  }, [filters, groupBy]);

  // 动态列：根据 groupBy 生成维度列
  const dimColumns: ColumnsType<API.AdRevenueItem> = groupBy.map((g) => {
    const opt = GROUP_BY_OPTIONS.find((o) => o.value === g);
    return {
      title: opt?.label ?? g,
      dataIndex: g,
      key: g,
      width: 120,
      ellipsis: true,
    };
  });

  const metricColumns: ColumnsType<API.AdRevenueItem> = [
    { title: '请求数', dataIndex: 'ad_requests', key: 'ad_requests', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '匹配数', dataIndex: 'matched_requests', key: 'matched_requests', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '展示量', dataIndex: 'impressions', key: 'impressions', width: 100, render: (v: any) => Number(v ?? 0).toLocaleString() },
    { title: '点击量', dataIndex: 'clicks', key: 'clicks', width: 90, render: (v) => (v ?? 0).toLocaleString() },
    { title: '预估收益', dataIndex: 'estimated_earnings', key: 'estimated_earnings', width: 110, render: (v) => fmtMoney(v) },
    { title: 'eCPM', dataIndex: 'ecpm', key: 'ecpm', width: 90, render: (v) => fmtMoney(v) },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', width: 80, render: (v) => fmtRate(v) },
    { title: '匹配率', dataIndex: 'match_rate', key: 'match_rate', width: 80, render: (v) => fmtRate(v) },
    { title: '展示率', dataIndex: 'show_rate', key: 'show_rate', width: 80, render: (v) => fmtRate(v) },
  ];

  return (
    <Card
      title="聚合分析"
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
          rowKey={(record, idx) => groupBy.map((g) => record[g]).join('-') || String(idx)}
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
