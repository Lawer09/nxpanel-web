import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { DatePicker, Input, InputNumber, Select, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { getUserReportCount } from '@/services/performance/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const formatTimeSlot = (record: API.UserReportCountItem) =>
  `${record.date} ${String(record.hour).padStart(2, '0')}:${String(record.minute).padStart(2, '0')}`;

const UserReportCountPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [userId, setUserId] = useState<number | undefined>();
  const [platform, setPlatform] = useState<string | undefined>();
  const [appId, setAppId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [orderDir, setOrderDir] = useState<string | undefined>();

  const columns: ProColumns<API.UserReportCountItem>[] = [
    {
      title: '时间窗口',
      key: 'time_slot',
      width: 160,
      search: false,
      render: (_, record) => <Text>{formatTimeSlot(record)}</Text>,
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 100,
      search: false,
    },
    {
      title: '上报次数',
      dataIndex: 'report_count',
      width: 110,
      search: false,
      sorter: (a, b) => a.report_count - b.report_count,
      render: (_, record) => {
        const count = record.report_count;
        if (count >= 100) return <Tag color="error">{count}</Tag>;
        if (count >= 50) return <Tag color="warning">{count}</Tag>;
        return <Tag color="default">{count}</Tag>;
      },
    },
    {
      title: '涉及节点数',
      dataIndex: 'node_count',
      width: 110,
      search: false,
      sorter: (a, b) => a.node_count - b.node_count,
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
      <ProTable<API.UserReportCountItem>
        headerTitle="用户上报次数统计（5分钟粒度）"
        actionRef={actionRef}
        rowKey="id"
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
              <Input
                placeholder="平台 (如 Android 11)"
                value={platform}
                onChange={(e) => setPlatform(e.target.value || undefined)}
                onPressEnter={() => actionRef.current?.reload()}
                style={{ width: 180 }}
              />
              <Input
                placeholder="App 包名"
                value={appId}
                onChange={(e) => setAppId(e.target.value || undefined)}
                onPressEnter={() => actionRef.current?.reload()}
                style={{ width: 200 }}
              />
              <Select
                placeholder="排序字段"
                value={orderBy}
                onChange={(v) => {
                  setOrderBy(v);
                  actionRef.current?.reload();
                }}
                allowClear
                style={{ width: 140 }}
                options={[
                  { label: '日期', value: 'date' },
                  { label: '上报次数', value: 'report_count' },
                  { label: '用户ID', value: 'user_id' },
                ]}
              />
              <Select
                placeholder="排序方向"
                value={orderDir}
                onChange={(v) => {
                  setOrderDir(v);
                  actionRef.current?.reload();
                }}
                allowClear
                style={{ width: 120 }}
                options={[
                  { label: '降序', value: 'desc' },
                  { label: '升序', value: 'asc' },
                ]}
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
          const res = await getUserReportCount({
            user_id: userId,
            platform,
            app_id: appId,
            date_from: dateRange?.[0],
            date_to: dateRange?.[1],
            order_by: orderBy as API.UserReportCountParams['order_by'],
            order_dir: orderDir as API.UserReportCountParams['order_dir'],
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

export default UserReportCountPage;
