import { Line } from '@ant-design/charts';
import { ProTable } from '@ant-design/pro-components';
import { App, Card, DatePicker, Form, Input, Select, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getProjectAdSpendSummary,
  getProjectAdSpendTrend,
  getProjectAdSpendDaily,
} from '@/services/project/api';

const { RangePicker } = DatePicker;

interface AdSpendTabProps {
  projectCode: string;
}

const AdSpendTab: React.FC<AdSpendTabProps> = ({ projectCode }) => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState<[string, string]>([today, today]);
  const [accountId, setAccountId] = useState<number | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [dimension, setDimension] = useState<'day' | 'month'>('day');
  const [summary, setSummary] = useState<API.ProjectAdSpendSummaryItem | undefined>();
  const [trendData, setTrendData] = useState<API.ProjectAdSpendTrendItem[]>([]);

  const fetchSummary = async () => {
    const res = await getProjectAdSpendSummary(projectCode, {
      startDate: dateRange[0],
      endDate: dateRange[1],
      country,
      accountId,
    });
    if (res.code !== 0) {
      messageApi.error(res.msg || '汇总获取失败');
      return;
    }
    setSummary(res.data);
  };

  const fetchTrend = async () => {
    const res = await getProjectAdSpendTrend(projectCode, {
      startDate: dateRange[0],
      endDate: dateRange[1],
      country,
      accountId,
      dimension,
    });
    if (res.code !== 0) {
      messageApi.error(res.msg || '趋势获取失败');
      setTrendData([]);
      return;
    }
    setTrendData(res.data || []);
  };

  useEffect(() => {
    if (!projectCode) return;
    fetchSummary();
    fetchTrend();
  }, [projectCode, dateRange, country, accountId, dimension]);

  const trendConfig = {
    data: trendData.map((item) => ({
      time: item.time,
      spend: Number(item.spend),
      clicks: item.clicks,
      impressions: item.impressions,
    })),
    xField: 'time',
    yField: 'spend',
    smooth: true,
    point: { size: 3 },
    tooltip: { showMarkers: true },
  };

  const dailyColumns = useMemo(
    () => [
      { title: '日期', dataIndex: 'reportDate', width: 120, search: false },
      { title: '平台', dataIndex: 'platformCode', width: 100, search: false },
      { title: '账号', dataIndex: 'accountName', width: 130, search: false },
      { title: '国家', dataIndex: 'country', width: 80, search: false },
      { title: '展示', dataIndex: 'impressions', width: 90, search: false },
      { title: '点击', dataIndex: 'clicks', width: 90, search: false },
      { title: '花费', dataIndex: 'spend', width: 100, search: false },
      {
        title: 'CTR',
        dataIndex: 'ctr',
        width: 90,
        search: false,
        render: (_: any, r: API.ProjectAdSpendDailyItem) => <Tag color="blue">{r.ctr}%</Tag>,
      },
      { title: 'CPM', dataIndex: 'cpm', width: 90, search: false },
      { title: 'CPC', dataIndex: 'cpc', width: 90, search: false },
    ],
    [],
  );

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="账号ID">
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="投放账号ID"
              style={{ width: 140 }}
            />
          </Form.Item>
          <Form.Item label="国家">
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value || undefined)}
              placeholder="空表示全部"
              style={{ width: 140 }}
            />
          </Form.Item>
          <Form.Item label="日期范围">
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="趋势维度">
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 120 }}
              options={[
                { label: '天', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="投放汇总" style={{ marginBottom: 16 }}>
        <Space size={24} wrap>
          <div>展示：{summary?.impressions ?? '-'}</div>
          <div>点击：{summary?.clicks ?? '-'}</div>
          <div>花费：{summary?.spend ?? '-'}</div>
          <div>CTR：{summary?.ctr ?? '-'}</div>
          <div>CPM：{summary?.cpm ?? '-'}</div>
          <div>CPC：{summary?.cpc ?? '-'}</div>
        </Space>
      </Card>

      <Card title="投放趋势" style={{ marginBottom: 16 }}>
        <Line {...trendConfig} height={320} />
      </Card>

      <Card title="投放日报明细">
        <ProTable<API.ProjectAdSpendDailyItem>
          rowKey={(r) => `${r.reportDate}_${r.platformAccountId}_${r.country}`}
          columns={dailyColumns as ColumnsType<API.ProjectAdSpendDailyItem>}
          search={false}
          request={async (params) => {
            const res = await getProjectAdSpendDaily(projectCode, {
              startDate: dateRange[0],
              endDate: dateRange[1],
              country,
              accountId,
              page: params.current ?? 1,
              pageSize: params.pageSize ?? 50,
            });
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取日报失败');
              return { data: [], success: false, total: 0 };
            }
            return {
              data: res.data?.data ?? [],
              success: true,
              total: res.data?.total ?? 0,
            };
          }}
          pagination={{ defaultPageSize: 50 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </>
  );
};

export default AdSpendTab;
