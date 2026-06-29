import routes from '../../../config/routes';

type RouteLike = {
  path?: string;
  name?: string;
  component?: string;
  hideInMenu?: boolean;
  routes?: RouteLike[];
};

export type UserMenuOption = {
  label: string;
  value: string;
};

const MANAGEMENT_PREFIXES = ['/nodes', '/dev', '/iam', '/asset'];
const EXCLUDED_PREFIXES = ['/user'];

const formatRouteName = (name?: string) => {
  if (!name) return '';
  return name
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' / ');
};

const isSelectableRoute = (route: RouteLike) => {
  if (!route.path || !route.component || route.hideInMenu) {
    return false;
  }
  if (MANAGEMENT_PREFIXES.some((prefix) => route.path?.startsWith(prefix))) {
    return false;
  }
  if (EXCLUDED_PREFIXES.some((prefix) => route.path?.startsWith(prefix))) {
    return false;
  }
  return true;
};

const collectMenuOptions = (
  items: RouteLike[],
  parentNames: string[] = [],
): UserMenuOption[] => {
  const options: UserMenuOption[] = [];

  items.forEach((item) => {
    const nextNames = item.name
      ? [...parentNames, formatRouteName(item.name)]
      : parentNames;

    if (isSelectableRoute(item)) {
      const nameLabel = nextNames.filter(Boolean).join(' / ');
      options.push({
        value: item.path!,
        label: nameLabel ? `${nameLabel} (${item.path})` : item.path!,
      });
    }

    if (item.routes?.length) {
      options.push(...collectMenuOptions(item.routes, nextNames));
    }
  });

  return options;
};

export const userMenuOptions = collectMenuOptions(routes as RouteLike[]).sort((a, b) =>
  a.value.localeCompare(b.value),
);
