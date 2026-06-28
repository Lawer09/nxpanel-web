declare namespace API {
  interface TaskServicePageResult<T> {
    items: T[];
    page?: number;
    page_size?: number;
    total?: number;
  }

  interface TaskServiceTask {
    id?: number;
    task_id?: number;
    type?: string;
    name?: string;
    status?: string;
    target_type?: string;
    target_id?: string | number;
    progress?: number;
    request_json?: Record<string, any> | null;
    result_json?: Record<string, any> | null;
    error_summary?: string;
    created_by?: number | string;
    started_at?: string | null;
    finished_at?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface TaskServiceTaskItem {
    id?: number;
    task_id?: number;
    status?: string;
    target_id?: string | number;
    target_type?: string;
    error_summary?: string;
    request_json?: Record<string, any> | null;
    result_json?: Record<string, any> | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
  }

  interface TaskServiceTaskEvent {
    id?: number;
    task_id?: number;
    event_type?: string;
    level?: string;
    message?: string;
    payload_json?: Record<string, any> | null;
    created_at?: string;
    [key: string]: any;
  }
}
