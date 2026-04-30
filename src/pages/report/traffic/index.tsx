import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import AppTrafficPage from '../app-traffic';
import ServerStatPage from '../server-stat';
import UserStatPage from '../user-stat';

type TrafficTabKey = 'user' | 'server' | 'app';

const isTrafficTabKey = (v: string | null): v is TrafficTabKey =>
  v === 'user' || v === 'server' || v === 'app';

const TrafficReportPage: React.FC = () => {
  const location = useLocation();

  const tabFromUrl = useMemo<TrafficTabKey>(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return isTrafficTabKey(tab) ? tab : 'user';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<TrafficTabKey>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as TrafficTabKey;
          setActiveTab(next);
          history.replace(`${location.pathname}?tab=${next}`);
        }}
        items={[
          { key: 'user', label: '用户流量', children: <UserStatPage embedded /> },
          { key: 'server', label: '节点流量', children: <ServerStatPage embedded /> },
          { key: 'app', label: 'App 流量', children: <AppTrafficPage embedded /> },
        ]}
      />
    </PageContainer>
  );
};

export default TrafficReportPage;
