import { buildCanonicalQuery, buildNodeControlHeaders } from './signing';
import { devAdminRequest } from '../dev-admin/request';

const NODE_CONTROL_ALIAS_PREFIX = '/v4/nodes';
const SERVICE_REGISTER_ALIAS_PREFIX = '/v4/service-register-manager';
const SERVICE_REGISTER_GATEWAY_PREFIX = '/api/v1/service-register-manager';

export const getNodeControlAuthConfig = () => {
  const apiId =
    process.env.REACT_APP_NODE_CONTROL_APP_ID || process.env.UMI_APP_NODE_CONTROL_APP_ID;
  const apiSecret =
    process.env.REACT_APP_NODE_CONTROL_APP_SECRET ||
    process.env.UMI_APP_NODE_CONTROL_APP_SECRET;

  return {
    apiId,
    apiSecret,
    isConfigured: Boolean(apiId && apiSecret),
  };
};

export class NodeControlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NodeControlConfigError';
  }
}

const signedPathPrefixes = [
  {
    aliasPrefix: SERVICE_REGISTER_ALIAS_PREFIX,
    gatewayPrefix: SERVICE_REGISTER_GATEWAY_PREFIX,
  },
];

const getSignedPathConfig = (path: string) => {
  const config = signedPathPrefixes.find((item) => path.startsWith(item.aliasPrefix));
  if (!config) {
    throw new Error(`Unsupported signed service path: ${path}`);
  }
  return config;
};

const normalizePath = (path: string) => {
  getSignedPathConfig(path);
  return path;
};

const toGatewayPath = (path: string) => {
  const config = getSignedPathConfig(path);
  return normalizePath(path).replace(config.aliasPrefix, config.gatewayPrefix);
};

type NodeControlRequestOptions = {
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  body?: unknown;
};

const encodedJsonFields = new Set(['config_json', 'rules_json', 'options_json']);

const decodeBase64Utf8 = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const decodeMaybeBase64Json = (value: unknown) => {
  if (value === null || value === undefined || typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(decodeBase64Utf8(value));
  } catch {
    return value;
  }
};

const decodeEncodedJsonFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => decodeEncodedJsonFields(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      encodedJsonFields.has(key)
        ? decodeMaybeBase64Json(item)
        : decodeEncodedJsonFields(item),
    ]),
  );
};

export const nodeControlRequest = async <T>(
  path: string,
  options: NodeControlRequestOptions = {},
): Promise<API.ControlApiResponse<T>> => {
  if (path.startsWith(NODE_CONTROL_ALIAS_PREFIX)) {
    const payload = await devAdminRequest<T>(path, options);
    return {
      ...payload,
      data: decodeEncodedJsonFields(payload.data) as T,
      error: payload.error || undefined,
    };
  }

  const { apiId, apiSecret, isConfigured } = getNodeControlAuthConfig();
  if (!isConfigured || !apiId || !apiSecret) {
    throw new NodeControlConfigError(
      'Missing REACT_APP_NODE_CONTROL_APP_ID or REACT_APP_NODE_CONTROL_APP_SECRET.',
    );
  }

  const method = options.method ?? 'GET';
  const requestPath = toGatewayPath(path);
  const queryString = buildCanonicalQuery(options.params);
  const url = queryString ? `${normalizePath(path)}?${queryString}` : normalizePath(path);
  const headers = await buildNodeControlHeaders({
    method,
    requestPath,
    params: options.params,
    body: options.body,
    apiId,
    apiSecret,
  });

  const response = await fetch(url, {
    method,
    headers: {
      ...headers,
      ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
    },
    body:
      method === 'GET' || options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: API.ControlApiResponse<T>;
  try {
    payload = (await response.json()) as API.ControlApiResponse<T>;
  } catch {
    throw new Error(`Node control request failed with HTTP ${response.status}.`);
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.detail || `HTTP ${response.status}`);
  }

  payload.data = decodeEncodedJsonFields(payload.data) as T;

  return payload;
};
