import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React from 'react';
import { AccountsPage } from './accounts';
import { SyncJobsPage } from './sync-jobs';
import { ReportsPage } from './reports';

const AdSpendPage: React.FC = () => {
  return (
    <PageContainer>
      <Tabs
        defaultActiveKey="accounts"
        items={[
          {
            key: 'accounts',
            label: '投放账号',
            children: <AccountsPage embedded />,
          },
          {
            key: 'sync-jobs',
            label: '同步任务',
            children: <SyncJobsPage embedded />,
          },
          {
            key: 'reports',
            label: '投放日报',
            children: <ReportsPage embedded />,
          },
        ]}
      />
    </PageContainer>
  );
};

export default AdSpendPage;
