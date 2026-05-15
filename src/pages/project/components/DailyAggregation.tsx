import React, { useState } from 'react';
import { Card, DatePicker, Space, Button, Alert, App } from 'antd';
import { SyncOutlined, ApiOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { aggregateSync, aggregateAsync } from '@/services/project/api';

interface DailyAggregationProps {
  projectId: number;
}

const { RangePicker } = DatePicker;

const DailyAggregation: React.FC<DailyAggregationProps> = ({ projectId }) => {
  const { message } = App.useApp();
  const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [asyncResult, setAsyncResult] = useState<{ triggerId: string; status: string } | null>(null);

  const handleSync = async () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning('请选择日期范围');
      return;
    }
    setSyncLoading(true);
    try {
      await aggregateSync({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
      message.success('同步聚合成功');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAsync = async () => {
    if (!dates || !dates[0] || !dates[1]) {
      message.warning('请选择日期范围');
      return;
    }
    setAsyncLoading(true);
    try {
      const res = await aggregateAsync({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
      message.success('异步聚合任务已提交');
      setAsyncResult({
        triggerId: res.triggerId,
        status: res.status
      });
    } finally {
      setAsyncLoading(false);
    }
  };

  return (
    <Card variant="borderless" title="日聚合工具">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <RangePicker
            value={dates}
            onChange={(val) => setDates(val as any)}
          />
          <Button
            type="primary"
            icon={<SyncOutlined />}
            loading={syncLoading}
            onClick={handleSync}
            disabled={asyncLoading}
          >
            同步聚合
          </Button>
          <Button
            icon={<ApiOutlined />}
            loading={asyncLoading}
            onClick={handleAsync}
            disabled={syncLoading}
          >
            异步聚合
          </Button>
        </Space>

        {asyncResult && (
          <Alert
            message="异步任务提交成功"
            description={
              <div>
                <div><strong>Trigger ID:</strong> {asyncResult.triggerId}</div>
                <div><strong>Status:</strong> {asyncResult.status}</div>
              </div>
            }
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default DailyAggregation;
