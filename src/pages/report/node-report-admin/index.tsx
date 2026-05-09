import { PageContainer } from '@ant-design/pro-components';
import { Tabs } from 'antd';
import React, { useState } from 'react';
import NodeServerReportNodeTab from './tabs/NodeServerReportNodeTab';
import NodeServerReportUserTab from './tabs/NodeServerReportUserTab';

type NodeReportTabKey = 'server-node' | 'server-user';

const NodeReportAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NodeReportTabKey>('server-node');

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as NodeReportTabKey)}
        items={[
          { key: 'server-node', label: '节点汇总', children: <NodeServerReportNodeTab /> },
          { key: 'server-user', label: '用户汇总', children: <NodeServerReportUserTab /> },
        ]}
      />
    </PageContainer>
  );
};

export default NodeReportAdminPage;
