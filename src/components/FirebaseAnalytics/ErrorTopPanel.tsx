import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tabs } from 'antd';
import { Pie } from '@ant-design/charts';
import { getErrorTop } from '@/services/firebase-analytics/api';
import type { ErrorTopItem, FirebaseAnalyticsFilter } from '@/services/firebase-analytics/types';
import { formatRate } from '@/utils/firebase-analytics';

export interface ErrorTopPanelProps {
  filters: FirebaseAnalyticsFilter;
}

const ErrorTopPanel: React.FC<ErrorTopPanelProps> = ({ filters }) => {
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState('vpn_session');
  const [data, setData] = useState<{ list: ErrorTopItem[], total: number }>({ list: [], total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getErrorTop({ ...filters, error_type: errorType });
        if (res.data) setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, errorType]);

  const columns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60 },
    { title: '错误阶段', dataIndex: 'error_stage', key: 'error_stage' },
    { title: '错误码', dataIndex: 'error_code', key: 'error_code', ellipsis: true },
    { title: '次数', dataIndex: 'count', key: 'count', align: 'right' as const },
    { 
      title: '占比', 
      dataIndex: 'ratio', 
      key: 'ratio', 
      align: 'right' as const,
      render: (val: number) => formatRate(val)
    },
    { title: '影响设备数', dataIndex: 'affected_devices', key: 'affected_devices', align: 'right' as const },
  ];

  const pieData = data.list ? data.list.map(item => ({
    type: item.error_code || item.error_stage || 'Unknown',
    value: item.count,
  })) : [];

  const pieConfig = {
    appendPadding: 10,
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.64,
    label: {
      type: 'inner',
      offset: '-50%',
      content: '{percentage}',
      style: { textAlign: 'center' as const, fontSize: 12 },
    },
    statistic: {
      title: false as const,
      content: {
        style: { whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '20px' },
        content: `总数\n${data.total}`,
      },
    },
    legend: { position: 'right' as const },
  };

  return (
    <Card 
      title="错误 Top 排行"
      variant="borderless" 
      style={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', height: '100%' }}
    >
      <Tabs 
        activeKey={errorType} 
        onChange={setErrorType}
        items={[
          { key: 'vpn_session', label: 'VPN 错误' },
          { key: 'vpn_probe', label: '测速错误' },
          { key: 'server_api', label: 'API 错误' },
        ]}
      />
      <div style={{ height: 260, marginBottom: 16 }}>
        {pieData.length > 0 ? (
          <Pie {...pieConfig} />
        ) : (
          <div style={{textAlign: 'center', paddingTop: 100, color: '#9ca3af'}}>暂无数据</div>
        )}
      </div>
      <Table 
        size="small"
        dataSource={data.list} 
        columns={columns} 
        loading={loading}
        rowKey={(record) => `${record.error_stage}_${record.error_code}`}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default ErrorTopPanel;
