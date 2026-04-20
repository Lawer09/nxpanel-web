import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { DatePicker, InputNumber, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getUserReportDaily } from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const UserReportDailyPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [userId, setUserId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();

  const columns: ProColumns<API.UserReportDailyItem>[] = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      search: false,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 100,
      search: false,
    },
    {
      title: '总上报次数',
      dataIndex: 'total_reports',
      width: 120,
      search: false,
      sorter: (a, b) => a.total_reports - b.total_reports,
      render: (_, record) => {
        const count = record.total_reports;
        if (count >= 500) return <Tag color="error">{count}</Tag>;
        if (count >= 200) return <Tag color="warning">{count}</Tag>;
        return <Tag color="default">{count}</Tag>;
      },
    },
    {
      title: '最大节点数',
      dataIndex: 'max_nodes',
      width: 110,
      search: false,
      sorter: (a, b) => a.max_nodes - b.max_nodes,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      width: 130,
      search: false,
      render: (_, record) => record.platform ? <Tag>{record.platform}</Tag> : '-',
    },
    {
      title: 'App 包名',
      dataIndex: 'app_id',
      width: 200,
      search: false,
      ellipsis: true,
      render: (_, record) => record.app_id || '-',
    },
    {
      title: 'App 版本',
      dataIndex: 'app_version',
      width: 110,
      search: false,
      render: (_, record) => record.app_version || '-',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserReportDailyItem>
        headerTitle="用户上报次数汇总（按天）"
        actionRef={actionRef}
        rowKey={(record) => `${record.date}_${record.user_id}`}
        search={false}
        toolbar={{
          filter: (
            <Space wrap>
              <InputNumber
                placeholder="用户ID"
                value={userId}
                onChange={(v) => {
                  setUserId(v ?? undefined);
                  actionRef.current?.reload();
                }}
                style={{ width: 120 }}
                min={1}
              />
              <RangePicker
                value={
                  dateRange
                    ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                    : undefined
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                  } else {
                    setDateRange(undefined);
                  }
                  actionRef.current?.reload();
                }}
              />
            </Space>
          ),
        }}
        request={async (params) => {
          const { current, pageSize } = params;
          const res = await getUserReportDaily({
            user_id: userId,
            date_from: dateRange?.[0],
            date_to: dateRange?.[1],
            page: current,
            page_size: pageSize,
          });
          const payload = (res as any)?.data ?? res;
          return {
            data: payload?.data || [],
            total: payload?.total || 0,
            success: true,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 50, showSizeChanger: true }}
      />
    </PageContainer>
  );
};

export default UserReportDailyPage;
