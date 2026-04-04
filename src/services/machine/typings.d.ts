declare namespace API {
  // ── 机器 ─────────────────────────────────────────────────────────────────────

  interface Machine {
    id?: number;
    name: string;
    hostname: string;
    ip_address: string;
    port: number;
    username: string;
    password?: string;
    private_key?: string;
    status?: 'online' | 'offline' | 'error';
    os_type?: string;
    cpu_cores?: string;
    memory?: string;
    disk?: string;
    gpu_info?: string;
    bandwidth?: number;
    provider?: number;
    price?: number;
    pay_mode?: number;
    tags?: string;
    description?: string;
    is_active?: boolean;
    provider_instance_id?: string;
    last_check_at?: string;
    created_at?: string;
    updated_at?: string;
  }

  // ── 机器部署任务 ──────────────────────────────────────────────────────────────

  interface DeployTaskItem {
    task_id: number;
    machine_id: number;
    status: DeployTaskStatus;
  }

  interface BatchDeployResult {
    batch_id: number;
    task_count: number;
    tasks: DeployTaskItem[];
  }

  interface DeployTaskDetail {
    id: number;
    batch_id?: number | null;
    machine_id: number;
    server_id?: number | null;
    status: DeployTaskStatus;
    output?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
    machine?: { id: number; name: string; ip_address: string } | null;
    server?: { id: number; name: string } | null;
  }

  interface BatchDeployStatus {
    summary: {
      total: number;
      pending: number;
      running: number;
      success: number;
      failed: number;
    };
    tasks: DeployTaskDetail[];
  }
}
