declare namespace API {
  // ── 系统状态 ─────────────────────────────────────────────────────────────────

  type SystemStatusResponse = {
    schedule: boolean;
    horizon: boolean;
    schedule_last_runtime: string | number | null;
  };

  type QueueStatsResponse = {
    failedJobs: number;
    jobsPerMinute: number | string | null;
    pausedMasters: number;
    periods: {
      failedJobs: number;
      recentJobs: number;
    };
    processes: number;
    queueWithMaxRuntime: string | Record<string, any> | null;
    queueWithMaxThroughput: string | Record<string, any> | null;
    recentJobs: number;
    status: boolean;
    wait: Record<string, number> | Array<Record<string, any>>;
  };

  type QueueWorkloadItem = {
    name: string;
    length: number;
    wait: number;
    processes: number;
    [key: string]: any;
  };

  type QueueMasterSupervisor = {
    name?: string;
    environment?: string;
    pid?: number;
    status?: string;
    supervisors?: Array<Record<string, any>>;
    [key: string]: any;
  };

  type HorizonFailedJob = {
    id: string | number;
    connection: string;
    queue: string;
    name?: string;
    displayName?: string;
    failed_at?: string;
    failedAt?: string;
    exception?: string;
    exceptionSummary?: string;
    attempts?: number;
    payload?: Record<string, any>;
  };

  type QueueRedisJobSample = {
    uuid?: string;
    displayName?: string;
    job?: string;
    attempts?: number;
    maxTries?: number | null;
    timeout?: number | null;
    backoff?: any;
    commandName?: string;
    rawPayload?: string;
    position?: number;
    available_at?: string;
    available_at_timestamp?: number;
    reserved_at?: string;
    reserved_at_timestamp?: number;
  };

  type SendWebhookFailedJob = {
    id: number;
    connection: string;
    queue: string;
    failedAt: string;
    displayName?: string;
    job?: string;
    attempts?: number;
    exceptionSummary?: string;
    payload?: Record<string, any>;
  };

  type SendWebhookSummary = {
    horizon: boolean;
    redisPrefix?: string;
    keys?: {
      pending?: string;
      delayed?: string;
      reserved?: string;
      [key: string]: string | undefined;
    };
    pendingCount: number;
    delayedCount: number;
    reservedCount: number;
    failedCount: number;
    workload?: QueueWorkloadItem[];
  };

  type SendWebhookTasksResponse = {
    queue: string;
    summary: SendWebhookSummary;
    pendingJobs: QueueRedisJobSample[];
    delayedJobs: QueueRedisJobSample[];
    reservedJobs: QueueRedisJobSample[];
    failedJobs: PageResult<SendWebhookFailedJob>;
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
