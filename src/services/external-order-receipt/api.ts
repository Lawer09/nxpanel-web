import { request } from '@umijs/max';

export async function fetchExternalOrderReceipts(
  params: API.ExternalOrderReceiptFetchParams,
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse<API.PageResult<API.ExternalOrderReceiptItem>>>(
    '/v3/external-order-receipt/fetch',
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}
