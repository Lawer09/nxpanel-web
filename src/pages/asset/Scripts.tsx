import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, Button } from 'antd';
import React from 'react';
import DevAuthGate from '../dev/components/DevAuthGate';
import MachineScriptsPanel from './components/panels/MachineScriptsPanel';
import { buildAssetTaskDetailPath } from './utils';

const AssetScriptsContent: React.FC = () => {
  const { notification } = App.useApp();

  return (
    <PageContainer title="Machine Scripts">
      <MachineScriptsPanel
        onTaskAck={(ack, title) => {
          const taskPath = buildAssetTaskDetailPath(ack.task_id);
          notification.success({
            message: title,
            description: `Task ID: ${ack.task_id}, status: ${ack.status || 'pending'}.`,
            actions: (
              <Button size="small" onClick={() => history.push(taskPath)}>
                View Task
              </Button>
            ),
          });
          history.push(taskPath);
        }}
      />
    </PageContainer>
  );
};

const AssetScriptsPage: React.FC = () => (
  <DevAuthGate>
    <AssetScriptsContent />
  </DevAuthGate>
);

export default AssetScriptsPage;
