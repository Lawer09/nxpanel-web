import { getSyncHistory, SyncHistoryRecord } from '@/services/ads-console/syncHistory';
import { Line } from '@ant-design/charts';
import { Modal, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  objectType: string;
  objectId: string;
  title?: string;
};

const STATUS_TEXT: Record<number, string> = {
  0: '同步中',
  1: '成功',
  2: '失败',
};

const STATUS_COLOR: Record<number, string> = {
  0: '#faad14',
  1: '#52c41a',
  2: '#ff4d4f',
};

const STATUS_TAG_COLOR: Record<number, string> = {
  0: 'warning',
  1: 'success',
  2: 'error',
};

type ChartPoint = {
  time: Date;
  status: number;
  statusLabel: string;
  syncMsg: string;
  rawTime: string;
};

const columns: ColumnsType<SyncHistoryRecord> = [
  {
    title: '同步时间',
    dataIndex: 'syncTime',
    key: 'syncTime',
    width: 180,
    render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '状态',
    dataIndex: 'syncStatus',
    key: 'syncStatus',
    width: 90,
    render: (v: number) => (
      <Tag color={STATUS_TAG_COLOR[v] ?? 'default'}>{STATUS_TEXT[v] ?? '-'}</Tag>
    ),
  },
  {
    title: '备注',
    dataIndex: 'syncMsg',
    key: 'syncMsg',
    render: (v: string) => v || '-',
  },
];

const SyncHistoryChart: React.FC<Props> = ({ open, onClose, objectType, objectId, title }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<SyncHistoryRecord[]>([]);
  const hours = 24;

  useEffect(() => {
    if (!open || !objectId) return;
    setLoading(true);
    getSyncHistory({ objectType, objectId, hours })
      .then((res) => setRecords(res?.data ?? []))
      .finally(() => setLoading(false));
  }, [open, objectType, objectId]);

  const chartData: ChartPoint[] = records.map((r) => ({
    time: new Date(r.syncTime),
    status: r.syncStatus,
    statusLabel: STATUS_TEXT[r.syncStatus] ?? '-',
    syncMsg: r.syncMsg ?? '',
    rawTime: dayjs(r.syncTime).format('YYYY-MM-DD HH:mm:ss'),
  }));

  const now = new Date();
  const domainStart = new Date(now.getTime() - hours * 3600 * 1000);

  return (
    <Modal
      title={title ?? `同步历史 · ${objectType}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 16 }}>
          最近 {hours} 小时同步记录（{objectId}）
        </div>
        {!loading && chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
            暂无同步记录
          </div>
        ) : (
          <>
            <Line
              data={chartData}
              xField="time"
              yField="status"
              height={260}
              autoFit
              connectNulls={false}
              slider={false}
              scrollbar={false}
              scale={{
                x: { type: 'time', domain: [domainStart, now], tickCount: 8 },
                y: { type: 'linear', domain: [-0.3, 2.3], tickCount: 3 },
              }}
              axis={{
                y: {
                  title: false,
                  tickFilter: (v: any) => [0, 1, 2].includes(Math.round(Number(v))),
                  labelFormatter: (v: any) => STATUS_TEXT[Math.round(Number(v))] ?? '',
                },
                x: {
                  title: false,
                  labelFormatter: (d: any) => dayjs(d).format('MM-DD HH:mm'),
                  labelTransform: 'rotate(-30)',
                  tickCount: 8,
                },
              }}
              point={{
                style: {
                  fill: (d: ChartPoint) => STATUS_COLOR[d.status] ?? '#8c8c8c',
                  stroke: '#fff',
                  lineWidth: 2,
                  r: 3,
                },
              }}
              line={{
                style: { stroke: '#1677ff', lineWidth: 2 },
              }}
              tooltip={{
                title: (d: ChartPoint) => d.rawTime,
                items: [
                  {
                    field: 'statusLabel',
                    name: '状态',
                    color: (d: ChartPoint) => STATUS_COLOR[d.status] ?? '#8c8c8c',
                  },
                  {
                    field: 'syncMsg',
                    name: '失败原因',
                    valueFormatter: (v: string) => v || '-',
                  },
                ],
              }}
            />
            <div style={{ display: 'flex', gap: 20, margin: '8px 0 16px', fontSize: 13 }}>
              {Object.entries(STATUS_TEXT).map(([k, label]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: STATUS_COLOR[Number(k)],
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  {label}
                </span>
              ))}
            </div>
            <Table
              dataSource={[...records].reverse()}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
              scroll={{ y: 240 }}
            />
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default SyncHistoryChart;

