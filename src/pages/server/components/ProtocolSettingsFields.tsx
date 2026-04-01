import React from 'react';
import {
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Col, Form, Row } from 'antd';

const VmessFields: React.FC = () => (
  <>
    <ProFormSelect
      name={['protocol_settings', 'tls']}
      label="TLS"
      options={[
        { label: '关闭', value: 0 },
        { label: '开启', value: 1 },
      ]}
      rules={[{ required: true, message: '请选择 TLS' }]}
    />
    <ProFormSelect
      name={['protocol_settings', 'network']}
      label="Network"
      options={[
        { label: 'tcp', value: 'tcp' },
        { label: 'ws', value: 'ws' },
        { label: 'grpc', value: 'grpc' },
        { label: 'kcp', value: 'kcp' },
      ]}
      rules={[{ required: true, message: '请选择 Network' }]}
    />
    <ProFormText name={['protocol_settings', 'network_settings', 'path']} label="Network Path" />
    <ProFormText name={['protocol_settings', 'network_settings', 'host']} label="Network Host" />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'service_name']}
      label="Network Service Name"
    />
    <ProFormText name={['protocol_settings', 'tls_settings', 'server_name']} label="TLS Server Name" />
    <ProFormSwitch
      name={['protocol_settings', 'tls_settings', 'allow_insecure']}
      label="TLS Allow Insecure"
    />
  </>
);

const VlessFields: React.FC = () => {
  const form = Form.useFormInstance();
  return (
  <>
    <ProFormSelect
      name={['protocol_settings', 'tls']}
      label="TLS"
      options={[
        { label: '关闭', value: 0 },
        { label: 'TLS', value: 1 },
        { label: 'Reality', value: 2 },
      ]}
      rules={[{ required: true, message: '请选择 TLS' }]}
    />
    <ProFormSelect
      name={['protocol_settings', 'network']}
      label="Network"
      options={[
        { label: 'tcp', value: 'tcp' },
        { label: 'ws', value: 'ws' },
        { label: 'grpc', value: 'grpc' },
        { label: 'xhttp', value: 'xhttp' },
      ]}
      rules={[{ required: true, message: '请选择 Network' }]}
    />
    <ProFormText name={['protocol_settings', 'network_settings', 'path']} label="Network Path" />
    <ProFormText name={['protocol_settings', 'network_settings', 'host']} label="Network Host" />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'service_name']}
      label="Network Service Name"
    />
    <ProFormSelect
      name={['protocol_settings', 'flow']}
      label="Flow"
      options={[
        { label: 'none', value: '' },
        { label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' },
      ]}
    />
    <ProFormDependency name={['protocol_settings']}>
      {({ protocol_settings }) => {
        const tlsMode = protocol_settings?.tls;
        if (tlsMode === 1) {
          return (
            <>
              <ProFormText
                name={['protocol_settings', 'tls_settings', 'server_name']}
                label="TLS Server Name"
              />
              <ProFormSwitch
                name={['protocol_settings', 'tls_settings', 'allow_insecure']}
                label="TLS Allow Insecure"
              />
            </>
          );
        }
        if (tlsMode === 2) {
          return (
            <>
              <ProFormText
                name={['protocol_settings', 'reality_settings', 'server_name']}
                label="Reality Server Name"
              />
              <ProFormDigit
                name={['protocol_settings', 'reality_settings', 'server_port']}
                label="Reality Server Port"
                min={1}
                max={65535}
              />
              <ProFormSwitch
                name={['protocol_settings', 'reality_settings', 'allow_insecure']}
                label="Reality Allow Insecure"
              />
              <ProFormDependency name={[['generation_options', 'reality_key_random']]}>
                {({ generation_options }) => {
                  const keyRandom = Boolean(generation_options?.reality_key_random);
                  return (
                    <Row gutter={8} align="bottom">
                      <Col flex="1">
                        <ProFormText
                          name={['protocol_settings', 'reality_settings', 'public_key']}
                          label="Reality Public Key"
                          fieldProps={{ disabled: keyRandom }}
                        />
                      </Col>
                      <Col flex="1">
                        <ProFormText
                          name={['protocol_settings', 'reality_settings', 'private_key']}
                          label="Reality Private Key"
                          fieldProps={{ disabled: keyRandom }}
                        />
                      </Col>
                      <Col style={{ paddingBottom: 24 }}>
                        <ProFormSwitch
                          name={['generation_options', 'reality_key_random']}
                          label="随机密钥对"
                          tooltip="部署时随机生成 X25519 公私钥"
                          fieldProps={{
                            onChange: (checked: boolean) => {
                              if (checked) {
                                form.setFieldValue(['protocol_settings', 'reality_settings', 'public_key'], undefined);
                                form.setFieldValue(['protocol_settings', 'reality_settings', 'private_key'], undefined);
                              }
                            },
                          }}
                        />
                      </Col>
                    </Row>
                  );
                }}
              </ProFormDependency>
              <ProFormDependency name={[['generation_options', 'reality_shortid_random']]}>
                {({ generation_options }) => {
                  const shortidRandom = Boolean(generation_options?.reality_shortid_random);
                  return (
                    <Row gutter={8} align="bottom">
                      <Col flex="1">
                        <ProFormText
                          name={['protocol_settings', 'reality_settings', 'short_id']}
                          label="Reality Short ID"
                          fieldProps={{ disabled: shortidRandom }}
                          rules={[
                            {
                              validator: async (_, value) => {
                                if (!value || shortidRandom) return;
                                const text = String(value).trim();
                                if (text.length > 16) throw new Error('Short ID 长度不能超过 16');
                                if (text.length % 2 !== 0) throw new Error('Short ID 必须是偶数长度');
                                if (!/^[a-fA-F0-9]+$/.test(text)) throw new Error('Short ID 必须为十六进制字符');
                              },
                            },
                          ]}
                        />
                      </Col>
                      <Col style={{ paddingBottom: 24 }}>
                        <ProFormSwitch
                          name={['generation_options', 'reality_shortid_random']}
                          label="随机 Short ID"
                          tooltip="部署时随机生成 Reality Short ID"
                          fieldProps={{
                            onChange: (checked: boolean) => {
                              if (checked) {
                                form.setFieldValue(['protocol_settings', 'reality_settings', 'short_id'], undefined);
                              }
                            },
                          }}
                        />
                      </Col>
                    </Row>
                  );
                }}
              </ProFormDependency>
            </>
          );
        }
        return null;
      }}
    </ProFormDependency>
  </>
  );
};

