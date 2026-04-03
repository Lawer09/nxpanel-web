declare namespace API {

  type AuditLogItem = {
    id: number;
    admin_id: number;
    action: string;
    uri: string;
    request_data: string;
    ip: string;
    created_at: number;
    admin: {
      id: number;
      email: string;
    };
  };
}
