import React, { useState, useEffect } from 'react';
import { Card, Table } from 'antd';
import { getNodeQualityRank } from '@/services/firebase-analytics/api';
import type { NodeQualityRankItem, FirebaseAnalyticsFilter } from '@/services/firebase-analytics/types';
import { formatRate, formatBytes, formatDuration } from '@/utils/firebase-analytics';

export interface NodeQualityTableProps {
  filters: FirebaseAnalyticsFilter;
}

const NodeQualityTable: React.FC<NodeQualityTableProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NodeQualityRankItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getNodeQualityRank(filters);
        if (res.data?.items) setData(res.data.items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const columns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60 },
    { title: '节点 ID', dataIndex: 'node_id', key: 'node_id' },
    { title: '节点名称', dataIndex: 'node_name', key: 'node_name', ellipsis: true },
    { title: '国家/地区', dataIndex: 'node_country', key: 'node_country' },
    { title: '协议', dataIndex: 'protocol', key: 'protocol' },
    { 
      title: '连接次数', 
      dataIndex: 'session_count', 
      key: 'session_count', 
      align: 'right' as const, 
      sorter: (a: any, b: any) => a.session_count - b.session_count 
    },
    { 
      title: '成功率', 
      dataIndex: 'success_rate', 
      key: 'success_rate', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.success_rate - b.success_rate,
      render: (val: number) => {
        const color = val != null && val < 0.9 ? '#ef4444' : 'inherit';
        return <span style={{ color }}>{formatRate(val)}</span>;
      }
    },
    { 
      title: '平均连接耗时', 
      dataIndex: 'avg_connect_ms', 
      key: 'avg_connect_ms', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.avg_connect_ms - b.avg_connect_ms,
      render: (val: number) => formatDuration(val)
    },
    { 
      title: 'P95 连接耗时', 
      dataIndex: 'p95_connect_ms', 
      key: 'p95_connect_ms', 
      align: 'right' as const,
      sorter: (a: any, b: any) => a.p95_connect_ms - b.p95_connect_ms,
      render: (val: number) => {
        const color = val != null && val > 3000 ? '#ef4444' : 'inherit';
        return <span style={{ color }}>{formatDuration(val)}</span>;
      }
    },
    { 
      title: '平均使用时长', 
      dataIndex: 'avg_duration_ms', 
      key: 'avg_duration_ms', 
      align: 'right' as const, 
      render: (val: number) => formatDuration(val) 
    },
    { 
      title: '总流量', 
      dataIndex: 'total_bytes', 
      key: 'total_bytes', 
      align: 'right' as const, 
      sorter: (a: any, b: any) => a.total_bytes - b.total_bytes, 
      render: (val: number) => formatBytes(val) 
    },
    { title: '主要错误', dataIndex: 'top_error_code', key: 'top_error_code', ellipsis: true },
  ];

  return (
    <Card title="节点质量排行" variant="borderless" style={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      <Table 
        size="small"
        dataSource={data} 
        columns={columns} 
        loading={loading}
        rowKey="node_id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default NodeQualityTable;
