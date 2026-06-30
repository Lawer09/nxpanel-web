import { Button, Card, DatePicker, Segmented, Select, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { STANDARD_DATE_PRESET_ITEMS, toRangePickerPresets } from '@/components/report/reportDatePreset';
import { CARD_STYLE, GRANULARITY_OPTIONS } from '../constants';
import type { TrendGranularity, TrendQueryState } from '../types';
import {
  buildProjectTrendHourDateTimeRangeValue,
  parseProjectTrendHourDateTimeRange,
} from '../utils';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;
const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

type TrendDashboardHeaderProps = {
  query: TrendQueryState;
  projectName?: string | null;
  packageName?: string | null;
  projectStatus?: string | null;
  adStatus?: string | null;
  adStatusColor: string;
  projectOptions: Array<{ label: string; value: string }>;
  onProjectCodeChange: (value: string) => void;
  onDateRangeChange: (value: [string, string]) => void;
  onGranularityChange: (value: TrendGranularity) => void;
  onHourDateTimeRangeChange: (value: {
    dateRange: [string, string];
    hourFrom?: number;
    hourTo?: number;
  }) => void;
  onSearch: () => void;
  searchLoading?: boolean;
};

const TrendDashboardHeader: React.FC<TrendDashboardHeaderProps> = ({
  query,
  projectName,
  packageName,
  projectStatus,
  adStatus,
  adStatusColor,
  projectOptions,
  onProjectCodeChange,
  onDateRangeChange,
  onGranularityChange,
  onHourDateTimeRangeChange,
  onSearch,
  searchLoading,
}) => {
  return (
    <Card style={CARD_STYLE} styles={{ body: { padding: 20 } }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Space align="center" wrap size={8}>
            <Title level={4} style={{ margin: 0 }}>
              {query.projectCode || '未选择项目'}
            </Title>
            {adStatus ? <Tag color={adStatusColor}>投放-{adStatus}</Tag> : null}
            {projectStatus ? <Tag>{projectStatus}</Tag> : null}
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {projectName || '项目趋势分析'} {packageName ? `| ${packageName}` : ''}
            </Text>
          </div>
        </div>

        <Space wrap>
          <Segmented
            value={query.granularity}
            options={GRANULARITY_OPTIONS}
            onChange={(value) => onGranularityChange(value as TrendGranularity)}
          />
          <Select
            showSearch
            placeholder="选择项目代号"
            style={{ width: 260 }}
            value={query.projectCode || undefined}
            options={projectOptions}
            optionFilterProp="label"
            onChange={onProjectCodeChange}
          />
          <RangePicker
            value={
              query.granularity === 'hour'
                ? buildProjectTrendHourDateTimeRangeValue(query.dateRange, query.hourFrom, query.hourTo)
                : [dayjs(query.dateRange[0]), dayjs(query.dateRange[1])]
            }
            presets={query.granularity === 'day' ? DATE_PRESETS : undefined}
            showTime={
              query.granularity === 'hour'
                ? {
                    format: 'HH:00',
                    defaultOpenValue: [dayjs().startOf('day'), dayjs().hour(23).minute(0).second(0)],
                  }
                : undefined
            }
            format={query.granularity === 'hour' ? 'YYYY-MM-DD HH:00' : 'YYYY-MM-DD'}
            onChange={(dates) => {
              const [start, end] = dates ?? [];
              if (!start || !end) return;

              if (query.granularity === 'hour') {
                const next = parseProjectTrendHourDateTimeRange([start, end]);
                if (!next) return;
                onHourDateTimeRangeChange(next);
                return;
              }

              onDateRangeChange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
            }}
          />
          <Button type="primary" onClick={onSearch} loading={searchLoading}>
            查询
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default TrendDashboardHeader;
