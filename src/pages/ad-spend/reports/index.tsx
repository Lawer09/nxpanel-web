import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Card, DatePicker, Form, Input, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAdSpendDaily,
  getAdSpendProjectCodes,
  getAdSpendAccounts,
} from '@/services/ad-spend-platform/api';

const { RangePicker } = DatePicker;

const ReportsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const today = dayjs().format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState<[string, string]>([today, today]);
  const [platformCode, setPlatformCode] = useState<string>('adsmakeup');
  const [accountId, setAccountId] = useState<number | undefined>();
  const [projectCode, setProjectCode] = useState<string | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    getAdSpendAccounts({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setAccountOptions(
          res.data.data.map((a) => ({ label: `${a.accountName} (${a.platformCode})`, value: a.id })),
        );
      }
    });
  }, []);

  const refreshProjectCodes = async (keyword?: string) => {
    const res = await getAdSpendProjectCodes({
      keyword,
      startDate: dateRange[0],
      endDate: dateRange[1],
    });
    if (res.code === 0 && res.data) {
      setProjectOptions(res.data.map((item) => item.projectCode));
    }
  };

  useEffect(() => {
    refreshProjectCodes();
  }, [dateRange]);

  const columns: ProColumns<API.AdSpendDailyItem>[] = [
    { title: '日期', dataIndex: 'reportDate', width: 120, search: false },
    { title: '平台', dataIndex: 'platformCode', width: 100, search: false },
    { title: '账号', dataIndex: 'accountName', width: 130, search: false },
    { title: '项目代号', dataIndex: 'projectCode', width: 120, search: false },
    { title: '国家', dataIndex: 'country', width: 80, search: false },
    { title: '展示', dataIndex: 'impressions', width: 90, search: false },
    { title: '点击', dataIndex: 'clicks', width: 90, search: false },
    { title: '花费', dataIndex: 'spend', width: 100, search: false },
    {
      title: 'CTR',
      dataIndex: 'ctr',
      width: 90,
      search: false,
      render: (_, r) => <Tag color="blue">{r.ctr}%</Tag>,
    },
    { title: 'CPM', dataIndex: 'cpm', width: 90, search: false },
    { title: 'CPC', dataIndex: 'cpc', width: 90, search: false },
    {
      title: '平台编码',
      dataIndex: 'platformCode',
      hideInTable: true,
    },
    {
      title: '账号ID',
      dataIndex: 'accountId',
      hideInTable: true,
      valueType: 'digit',
    },
    {
      title: '项目代号',
      dataIndex: 'projectCode',
      hideInTable: true,
      renderFormItem: () => (
        <Select
          showSearch
          allowClear
          placeholder="选择项目代号"
          options={projectOptions.map((item) => ({ label: item, value: item }))}
          onSearch={(value) => refreshProjectCodes(value)}
          onChange={(value) => setProjectCode(value)}
        />
      ),
    },
    {
      title: '国家',
      dataIndex: 'country',
      hideInTable: true,
      renderFormItem: () => (
        <Input placeholder="空表示全部" onChange={(e) => setCountry(e.target.value || undefined)} />
      ),
    },
    {
      title: '日期范围',
      dataIndex: 'dateRange',
      hideInTable: true,
      renderFormItem: () => (
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            }
          }}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="平台">
            <Input
              value={platformCode}
              onChange={(e) => setPlatformCode(e.target.value)}
              placeholder="adsmakeup"
              style={{ width: 140 }}
            />
          </Form.Item>
          <Form.Item label="账号">
            <Select
              value={accountId}
              onChange={(value) => setAccountId(value)}
              allowClear
              placeholder="全部账号"
              style={{ width: 180 }}
              options={accountOptions}
            />
          </Form.Item>
          <Form.Item label="项目代号">
            <Select
              value={projectCode}
              onChange={(value) => setProjectCode(value)}
              showSearch
              allowClear
              placeholder="全部项目"
              style={{ width: 160 }}
              options={projectOptions.map((item) => ({ label: item, value: item }))}
              onSearch={(value) => refreshProjectCodes(value)}
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
        </Form>
      </Card>

      <Card title="日报明细">
        <ProTable<API.AdSpendDailyItem>
          rowKey="id"
          actionRef={actionRef}
          columns={columns}
          request={async (params) => {
            const res = await getAdSpendDaily({
              platformCode: platformCode,
              accountId: params.accountId ? Number(params.accountId) : accountId,
              projectCode: projectCode,
              country: country,
              startDate: dateRange[0],
              endDate: dateRange[1],
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
          scroll={{ x: 1400 }}
          search={false}
        />
      </Card>
    </PageContainer>
  );
};

export default ReportsPage;
