import {request} from '@umijs/max';

// ===== 字典类型 =====

export async function getDictTypePage(params: {
  current?: number;
  size?: number;
  name?: string;
  typeCode?: string;
  status?: number;
}) {
  return request<AdsConsole.Result<AdsConsole.PageResult<AdsConsole.SysDictType>>>('/ads-api/sys/dict/type/page', {
    method: 'GET',
    params,
  });
}

export async function addDictType(body: {
  name?: string;
  typeCode?: string;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/dict/type', {
    method: 'POST',
    data: body,
  });
}

export async function updateDictType(body: {
  id: string;
  name?: string;
  typeCode?: string;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/dict/type', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteDictType(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/dict/type/${id}`, {
    method: 'DELETE',
  });
}

// ===== 字典数据 =====

/** 根据字典类型码获取字典数据（下拉用） */
export async function getDictDataByCode(typeCode: string) {
  return request<AdsConsole.Result<AdsConsole.SysDictData[]>>(`/ads-api/sys/dict/data/${typeCode}`, {
    method: 'GET',
  });
}

export async function addDictData(body: {
  dictTypeId?: string;
  typeCode?: string;
  label?: string;
  value?: string;
  listClass?: string;
  sort?: number;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/dict/data', {
    method: 'POST',
    data: body,
  });
}

export async function updateDictData(body: {
  id: string;
  label?: string;
  value?: string;
  listClass?: string;
  sort?: number;
  status?: number;
  remark?: string;
}) {
  return request<AdsConsole.Result<null>>('/ads-api/sys/dict/data', {
    method: 'PUT',
    data: body,
  });
}

export async function deleteDictData(id: string) {
  return request<AdsConsole.Result<null>>(`/ads-api/sys/dict/data/${id}`, {
    method: 'DELETE',
  });
}

