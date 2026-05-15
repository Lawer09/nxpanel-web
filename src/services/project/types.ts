export interface ProjectTrafficAccount {
  id: number;
  trafficPlatformAccountId: number;
  platformCode: string;
  externalUid: string | null;
  externalUsername: string | null;
  bindType: string;
  enabled: number;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectAdAccount {
  id: number;
  adPlatformAccountId: number;
  platformCode: string;
  externalAppId: string | null;
  externalAdUnitId: string | null;
  bindType: string;
  enabled: number;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectUserApp {
  id: number;
  appId: string;
  enabled: number;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectItem {
  id: number;
  projectCode: string;
  projectName: string;
  ownerName: string;
  department: string;
  status: 'active' | 'inactive' | 'archived';
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  trafficAccounts: ProjectTrafficAccount[];
  adAccounts: ProjectAdAccount[];
  userApps: ProjectUserApp[];
}

export interface ProjectFetchRequest {
  keyword?: string;
  status?: string;
  ownerId?: number;
  page?: number;
  pageSize?: number;
}

export interface ProjectStoreRequest {
  projectCode: string;
  projectName: string;
  ownerId?: number;
  ownerName?: string;
  department?: string;
  status?: string;
  remark?: string;
}

export interface ProjectUpdateRequest {
  id: number;
  projectName?: string;
  ownerId?: number;
  ownerName?: string;
  department?: string;
  status?: string;
  remark?: string;
}

export interface ProjectStatusUpdateRequest {
  id: number;
  status: 'active' | 'inactive' | 'archived';
}

export interface ProjectTrafficAccountStoreRequest {
  projectId: number;
  trafficPlatformAccountId: number;
  platformCode: string;
  externalUid?: string;
  externalUsername?: string;
  bindType: string;
  enabled?: number;
  remark?: string;
}

export interface ProjectTrafficAccountUpdateRequest {
  id: number;
  projectId: number;
  enabled?: number;
  remark?: string;
}

export interface ProjectAdAccountStoreRequest {
  projectId: number;
  adPlatformAccountId: number;
  platformCode: string;
  externalAppId?: string;
  externalAdUnitId?: string;
  bindType: string;
  enabled?: number;
  remark?: string;
}

export interface ProjectAdAccountUpdateRequest {
  id: number;
  projectId: number;
  enabled?: number;
  remark?: string;
}

export interface ProjectUserAppStoreRequest {
  projectId: number;
  appId: string;
  enabled?: number;
  remark?: string;
}

export interface ProjectUserAppUpdateRequest {
  id: number;
  projectId: number;
  enabled?: number;
  remark?: string;
}

export interface ProjectResourceIdRequest {
  id: number;
  projectId: number;
}

export interface AggregateRequest {
  startDate: string;
  endDate: string;
}
