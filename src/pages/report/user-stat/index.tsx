import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  DatePicker,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  getTrafficRank,
  getUserConsumptionRank,
  getStatUser,
} from '@/services/stat/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

const ChangeTag: React.FC<{ value?: number }> = ({ value }) => {
  if (value === undefined || value === null) return <Tag>-</Tag>;
  if (value > 0)
    return (
      <Tag icon={<ArrowUpOutlined />} color="success">
        +{value.toFixed(1)}%
      </Tag>
    );
  if (value < 0)
    return (
      <Tag icon={<ArrowDownOutlined />} color="error">
        {value.toFixed(1)}%
      </Tag>
    );
  return <Tag color="default">0%</Tag>;
};

type UserStatPageProps = {
  embedded?: boolean;
};

const UserStatPage: React.FC<UserStatPageProps> = ({ embedded }) => {
  const actionRef = useRef<ActionType | null>(null);

  // 用户每日流量明细过滤
  const [detailUserId, setDetailUserId] = useState<number | undefined>();

  // Top10 时间范围
  const now = dayjs();
  const [top10Range, setTop10Range] = useState<[number, number]>([
    now.subtract(7, 'day').unix(),
    now.unix(),
  ]);

  // Top20 消耗排行时间范围
  const [rankRange, setRankRange] = useState<[number, number]>([
    now.subtract(30, 'day').unix(),
    now.unix(),
  ]);

  // 用户流量 Top10
  const { data: top10Res, loading: top10Loading } = useRequest(
    () => getTrafficRank({ type: 'user', start_time: top10Range[0], end_time: top10Range[1] }),
    { refreshDeps: [top10Range] },
  );

  // 用户消耗排行 Top20
  const { data: rankRes, loading: rankLoading } = useRequest(
    () =>
      getUserConsumptionRank({
        type: 'user_consumption_rank',
        start_time: rankRange[0],
        end_time: rankRange[1],
        limit: 20,
      }),
    { refreshDeps: [rankRange] },
  );

  const top10List = ((top10Res as any)?.data ?? top10Res)?.list || [];
  const rankList = ((rankRes as any)?.data ?? rankRes)?.list || [];

  const top10Columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Text strong style={{ color: index < 3 ? '#faad14' : undefined }}>
          {index + 1}
        </Text>
      ),
    },
    { title: '用户', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '总流量',
      dataIndex: 'value',
      key: 'value',
      render: (v: number) => formatBytes(v),
    },
    {
      title: '上期',
      dataIndex: 'previousValue',
      key: 'previousValue',
      render: (v: number) => formatBytes(v),
    },
    {
      title: '环比',
      dataIndex: 'change',
      key: 'change',
      render: (v: number) => <ChangeTag value={v} />,
    },
  ];

  const rankColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Text strong style={{ color: index < 3 ? '#faad14' : undefined }}>
          {index + 1}
        </Text>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: '上传',
      dataIndex: 'u',
      key: 'u',
      render: (v: number) => formatBytes(v),
    },
    {
      title: '下载',
      dataIndex: 'd',
      key: 'd',
      render: (v: number) => formatBytes(v),
    },
    {
      title: '总计',
      dataIndex: 'total',
      key: 'total',
      render: (v: number) => <Text strong>{formatBytes(v)}</Text>,
      sorter: (a: API.UserConsumptionRankItem, b: API.UserConsumptionRankItem) =>
        a.total - b.total,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const detailColumns: ProColumns<API.StatUserRecord>[] = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      search: false,
      width: 90,
    },
    {
      title: '上传',
      dataIndex: 'u',
      search: false,
      render: (_, r) => formatBytes(r.u),
    },
    {
      title: '下载',
      dataIndex: 'd',
      search: false,
      render: (_, r) => formatBytes(r.d),
    },
    {
      title: '总计',
      search: false,
      render: (_, r) => <Text strong>{formatBytes(r.u + r.d)}</Text>,
    },
    {
      title: '记录时间',
      dataIndex: 'record_at',
      search: false,
      render: (_, r) => dayjs.unix(r.record_at).format('YYYY-MM-DD'),
    },
  ];

  const content = (
    <>
      {/* 用户流量 Top10 */}
      <Card
        title="用户流量 Top10（环比）"
        style={{ marginBottom: 16 }}
        loading={top10Loading}
        extra={
          <RangePicker
            size="small"
            value={[dayjs.unix(top10Range[0]), dayjs.unix(top10Range[1])]}
            onChange={(_, strings) => {
              if (strings[0] && strings[1]) {
                setTop10Range([dayjs(strings[0]).unix(), dayjs(strings[1]).unix()]);
              }
            }}
          />
        }
      >
        <Table
          size="small"
          rowKey="id"
          columns={top10Columns}
          dataSource={top10List.map((item: API.TrafficRankItem, idx: number) => ({ ...item, key: idx }))}
          bordered
        />
      </Card>

      {/* 用户消耗排行 Top20 */}
      <Card
        title="用户消耗排行 Top20"
        style={{ marginBottom: 16 }}
        loading={rankLoading}
        extra={
          <RangePicker
            size="small"
            value={[dayjs.unix(rankRange[0]), dayjs.unix(rankRange[1])]}
            onChange={(_, strings) => {
              if (strings[0] && strings[1]) {
                setRankRange([dayjs(strings[0]).unix(), dayjs(strings[1]).unix()]);
              }
            }}
          />
        }
      >
        <Table
          size="small"
          rowKey="user_id"
          columns={rankColumns}
          dataSource={rankList.map((item: API.UserConsumptionRankItem, idx: number) => ({ ...item, key: idx }))}
          bordered
        />
      </Card>

      {/* 用户每日流量明细 */}
      <Card title="用户每日流量明细">
        <Row style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <span>用户ID：</span>
              <InputNumber
                placeholder="请输入用户ID"
                value={detailUserId}
                onChange={(v) => {
                  setDetailUserId(v ?? undefined);
                  actionRef.current?.reload();
                }}
                min={1}
                style={{ width: 160 }}
              />
            </Space>
          </Col>
        </Row>

        <ProTable<API.StatUserRecord>
          actionRef={actionRef}
          rowKey={(r) => `${r.user_id}_${r.record_at}`}
          search={false}
          toolBarRender={false}
          columns={detailColumns}
          request={async (params) => {
            if (!detailUserId) {
              return { data: [], total: 0, success: true };
            }
            const res = await getStatUser({
              user_id: detailUserId,
              page: params.current,
              pageSize: params.pageSize,
            });
            return {
              data: res?.data?.data || [],
              total: res?.data?.total || 0,
              success: true,
            };
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="small"
          bordered
        />
      </Card>
    </>
  );

  if (embedded) {
    return content;
  }

  return <PageContainer>{content}</PageContainer>;
};

export default UserStatPage;
