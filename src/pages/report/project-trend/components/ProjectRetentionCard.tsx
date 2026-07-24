import { Card, DatePicker, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { STANDARD_DATE_PRESET_ITEMS, toRangePickerPresets } from '@/components/report/reportDatePreset';
import { CARD_STYLE, PROJECT_RETENTION_DAYS } from '../constants';
import { formatInteger } from '../utils';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

type ProjectRetentionCardProps = {
  data: API.ProjectRetentionCohortItem[];
  loading: boolean;
  range: [string, string];
  retentionDays?: number[];
  onRangeChange: (range: [string, string]) => void;
};

const getRetentionCellColor = (rate: number) => {
  if (rate >= 50) return '#52c41a';
  if (rate >= 20) return '#faad14';
  return '#ff4d4f';
};

const getRetentionValue = (record: API.ProjectRetentionCohortItem, day: number) =>
  record.retention?.[`day${day}`] ?? record.retention?.[`day_${day}`] ?? null;

const ProjectRetentionCard: React.FC<ProjectRetentionCardProps> = ({
  data,
  loading,
  range,
  retentionDays,
  onRangeChange,
}) => {
  const days = retentionDays?.length ? retentionDays : PROJECT_RETENTION_DAYS;

  return (
    <Card
      title="项目留存分析"
      loading={loading}
      style={CARD_STYLE}
      styles={{ body: { padding: 20 } }}
      extra={
        <RangePicker
          value={[dayjs(range[0]), dayjs(range[1])]}
          presets={DATE_PRESETS}
          allowClear={false}
          onChange={(dates) => {
            const [start, end] = dates ?? [];
            if (!start || !end) return;
            onRangeChange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
          }}
        />
      }
    >
      <Table<API.ProjectRetentionCohortItem>
        size="small"
        rowKey="date"
        dataSource={data}
        pagination={false}
        scroll={{ x: 900 }}
        bordered
        columns={[
          { title: '日期', dataIndex: 'date', width: 120, fixed: 'left' },
          {
            title: '活跃用户',
            dataIndex: 'activeUsers',
            width: 120,
            align: 'right',
            render: (value) => formatInteger(value),
          },
          ...days.map((day) => ({
            title: `Day+${day}`,
            key: `day${day}`,
            width: 120,
            align: 'right' as const,
            render: (_: unknown, record: API.ProjectRetentionCohortItem) => {
              const retention = getRetentionValue(record, day);
              if (!retention) return <Text type="secondary">-</Text>;

              return (
                <Tooltip title={`${formatInteger(retention.count)} 人`}>
                  <Tag color={getRetentionCellColor(retention.rate)} style={{ marginInlineEnd: 0 }}>
                    {retention.rate.toFixed(1)}%
                  </Tag>
                </Tooltip>
              );
            },
          })),
        ]}
      />
    </Card>
  );
};

export default ProjectRetentionCard;
