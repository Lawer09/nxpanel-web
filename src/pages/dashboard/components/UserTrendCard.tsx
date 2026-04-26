import { Line } from '@ant-design/charts';
import { SettingOutlined } from '@ant-design/icons';
import { Card, DatePicker, Select, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';

const { Text } = Typography;

interface UserTrendCardProps {
  hourlyData: API.UserHourlyStatItem[];
  hourlyLoading: boolean;
  activeData: API.ActiveUsersTrendItem[];
  activeLoading: boolean;
  activeGranularity: 'day' | 'week' | 'month';
  onGranularityChange: (v: 'day' | 'week' | 'month') => void;
  activeRange: [string, string];
  onRangeChange: (range: [string, string]) => void;
  onOpenSettings?: () => void;
}

const UserTrendCard: React.FC<UserTrendCardProps> = ({
  hourlyData,
  hourlyLoading,
  activeData,
  activeLoading,
  activeGranularity,
  onGranularityChange,
  activeRange,
  onRangeChange,
  onOpenSettings,
}) => {
  const [showActiveTrend, setShowActiveTrend] = useState(false);

  return (
    <>
      <Card
        title="用户趋势"
        loading={hourlyLoading}
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <a onClick={() => setShowActiveTrend((v) => !v)}>
              {showActiveTrend ? '收起活跃趋势' : '展开活跃趋势'}
            </a>
            {onOpenSettings && (
              <SettingOutlined
                style={{ fontSize: 16, cursor: 'pointer' }}
                onClick={onOpenSettings}
              />
            )}
          </Space>
        }
      >
        <Line
          data={hourlyData.flatMap((item) => [
            { time: dayjs(item.time).format('MM/DD HH'), value: item.newUsers, series: '新增用户' },
            { time: dayjs(item.time).format('MM/DD HH'), value: item.activeUsers, series: '活跃用户' },
          ])}
          xField="time"
          yField="value"
          colorField="series"
          height={260}
          smooth
          axis={{ y: { labelFormatter: (v: number) => v.toLocaleString() } }}
          tooltip={{ items: [{ field: 'value', valueFormatter: (v: number) => v.toLocaleString() }] }}
          legend={{ position: 'top-right' as const }}
        />
      </Card>

      {showActiveTrend && (
        <Card
          title="活跃用户趋势"
          loading={activeLoading}
          style={{ marginBottom: 16 }}
          extra={
            <Space>
              <Select
                value={activeGranularity}
                onChange={onGranularityChange}
                style={{ width: 100 }}
                options={[
                  { label: '按天', value: 'day' },
                  { label: '按周', value: 'week' },
                  { label: '按月', value: 'month' },
                ]}
              />
              <DatePicker.RangePicker
                value={[dayjs(activeRange[0]), dayjs(activeRange[1])]}
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
            </Space>
          }
        >
          <Table<API.ActiveUsersTrendItem>
            size="small"
            rowKey="period"
            dataSource={activeData}
            pagination={false}
            scroll={{ x: 600 }}
            bordered
            columns={[
              {
                title: '周期',
                dataIndex: 'period',
                width: 120,
                render: (_, record) =>
                  record.periodStart && record.periodEnd && record.periodStart !== record.periodEnd
                    ? `${record.periodStart} ~ ${record.periodEnd}`
                    : record.period,
              },
              {
                title: '活跃用户',
                dataIndex: 'activeUsers',
                width: 120,
                sorter: (a, b) => a.activeUsers - b.activeUsers,
                render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
              },
              {
                title: '总上报次数',
                dataIndex: 'totalReports',
                width: 130,
                sorter: (a, b) => a.totalReports - b.totalReports,
                render: (v: number) => v.toLocaleString(),
              },
            ]}
          />
        </Card>
      )}
    </>
  );
};

export default UserTrendCard;
