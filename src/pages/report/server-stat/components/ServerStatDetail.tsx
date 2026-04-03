import { Card, DatePicker, Select, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useRequest } from '@umijs/max';
import { getStatServer } from '@/services/stat/api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

interface ServerStatDetailProps {
  serverOptions: { label: string; value: number | undefined }[];
}

const ServerStatDetail: React.FC<ServerStatDetailProps> = ({ serverOptions }) => {
  const now = dayjs();

  const [detailServerId, setDetailServerId] = useState<number | undefined>(undefined);
  const [detailRange, setDetailRange] = useState<[number, number]>([
    now.startOf('day').unix(),
    now.endOf('day').unix(),
  ]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(10);

  const { data: detailRes, loading: detailLoading } = useRequest(
    () =>
      getStatServer({
        server_id: detailServerId,
        start_time: detailRange[0],
        end_time: detailRange[1],
        page: detailPage,
        pageSize: detailPageSize,
      }),
    { refreshDeps: [detailServerId, detailRange, detailPage, detailPageSize] },
  );

  const detailData: API.StatServerItem[] = (detailRes as any)?.data || [];
  const detailTotal: number = (detailRes as any)?.total || 0;

  return (
    <Card
      title="节点流量详情"
      style={{ marginBottom: 16 }}
      loading={detailLoading}
      extra={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            size="small"
            style={{ width: 160 }}
            placeholder="全部节点"
            allowClear
            options={serverOptions}
            value={detailServerId}
            onChange={(v) => {
              setDetailServerId(v);
              setDetailPage(1);
            }}
          />
          <RangePicker
            size="small"
            value={[dayjs.unix(detailRange[0]), dayjs.unix(detailRange[1])]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setDetailRange([
                  dates[0].startOf('day').unix(),
                  dates[1].endOf('day').unix(),
                ]);
                setDetailPage(1);
              }
            }}
          />
        </div>
      }
    >
      <Table
        size="small"
        rowKey="id"
        columns={[
          {
            title: '记录时间',
            key: 'record_at',
            width: 170,
            render: (_: any, record: API.StatServerItem) =>
              record.record_at != null
                ? dayjs.unix(record.record_at).format('YYYY-MM-DD HH:mm:ss')
                : dayjs.unix(detailRange[0]).format('YYYY-MM-DD HH:mm:ss'),
          },
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
          },
        ]}
        dataSource={detailData}
        pagination={{
          current: detailPage,
          pageSize: detailPageSize,
          total: detailTotal,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, size) => {
            setDetailPage(page);
            setDetailPageSize(size);
          },
        }}
        bordered
      />
    </Card>
  );
};

export default ServerStatDetail;
