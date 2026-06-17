import { Descriptions, Modal, Typography } from 'antd';
import React from 'react';
import JsonBlock from './JsonBlock';

const { Paragraph } = Typography;

const NodeUserClientConfigModal: React.FC<{
  open: boolean;
  loading?: boolean;
  value?: API.ControlNodeUserClientConfig | null;
  onOpenChange: (open: boolean) => void;
}> = ({ open, loading, value, onOpenChange }) => (
  <Modal
    title="Client Config"
    open={open}
    width={900}
    destroyOnHidden
    onCancel={() => onOpenChange(false)}
    footer={null}
  >
    {value ? (
      <>
        <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Node ID">{value.node_id}</Descriptions.Item>
          <Descriptions.Item label="User ID">{value.user_id}</Descriptions.Item>
          <Descriptions.Item label="Type">{value.type}</Descriptions.Item>
          <Descriptions.Item label="Name">{value.name || '-'}</Descriptions.Item>
        </Descriptions>
        <Paragraph
          copyable={value.uri ? { text: value.uri } : false}
          code
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 16 }}
        >
          {value.uri || '-'}
        </Paragraph>
        <JsonBlock title="client" value={value.client} />
      </>
    ) : (
      <Typography.Text type="secondary">
        {loading ? 'Loading...' : 'No client config.'}
      </Typography.Text>
    )}
  </Modal>
);

export default NodeUserClientConfigModal;
