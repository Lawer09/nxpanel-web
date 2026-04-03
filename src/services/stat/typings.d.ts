declare namespace API {
  // ── 统计 ─────────────────────────────────────────────────────────────────────

  interface StatUserRecord {
    user_id: number;
    u: number;
    d: number;
    record_at: number;
  }

  interface StatUserPageData {
    data: StatUserRecord[];
    total: number;
    page: number;
    pageSize: number;
  }

  interface TrafficRankItem {
    id: string;
    name: string;
    value: number;
    previousValue: number;
    change: number;
    timestamp: string;
  }

  interface TrafficRankData {
    timestamp: string;
    list: TrafficRankItem[];
  }

  interface UserConsumptionRankItem {
    user_id: number;
    email: string;
    u: number;
    d: number;
    total: number;
  }

  interface UserConsumptionRankData {
    list: UserConsumptionRankItem[];
  }

  interface ServerRankItem {
    server_name: string;
    server_id: number;
    server_type: string;
    u: number;
    d: number;
    total: number;
  }

  interface StatServerItem {
    id: number;
    server_id: number;
    server_name: string;
    server_type: string;
    u: number;
    d: number;
    total: number;
    record_at?: number;
  }

  interface StatServerDetailItem {
    server_id: number;
    server_name: string;
    server_type: string;
    u: number;
    d: number;
    total: number;
    record_at: number;
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
  }

  interface StatServerDetailPageData {
    total: number;
    data: StatServerDetailItem[];
  }

  interface StatServerPageData {
    total: number;
    data: StatServerItem[];
  }

  interface ServerRankData {
    list: ServerRankItem[];
  }

  interface ServerTrafficRankItem {
    server_id: number;
    server_type: string;
    u: number;
    d: number;
    total: number;
  }

  interface ServerTrafficRankData {
    list: ServerTrafficRankItem[];
  }

  interface StatTrafficStat {
    upload: number;
    download: number;
    total: number;
  }

  interface StatOverviewData {
    onlineNodes?: number;
    onlineUsers?: number;
    onlineDevices?: number;
    todayTraffic?: StatTrafficStat;
    monthTraffic?: StatTrafficStat;
    totalTraffic?: StatTrafficStat;
    todayIncome?: number;
    dayIncomeGrowth?: number;
    currentMonthIncome?: number;
    monthIncomeGrowth?: number;
    currentMonthNewUsers?: number;
    totalUsers?: number;
    activeUsers?: number;
    ticketPendingTotal?: number;
    commissionPendingTotal?: number;
  }

}