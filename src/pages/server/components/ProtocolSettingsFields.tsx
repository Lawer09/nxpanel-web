import React from 'react';
import {
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Col, Row, Typography } from 'antd';

const { Text } = Typography;

const NetworkSettingsFields: React.FC<{ network: string }> = ({ network }) => {
  if (network === 'tcp') {
    return (
      <>
        <ProFormSelect
          name={['protocol_settings', 'network_settings', 'header', 'type']}
          label="Header Type"
          colProps={{ span: 6 }}
          options={[
            { label: 'none', value: 'none' },
            { label: 'http', value: 'http' },
          ]}
        />
        <ProFormDependency name={['protocol_settings']}>
          {({ protocol_settings }) =>
            protocol_settings?.network_settings?.header?.type === 'http' ? (
              <>
                <ProFormText
                  name={['protocol_settings', 'network_settings', 'header', 'request', 'path']}
                  label="HTTP Path"
                  colProps={{ span: 12 }}
                  placeholder="/"
                />
                <ProFormText
                  name={['protocol_settings', 'network_settings', 'header', 'request', 'headers', 'Host']}
                  label="Host Header"
                  colProps={{ span: 12 }}
                  placeholder="example.com"
                />
              </>
            ) : null
          }
        </ProFormDependency>
      </>
    );
  }
  if (network === 'ws') {
    return (
      <>
        <ProFormText
          name={['protocol_settings', 'network_settings', 'path']}
          label="WS Path"
          colProps={{ span: 12 }}
          placeholder="/ws-path"
        />
        <ProFormText
          name={['protocol_settings', 'network_settings', 'headers', 'Host']}
          label="Host Header"
          colProps={{ span: 12 }}
          placeholder="example.com"
        />
      </>
    );
  }
  if (network === 'grpc') {
    return (
      <ProFormText
        name={['protocol_settings', 'network_settings', 'serviceName']}
        label="gRPC Service Name"
        colProps={{ span: 12 }}
        placeholder="my-grpc-service"
      />
    );
  }
  if (network === 'kcp') {
    return (
      <>
        <ProFormText
          name={['protocol_settings', 'network_settings', 'seed']}
          label="KCP Seed"
          colProps={{ span: 12 }}
          placeholder="my-seed"
        />
        <ProFormSelect
          name={['protocol_settings', 'network_settings', 'header', 'type']}
          label="Header Type"
          colProps={{ span: 12 }}
          options={[
            { label: 'none', value: 'none' },
            { label: 'srtp', value: 'srtp' },
            { label: 'utp', value: 'utp' },
            { label: 'wechat-video', value: 'wechat-video' },
            { label: 'dtls', value: 'dtls' },
            { label: 'wireguard', value: 'wireguard' },
          ]}
        />
      </>
    );
  }
  if (network === 'h2') {
    return (
      <>
        <ProFormText
          name={['protocol_settings', 'network_settings', 'host']}
          label="H2 Host"
          colProps={{ span: 12 }}
          placeholder="example.com"
        />
        <ProFormText
          name={['protocol_settings', 'network_settings', 'path']}
          label="H2 Path"
          colProps={{ span: 12 }}
          placeholder="/h2-path"
        />
      </>
    );
  }
  if (network === 'httpupgrade') {
    return (
      <>
        <ProFormText
          name={['protocol_settings', 'network_settings', 'path']}
          label="Path"
          colProps={{ span: 12 }}
          placeholder="/upgrade-path"
        />
        <ProFormText
          name={['protocol_settings', 'network_settings', 'host']}
          label="Host"
          colProps={{ span: 12 }}
          placeholder="example.com"
        />
      </>
    );
  }
  if (network === 'xhttp') {
    return (
      <>
        <ProFormText
          name={['protocol_settings', 'network_settings', 'path']}
          label="Path"
          colProps={{ span: 8 }}
          placeholder="/xhttp-path"
        />
        <ProFormText
          name={['protocol_settings', 'network_settings', 'host']}
          label="Host"
          colProps={{ span: 8 }}
          placeholder="example.com"
        />
        <ProFormSelect
          name={['protocol_settings', 'network_settings', 'mode']}
          label="Mode"
          colProps={{ span: 8 }}
          options={[
            { label: 'auto', value: 'auto' },
            { label: 'packet-up', value: 'packet-up' },
            { label: 'stream-up', value: 'stream-up' },
          ]}
        />
      </>
    );
  }
  return null;
};

