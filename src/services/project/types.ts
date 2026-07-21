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

export interface ProjectUserAppMapping {
  projectCode: string;
  packageNames: string[];
  appCount: number;
}

type NullableString = string | null;

export interface ProjectVersionRecord {
  id: number;
  projectId: number;
  projectCode: string;
  version: string;
  versionName?: string | null;
  content: string;
  releaseTime: string;
  remark: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectItem {
  id: number;
  projectCode: string;
  projectName: string;
  ownerName: string | null;
  department: string | null;
  status: 'active' | 'inactive' | 'archived';
  adStatus?: string | null;
  appPlatform?: string | null;
  isLimited?: boolean | number | string | null;
  adspowerEnv?: string | null;
  developerGmail?: string | null;
  appName?: string | null;
  packageName?: string | null;
  domainInfoStatus?: string | null;
  admobPubId?: string | null;
  domainUrl?: string | null;
  privacyPolicyUrl?: string | null;
  termsUrl?: string | null;
  facebookInfoStatus?: string | null;
  facebookAppId?: string | null;
  facebookAppToken?: string | null;
  facebookKeyHash?: string | null;
  facebookClassName?: string | null;
  admobAccountStatus?: string | null;
  admobAppId?: string | null;
  admobAdIds?: string | null;
  admobAppAdsTxt?: string | null;
  firebaseConfigNote?: string | null;
  yandexAccount?: string | null;
  yandexAdIds?: string | null;
  yandexAppAdsTxt?: string | null;
  storePageUrl?: string | null;
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
  adStatus?: string;
  packageName?: string;
  developerGmail?: string;
  ownerId?: number;
  page?: number;
  pageSize?: number;
}

export interface ProjectVersionRecordFetchRequest {
  projectId?: number;
  projectCode?: string;
  keyword?: string;
  releaseTimeFrom?: string;
  releaseTimeTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ProjectStoreRequest {
  projectCode: string;
  projectName: string;
  ownerId?: number;
  ownerName?: NullableString;
  department?: NullableString;
  status?: string;
  adStatus?: NullableString;
  appPlatform?: NullableString;
  isLimited?: boolean | number | string | null;
  adspowerEnv?: NullableString;
  developerGmail?: NullableString;
  appName?: NullableString;
  packageName?: NullableString;
  domainInfoStatus?: NullableString;
  admobPubId?: NullableString;
  domainUrl?: NullableString;
  privacyPolicyUrl?: NullableString;
  termsUrl?: NullableString;
  facebookInfoStatus?: NullableString;
  facebookAppId?: NullableString;
  facebookAppToken?: NullableString;
  facebookKeyHash?: NullableString;
  facebookClassName?: NullableString;
  admobAccountStatus?: NullableString;
  admobAppId?: NullableString;
  admobAdIds?: NullableString;
  admobAppAdsTxt?: NullableString;
  firebaseConfigNote?: NullableString;
  yandexAccount?: NullableString;
  yandexAdIds?: NullableString;
  yandexAppAdsTxt?: NullableString;
  storePageUrl?: NullableString;
  remark?: NullableString;
}

export interface ProjectUpdateRequest {
  id: number;
  projectName?: NullableString;
  ownerId?: number;
  ownerName?: NullableString;
  department?: NullableString;
  status?: string;
  adStatus?: NullableString;
  appPlatform?: NullableString;
  isLimited?: boolean | number | string | null;
  adspowerEnv?: NullableString;
  developerGmail?: NullableString;
  appName?: NullableString;
  packageName?: NullableString;
  domainInfoStatus?: NullableString;
  admobPubId?: NullableString;
  domainUrl?: NullableString;
  privacyPolicyUrl?: NullableString;
  termsUrl?: NullableString;
  facebookInfoStatus?: NullableString;
  facebookAppId?: NullableString;
  facebookAppToken?: NullableString;
  facebookKeyHash?: NullableString;
  facebookClassName?: NullableString;
  admobAccountStatus?: NullableString;
  admobAppId?: NullableString;
  admobAdIds?: NullableString;
  admobAppAdsTxt?: NullableString;
  firebaseConfigNote?: NullableString;
  yandexAccount?: NullableString;
  yandexAdIds?: NullableString;
  yandexAppAdsTxt?: NullableString;
  storePageUrl?: NullableString;
  remark?: NullableString;
}

export interface ProjectStatusUpdateRequest {
  id: number;
  status: 'active' | 'inactive' | 'archived';
}

export interface ProjectBatchUpdateAdStatusRequest {
  ids: number[];
  adStatus?: NullableString;
}

export interface ProjectBatchUpdateAdStatusResult {
  requested: number;
  updated: number;
  missingIds: number[];
}

export interface ProjectBatchUpdateAppPlatformRequest {
  ids: number[];
  appPlatform?: NullableString;
}

export interface ProjectBatchUpdateAppPlatformResult {
  requested: number;
  updated: number;
  missingIds: number[];
}

export interface ProjectBatchUpdateDepartmentRequest {
  ids: number[];
  department?: NullableString;
}

export interface ProjectBatchUpdateDepartmentResult {
  requested: number;
  updated: number;
  missingIds: number[];
}

export type ProjectCodeListItem =
  | string
  | {
      projectCode?: string | null;
      projectName?: string | null;
    };

export type ProjectCodeListResult = {
  data: ProjectCodeListItem[];
};

export type ProjectDepartmentListResult = {
  data: string[];
};

export interface ProjectBatchSaveItem {
  projectCode: string;
  projectName?: NullableString;
  ownerName?: NullableString;
  department?: NullableString;
  status?: NullableString;
  adStatus?: NullableString;
  appPlatform?: NullableString;
  adspowerEnv?: NullableString;
  developerGmail?: NullableString;
  appName?: NullableString;
  packageName?: NullableString;
  domainInfoStatus?: NullableString;
  admobPubId?: NullableString;
  domainUrl?: NullableString;
  privacyPolicyUrl?: NullableString;
  termsUrl?: NullableString;
  facebookInfoStatus?: NullableString;
  facebookAppId?: NullableString;
  facebookAppToken?: NullableString;
  facebookKeyHash?: NullableString;
  facebookClassName?: NullableString;
  admobAccountStatus?: NullableString;
  admobAppId?: NullableString;
  admobAdIds?: NullableString;
  admobAppAdsTxt?: NullableString;
  firebaseConfigNote?: NullableString;
  yandexAccount?: NullableString;
  yandexAdIds?: NullableString;
  yandexAppAdsTxt?: NullableString;
  storePageUrl?: NullableString;
  remark?: NullableString;
}

export interface ProjectBatchSaveRequest {
  items: ProjectBatchSaveItem[];
}

export interface ProjectBatchSaveResultItem {
  projectCode: string;
  action: 'created' | 'updated' | string;
  id: number;
}

export interface ProjectBatchSaveResult {
  created: number;
  updated: number;
  total: number;
  items: ProjectBatchSaveResultItem[];
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

export interface ProjectVersionRecordStoreRequest {
  projectId: number;
  version: string;
  versionName?: NullableString;
  content: string;
  releaseTime: string;
  remark?: NullableString;
}

export interface ProjectVersionRecordUpdateRequest {
  id: number;
  projectId?: number;
  version?: string;
  versionName?: NullableString;
  content?: string;
  releaseTime?: string;
  remark?: NullableString;
}

export interface ProjectVersionRecordDeleteRequest {
  id: number;
}

export interface AggregateRequest {
  projectId?: number;
  startDate: string;
  endDate: string;
}

export interface AggregateHourlyRequest {
  startDate: string;
  endDate: string;
  hourFrom?: number;
  hourTo?: number;
  projectId?: number;
}

export interface AggregateHourlyResult {
  success: boolean;
  startDate: string;
  endDate: string;
  hourFrom?: number;
  hourTo?: number;
  projectId?: number;
  exitCode?: number;
  output?: string;
}
