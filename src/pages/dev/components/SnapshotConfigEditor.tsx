import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
} from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import UnitNumberInput, {
  speedLimitUnits,
  trafficThresholdUnits,
} from './UnitNumberInput';

const { Paragraph, Text } = Typography;

type JsonObject = Record<string, unknown>;
type PairItem = { key?: string; value?: string };

export type SnapshotConfigEditorRef = {
  commit: () => Promise<API.ControlNodeSnapshotConfig>;
};

type SnapshotConfigEditorProps = {
  node?: API.ControlNode | null;
  onChange?: (value: API.ControlNodeSnapshotConfig) => void;
};

const protocolOptions = [
  'shadowsocks',
  'vmess',
  'vless',
  'trojan',
  'tuic',
  'hysteria',
  'hysteria2',
  'anytls',
].map((value) => ({ label: value, value }));

const tlsModeOptions = ['none', 'tls', 'reality'].map((value) => ({ label: value, value }));
const certModeOptions = ['file', 'http', 'dns', 'self'].map((value) => ({ label: value, value }));
const certKeyTypeOptions = ['ec256', 'ec384', 'rsa2048', 'rsa3072', 'rsa4096', 'rsa8192'].map(
  (value) => ({ label: value, value }),
);
const allTransportOptions = ['tcp', 'ws', 'grpc', 'httpupgrade'].map((value) => ({
  label: value,
  value,
}));
const cipherOptions = [
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
  'none',
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
].map((value) => ({ label: value, value }));
const realityClientFingerprintOptions = [
  'chrome',
  'chrome_psk',
  'chrome_psk_shuffle',
  'chrome_padding_psk_shuffle',
  'chrome_pq',
  'chrome_pq_psk',
  'firefox',
  'safari',
  'ios',
  'android',
  'edge',
  '360',
  'qq',
  'random',
  'randomized',
].map((value) => ({ label: value, value }));

const getTransportOptions = (type?: string) => {
  if (type === 'vless') return allTransportOptions;
  return allTransportOptions.filter((item) => item.value === 'tcp');
};

const defaultSnapshotConfig: API.ControlNodeSnapshotConfig = {
  id: undefined,
  tag: undefined,
  type: 'shadowsocks',
  enabled: false,
  client: {
    public_host: '',
  },
  listen: {
    bind_ip: '0.0.0.0',
    port: 10001,
    tcp_fast_open: false,
  },
  settings: {
    cipher: '2022-blake3-aes-128-gcm',
    server_key: 'change-me-server-key',
  },
  tls: {
    mode: 'none',
  },
  transport: {
    network: 'tcp',
    settings: {},
  },
  multiplex: {
    enabled: false,
    padding: false,
    brutal: {
      enabled: false,
      up_mbps: 0,
      down_mbps: 0,
    },
  },
  limiter: {
    enable_realtime: true,
    speed_limit: 0,
    ip_limit: 0,
    ip_online_min_traffic: 200,
    report_min_traffic: 0,
    block: {
      protocol: ['bittorrent'],
      regexp: [],
    },
  },
};

const safeStringify = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

const isObject = (value: unknown): value is JsonObject =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown) => (value === undefined || value === null ? undefined : String(value));
const asNumber = (value: unknown, fallback = 0) =>
  value === undefined || value === null || value === '' ? fallback : Number(value);

const compactObject = <T extends JsonObject>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
  ) as Partial<T>;

const mergeObject = <T extends JsonObject>(base: T, patch?: JsonObject | null): T => {
  if (!patch) return { ...base };
  const next: JsonObject = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    const baseValue = next[key];
    if (isObject(baseValue) && isObject(value)) {
      next[key] = mergeObject(baseValue, value);
    } else {
      next[key] = value;
    }
  });
  return next as T;
};

const objectToPairs = (value?: unknown): PairItem[] =>
  isObject(value)
    ? Object.entries(value).map(([key, item]) => ({ key, value: String(item ?? '') }))
    : [];

const pairsToObject = (pairs?: PairItem[]) =>
  (pairs ?? []).reduce<JsonObject>((next, item) => {
    if (item?.key) {
      next[item.key] = item.value ?? '';
    }
    return next;
  }, {});

const pairValues = (pairs?: PairItem[]) =>
  (pairs ?? []).map((item) => item.value).filter((item): item is string => !!item);

const valuesToPairs = (values?: unknown): PairItem[] =>
  Array.isArray(values) ? values.map((value) => ({ value: String(value ?? '') })) : [];

