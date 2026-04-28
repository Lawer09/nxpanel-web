import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, DatePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getTrafficDaily } from '@/services/traffic-platform/api';

const { RangePicker } = DatePicker;

const DailyPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const today = dayjs().format('YYYY-MM-DD');
  const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState<[string, string]>([sevenDaysAgo, today]);

  const columns: ProColumns<API.TrafficDailyItem>[] = [
    { title: '日期', dataIndex: 'statDate', width: 120, search: false },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 130, search: false },
    { title: '子账号ID', dataIndex: 'externalUid', width: 120 },
    { title: '子账号名', dataIndex: 'externalUsername', width: 120, search: false },
    { title: '地区', dataIndex: 'geo', width: 100 },
    { title: 'Region', dataIndex: 'region', width: 100, search: false },
    {
      title: '流量 (GB)',
      dataIndex: 'trafficGb',
      width: 120,
      search: false,
      sorter: (a, b) => a.trafficBytes - b.trafficBytes,
      render: (_, r) => Number(r.trafficGb).toFixed(3),
    },
    {
      title: '流量 (MB)',
      dataIndex: 'trafficMb',
      width: 120,
      search: false,
      render: (_, r) => Number(r.trafficMb).toFixed(2),
    },
    {
      title: '账号ID',
      dataIndex: 'accountId',
      hideInTable: true,
      valueType: 'digit',
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
              setDateRange([
                dates[0].format('YYYY-MM-DD'),
                dates[1].format('YYYY-MM-DD'),
              ]);
            }
          }}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TrafficDailyItem>
        rowKey={(r) => `${r.statDate}_${r.platformAccountId}_${r.externalUid}_${r.geo}`}
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTrafficDaily({
            platformCode: params.platformCode as string | undefined,
            accountId: params.accountId ? Number(params.accountId) : undefined,
            externalUid: params.externalUid as string | undefined,
            geo: params.geo as string | undefined,
            startDate: dateRange[0],
            endDate: dateRange[1],
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 50,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
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
    </PageContainer>
  );
};

export default DailyPage;
