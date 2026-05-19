import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/charts';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Segmented, Tooltip } from 'antd';
import { useDashboard } from '../DashboardContext';
import { getTrafficTrend } from '@/services/traffic-platform/api';

const TrafficTrendChart: React.FC = () => {
  const { filters } = useDashboard();
  const [dimension, setDimension] = useState<'hour' | 'day' | 'month'>('day');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getTrafficTrend({
          platformCode: filters.platformCode,
          accountId: filters.accountId,
          startDate: filters.dateRange[0].format('YYYY-MM-DD'),
          endDate: filters.dateRange[1].format('YYYY-MM-DD'),
          dimension,
        });
        const payload = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
        setData(payload.map((item: any) => {
          const mb = Number(item.trafficMb);
          const gb = Number(item.trafficGb);
          const bytes = Number(item.trafficBytes);
          const value = Number.isFinite(mb)
            ? mb / 1024
            : Number.isFinite(gb)
              ? gb
              : Number.isFinite(bytes)
                ? bytes / 1024 / 1024 / 1024
                : 0;

          return {
            time: item.time,
            trafficGb: Number(value.toFixed(2)),
          };
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, dimension]);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      padding: '24px',
      height: '100%',
      minHeight: '360px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>流量趋势</span>
          <Tooltip title="基于所选时间范围内的流量趋势数据">
            <InfoCircleOutlined style={{ color: '#9CA3AF' }} />
          </Tooltip>
        </div>
        <Segmented
          options={[
            { label: '小时', value: 'hour' },
            { label: '日', value: 'day' },
            { label: '月', value: 'month' },
          ]}
          value={dimension}
          onChange={(v) => setDimension(v as any)}
        />
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '12px', color: '#6B7280', zIndex: 10 }}>单位：GB</div>
        {data.length > 0 ? (
          <Line
            loading={loading}
            data={data}
            xField="time"
            yField="trafficGb"
            smooth
            color="#2563EB"
            point={{ size: 3, shape: 'circle' }}
            scale={{
              time: { alias: '日期' },
              trafficGb: { alias: '流量(GB)' },
            }}
            xAxis={{
              grid: { line: { style: { stroke: '#E5E7EB', lineDash: [4, 4] } } }
            }}
            yAxis={{
              grid: { line: { style: { stroke: '#E5E7EB', lineDash: [4, 4] } } }
            }}
            tooltip={{
              showMarkers: false,
              title: 'time',
              formatter: (datum: any) => ({
                name: '流量(GB)',
                value: Number(datum?.trafficGb ?? 0).toFixed(2),
              }),
              container: { style: { backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', borderRadius: '8px' } }
            }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            暂无流量趋势数据
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficTrendChart;
