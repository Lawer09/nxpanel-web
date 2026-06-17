import { nodeControlRequest } from './request';

export async function listRegisteredServices() {
  return nodeControlRequest<API.RegisteredServicesPayload>(
    '/v4/service-register-manager/services',
  );
}

export async function listAgents() {
  return nodeControlRequest<API.ControlAgent[]>('/v4/control/agents');
}

export async function getAgentDetail(agentId: string) {
  return nodeControlRequest<API.ControlAgent>(`/v4/control/agents/${encodeURIComponent(agentId)}`);
}

export async function getAgentRuntime(agentId: string) {
  return nodeControlRequest<API.ControlAgentRuntime>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/runtime`,
  );
}

export async function createAgent(body: API.ControlAgentCreateParams) {
  return nodeControlRequest<{ agent: API.ControlAgent; agent_secret: string }>(
    '/v4/control/agents',
    {
      method: 'POST',
      body,
    },
  );
}

export async function updateAgent(agentId: string, body: API.ControlAgentUpdateParams) {
  return nodeControlRequest<API.ControlAgent>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteAgent(agentId: string) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function resetAgentSecret(agentId: string) {
  return nodeControlRequest<{ agent: API.ControlAgent; agent_secret: string }>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/reset-secret`,
    {
      method: 'POST',
    },
  );
}

export async function listAgentBindings(agentId: string) {
  return nodeControlRequest<API.ControlBinding[]>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/bindings`,
  );
}

export async function createAgentBinding(agentId: string, body: API.ControlBindingCreateParams) {
  return nodeControlRequest<API.ControlBinding>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/bindings`,
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
    `/v4/control/agents/${encodeURIComponent(agentId)}/bindings/${nodeId}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteAgentBinding(agentId: string, nodeId: number) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/control/agents/${encodeURIComponent(agentId)}/bindings/${nodeId}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function listNodes() {
  return nodeControlRequest<API.ControlNode[]>('/v4/control/nodes');
}

export async function listNodeSummaries() {
  return nodeControlRequest<API.ControlNodeSummary[]>('/v4/control/nodes/summary');
}

export async function getNodeDetail(nodeId: number) {
  return nodeControlRequest<API.ControlNode>(`/v4/control/nodes/${nodeId}`);
}

export async function getNodeRuntime(nodeId: number) {
  return nodeControlRequest<API.ControlNodeRuntime>(`/v4/control/nodes/${nodeId}/runtime`);
}

export async function getNodeSnapshot(nodeId: number) {
  return nodeControlRequest<API.ControlNodeSnapshot>(`/v4/control/nodes/${nodeId}/snapshot`);
}

export async function createNode(body: API.ControlNodeCreateParams) {
  return nodeControlRequest<API.ControlNode>('/v4/control/nodes', {
    method: 'POST',
    body,
  });
}

export async function updateNode(nodeId: number, body: API.ControlNodeUpdateParams) {
  return nodeControlRequest<API.ControlNode>(`/v4/control/nodes/${nodeId}/update`, {
    method: 'POST',
    body,
  });
}

export async function deleteNode(nodeId: number) {
  return nodeControlRequest<{ ok: boolean }>(`/v4/control/nodes/${nodeId}/delete`, {
    method: 'POST',
  });
}

export async function listNodeUsers(nodeId: number, params?: { page?: number; page_size?: number }) {
  return nodeControlRequest<API.ControlNodeUser[]>(`/v4/control/nodes/${nodeId}/users`, {
    params,
  });
}

export async function createNodeUser(nodeId: number, body: API.ControlNodeUserCreateParams) {
  return nodeControlRequest<API.ControlNodeUser>(`/v4/control/nodes/${nodeId}/users`, {
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
    `/v4/control/nodes/${nodeId}/users/${userId}/update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function deleteNodeUser(nodeId: number, userId: number) {
  return nodeControlRequest<{ ok: boolean }>(
    `/v4/control/nodes/${nodeId}/users/${userId}/delete`,
    {
      method: 'POST',
    },
  );
}

export async function getNodeUserClientConfig(nodeId: number, userId: number) {
  return nodeControlRequest<API.ControlNodeUserClientConfig>(
    `/v4/control/nodes/${nodeId}/users/${userId}/client-config`,
  );
}

export async function batchCreateNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchCreateParams,
) {
  return nodeControlRequest<API.ControlNodeUser[]>(
    `/v4/control/nodes/${nodeId}/users/batch-create`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function batchUpdateNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchUpdateParams,
) {
  return nodeControlRequest<API.ControlNodeUser[]>(
    `/v4/control/nodes/${nodeId}/users/batch-update`,
    {
      method: 'POST',
      body,
    },
  );
}

export async function batchDeleteNodeUsers(
  nodeId: number,
  body: API.ControlNodeUserBatchDeleteParams,
) {
  return nodeControlRequest<{ ok?: boolean; user_ids?: number[] }>(
    `/v4/control/nodes/${nodeId}/users/batch-delete`,
    {
      method: 'POST',
      body,
    },
  );
}
