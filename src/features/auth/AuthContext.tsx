/**
 * AuthContext — estado de autenticação (INTEGRADO ao back-end).
 *
 * - A sessão é mantida em cookie httpOnly definido pelo servidor; o token NUNCA
 *   chega ao JavaScript e NADA de sessão é guardado em localStorage.
 * - Ao carregar a app, o perfil é reidratado via `GET /auth/me`
 *   (`credentials: 'include'`). Enquanto isso, `isInitializing` é true para
 *   evitar piscar a tela de login para quem já está autenticado.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import * as authApi from '@/services/api/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True enquanto a sessão é reidratada via GET /auth/me ao carregar a app. */
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza o perfil (persiste via PATCH /auth/me) e reflete em memória. */
  updateUser: (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Reidrata a sessão a partir do cookie httpOnly ao montar.
  useEffect(() => {
    let active = true;
    authApi
      .getCurrentUser()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active) setUser(null); // sem sessão válida
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setUser(await authApi.login(input));
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    setUser(await authApi.signup(input));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    // Persiste no servidor; falhas não derrubam a UI (otimista).
    void authApi.updateProfile(patch).catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      signup,
      logout,
      updateUser,
    }),
    [user, isInitializing, login, signup, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
