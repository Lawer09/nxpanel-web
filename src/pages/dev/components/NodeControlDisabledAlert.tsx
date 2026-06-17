import { Alert } from 'antd';
import React from 'react';

const NodeControlDisabledAlert: React.FC = () => (
  <Alert
    type="warning"
    showIcon
    message="Node control test auth is not configured."
    description="Set REACT_APP_NODE_CONTROL_APP_ID / REACT_APP_NODE_CONTROL_APP_SECRET, or the UMI_APP_* equivalents, in your local env file before using the Dev console."
  />
);

export default NodeControlDisabledAlert;
