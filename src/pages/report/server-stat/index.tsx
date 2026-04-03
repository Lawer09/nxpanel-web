import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import {
  Card,
  DatePicker,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  getTrafficRank,
  getServerTrafficRank,
  getServerLastRank,
  getServerYesterdayRank,
} from '@/services/stat/api';
import ServerStatDetail from './components/ServerStatDetail';
import ServerTrafficChart from './components/ServerTrafficChart';

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

const ServerStatPage: React.FC = () => {
  const now = dayjs();

  // Top10 时间范围
  const [top10Range, setTop10Range] = useState<[number, number]>([
    now.subtract(7, 'day').unix(),
    now.unix(),
  ]);

  // Top20 时间范围
  const [rankRange, setRankRange] = useState<[number, number]>([
    now.subtract(30, 'day').unix(),
    now.unix(),
  ]);

  // 节点流量 Top10
  const { data: top10Res, loading: top10Loading } = useRequest(
    () => getTrafficRank({ type: 'node', start_time: top10Range[0], end_time: top10Range[1] }),
    { refreshDeps: [top10Range] },
  );

  // 节点流量排行 Top20
  const { data: rankRes, loading: rankLoading } = useRequest(
    () =>
      getServerTrafficRank({
        type: 'server_traffic_rank',
        start_time: rankRange[0],
        end_time: rankRange[1],
        limit: 20,
      }),
    { refreshDeps: [rankRange] },
  );

  // 节点流量详情
  // 实时 / 昨日
  const { data: lastRes, loading: lastLoading } = useRequest(getServerLastRank);
  const { data: yesterdayRes, loading: yesterdayLoading } = useRequest(getServerYesterdayRank);

  const top10List = ((top10Res as any)?.data ?? top10Res)?.list || [];
  const rankList = ((rankRes as any)?.data ?? rankRes)?.list || [];
  const lastList = ((lastRes as any)?.data ?? lastRes)?.list || [];
  const yesterdayList = ((yesterdayRes as any)?.data ?? yesterdayRes)?.list || [];
  // 从实时列表提取节点选项
  const serverOptions = [
    { label: '全部节点', value: undefined },
    ...lastList.map((s: API.ServerRankItem) => ({ label: s.server_name, value: s.server_id })),
  ];

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
    { title: '节点名称', dataIndex: 'name', key: 'name', ellipsis: true },
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
    {
      title: '节点ID',
      dataIndex: 'server_id',
      key: 'server_id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'server_type',
      key: 'server_type',
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
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
      sorter: (a: API.ServerTrafficRankItem, b: API.ServerTrafficRankItem) => a.total - b.total,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const serverColumns = [
    { title: '节点名称', dataIndex: 'server_name', key: 'server_name', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'server_type',
      key: 'server_type',
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '上传',
      dataIndex: 'u',
      key: 'u',
      width: 120,
      render: (v: number) => formatBytes(v),
    },
    {
      title: '下载',
      dataIndex: 'd',
      key: 'd',
      width: 120,
      render: (v: number) => formatBytes(v),
    },
    {
      title: '总流量',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      render: (v: number) => <Text strong>{formatBytes(v)}</Text>,
      sorter: (a: API.ServerRankItem, b: API.ServerRankItem) => a.total - b.total,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <PageContainer>
      {/* 节点流量 Top10 */}
      <Card
        title="节点流量 Top10（环比）"
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

      {/* 节点流量排行 Top20 */}
      <Card
        title="节点流量排行 Top20"
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
          rowKey="server_id"
          columns={rankColumns}
          dataSource={rankList.map((item: API.ServerTrafficRankItem, idx: number) => ({ ...item, key: idx }))}
          bordered
        />
      </Card>

      {/* 节点流量趋势图 */}
      <ServerTrafficChart serverOptions={serverOptions} />

      {/* 节点流量详情 */}
      <ServerStatDetail serverOptions={serverOptions} />

      {/* 实时 & 昨日 节点排行 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Card
          title="实时节点流量排行"
          loading={lastLoading}
          style={{ flex: 1, minWidth: 320 }}
        >
          <Table
            size="small"
            rowKey="server_id"
            columns={serverColumns}
            dataSource={lastList.map((item: API.ServerRankItem, idx: number) => ({ ...item, key: idx }))}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Card>

        <Card
          title="昨日节点流量排行"
          loading={yesterdayLoading}
          style={{ flex: 1, minWidth: 320 }}
        >
          <Table
            size="small"
            rowKey="server_id"
            columns={serverColumns}
            dataSource={yesterdayList.map((item: API.ServerRankItem, idx: number) => ({ ...item, key: idx }))}
            pagination={{ pageSize: 10 }}
            bordered
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default ServerStatPage;