const splitLines = (value?: string) =>
  value
    ?.split('\n')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const assertSnapshotConfig = (value: unknown): API.ControlNodeSnapshotConfig => {
  if (!isObject(value)) {
    throw new Error('Snapshot config must be a JSON object.');
  }
  if (!isObject(value.listen)) {
    throw new Error('listen must be an object.');
  }
  if (!isObject(value.client)) {
    throw new Error('client must be an object.');
  }
  if (!value.client.public_host || typeof value.client.public_host !== 'string') {
    throw new Error('client.public_host is required.');
  }
  if (!isObject(value.settings)) {
    throw new Error('settings must be an object.');
  }
  if (!isObject(value.tls)) {
    throw new Error('tls must be an object.');
  }
  if (!isObject(value.transport)) {
    throw new Error('transport must be an object.');
  }
  if (!isObject(value.multiplex)) {
    throw new Error('multiplex must be an object.');
  }
  if (!isObject(value.limiter)) {
    throw new Error('limiter must be an object.');
  }
  return value as API.ControlNodeSnapshotConfig;
};

export const normalizeNodeSnapshotConfig = (
  node?: API.ControlNode | API.ControlNodeSnapshotConfig | null,
): API.ControlNodeSnapshotConfig => {
  if (!node) {
    return mergeObject(defaultSnapshotConfig, null);
  }

  const fullNode = node as API.ControlNodeSnapshotConfig;
  if (
    isObject(fullNode.listen) ||
    isObject(fullNode.settings) ||
    isObject(fullNode.tls) ||
    isObject(fullNode.transport) ||
    isObject(fullNode.multiplex) ||
    isObject(fullNode.limiter)
  ) {
    return {
      ...defaultSnapshotConfig,
      ...(fullNode.id !== undefined && fullNode.id !== null ? { id: Number(fullNode.id) } : {}),
      ...(typeof fullNode.tag === 'string' ? { tag: fullNode.tag } : {}),
      ...(typeof fullNode.type === 'string' ? { type: fullNode.type } : {}),
      enabled:
        fullNode.enabled === undefined ? defaultSnapshotConfig.enabled : Boolean(fullNode.enabled),
      client: mergeObject(
        defaultSnapshotConfig.client as JsonObject,
        isObject(fullNode.client) ? (fullNode.client as JsonObject) : null,
      ) as API.ControlNodeClientConfig,
      listen: mergeObject(
        defaultSnapshotConfig.listen as JsonObject,
        isObject(fullNode.listen) ? (fullNode.listen as JsonObject) : null,
      ) as API.ControlNodeSnapshotConfig['listen'],
      settings: mergeObject(
        defaultSnapshotConfig.settings as JsonObject,
        isObject(fullNode.settings) ? (fullNode.settings as JsonObject) : null,
      ),
      tls: mergeObject(
        defaultSnapshotConfig.tls as JsonObject,
        isObject(fullNode.tls) ? (fullNode.tls as JsonObject) : null,
      ) as API.ControlTlsConfig,
      transport: mergeObject(
        defaultSnapshotConfig.transport as JsonObject,
        isObject(fullNode.transport) ? (fullNode.transport as JsonObject) : null,
      ) as API.ControlTransportConfig,
      multiplex: mergeObject(
        defaultSnapshotConfig.multiplex as JsonObject,
        isObject(fullNode.multiplex) ? (fullNode.multiplex as JsonObject) : null,
      ) as API.ControlMultiplexConfig,
      limiter: mergeObject(
        defaultSnapshotConfig.limiter as JsonObject,
        isObject(fullNode.limiter) ? (fullNode.limiter as JsonObject) : null,
      ) as API.ControlLimiterConfig,
    };
  }

  const legacyNode = node as API.ControlNode;
  const legacyConfig = (legacyNode.config_json ?? {}) as JsonObject;
  const legacyRules = (legacyNode.rules_json ?? {}) as JsonObject;
  const legacyOptions = (legacyNode.options_json ?? {}) as JsonObject;
  const legacyLimiter = mergeObject(
    defaultSnapshotConfig.limiter as JsonObject,
    legacyOptions,
  ) as API.ControlLimiterConfig;

  return mergeObject(defaultSnapshotConfig, {
    id: legacyNode.id,
    tag: legacyNode.tag,
    type: legacyNode.type,
    enabled: legacyNode.enabled,
    client: {
      name: legacyNode.tag,
      public_host: '',
    },
    ...legacyConfig,
    limiter: {
      ...legacyLimiter,
      block: {
        protocol: Array.isArray(legacyRules.protocol) ? legacyRules.protocol : [],
        regexp: Array.isArray(legacyRules.regexp) ? legacyRules.regexp : [],
      },
    },
  });
};

