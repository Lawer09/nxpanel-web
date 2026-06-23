import routes from '../../config/routes';

type RouteLike = {
  path?: string;
  component?: string;
  routes?: RouteLike[];
};

export const NO_MENU_PATH = '/user/no-menu';

const flattenPageRoutePaths = (items: RouteLike[]): Set<string> => {
  const paths = new Set<string>();

  const visit = (routeItems: RouteLike[]) => {
    routeItems.forEach((item) => {
      if (item.path && item.component) {
        paths.add(item.path);
      }
      if (item.routes?.length) {
        visit(item.routes);
      }
    });
  };

  visit(items);
  return paths;
};

const pageRoutePaths = flattenPageRoutePaths(routes as RouteLike[]);

export const isDefinedMenuUser = (user?: API.CurrentUser) =>
  user?.loginMode === 'operation' && user.user_type === 'define';

export const getDefinedMenuPaths = (user?: API.CurrentUser) =>
  new Set((user?.menus ?? []).filter((path): path is string => !!path));

export const getFirstAllowedDefinedMenuPath = (user?: API.CurrentUser) => {
  const menus = user?.menus ?? [];
  return menus.find((path) => pageRoutePaths.has(path));
};

export const isAllowedDefinedMenuPath = (
  pathname: string,
  user?: API.CurrentUser,
) => {
  if (!isDefinedMenuUser(user)) {
    return true;
  }
  if (pathname === NO_MENU_PATH) {
    return true;
  }
  return getDefinedMenuPaths(user).has(pathname) && pageRoutePaths.has(pathname);
};
