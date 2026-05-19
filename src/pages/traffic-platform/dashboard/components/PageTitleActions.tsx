import React from 'react';
import { Button, Space } from 'antd';
import { SyncOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDashboard } from '../DashboardContext';

const PageTitleActions: React.FC = () => {
  const { setManualSyncOpen, reloadKpi } = useDashboard();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>流量平台统计</div>
        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>多平台流量数据监控与分析</div>
      </div>
      <Space size={12}>
        <Button icon={<ReloadOutlined />} onClick={reloadKpi} style={{ height: '36px' }}>刷新</Button>
        <Button type="primary" icon={<SyncOutlined />} onClick={() => setManualSyncOpen(true)} style={{ height: '36px', backgroundColor: '#2563EB' }}>手动同步</Button>
      </Space>
    </div>
  );
};

export default PageTitleActions;
