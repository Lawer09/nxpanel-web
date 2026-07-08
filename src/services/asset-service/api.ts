import { devAdminRequest } from '@/services/dev-admin/request';

const ASSET_PREFIX = '/v4/assets';
const toQueryParams = (params?: Record<string, any>) => params as Record<string, unknown> | undefined;

export async function listAssetProviders(params?: { page?: number; page_size?: number }) {
  return devAdminRequest<{ items: API.AssetProvider[] }>(`${ASSET_PREFIX}/providers`, {
    params: toQueryParams(params),
  });
}

export async function listAssetProviderMachines(
  providerType: string,
  accountId: number,
  params?: API.AssetProviderMachineListParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetProviderMachine>>(
    `${ASSET_PREFIX}/provider/${providerType}/${accountId}/machines`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetProviderRegions(
  providerType: string,
  accountId: number,
  params?: API.AssetProviderRegionListParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetRegion>>(
    `${ASSET_PREFIX}/provider/${providerType}/${accountId}/regions`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetProviderZones(
  providerType: string,
  accountId: number,
  params?: API.AssetProviderZoneListParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetZone>>(
    `${ASSET_PREFIX}/provider/${providerType}/${accountId}/zones`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetProviderImages(
  providerType: string,
  accountId: number,
  params?: API.AssetProviderImageListParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetProviderImage>>(
    `${ASSET_PREFIX}/provider/${providerType}/${accountId}/images`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetProviderAccounts(params?: API.AssetListParams) {
  return devAdminRequest<API.AssetPageResult<API.AssetProviderAccount>>(
    `${ASSET_PREFIX}/provider-accounts`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetRegions(
  params?: API.AssetListParams & { region_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetRegion>>(`${ASSET_PREFIX}/regions`, {
    params: toQueryParams(params),
  });
}

export async function createAssetRegion(body: API.AssetRegionCreateParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/regions/create`, {
    method: 'POST',
    body,
  });
}

export async function listAssetZones(
  params?: API.AssetListParams & { zone_id?: string; region_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetZone>>(`${ASSET_PREFIX}/zones`, {
    params: toQueryParams(params),
  });
}

export async function createAssetZone(body: API.AssetZoneCreateParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/zones/create`, {
    method: 'POST',
    body,
  });
}

export async function listAssetInstanceTypes(
  params?: API.AssetListParams & { zone_id?: string; resource_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetInstanceType>>(
    `${ASSET_PREFIX}/instance-types`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetImages(
  params?: API.AssetListParams & { zone_id?: string; resource_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetImage>>(`${ASSET_PREFIX}/images`, {
    params: toQueryParams(params),
  });
}

export async function createAssetImage(body: API.AssetImageCreateParams) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/images/create`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetImage(body: API.AssetImageUpdateParams) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/images/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetImage(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/images/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function listAssetSecurityGroups(
  params?: API.AssetListParams & { resource_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetSecurityGroup>>(
    `${ASSET_PREFIX}/security-groups`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function listAssetSubnets(
  params?: API.AssetListParams & { region_id?: string; vpc_id?: string; resource_id?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetSubnet>>(`${ASSET_PREFIX}/subnets`, {
    params: toQueryParams(params),
  });
}

export async function listAssetTags(
  params?: API.AssetListParams & { resource_id?: string; key?: string; value?: string },
) {
  return devAdminRequest<API.AssetPageResult<API.AssetProviderTag>>(`${ASSET_PREFIX}/tags`, {
    params: toQueryParams(params),
  });
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

export async function getAssetMachineCreateCatalog(
  accountId: number,
  category: API.AssetMachineCreateCatalogCategory,
  params?: API.AssetMachineCreateCatalogQuery,
) {
  return devAdminRequest<API.AssetMachineCreateCatalog>(
    `${ASSET_PREFIX}/provider-accounts/${accountId}/machine-create/${category}`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function quoteAssetMachineCreatePrice(
  accountId: number,
  body: API.AssetMachineCreateFromProviderParams,
) {
  return devAdminRequest<API.AssetMachineCreatePriceQuote>(
    `${ASSET_PREFIX}/provider-accounts/${accountId}/machine-create/price`,
    {
      method: 'POST',
      body,
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
  return devAdminRequest<API.AssetMachineCreateManualResult>(`${ASSET_PREFIX}/machines/create-manual`, {
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

export async function createAssetMachine(body: API.AssetMachineProviderCreateParams) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/create`, {
    method: 'POST',
    body,
  });
}

export async function retryAssetMachineProviderCreate(
  machineId: number,
  body: API.AssetMachineRetryProviderCreateParams,
) {
  return devAdminRequest<API.AssetTaskAck>(
    `${ASSET_PREFIX}/machines/${machineId}/retry-provider-create`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function retryAssetMachineProviderCreateV2(
  machineId: number,
  body: API.AssetMachineRetryProviderCreateV2Params,
) {
  return devAdminRequest<API.AssetTaskAck>(
    `${ASSET_PREFIX}/machines/${machineId}/retry-provider-create`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function importAssetMachinesFromProvider(body: { account_id: number; region?: string }) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machines/import-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function importAssetMachineFromProvider(
  body: API.AssetMachineImportFromProviderParams,
) {
  return devAdminRequest<API.AssetMachine>(`${ASSET_PREFIX}/machines/import-from-provider`, {
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

export async function batchSyncAssetMachines(body: API.AssetMachineBatchSyncParams) {
  return devAdminRequest<API.AssetBatchTaskAckResult>(`${ASSET_PREFIX}/machines/batch-sync`, {
    method: 'POST',
    body,
  });
}

export async function batchDeleteAssetMachines(body: API.AssetBatchMutationParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/machines/batch-delete`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetMachineTags(body: API.AssetBatchUpdateTagsParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/machines/batch-update-tags`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetMachineStatus(body: API.AssetBatchUpdateStatusParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/machines/batch-update-status`, {
    method: 'POST',
    body,
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

export async function pullAssetIpsFromProvider(
  body: API.AssetIpPullFromProviderParams,
) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/ips/pull-from-provider`, {
    method: 'POST',
    body,
  });
}

export async function getAssetIpPullRun(pullRunId: number) {
  return devAdminRequest<API.AssetIpPullRun>(
    `${ASSET_PREFIX}/ip-pull-runs/${pullRunId}`,
  );
}

export async function listAssetIpPullRunItems(
  pullRunId: number,
  params?: API.AssetIpPullRunItemsParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetIpPullItem>>(
    `${ASSET_PREFIX}/ip-pull-runs/${pullRunId}/items`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function importAssetIpsFromProvider(
  body: API.AssetIpImportFromProviderParams,
) {
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

export async function batchDeleteAssetIps(body: API.AssetBatchMutationParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/ips/batch-delete`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetIpTags(body: API.AssetBatchUpdateTagsParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/ips/batch-update-tags`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetIpStatus(body: API.AssetBatchUpdateStatusParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/ips/batch-update-status`, {
    method: 'POST',
    body,
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

export async function batchDeleteAssetSshKeys(body: API.AssetBatchMutationParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/ssh-keys/batch-delete`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetSshKeyStatus(body: API.AssetBatchUpdateStatusParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/ssh-keys/batch-update-status`, {
    method: 'POST',
    body,
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

export async function listAssetMachineScripts(
  params?: API.AssetMachineScriptListParams,
) {
  return devAdminRequest<API.AssetPageResult<API.AssetMachineScript>>(
    `${ASSET_PREFIX}/machine-scripts`,
    {
      params: toQueryParams(params),
    },
  );
}

export async function getAssetMachineScriptDetail(scriptId: number) {
  return devAdminRequest<API.AssetMachineScript>(
    `${ASSET_PREFIX}/machine-scripts/${scriptId}`,
  );
}

export async function createAssetMachineScript(
  body: API.AssetMachineScriptUpsertParams,
) {
  return devAdminRequest<{ id: number }>(`${ASSET_PREFIX}/machine-scripts/create`, {
    method: 'POST',
    body,
  });
}

export async function updateAssetMachineScript(
  body: API.AssetMachineScriptUpsertParams & { id: number },
) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/machine-scripts/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteAssetMachineScript(id: number) {
  return devAdminRequest<{ ok: boolean }>(`${ASSET_PREFIX}/machine-scripts/delete`, {
    method: 'POST',
    body: { id },
  });
}

export async function batchDeleteAssetMachineScripts(body: API.AssetBatchMutationParams) {
  return devAdminRequest<API.AssetBatchResult>(`${ASSET_PREFIX}/machine-scripts/batch-delete`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateAssetMachineScriptStatus(
  body: API.AssetBatchUpdateStatusParams,
) {
  return devAdminRequest<API.AssetBatchResult>(
    `${ASSET_PREFIX}/machine-scripts/batch-update-status`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function runAssetMachineScript(body: API.AssetMachineScriptRunParams) {
  return devAdminRequest<API.AssetTaskAck>(`${ASSET_PREFIX}/machine-scripts/run`, {
    method: 'POST',
    body,
  });
}
