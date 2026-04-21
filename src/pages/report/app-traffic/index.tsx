import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  getAppTrafficAggregate,
} from '@/services/stat/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

function toNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  const num = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(num) ? num : 0;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

const TrafficTag: React.FC<{ value: number }> = ({ value }) => (
  <Tag>{formatBytes(value)}</Tag>
);

const AppTrafficPage: React.FC = () => {
  const now = dayjs();
  const [appId, setAppId] = useState<string | undefined>();
  const [appVersion, setAppVersion] = useState<string | undefined>();
  const [minTotal, setMinTotal] = useState<number | undefined>();
  const [minUserTotalMB, setMinUserTotalMB] = useState<number | undefined>();
  const [groupBy, setGroupBy] = useState<API.AppTrafficAggregateGroupBy[]>(['app_id']);
  const [appliedGroupBy, setAppliedGroupBy] = useState<API.AppTrafficAggregateGroupBy[]>([
    'app_id',
  ]);
  const [dateRange, setDateRange] = useState<[number, number]>([
    now.subtract(30, 'day').startOf('day').unix(),
    now.endOf('day').unix(),
  ]);

  const [pageAggregate, setPageAggregate] = useState(1);
  const [pageSizeAggregate, setPageSizeAggregate] = useState(15);

  const {
    data: aggregateRes,
    loading: aggregateLoading,
    run: refreshAggregate,
  } = useRequest(
    (params: API.AppTrafficAggregateParams) => getAppTrafficAggregate(params),
    {
      manual: true,
    },
  );

  const handleRefresh = () => {
    const nextGroupBy = groupBy.includes('app_id')
      ? groupBy
      : (['app_id', ...groupBy] as API.AppTrafficAggregateGroupBy[]);
    setAppliedGroupBy(nextGroupBy);
    refreshAggregate({
      group_by: nextGroupBy,
      app_id: appId,
      app_version: appVersion,
      min_total: minTotal,
      min_user_total:
        minUserTotalMB === undefined ? undefined : Math.floor(minUserTotalMB * 1024 * 1024),
      start_time: dateRange[0],
      end_time: dateRange[1],
      page: pageAggregate,
      pageSize: pageSizeAggregate,
    });
  };

  const aggregateRaw = aggregateRes as any;
  const aggregatePayload = aggregateRaw?.data ?? aggregateRaw ?? {};
  const aggregateList: API.AppTrafficAggregateItem[] = Array.isArray(aggregatePayload)
    ? aggregatePayload
    : Array.isArray(aggregatePayload?.data)
      ? aggregatePayload.data
      : Array.isArray(aggregateRaw?.data?.data)
        ? aggregateRaw.data.data
        : [];
  const aggregateTotal: number = aggregatePayload?.total ?? aggregateRaw?.data?.total ?? 0;

  const columns: ProColumns<API.AppTrafficAggregateItem>[] = [
    { title: 'App ID', dataIndex: 'app_id', key: 'app_id', ellipsis: true },
    {
      title: '版本',
      dataIndex: 'app_version',
      key: 'app_version',
      width: 140,
      render: (_, r) => (appliedGroupBy.includes('app_version') ? r.app_version || '-' : '-'),
    },
    {
      title: '上行',
      dataIndex: 'u',
      key: 'u',
      render: (_, r) => <TrafficTag value={toNumber(r.u)} />,
      sorter: (a, b) => toNumber(a.u) - toNumber(b.u),
    },
    {
      title: '下行',
      dataIndex: 'd',
      key: 'd',
      render: (_, r) => <TrafficTag value={toNumber(r.d)} />,
      sorter: (a, b) => toNumber(a.d) - toNumber(b.d),
    },
    {
      title: '总量',
      dataIndex: 'total',
      key: 'total',
      render: (_, r) => <TrafficTag value={toNumber(r.total)} />,
      sorter: (a, b) => toNumber(a.total) - toNumber(b.total),
    },
    { title: '用户数', dataIndex: 'user_count', key: 'user_count', width: 120 },
  ];

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="App 包名"
            value={appId}
            onChange={(e) => setAppId(e.target.value || undefined)}
            onPressEnter={() => {
              setPageAggregate(1);
            }}
            style={{ width: 220 }}
          />
          <Input
            placeholder="App 版本"
            value={appVersion}
            onChange={(e) => setAppVersion(e.target.value || undefined)}
            onPressEnter={() => {
              setPageAggregate(1);
            }}
            style={{ width: 160 }}
          />
          <Input
            placeholder="流量下限 (字节)"
            value={minTotal === undefined ? '' : String(minTotal)}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw ? Number(raw) : undefined;
              setMinTotal(Number.isFinite(next as number) ? (next as number) : undefined);
            }}
            onPressEnter={() => {
              setPageAggregate(1);
            }}
            style={{ width: 160 }}
          />
          <Input
            placeholder="用户最小流量 (MB)"
            value={minUserTotalMB === undefined ? '' : String(minUserTotalMB)}
            onChange={(e) => {
              const raw = e.target.value.trim();
              const next = raw ? Number(raw) : undefined;
              setMinUserTotalMB(Number.isFinite(next as number) ? (next as number) : undefined);
            }}
            onPressEnter={() => {
              setPageAggregate(1);
            }}
            style={{ width: 160 }}
          />
          <RangePicker
            value={[dayjs.unix(dateRange[0]), dayjs.unix(dateRange[1])]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDateRange([dates[0].startOf('day').unix(), dates[1].endOf('day').unix()]);
                setPageAggregate(1);
              }
            }}
          />
          <Select
            style={{ width: 220 }}
            mode="multiple"
            value={groupBy}
            options={[
              { label: '按应用', value: 'app_id' },
              { label: '按版本', value: 'app_version' },
            ]}
            onChange={(values) => {
              const next = values.includes('app_id')
                ? (values as API.AppTrafficAggregateGroupBy[])
                : (['app_id', ...values] as API.AppTrafficAggregateGroupBy[]);
              setGroupBy(next);
              setPageAggregate(1);
            }}
          />
          <Button type="primary" loading={aggregateLoading} onClick={handleRefresh}>
            刷新
          </Button>
        </Space>
      </Card>

      <ProTable<API.AppTrafficAggregateItem>
        rowKey={(r, i) => `${r.app_id}_${r.app_version || 'na'}_${i}`}
        columns={columns}
        dataSource={aggregateList}
        loading={aggregateLoading}
        search={false}
        toolBarRender={false}
        pagination={{
          current: pageAggregate,
          pageSize: pageSizeAggregate,
          total: aggregateTotal,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPageAggregate(p);
            setPageSizeAggregate(ps);
          },
        }}
      />
    </PageContainer>
  );
};

export default AppTrafficPage;
