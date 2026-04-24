import { Line } from '@ant-design/charts';
import { Card, Col, DatePicker, Row, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { getAdRevenueTrend } from '@/services/ad/api';

const { RangePicker } = DatePicker;

function fmtMoney(v: any) {
  return `$${Number(v ?? 0).toFixed(2)}`;
}

interface TrendChartProps {
  filters: API.AdRevenueQuery;
}

const TrendChart: React.FC<TrendChartProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<API.AdRevenueTrendResponse>({ current: [] });
  const [compareRange, setCompareRange] = useState<[string, string] | null>(null);

  const fetchTrend = async () => {
    setLoading(true);
    try {
      const params: API.AdRevenueTrendQuery = {
        ...filters,
      };
      if (compareRange) {
        params.compareDateFrom = compareRange[0];
        params.compareDateTo = compareRange[1];
      }
      const res = await getAdRevenueTrend(params);
      if (res.code === 0 && res.data) {
        setTrendData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      fetchTrend();
    }
  }, [filters, compareRange]);

  const chartData = useMemo(() => {
    const result: { date: string; value: number; series: string }[] = [];
    (trendData.current || []).forEach((item) => {
      result.push({ date: item.reportDate, value: Number(item.estimatedEarnings), series: '当前周期' });
    });
    (trendData.compare || []).forEach((item) => {
      result.push({ date: item.reportDate, value: Number(item.estimatedEarnings), series: '对比周期' });
    });
    return result;
  }, [trendData]);

  const impressionData = useMemo(() => {
    const result: { date: string; value: number; series: string }[] = [];
    (trendData.current || []).forEach((item) => {
      result.push({ date: item.reportDate, value: Number(item.impressions), series: '当前周期' });
    });
    (trendData.compare || []).forEach((item) => {
      result.push({ date: item.reportDate, value: Number(item.impressions), series: '对比周期' });
    });
    return result;
  }, [trendData]);

  const earningsConfig = {
    data: chartData,
    xField: 'date',
    yField: 'value',
    colorField: 'series',
    smooth: true,
    height: 260,
    axis: {
      y: { labelFormatter: (v: number) => fmtMoney(v) },
    },
    tooltip: {
      items: [{ field: 'value', valueFormatter: (v: number) => fmtMoney(v) }],
    },
    legend: { position: 'top-right' as const },
  };

  const impressionConfig = {
    data: impressionData,
    xField: 'date',
    yField: 'value',
    colorField: 'series',
    smooth: true,
    height: 260,
    axis: {
      y: { labelFormatter: (v: number) => v.toLocaleString() },
    },
    tooltip: {
      items: [{ field: 'value', valueFormatter: (v: number) => v.toLocaleString() }],
    },
    legend: { position: 'top-right' as const },
  };

  return (
    <Spin spinning={loading}>
      <Card
        title="收益趋势"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <span style={{ fontSize: 12, color: '#999' }}>对比周期：</span>
            <RangePicker
              size="small"
              allowClear
              value={
                compareRange
                  ? [dayjs(compareRange[0]), dayjs(compareRange[1])]
                  : null
              }
              onChange={(dates) => {
                if (dates?.[0] && dates?.[1]) {
                  setCompareRange([
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD'),
                  ]);
                } else {
                  setCompareRange(null);
                }
              }}
            />
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>预估收益 ($)</div>
            <Line {...earningsConfig} />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>展示量</div>
            <Line {...impressionConfig} />
          </Col>
        </Row>
      </Card>
    </Spin>
  );
};

export default TrendChart;
