import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { getTrafficSyncJobs } from '@/services/traffic-platform/api';
import dayjs from 'dayjs';
import { Skeleton } from 'antd';

const TodaySyncJobList: React.FC = () => {
  const { setSyncErrorData, setSyncTaskModalOpen, setSyncTaskModalFilters } = useDashboard();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const res = await getTrafficSyncJobs({
          startTime: `${todayStr} 00:00:00`,
          endTime: `${todayStr} 23:59:59`,
          page: 1,
          pageSize: 4,
        });
        const payload = res.data?.data || res.data || [];
        setData(payload.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      padding: '24px',
      height: '100%',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>同步任务（今日）</span>
        <a 
          onClick={() => {
            setSyncTaskModalFilters({});
            setSyncTaskModalOpen(true);
          }} 
          style={{ fontSize: '13px', color: '#2563EB' }}
        >
          查看全部 &gt;
        </a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
          {data.length > 0 ? data.map((item) => {
            let color = '#2563EB';
            let bg = '#EFF6FF';
            let label = '运行中';
            if (item.status === 'success') { color = '#10B981'; bg = '#ECFDF5'; label = '成功'; }
            else if (item.status === 'failed') { color = '#EF4444'; bg = '#FEF2F2'; label = '失败'; }

            return (
              <div
                key={item.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                onClick={() => {
                  if (item.status === 'failed') {
                    setSyncErrorData(item);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>任务ID：{item.id}</span>
                  <span style={{ color, backgroundColor: bg, padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{label}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                  {item.platformCode} / {item.accountName || item.platformAccountId}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF' }}>
                  <span>{dayjs(item.startTime).format('MM-DD')} ~ {dayjs(item.endTime).format('MM-DD')}</span>
                  <span>{dayjs(item.createdAt).format('HH:mm:ss')}</span>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>今日暂无同步任务</div>
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default TodaySyncJobList;
