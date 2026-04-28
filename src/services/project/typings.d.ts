declare namespace API {
  // ── 项目 ────────────────────────────────────────────────────────────────

  interface ProjectItem {
    id: number;
    projectCode: string;
    projectName: string;
    ownerId: number;
    ownerName: string;
    department: string;
    status: 'active' | 'inactive' | 'archived';
    remark: string;
    createdAt: string;
    updatedAt: string;
  }

  interface ProjectQuery {
    keyword?: string;
    ownerId?: number;
    status?: 'active' | 'inactive' | 'archived';
    page?: number;
    pageSize?: number;
  }

  interface ProjectCreateParams {
    projectCode: string;
    projectName: string;
    ownerId: number;
    ownerName: string;
    department: string;
    status?: 'active' | 'inactive' | 'archived';
    remark?: string;
  }

  interface ProjectUpdateParams {
    projectName?: string;
    ownerId?: number;
    ownerName?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'archived';
    remark?: string;
  }

  // ── 项目关联流量账号 ──────────────────────────────────────────────────────────

  interface ProjectTrafficAccountItem {
    id: number;
    projectId: number;
    projectCode: string;
    trafficPlatformAccountId: number;
    platformCode: string;
    accountName: string;
    externalUid: string;
    externalUsername: string;
    bindType: 'account' | 'sub_account';
    enabled: number;
    remark: string;
  }

  interface ProjectTrafficAccountQuery {
    platformCode?: string;
    enabled?: number;
  }

  interface ProjectTrafficAccountCreateParams {
    trafficPlatformAccountId: number;
    platformCode: string;
    externalUid?: string;
    externalUsername?: string;
    bindType: 'account' | 'sub_account';
    enabled?: number;
    remark?: string;
  }

  interface ProjectTrafficAccountUpdateParams {
    externalUid?: string;
    externalUsername?: string;
    bindType?: 'account' | 'sub_account';
    enabled?: number;
    remark?: string;
  }

  // ── 项目关联广告账号 ──────────────────────────────────────────────────────────

  interface ProjectAdAccountItem {
    id: number;
    projectId: number;
    projectCode: string;
    adPlatformAccountId: number;
    platformCode: string;
    accountName: string;
    externalAppId: string;
    externalAdUnitId: string;
    bindType: 'account' | 'app' | 'ad_unit';
    enabled: number;
    remark: string;
  }

  interface ProjectAdAccountQuery {
    platformCode?: string;
    enabled?: number;
  }

  interface ProjectAdAccountCreateParams {
    adPlatformAccountId: number;
    platformCode: string;
    externalAppId?: string;
    externalAdUnitId?: string;
    bindType: 'account' | 'app' | 'ad_unit';
    enabled?: number;
    remark?: string;
  }

  interface ProjectAdAccountUpdateParams {
    externalAppId?: string;
    externalAdUnitId?: string;
    bindType?: 'account' | 'app' | 'ad_unit';
    enabled?: number;
    remark?: string;
  }
}
