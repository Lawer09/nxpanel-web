import { nodeControlRequest } from './request';

export async function listRegisteredServices() {
  return nodeControlRequest<API.RegisteredServicesPayload>(
    '/v4/service-register-manager/services',
  );
}

export async function listAgents(params?: API.ControlListParams) {
  return nodeControlRequest<API.ControlPageResult<API.ControlAgent>>('/v4/nodes/agents', {
    params: params as Record<string, unknown> | undefined,
  });
}

export async function getAgentDetail(agentId: string) {
  return nodeControlRequest<API.ControlAgent>(`/v4/nodes/agents/${encodeURIComponent(agentId)}`);
}

export async function getAgentRuntime(agentId: string) {
  return nodeControlRequest<API.ControlAgentRuntime>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/runtime`,
  );
}

export async function createAgent(body: API.ControlAgentCreateParams) {
  return nodeControlRequest<{ agent: API.ControlAgent; agent_secret: string }>(
    '/v4/nodes/agents',
    {
      method: 'POST',
      body,
    },
  );
}

export async function deployAgent(body: API.ControlAgentDeployParams) {
  return nodeControlRequest<API.ControlAgentDeployResponse>('/v4/nodes/agents/deploy', {
    method: 'POST',
    body,
  });
}

export async function updateAgent(agentId: string, body: API.ControlAgentUpdateParams) {
  return nodeControlRequest<API.ControlAgent>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteAgent(agentId: string) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function resetAgentSecret(agentId: string) {
  return nodeControlRequest<{ agent: API.ControlAgent; agent_secret: string }>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/reset-secret`,
    {
      method: 'POST',
    },
  );
}

