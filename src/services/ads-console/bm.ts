import { request } from '@umijs/max';

export async function getBmPage(params: {
  current?: number;
  size?: number;
  bmId?: string;
  name?: string;
  remark?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.FbBm>>>(
    '/ads-api/fb/bm/page',
    {
      method: 'GET',
      params,
    },
  );
}

export async function updateBmRemark(body: { id: string; remark?: string }) {
  return request<AdsConsole.Result<null>>('/ads-api/fb/bm/remark', {
    method: 'PUT',
    data: body,
  });
}
