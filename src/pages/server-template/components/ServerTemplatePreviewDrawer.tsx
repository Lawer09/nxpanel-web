import { Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface ServerTemplatePreviewDrawerProps {
  open: boolean;
  loading: boolean;
  templateName: string;
  data?: Record<string, any>;
  onClose: () => void;
}

const PROTOCOL_COLOR: Record<string, string> = {
  vless: 'blue',
  vmess: 'purple',
  trojan: 'orange',
  shadowsocks: 'red',
  hysteria: 'magenta',
  tuic: 'volcano',
  anytls: 'gold',
  socks: 'cyan',
  naive: 'lime',
  http: 'geekblue',
  mieru: 'green',
};

const ServerTemplatePreviewDrawer: React.FC<
  ServerTemplatePreviewDrawerProps
> = ({ open, loading, templateName, data, onClose }) => {
  return (
    <Drawer
      title={`预览节点配置 — ${templateName}`}
      open={open}
      width={580}
      onClose={onClose}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <Spin tip="加载中…" />
        </div>
      ) : data ? (
        <>
          <Descriptions
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 16 }}
          >
            {data.type && (
              <Descriptions.Item label="协议">
                <Tag color={PROTOCOL_COLOR[data.type] ?? 'default'}>
                  {data.type}
                </Tag>
              </Descriptions.Item>
            )}
            {data.host && (
              <Descriptions.Item label="Host">{data.host}</Descriptions.Item>
            )}
            {data.port != null && (
              <Descriptions.Item label="端口">{data.port}</Descriptions.Item>
            )}
            {data.server_port != null && (
              <Descriptions.Item label="服务端口">
                {data.server_port}
              </Descriptions.Item>
            )}
            {data.rate != null && (
              <Descriptions.Item label="倍率">{data.rate}</Descriptions.Item>
            )}
            {data.code && (
              <Descriptions.Item label="标识码">{data.code}</Descriptions.Item>
            )}
          </Descriptions>

          {data.protocol_settings && (
            <>
              <Text type="secondary" style={{ fontSize: 12 }}>
                protocol_settings：
              </Text>
              <pre
                style={{
                  marginTop: 6,
                  marginBottom: 16,
                  background: '#1f1f1f',
                  color: '#e0e0e0',
                  padding: '10px 14px',
                  borderRadius: 6,
                  maxHeight: 300,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {JSON.stringify(data.protocol_settings, null, 2)}
              </pre>
            </>
          )}

          <Text type="secondary" style={{ fontSize: 12 }}>
            完整配置（可直接用于创建节点）：
          </Text>
          <pre
            style={{
              marginTop: 6,
              background: '#1f1f1f',
              color: '#e0e0e0',
              padding: '10px 14px',
              borderRadius: 6,
              maxHeight: 400,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </>
      ) : (
        <Text type="secondary">暂无配置数据</Text>
      )}
    </Drawer>
  );
};

export default ServerTemplatePreviewDrawer;