const toFormValues = (value: API.ControlNodeSnapshotConfig) => ({
  ...value,
  settings: {
    ...value.settings,
    padding_scheme: Array.isArray(value.settings?.padding_scheme)
      ? value.settings.padding_scheme
      : [],
  },
  tls: {
    ...value.tls,
    cert: {
      ...(value.tls?.cert ?? {}),
      dns_env_pairs: objectToPairs(value.tls?.cert?.dns_env),
    },
  },
  client: {
    ...(value.client ?? {}),
  },
  transport: {
    ...value.transport,
    settings: {
      ...(value.transport?.settings ?? {}),
      headers_pairs: objectToPairs(value.transport?.settings?.headers),
      tcp_header_host_pairs: valuesToPairs(
        (((value.transport?.settings?.header as JsonObject | undefined)?.request as
          | JsonObject
          | undefined)?.headers as JsonObject | undefined)?.Host,
      ),
      tcp_header_method: asString(
        ((value.transport?.settings?.header as JsonObject | undefined)?.request as JsonObject | undefined)
          ?.method,
      ),
      tcp_header_path: Array.isArray(
        ((value.transport?.settings?.header as JsonObject | undefined)?.request as JsonObject | undefined)
          ?.path,
      )
        ? (((value.transport?.settings?.header as JsonObject).request as JsonObject).path as string[])[0]
        : undefined,
    },
  },
  limiter: {
    ...value.limiter,
    block: {
      protocol: value.limiter?.block?.protocol ?? [],
      regexp_lines: (value.limiter?.block?.regexp ?? []).join('\n'),
    },
  },
});

const buildSettings = (type: string, raw: JsonObject): JsonObject => {
  if (type === 'shadowsocks') {
    return compactObject({
      cipher: raw.cipher,
      server_key: raw.server_key,
    });
  }
  if (type === 'vless') {
    return compactObject({
      flow: raw.flow,
    });
  }
  if (type === 'vmess' || type === 'trojan') {
    return {};
  }
  if (type === 'tuic') {
    return compactObject({
      congestion_control: raw.congestion_control,
      zero_rtt_handshake: Boolean(raw.zero_rtt_handshake),
    });
  }
  if (type === 'hysteria') {
    return compactObject({
      up_mbps: raw.up_mbps,
      down_mbps: raw.down_mbps,
      obfs: raw.obfs,
    });
  }
  if (type === 'hysteria2') {
    return compactObject({
      ignore_client_bandwidth: Boolean(raw.ignore_client_bandwidth),
      up_mbps: raw.up_mbps,
      down_mbps: raw.down_mbps,
      obfs: raw.obfs,
      obfs_password: raw.obfs_password,
    });
  }
  if (type === 'anytls') {
    return compactObject({
      padding_scheme: Array.isArray(raw.padding_scheme) ? raw.padding_scheme : [],
    });
  }
  return {};
};

const buildTls = (raw: JsonObject): API.ControlTlsConfig => {
  const mode = String(raw.mode ?? 'none') as API.ControlTlsMode;
  if (mode === 'none') {
    return { mode: 'none' };
  }

  if (mode === 'reality') {
    const reality = isObject(raw.reality) ? raw.reality : {};
    return {
      mode,
      ...compactObject({ server_name: asString(raw.server_name) }),
      reality: compactObject({
        private_key: asString(reality.private_key),
        short_id: asString(reality.short_id),
        dest: asString(reality.dest),
        server_port: asString(reality.server_port),
        max_time_diff: asString(reality.max_time_diff),
        client_fingerprint: asString(reality.client_fingerprint),
      }),
    };
  }

  const cert = isObject(raw.cert) ? raw.cert : {};
  const certMode = String(cert.mode ?? 'file');
  const nextCert: API.ControlTlsCertConfig = {
    mode: certMode,
    ...compactObject({
      key_type: asString(cert.key_type),
      reject_unknown_sni:
        cert.reject_unknown_sni === undefined ? undefined : Boolean(cert.reject_unknown_sni),
      domain: asString(cert.domain),
      cert_file: asString(cert.cert_file),
      key_file: asString(cert.key_file),
      provider: asString(cert.provider),
      email: asString(cert.email),
      timeout: cert.timeout === undefined ? undefined : asNumber(cert.timeout),
    }),
  };
  const dnsEnv = pairsToObject(cert.dns_env_pairs as PairItem[]);
  if (Object.keys(dnsEnv).length) {
    nextCert.dns_env = dnsEnv;
  }

  return {
    mode,
    ...compactObject({ server_name: asString(raw.server_name) }),
    cert: nextCert,
  };
};

