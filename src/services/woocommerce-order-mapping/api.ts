import { request } from '@umijs/max';

export async function fetchWooCommerceOrderMapping() {
  return request<API.ApiResponse<API.WooCommerceOrderMappingFetchData>>(
    '/v3/woocommerce-order-mapping/fetch',
    {
      method: 'GET',
    },
  );
}

export async function saveWooCommerceOrderMapping(
  body: API.WooCommerceOrderMappingSaveParams,
) {
  return request<API.ApiResponse<boolean>>('/v3/woocommerce-order-mapping/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  });
}
