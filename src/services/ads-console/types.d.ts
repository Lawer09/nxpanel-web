declare namespace AdsConsole {
  type Result<T = any> = {
    success: boolean;
    errorCode: number;
    errorMessage: string;
    data: T;
  };

  type PageResult<T> = {
    records: T[];
    total: number;
    size?: number;
    current?: number;
    pages?: number;
  };

  type SelectOptionVO = {
    label: string;
    value: number;
  };

  type SelectOption = {
    label: string;
    value: string | number;
  };

  type LoginData = {
    token: string;
    userId: number;
    username: string;
    realName: string;
    avatar?: string;
    permissions: string[];
    roles: string[];
    version?: string;
    teamId?: number;
    teamName?: string;
    agencyNames?: string[];
    groupNames?: string[];
  };

  type CurrentUser = API.CurrentUser & {
    id?: number;
    userId?: number;
    username?: string;
    realName?: string;
    roles?: string[];
    permissions?: string[];
    isSuperAdmin?: boolean;
    teamId?: number;
    teamName?: string;
    agencyNames?: string[];
    groupNames?: string[];
  };

  type DashboardMetric = {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
    cpa: number;
    roas: number;
    spendGrowth?: number;
    impressionsGrowth?: number;
    clicksGrowth?: number;
    conversionsGrowth?: number;
    roasGrowth?: number;
  };

  type DashboardTrend = DashboardMetric & {
    date: string;
  };

  type DashboardTeamOption = {
    id: number;
    name: string;
  };

  type DashboardOverview = {
    teamCount: number;
    agencyCount: number;
    groupCount: number;
    accountCount: number;
    activeAccountCount: number;
    campaignCount: number;
    activeCampaignCount: number;
    adsetCount: number;
    activeAdsetCount: number;
    adCount: number;
    activeAdCount: number;
    creativeCount: number;
  };

  type DashboardTeamSummary = {
    teamId: number;
    teamName: string;
    accountCount: number;
    activeAccountCount: number;
    campaignCount: number;
    activeCampaignCount: number;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
  };

  type DashboardCampaignRank = {
    id: number;
    campaignId: string;
    name: string;
    accountId: string;
    accountName: string;
    teamId?: number;
    teamName?: string;
    groupId?: number;
    groupName?: string;
    effectiveStatus?: string;
    currency?: string;
    budget?: number;
    budgetType?: 'daily' | 'lifetime';
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
  };

  type DashboardAccountRisk = {
    id: number;
    accountId: string;
    name: string;
    teamId?: number;
    teamName?: string;
    groupId?: number;
    groupName?: string;
    currency?: string;
    balance?: number;
    spendCap?: number;
    amountSpent?: number;
    availableCap?: number;
    accountStatus?: number;
    lastSyncTime?: string;
    spend: number;
  };

  type DashboardGroupSummary = {
    groupId: number;
    groupName: string;
    teamId?: number;
    teamName?: string;
    accountCount: number;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
  };

  type DashboardUserSummary = {
    userId: number;
    username: string;
    nickname?: string;
    teamId?: number;
    teamName?: string;
    accountCount: number;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
  };

  type DashboardData = {
    superAdmin: boolean;
    selectedTeamId?: number;
    selectedTeamName?: string;
    today: string;
    startDate: string;
    endDate: string;
    teams: DashboardTeamOption[];
    todayStats: DashboardMetric;
    periodStats: DashboardMetric;
    overview: DashboardOverview;
    trends: DashboardTrend[];
    teamSummaries: DashboardTeamSummary[];
    topCampaigns: DashboardCampaignRank[];
    accountRisks: DashboardAccountRisk[];
    groupSummaries: DashboardGroupSummary[];
    userSummaries: DashboardUserSummary[];
  };

  type ReportObjectName = 'account' | 'campaign' | 'adset';
  type HourReportObjectName = 'account' | 'campaign' | 'adset' | 'ad';

  type OverallReportDimension =
    | 'date'
    | 'object_id'
    | 'country'
    | 'group_id'
    | 'agency_id';
  type OverallHourReportDimension =
    | 'date'
    | 'hour'
    | 'object_id'
    | 'group_id'
    | 'agency_id';
  type OverallHourReportMetric =
    | 'spend'
    | 'impressions'
    | 'clicks'
    | 'ctr'
    | 'cpm'
    | 'cpc'
    | 'roas';
  type EventReportDimension =
    | 'date'
    | 'object_id'
    | 'country'
    | 'action_type'
    | 'group_id';

  type ReportMetric =
    | 'spend'
    | 'impressions'
    | 'clicks'
    | 'reach'
    | 'frequency'
    | 'ctr'
    | 'cpm'
    | 'cpc'
    | 'cvr'
    | 'roas'
    | 'ecpm'
    | 'profit'
    | 'roi'
    | 'action_count'
    | 'cpa'
    | 'installs'
    | 'cpi'
    | 'cr';

  type RptOverallDayVO = {
    id: string;
    objectId: string;
    objectName: ReportObjectName;
    groupId?: string;
    groupName?: string;
    agencyId?: string;
    date: string;
    country?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    frequency?: number;
    spend?: number;
    ctr?: number;
    cpm?: number;
    cpc?: number;
    cvr?: number;
    roas?: number;
    cpa?: number;
    ecpm?: number;
    profit?: number;
    roi?: number;
    installs?: number;
    cpi?: number;
    cr?: number;
  };

  type RptOverallDayPageQuery = {
    current?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    objectName: ReportObjectName;
    objectId?: string;
    accountId?: string;
    campaignId?: string;
    groupId?: string;
    agencyId?: string;
    objectIds?: string[];
    accountIds?: string[];
    campaignIds?: string[];
    groupIds?: string[];
    agencyIds?: string[];
    countries?: string[];
    country?: string;
    dims?: OverallReportDimension[];
    metrics?: ReportMetric[];
  };

  type RptOverallHourVO = {
    objectId: string;
    objectName: HourReportObjectName;
    groupId?: string;
    groupName?: string;
    agencyId?: string;
    date: string;
    hour?: number;
    impressions?: number;
    clicks?: number;
    spend?: number;
    ctr?: number;
    cpm?: number;
    cpc?: number;
    roas?: number;
  };

  type RptOverallHourPageQuery = {
    current?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    objectName: HourReportObjectName;
    objectId?: string;
    accountId?: string;
    campaignId?: string;
    groupId?: string;
    agencyId?: string;
    hour?: number;
    dims?: OverallHourReportDimension[];
    metrics?: OverallHourReportMetric[];
  };

  type RptEventDayVO = {
    id: string;
    objectId?: string;
    objectName?: ReportObjectName;
    groupId?: string;
    groupName?: string;
    date?: string;
    country?: string;
    actionType?: string;
    actionCount?: number;
    cpa?: number;
  };

  type RptEventDayPageQuery = {
    current?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    objectName: ReportObjectName;
    objectId?: string;
    accountId?: string;
    campaignId?: string;
    groupId?: string;
    country?: string;
    actionType?: string;
    dims?: EventReportDimension[];
    metrics?: ReportMetric[];
  };

  type AdsAccountManage = {
    id: string;
    accountId: string;
    name?: string;
    agencyId?: string;
    agencyName?: string;
    teamId?: string;
    teamName?: string;
    userId?: string;
    username?: string;
    groupId?: string;
    groupName?: string;
    currency?: string;
    balance?: number;
    spendCap?: number;
    amountSpent?: number;
    availableCap?: number;
    timezoneName?: string;
    accountStatus?: number;
    lastSyncTime?: string;
  };

  type FbBm = {
    id: string;
    bmId?: string;
    name?: string;
    tokenId?: string;
    tokenRemark?: string;
    fbUserId?: string;
    accountCount?: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
  };

  type SysChangelog = {
    id: number;
    version: string;
    title: string;
    content: string;
    status: number;
    publishTime?: string;
    createTime?: string;
    read?: boolean;
  };

  type AdsAgency = {
    id: string;
    name: string;
    teamId?: string;
    teamName?: string;
    contact?: string;
    email?: string;
    remark?: string;
    status: number;
    createTime?: string;
    updateTime?: string;
    bmCount?: number;
  };

  type OrgTeam = {
    id: string;
    name: string;
    ownerUserId?: string;
    ownerUserName?: string;
    status: number;
    memberCount?: number;
    userCount?: number;
    agencyCount?: number;
    groupCount?: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
  };

  type SysRoleSimple = {
    id: string;
    name: string;
    code: string;
  };

  type SysUser = {
    id: string;
    username: string;
    nickname: string;
    teamId?: string;
    teamName?: string;
    teamLeader?: boolean;
    email?: string;
    phone?: string;
    avatar?: string;
    status: number;
    roles?: SysRoleSimple[];
    remark?: string;
    lastLoginTime?: string;
    createTime?: string;
    updateTime?: string;
  };

  type AdsProject = {
    id: string;
    teamId?: string;
    teamName?: string;
    name: string;
    status: number;
    remark?: string;
    createTime?: string;
    userCount?: number;
    accountCount?: number;
    targetEvent?: string;
    targetCountry?: string;
  };

  type AdsProjectAccount = {
    id?: string;
    name?: string;
    accountId?: string;
    accountStatus?: number;
    currency?: string;
  };

  type AdsProjectUser = {
    id: string;
    username: string;
    nickname: string;
    status?: number;
  };

  type AdsAccount = {
    id: string;
    accountId?: string;
    name?: string;
    agencyId?: string;
    agencyName?: string;
    userId?: string;
    username?: string;
    groupId?: string;
    groupName?: string;
    teamId?: string;
    teamName?: string;
    currency?: string;
    balance?: number;
    spendCap?: number;
    amountSpent?: number;
    availableCap?: number;
    targetEvent?: string;
    targetCountry?: string;
    accountStatus?: number;
    syncStatus?: number;
    syncTime?: string;
    syncMsg?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    ctr?: number;
    spend?: number;
    cpc?: number;
    cpm?: number;
    frequency?: number;
    roas?: number;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountrySpend?: number;
  };

  type AdsAccountInsightEvent = {
    actionType: string;
    actionCount: string;
    costPerAction: number;
  };

  type AdsAccountEventInsight = {
    actionType: string;
    actionCount: number;
    costPerAction: number;
  };

  type AdsAccountCountryInsight = {
    country: string;
    spend: number;
  };

  type AdsAccountInsight = {
    id: string;
    accountId: string;
    name?: string;
    accountStatus?: number;
    syncStatus?: number;
    syncTime?: string;
    userId?: string;
    username?: string;
    groupId?: string;
    groupName?: string;
    date: string;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    spend: number;
    cpc: number;
    cpm: number;
    frequency: number;
    roas?: number;
    currency?: string;
    balance?: number;
    spendCap?: number;
    amountSpent?: number;
    availableCap?: number;
    events?: AdsAccountInsightEvent[];
    syncMsg?: string;
    targetEvent?: string;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountry?: string;
    targetCountrySpend?: number;
  };

  type AdsCampaign = {
    id: string;
    accountId: string | number;
    accountName?: string;
    campaignId: string | number;
    name: string;
    objective?: string;
    bidStrategy?: string;
    buyingType?: string;
    spendCap?: string | number;
    dailyBudget?: string | number;
    lifetimeBudget?: string | number;
    startTime?: string;
    stopTime?: string;
    createdTime?: string;
    updatedTime?: string;
    effectiveStatus?: string;
    status?: string | number;
    createTime?: string;
    updateTime?: string;
    remark?: string;
    syncStatus?: number;
    syncMsg?: string;
    syncTime?: string;
    currency?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    ctr?: number;
    spend?: number;
    cpc?: number;
    cpm?: number;
    frequency?: number;
    roas?: number;
    targetEvent?: string;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountry?: string;
    targetCountrySpend?: number;
  };

  type AdsAdset = {
    id: string;
    name: string;
    accountId: string | number;
    accountName?: string;
    campaignId: string | number;
    campaignName?: string;
    adsetId?: string | number;
    ageMin?: number;
    ageMax?: number;
    gender?: number;
    genders?: number[];
    placements?: string;
    bidStrategy?: string;
    bidAmount?: number;
    dailyBudget?: string | number;
    lifetimeBudget?: string | number;
    status?: string | number;
    effectiveStatus?: string;
    todaySpend?: number;
    createTime?: string;
    updateTime?: string;
    remark?: string;
    syncStatus?: number;
    syncMsg?: string;
    syncTime?: string;
    currency?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    ctr?: number;
    spend?: number;
    cpc?: number;
    cpm?: number;
    frequency?: number;
    roas?: number;
    targetEvent?: string;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountry?: string;
    targetCountrySpend?: number;
  };

  type AdsAd = {
    id: string;
    tenantId?: number;
    accountId?: string;
    accountName?: string;
    campaignId?: string;
    campaignName?: string;
    adsetId?: string;
    adsetName?: string;
    adId?: string;
    creativeId?: string;
    name: string;
    status?: string;
    effectiveStatus?: string;
    createTime?: string;
    updateTime?: string;
    remark?: string;
    syncStatus?: number;
    syncMsg?: string;
    syncTime?: string;
    currency?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    ctr?: number;
    spend?: number;
    cpc?: number;
    cpm?: number;
    frequency?: number;
    roas?: number;
    targetEvent?: string;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountry?: string;
    targetCountrySpend?: number;
  };

  type AdsCreative = {
    id: string;
    accountId?: string;
    accountName?: string;
    campaignId?: string;
    campaignName?: string;
    adsetId?: string;
    adsetName?: string;
    adId?: string;
    adName?: string;
    creativeId?: string;
    name?: string;
    creativeType?: number;
    title?: string;
    body?: string;
    cta?: string;
    callToAction?: string;
    landingUrl?: string;
    mediaUrls?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
    status?: string;
    targetEvent?: string;
    targetCountry?: string;
    syncStatus?: number;
    syncMsg?: string;
    syncTime?: string;
    currency?: string;
    impressions?: number;
    clicks?: number;
    reach?: number;
    ctr?: number;
    spend?: number;
    cpc?: number;
    cpm?: number;
    frequency?: number;
    roas?: number;
    targetEventCount?: number;
    targetEventCost?: number;
    targetCountrySpend?: number;
    createTime?: string;
  };

  type SysRole = {
    id: string;
    name: string;
    code: string;
    status: number;
    sort?: number;
    remark?: string;
    permissionIds?: string[];
    createTime?: string;
  };

  type SysPermission = {
    id: string;
    parentId: string;
    name: string;
    type: number;
    code?: string;
    path?: string;
    component?: string;
    icon?: string;
    sort?: number;
    status: number;
    remark?: string;
    children?: SysPermission[];
  };

  type RouteMenuItem = {
    id: string;
    name: string;
    path: string;
    component: string | null;
    meta: {
      title: string;
      icon?: string;
      sort?: number;
      hidden?: boolean;
    };
    children?: RouteMenuItem[] | null;
  };

  type SysDictType = {
    id: string;
    name: string;
    typeCode: string;
    status: number;
    remark?: string;
    createTime?: string;
  };

  type SysDictData = {
    id: string;
    dictTypeId: number;
    typeCode: string;
    label: string;
    value: string;
    listClass?: string;
    sort?: number;
    status: number;
    remark?: string;
    createTime?: string;
  };

  type SysTenant = {
    id: string;
    name: string;
    code: string;
    status: number;
    expireTime?: string;
    contact?: string;
    contactPhone?: string;
    domain?: string;
    remark?: string;
    createTime?: string;
  };

  type SysTenantDomain = {
    id: string;
    tenantId: number;
    domain: string;
    remark?: string;
    createTime?: string;
  };

  type SysOperationLog = {
    id: string;
    operatorId?: string;
    operatorName?: string;
    module?: string;
    operation?: string;
    requestMethod?: string;
    requestUrl?: string;
    method?: string;
    requestParams?: string;
    responseData?: string;
    ip?: string;
    costTime?: number;
    status: number;
    errorMsg?: string;
    createTime?: string;
  };

  type SysChangelogReadUser = {
    userId: number;
    username: string;
    nickname?: string;
    email?: string;
    status: number;
    read: boolean;
    readTime?: string;
  };

  type SysChangelogReadStats = {
    changelogId: number;
    version: string;
    title: string;
    publishTime?: string;
    totalUserCount: number;
    readCount: number;
    unreadCount: number;
    readRate: number;
    page: PageResult<SysChangelogReadUser>;
  };

  type SysChangelogSaveDTO = {
    id?: number;
    version: string;
    title: string;
    content: string;
  };

  type FbToken = {
    id: string;
    token?: string;
    appId?: string;
    appSecret?: string;
    fbUserId?: string;
    fbUserName?: string;
    status: number;
    tokenLifeType?: string;
    tokenExpiresAt?: string;
    tokenLastCheckedAt?: string;
    tokenCheckMsg?: string;
    lastSyncStatus?: number;
    lastSyncTime?: string;
    lastSyncMsg?: string;
    remark?: string;
    createTime?: string;
    accountCount?: number;
  };
}