const buildTransport = (type: string, raw: JsonObject): API.ControlTransportConfig => {
  const allowedNetworks = getTransportOptions(type).map((item) => item.value);
  const requestedNetwork = String(raw.network ?? 'tcp');
  const network = allowedNetworks.includes(requestedNetwork) ? requestedNetwork : 'tcp';
  const rawSettings = isObject(raw.settings) ? raw.settings : {};

  if (network === 'tcp') {
    const hostValues = pairValues(rawSettings.tcp_header_host_pairs as PairItem[]);
    const method = asString(rawSettings.tcp_header_method) || 'GET';
    const path = asString(rawSettings.tcp_header_path) || '/';
    if ((type === 'vless' || type === 'vmess') && hostValues.length) {
      return {
        network,
        settings: {
          header: {
            type: 'http',
            request: {
              method,
              path: [path],
              headers: {
                Host: hostValues,
              },
            },
          },
        },
      };
    }
    return {
      network,
      settings: {},
    };
  }

  if (network === 'grpc') {
    return {
      network,
      settings: compactObject({
        service_name: rawSettings.service_name,
      }),
    };
  }

  if (network === 'ws' || network === 'httpupgrade') {
    const headers = pairsToObject(rawSettings.headers_pairs as PairItem[]);
    return {
      network,
      settings: {
        ...compactObject({
          path: rawSettings.path,
          host: rawSettings.host,
        }),
        ...(Object.keys(headers).length ? { headers } : {}),
      },
    };
  }

  return {
    network: 'tcp',
    settings: {},
  };
};

const buildMultiplex = (raw: JsonObject): API.ControlMultiplexConfig => {
  const enabled = Boolean(raw.enabled);
  if (!enabled) {
    return {
      enabled: false,
      padding: false,
      brutal: {
        enabled: false,
        up_mbps: 0,
        down_mbps: 0,
      },
    };
  }

  const rawBrutal = isObject(raw.brutal) ? raw.brutal : {};
  const brutalEnabled = Boolean(rawBrutal.enabled);
  return {
    enabled,
    padding: Boolean(raw.padding),
    brutal: {
      enabled: brutalEnabled,
      up_mbps: brutalEnabled ? Number(rawBrutal.up_mbps ?? 0) : 0,
      down_mbps: brutalEnabled ? Number(rawBrutal.down_mbps ?? 0) : 0,
    },
  };
};

const buildSnapshotFromForm = (raw: API.ControlNodeSnapshotConfig) => {
  const type = String(raw.type ?? 'shadowsocks');
  const limiter = (isObject(raw.limiter) ? raw.limiter : {}) as JsonObject;
  const block = (isObject(limiter.block) ? limiter.block : {}) as JsonObject;
  const client = (isObject(raw.client) ? raw.client : {}) as JsonObject;
  const nextId = raw.id === undefined || raw.id === null ? undefined : Number(raw.id);
  const nextTag = typeof raw.tag === 'string' && raw.tag.trim() ? raw.tag.trim() : undefined;

  return assertSnapshotConfig({
    ...(nextId !== undefined ? { id: nextId } : {}),
    ...(nextTag ? { tag: nextTag } : {}),
    type,
    enabled: Boolean(raw.enabled),
    client: {
      ...(typeof client.name === 'string' && client.name.trim() ? { name: client.name.trim() } : {}),
      ...(typeof client.node_tag === 'string' && client.node_tag.trim()
        ? { node_tag: client.node_tag.trim() }
        : {}),
      public_host: String(client.public_host ?? '').trim(),
      ...(client.public_port !== undefined && client.public_port !== null && client.public_port !== ''
        ? { public_port: Number(client.public_port) }
        : {}),
    },
    listen: {
      bind_ip: raw.listen?.bind_ip,
      port: asNumber(raw.listen?.port),
      tcp_fast_open: Boolean(raw.listen?.tcp_fast_open),
    },
    settings: buildSettings(type, (raw.settings ?? {}) as JsonObject),
    tls: buildTls(type === 'vless' ? ((raw.tls ?? {}) as JsonObject) : { mode: 'none' }),
    transport:
      type === 'vless'
        ? buildTransport(type, (raw.transport ?? {}) as JsonObject)
        : { network: 'tcp', settings: {} },
    multiplex: buildMultiplex((raw.multiplex ?? {}) as JsonObject),
    limiter: {
      enable_realtime: Boolean(limiter.enable_realtime),
      speed_limit: asNumber(limiter.speed_limit),
      ip_limit: asNumber(limiter.ip_limit),
      ip_online_min_traffic: asNumber(limiter.ip_online_min_traffic),
      report_min_traffic: asNumber(limiter.report_min_traffic),
      block: {
        protocol: Array.isArray(block.protocol) ? block.protocol : [],
        regexp: splitLines(block.regexp_lines as string),
      },
    },
  });
};

