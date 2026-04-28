import { PageContainer } from '@ant-design/pro-components';
import { App, Card, DatePicker, Form, Input, InputNumber, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { getTrafficRanking, getTrafficPlatforms } from '@/services/traffic-platform/api';

const RankingPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.TrafficRankingItem[]>([]);
  const [rankBy, setRankBy] = useState<'account' | 'externalUid' | 'geo'>('account');
  const [platformCode, setPlatformCode] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const [limit, setLimit] = useState<number>(20);
  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([]);

  const today = dayjs();
  const [dateRange, setDateRange] = useState<[string, string]>([
    today.subtract(7, 'day').format('YYYY-MM-DD'),
    today.format('YYYY-MM-DD'),
  ]);

  useEffect(() => {
    getTrafficPlatforms({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setPlatformOptions(res.data.data.map((p) => ({ label: p.name, value: p.code })));
      }
    });
  }, []);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await getTrafficRanking({
        platformCode: platformCode,
        accountId: accountId,
        startDate: dateRange[0],
        endDate: dateRange[1],
        rankBy: rankBy,
        limit,
      });
      if (res.code === 0 && res.data) {
        setData(res.data);
      } else {
        messageApi.error(res.msg || '获取排行数据失败');
        setData([]);
      }
    } catch {
      messageApi.error('获取排行数据失败');
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRanking();
  }, [dateRange, rankBy, platformCode, accountId, limit]);

  const rankByLabel: Record<string, string> = {
    account: '账号',
    externalUid: '子账号',
    geo: '地区',
  };

  const columns: ColumnsType<API.TrafficRankingItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 70,
      render: (v) => {
        if (v <= 3) return <Tag color="gold">#{v}</Tag>;
        return `#${v}`;
      },
    },
    { title: 'Key', dataIndex: 'key', width: 160 },
    { title: '名称', dataIndex: 'name', width: 160 },
    {
      title: '流量 (GB)',
      dataIndex: 'trafficGb',
      width: 140,
      sorter: (a, b) => a.trafficBytes - b.trafficBytes,
      render: (_, r) => Number(r.trafficGb).toFixed(3),
    },
    {
      title: '流量 (MB)',
      dataIndex: 'trafficMb',
      width: 140,
      render: (_, r) => Number(r.trafficMb).toFixed(2),
    },
  ];

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="日期范围">
            <DatePicker.RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="排行维度">
            <Select
              value={rankBy}
              onChange={setRankBy}
              style={{ width: 120 }}
              options={[
                { label: '账号', value: 'account' },
                { label: '子账号', value: 'externalUid' },
                { label: '地区', value: 'geo' },
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
          <Form.Item label="Top N">
            <InputNumber min={1} max={100} value={limit} onChange={(v) => setLimit(v ?? 20)} />
          </Form.Item>
        </Form>
      </Card>

      <Card title={`流量排行 - 按${rankByLabel[rankBy]}`}>
        <Table<API.TrafficRankingItem>
          rowKey="rank"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
        />
      </Card>
    </PageContainer>
  );
};

export default RankingPage;
