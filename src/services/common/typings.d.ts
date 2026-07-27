declare namespace API {
  // ── 基础响应 ────────────────────────────────────────────────────────────────

  interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
  }

  interface PageResult<T> {
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
    email?: string;
    nickname?: string | null;
    secure_path?: string;
    user_type?: string;
    menus?: string[];
    ad_spend_platform_login?: AdsConsole.LoginData | null;
  }

  interface CurrentUser {
    email?: string;
    nickname?: string | null;
    name?: string;
    avatar?: string;
    access?: 'admin' | 'user';
    is_admin?: boolean;
    user_type?: string;
    menus?: string[];
    loginMode?: 'operation' | 'management' | 'ads';
    hasAdSpendPlatformLogin?: boolean;
  }

  interface UserProfile {
    id: number;
    email: string;
    nickname?: string | null;
    displayName: string;
    isAdmin?: boolean;
    createdAt?: number | string;
    updatedAt?: number | string;
  }

  interface UserProfileUpdateParams {
    email: string;
    nickname?: string | null;
    password?: string;
  }
}
