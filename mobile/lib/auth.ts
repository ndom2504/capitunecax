import * as SecureStore from 'expo-secure-store';
import { authApi, type UserInfo } from './api';

const SESSION_KEY = 'capitune_session';
const USER_KEY = 'capitune_user';

export async function saveSession(token: string, user: UserInfo): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getSession(): Promise<{ token: string; user: UserInfo } | null> {
  try {
    const token = await SecureStore.getItemAsync(SESSION_KEY);
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!token || !userJson) return null;
    const user = JSON.parse(userJson) as UserInfo;
    return { token, user };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

/** Vérifie que le token est toujours valide côté serveur */
export async function validateSession(): Promise<UserInfo | null> {
  const session = await getSession();
  if (!session) return null;

  const res = await authApi.me(session.token);
  if (res.status === 200 && res.data) {
    return res.data;
  }
  await clearSession();
  return null;
}
