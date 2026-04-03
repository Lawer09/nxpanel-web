import { Line } from '@ant-design/charts';
import { Card, DatePicker, Radio, Select, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useRequest } from '@umijs/max';
import { getStatServerDetail } from '@/services/stat/api';

const { RangePicker } = DatePicker;

type Granularity = 'minute' | 'hour' | 'day';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatTime(record_at: number, granularity: Granularity): string {
  const d = dayjs.unix(record_at);
  if (granularity === 'minute') return d.format('HH:mm');
  if (granularity === 'hour') return d.format('MM-DD HH:00');
  return d.format('MM-DD');
}

interface ServerTrafficChartProps {
  serverOptions: { label: string; value: number | undefined }[];
}

const ServerTrafficChart: React.FC<ServerTrafficChartProps> = ({ serverOptions }) => {
  const now = dayjs();

  const [chartServerId, setChartServerId] = useState<number | undefined>(undefined);
  const [chartRange, setChartRange] = useState<[number, number]>([
    now.startOf('day').unix(),
    now.endOf('day').unix(),
  ]);
  const [granularity, setGranularity] = useState<Granularity>('hour');

  // 根据粒度自动设置 pageSize
  const pageSize = granularity === 'minute' ? 1440 : granularity === 'hour' ? 744 : 365;

  const { data: chartRes, loading: chartLoading } = useRequest(
    () =>
      getStatServerDetail({
        server_id: chartServerId,
        start_time: chartRange[0],
        end_time: chartRange[1],
        granularity,
        page: 1,
        pageSize,
      }),
    { refreshDeps: [chartServerId, chartRange, granularity] },
  );

  const rawData: API.StatServerDetailItem[] = (chartRes as any)?.data || [];

  // 转换为折线图数据：每条记录拆成上传/下载两个系列
  const chartData = useMemo(() => {
    const result: { time: string; value: number; type: string }[] = [];
    rawData.forEach((item) => {
      const time = formatTime(item.record_at, granularity);
      result.push({ time, value: item.u, type: '上传' });
      result.push({ time, value: item.d, type: '下载' });
    });
    return result;
  }, [rawData, granularity]);

  const config = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    colorField: 'type',
    smooth: true,
    height: 300,
    axis: {
      y: {
        labelFormatter: (v: number) => formatBytes(v),
      },
    },
    tooltip: {
      items: [
        {
          field: 'value',
          valueFormatter: (v: number) => formatBytes(v),
        },
      ],
    },
    legend: { position: 'top-right' as const },
  };

  return (
    <Card
      title="节点流量趋势图"
      style={{ marginBottom: 16 }}
      extra={
        <Space wrap size={8}>
          <Select
            size="small"
            style={{ width: 160 }}
            placeholder="全部节点"
            allowClear
            options={serverOptions}
            value={chartServerId}
            onChange={(v) => setChartServerId(v)}
          />
          <RangePicker
            size="small"
            value={[dayjs.unix(chartRange[0]), dayjs.unix(chartRange[1])]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setChartRange([
                  dates[0].startOf('day').unix(),
                  dates[1].endOf('day').unix(),
                ]);
              }
            }}
          />
          <Radio.Group
            size="small"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '分钟', value: 'minute' },
              { label: '小时', value: 'hour' },
              { label: '天', value: 'day' },
            ]}
          />
        </Space>
      }
    >
      {chartLoading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <Line {...config} />
      )}
    </Card>
  );
};

export default ServerTrafficChart;