const VmessFields: React.FC = () => (
  <>
    {/* Network 卡片 */}
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>🔗 传输层（Network）</Text>
      <ProFormSelect
        name={['protocol_settings', 'network']}
        label="Network"
        colProps={{ span: 8 }}
        options={[
          { label: 'tcp', value: 'tcp' },
          { label: 'ws', value: 'ws' },
          { label: 'grpc', value: 'grpc' },
          { label: 'kcp', value: 'kcp' },
          { label: 'h2', value: 'h2' },
          { label: 'httpupgrade', value: 'httpupgrade' },
          { label: 'xhttp', value: 'xhttp' },
        ]}
        rules={[{ required: true, message: '请选择 Network' }]}
      />
      <ProFormDependency name={['protocol_settings']}>
        {({ protocol_settings }) => (
          <NetworkSettingsFields network={protocol_settings?.network ?? ''} />
        )}
      </ProFormDependency>
    </div>
    {/* TLS 卡片 */}
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>🔒 安全层（TLS）</Text>
      <ProFormSelect
        name={['protocol_settings', 'tls']}
        label="TLS"
        colProps={{ span: 6 }}
        options={[
          { label: '关闭', value: 0 },
          { label: '开启', value: 1 },
        ]}
        rules={[{ required: true, message: '请选择 TLS' }]}
      />
      <ProFormText
        name={['protocol_settings', 'tls_settings', 'server_name']}
        label="TLS Server Name"
        colProps={{ span: 12 }}
      />
      <ProFormSwitch
        name={['protocol_settings', 'tls_settings', 'allow_insecure']}
        label="TLS Allow Insecure"
        colProps={{ span: 12 }}
      />
    </div>
  </>
);

const VlessTlsFields: React.FC = () => (
  <ProFormDependency name={['protocol_settings']}>
    {({ protocol_settings }) => {
      const tlsMode = protocol_settings?.tls;
      if (tlsMode === 1) {
        return (
          <div>
            <ProFormText
              name={['protocol_settings', 'tls_settings', 'server_name']}
              label="Server Name"
              colProps={{ span: 12 }}
            />
            <ProFormSwitch
              name={['protocol_settings', 'tls_settings', 'allow_insecure']}
              label="Allow Insecure"
              colProps={{ span: 12 }}
            />
          </div>
        );
      }
      if (tlsMode === 2) {
        return (
          <div>
            <ProFormText
              name={['protocol_settings', 'reality_settings', 'server_name']}
              label="Server Name"
              colProps={{ span: 12 }}
            />
            <ProFormDigit
              name={['protocol_settings', 'reality_settings', 'server_port']}
              label="Server Port"
              colProps={{ span: 6 }}
              min={1}
              max={65535}
              placeholder="留空则随机"
            />
            <ProFormSwitch
              name={['protocol_settings', 'reality_settings', 'allow_insecure']}
              label="Allow Insecure"
              colProps={{ span: 6 }}
            />
            <Row gutter={8}>
              <Col flex="1">
                <ProFormText
                  name={['protocol_settings', 'reality_settings', 'public_key']}
                  label="Public Key"
                  placeholder="留空则部署时随机生成"
                />
              </Col>
              <Col flex="1">
                <ProFormText
                  name={['protocol_settings', 'reality_settings', 'private_key']}
                  label="Private Key"
                  placeholder="留空则部署时随机生成"
                />
              </Col>
            </Row>
            <ProFormText
              name={['protocol_settings', 'reality_settings', 'short_id']}
              label="Short ID"
              colProps={{ span: 12 }}
              placeholder="留空则部署时随机生成"
              rules={[
                {
                  validator: async (_, value) => {
                    if (!value) return;
                    const text = String(value).trim();
                    if (text.length > 16) throw new Error('Short ID 长度不能超过 16');
                    if (text.length % 2 !== 0) throw new Error('Short ID 必须是偶数长度');
                    if (!/^[a-fA-F0-9]+$/.test(text)) throw new Error('Short ID 必须为十六进制字符');
                  },
                },
              ]}
            />
          </div>
        );
      }
      return null;
    }}
  </ProFormDependency>
);

