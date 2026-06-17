import { devAdminRequest } from '@/services/dev-admin/request';

const ASSET_PREFIX = '/v4/assets';
const toQueryParams = (params?: Record<string, any>) => params as Record<string, unknown> | undefined;

export async function listAssetProviders(params?: { page?: number; page_size?: number }) {
  return devAdminRequest<{ items: API.AssetProvider[] }>(`${ASSET_PREFIX}/providers`, {
    params: toQueryParams(params),
  });
}

export async function listAssetProviderAccounts(params?: API.AssetListParams) {
  return devAdminRequest<API.AssetPageResult<API.AssetProviderAccount>>(
    `${ASSET_PREFIX}/provider-accounts`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function createAssetProviderAccount(body: API.AssetProviderAccountCreateParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/provider-accounts/create`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetProviderAccount(body: API.AssetProviderAccountUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/provider-accounts/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetProviderAccount(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/provider-accounts/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function testAssetProviderAccountConnection(accountId: number) {
  return devAdminRequest<{ ok: boolean }>(
    `${ASSET_PREFIX}/provider-accounts/${accountId}/test-connection`,
    {
      method: 'POST',
    },
  );
}

export async function listAssetMachines(params?: API.AssetListParams & { source?: string; name?: string }) {
  return devAdminRequest<API.AssetPageResult<API.AssetMachine>>(`${ASSET_PREFIX}/machines`, {
    params: toQueryParams(params),
  });
}

export async function getAssetMachineDetail(machineId: number) {
  return devAdminRequest<API.AssetMachine>(`${ASSET_PREFIX}/machines/${machineId}`);
}

export async function createAssetMachineManual(body: API.AssetMachineCreateManualParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/machines/create-manual`, {
    method: 'POST',
    body,
  });
}

export async function createAssetMachineFromProvider(body: API.AssetMachineCreateFromProviderParams) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/create-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function importAssetMachinesFromProvider(body: { account_id: number; region?: string }) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/import-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetMachine(body: API.AssetMachineUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/machines/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetMachine(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/machines/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function destroyProviderAssetMachine(
  machineId: number,
  body: { confirm_instance_id: string },
) {
  return devAdminRequest<API.AssetTaskAck>(
    `${ASSET_PREFIX}/machines/${machineId}/destroy-provider-instance`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function syncAssetMachine(machineId: number) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/${machineId}/sync`, {
    method: 'POST',
  });
}

export async function runAssetMachineCommand(body: API.AssetMachineRunCommandParams) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/run-command`, {
    method: 'POST',
    body,
  });
}

export async function listAssetIps(params?: API.AssetListParams) {
  return devAdminRequest<API.AssetPageResult<API.AssetIp>>(`${ASSET_PREFIX}/ips`, {
    params: toQueryParams(params),
  });
}

export async function getAssetIpDetail(ipId: number) {
  return devAdminRequest<API.AssetIp>(`${ASSET_PREFIX}/ips/${ipId}`);
}

export async function importAssetIpManual(body: API.AssetIpImportManualParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/ips/import-manual`, {
    method: 'POST',
    body,
  });
}

export async function importAssetIpsFromProvider(body: { account_id: number; region?: string }) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/ips/import-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetIp(body: API.AssetIpUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/ips/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetIp(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/ips/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function bindAssetMachineIp(machineId: number, body: API.AssetMachineBindIpParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/machines/${machineId}/ips/bind`, {
    method: 'POST',
    body,
  });
}

export async function unbindAssetMachineIp(
  machineId: number,
  body: API.AssetMachineUnbindIpParams,
) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/machines/${machineId}/ips/unbind`, {
    method: 'POST',
    body,
  });
}

export async function switchPrimaryAssetMachineIp(
  machineId: number,
  body: API.AssetMachineSwitchPrimaryIpParams,
) {
  return devAdminRequest<{ ok: boolean }>(
    `${ASSET_PREFIX}/machines/${machineId}/ips/switch-primary`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function listAssetSshKeys(params?: API.AssetListParams) {
  return devAdminRequest<API.AssetPageResult<API.AssetSshKey>>(`${ASSET_PREFIX}/ssh-keys`, {
    params: toQueryParams(params),
  });
}

export async function getAssetSshKeyDetail(keyId: number) {
  return devAdminRequest<API.AssetSshKey>(`${ASSET_PREFIX}/ssh-keys/${keyId}`);
}

export async function createAssetSshKeyCustom(body: API.AssetSshKeyCreateCustomParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/ssh-keys/create-custom`, {
    method: 'POST',
    body,
  });
}

export async function importAssetProviderSshKey(body: API.AssetSshKeyImportProviderParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/ssh-keys/import-provider-key`, {
    method: 'POST',
    body,
  });
}

export async function importAssetSshKeysFromProvider(body: { account_id: number }) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/ssh-keys/import-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function createAssetProviderSshKey(body: API.AssetSshKeyCreateProviderParams) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/ssh-keys/create-provider-key`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetSshKey(body: API.AssetSshKeyUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/ssh-keys/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetSshKey(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/ssh-keys/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function listAssetOperations(params?: API.AssetOperationListParams) {
  return devAdminRequest<API.AssetPageResult<API.AssetOperation>>(`${ASSET_PREFIX}/operations`, {
    params: toQueryParams(params),
  });
}

export async function getAssetOperationDetail(operationId: number) {
  return devAdminRequest<API.AssetOperation>(`${ASSET_PREFIX}/operations/${operationId}`);
}
