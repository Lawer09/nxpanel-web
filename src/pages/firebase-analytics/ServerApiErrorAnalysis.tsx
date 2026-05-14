import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Empty } from 'antd';

const ServerApiErrorAnalysis: React.FC = () => {
  return (
    <PageContainer title="API 错误分析">
      <Empty description="建设中..." />
    </PageContainer>
  );
};

export default ServerApiErrorAnalysis;
