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
import { useQueryClient } from '@tanstack/react-query';
import type { LoginInput, SignupInput } from '@/lib/validation';
import type { User } from '@/types';
import { PRIVATE_QUERY_PREFIXES } from '@/lib/queryKeys';
import * as authApi from '@/services/api/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** True enquanto a sessão é reidratada via GET /auth/me ao carregar a app. */
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza o perfil (PATCH /auth/me) e só reflete em memória após confirmar. */
  updateUser: (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  /** Remove do cache todas as queries de dados PRIVADOS (evita vazar entre contas). */
  const clearPrivateCache = useCallback(() => {
    for (const prefix of PRIVATE_QUERY_PREFIXES) {
      qc.removeQueries({ queryKey: prefix });
    }
  }, [qc]);

  // Reidrata a sessão a partir do cookie httpOnly ao montar. Não sobrescreve um
  // usuário já definido por um login/cadastro concorrente (evita corrida).
  useEffect(() => {
    let active = true;
    authApi
      .getCurrentUser()
      .then((u) => {
        if (active) setUser((prev) => prev ?? u);
      })
      .catch(() => {
        // Sem sessão válida: mantém o estado atual (inicialmente null). Não força
        // null para não deslogar um usuário que acabou de entrar durante o init.
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      // Limpa cache privado antes de assumir a nova sessão (evita vazamento).
      clearPrivateCache();
      setUser(await authApi.login(input));
    },
    [clearPrivateCache],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      clearPrivateCache();
      setUser(await authApi.signup(input));
    },
    [clearPrivateCache],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Remove dados privados do cache para não vazar à próxima conta.
    clearPrivateCache();
  }, [clearPrivateCache]);

  /**
   * Atualiza o perfil via PATCH /auth/me. Só reflete em memória APÓS a resposta
   * confirmada — em caso de erro, propaga para o chamador (a UI mantém o form).
   */
  const updateUser = useCallback(
    async (patch: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> => {
      const updated = await authApi.updateProfile(patch);
      setUser(updated);
      return updated;
    },
    [],
  );

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
