import { Descriptions, Drawer, Space, Spin, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

const CORE_LABELS: Record<number, string> = {
  1: 'Xray',
  2: 'Sing-box',
  3: 'Mihomo',
};
const TLS_LABELS: Record<number, string> = { 0: '无', 1: 'TLS', 2: 'XTLS' };

interface TemplatePreviewDrawerProps {
  open: boolean;
  previewData?: Record<string, any>;
  templateName?: string;
  loading?: boolean;
  onClose: () => void;
}

const TemplatePreviewDrawer: React.FC<TemplatePreviewDrawerProps> = ({
  open,
  previewData,
  templateName,
  loading,
  onClose,
}) => {
  return (
    <Drawer
      title={`配置预览 — ${templateName ?? ''}`}
      open={open}
      onClose={onClose}
      width={560}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <Spin />
        </div>
      ) : previewData ? (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="节点类型">
              <Tag color="blue">{previewData.node_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="TLS">
              {previewData.tls != null
                ? (TLS_LABELS[previewData.tls] ?? String(previewData.tls))
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="证书模式">
              {previewData.cert_mode ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="证书域名">
              {previewData.cert_domain ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="传输协议">
              {previewData.network ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="核心类型">
              {previewData.core_type != null
                ? (CORE_LABELS[previewData.core_type] ??
                  String(previewData.core_type))
                : '-'}
            </Descriptions.Item>
          </Descriptions>

          {previewData.network_settings && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                传输层配置 (network_settings):
              </Text>
              <pre
                style={{
                  background: '#1f1f1f',
                  color: '#e8e8e8',
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  marginTop: 6,
                  overflowX: 'auto',
                  whiteSpace: 'pre',
                }}
              >
                {JSON.stringify(previewData.network_settings, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              完整展开配置：
            </Text>
            <pre
              style={{
                background: '#141414',
                color: '#d4d4d4',
                padding: '12px 16px',
                borderRadius: 6,
                fontSize: 12,
                marginTop: 6,
                maxHeight: 480,
                overflowY: 'auto',
                whiteSpace: 'pre',
              }}
            >
              {JSON.stringify(previewData, null, 2)}
            </pre>
          </div>
        </>
      ) : (
        <Text type="secondary">暂无预览数据</Text>
      )}
    </Drawer>
  );
};

export default TemplatePreviewDrawer;
