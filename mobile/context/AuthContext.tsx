import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getSession, saveSession, clearSession } from '../lib/auth';
import { authApi, userApi, type UserInfo } from '../lib/api';
import { resolveAvatarUri } from '../lib/avatar';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, accountType: 'client' | 'pro') => Promise<{ ok: boolean; pending?: boolean; message?: string; accountType?: string }>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo) => void;
  setSession: (sessionToken: string, sessionUser: UserInfo) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncAvatarFromProfile = async (sessionToken: string, sessionUser: UserInfo) => {
    // On ne synchronise l'avatar qu'une seule fois au démarrage, sans bloquer.
    // On utilise setTimeout pour ne pas être dans le chemin critique du rendu initial.
    setTimeout(async () => {
      try {
        const res = await userApi.getProfile(sessionToken);
        if (res.status !== 200 || !res.data) return;

        const avatarKey = String(res.data?.avatar_key ?? '').trim();
        const currentAvatar = String(sessionUser.avatar ?? '').trim();
        const currentRenderable = resolveAvatarUri(currentAvatar);
        const profileRenderable = resolveAvatarUri(avatarKey);

        const shouldReplaceAvatar = Boolean(avatarKey) && Boolean(profileRenderable) && (!currentAvatar || !currentRenderable);

        const premiumActive = Boolean((res.data as any).premium_active);
        const autonomieUnlocked = Boolean((res.data as any).autonomie_unlocked);

        const nextUser: UserInfo = {
          ...sessionUser,
          avatar: shouldReplaceAvatar ? profileRenderable : sessionUser.avatar,
          premium_active: premiumActive,
          autonomie_unlocked: autonomieUnlocked,
        };

        const changed =
          nextUser.avatar !== sessionUser.avatar ||
          Boolean((sessionUser as any).premium_active) !== premiumActive ||
          Boolean((sessionUser as any).autonomie_unlocked) !== autonomieUnlocked;

        if (changed) {
          await saveSession(sessionToken, nextUser);
          setUser(nextUser);
        }
      } catch {
        // ignore: pas bloquant si l'API profil est indisponible
      }
    }, 2000); // délai post-rendu initial
  };

  const setSession = async (sessionToken: string, sessionUser: UserInfo) => {
    await saveSession(sessionToken, sessionUser);
    setToken(sessionToken);
    setUser(sessionUser);
    void syncAvatarFromProfile(sessionToken, sessionUser);
  };

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        await setSession(session.token, session.user);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string, accountType: 'client' | 'pro') => {
    const res = await authApi.login(email, password, accountType);

    if (res.data?.pending) {
      return { ok: false, pending: true, message: res.data.message };
    }

    if (res.status === 200 && res.data?.success && res.data.user) {
      const sessionToken = String(res.data.token ?? '').trim();
      if (!sessionToken) {
        return { ok: false, message: 'Token de session manquant.' };
      }
      await setSession(sessionToken, res.data.user);
      return { ok: true, accountType: res.data.user.account_type };
    }

    return { ok: false, message: res.data?.message ?? 'Identifiants incorrects.' };
  };

  const logout = async () => {
    if (token) await authApi.logout(token);
    await clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