export async function listAgentBindings(agentId: string, params?: API.ControlListParams) {
  return nodeControlRequest<API.ControlPageResult<API.ControlBinding>>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/bindings`,
    {
      params: params as Record<string, unknown> | undefined,
    },
  );
}

export async function createAgentBinding(agentId: string, body: API.ControlBindingCreateParams) {
  return nodeControlRequest<API.ControlBinding>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/bindings`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function updateAgentBinding(
  agentId: string,
  nodeId: number,
  body: API.ControlBindingUpdateParams,
) {
  return nodeControlRequest<API.ControlBinding>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/bindings/${nodeId}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteAgentBinding(agentId: string, nodeId: number) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/bindings/${nodeId}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function listNodes(params?: API.ControlListParams) {
  return nodeControlRequest<API.ControlPageResult<API.ControlNode>>('/v4/nodes', {
    params: params as Record<string, unknown> | undefined,
  });
}

export async function listNodeSummaries() {
  return nodeControlRequest<API.ControlNodeSummary[]>('/v4/nodes/summary');
}

export async function getNodeDetail(nodeId: number) {
  return nodeControlRequest<API.ControlNode>(`/v4/nodes/${nodeId}`);
}

export async function getNodeRuntime(nodeId: number) {
  return nodeControlRequest<API.ControlNodeRuntime>(`/v4/nodes/${nodeId}/runtime`);
}

export async function getNodeSnapshot(nodeId: number) {
  return nodeControlRequest<API.ControlNodeSnapshot>(`/v4/nodes/${nodeId}/snapshot`);
}

export async function createNode(body: API.ControlNodeCreateParams) {
  return nodeControlRequest<API.ControlNode>('/v4/nodes', {
    method: 'POST',
    body,
  });
}

export async function updateNode(nodeId: number, body: API.ControlNodeUpdateParams) {
  return nodeControlRequest<API.ControlNode>(`/v4/nodes/${nodeId}/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteNode(nodeId: number) {
  return nodeControlRequest<{ ok: boolean }>(`/v4/nodes/${nodeId}/delete`, {
    method: 'POST',
  });
}

export async function listNodeUsers(nodeId: number, params?: { page?: number; page_size?: number }) {
  return nodeControlRequest<API.ControlPageResult<API.ControlNodeUser>>(
    `/v4/nodes/${nodeId}/users`,
    {
    params,
    },
  );
}

export async function createNodeUser(nodeId: number, body: API.ControlNodeUserCreateParams) {
  return nodeControlRequest<API.ControlNodeUser>(`/v4/nodes/${nodeId}/users`, {
    method: 'POST',
    body,
  });
}

export async function updateNodeUser(
  nodeId: number,
  userId: number,
  body: API.ControlNodeUserUpdateParams,
) {
  return nodeControlRequest<API.ControlNodeUser>(
    `/v4/nodes/${nodeId}/users/${userId}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteNodeUser(nodeId: number, userId: number) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/nodes/${nodeId}/users/${userId}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function getNodeUserClientConfig(nodeId: number, userId: number) {
  return nodeControlRequest<API.ControlNodeUserClientConfig>(
    `/v4/nodes/${nodeId}/users/${userId}/client-config`,
  );
}

export async function getUserClientConfigs(userId: number) {
  return nodeControlRequest<API.ControlUserClientConfigsResponse>(
    `/v4/nodes/users/${userId}/client-configs`,
  );
}

export async function batchCreateNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchCreateParams,
) {
  return nodeControlRequest<API.ControlNodeUser[]>(`/v4/nodes/${nodeId}/users/batch-create`, {
    method: 'POST',
    body,
  });
}

export async function batchUpdateNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchUpdateParams,
) {
  return nodeControlRequest<API.ControlNodeUser[]>(`/v4/nodes/${nodeId}/users/batch-update`, {
    method: 'POST',
    body,
  });
}

export async function batchDeleteNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchDeleteParams,
) {
  return nodeControlRequest<{ ok?: boolean; user_ids?: number[] }>(
    `/v4/nodes/${nodeId}/users/batch-delete`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function getNodesRuntimeOverview() {
  return nodeControlRequest<API.ControlRuntimeOverview>('/v4/nodes/runtime/overview');
}

export async function getAgentRuntimeSamples(
  agentId: string,
  params?: API.ControlAgentRuntimeSamplesParams,
) {
  return nodeControlRequest<API.ControlRuntimeSamplesResponse>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/runtime/samples`,
    { params: params as Record<string, unknown> | undefined },
  );
}

export async function getNodeRuntimeSamples(
  nodeId: number,
  params?: API.ControlNodeRuntimeSamplesParams,
) {
  return nodeControlRequest<API.ControlRuntimeSamplesResponse>(`/v4/nodes/${nodeId}/runtime/samples`, {
    params: params as Record<string, unknown> | undefined,
  });
}

export async function getAgentTrafficSeries(
  agentId: string,
  params?: API.ControlAgentTrafficParams,
) {
  return nodeControlRequest<API.ControlTrafficSeriesResponse>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/traffic`,
    { params: params as Record<string, unknown> | undefined },
  );
}

export async function getNodeTrafficSeries(
  nodeId: number,
  params?: API.ControlNodeTrafficParams,
) {
  return nodeControlRequest<API.ControlTrafficSeriesResponse>(`/v4/nodes/${nodeId}/traffic`, {
    params: params as Record<string, unknown> | undefined,
  });
}

export async function getNodeOnlineSummary(
  nodeId: number,
  params?: API.ControlNodeOnlineParams,
) {
  return nodeControlRequest<API.ControlNodeOnlineSummary>(`/v4/nodes/${nodeId}/online`, {
    params: params as Record<string, unknown> | undefined,
  });
}

export async function listAgentRuntimeEvents(
  agentId: string,
  params?: API.ControlAgentRuntimeEventsParams,
) {
  return nodeControlRequest<API.ControlRuntimeEvent[]>(
    `/v4/nodes/agents/${encodeURIComponent(agentId)}/events`,
    { params: params as Record<string, unknown> | undefined },
  );
}

export async function listNodeRuntimeEvents(
  nodeId: number,
  params?: API.ControlNodeRuntimeEventsParams,
) {
  return nodeControlRequest<API.ControlRuntimeEvent[]>(`/v4/nodes/${nodeId}/events`, {
    params: params as Record<string, unknown> | undefined,
  });
}
