import React, { useState, useEffect } from 'react';
import { InfoCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Segmented, Tooltip, Skeleton } from 'antd';
import { useDashboard } from '../DashboardContext';
import { getTrafficRanking } from '@/services/traffic-platform/api';

const TrafficRankingCard: React.FC = () => {
  const { filters, setFilters } = useDashboard();
  const [rankBy, setRankBy] = useState<'account' | 'geo'>('account');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getTrafficRanking({
          platformCode: filters.platformCode,
          startDate: filters.dateRange[0].format('YYYY-MM-DD'),
          endDate: filters.dateRange[1].format('YYYY-MM-DD'),
          rankBy,
          limit: 5,
        });
        const payload = Array.isArray(res.data) ? res.data : ((res.data as any)?.data || []);
        setData(payload.map((item: any, index: number) => {
          let name = '-';
          let key = '';
          if (rankBy === 'account') {
            name = item.accountName || item.platformCode || item.platformAccountId || '-';
            key = String(item.platformAccountId);
          } else {
            name = item.region || item.geo || '-';
            key = item.geo;
          }
          return {
            rank: index + 1,
            key,
            name,
            trafficGb: Number((item.trafficMb ? item.trafficMb / 1024 : item.trafficGb || 0).toFixed(2)),
          };
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, rankBy]);

  const maxGb = data.length > 0 ? Math.max(...data.map(d => d.trafficGb)) : 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyOutlined style={{ color: '#FBBF24', fontSize: '18px' }} />; // Gold
    if (rank === 2) return <TrophyOutlined style={{ color: '#9CA3AF', fontSize: '18px' }} />; // Silver
    if (rank === 3) return <TrophyOutlined style={{ color: '#F97316', fontSize: '18px' }} />; // Bronze
    return <span style={{ width: '18px', textAlign: 'center', fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>{rank}</span>;
  };

  const getBarColor = (rank: number) => {
    if (rank === 1) return '#2563EB';
    if (rank === 2) return '#3B82F6';
    if (rank === 3) return '#06B6D4';
    if (rank === 4) return '#8B5CF6';
    return '#F97316';
  };

  const handleItemClick = (item: any) => {
    if (rankBy === 'account') {
      setFilters(f => ({ ...f, accountId: Number(item.key) }));
    } else if (rankBy === 'geo') {
      setFilters(f => ({ ...f, geo: item.key }));
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      padding: '24px',
      height: '100%',
      minHeight: '360px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>流量排行</span>
          <Tooltip title="点击排行项可自动筛选下方数据明细">
            <InfoCircleOutlined style={{ color: '#9CA3AF' }} />
          </Tooltip>
        </div>
        <Segmented
          options={[
            { label: '按账号', value: 'account' },
            { label: '按地区', value: 'geo' },
          ]}
          value={rankBy}
          onChange={(v) => setRankBy(v as any)}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton loading={loading} active paragraph={{ rows: 5 }}>
          {data.length > 0 ? data.map((item) => (
            <div
              key={item.name + item.rank}
              onClick={() => handleItemClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                {getRankIcon(item.rank)}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#E5E7EB', width: '100%' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: getBarColor(item.rank),
                    width: `${Math.max(2, (item.trafficGb / maxGb) * 100)}%`,
                  }} />
                </div>
              </div>
              <div style={{ width: '80px', textAlign: 'right', fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                {item.trafficGb.toFixed(2)} GB
              </div>
            </div>
          )) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              暂无排行数据
            </div>
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default TrafficRankingCard;
