const AUTH_TOKEN_KEY = 'adsconsole_token';

export const getAdsAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const setAdsAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAdsAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};
