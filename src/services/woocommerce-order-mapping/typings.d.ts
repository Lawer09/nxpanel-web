declare namespace API {
  interface WooCommerceOrderMappingItem {
    product_id: number;
    plan_id: number;
    plan_name?: string;
    period: string;
  }

  interface WooCommerceOrderMappingFetchData {
    mappings: WooCommerceOrderMappingItem[];
    periods: string[];
  }

  interface WooCommerceOrderMappingSaveParams {
    mappings: Array<{
      product_id: number;
      plan_id: number;
      period: string;
    }>;
  }
}
