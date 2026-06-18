declare namespace API {
  interface IamPageResult<T> {
    items: T[];
    page?: number;
    page_size?: number;
    total?: number;
  }

  interface IamUser {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    phone?: string;
    status?: string;
    is_super_admin?: boolean;
    role_ids?: number[];
  }

  interface IamUserCreateParams {
    username: string;
    password: string;
    nickname?: string;
    email?: string;
    phone?: string;
    is_super_admin?: boolean;
  }

  interface IamUserUpdateParams {
    id: number;
    nickname?: string;
    email?: string;
    phone?: string;
    status: string;
    is_super_admin?: boolean;
  }

  interface IamUserAssignRolesParams {
    user_id: number;
    role_ids: number[];
  }

  interface IamRole {
    id: number;
    name: string;
    code: string;
    status?: string;
    sort?: number;
    description?: string;
  }

  interface IamRoleCreateParams {
    name: string;
    code: string;
    description?: string;
    sort?: number;
  }

  interface IamRoleUpdateParams {
    id: number;
    name: string;
    description?: string;
    status: string;
    sort?: number;
  }

  interface IamRoleAssignPermissionsParams {
    role_id: number;
    permission_codes: string[];
  }

  interface IamPermission {
    code: string;
    name: string;
    group_name?: string;
    resource?: string;
    action?: string;
  }

  interface IamMenu {
    id: number;
    parent_id: number;
    name: string;
    path: string;
    component: string;
    icon?: string;
    sort?: number;
    visible?: boolean;
    permission_code?: string;
    children?: IamMenu[];
  }

  interface IamMenuCreateParams {
    parent_id: number;
    name: string;
    path: string;
    component: string;
    icon?: string;
    sort?: number;
    visible?: boolean;
    permission_code?: string;
  }

  interface IamMenuUpdateParams extends IamMenuCreateParams {
    id: number;
  }

  interface IamClient {
    id: number;
    client_id: string;
    name: string;
    description?: string;
    status?: string;
    role_ids?: number[];
    last_used_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }

  interface IamClientCreateParams {
    client_id: string;
    name: string;
    description?: string;
    status?: string;
    role_ids?: number[];
  }

  interface IamClientUpdateParams {
    id: number;
    name: string;
    description?: string;
    status: string;
  }

  interface IamClientSecretResult {
    id?: number;
    client_id: string;
    client_secret: string;
  }

  interface IamClientAssignRolesParams {
    client_id: string;
    role_ids: number[];
  }

  interface IamAuditLog {
    id: number;
    operator_id?: number;
    action?: string;
    path?: string;
    result?: string;
    request_id?: string;
    created_at?: string;
  }
}
