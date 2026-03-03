import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getSession, saveSession, clearSession } from '../lib/auth';
import { authApi, type UserInfo } from '../lib/api';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; pending?: boolean; message?: string }>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        setToken(session.token);
        setUser(session.user);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);

    if (res.data?.pending) {
      return { ok: false, pending: true, message: res.data.message };
    }

    if (res.status === 200 && res.data?.success && res.data.user) {
      const sessionToken = `mock_${Date.now()}`;
      await saveSession(sessionToken, res.data.user);
      setToken(sessionToken);
      setUser(res.data.user);
      return { ok: true };
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
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
