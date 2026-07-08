export const hasAdsConsolePermission = (
  currentUser: AdsConsole.CurrentUser | undefined,
  code: string,
) => {
  const permissions = currentUser?.permissions || [];
  const roles = currentUser?.roles || [];
  return (
    currentUser?.isSuperAdmin ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('ACCOUNT_MANAGER') ||
    permissions.includes(code)
  );
};
