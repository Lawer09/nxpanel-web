import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, DatePicker, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getTrafficHourly } from '@/services/traffic-platform/api';

const { RangePicker } = DatePicker;

const HourlyPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const today = dayjs().format('YYYY-MM-DD');
  const [timeRange, setTimeRange] = useState<[string, string]>([
    `${today} 00:00:00`,
    `${today} 23:59:59`,
  ]);

  const columns: ProColumns<API.TrafficHourlyItem>[] = [
    { title: '时间', dataIndex: 'statHour', width: 170, search: false },
    { title: '日期', dataIndex: 'statDate', width: 110, search: false },
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
      title: '推算',
      dataIndex: 'isEstimated',
      width: 70,
      search: false,
      render: (_, r) =>
        r.isEstimated === 1 ? <Tag color="orange">推算</Tag> : <Tag color="green">实际</Tag>,
    },
    {
      title: '统计方式',
      dataIndex: 'statMethod',
      width: 140,
      search: false,
      render: (_, r) =>
        r.statMethod === 'diff_from_day' ? (
          <Tag color="blue">天累计差值</Tag>
        ) : (
          <Tag>{r.statMethod}</Tag>
        ),
    },
    {
      title: '账号ID',
      dataIndex: 'accountId',
      hideInTable: true,
      valueType: 'digit',
    },
    {
      title: '时间范围',
      dataIndex: 'timeRange',
      hideInTable: true,
      renderFormItem: () => (
        <RangePicker
          showTime
          value={[dayjs(timeRange[0]), dayjs(timeRange[1])]}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setTimeRange([
                dates[0].format('YYYY-MM-DD HH:mm:ss'),
                dates[1].format('YYYY-MM-DD HH:mm:ss'),
              ]);
            }
          }}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TrafficHourlyItem>
        rowKey={(r) => `${r.statHour}_${r.platformAccountId}_${r.externalUid}_${r.geo}`}
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getTrafficHourly({
            platformCode: params.platformCode as string | undefined,
            accountId: params.accountId ? Number(params.accountId) : undefined,
            externalUid: params.externalUid as string | undefined,
            geo: params.geo as string | undefined,
            startTime: timeRange[0],
            endTime: timeRange[1],
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
        scroll={{ x: 1400 }}
      />
    </PageContainer>
  );
};

export default HourlyPage;
