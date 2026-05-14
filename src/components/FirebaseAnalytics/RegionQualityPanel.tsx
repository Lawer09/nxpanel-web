import React, { useState, useEffect } from 'react';
import { Card, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { RegionQualityItem } from '@/services/firebase-analytics/types';
import { formatRate } from '@/utils/firebase-analytics';

export interface RegionQualityPanelProps {
  data: RegionQualityItem[];
  loading: boolean;
}

const RegionQualityPanel: React.FC<RegionQualityPanelProps> = ({ data, loading }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // 异步加载世界地图 geoJson 数据
    fetch('https://unpkg.com/echarts@4.9.0/map/json/world.json')
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('world', geoJson);
        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load world map data', err);
      });
  }, []);

  const columns = [
    { title: '国家/地区', dataIndex: 'user_country', key: 'user_country' },
    { title: '事件数', dataIndex: 'event_count', key: 'event_count', align: 'right' as const },
    { 
      title: 'VPN 成功率', 
      dataIndex: 'vpn_success_rate', 
      key: 'vpn_success_rate',
      align: 'right' as const,
      render: (val: number) => formatRate(val)
    },
    { title: 'API 错误数', dataIndex: 'api_error_count', key: 'api_error_count', align: 'right' as const },
    { title: '平均连接耗时', dataIndex: 'avg_connect_ms', key: 'avg_connect_ms', align: 'right' as const, render: (val: number) => val != null ? `${val}ms` : '-' },
  ];

  const maxEventCount = data && data.length > 0 ? Math.max(...data.map(d => d.event_count || 0)) : 100;

  const mapOption = {
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        const item = params.data;
        if (!item) return params.name;
        return `
          <div style="font-weight:bold;margin-bottom:4px;">${params.name}</div>
          事件数: ${item.event_count || 0}<br/>
          VPN 成功率: ${formatRate(item.vpn_success_rate)}<br/>
          API 错误数: ${item.api_error_count || 0}<br/>
          平均连接耗时: ${item.avg_connect_ms != null ? item.avg_connect_ms + 'ms' : '-'}
        `;
      }
    },
    visualMap: {
      min: 0,
      max: maxEventCount,
      text: ['High', 'Low'],
      realtime: false,
      calculable: true,
      inRange: {
        color: ['#e0f2fe', '#2563eb']
      },
      itemHeight: 80,
      itemWidth: 12,
      textStyle: { fontSize: 10 }
    },
    series: [
      {
        name: 'World Map',
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 4 },
        itemStyle: {
          areaColor: '#f3f4f6',
          borderColor: '#d1d5db',
        },
        emphasis: {
          itemStyle: {
            areaColor: '#fbbf24'
          }
        },
        data: data.map(item => ({
          name: item.user_country, // 注意后端返回的国家名称最好与地图 geoJSON 中的英文名或 ISO code 对应，如果不对应可能无法染色
          value: item.event_count,
          ...item
        }))
      }
    ]
  };

  return (
    <Card title="地区质量分布" variant="borderless" style={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)', height: '100%' }}>
      <div style={{ height: 320, marginBottom: 16 }}>
        {mapLoaded ? (
          <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 8, color: '#6b7280' }}>
            正在加载地图资源...
          </div>
        )}
      </div>
      <Table 
        size="small"
        dataSource={data} 
        columns={columns} 
        loading={loading}
        rowKey={(record) => record.user_country || record.user_region || Math.random().toString()}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default RegionQualityPanel;
