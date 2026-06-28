import { Descriptions, Modal, Table, Typography } from 'antd';
import React from 'react';

const { Paragraph, Text } = Typography;

const NodeUserClientConfigsModal: React.FC<{
  open: boolean;
  loading?: boolean;
  value?: API.ControlUserClientConfigsResponse | null;
  onOpenChange: (open: boolean) => void;
}> = ({ open, loading, value, onOpenChange }) => (
  <Modal
    title="User Client Configs"
    open={open}
    width={980}
    destroyOnHidden
    onCancel={() => onOpenChange(false)}
    footer={null}
  >
    {value ? (
      <>
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="User ID">{value.user_id}</Descriptions.Item>
          <Descriptions.Item label="Configs">{value.configs.length}</Descriptions.Item>
        </Descriptions>
        <Table<API.ControlNodeUserClientConfig>
          rowKey={(record) => `${record.node_id}-${record.user_id}-${record.uri}`}
          pagination={false}
          dataSource={value.configs}
          columns={[
            { title: 'Node ID', dataIndex: 'node_id', width: 90 },
            { title: 'Type', dataIndex: 'type', width: 120 },
            { title: 'Name', dataIndex: 'name', width: 180 },
            {
              title: 'Public Host',
              render: (_, record) => record.client?.public_host || '-',
            },
            {
              title: 'Public Port',
              render: (_, record) => record.client?.public_port || '-',
            },
            {
              title: 'URI',
              render: (_, record) =>
                record.uri ? (
                  <Paragraph
                    copyable={{ text: record.uri }}
                    code
                    style={{ marginBottom: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                  >
                    {record.uri}
                  </Paragraph>
                ) : (
                  '-'
                ),
            },
          ]}
        />
      </>
    ) : (
      <Text type="secondary">{loading ? 'Loading...' : 'No client configs.'}</Text>
    )}
  </Modal>
);

export default NodeUserClientConfigsModal;
