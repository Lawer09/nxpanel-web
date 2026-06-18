export const trimOptional = (value?: string) => {
  const text = value?.trim();
  return text || undefined;
};

export const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];

export const toRoleOptions = (roles: API.IamRole[]) =>
  roles.map((role) => ({
    label: `${role.name}${role.code ? ` (${role.code})` : ''}`,
    value: role.id,
  }));

export const toPermissionOptions = (permissions: API.IamPermission[]) =>
  permissions.map((item) => ({
    label: `${item.code}${item.name ? ` - ${item.name}` : ''}`,
    value: item.code,
  }));

export const pageParams = (params: { current?: number; pageSize?: number }) => ({
  page: params.current || 1,
  page_size: params.pageSize || 20,
});