const VlessFields: React.FC = () => (
  <>
    {/* Network 卡片 */}
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>🔗 传输层（Network）</Text>
      <ProFormSelect
        name={['protocol_settings', 'network']}
        label="Network"
        colProps={{ span: 8 }}
        options={[
          { label: 'tcp', value: 'tcp' },
          { label: 'ws', value: 'ws' },
          { label: 'grpc', value: 'grpc' },
          { label: 'xhttp', value: 'xhttp' },
          { label: 'h2', value: 'h2' },
          { label: 'httpupgrade', value: 'httpupgrade' },
        ]}
        rules={[{ required: true, message: '请选择 Network' }]}
      />
      <ProFormSelect
        name={['protocol_settings', 'flow']}
        label="Flow"
        colProps={{ span: 8 }}
        options={[
          { label: 'none', value: '' },
          { label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' },
        ]}
      />
      <ProFormDependency name={['protocol_settings']}>
        {({ protocol_settings }) => (
          <NetworkSettingsFields network={protocol_settings?.network ?? ''} />
        )}
      </ProFormDependency>
    </div>
    {/* TLS 卡片 */}
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: '12px 16px', marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>🔒 安全层（TLS / Reality）</Text>
      <ProFormSelect
        name={['protocol_settings', 'tls']}
        label="TLS"
        colProps={{ span: 8 }}
        options={[
          { label: '关闭', value: 0 },
          { label: 'TLS', value: 1 },
          { label: 'Reality', value: 2 },
        ]}
        rules={[{ required: true, message: '请选择 TLS' }]}
      />
      <VlessTlsFields />
    </div>
  </>
);

const TrojanFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#f6ffed', 
      border: '1px solid #b7eb8f', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#52c41a' }}>
        <span style={{ marginRight: 4 }}>🛡️</span> Trojan 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'network']}
      label="Network"
      colProps={{ span: 8 }}
      options={[
        { label: 'tcp', value: 'tcp' },
        { label: 'ws', value: 'ws' },
        { label: 'grpc', value: 'grpc' },
      ]}
      rules={[{ required: true, message: '请选择 Network' }]}
    />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'path']}
      label="Network Path"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'host']}
      label="Network Host"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'service_name']}
      label="Network Service Name"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'server_name']}
      label="TLS Server Name"
      colProps={{ span: 12 }}
    />
    <ProFormSwitch
      name={['protocol_settings', 'allow_insecure']}
      label="TLS Allow Insecure"
      colProps={{ span: 12 }}
    />
  </>
);

const HysteriaFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#fff2e8', 
      border: '1px solid #ffbb96', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#fa8c16' }}>
        <span style={{ marginRight: 4 }}>🌊</span> Hysteria 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'version']}
      label="Version"
      colProps={{ span: 6 }}
      options={[
        { label: '1', value: 1 },
        { label: '2', value: 2 },
      ]}
      rules={[{ required: true, message: '请选择版本' }]}
    />
    <ProFormSelect
      name={['protocol_settings', 'alpn']}
      label="ALPN"
      colProps={{ span: 12 }}
      mode="tags"
    />
    <ProFormSwitch
      name={['protocol_settings', 'obfs', 'open']}
      label="OBFS Open"
      colProps={{ span: 6 }}
    />
    <ProFormSelect
      name={['protocol_settings', 'obfs', 'type']}
      label="OBFS Type"
      colProps={{ span: 8 }}
      options={[
        { label: 'salamander', value: 'salamander' },
        { label: 'none', value: '' },
      ]}
    />
    <ProFormText
      name={['protocol_settings', 'obfs', 'password']}
      label="OBFS Password"
      colProps={{ span: 10 }}
    />
    <ProFormText
      name={['protocol_settings', 'tls', 'server_name']}
      label="TLS Server Name"
      colProps={{ span: 12 }}
    />
    <ProFormSwitch
      name={['protocol_settings', 'tls', 'allow_insecure']}
      label="TLS Allow Insecure"
      colProps={{ span: 12 }}
    />
    <ProFormDigit
      name={['protocol_settings', 'bandwidth', 'up']}
      label="Bandwidth Up (Mbps)"
      colProps={{ span: 8 }}
      min={0}
    />
    <ProFormDigit
      name={['protocol_settings', 'bandwidth', 'down']}
      label="Bandwidth Down (Mbps)"
      colProps={{ span: 8 }}
      min={0}
    />
    <ProFormText
      name={['protocol_settings', 'hop_interval']}
      label="Hop Interval"
      colProps={{ span: 8 }}
    />
  </>
);

const ShadowsocksFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#f9f0ff', 
      border: '1px solid #d3adf7', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#722ed1' }}>
        <span style={{ marginRight: 4 }}>🔒</span> Shadowsocks 协议配置
      </Text>
    </div>
    <ProFormText
      name={['protocol_settings', 'cipher']}
      label="Cipher"
      colProps={{ span: 8 }}
      rules={[{ required: true, message: '请输入 Cipher' }]}
    />
    <ProFormText
      name={['protocol_settings', 'obfs']}
      label="OBFS"
      colProps={{ span: 8 }}
    />
    <ProFormText
      name={['protocol_settings', 'obfs_settings', 'path']}
      label="OBFS Path"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'obfs_settings', 'host']}
      label="OBFS Host"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'plugin']}
      label="Plugin"
      colProps={{ span: 12 }}
    />
    <ProFormText
      name={['protocol_settings', 'plugin_opts']}
      label="Plugin Opts"
      colProps={{ span: 12 }}
    />
  </>
);

const NaiveFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#e6fffb', 
      border: '1px solid #87e8de', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#13c2c2' }}>
        <span style={{ marginRight: 4 }}>🌱</span> Naive 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'tls']}
      label="TLS"
      colProps={{ span: 6 }}
      options={[
        { label: '关闭', value: 0 },
        { label: '开启', value: 1 },
      ]}
      rules={[{ required: true, message: '请选择 TLS' }]}
    />
    <ProFormText
      name={['protocol_settings', 'tls_settings', 'server_name']}
      label="TLS Server Name"
      colProps={{ span: 12 }}
    />
    <ProFormSwitch
      name={['protocol_settings', 'tls_settings', 'allow_insecure']}
      label="TLS Allow Insecure"
      colProps={{ span: 6 }}
    />
  </>
);

const HttpFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#fff1f0', 
      border: '1px solid #ffa39e', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#f5222d' }}>
        <span style={{ marginRight: 4 }}>🌐</span> HTTP 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'tls']}
      label="TLS"
      options={[
        { label: '关闭', value: 0 },
        { label: '开启', value: 1 },
      ]}
      rules={[{ required: true, message: '请选择 TLS' }]}
    />
    <ProFormText name={['protocol_settings', 'tls_settings', 'server_name']} label="TLS Server Name" />
    <ProFormSwitch
      name={['protocol_settings', 'tls_settings', 'allow_insecure']}
      label="TLS Allow Insecure"
    />
  </>
);

const MieruFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#f0f5ff', 
      border: '1px solid #adc6ff', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#2f54eb' }}>
        <span style={{ marginRight: 4 }}>🚀</span> Mieru 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'transport']}
      label="Transport"
      options={[
        { label: 'tcp', value: 'tcp' },
        { label: 'udp', value: 'udp' },
      ]}
      rules={[{ required: true, message: '请选择 Transport' }]}
    />
    <ProFormSelect
      name={['protocol_settings', 'multiplexing']}
      label="Multiplexing"
      options={[
        { label: '关闭', value: false },
        { label: '开启', value: true },
      ]}
      rules={[{ required: true, message: '请选择 Multiplexing' }]}
    />
  </>
);

const AnyTlsFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#f9f0ff', 
      border: '1px solid #d3adf7', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#722ed1' }}>
        <span style={{ marginRight: 4 }}>🔓</span> AnyTLS 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'tls']}
      label="TLS"
      options={[
        { label: '关闭', value: 0 },
        { label: '开启', value: 1 },
      ]}
    />
    <ProFormSelect name={['protocol_settings', 'alpn']} label="ALPN" mode="tags" />
    <ProFormText name={['protocol_settings', 'padding_scheme']} label="Padding Scheme" />
  </>
);

const TuicFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#fff0f6', 
      border: '1px solid #ffadd2', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#eb2f96' }}>
        <span style={{ marginRight: 4 }}>🚁</span> TUIC 协议配置
      </Text>
    </div>
    <ProFormSelect
      name={['protocol_settings', 'version']}
      label="Version"
      options={[
        { label: '4', value: 4 },
        { label: '5', value: 5 },
      ]}
    />
    <ProFormSelect name={['protocol_settings', 'alpn']} label="ALPN" mode="tags" />
    <ProFormText name={['protocol_settings', 'congestion_control']} label="Congestion Control" />
    <ProFormSwitch name={['protocol_settings', 'zero_rtt_handshake']} label="Zero RTT Handshake" />
    <ProFormText name={['protocol_settings', 'tls', 'server_name']} label="TLS Server Name" />
    <ProFormSwitch
      name={['protocol_settings', 'tls', 'allow_insecure']}
      label="TLS Allow Insecure"
    />
  </>
);

const SocksFields: React.FC = () => (
  <>
    <div style={{ 
      background: '#f0f0f0', 
      border: '1px solid #d9d9d9', 
      borderRadius: 4, 
      padding: 12,
      marginBottom: 16
    }}>
      <Text style={{ fontSize: 12, color: '#595959' }}>
        <span style={{ marginRight: 4 }}>🧦</span> SOCKS 协议配置
      </Text>
    </div>
    <ProFormText name="protocol_settings_hint" label="协议配置" disabled initialValue="socks 无额外配置" />
  </>
);

const ProtocolSettingsFields: React.FC = () => (
  <ProFormDependency name={['type']}>
    {({ type }) => {
      if (!type) {
        return null;
      }
      if (type === 'vmess') {
        return <VmessFields />;
      }
      if (type === 'vless') {
        return <VlessFields />;
      }
      if (type === 'trojan') {
        return <TrojanFields />;
      }
      if (type === 'hysteria') {
        return <HysteriaFields />;
      }
      if (type === 'shadowsocks') {
        return <ShadowsocksFields />;
      }
      if (type === 'naive') {
        return <NaiveFields />;
      }
      if (type === 'http') {
        return <HttpFields />;
      }
      if (type === 'mieru') {
        return <MieruFields />;
      }
      if (type === 'anytls') {
        return <AnyTlsFields />;
      }
      if (type === 'tuic') {
        return <TuicFields />;
      }
      if (type === 'socks') {
        return <SocksFields />;
      }
      return null;
    }}
  </ProFormDependency>
);

export default ProtocolSettingsFields;
