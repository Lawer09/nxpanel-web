declare namespace API {
  interface DevAdminApiResponse<T> {
    code: number;
    message: string;
    data: T;
    request_id?: string;
    timestamp?: number;
    error?: {
      type?: string;
      detail?: string;
    } | null;
  }

  interface DevAdminLoginParams {
    username: string;
    password: string;
  }

  interface DevAdminUser {
    id: number;
    username: string;
    nickname?: string;
    permissions?: string[];
    is_super_admin?: boolean;
  }

  interface DevAdminLoginData {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    user?: DevAdminUser;
  }

  interface DevAdminMenu {
    id: number;
    parent_id: number;
    name: string;
    path: string;
    component: string;
    icon?: string;
    sort?: number;
    visible?: boolean;
    permission_code?: string;
    children?: DevAdminMenu[];
  }

  interface DevAdminMenuCreateParams {
    parent_id: number;
    name: string;
    path: string;
    component: string;
    icon?: string;
    sort?: number;
    visible?: boolean;
    permission_code?: string;
  }

  interface DevAdminMenuUpdateParams extends DevAdminMenuCreateParams {
    id: number;
  }

  interface DevAdminPermission {
    code: string;
    name: string;
    group_name?: string;
    resource?: string;
    action?: string;
  }
}
