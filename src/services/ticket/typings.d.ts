declare namespace API {
  // ── 工单 ─────────────────────────────────────────────────────────────────────

  interface TicketUser {
    id: number;
    email: string;
    [key: string]: any;
  }

  interface TicketMessage {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_from_user: boolean;
    is_from_admin: boolean;
    created_at: number;
    updated_at: number;
  }

  interface TicketItem {
    id: number;
    user_id: number;
    subject: string;
    level: string; // '0'=低, '1'=中, '2'=高
    status: number; // 0=开启, 1=关闭
    reply_status: number | null; // 0=已回复, 1=待回复
    last_reply_user_id: number | null;
    created_at: number;
    updated_at: number;
    user?: TicketUser;
  }

  interface TicketDetail extends TicketItem {
    messages?: TicketMessage[];
  }

  interface TicketFetchParams {
    status?: number;
    reply_status?: number[];
    email?: string;
    filter?: Array<{ id: string; value: any }>;
    sort?: Array<{ id: string; desc: boolean }>;
    pageSize?: number;
    page?: number;
  }

  interface TicketFetchResult {
    data: TicketItem[];
    page: number;
    pageSize: number;
    total: number;
  }

  interface TicketReplyParams {
    id: number;
    message: string;
  }

  interface TicketCloseParams {
    id: number;
  }
}
