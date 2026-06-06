// Auth context: keeps track of whether the user is logged in and exposes
// login / logout functions to the whole app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from './api';

interface AuthValue {
  isAuthed: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!getToken());

  const logout = useCallback(() => {
    clearToken();
    setIsAuthed(false);
  }, []);

  // If any API call gets a 401, log out automatically.
  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthed(false));
  }, []);

  const login = useCallback(async (password: string) => {
    const { token } = await api.login(password);
    setToken(token);
    setIsAuthed(true);
  }, []);

  const value = useMemo(() => ({ isAuthed, login, logout }), [isAuthed, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
