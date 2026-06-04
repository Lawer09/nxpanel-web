declare namespace API {
  type ExternalOrderReceiptStatus = 'pending' | 'processed' | 'failed' | string;

  interface ExternalOrderReceiptUserLite {
    id: number;
    email?: string | null;
    telegram_id?: string | number | null;
  }

  interface ExternalOrderReceiptLocalOrderLite {
    id: number;
    trade_no: string;
    status: number;
    total_amount: number;
    paid_at?: number | null;
  }

  interface ExternalOrderReceiptItem {
    id: number;
    provider: string;
    external_order_id: string;
    status: ExternalOrderReceiptStatus;
    user_id?: number | null;
    local_order_id?: number | null;
    product_id?: number | null;
    plan_id?: number | null;
    period?: string | null;
    transaction_id?: string | null;
    payload?: Record<string, any> | null;
    error_message?: string | null;
    created_at: number;
    updated_at: number;
    user?: ExternalOrderReceiptUserLite | null;
    local_order?: ExternalOrderReceiptLocalOrderLite | null;
  }

  interface ExternalOrderReceiptFetchParams {
    provider?: string;
    status?: ExternalOrderReceiptStatus;
    externalOrderId?: string;
    userId?: number;
    localOrderId?: number;
    transactionId?: string;
    page?: number;
    pageSize?: number;
  }
}
