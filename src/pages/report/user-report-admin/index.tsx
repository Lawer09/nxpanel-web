import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import { Button, Modal, Tabs } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import UserReportNodeFailTab from './tabs/UserReportNodeFailTab';
import UserReportNodeSummaryTab from './tabs/UserReportNodeSummaryTab';
import UserReportRealtimeTab from './tabs/UserReportRealtimeTab';
import UserReportSummaryTab from './tabs/UserReportSummaryTab';
import UserReportTrafficTab from './tabs/UserReportTrafficTab';

type UserReportTabKey = 'summary' | 'node-summary' | 'traffic' | 'node-fail';

const isUserReportTabKey = (value: string | null): value is UserReportTabKey =>
  value === 'summary' || value === 'node-summary' || value === 'traffic' || value === 'node-fail';

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

  const [realtimeModalOpen, setRealtimeModalOpen] = useState(false);
  const openRealtimeModal = useCallback(() => setRealtimeModalOpen(true), []);
  const closeRealtimeModal = useCallback(() => setRealtimeModalOpen(false), []);

  return (
    <PageContainer
      extra={
        <Button onClick={openRealtimeModal}>实时日志</Button>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const next = key as UserReportTabKey;
          setActiveTab(next);
          history.replace(`${location.pathname}?tab=${next}`);
        }}
        items={[
          { key: 'summary', label: '汇总查询', children: <UserReportSummaryTab /> },
          { key: 'node-summary', label: '节点汇总', children: <UserReportNodeSummaryTab /> },
          { key: 'traffic', label: '用户汇总', children: <UserReportTrafficTab /> },
          { key: 'node-fail', label: '节点失败查询', children: <UserReportNodeFailTab /> },
        ]}
      />
      <Modal
        title="实时日志"
        open={realtimeModalOpen}
        onCancel={closeRealtimeModal}
        width={800}
        footer={null}
        destroyOnClose
        bodyStyle={{ maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}
      >
        <UserReportRealtimeTab />
      </Modal>
    </PageContainer>
  );
};

export default UserReportAdminPage;
