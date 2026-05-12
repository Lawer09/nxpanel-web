import { PageContainer } from '@ant-design/pro-components';
import { Button, Modal, Tabs } from 'antd';
import React, { useCallback, useState } from 'react';
import NodeReportRealtimeTab from './tabs/NodeReportRealtimeTab';
import NodeServerReportNodeTab from './tabs/NodeServerReportNodeTab';
import NodeServerReportUserTab from './tabs/NodeServerReportUserTab';

type NodeReportTabKey = 'server-node' | 'server-user';

const NodeReportAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NodeReportTabKey>('server-node');

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
        onChange={(key) => setActiveTab(key as NodeReportTabKey)}
        items={[
          { key: 'server-node', label: '节点汇总', children: <NodeServerReportNodeTab /> },
          { key: 'server-user', label: '用户汇总', children: <NodeServerReportUserTab /> },
        ]}
      />
      <Modal
        title="实时日志"
        open={realtimeModalOpen}
        onCancel={closeRealtimeModal}
        width={800}
        footer={null}
        destroyOnHidden
        styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflow: 'auto' } }}
      >
        <NodeReportRealtimeTab />
      </Modal>
    </PageContainer>
  );
};

export default NodeReportAdminPage;
