declare namespace API {
  // ── 基础响应 ────────────────────────────────────────────────────────────────

  interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
  }

  interface PageData<T> {
    page: number;
    pageSize: number;
    total: number;
    data: T[];
  }

  // ── 认证 ────────────────────────────────────────────────────────────────────

  interface AuthResponse {
    token: string;
    auth_data: string; // "Bearer xxxxxxx"
    is_admin: boolean;
    secure_path?: string;
  }

  interface CurrentUser {
    email?: string;
    name?: string;
    avatar?: string;
    access?: 'admin' | 'user';
    is_admin?: boolean;
  }
}