const SnapshotConfigEditor = forwardRef<SnapshotConfigEditorRef, SnapshotConfigEditorProps>(
  ({ node, onChange }, ref) => {
    const [form] = Form.useForm<JsonObject>();
    const [mode, setMode] = useState<'form' | 'json' | 'preview'>('form');
    const [currentValue, setCurrentValue] = useState<API.ControlNodeSnapshotConfig>(
      normalizeNodeSnapshotConfig(node),
    );
    const [textValue, setTextValue] = useState(safeStringify(currentValue));
    const type = Form.useWatch('type', form) ?? currentValue.type;
    const tlsMode = Form.useWatch(['tls', 'mode'], form) ?? currentValue.tls.mode;
    const certMode = Form.useWatch(['tls', 'cert', 'mode'], form) ?? 'file';
    const transportNetwork =
      Form.useWatch(['transport', 'network'], form) ?? currentValue.transport.network;
    const multiplexEnabled =
      Form.useWatch(['multiplex', 'enabled'], form) ?? currentValue.multiplex.enabled;
    const brutalEnabled =
      Form.useWatch(['multiplex', 'brutal', 'enabled'], form) ??
      currentValue.multiplex.brutal?.enabled;
    const transportSelectOptions = useMemo(() => getTransportOptions(String(type)), [type]);

    useEffect(() => {
      const next = normalizeNodeSnapshotConfig(node);
      setCurrentValue(next);
      setTextValue(safeStringify(next));
      form.setFieldsValue(toFormValues(next));
    }, [form, node]);

    useEffect(() => {
      const allowedNetworks = transportSelectOptions.map((item) => item.value);
      if (transportNetwork && !allowedNetworks.includes(String(transportNetwork))) {
        form.setFieldValue(['transport', 'network'], 'tcp');
      }
    }, [form, transportNetwork, transportSelectOptions]);

    useEffect(() => {
      if (type !== 'vless' && tlsMode === 'reality') {
        form.setFieldValue(['tls', 'mode'], 'none');
      }
    }, [form, tlsMode, type]);

    const updateCurrentValue = (next: API.ControlNodeSnapshotConfig) => {
      setCurrentValue(next);
      onChange?.(next);
    };

    const syncFormValue = () => {
      const raw = form.getFieldsValue(true) as API.ControlNodeSnapshotConfig;
      try {
        const next = buildSnapshotFromForm(raw);
        updateCurrentValue(next);
        return next;
      } catch {
        return currentValue;
      }
    };

    useImperativeHandle(ref, () => ({
      commit: async () => {
        if (mode === 'json') {
          const next = assertSnapshotConfig(JSON.parse(textValue));
          updateCurrentValue(next);
          form.setFieldsValue(toFormValues(next));
          return next;
        }
        if (mode === 'preview') {
          return currentValue;
        }
        const raw = (await form.validateFields()) as API.ControlNodeSnapshotConfig;
        const next = buildSnapshotFromForm(raw);
        updateCurrentValue(next);
        return next;
      },
    }));

    const settingsFields = useMemo(() => {
      if (type === 'shadowsocks') {
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['settings', 'cipher']}
                label="Cipher"
                tooltip="shadowsocks encryption method."
              >
                <Select options={cipherOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['settings', 'server_key']}
                label="Server Key"
                tooltip="shadowsocks 2022 server key."
              >
                <Input placeholder="server-key" />
              </Form.Item>
            </Col>
          </Row>
        );
      }
      if (type === 'vless') {
        return (
          <Form.Item
            name={['settings', 'flow']}
            label="Flow"
            tooltip="Optional. Current available value is xtls-rprx-vision. Empty means disabled."
          >
            <Select
              allowClear
              options={[{ label: 'xtls-rprx-vision', value: 'xtls-rprx-vision' }]}
            />
          </Form.Item>
        );
      }
      if (type === 'vmess' || type === 'trojan') {
        return <Text type="secondary">No recommended required protocol settings.</Text>;
      }
      if (type === 'tuic') {
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['settings', 'congestion_control']}
                label="Congestion Control"
                tooltip="tuic congestion control."
              >
                <Input placeholder="bbr" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['settings', 'zero_rtt_handshake']}
                label="0-RTT"
                tooltip="Enable tuic zero RTT handshake."
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        );
      }
      if (type === 'hysteria' || type === 'hysteria2') {
        return (
          <>
            {type === 'hysteria2' ? (
              <Form.Item
                name={['settings', 'ignore_client_bandwidth']}
                label="Ignore Client Bandwidth"
                tooltip="Whether hysteria2 ignores client bandwidth."
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            ) : null}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['settings', 'up_mbps']}
                  label="Up Mbps"
                  tooltip="Upload bandwidth parameter, unit Mbps."
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['settings', 'down_mbps']}
                  label="Down Mbps"
                  tooltip="Download bandwidth parameter, unit Mbps."
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['settings', 'obfs']} label="Obfs" tooltip="Obfuscation type or parameter.">
                  <Input />
                </Form.Item>
              </Col>
              {type === 'hysteria2' ? (
                <Col span={12}>
                  <Form.Item
                    name={['settings', 'obfs_password']}
                    label="Obfs Password"
                    tooltip="hysteria2 obfuscation password."
                  >
                    <Input />
                  </Form.Item>
                </Col>
              ) : null}
            </Row>
          </>
        );
      }
      if (type === 'anytls') {
        return (
          <Form.Item
            name={['settings', 'padding_scheme']}
            label="Padding Scheme"
            tooltip="anytls padding scheme list."
          >
            <Select mode="tags" />
          </Form.Item>
        );
      }
      return <Text type="secondary">No protocol-specific fields for this type.</Text>;
    }, [type]);

    const renderPairs = (name: (string | number)[], keyLabel: string, valueLabel: string) => (
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Row gutter={8} key={field.key}>
                <Col span={10}>
                  <Form.Item name={[field.name, 'key']} style={{ marginBottom: 8 }}>
                    <Input placeholder={keyLabel} />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name={[field.name, 'value']} style={{ marginBottom: 8 }}>
                    <Input placeholder={valueLabel} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Button onClick={() => remove(field.name)}>Remove</Button>
                </Col>
              </Row>
            ))}
            <Button onClick={() => add()}>Add</Button>
          </Space>
        )}
      </Form.List>
    );

    const renderForm = () => (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => {
          void syncFormValue();
        }}
      >
        <Divider orientation="left">Basic</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="id" label="Node ID" tooltip="Backend node ID. Optional on create.">
              <InputNumber style={{ width: '100%' }} min={1} disabled={!!node} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tag" label="Tag" tooltip="sing-box inbound tag. Optional on create.">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="type" label="Type" tooltip="Protocol type." rules={[{ required: true }]}>
              <Select options={protocolOptions} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="enabled" label="Enabled" tooltip="Whether the node is enabled.">
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value>Enabled</Radio.Button>
            <Radio.Button value={false}>Disabled</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Divider orientation="left">Client</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['client', 'name']} label="Name" tooltip="Display name. Defaults to tag when omitted.">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['client', 'node_tag']}
              label="Node Tag"
              tooltip="Frontend custom tag. Not part of Agent Snapshot semantics."
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['client', 'public_host']}
              label="Public Host"
              tooltip="Client connection public domain or IP."
              rules={[{ required: true, message: 'Please input public host.' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['client', 'public_port']}
              label="Public Port"
              tooltip="Client connection public port. Falls back to listen.port when omitted."
            >
              <InputNumber style={{ width: '100%' }} min={1} max={65535} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Listen</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name={['listen', 'bind_ip']} label="Bind IP" tooltip="Inbound listen IP.">
              <Input placeholder="0.0.0.0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['listen', 'port']} label="Port" tooltip="Inbound listen port.">
              <InputNumber style={{ width: '100%' }} min={1} max={65535} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={['listen', 'tcp_fast_open']}
              label="TCP Fast Open"
              tooltip="Enable sing-box TCP Fast Open."
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Protocol Settings</Divider>
        {settingsFields}

        <Divider orientation="left">TLS</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['tls', 'mode']} label="TLS Mode" tooltip="none, tls, or reality.">
              <Select
                options={tlsModeOptions.filter((item) => item.value !== 'reality' || type === 'vless')}
              />
            </Form.Item>
          </Col>
          {tlsMode !== 'none' ? (
            <Col span={12}>
              <Form.Item
                name={['tls', 'server_name']}
                label="Server Name"
                tooltip="TLS certificate domain or Reality server name."
              >
                <Input />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        {tlsMode === 'tls' ? (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name={['tls', 'cert', 'mode']}
                  label="Cert Mode"
                  tooltip="TLS certificate mode."
                >
                  <Select options={certModeOptions} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['tls', 'cert', 'key_type']}
                  label="Key Type"
                  tooltip="ACME certificate private key type. Does not affect Reality or the ACME account key."
                >
                  <Select allowClear options={certKeyTypeOptions} placeholder="ec256" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['tls', 'cert', 'reject_unknown_sni']}
                  label="Reject Unknown SNI"
                  tooltip="Reject unknown SNI."
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['tls', 'cert', 'domain']} label="Domain" tooltip="Certificate domain.">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            {certMode === 'file' ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={['tls', 'cert', 'cert_file']}
                    label="Cert File"
                    tooltip="Certificate file path."
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={['tls', 'cert', 'key_file']}
                    label="Key File"
                    tooltip="Private key file path."
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            ) : null}
            {certMode === 'dns' ? (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name={['tls', 'cert', 'provider']} label="Provider" tooltip="DNS ACME provider.">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['tls', 'cert', 'email']} label="Email" tooltip="ACME email.">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['tls', 'cert', 'timeout']} label="Timeout" tooltip="Certificate timeout seconds.">
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="DNS Env" tooltip="DNS provider environment variables.">
                  {renderPairs(['tls', 'cert', 'dns_env_pairs'], 'Name', 'Value')}
                </Form.Item>
              </>
            ) : null}
            {certMode === 'http' || certMode === 'self' ? (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name={['tls', 'cert', 'email']} label="Email" tooltip="ACME email.">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['tls', 'cert', 'timeout']} label="Timeout" tooltip="Certificate timeout seconds.">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </Col>
              </Row>
            ) : null}
          </>
        ) : null}
        {type === 'vless' && tlsMode === 'reality' ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['tls', 'reality', 'private_key']}
                  label="Private Key"
                  tooltip="Reality server private key."
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['tls', 'reality', 'short_id']} label="Short ID" tooltip="Reality short id.">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['tls', 'reality', 'client_fingerprint']}
                  label="Client Fingerprint"
                  tooltip="Reality client fingerprint."
                >
                  <Select allowClear options={realityClientFingerprintOptions} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['tls', 'reality', 'dest']} label="Dest" tooltip="Reality handshake target.">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['tls', 'reality', 'server_port']}
                  label="Server Port"
                  tooltip="Reality handshake target port."
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name={['tls', 'reality', 'max_time_diff']}
                  label="Max Time Diff"
                  tooltip="Maximum time difference, for example 1m."
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : null}

        {type === 'vless' ? (
          <>
            <Divider orientation="left">Transport</Divider>
            <Form.Item name={['transport', 'network']} label="Network" tooltip="Transport network.">
              <Select options={transportSelectOptions} />
            </Form.Item>
            {transportNetwork === 'tcp' ? (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name={['transport', 'settings', 'tcp_header_method']}
                      label="HTTP Header Method"
                      tooltip="HTTP request method for legacy TCP HTTP header transport."
                    >
                      <Input placeholder="GET" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name={['transport', 'settings', 'tcp_header_path']}
                      label="HTTP Header Path"
                      tooltip="HTTP request path. The current project consumes the first path only."
                    >
                      <Input placeholder="/" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name={['transport', 'settings', 'tcp_header_host_pairs']}>
                  {(fields, { add, remove }) => (
                    <Form.Item
                      label="HTTP Header Hosts"
                      tooltip="Host list for legacy TCP HTTP header transport."
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field) => (
                          <Row gutter={8} key={field.key}>
                            <Col span={20}>
                              <Form.Item name={[field.name, 'value']} style={{ marginBottom: 8 }}>
                                <Input placeholder="example.com" />
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Button onClick={() => remove(field.name)}>Remove</Button>
                            </Col>
                          </Row>
                        ))}
                        <Button onClick={() => add()}>Add</Button>
                      </Space>
                    </Form.Item>
                  )}
                </Form.List>
              </>
            ) : null}
            {transportNetwork === 'grpc' ? (
              <Form.Item
                name={['transport', 'settings', 'service_name']}
                label="Service Name"
                tooltip="gRPC service name."
              >
                <Input />
              </Form.Item>
            ) : null}
            {transportNetwork === 'ws' || transportNetwork === 'httpupgrade' ? (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name={['transport', 'settings', 'path']} label="Path" tooltip="Transport path.">
                      <Input placeholder="/ws" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name={['transport', 'settings', 'host']} label="Host" tooltip="Transport host.">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Headers" tooltip="Transport headers.">
                  {renderPairs(['transport', 'settings', 'headers_pairs'], 'Header', 'Value')}
                </Form.Item>
              </>
            ) : null}
          </>
        ) : null}

        <Divider orientation="left">Multiplex</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name={['multiplex', 'enabled']}
              label="Enabled"
              tooltip="Enable sing-box multiplex."
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          {multiplexEnabled ? (
            <>
              <Col span={8}>
                <Form.Item
                  name={['multiplex', 'padding']}
                  label="Padding"
                  tooltip="Enable multiplex padding."
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['multiplex', 'brutal', 'enabled']}
                  label="Brutal"
                  tooltip="Enable brutal."
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </>
          ) : null}
        </Row>
        {multiplexEnabled && brutalEnabled ? (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['multiplex', 'brutal', 'up_mbps']}
                label="Brutal Up Mbps"
                tooltip="Brutal upload bandwidth, unit Mbps."
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['multiplex', 'brutal', 'down_mbps']}
                label="Brutal Down Mbps"
                tooltip="Brutal download bandwidth, unit Mbps."
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        ) : null}

        <Divider orientation="left">Limiter</Divider>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name={['limiter', 'enable_realtime']}
              label="Realtime"
              tooltip="Enable realtime limiter checks."
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name={['limiter', 'speed_limit']}
              label="Speed Limit"
              tooltip="Default node speed limit, unit bytes per second (B/s). 0 means unlimited."
            >
              <UnitNumberInput units={speedLimitUnits} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name={['limiter', 'ip_limit']} label="IP Limit" tooltip="0 or negative means unlimited.">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['limiter', 'ip_online_min_traffic']}
              label="IP Online Min Traffic"
              tooltip="Minimum traffic threshold used to identify online IPs, unit KiB."
            >
              <UnitNumberInput units={trafficThresholdUnits} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['limiter', 'report_min_traffic']}
              label="Report Min Traffic"
              tooltip="Minimum traffic threshold for traffic reports, unit KiB."
            >
              <UnitNumberInput units={trafficThresholdUnits} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Block</Divider>
        <Form.Item
          name={['limiter', 'block', 'protocol']}
          label="Blocked Protocols"
          tooltip="Protocol names to block."
        >
          <Select mode="tags" placeholder="bittorrent" />
        </Form.Item>
        <Form.Item
          name={['limiter', 'block', 'regexp_lines']}
          label="Blocked Regexps"
          tooltip="Domain regular expressions to block. One expression per line."
        >
          <Input.TextArea rows={5} />
        </Form.Item>
      </Form>
    );

    return (
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
        <Space
          style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}
          align="start"
        >
          <div>
            <Text strong>Snapshot Config</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Edit the complete node config payload. JSON mode edits the same full object.
            </Paragraph>
          </div>
          <Segmented
            value={mode}
            options={[
              { label: 'Form', value: 'form' },
              { label: 'JSON', value: 'json' },
              { label: 'Preview', value: 'preview' },
            ]}
            onChange={(next) => {
              if (next === 'json') {
                setTextValue(safeStringify(syncFormValue()));
              }
              setMode(next as 'form' | 'json' | 'preview');
            }}
          />
        </Space>
        <Tabs
          activeKey={mode}
          renderTabBar={() => <></>}
          items={[
            { key: 'form', label: 'Form', children: renderForm() },
            {
              key: 'json',
              label: 'JSON',
              children: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Button
                      onClick={() => {
                        try {
                          const next = assertSnapshotConfig(JSON.parse(textValue));
                          setTextValue(safeStringify(next));
                          updateCurrentValue(next);
                          form.setFieldsValue(toFormValues(next));
                        } catch {
                          return;
                        }
                      }}
                    >
                      Format
                    </Button>
                    <Button
                      onClick={() => {
                        const next = normalizeNodeSnapshotConfig(null);
                        setTextValue(safeStringify(next));
                        updateCurrentValue(next);
                        form.setFieldsValue(toFormValues(next));
                      }}
                    >
                      Reset
                    </Button>
                  </Space>
                  <Input.TextArea
                    rows={24}
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                  />
                </Space>
              ),
            },
            {
              key: 'preview',
              label: 'Preview',
              children: (
                <Paragraph copyable code style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {safeStringify(currentValue)}
                </Paragraph>
              ),
            },
          ]}
        />
      </div>
    );
  },
);

SnapshotConfigEditor.displayName = 'SnapshotConfigEditor';

export default SnapshotConfigEditor;
