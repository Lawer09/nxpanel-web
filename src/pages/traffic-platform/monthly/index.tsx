import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, DatePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getTrafficMonthly } from '@/services/traffic-platform/api';

const MonthlyPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const thisMonth = dayjs().format('YYYY-MM');
  const threeMonthsAgo = dayjs().subtract(3, 'month').format('YYYY-MM');
  const [monthRange, setMonthRange] = useState<[string, string]>([threeMonthsAgo, thisMonth]);

  const columns: ProColumns<API.TrafficMonthlyItem>[] = [
    { title: '月份', dataIndex: 'statMonth', width: 100, search: false },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 130, search: false },
    { title: '子账号ID', dataIndex: 'externalUid', width: 120 },
    { title: '子账号名', dataIndex: 'externalUsername', width: 120, search: false },
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
      title: '月份范围',
      dataIndex: 'monthRange',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker.RangePicker
          picker="month"
          value={[dayjs(monthRange[0], 'YYYY-MM'), dayjs(monthRange[1], 'YYYY-MM')]}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setMonthRange([
                dates[0].format('YYYY-MM'),
                dates[1].format('YYYY-MM'),
              ]);
            }
          }}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TrafficMonthlyItem>
        rowKey={(r) => `${r.statMonth}_${r.platformAccountId}_${r.externalUid}`}
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTrafficMonthly({
            platformCode: params.platformCode as string | undefined,
            accountId: params.accountId ? Number(params.accountId) : undefined,
            externalUid: params.externalUid as string | undefined,
            startMonth: monthRange[0],
            endMonth: monthRange[1],
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
        scroll={{ x: 900 }}
      />
    </PageContainer>
  );
};

export default MonthlyPage;
