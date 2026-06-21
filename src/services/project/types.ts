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
  appLink: string | null;
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
  adStatus?: string | null;
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
  adStatus?: string;
  remark?: string;
}

export interface ProjectUpdateRequest {
  id: number;
  projectName?: string;
  ownerId?: number;
  ownerName?: string;
  department?: string;
  status?: string;
  adStatus?: string;
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
  appLink?: string;
  enabled?: number;
  remark?: string;
}

export interface ProjectUserAppUpdateRequest {
  id: number;
  projectId: number;
  appLink?: string;
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
