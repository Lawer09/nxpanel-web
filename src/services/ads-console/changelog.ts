import {request} from '@umijs/max';

// ===== 管理端接口 =====

/** 分页查询（含草稿） */
export async function getChangelogPage(params: {
  current?: number;
  size?: number;
  version?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysChangelog>>>('/ads-api/sys/changelog/page', {
    method: 'GET',
    params: {
      current: params.current,
      size: params.size,
      version: params.version,
      status: params.status,
    },
  });
}

/** 新增更新日志（草稿） */
export async function saveChangelog(body: AdsConsole.SysChangelogSaveDTO) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/changelog', {
    method: 'POST',
    data: body,
  });
}

/** 修改更新日志（仅草稿可改） */
export async function updateChangelog(body: AdsConsole.SysChangelogSaveDTO) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/changelog', {
    method: 'PUT',
    data: body,
  });
}

/** 删除更新日志 */
export async function deleteChangelog(id: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/changelog/${id}`, {
    method: 'DELETE',
  });
}

/** 发布更新日志 */
export async function publishChangelog(id: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/changelog/${id}/publish`, {
    method: 'POST',
  });
}

/** 查询指定更新日志阅读情况（管理端） */
export async function getChangelogReadStats(
  id: number,
  params: {
    current?: number;
    size?: number;
    keyword?: string;
    readStatus?: 0 | 1;
  },
) {
  return request<AdsConsole.Result<AdsConsole.SysChangelogReadStats>>(
    `/ads-api/sys/changelog/${id}/read-stats`,
    {
      method: 'GET',
      params,
    },
  );
}

// ===== 前端接口 =====

/** 查询已发布更新日志列表（含当前用户已读标记） */
export async function listPublishedChangelogs() {
  return request<AdsConsole.Result<AdsConsole.SysChangelog[]>>('/ads-api/sys/changelog/published', {
    method: 'GET',
  });
}

/** 标记指定更新日志为已读 */
export async function markChangelogRead(id: number) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/changelog/${id}/read`, {
    method: 'POST',
  });
}

/** 查询当前用户未读更新日志数量 */
export async function getUnreadCount() {
  return request<AdsConsole.Result<number>>('/ads-api/sys/changelog/unread/count', {
    method: 'GET',
  });
}

/** 获取当前用户最新一条未读的已发布更新日志（用于登录后弹窗提示） */
export async function getLatestUnreadChangelog() {
  return request<AdsConsole.Result<AdsConsole.SysChangelog>>('/ads-api/sys/changelog/unread/latest', {
    method: 'GET',
  });
}

/** 上传更新日志媒体（图片/GIF/视频） */
export async function uploadChangelogMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<AdsConsole.Result<string>>('/ads-api/common/files/media', {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
}

