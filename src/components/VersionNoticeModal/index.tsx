import { Modal, Tag, Typography, Divider, Space, Button } from 'antd';
import {
  RocketOutlined,
  BulbOutlined,
  ToolOutlined,
  BugOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { getLatestVersion } from '@/services/version/api';

const { Title, Text, Paragraph } = Typography;

const STORAGE_KEY = 'nxpanel_last_seen_version';

const VersionNoticeModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState<API.VersionItem | null>(null);

  useEffect(() => {
    checkLatestVersion();
  }, []);

  const checkLatestVersion = async () => {
    try {
      const res = await getLatestVersion();
      const data = (res as any)?.data ?? res;
      if (!data || (res as any)?.code !== 0) return;

      const lastSeen = localStorage.getItem(STORAGE_KEY);
      if (lastSeen !== data.version) {
        setVersion(data);
        setOpen(true);
      }
    } catch {
      // silently ignore
    }
  };

  const handleClose = () => {
    if (version) {
      localStorage.setItem(STORAGE_KEY, version.version);
    }
    setOpen(false);
  };

  if (!version) return null;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={
        <Button type="primary" onClick={handleClose} block>
          我知道了
        </Button>
      }
      width={520}
      centered
      closable
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <RocketOutlined style={{ fontSize: 40, color: '#1890ff' }} />
        <Title level={4} style={{ marginTop: 8, marginBottom: 4 }}>
          {version.title}
        </Title>
        <Space>
          <Tag color="blue">v{version.version}</Tag>
          <Text type="secondary">{version.release_date}</Text>
        </Space>
      </div>

      {version.description && (
        <Paragraph type="secondary" style={{ textAlign: 'center' }}>
          {version.description}
        </Paragraph>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {version.features && version.features.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Space style={{ marginBottom: 6 }}>
            <BulbOutlined style={{ color: '#52c41a' }} />
            <Text strong>新功能</Text>
          </Space>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {version.features.map((f, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <Text>{f}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {version.improvements && version.improvements.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Space style={{ marginBottom: 6 }}>
            <ToolOutlined style={{ color: '#1890ff' }} />
            <Text strong>优化改进</Text>
          </Space>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {version.improvements.map((f, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <Text>{f}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {version.bugfixes && version.bugfixes.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Space style={{ marginBottom: 6 }}>
            <BugOutlined style={{ color: '#faad14' }} />
            <Text strong>Bug 修复</Text>
          </Space>
          <ul style={{ margin: 0, paddingLeft: 24 }}>
            {version.bugfixes.map((f, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <Text>{f}</Text>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

export default VersionNoticeModal;
