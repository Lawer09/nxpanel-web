import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Empty } from 'antd';

const EventList: React.FC = () => {
  return (
    <PageContainer title="事件明细查询">
      <Empty description="建设中..." />
    </PageContainer>
  );
};

export default EventList;
