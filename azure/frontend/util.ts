import Cookies from 'js-cookie';
import { getMyInfo } from './api';

const tokenName = '_token';

export const saveTokenToCookie = (token: string) => {
  Cookies.set(tokenName, token);
};

export const deleteTokenFromCookie = () => {
  Cookies.remove(tokenName);
};

export const getTokenFromCookie = (): string | undefined => {
  return Cookies.get(tokenName);
};
export const jwtToCookie = async (token: string) => {
  Cookies.set('user_thumbnail', ''); //the user_thumbnail sometines return 431
  Cookies.set(tokenName, token);
  const data = await getMyInfo();
  Cookies.set('user', JSON.stringify(data.user));
};

export const clearCookie = () => {
  Cookies.remove('user_thumbnail');
  Cookies.remove(tokenName);
  Cookies.remove('user');
};
