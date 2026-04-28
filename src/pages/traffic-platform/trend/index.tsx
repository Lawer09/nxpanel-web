import { Line } from '@ant-design/charts';
import { PageContainer } from '@ant-design/pro-components';
import { App, Card, Col, DatePicker, Form, Input, Row, Select, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { getTrafficTrend, getTrafficPlatforms } from '@/services/traffic-platform/api';

const { RangePicker } = DatePicker;

const TrendPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<API.TrafficTrendItem[]>([]);
  const [dimension, setDimension] = useState<'hour' | 'day' | 'month'>('day');
  const [platformCode, setPlatformCode] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [externalUid, setExternalUid] = useState<string | undefined>();
  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);

  const today = dayjs();
  const [timeRange, setTimeRange] = useState<[string, string]>([
    today.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    today.format('YYYY-MM-DD HH:mm:ss'),
  ]);

  useEffect(() => {
    getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setPlatformOptions(res.data.data.map((p) => ({ label: p.name, value: p.code })));
      }
    });
  }, []);

  const fetchTrend = async () => {
    setLoading(true);
    try {
      const res = await getTrafficTrend({
        platformCode: platformCode,
        accountId: accountId,
        externalUid: externalUid,
        startTime: timeRange[0],
        endTime: timeRange[1],
        dimension,
      });
      if (res.code === 0 && res.data) {
        setTrendData(res.data);
      } else {
        messageApi.error(res.msg || '获取趋势数据失败');
        setTrendData([]);
      }
    } catch {
      messageApi.error('获取趋势数据失败');
      setTrendData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrend();
  }, [timeRange, dimension, platformCode, accountId, externalUid]);

  const chartData = trendData.map((item) => ({
    time: item.time,
    trafficGb: Number(item.trafficGb),
  }));

  const config = {
    data: chartData,
    xField: 'time',
    yField: 'trafficGb',
    smooth: true,
    point: { size: 3 },
    yAxis: { title: { text: '流量 (GB)' } },
    xAxis: { title: { text: '时间' } },
    tooltip: {
      formatter: (datum: any) => ({
        name: '流量',
        value: `${datum.trafficGb.toFixed(3)} GB`,
      }),
    },
  };

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="时间范围">
            <RangePicker
              showTime={dimension === 'hour'}
              picker={dimension === 'month' ? 'month' : undefined}
              value={[dayjs(timeRange[0]), dayjs(timeRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  if (dimension === 'month') {
                    setTimeRange([
                      dates[0].format('YYYY-MM'),
                      dates[1].format('YYYY-MM'),
                    ]);
                  } else {
                    setTimeRange([
                      dates[0].format('YYYY-MM-DD HH:mm:ss'),
                      dates[1].format('YYYY-MM-DD HH:mm:ss'),
                    ]);
                  }
                }
              }}
            />
          </Form.Item>
          <Form.Item label="维度">
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 120 }}
              options={[
                { label: '小时', value: 'hour' },
                { label: '天', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
          </Form.Item>
          <Form.Item label="平台">
            <Select
              value={platformCode}
              onChange={setPlatformCode}
              allowClear
              placeholder="全部"
              style={{ width: 140 }}
              options={platformOptions}
            />
          </Form.Item>
          <Form.Item label="账号ID">
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="平台账号ID"
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item label="子账号ID">
            <Input
              value={externalUid}
              onChange={(e) => setExternalUid(e.target.value || undefined)}
              placeholder="三方子账号ID"
              style={{ width: 140 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Spin spinning={loading}>
          {chartData.length > 0 ? (
            <Line {...config} height={400} />
          ) : (
            <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
              暂无数据
            </div>
          )}
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default TrendPage;
