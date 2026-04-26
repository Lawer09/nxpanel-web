import { Line } from '@ant-design/charts';
import { SettingOutlined } from '@ant-design/icons';
import { Card, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { getServerHistory } from '@/services/server/api';

const { Text } = Typography;

interface NodeHistoryTabProps {
  active: boolean;
  nodeOptions?: { label: string; value: number }[];
  onOpenSettings?: () => void;
}

const last = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];

const fmtBandwidth = (bytesPerSec: number) => {
  const bps = bytesPerSec * 8;
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(1)} Kbps`;
  return `${bps.toFixed(0)} bps`;
};

const NodeHistoryTab: React.FC<NodeHistoryTabProps> = ({ active, nodeOptions, onOpenSettings }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.ServerNodeHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nodeId, setNodeId] = useState<number | undefined>();
  const [internalNodeOptions, setInternalNodeOptions] = useState<{ label: string; value: number }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getServerHistory({ id: nodeId, page, pageSize });
      if (res.code === 0 && res.data) {
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
        // 没有外部传入 nodeOptions 时，从返回数据中提取节点列表
        if (!nodeOptions) {
          setInternalNodeOptions((prev) => {
            const map = new Map(prev.map((o) => [o.value, o]));
            for (const item of res.data.data ?? []) {
              if (!map.has(item.server_id)) {
                map.set(item.server_id, {
                  label: `${item.server_name} (${item.server_id})`,
                  value: item.server_id,
                });
              }
            }
            return Array.from(map.values());
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!active) return;
    loadData();
    const timer = setInterval(loadData, 60 * 1000);
    return () => clearInterval(timer);
  }, [active, nodeId, page, pageSize]);

  const miniLine = (
    items: { time: string; value: number }[],
    yMin = 0,
    yMax?: number,
  ) => {
    if (!items.length) return <Text type="secondary">-</Text>;
    const maxVal = yMax ?? Math.max(...items.map((i) => i.value), 1);
    return (
      <Line
        data={items}
        xField="time"
        yField="value"
        height={48}
        autoFit
        smooth
        tooltip={false}
        axis={{
          x: false,
          y: { label: false, min: yMin, max: maxVal * 1.1 },
        }}
        style={{ lineWidth: 1.5 }}
      />
    );
  };

  return (
    <Card
      title="节点状态"
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        onOpenSettings && (
          <Tooltip title="节点调度配置">
            <SettingOutlined
              style={{ fontSize: 16, cursor: 'pointer' }}
              onClick={onOpenSettings}
            />
          </Tooltip>
        )
      }
    >
      {nodeOptions && (
        <Space style={{ marginBottom: 12 }} wrap>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="选择节点"
            style={{ width: 240 }}
            value={nodeId}
            onChange={(v) => {
              setNodeId(v as number | undefined);
              setPage(1);
            }}
            options={nodeOptions}
          />
        </Space>
      )}

      <Table<API.ServerNodeHistoryItem>
        rowKey={(r) => `${r.server_id}`}
        dataSource={data}
        loading={loading}
        size="small"
        bordered
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: '节点',
            dataIndex: 'server_name',
            width: 150,
            fixed: 'left',
            render: (v, r) => (
              <Space>
                <Tag>{r.server_type}</Tag>
                <span>{v}</span>
              </Space>
            ),
          },
          {
            title: 'CPU',
            width: 130,
            render: (_, r) => {
              const items = (r.load_status_history || []).map((i) => ({
                time: dayjs.unix(i.updated_at).format('HH:mm'),
                value: i.cpu,
              }));
              const latest = last(r.load_status_history || []);
              return (
                <div>
                  <Text style={{ fontSize: 11 }}>{latest ? `${latest.cpu.toFixed(1)}%` : '-'}</Text>
                  {miniLine(items, 0, 100)}
                </div>
              );
            },
          },
          {
            title: '内存',
            width: 130,
            render: (_, r) => {
              const items = (r.load_status_history || []).map((i) => ({
                time: dayjs.unix(i.updated_at).format('HH:mm'),
                value: i.mem?.total ? (i.mem.used / i.mem.total) * 100 : 0,
              }));
              const latest = last(r.load_status_history || []);
              const pct = latest?.mem?.total ? ((latest.mem.used / latest.mem.total) * 100).toFixed(1) : '-';
              return (
                <div>
                  <Text style={{ fontSize: 11 }}>{pct}%</Text>
                  {miniLine(items, 0, 100)}
                </div>
              );
            },
          },
        //   {
        //     title: '活跃连接',
        //     width: 130,
        //     render: (_, r) => {
        //       const items = (r.online_conn_history || []).map((i) => ({
        //         time: dayjs.unix(i.updated_at).format('HH:mm'),
        //         value: i.active_connections,
        //       }));
        //       const latest = last(r.online_conn_history || []);
        //       return (
        //         <div>
        //           <Text style={{ fontSize: 11 }}>{latest?.active_connections ?? '-'}</Text>
        //           {miniLine(items)}
        //         </div>
        //       );
        //     },
        //   },
          {
            title: 'TCP',
            width: 130,
            render: (_, r) => {
              const items = (r.online_conn_history || []).map((i) => ({
                time: dayjs.unix(i.updated_at).format('HH:mm'),
                value: i.tcp_connections,
              }));
              const latest = last(r.online_conn_history || []);
              return (
                <div>
                  <Text style={{ fontSize: 11 }}>{latest?.tcp_connections ?? '-'}</Text>
                  {miniLine(items)}
                </div>
              );
            },
          },
          {
            title: '入站',
            width: 130,
            render: (_, r) => {
              const items = (r.metrics_history || []).map((i) => ({
                time: dayjs.unix(i.updated_at).format('HH:mm'),
                value: i.inbound_speed,
              }));
              const latest = last(r.metrics_history || []);
              return (
                <div>
                  <Text style={{ fontSize: 11 }}>{latest ? fmtBandwidth(latest.inbound_speed) : '-'}</Text>
                  {miniLine(items)}
                </div>
              );
            },
          },
          {
            title: '出站',
            width: 130,
            render: (_, r) => {
              const items = (r.metrics_history || []).map((i) => ({
                time: dayjs.unix(i.updated_at).format('HH:mm'),
                value: i.outbound_speed,
              }));
              const latest = last(r.metrics_history || []);
              return (
                <div>
                  <Text style={{ fontSize: 11 }}>{latest ? fmtBandwidth(latest.outbound_speed) : '-'}</Text>
                  {miniLine(items)}
                </div>
              );
            },
          },
        ]}
      />
    </Card>
  );
};

export default NodeHistoryTab;
