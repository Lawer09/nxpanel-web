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

type NullableString = string | null;

export interface ProjectItem {
  id: number;
  projectCode: string;
  projectName: string;
  ownerName: string | null;
  department: string | null;
  status: 'active' | 'inactive' | 'archived';
  adStatus?: string | null;
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

export interface ProjectStoreRequest {
  projectCode: string;
  projectName: string;
  ownerId?: number;
  ownerName?: NullableString;
  department?: NullableString;
  status?: string;
  adStatus?: NullableString;
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
  projectId: number;
  startDate: string;
  endDate: string;
}