const TrojanFields: React.FC = () => (
  <>
    <ProFormSelect
      name={['protocol_settings', 'network']}
      label="Network"
      options={[
        { label: 'tcp', value: 'tcp' },
        { label: 'ws', value: 'ws' },
        { label: 'grpc', value: 'grpc' },
      ]}
      rules={[{ required: true, message: '请选择 Network' }]}
    />
    <ProFormText name={['protocol_settings', 'network_settings', 'path']} label="Network Path" />
    <ProFormText name={['protocol_settings', 'network_settings', 'host']} label="Network Host" />
    <ProFormText
      name={['protocol_settings', 'network_settings', 'service_name']}
      label="Network Service Name"
    />
    <ProFormText name={['protocol_settings', 'server_name']} label="TLS Server Name" />
    <ProFormSwitch name={['protocol_settings', 'allow_insecure']} label="TLS Allow Insecure" />
  </>
);

const HysteriaFields: React.FC = () => (
  <>
    <ProFormSelect
      name={['protocol_settings', 'version']}
      label="Version"
      options={[
        { label: '1', value: 1 },
        { label: '2', value: 2 },
      ]}
      rules={[{ required: true, message: '请选择版本' }]}
    />
    <ProFormSelect name={['protocol_settings', 'alpn']} label="ALPN" mode="tags" />
    <ProFormSwitch name={['protocol_settings', 'obfs', 'open']} label="OBFS Open" />
    <ProFormSelect
      name={['protocol_settings', 'obfs', 'type']}
      label="OBFS Type"
      options={[
        { label: 'salamander', value: 'salamander' },
        { label: 'none', value: '' },
      ]}
    />
    <ProFormText name={['protocol_settings', 'obfs', 'password']} label="OBFS Password" />
    <ProFormText name={['protocol_settings', 'tls', 'server_name']} label="TLS Server Name" />
    <ProFormSwitch
      name={['protocol_settings', 'tls', 'allow_insecure']}
      label="TLS Allow Insecure"
    />
    <ProFormDigit name={['protocol_settings', 'bandwidth', 'up']} label="Bandwidth Up (Mbps)" min={0} />
    <ProFormDigit
      name={['protocol_settings', 'bandwidth', 'down']}
      label="Bandwidth Down (Mbps)"
      min={0}
    />
    <ProFormText name={['protocol_settings', 'hop_interval']} label="Hop Interval" />
  </>
);

const ShadowsocksFields: React.FC = () => (
  <>
    <ProFormText
      name={['protocol_settings', 'cipher']}
      label="Cipher"
      rules={[{ required: true, message: '请输入 Cipher' }]}
    />
    <ProFormText name={['protocol_settings', 'obfs']} label="OBFS" />
    <ProFormText name={['protocol_settings', 'obfs_settings', 'path']} label="OBFS Path" />
    <ProFormText name={['protocol_settings', 'obfs_settings', 'host']} label="OBFS Host" />
    <ProFormText name={['protocol_settings', 'plugin']} label="Plugin" />
    <ProFormText name={['protocol_settings', 'plugin_opts']} label="Plugin Opts" />
  </>
);

const NaiveFields: React.FC = () => (
  <>
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

const HttpFields: React.FC = () => (
  <>
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
  <ProFormText name="protocol_settings_hint" label="协议配置" disabled initialValue="socks 无额外配置" />
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
