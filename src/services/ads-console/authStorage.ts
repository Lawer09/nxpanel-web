const AUTH_TOKEN_KEY = 'adsconsole_token';
const AUTH_LOGIN_DATA_KEY = 'adsconsole_login_data';

export const getAdsAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAdsAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAdsAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAdsLoginData = (): AdsConsole.LoginData | undefined => {
  if (typeof window === 'undefined') return undefined;
  const loginDataStr = localStorage.getItem(AUTH_LOGIN_DATA_KEY);
  if (!loginDataStr) return undefined;

  try {
    const loginData = JSON.parse(loginDataStr) as AdsConsole.LoginData;
    return loginData?.token ? loginData : undefined;
  } catch (_error) {
    localStorage.removeItem(AUTH_LOGIN_DATA_KEY);
    return undefined;
  }
};

export const setAdsLoginData = (loginData: AdsConsole.LoginData) => {
  if (typeof window === 'undefined') return;
  if (!loginData?.token) return;
  localStorage.setItem(AUTH_LOGIN_DATA_KEY, JSON.stringify(loginData));
  setAdsAuthToken(loginData.token);
};

export const clearAdsLoginData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_LOGIN_DATA_KEY);
  clearAdsAuthToken();
};
