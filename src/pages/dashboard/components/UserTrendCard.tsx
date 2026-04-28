import { Column, Line } from '@ant-design/charts';
import { SettingOutlined } from '@ant-design/icons';
import { Card, DatePicker, Select, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';

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

  // 最近一小时数据
  const latestHour = useMemo(() => {
    if (!hourlyData.length) return null;
    const last = hourlyData[hourlyData.length - 1];
    return {
      time: dayjs(last.time).format('MM-DD HH'),
      newUsers: last.newUsers,
      activeUsers: last.activeUsers,
    };
  }, [hourlyData]);

  return (
    <>
      <Card
        title={
          <Space>
            <span>用户趋势</span>
            {latestHour && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {latestHour.time}  新增：{latestHour.newUsers.toLocaleString()}  活跃：{latestHour.activeUsers.toLocaleString()}
              </Text>
            )}
          </Space>
        }
        loading={hourlyLoading}
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <a onClick={() => setShowActiveTrend((v) => !v)}>
              {showActiveTrend ? '收起总览' : '展开总览'}
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
          title="总览"
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
          <Column
            data={activeData.flatMap((item) => [
              {
                period: item.periodStart && item.periodEnd && item.periodStart !== item.periodEnd
                  ? `${item.periodStart}~${item.periodEnd}`
                  : item.period,
                value: item.activeUsers,
                series: '活跃用户',
              },
              {
                period: item.periodStart && item.periodEnd && item.periodStart !== item.periodEnd
                  ? `${item.periodStart}~${item.periodEnd}`
                  : item.period,
                value: item.newUsers,
                series: '新增用户',
              },
              {
                period: item.periodStart && item.periodEnd && item.periodStart !== item.periodEnd
                  ? `${item.periodStart}~${item.periodEnd}`
                  : item.period,
                value: item.regUsers ?? 0,
                series: '注册用户',
              },
            ])}
            xField="period"
            yField="value"
            colorField="series"
            group
            height={300}
            axis={{ y: { labelFormatter: (v: number) => v.toLocaleString() } }}
            tooltip={{ items: [{ field: 'value', valueFormatter: (v: number) => v.toLocaleString() }] }}
            legend={{ position: 'top-right' as const }}
          />
        </Card>
      )}
    </>
  );
};

export default UserTrendCard;
