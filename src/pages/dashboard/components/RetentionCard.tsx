import { Card, DatePicker, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

const { Text } = Typography;

interface RetentionCardProps {
  data: API.RetentionCohortItem[];
  loading: boolean;
  range: [string, string];
  onRangeChange: (range: [string, string]) => void;
}

const RetentionCard: React.FC<RetentionCardProps> = ({ data, loading, range, onRangeChange }) => (
  <Card
    title="用户留存分析"
    loading={loading}
    style={{ marginBottom: 16 }}
    extra={
      <DatePicker.RangePicker
        value={[dayjs(range[0]), dayjs(range[1])]}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) {
            onRangeChange([
              dates[0].format('YYYY-MM-DD'),
              dates[1].format('YYYY-MM-DD'),
            ]);
          }
        }}
        allowClear={false}
      />
    }
  >
    <Table<API.RetentionCohortItem>
      size="small"
      rowKey="date"
      dataSource={data}
      pagination={false}
      scroll={{ x: 900 }}
      bordered
      columns={[
        { title: '日期', dataIndex: 'date', width: 110, fixed: 'left' },
        { title: '活跃用户', dataIndex: 'activeUsers', width: 90 },
        ...([1, 3, 7, 14, 30] as const).map((d) => ({
          title: `Day+${d}`,
          key: `day_${d}`,
          width: 120,
          render: (_: any, record: API.RetentionCohortItem) => {
            const r = record.retention?.[`day_${d}` as keyof typeof record.retention];
            if (!r) return <Text type="secondary">-</Text>;
            const color =
              r.rate >= 50 ? '#52c41a' : r.rate >= 20 ? '#faad14' : '#ff4d4f';
            return (
              <Tooltip title={`${r.count} 人`}>
                <Tag color={color}>{r.rate.toFixed(1)}%</Tag>
              </Tooltip>
            );
          },
        })),
      ]}
    />
  </Card>
);

export default RetentionCard;
