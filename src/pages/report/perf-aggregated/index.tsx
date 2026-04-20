import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { DatePicker, InputNumber, Input, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getAggregatedPerformance } from '@/services/performance/api';

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

const formatTimeSlot = (record: API.AggregatedPerformanceItem) =>
  `${record.date} ${String(record.hour).padStart(2, '0')}:${String(record.minute).padStart(2, '0')}`;

const PerfAggregatedPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [nodeId, setNodeId] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [platform, setPlatform] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  const columns: ProColumns<API.AggregatedPerformanceItem>[] = [
    {
      title: '时间窗口',
      key: 'time_slot',
      width: 160,
      search: false,
      render: (_, record) => <Text>{formatTimeSlot(record)}</Text>,
    },
    {
      title: '节点ID',
      dataIndex: 'node_id',
      width: 90,
      search: false,
    },
    {
      title: '平均延迟',
      dataIndex: 'avg_delay',
      width: 120,
      search: false,
      render: (_, record) => delayTag(record.avg_delay),
      sorter: (a, b) => a.avg_delay - b.avg_delay,
    },
    {
      title: '平均成功率',
      dataIndex: 'avg_success_rate',
      width: 120,
      search: false,
      render: (_, record) => successRateTag(record.avg_success_rate),
      sorter: (a, b) => a.avg_success_rate - b.avg_success_rate,
    },
    {
      title: '上报总数',
      dataIndex: 'total_count',
      width: 100,
      search: false,
      sorter: (a, b) => a.total_count - b.total_count,
    },
    {
      title: '国家',
      dataIndex: 'client_country',
      width: 80,
      search: false,
      render: (_, record) => record.client_country || '-',
    },
    // {
    //   title: '城市',
    //   dataIndex: 'client_city',
    //   width: 100,
    //   search: false,
    //   render: (_, record) => record.client_city || '-',
    // },
    // {
    //   title: '平台',
    //   dataIndex: 'platform',
    //   width: 120,
    //   search: false,
    //   render: (_, record) => record.platform ? <Tag>{record.platform}</Tag> : '-',
    // },
    // {
    //   title: 'ISP',
    //   dataIndex: 'client_isp',
    //   width: 150,
    //   search: false,
    //   ellipsis: true,
    //   render: (_, record) => record.client_isp || '-',
    // },
  ];

  return (
    <PageContainer>
      <ProTable<API.AggregatedPerformanceItem>
        headerTitle="节点性能聚合数据"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolbar={{
          filter: (
            <Space wrap>
              <InputNumber
                placeholder="节点ID"
                value={nodeId}
                onChange={(v) => {
                  setNodeId(v ?? undefined);
                  actionRef.current?.reload();
                }}
                style={{ width: 120 }}
                min={1}
              />
              <Input
                placeholder="国家代码 (如 CN)"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value || undefined);
                }}
                onPressEnter={() => actionRef.current?.reload()}
                style={{ width: 160 }}
                maxLength={2}
              />
              <Input
                placeholder="平台 (如 Android 11)"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value || undefined);
                }}
                onPressEnter={() => actionRef.current?.reload()}
                style={{ width: 180 }}
              />
              <RangePicker
                value={
                  dateRange
                    ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                    : undefined
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                  } else {
                    setDateRange(undefined);
                  }
                  actionRef.current?.reload();
                }}
              />
            </Space>
          ),
        }}
        request={async (params) => {
          const { current, pageSize } = params;
          const res = await getAggregatedPerformance({
            node_id: nodeId,
            client_country: country,
            platform,
            date_from: dateRange?.[0],
            date_to: dateRange?.[1],
            page: current,
            page_size: pageSize,
          });
          const payload = (res as any)?.data ?? res;
          return {
            data: payload?.data || [],
            total: payload?.total || 0,
            success: true,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 50, showSizeChanger: true }}
      />
    </PageContainer>
  );
};

export default PerfAggregatedPage;
