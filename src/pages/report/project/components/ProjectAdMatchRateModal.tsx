import { Line } from '@ant-design/charts';
import { Button, DatePicker, Empty, Modal, Space, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  STANDARD_DATE_PRESET_ITEMS,
  toRangePickerPresets,
} from '@/components/report/reportDatePreset';
import { fmtInt, parseRecentHourlyAdMatchRates } from '@/pages/report/project/reportShared';

const { RangePicker } = DatePicker;
const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);

type ProjectAdMatchRateModalProps = {
  open: boolean;
  loading?: boolean;
  projectCode?: string;
  initialDateRange: [string, string];
  rows: API.ProjectHourlyAdMatchRateItem[];
  onCancel: () => void;
  onQuery: (dateRange: [string, string]) => void | Promise<void>;
};

type ChartDatum = {
  key: string;
  timeLabel: string;
  adMatchRate: number;
  adRequests: number | null;
  adMatchedRequests: number | null;
};

const EMPTY_TEXT = '所选日期范围暂无匹配率数据';
const REFERENCE_MATCH_RATE = 70;

const ProjectAdMatchRateModal: React.FC<ProjectAdMatchRateModalProps> = ({
  open,
  loading = false,
  projectCode,
  initialDateRange,
  rows,
  onCancel,
  onQuery,
}) => {
  const [dateRange, setDateRange] = useState<[string, string]>(initialDateRange);

  useEffect(() => {
    if (!open) return;
    setDateRange(initialDateRange);
  }, [initialDateRange, open, projectCode]);

  const chartData = useMemo<ChartDatum[]>(() => {
    return parseRecentHourlyAdMatchRates(rows).map((item) => ({
      key: `${item.reportDate}-${item.hour}`,
      timeLabel: `${item.reportDate.slice(5)} ${String(item.hour).padStart(2, '0')}:00`,
      adMatchRate: item.adMatchRate,
      adRequests: item.adRequests,
      adMatchedRequests: item.adMatchedRequests,
    }));
  }, [rows]);

  const chartWidth = useMemo(() => Math.max(720, chartData.length * 42), [chartData.length]);

  const lineConfig = useMemo(
    () => ({
      data: chartData,
      autoFit: false,
      width: chartWidth,
      height: 280,
      xField: 'timeLabel',
      yField: 'adMatchRate',
      padding: [16, 24, 48, 52],
      scale: {
        y: {
          min: 0,
          max: 100,
        },
      },
      axis: {
        x: {
          title: false,
          labelAutoHide: true,
          labelAutoRotate: false,
        },
        y: {
          title: false,
          labelFormatter: (value: string | number) => `${value}%`,
        },
      },
      point: {
        size: 2,
        style: {
          fill: '#1677ff',
          stroke: '#ffffff',
          lineWidth: 1,
        },
      },
      line: {
        style: {
          stroke: '#1677ff',
          lineWidth: 2,
        },
      },
      annotations: [
        {
          type: 'lineY',
          y: REFERENCE_MATCH_RATE,
          style: {
            stroke: '#fa8c16',
            lineDash: [4, 4],
            lineWidth: 1,
          },
          text: {
            content: '70%',
            position: 'left',
            style: {
              fill: '#8c8c8c',
              fontSize: 12,
            },
          },
        },
      ],
      tooltip: {
        title: (datum: ChartDatum) => datum.timeLabel,
        items: [
          {
            field: 'adMatchRate',
            name: '匹配率',
            valueFormatter: (value: number) => `${Number(value).toFixed(2)}%`,
          },
          {
            field: 'adRequests',
            name: '当前请求',
            valueFormatter: (value: number | null) => (value === null ? '--' : fmtInt(value)),
          },
          {
            field: 'adMatchedRequests',
            name: '当前匹配',
            valueFormatter: (value: number | null) => (value === null ? '--' : fmtInt(value)),
          },
        ],
      },
      interaction: {
        tooltip: {
          series: false,
        },
      },
      scrollbar: false,
      slider: false,
    }),
    [chartData, chartWidth],
  );

  const handleQuery = () => {
    onQuery(dateRange);
  };

  return (
    <Modal
      destroyOnHidden
      footer={null}
      open={open}
      width={960}
      title={`广告匹配率趋势${projectCode ? ` - ${projectCode}` : ''}`}
      onCancel={onCancel}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap>
          <RangePicker
            allowClear={false}
            presets={DATE_PRESETS}
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={(dates) => {
              const [start, end] = dates ?? [];
              if (!start || !end) return;
              setDateRange([start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]);
            }}
          />
          <Button type="primary" onClick={handleQuery}>
            查询
          </Button>
        </Space>

        <Spin spinning={loading}>
          {chartData.length ? (
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ width: chartWidth }}>
                <Line {...(lineConfig as any)} />
              </div>
            </div>
          ) : (
            <Empty
              description={EMPTY_TEXT}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '48px 0 24px' }}
            />
          )}
        </Spin>

        <Typography.Text type="secondary">
          图表展示所选日期范围内的小时匹配率，橙色虚线为 70% 参考线。
        </Typography.Text>
      </Space>
    </Modal>
  );
};

export default ProjectAdMatchRateModal;
