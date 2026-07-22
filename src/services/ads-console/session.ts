import {
  adsLoginDataToCurrentUser,
  getAdsConsolePermissionRoutes,
} from './auth';
import { setAdsLoginData } from './authStorage';

export const buildAdsCurrentUserFromLoginData = async (
  loginData: AdsConsole.LoginData,
): Promise<AdsConsole.CurrentUser> => {
  setAdsLoginData(loginData);

  let adsMenus: AdsConsole.RouteMenuItem[] | undefined;
  try {
    const routesRes = await getAdsConsolePermissionRoutes();
    if (routesRes?.success && Array.isArray(routesRes.data)) {
      adsMenus = routesRes.data;
    }
  } catch (_error) {
    adsMenus = undefined;
  }

  return adsLoginDataToCurrentUser(loginData, adsMenus);
};
