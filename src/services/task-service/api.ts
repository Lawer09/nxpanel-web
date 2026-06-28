import { devAdminRequest } from '@/services/dev-admin/request';

const TASK_PREFIX = '/v4/tasks';

export async function getTaskDetail(taskId: number) {
  return devAdminRequest<API.TaskServiceTask>(`${TASK_PREFIX}/${taskId}`);
}

export async function listTaskItems(
  taskId: number,
  params?: {
    page?: number;
    page_size?: number;
  },
) {
  return devAdminRequest<API.TaskServicePageResult<API.TaskServiceTaskItem>>(
    `${TASK_PREFIX}/${taskId}/items`,
    {
      params,
    },
  );
}

export async function listTaskEvents(
  taskId: number,
  params?: {
    page?: number;
    page_size?: number;
  },
) {
  return devAdminRequest<API.TaskServicePageResult<API.TaskServiceTaskEvent>>(
    `${TASK_PREFIX}/${taskId}/events`,
    {
      params,
    },
  );
}
