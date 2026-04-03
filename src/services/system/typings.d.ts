declare namespace API {
  // ── 系统状态 ─────────────────────────────────────────────────────────────────

  type SystemStatusResponse = {
    schedule: boolean;
    horizon: boolean;
    schedule_last_runtime: number | null;
  };

  type QueueStatsResponse = {
    failedJobs: number;
    jobsPerMinute: number;
    pausedMasters: number;
    periods: {
      failedJobs: number;
      recentJobs: number;
    };
    processes: number;
    queueWithMaxRuntime: string;
    queueWithMaxThroughput: string;
    recentJobs: number;
    status: boolean;
    wait: Record<string, number>;
  };

  type QueueWorkloadItem = {
    name: string;
    length: number;
    wait: number;
    processes: number;
  };

  type HorizonFailedJob = {
    id: string;
    connection: string;
    queue: string;
    name: string;
    failed_at: string;
    exception: string;
  };

  type AuditLogItem = {
    id: number;
    admin_id: number;
    action: string;
    uri: string;
    request_data: string;
    ip: string;
    created_at: number;
    admin: {
      id: number;
      email: string;
    };
  };
}
