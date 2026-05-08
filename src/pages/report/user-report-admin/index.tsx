import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import UserReportNodeFailTab from './tabs/UserReportNodeFailTab';
import UserReportRealtimeTab from './tabs/UserReportRealtimeTab';
import UserReportNodeSummaryTab from './tabs/UserReportNodeSummaryTab';
import UserReportSummaryTab from './tabs/UserReportSummaryTab';
import UserReportTrafficTab from './tabs/UserReportTrafficTab';

type UserReportTabKey = 'realtime' | 'summary' | 'node-summary' | 'traffic' | 'node-fail';

const isUserReportTabKey = (value: string | null): value is UserReportTabKey =>
  value === 'realtime' || value === 'summary' || value === 'node-summary' || value === 'traffic' || value === 'node-fail';

const UserReportAdminPage: React.FC = () => {
  const location = useLocation();

  const tabFromUrl = useMemo<UserReportTabKey>(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return isUserReportTabKey(tab) ? tab : 'summary';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<UserReportTabKey>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as UserReportTabKey;
          setActiveTab(next);
          history.replace(`${location.pathname}?tab=${next}`);
        }}
        items={[
          { key: 'realtime', label: '实时数据', children: <UserReportRealtimeTab /> },
          { key: 'summary', label: '汇总查询', children: <UserReportSummaryTab /> },
          { key: 'node-summary', label: '节点汇总查询', children: <UserReportNodeSummaryTab /> },
          { key: 'traffic', label: '用户流量查询', children: <UserReportTrafficTab /> },
          { key: 'node-fail', label: '节点失败查询', children: <UserReportNodeFailTab /> },
        ]}
      />
    </PageContainer>
  );
};

export default UserReportAdminPage;
